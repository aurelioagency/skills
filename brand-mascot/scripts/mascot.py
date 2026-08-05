# -*- coding: utf-8 -*-
"""
mascot.py - color consistency for a brand mascot.

Works with any character. It does not know in advance what color the character
is: it measures the materials on the master image and applies that measurement
to the new poses.

Two uses:

    python mascot.py master.png --describe
        Measures the master and lists its materials in hex. Use it to write the
        character sheet and to put exact colors into prompts.

    python mascot.py master.png pose.png -o fixed.png
        Cuts the background to alpha and corrects the pose's color so it matches
        the master. Accepts a folder instead of a file.

    python mascot.py master.png pose.png --protect-mask prop.png -o fixed.png
        Excludes white/opaque mask pixels from correction and preserves their
        input RGB exactly. Use for one-off props, clothing and accessories.

Output is always a PNG with a real alpha channel.

Useful options:
    --check          report without writing
    --strength 0.7   partial correction (0..1)
    --no-alpha       image is already cut out
    --no-color       cut out only
    --tol 9          background cutout tolerance (raise if background remains)
    --k 8            how many materials to look for at most
    --protect-mask   same-size mask; white/opaque pixels are protected

Requires: numpy, Pillow.
"""

import argparse
import sys
from pathlib import Path

import numpy as np
from PIL import Image

EXTS = {".png", ".jpg", ".jpeg", ".webp"}

# Lightness weighs less than chroma when grouping materials. One material spans
# a wide lightness range because of shadow and light; what identifies it is its
# hue, not how lit it is.
W_L = 0.35

MERGE_TOL = 9.0     # two materials closer than this are the same one
HUE_TOL = 10.0      # ...or if they share hue, even at different light and chroma
MIN_CHROMA = 12.0   # below this hue is noise: grays, whites, blacks
MIN_SHARE = 0.004   # drop materials under 0.4% of the subject
OUTLIER_TOL = 26.0  # hard ceiling for the "belongs to this material" distance
OUTLIER_K = 3.0     # ...normally that distance is 3x the material's own spread
OUTLIER_MIN = 8.0   # ...with a floor, so very flat materials still keep their rim

SHIFT_K = 2.0       # a pixel may move at most 2x what its material drifted
MIN_SHIFT = 4.0     # ...never less than this, to allow tightening the spread


# --------------------------------------------------------------------------
# color
# --------------------------------------------------------------------------

def srgb_to_lab(a):
    """a: (...,3) float 0..1 sRGB  ->  (...,3) CIELAB D65."""
    lin = np.where(a <= 0.04045, a / 12.92, ((a + 0.055) / 1.055) ** 2.4)
    R, G, B = lin[..., 0], lin[..., 1], lin[..., 2]
    X = (0.4124564 * R + 0.3575761 * G + 0.1804375 * B) / 0.95047
    Y = (0.2126729 * R + 0.7151522 * G + 0.0721750 * B)
    Z = (0.0193339 * R + 0.1191920 * G + 0.9503041 * B) / 1.08883
    f = lambda t: np.where(t > 0.008856, np.cbrt(np.maximum(t, 0)), 7.787 * t + 16 / 116)
    fx, fy, fz = f(X), f(Y), f(Z)
    return np.stack([116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)], -1)


def lab_to_srgb(lab):
    """Inverse of srgb_to_lab, clamped to gamut."""
    L, A, B = lab[..., 0], lab[..., 1], lab[..., 2]
    fy = (L + 16) / 116
    fx = fy + A / 500
    fz = fy - B / 200
    g = lambda t: np.where(t ** 3 > 0.008856, t ** 3, (t - 16 / 116) / 7.787)
    X, Y, Z = g(fx) * 0.95047, g(fy), g(fz) * 1.08883
    R = 3.2404542 * X - 1.5371385 * Y - 0.4985314 * Z
    G = -0.9692660 * X + 1.8760108 * Y + 0.0415560 * Z
    Bb = 0.0556434 * X - 0.2040259 * Y + 1.0572252 * Z
    lin = np.clip(np.stack([R, G, Bb], -1), 0, 1)
    return np.where(lin <= 0.0031308, lin * 12.92, 1.055 * lin ** (1 / 2.4) - 0.055)


