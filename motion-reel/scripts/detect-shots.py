#!/usr/bin/env python
"""Split a talking-head video's dialogue into its camera shots ("planos").

Reads the video and the approved word-level transcript, finds where the framing changes,
and prints which text belongs to which shot. Usually that is: shot 1 = the hook, last
shot = the CTA, with the middle shot(s) in between.

A shot change is a sustained jump in where the speaker's face sits (bottom edge of the
largest detected face). Scene-detect on pixels is NOT used: screen recordings scroll
and make it fire on every page change.

It also measures the lowest chin in each shot and writes the caption zones
(`marginBottom` per shot) that build-burn-in-captions.mjs takes with --zones.
No preview frames are produced.

Usage:
  python detect-shots.py --video <video.mp4> --transcript <approved.json>
      --out-shots manifests/shots.json --out-zones manifests/caption-zones.json
      [--out-check snapshots/shots-check.png] [--step 3] [--jump 0.07] [--tail 0.25]

Needs: opencv-python (pip install opencv-python).
"""
import argparse
import json
import re
import statistics
import sys

import cv2


def parse():
    p = argparse.ArgumentParser()
    p.add_argument('--video', required=True)
    p.add_argument('--transcript', required=True)
    p.add_argument('--out-shots', default=None)
    p.add_argument('--out-zones', default=None)
    p.add_argument('--out-check', default=None, help='write a labelled strip of frames at hook/CTA edges and cuts')
    p.add_argument('--allow-no-face', action='store_true', help='emit an explicitly unverified fallback zone when no face is detected')
    p.add_argument('--step', type=int, default=3, help='analyse every Nth frame')
    p.add_argument('--jump', type=float, default=0.07,
                   help='face-bottom jump, as a fraction of frame height, that counts as a new shot')
    p.add_argument('--tail', type=float, default=0.25,
                   help='a word starting up to this many seconds before a cut belongs to the new shot')
    return p.parse_args()


def face_track(video, step):
    cap = cv2.VideoCapture(video)
    fps = cap.get(cv2.CAP_PROP_FPS)
    n = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    height = cap.get(cv2.CAP_PROP_FRAME_HEIGHT)
    width = cap.get(cv2.CAP_PROP_FRAME_WIDTH)
    if fps <= 0 or n <= 0 or width <= 0 or height <= 0 or step < 1:
        raise ValueError('Invalid video or sampling step')
    cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    scale = 540.0 / width
    track = []
    for i in range(0, n, step):
        cap.set(cv2.CAP_PROP_POS_FRAMES, i)
        ok, frame = cap.read()
        if not ok:
            break
        small = cv2.cvtColor(cv2.resize(frame, (540, int(height * scale))), cv2.COLOR_BGR2GRAY)
        faces = cascade.detectMultiScale(small, 1.1, 6, minSize=(40, 40))
        faces = [f for f in faces if f[1] > small.shape[0] * 0.12]
        if len(faces):
            x, y, w, h = max(faces, key=lambda r: r[2])
            track.append((i / fps, (y + h) / scale, w / scale))
        else:
            track.append((i / fps, None, None))
    cap.release()
    return track, height, width, n / fps


