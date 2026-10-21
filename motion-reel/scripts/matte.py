# Branch B: a person matte of the source, so a graphic can pass BEHIND the speaker (scene({ behind: true }), ANIMATION.md §2b).
# Free and local: RobustVideoMatting (MobileNetV3, ONNX, CPU). It is a video model — it carries what it saw in the
# previous frames — so the edge does not crawl from frame to frame the way a per-image cutout does.
# Run from the project root:
#
#   python <skill>/scripts/matte.py assets/source/<slug>-edit.mp4 [--range 12.0,15.5] [--width 1080] [--choke 1]
#       → assets/matte/<slug>-edit-matte.mp4, same fps and frame count as the source, two halves side by side: the alpha
#         (grey, white = speaker) and the speaker's clean edge colour (below). C.videoBG(src, { matte }) seeks it with the
#         footage. Frames outside --range stay black (no speaker layer there); the range gets 1.5 s of warm-up before it
#         so the model already "knows" the speaker on its first frame.
#
# Edge treatment (all at --width): a 3-frame temporal median (kills one-frame flicker without lagging a moving edge),
# a dead-band hold (changes under --hold keep the previous value: hair shimmer stops, real motion passes), a --choke px
# erosion and a 0.8 px feather. Then the edge colour is cleaned: see-through hair carries the sky or the wall behind it,
# which shows as a light rim over a dark graphic; the film uses this clean colour on the edge only and the footage itself
# (full resolution) everywhere inside.
# The model (~15 MB) is downloaded once from the official release into ~/.cache/motion-reel/.
import argparse, os, subprocess, sys, urllib.request
from fractions import Fraction

import numpy as np

try: sys.stdout.reconfigure(encoding='utf-8'); sys.stderr.reconfigure(encoding='utf-8')   # Windows cp1252 consoles
except Exception: pass

MODEL_URL = 'https://github.com/PeterL1n/RobustVideoMatting/releases/download/v1.0.0/rvm_mobilenetv3_fp32.onnx'
MODEL = os.path.join(os.path.expanduser('~'), '.cache', 'motion-reel', 'rvm_mobilenetv3_fp32.onnx')


def probe(src):
    out = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries',
                          'stream=width,height,r_frame_rate,start_time:stream_side_data=rotation', '-of', 'default=nw=1', src],
                         capture_output=True, text=True, check=True).stdout
    d = dict(l.split('=', 1) for l in out.splitlines() if '=' in l)
    w, h = int(d['width']), int(d['height'])
    if abs(int(float(d.get('rotation', 0) or 0))) in (90, 270): w, h = h, w   # ffmpeg (and the browser) auto-rotate
    return w, h, Fraction(d['r_frame_rate']), float(d.get('start_time', 0) or 0)