def hex_of(lab_row):
    rgb = lab_to_srgb(np.asarray(lab_row, float))
    return "#%02X%02X%02X" % tuple(int(round(float(v) * 255)) for v in rgb)


# --------------------------------------------------------------------------
# morphology (no scipy)
# --------------------------------------------------------------------------

def dilate(mask, k=1):
    cur = mask.copy()
    for _ in range(k):
        n = cur.copy()
        n[1:] |= cur[:-1]; n[:-1] |= cur[1:]
        n[:, 1:] |= cur[:, :-1]; n[:, :-1] |= cur[:, 1:]
        cur = n
    return cur


def erode(mask, k=1):
    return ~dilate(~mask, k)


def box_sum(a, r):
    """Sum over a (2r+1)^2 window via integral image."""
    a = a.astype(np.float64)
    pad = [(r, r), (r, r)] + [(0, 0)] * (a.ndim - 2)
    p = np.pad(a, pad)
    ii = np.zeros((p.shape[0] + 1, p.shape[1] + 1) + p.shape[2:], np.float64)
    ii[1:, 1:] = p.cumsum(0).cumsum(1)
    k = 2 * r + 1
    return ii[k:, k:] - ii[:-k, k:] - ii[k:, :-k] + ii[:-k, :-k]


# --------------------------------------------------------------------------
# background cutout -> alpha
# --------------------------------------------------------------------------

def background_mask(lab, tol=6.0, max_iter=3000):
    """
    Adaptive flood fill from the image borders.

    A pixel becomes background if its Lab distance to a neighbor that is ALREADY
    background is under `tol`. Comparing against the neighbor rather than the
    seed lets it walk soft gradients without leaking through the character's
    outline.
    """
    H, W = lab.shape[:2]
    dU = np.full((H, W), 1e9); dU[1:] = np.linalg.norm(lab[1:] - lab[:-1], axis=-1)
    dD = np.full((H, W), 1e9); dD[:-1] = np.linalg.norm(lab[:-1] - lab[1:], axis=-1)
    dL = np.full((H, W), 1e9); dL[:, 1:] = np.linalg.norm(lab[:, 1:] - lab[:, :-1], axis=-1)
    dR = np.full((H, W), 1e9); dR[:, :-1] = np.linalg.norm(lab[:, :-1] - lab[:, 1:], axis=-1)
    pU, pD, pL, pR = dU < tol, dD < tol, dL < tol, dR < tol

    bg = np.zeros((H, W), bool)
    bg[0] = bg[-1] = True
    bg[:, 0] = bg[:, -1] = True
    for i in range(max_iter):
        n = bg.copy()
        n[1:] |= bg[:-1] & pU[1:]
        n[:-1] |= bg[1:] & pD[:-1]
        n[:, 1:] |= bg[:, :-1] & pL[:, 1:]
        n[:, :-1] |= bg[:, 1:] & pR[:, :-1]
        if i % 8 == 0 and n.sum() == bg.sum():
            break
        bg = n
    return bg


def soft_matte(rgb, subject, band=2):
    """
    Soft alpha + edge color decontamination.

    Estimates background color B and figure color F around every edge pixel,
    derives alpha by projecting onto the B->F segment, and solves
    F = (I - (1-a)B) / a. Without this the cutout keeps a halo of the old
    background.
    """
    alpha = subject.astype(np.float64)
    edge = dilate(subject, band) & ~erode(subject, band)
    if not edge.any():
        return rgb, alpha

    r = 3
    fg_m = subject & ~edge
    bg_m = (~subject) & ~edge
    wf = box_sum(fg_m.astype(np.float64), r)
    wb = box_sum(bg_m.astype(np.float64), r)
    F = box_sum(rgb * fg_m[..., None], r) / np.maximum(wf, 1e-6)[..., None]
    B = box_sum(rgb * bg_m[..., None], r) / np.maximum(wb, 1e-6)[..., None]

    ok = edge & (wf > 2) & (wb > 2)
    d = F - B
    den = (d * d).sum(-1)
    a = np.where(den > 1e-8, ((rgb - B) * d).sum(-1) / np.maximum(den, 1e-8), alpha)
    alpha = np.where(ok, np.clip(a, 0.0, 1.0), alpha)

    solve = ok & (alpha > 0.15)
    aa = alpha[..., None]
    F_est = (rgb - (1 - aa) * B) / np.maximum(aa, 1e-3)
    return np.where(solve[..., None], np.clip(F_est, 0, 1), rgb), alpha


