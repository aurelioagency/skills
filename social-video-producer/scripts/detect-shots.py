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
      [--step 3] [--jump 0.07] [--tail 0.25]

Needs: opencv-python (pip install opencv-python).
"""
import argparse
import json
import statistics
import sys

import cv2


def parse():
    p = argparse.ArgumentParser()
    p.add_argument('--video', required=True)
    p.add_argument('--transcript', required=True)
    p.add_argument('--out-shots', default=None)
    p.add_argument('--out-zones', default=None)
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


def main():
    sys.stdout.reconfigure(encoding='utf-8')
    a = parse()
    track, height, width, duration = face_track(a.video, a.step)
    sm = smooth(track)
    if not sm:
        sys.exit('No face detected in the video.')
    cuts = find_cuts(sm, height, a.jump)
    bounds = [0.0] + cuts + [duration]
    shots = [{'index': k + 1, 'start': bounds[k], 'end': bounds[k + 1]} for k in range(len(bounds) - 1)]

    tr = json.load(open(a.transcript, encoding='utf-8'))
    words = [w for s in tr['segments'] for w in s['words']]
    for s in shots:
        s['words'] = []
    for w in words:
        for s in shots:
            lead = a.tail if s['index'] > 1 else 0.0
            if s['start'] - lead <= w['start'] < s['end'] - (a.tail if s['index'] < len(shots) else 0.0):
                s['words'].append(w['word'].strip())
                break
        else:
            shots[-1]['words'].append(w['word'].strip())

    # lowest chin per shot -> caption zone. Constants are expressed for a 2160-wide frame
    # and scaled: 340 px = gap under the chin + height of one caption line.
    k_scale = width / 2160.0
    zones = []
    for s in shots:
        chins = [c for t, c, _ in sm if s['start'] <= t < s['end']]
        chin = max(chins) if chins else statistics.median(c for _, c, _ in sm)
        s['lowestChinPx'] = round(chin)
        s['marginBottom'] = int(round(height - chin - 340 * k_scale))
        s['text'] = ' '.join(s.pop('words'))
        zones.append({'start': round(max(0.0, s['start'] - (a.tail if s['index'] > 1 else 0.0)), 2),
                      'end': round(s['end'], 2) if s['index'] < len(shots) else 600,
                      'marginBottom': s['marginBottom']})

    for s in shots:
        print(f"Plano {s['index']} ({s['start']:.2f}s a {s['end']:.2f}s): {s['text']}")
    if a.out_shots:
        json.dump({'video': a.video, 'shots': shots}, open(a.out_shots, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
    if a.out_zones:
        json.dump(zones, open(a.out_zones, 'w', encoding='utf-8'), indent=1)


if __name__ == '__main__':
    main()