def model():
    if not os.path.exists(MODEL):
        os.makedirs(os.path.dirname(MODEL), exist_ok=True)
        print('downloading RobustVideoMatting (MobileNetV3, ~15 MB) →', MODEL)
        urllib.request.urlretrieve(MODEL_URL, MODEL + '.part'); os.replace(MODEL + '.part', MODEL)
    import onnxruntime as ort
    return ort.InferenceSession(MODEL, providers=['CPUExecutionProvider'])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('src')
    ap.add_argument('--out', default=None, help='default assets/matte/<name>-matte.mp4')
    ap.add_argument('--range', default=None, help='a,b seconds: matte only there (the behind moments), black elsewhere')
    ap.add_argument('--width', type=int, default=1080, help='matte width; the film upscales it (1080 is plenty for 4K)')
    ap.add_argument('--ratio', type=float, default=None, help='model downsample ratio (default: ~512 px on the long side)')
    ap.add_argument('--choke', type=float, default=1.0, help='px eaten from the edge')
    ap.add_argument('--hold', type=float, default=0.06, help='dead band: smaller changes keep the previous value')
    a = ap.parse_args()

    W0, H0, fps, start = probe(a.src)
    if start > 1e-3: print(f'WARN: the source starts at {start:.3f} s, not 0 — the matte will be off by that much in the film')
    w = a.width - a.width % 2; h = round(H0 * w / W0 / 2) * 2
    ratio = a.ratio or min(1.0, 512 / max(w, h))
    out = a.out or os.path.join('assets', 'matte', os.path.splitext(os.path.basename(a.src))[0] + '-matte.mp4')
    os.makedirs(os.path.dirname(out) or '.', exist_ok=True)
    r0, r1 = (map(float, a.range.split(','))) if a.range else (0.0, float('inf'))
    warm = r0 - 1.5

    import cv2
    sess = model()
    dec = subprocess.Popen(['ffmpeg', '-v', 'error', '-i', a.src, '-vf', f'scale={w}:{h}:flags=area', '-fps_mode', 'passthrough',
                            '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], stdout=subprocess.PIPE)
    # one stream, two halves, so a single seek keeps them in sync: [ alpha (grey) | clean edge colour ], bt709 like the footage
    enc = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{2 * w}x{h}', '-r', str(fps), '-i', '-',
                            '-vf', 'scale=out_color_matrix=bt709:out_range=tv', '-c:v', 'libx264', '-preset', 'medium', '-crf', '10',
                            '-pix_fmt', 'yuv420p', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
                            '-g', str(max(1, round(float(fps)))), '-movflags', '+faststart', out], stdin=subprocess.PIPE)

    rec = [np.zeros((1, 1, 1, 1), np.float32)] * 4
    dr = np.array([ratio], np.float32)
    ker = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * int(a.choke) + 1,) * 2) if a.choke >= 1 else None
    raw, held, n, lit = [], None, 0, 0     # raw: the last 3 model outputs, for the median
    black = bytes(2 * w * h * 3)

    def emit(alpha, img):
        nonlocal held, lit
        if alpha is None: held = None; enc.stdin.write(black); return
        held = alpha if held is None else np.where(np.abs(alpha - held) < a.hold, held, alpha)
        q = np.clip(held, 0, 1)             # the model's own coverage: the colour maths needs it unchoked
        m = cv2.erode(q, ker) if ker is not None else q
        m = np.clip(cv2.GaussianBlur(m, (0, 0), 0.8), 0, 1)
        # clean edge colour: a see-through pixel is speaker × q + background × (1 - q). The background right behind it is
        # estimated by spreading the nearby clear background inward (a normalized blur) and taken out. (With the choked m
        # instead of q it takes out too much: a dark outline.)
        I = img.astype(np.float32) / 255
        clear = (q < 0.05).astype(np.float32)
        den = np.maximum(cv2.GaussianBlur(clear, (0, 0), 12), 1e-4)[..., None]
        bg = cv2.GaussianBlur(I * clear[..., None], (0, 0), 12) / den
        fg = np.clip((I - (1 - q[..., None]) * bg) / np.maximum(q, 0.05)[..., None], 0, 1)
        # where the speaker is faint (q < 0.25) that division is noise: use the edge colour spread outward instead. It also
        # fills the outside, so the video codec never smears black into the edge (a dark outline in the film)
        ext = cv2.GaussianBlur(fg * q[..., None], (0, 0), 5) / np.maximum(cv2.GaussianBlur(q, (0, 0), 5), 1e-4)[..., None]
        s = np.clip(q * 4, 0, 1)[..., None]
        fg = fg * s + ext * (1 - s)
        lit += 1
        both = np.concatenate([np.repeat(m[..., None], 3, 2), fg], 1)
        enc.stdin.write((both * 255 + 0.5).astype(np.uint8).tobytes())

    frame = w * h * 3
    pending = []                            # (t, alpha or None, image) waiting one frame for the median's "next"
    while True:
        buf = dec.stdout.read(frame)
        if len(buf) < frame: break
        t = n / fps
        img = np.frombuffer(buf, np.uint8).reshape(h, w, 3)
        if warm <= t < r1:
            src = img.transpose(2, 0, 1)[None].astype(np.float32) / 255
            _, pha, *rec = sess.run(None, {'src': src, 'r1i': rec[0], 'r2i': rec[1], 'r3i': rec[2], 'r4i': rec[3], 'downsample_ratio': dr})
            alpha = pha[0, 0]
        else:
            alpha, rec = None, [np.zeros((1, 1, 1, 1), np.float32)] * 4
        if alpha is not None: raw.append(alpha); raw = raw[-3:]
        else: raw = []
        pending.append((t, alpha, img))
        if len(pending) == 2:               # the previous frame now has its neighbours
            pt, pa, pi = pending.pop(0)
            if pa is None or pt < r0: emit(None, None)
            else: emit(np.median(np.stack(raw), axis=0) if len(raw) == 3 else pa, pi)
        n += 1
        if n % 48 == 0: print(f'\rmatte frame {n}  t={float(t):.1f}s', end='', flush=True)
    for pt, pa, pi in pending:
        if pa is None or pt < r0: emit(None, None)
        else: emit(pa, pi)
    enc.stdin.close(); enc.wait(); dec.wait()
    print(f'\nwrote {out}  2 x {w}x{h} (alpha | edge colour) @ {float(fps):g} fps, {n} frames ({lit} with the speaker)')


if __name__ == '__main__':
    main()