def clean_edge(rgb, alpha, band=2):
    """
    Removes the halo left behind when a chroma key is keyed out.

    A hard key leaves a rim of pixels still carrying the background color:
    purple, green, whatever the key was. It is most visible once the cutout is
    placed on a dark background.

    Instead of guessing which color the key was, this rebuilds the rim from the
    character itself: every pixel in the edge band takes the color of the nearest
    interior pixel, propagating inward-out. Alpha is left untouched, so the
    silhouette and its soft edge stay exactly as they were - only the color
    underneath changes. On flat cartoon art this is what the rim should have been
    anyway, because the outermost real color is the outline.
    """
    opaque = alpha > 0.9
    interior = erode(opaque, band)
    if interior.sum() < 100:
        return rgb

    filled = rgb.copy()
    known = interior.copy()
    target = (alpha > 0.004) & ~interior
    for _ in range(band + 2):
        if not (target & ~known).any():
            break
        w = box_sum(known.astype(np.float64), 1)
        s = box_sum(filled * known[..., None], 1)
        newly = target & ~known & (w > 0)
        if not newly.any():
            break
        avg = s / np.maximum(w, 1e-6)[..., None]
        filled[newly] = avg[newly]
        known |= newly
    return filled


def cut_out(rgb, tol=6.0):
    lab = srgb_to_lab(rgb)
    bg = background_mask(lab, tol=tol)

    # whatever cannot be reached from the image border is figure, not a hole
    seed = np.zeros_like(bg)
    seed[0] = seed[-1] = True
    seed[:, 0] = seed[:, -1] = True
    reach = seed & bg
    for i in range(3000):
        n = reach.copy()
        n[1:] |= reach[:-1]; n[:-1] |= reach[1:]
        n[:, 1:] |= reach[:, :-1]; n[:, :-1] |= reach[:, 1:]
        n &= bg
        if i % 8 == 0 and n.sum() == reach.sum():
            break
        reach = n

    subject = dilate(erode(~reach, 2), 2)   # speckle cleanup
    out, alpha = soft_matte(rgb, subject, band=2)
    return out, alpha, float(subject.mean())


# --------------------------------------------------------------------------
# materials: discovered, not assumed
# --------------------------------------------------------------------------

def _w(lab):
    """Lab with L damped, so grouping follows material and not shading."""
    out = lab.copy()
    out[..., 0] *= W_L
    return out


def kmeans(X, k, iters=40, seed=0):
    rng = np.random.default_rng(seed)
    # k-means++ so the result does not depend on lucky initialization
    C = [X[rng.integers(len(X))]]
    for _ in range(k - 1):
        d = np.min(((X[:, None, :] - np.array(C)[None, :, :]) ** 2).sum(-1), axis=1)
        tot = d.sum()
        if tot <= 0:
            C.append(X[rng.integers(len(X))]); continue
        C.append(X[rng.choice(len(X), p=d / tot)])
    C = np.array(C, float)

    for _ in range(iters):
        lab_i = np.argmin(((X[:, None, :] - C[None, :, :]) ** 2).sum(-1), axis=1)
        newC = C.copy()
        for j in range(k):
            m = lab_i == j
            if m.any():
                newC[j] = X[m].mean(0)
        if np.allclose(newC, C, atol=1e-3):
            C = newC; break
        C = newC
    return C