def smooth(track, window=5):
    """Median filter over valid detections, to kill one-frame false positives."""
    valid = [(t, c, w) for t, c, w in track if c is not None]
    out = []
    for k, (t, c, w) in enumerate(valid):
        lo, hi = max(0, k - window // 2), min(len(valid), k + window // 2 + 1)
        out.append((t, statistics.median(v[1] for v in valid[lo:hi]), statistics.median(v[2] for v in valid[lo:hi])))
    return out


def find_cuts(sm, height, jump):
    cuts = []
    for k in range(1, len(sm)):
        (t0, c0, w0), (t1, c1, w1) = sm[k - 1], sm[k]
        if abs(c1 - c0) > jump * height or (w0 and abs(w1 - w0) / w0 > 0.3):
            cuts.append(round((t0 + t1) / 2, 2))
    merged = []
    for c in cuts:
        if not merged or c - merged[-1] > 0.6:
            merged.append(c)
    return merged


QUOTES = '"\')»'
END_MARKS = ('.', '?', '!', '…')


def sentences(words):
    """Group the word list into sentences by closing punctuation. Returns [(first_idx, last_idx)]."""
    out, first = [], 0
    for i, w in enumerate(words):
        if w['word'].strip().rstrip(QUOTES).endswith(END_MARKS):
            out.append((first, i))
            first = i + 1
    if first < len(words):
        out.append((first, len(words) - 1))
    return out


CTA_RE = re.compile(
    r'\b(coment\w*|segu[ií]s|seguime|seguinos|segu[ií]|guard[aá]\w*|compart\w*|mand[aá]\w*|'
    r'escrib\w*|suscrib\w*|descarg\w*|link|palabra|dm|perfil|bio)\b', re.IGNORECASE)
MAX_CTA_EXTRA_SENTENCES = 2


def looks_like_cta(words, sent):
    text = ' '.join(w['word'] for w in words[sent[0]:sent[1] + 1])
    return bool(CTA_RE.search(text))


def find_hook_and_cta(words):
    """Hook = the first full sentence. CTA = the last full sentence, extended backwards over
    the sentences right before it that also ask the viewer to do something (comment, follow,
    save, share...). The body is everything between the two. Returns (hook, cta) as
    (first_idx, last_idx) ranges into words."""
    sents = sentences(words)
    if not sents:
        return None, None
    if len(sents) == 1:
        return sents[0], None
    hook, cta = sents[0], sents[-1]
    k = len(sents) - 2
    extra = 0
    while k >= 1 and extra < MAX_CTA_EXTRA_SENTENCES and looks_like_cta(words, sents[k]):
        extra += 1
        cta = (sents[k][0], cta[1])
        k -= 1
    return hook, cta


def snap_cuts_to_words(cuts, words, hook, cta, tail):
    """Move every cut onto the start of a word, so no word is split between two shots.

    A word starting up to `tail` seconds before the cut takes the new shot. When the cut
    falls within 0.6 s of the hook's last word or the CTA's first word, it is moved to that
    sentence boundary, so the whole hook sits in one shot and the whole CTA in one shot.
    """
    starts = [w['start'] for w in words]
    boundaries = []
    if hook:
        boundaries.append(hook[1] + 1)   # first word after the hook
    if cta:
        boundaries.append(cta[0])        # first word of the CTA
    out = []
    for c in cuts:
        idx = next((i for i, s in enumerate(starts) if s >= c - tail), None)
        if idx is None:
            continue
        # The hook and the CTA are never split: a cut inside either one is moved to the
        # edge of that sentence (the hook's end, or the CTA's start), whichever is nearer.
        for name, sent in (('hook', hook), ('cta', cta)):
            if not sent:
                continue
            a_, b_ = sent
            if words[a_]['start'] - tail < c < words[b_]['end']:
                idx = b_ + 1 if name == 'hook' else a_
                break
        else:
            for b in boundaries:
                if 0 < b < len(words) and abs(words[b]['start'] - c) <= 0.6:
                    idx = b
                    break
        if idx >= len(words):
            continue
        t = round(starts[idx] - 0.01, 3)
        if t > 0 and (not out or t > out[-1]):
            out.append(t)
    return out


def check_sentence_integrity(shots, words, hook, cta):
    """Warn when the hook or the CTA is cut across two shots."""
    def shot_of(t):
        for s in shots:
            if s['start'] <= t < s['end']:
                return s['index']
        return shots[-1]['index']
    notes = []
    body = None
    if hook and cta and cta[0] > hook[1] + 1:
        body = (hook[1] + 1, cta[0] - 1)
    for name, sent in (('GANCHO', hook), ('CUERPO', body), ('CTA', cta)):
        if not sent:
            continue
        a_, b_ = sent
        text = ' '.join(w['word'].strip() for w in words[a_:b_ + 1])
        sa, sb = shot_of(words[a_]['start']), shot_of(words[b_]['start'])
        if name == 'CUERPO':
            status = f'planos {sa} a {sb}' if sa != sb else f'plano {sa}'
        else:
            status = f'plano {sa}' if sa == sb else f'ATENCION: cortada entre plano {sa} y plano {sb}'
        notes.append((name, words[a_]['start'], words[b_]['end'], status, text))
    return notes


def save_check_strip(video, times, out_path):
    """One image with a frame at each time, labelled, so cuts can be checked by eye."""
    cap = cv2.VideoCapture(video)
    tiles = []
    for label, t in times:
        cap.set(cv2.CAP_PROP_POS_MSEC, max(0.0, t) * 1000)
        ok, frame = cap.read()
        if not ok:
            continue
        h = 480
        frame = cv2.resize(frame, (int(frame.shape[1] * h / frame.shape[0]), h))
        cv2.putText(frame, f'{label} {t:.2f}s', (8, 28), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 0), 4)
        cv2.putText(frame, f'{label} {t:.2f}s', (8, 28), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
        tiles.append(frame)
    cap.release()
    if tiles:
        cv2.imwrite(out_path, cv2.hconcat(tiles))


def main():
    sys.stdout.reconfigure(encoding='utf-8')
    a = parse()
    track, height, width, duration = face_track(a.video, a.step)
    sm = smooth(track)
    if not sm and not a.allow_no_face:
        sys.exit('No face detected in the video.')
    cuts = find_cuts(sm, height, a.jump)

    tr = json.load(open(a.transcript, encoding='utf-8'))
    words = [w for s in tr['segments'] for w in s['words']] if 'segments' in tr else tr.get('words', [])
    hook, cta = find_hook_and_cta(words)
    cuts = snap_cuts_to_words(cuts, words, hook, cta, a.tail)
    bounds = [0.0] + cuts + [duration]
    shots = [{'index': k + 1, 'start': bounds[k], 'end': bounds[k + 1]} for k in range(len(bounds) - 1)]

    # Every word belongs to exactly one shot: the one whose [start, end) holds its start time.
    # Cuts were already moved onto word starts, so no word straddles a boundary.
    for s in shots:
        s['words'] = []
    for w in words:
        for s in shots:
            if s['start'] <= w['start'] < s['end'] or s is shots[-1]:
                s['words'].append(w['word'].strip())
                break

    # lowest chin per shot -> caption zone. Constants are expressed for a 2160-wide frame
    # and scaled: 340 px = gap under the chin + height of one caption line.
    k_scale = width / 2160.0
    zones = []
    for s in shots:
        chins = [c for t, c, _ in sm if s['start'] <= t < s['end']]
        chin = max(chins) if chins else statistics.median(c for _, c, _ in sm) if sm else None
        s['lowestChinPx'] = round(chin) if chin is not None else None
        s['marginBottom'] = max(0, int(round(height - chin - 340 * k_scale))) if chin is not None else round(500 * width / 1080)
        s['needsReview'] = chin is None
        s['text'] = ' '.join(s.pop('words'))
        # Zones tile the timeline with no overlap: each one ends exactly where the next starts.
        zones.append({'start': round(s['start'], 3),
                      'end': round(s['end'], 3) if s['index'] < len(shots) else 600,
                      'marginBottom': s['marginBottom']})

    for s in shots:
        print(f"Plano {s['index']} ({s['start']:.2f}s a {s['end']:.2f}s): {s['text']}")
    notes = check_sentence_integrity(shots, words, hook, cta)
    for name, t0, t1, status, text in notes:
        print(f"{name} ({t0:.2f}s a {t1:.2f}s, {status}): {text}")
    if a.out_check:
        times = []
        for name, t0, t1, _, _ in [n for n in notes if n[0] != 'CUERPO']:
            times += [(name + ' inicio', t0 + 0.05), (name + ' fin', t1 - 0.05)]
        for s in shots[1:]:
            times += [('corte', s['start'] - 0.1), ('corte', s['start'] + 0.1)]
        if not times:
            times = [('SIN ROSTRO: revisar zona' if not sm else 'inicio', min(0.1, duration / 2))]
        save_check_strip(a.video, sorted(times, key=lambda x: x[1]), a.out_check)
        print(f'Tira de cuadros para revisar a ojo: {a.out_check}')
    if a.out_shots:
        json.dump({'video': a.video, 'shots': shots, 'hook': next((n[4] for n in notes if n[0] == 'GANCHO'), None), 'body': next((n[4] for n in notes if n[0] == 'CUERPO'), None), 'cta': next((n[4] for n in notes if n[0] == 'CTA'), None)}, open(a.out_shots, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
    if a.out_zones:
        json.dump(zones, open(a.out_zones, 'w', encoding='utf-8'), indent=1)


if __name__ == '__main__':
    main()