def fit_materials(lab, subject, k=8, seed=0):
    """
    Discovers the character's materials on its own image.

    Returns a list of dicts with the centroid in real Lab, the median and spread
    per channel, and the share of the subject it covers.
    """
    core = erode(subject, 2)            # drop the antialiased rim
    if core.sum() < 500:
        core = subject
    pts = lab[core]
    if len(pts) > 120000:               # subsampling is more than enough
        idx = np.random.default_rng(seed).choice(len(pts), 120000, replace=False)
        fitpts = pts[idx]
    else:
        fitpts = pts

    C = kmeans(_w(fitpts), min(k, max(2, len(fitpts) // 50)), seed=seed)

    # merge centroids that are the same material
    merged = True
    while merged and len(C) > 1:
        merged = False
        D = np.linalg.norm(C[:, None, :] - C[None, :, :], axis=-1)
        np.fill_diagonal(D, 1e9)
        i, j = np.unravel_index(np.argmin(D), D.shape)
        if D[i, j] < MERGE_TOL:
            C = np.vstack([np.delete(C, [i, j], 0), (C[i] + C[j]) / 2])
            merged = True

    # second pass, by hue.
    # A shaded material splits in two: the dark part loses lightness AND chroma,
    # so distance alone will not rejoin them. Hue angle does: the shadow of a red
    # is still red. Only applies to materials with enough chroma, because on a
    # gray or a black the hue is noise.
    merged = True
    while merged and len(C) > 1:
        merged = False
        chroma = np.hypot(C[:, 1], C[:, 2])
        hue = np.degrees(np.arctan2(C[:, 2], C[:, 1]))
        for i in range(len(C)):
            for j in range(i + 1, len(C)):
                if chroma[i] < MIN_CHROMA or chroma[j] < MIN_CHROMA:
                    continue
                dh = abs((hue[i] - hue[j] + 180) % 360 - 180)
                if dh < HUE_TOL:
                    w_i, w_j = chroma[i], chroma[j]
                    C = np.vstack([np.delete(C, [i, j], 0),
                                   (C[i] * w_i + C[j] * w_j) / (w_i + w_j)])
                    merged = True
                    break
            if merged:
                break

    # assign the whole core and measure each material in real Lab
    assign = np.argmin(((_w(pts)[:, None, :] - C[None, :, :]) ** 2).sum(-1), axis=1)
    mats = []
    for j in range(len(C)):
        sel = pts[assign == j]
        share = len(sel) / max(len(pts), 1)
        if share < MIN_SHARE:
            continue
        m = {"share": share, "n": int(len(sel)), "centroid_w": C[j]}
        for ci, ch in enumerate("Lab"):
            p16, p50, p84 = np.percentile(sel[:, ci], [16, 50, 84])
            m[ch] = {"median": float(p50), "spread": max(float((p84 - p16) / 2), 1e-4)}
        m["lab"] = np.array([m["L"]["median"], m["a"]["median"], m["b"]["median"]])
        mats.append(m)

    mats.sort(key=lambda x: -x["share"])

    # drop degenerate materials.
    # A small cluster that also spans the whole lightness range is not a
    # material: it is a sieve collecting transition pixels, and it will later
    # swallow things that do not belong to it, such as a prop. Measured against
    # the typical spread of the large materials of this same character, not
    # against a fixed number.
    big = [m["L"]["spread"] for m in mats if m["share"] > 0.05]
    if big:
        limit = 2.5 * float(np.median(big))
        mats = [m for m in mats
                if m["share"] > 0.02 or m["L"]["spread"] <= limit]

    for i, m in enumerate(mats):
        m["name"] = "M%d" % (i + 1)
    return mats


def self_check(lab, subject, mats):
    """
    Measures whether this decomposition works for THIS character.

    There is no list of difficult characters: whatever shows up gets evaluated.
    What matters is whether two materials can be told apart, because that is
    what makes a pixel land in the same material pose after pose. If two tones
    overlap, the correction treats them as one: they still get corrected and the
    difference between them is preserved, but they stop being targeted
    individually.

    Separation is measured relative to each material's own spread, not against a
    fixed number, so it holds equally for a tight pastel palette and for six
    saturated colors.
    """
    C = np.stack([m["centroid_w"] for m in mats])

    def scale_of(m):
        return float(np.linalg.norm([W_L * m["L"]["spread"],
                                     m["a"]["spread"], m["b"]["spread"]]))

    def spread_of(P):
        p16, p50, p84 = np.percentile(P, [16, 50, 84], axis=0)
        return float(np.linalg.norm(np.maximum((p84 - p16) / 2, 1e-4))), p50

    # per-pixel assignment, so we can look inside each material
    flatw = _w(lab)[subject]
    flatr = lab[subject]
    asg = np.argmin(((flatw[:, None, :] - C[None, :, :]) ** 2).sum(-1), axis=1)

    out = []
    for i, m in enumerate(mats):
        # nearest neighbor, if there is anything to compare against
        if len(C) > 1:
            d = np.linalg.norm(C - C[i], axis=-1)
            d[i] = np.inf
            j = int(np.argmin(d))
            sep = float(d[j]) / max(scale_of(m) + scale_of(mats[j]), 1e-6)
            neighbor = mats[j]["name"]
        else:
            sep, neighbor = float("inf"), "-"

        # is this one tone, or two that ended up together?
        # Split it in two and measure whether the halves sit far apart compared
        # to how much each of them spreads.
        lobes = None
        P = flatw[asg == i]
        Pr = flatr[asg == i]
        if len(P) > 2000:
            idx = np.random.default_rng(0).choice(len(P), min(len(P), 40000), replace=False)
            c2 = kmeans(P[idx], 2, iters=25)
            sub = np.argmin(((P[:, None, :] - c2[None, :, :]) ** 2).sum(-1), axis=1)
            if min((sub == 0).sum(), (sub == 1).sum()) > 0.12 * len(P):
                s0, _ = spread_of(P[sub == 0])
                s1, _ = spread_of(P[sub == 1])
                ratio = float(np.linalg.norm(c2[0] - c2[1])) / max(s0 + s1, 1e-6)
                if ratio > 1.2:
                    lobes = [(hex_of(np.median(Pr[sub == b], axis=0)),
                              float((sub == b).mean())) for b in (0, 1)]

        out.append({"neighbor": neighbor, "sep": sep, "lobes": lobes})

    dd = np.linalg.norm(flatw[:, None, :] - C[None, :, :], axis=-1)
    dd.sort(axis=1)
    d1 = dd[:, 0]
    d2 = dd[:, 1] if dd.shape[1] > 1 else np.full_like(d1, np.inf)
    # a pixel is ambiguous when it sits nearly as close to two materials:
    # in another pose it could land in the other one
    ambiguous = float(np.mean((d2 - d1) < 0.25 * np.maximum(d1, 1e-6)))
    unassigned = float(np.mean(d1 > OUTLIER_TOL))
    return out, ambiguous, unassigned


def assign_materials(lab, subject, mats):
    """
    Classifies a pose's pixels against the master's materials.

    Anything far from every known material is left alone: it is usually a prop,
    clothing or an accessory the master did not have, and repainting it would be
    worse than leaving it.
    """
    Cw = np.stack([m["centroid_w"] for m in mats])
    # How far a pixel may sit from a material and still belong to it depends on
    # how tight that material is. A fixed threshold swallows props: a gray tool
    # lands within a fixed 26 of gray shoes and gets repainted as shoes. Scaled
    # to each material's own spread, a pixel 20 away from a material that only
    # spreads 5 is correctly read as something else.
    scale = np.array([np.linalg.norm([W_L * m["L"]["spread"],
                                      m["a"]["spread"], m["b"]["spread"]])
                      for m in mats])
    tol = np.clip(OUTLIER_K * scale, OUTLIER_MIN, OUTLIER_TOL)

    flat = _w(lab)[subject]
    d = np.linalg.norm(flat[:, None, :] - Cw[None, :, :], axis=-1)
    best = np.argmin(d, axis=1)
    near = d[np.arange(len(best)), best] < tol[best]

    idx = np.argwhere(subject)
    masks, outlier = [], np.zeros(subject.shape, bool)
    for j in range(len(mats)):
        m = np.zeros(subject.shape, bool)
        sel = (best == j) & near
        m[idx[sel, 0], idx[sel, 1]] = True
        masks.append(m)
    o = idx[~near]
    outlier[o[:, 0], o[:, 1]] = True
    return masks, outlier


# --------------------------------------------------------------------------
# pipeline
# --------------------------------------------------------------------------

def load(path):
    im = Image.open(path)
    had_alpha = im.mode in ("RGBA", "LA") or "transparency" in im.info
    im = im.convert("RGBA")
    arr = np.asarray(im).astype(np.float64) / 255
    return im, arr[..., :3], arr[..., 3], had_alpha


def subject_of(alpha, had_alpha):
    real = had_alpha and (alpha < 0.9).mean() > 0.02
    return (alpha > 0.5) if real else None


def describe(master_path, k):
    im, rgb, alpha, had = load(master_path)
    subject = subject_of(alpha, had)
    if subject is None:
        rgb, alpha, frac = cut_out(rgb)
        subject = alpha > 0.5
        note = "no alpha -> cut out (subject %.1f%%)" % (100 * frac)
    else:
        note = "own alpha (%.1f%% opaque)" % (100 * subject.mean())

    lab = srgb_to_lab(rgb)
    mats = fit_materials(lab, subject, k=k)

    print("master  : %s  [%dx%d]" % (Path(master_path).name, im.size[0], im.size[1]))
    print("subject : %s" % note)
    print("%d materials found\n" % len(mats))
    print("  name     base      %% subject   L      a      b      L range")
    for m in mats:
        lo = max(0.0, m["L"]["median"] - 2 * m["L"]["spread"])
        hi = min(100.0, m["L"]["median"] + 2 * m["L"]["spread"])
        print("  %-6s   %s   %7.2f%%   %6.2f %6.2f %6.2f   %.0f..%.0f"
              % (m["name"], hex_of(m["lab"]), 100 * m["share"],
                 m["L"]["median"], m["a"]["median"], m["b"]["median"], lo, hi))
    print("\n  shadow / base / light of each material:")
    for m in mats:
        s = m["L"]["spread"]
        sh = hex_of([m["lab"][0] - 1.6 * s, m["lab"][1], m["lab"][2]])
        hl = hex_of([min(100, m["lab"][0] + 1.6 * s), m["lab"][1], m["lab"][2]])
        print("  %-6s   shadow %s   base %s   light %s" % (m["name"], sh, hex_of(m["lab"]), hl))

    # --- self-check on this particular character ---
    ev, ambiguous, unassigned = self_check(lab, subject, mats)
    print("\n  self-check")
    print("  %-6s %-9s %-12s %s" % ("", "neighbor", "separation", "reading"))
    overlapping, two_tone = [], []
    for m, e in zip(mats, ev):
        if e["sep"] == float("inf"):
            reading, sep_txt = "only material", "    -"
        elif e["sep"] >= 1.5:
            reading, sep_txt = "clear", "%8.2f" % e["sep"]
        elif e["sep"] >= 1.0:
            reading, sep_txt = "adequate", "%8.2f" % e["sep"]
        else:
            reading, sep_txt = "OVERLAPPING", "%8.2f" % e["sep"]
            overlapping.append((m["name"], e["neighbor"]))
        print("  %-6s %-9s %s      %s" % (m["name"], e["neighbor"], sep_txt, reading))
        if e["lobes"]:
            two_tone.append((m["name"], e["lobes"]))
    print("  ambiguous pixels: %.1f%%   no material: %.1f%%"
          % (100 * ambiguous, 100 * unassigned))

    print()
    clean = True
    for a, b in overlapping:
        clean = False
        print("  WARNING: %s and %s are not clearly separated. They get corrected" % (a, b))
        print("           as one: the difference between them is preserved, but they")
        print("           are not targeted individually. The character still works.")
    for name, lob in two_tone:
        clean = False
        print("  CHECK: %s contains two tones: %s (%.0f%%) and %s (%.0f%%)."
              % (name, lob[0][0], 100 * lob[0][1], lob[1][0], 100 * lob[1][1]))
        print("         These may be two different design colors that got grouped, or")
        print("         one color with shading. Look at the master to decide which;")
        print("         the script cannot tell them apart.")
    if ambiguous > 0.10:
        clean = False
        print("  WARNING: %.1f%% of pixels sit between two materials. Their assignment"
              % (100 * ambiguous))
        print("           may vary from one pose to another in those areas.")
    if clean:
        print("  Materials are clearly separated. Color correction is reliable for")
        print("  this character.")
    return mats


def load_protect_mask(path, size):
    """Return a boolean mask where light, non-transparent pixels are protected."""
    if path is None:
        return np.zeros((size[1], size[0]), bool)
    im = Image.open(path).convert("RGBA")
    if im.size != size:
        raise ValueError("protect mask must match target size: %s != %s" % (im.size, size))
    arr = np.asarray(im, dtype=np.float32) / 255.0
    luminance = 0.2126 * arr[..., 0] + 0.7152 * arr[..., 1] + 0.0722 * arr[..., 2]
    return (arr[..., 3] > 0.5) & (luminance > 0.5)


def process(path, mats, args, protect_path=None):
    im, rgb, alpha, had = load(path)
    original_rgb = rgb.copy()
    info = {"file": Path(path).name, "size": "%dx%d" % im.size}

    subject = subject_of(alpha, had)
    if subject is not None:
        info["alpha"] = "already had alpha (%.1f%% opaque)" % (100 * subject.mean())
        # the image arrived already keyed out: the cutout was not run, so its
        # edge decontamination never happened either. Do just that part.
        if not args.keep_edge:
            rgb = clean_edge(rgb, alpha, band=args.edge_band)
            info["alpha"] += ", edge cleaned"
    elif args.no_alpha:
        subject = np.ones(alpha.shape, bool)
        alpha = np.ones_like(alpha)
        info["alpha"] = "not cut out (--no-alpha)"
    else:
        rgb, alpha, frac = cut_out(rgb, tol=args.tol)
        subject = alpha > 0.5
        info["alpha"] = "cut out (subject %.1f%%)" % (100 * frac)
        if not 0.05 < frac < 0.85:
            info["warning"] = ("suspicious subject fraction (%.1f%%): the background may "
                               "not be flat" % (100 * frac))

    protected = load_protect_mask(protect_path, im.size) & subject
    info["protected"] = int(protected.sum())

    if args.no_color:
        info["color"] = None
    else:
        lab = srgb_to_lab(rgb)
        masks, outlier = assign_materials(lab, subject & ~protected, mats)
        lab_out = lab.copy()
        rep = []
        for m, mask in zip(mats, masks):
            if mask.sum() < 200:
                rep.append((m["name"], None, None, 0)); continue
            before, shift, newvals = [], [], []
            for ci, ch in enumerate("Lab"):
                v = lab[..., ci][mask]
                p16, p50, p84 = np.percentile(v, [16, 50, 84])
                cur_med = float(p50)
                cur_spr = max(float((p84 - p16) / 2), 1e-4)
                scale = float(np.clip(m[ch]["spread"] / cur_spr, 1 / 2.5, 2.5))
                newvals.append((v - cur_med) * scale + m[ch]["median"])
                before.append(cur_med)
                shift.append(m[ch]["median"] - cur_med)

            # How far this material actually drifted. Everything the correction
            # is entitled to do is proportional to that: undoing drift is a small
            # move. A pixel that would have to travel much further than the
            # material itself drifted is not that material - it is a tool, a
            # garment, something the master never had - and dragging it to a
            # character color is how a gray tool comes back white. Colors that
            # are already right stay exactly where they are.
            drift = float(np.linalg.norm(shift))
            limit = max(MIN_SHIFT, SHIFT_K * drift)

            delta = np.stack(newvals, -1) - np.stack(
                [lab[..., ci][mask] for ci in range(3)], -1)
            mag = np.linalg.norm(delta, axis=-1)
            keep = np.minimum(1.0, limit / np.maximum(mag, 1e-6))[..., None]
            delta = delta * keep * args.strength

            after = []
            for ci in range(3):
                lab_out[..., ci][mask] = lab[..., ci][mask] + delta[..., ci]
                after.append(float(np.median(lab_out[..., ci][mask])))
            rep.append((m["name"], np.array(before), np.array(after), int(mask.sum())))
        rgb = lab_to_srgb(lab_out)
        # Protected pixels are byte-for-byte color invariants. They do not
        # participate in classification and are restored after conversion.
        rgb[protected] = original_rgb[protected]
        info["color"] = rep
        info["outlier"] = int(outlier.sum())
        info["subject_px"] = int(subject.sum())

    out = np.concatenate([np.clip(rgb, 0, 1), alpha[..., None]], -1)
    img = Image.fromarray((out * 255 + 0.5).astype(np.uint8), "RGBA")
    if args.size:
        img = img.resize((args.size, args.size), Image.LANCZOS)

    # A mascot asset without transparency is unusable: it gets dropped onto
    # carousels, decks and web pages. If the background survived this far,
    # something upstream failed - refuse to hand it over.
    info["opaque"] = float((alpha > 0.99).mean())
    return img, info


def fmt(info, mats):
    L = ["  %s  [%s]" % (info["file"], info["size"]),
         "    alpha  : %s" % info["alpha"]]
    if info["color"] is None:
        L.append("    color  : skipped (--no-color)")
    else:
        tgt = {m["name"]: m["lab"] for m in mats}
        for name, b, a, n in info["color"]:
            if b is None:
                L.append("    %-6s : absent in this pose" % name); continue
            d0 = float(np.linalg.norm(b - tgt[name]))
            d1 = float(np.linalg.norm(a - tgt[name]))
            L.append("    %-6s : %s -> %s   dE %5.2f -> %4.2f   (%d px)"
                     % (name, hex_of(b), hex_of(a), d0, d1, n))
        if info["outlier"]:
            pct = 100 * info["outlier"] / max(info["subject_px"], 1)
            L.append("    foreign: %d px (%.1f%%) with no known material, left untouched"
                     % (info["outlier"], pct))
        if info.get("protected"):
            L.append("    protected: %d px excluded from correction, RGB preserved exactly"
                     % info["protected"])
    if "warning" in info:
        L.append("    WARNING: %s" % info["warning"])
    return "\n".join(L)


def main():
    ap = argparse.ArgumentParser(
        description="Color consistency for a mascot, measured on its own master.")
    ap.add_argument("master", help="reference PNG of the character")
    ap.add_argument("target", nargs="?", help="pose to correct (file or folder)")
    ap.add_argument("-o", "--out", help="output file or folder")
    ap.add_argument("--describe", action="store_true", help="only measure the master")
    ap.add_argument("--check", action="store_true", help="report without writing")
    ap.add_argument("--k", type=int, default=8, help="max number of materials to look for")
    ap.add_argument("--tol", type=float, default=6.0, help="background cutout tolerance")
    ap.add_argument("--strength", type=float, default=1.0, help="0..1, correction strength")
    ap.add_argument("--size", type=int, help="resize output to NxN")
    ap.add_argument("--edge-band", type=int, default=2,
                    help="width in px of the rim rebuilt to kill chroma halo")
    ap.add_argument("--keep-edge", action="store_true",
                    help="do not clean the rim of an already-keyed image")
    ap.add_argument("--no-alpha", action="store_true")
    ap.add_argument("--no-color", action="store_true")
    ap.add_argument("--protect-mask",
                    help="white/opaque pixels are excluded from color correction; "
                         "file for one target or folder of same-stem PNG masks")
    args = ap.parse_args()

    if args.describe or not args.target:
        describe(args.master, args.k)
        return 0

    mats = describe(args.master, args.k)
    print()

    src = Path(args.target)
    if src.is_dir():
        files = sorted(p for p in src.iterdir()
                       if p.suffix.lower() in EXTS and not p.name.startswith("_"))
        outdir = Path(args.out) if args.out else src / "_out"
        single = None
    else:
        files = [src]
        single = Path(args.out) if (args.out and Path(args.out).suffix) else None
        outdir = (Path(args.out) if not single else single.parent) if args.out else src.parent / "_out"
    if not files:
        print("No images in %s" % src); return 1
    if not args.check:
        outdir.mkdir(parents=True, exist_ok=True)

    print("%d image(s)%s\n" % (len(files), "" if args.check else " -> %s" % outdir))
    failed = 0
    protect_root = Path(args.protect_mask) if args.protect_mask else None
    if protect_root and len(files) > 1 and not protect_root.is_dir():
        print("--protect-mask must be a folder when target is a folder")
        return 1

    for p in files:
        protect_path = None
        if protect_root:
            protect_path = protect_root / (p.stem + ".png") if protect_root.is_dir() else protect_root
            if not protect_path.exists():
                print("  %s  ERROR: protect mask not found: %s" % (p.name, protect_path))
                failed += 1
                continue
        try:
            img, info = process(p, mats, args, protect_path=protect_path)
        except Exception as e:
            print("  %s  ERROR: %s" % (p.name, e)); failed += 1; continue
        print(fmt(info, mats))

        if info.get("opaque", 0) > 0.97:
            failed += 1
            print("    NOT WRITTEN: the image has no transparency (%.0f%% fully opaque)."
                  % (100 * info["opaque"]))
            print("    The background was never removed. Do not deliver this file.")
            print("    Run remove_chroma_key.py on the generated image first:")
            print('      python "$CODEX_HOME/skills/.system/imagegen/scripts/'
                  'remove_chroma_key.py" \\')
            print("        --input <generated>.png --out cut.png --auto-key border "
                  "--soft-matte --despill")
            print("    If the background is not a flat color, retry this script with"
                  " --tol 9.")
            print()
            continue

        if not args.check:
            dst = single if single else outdir / (p.stem + ".png")
            img.save(dst)
            print("    -> %s" % dst.name)
        print()
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
