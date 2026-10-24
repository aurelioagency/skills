# Branch B pre-edit: the user's raw phone takes → ONE edited source video, so nothing passes through CapCut any more.
# Run from the project root (made by init.sh --overlay). Two steps, with the user's approval in between:
#
#   python <skill>/scripts/prep-takes.py plan  --takes t1.mov t2.mov t3.mov [--color 0.35]
#       per take: transcribes it, keeps from the first word to the last (the silence at the head and the tail goes),
#       lists any long pause inside the speech (never cut without asking), measures light and colour, and finds the
#       still "posing" moments for the cover (usually the head of the first take or the tail of the last — exactly the
#       part that gets trimmed, so the cover comes from the RAW takes). Writes:
#         manifests/takes-plan.json            the cut list (editable) + colour correction + voice level
#         snapshots/color-before-after.png     one frame per take, before | after, for the user's eye
#         snapshots/cover-candidates.png       the 3 best still frames (sharp, face to camera), numbered
#         assets/source/cover-candidate-<n>.png  each candidate at full resolution, colour-corrected
#   python <skill>/scripts/prep-takes.py build [--color 0.35] [--cut 2:14.2-16.8 ...] [--keep 2:1.60-15.34 ...] [--slug <slug>]
#       --keep overrides a take's kept range (seconds of that take): the start the plan takes from the first word can
#       still hold the user settling in (a face, a breath) before speaking — look at the frames and move it.
#       one pass: trims and joins the takes in order, applies the colour correction at --color strength, encodes
#       H.264 at the takes' own resolution (CRF 12, short GOP so Chromium can seek it — no render copy needed), then
#       levels the voice to the house level (--voice-lufs, default -21.5 LUFS: what the user's +15 dB in CapCut gave)
#       with a -1 dBTP limiter → assets/source/<slug>-edit.mp4, plus review/union-preview.mp4 (a light 1080-wide
#       copy) that the USER WATCHES and OKs (join + cuts) before SKILL.md B1 continues on the edit (gate 2).
#
# Defaults agreed with the user (2026-10-20): the takes are already correctly spoken (no repeated lines to hunt);
# trim only head/tail silence; ask before cutting a long inner pause; colour at 35 % (the user uses 30-40 % of
# CapCut's auto adjust); the voice to the level of the approved reels.
import hashlib, json, math, os, re, subprocess, sys

try: sys.stdout.reconfigure(encoding='utf-8'); sys.stderr.reconfigure(encoding='utf-8')   # Windows cp1252 consoles
except Exception: pass

SKILL = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HEAD_PAD, TAIL_PAD, LONG_PAUSE = 0.25, 0.40, 1.2
PLAN = 'manifests/takes-plan.json'


def arg(k, d=None):
    return sys.argv[sys.argv.index(k) + 1] if k in sys.argv else d


def args_after(k):
    if k not in sys.argv: return []
    out = []
    for a in sys.argv[sys.argv.index(k) + 1:]:
        if a.startswith('--'): break
        out.append(a)
    return out


def run(cmd, **kw):
    r = subprocess.run(cmd, capture_output=True, **kw)
    if r.returncode: raise SystemExit(f"{cmd[0]} failed: {(r.stderr or b'')[-1500:]!r}")
    return r


def probe(path):
    j = json.loads(run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries',
                        'stream=width,height,r_frame_rate,color_transfer:stream_side_data=rotation:format=duration',
                        '-of', 'json', path]).stdout)
    s = j['streams'][0]
    w, h = s['width'], s['height']
    rot = next((abs(int(float(d.get('rotation', 0)))) for d in s.get('side_data_list', []) if 'rotation' in d), 0)
    if rot in (90, 270): w, h = h, w
    num, den = s['r_frame_rate'].split('/')
    return {'w': w, 'h': h, 'fps': round(float(num) / float(den), 3), 'dur': float(j['format']['duration']),
            'hdr': s.get('color_transfer') in ('arib-std-b67', 'smpte2084')}


def frames(path, t0, t1, fps, width=480):
    """Decoded RGB frames (numpy) between t0 and t1 at `fps`, `width` px wide."""
    import numpy as np
    info = probe(path)
    h = int(round(width * info['h'] / info['w'] / 2) * 2)
    raw = run(['ffmpeg', '-v', 'error', '-ss', f'{t0:.3f}', '-to', f'{t1:.3f}', '-i', path, '-vf',
               f'fps={fps},scale={width}:{h}', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-']).stdout
    n = len(raw) // (width * h * 3)
    return np.frombuffer(raw[:n * width * h * 3], np.uint8).reshape(n, h, width, 3)


def transcribe(path, idx):
    os.makedirs('transcript/takes', exist_ok=True)
    # cache keyed by the FILE (name, size, mtime), not by its position: re-planning in another order must never reuse
    # another take's transcript (2026-10-20: the order changed and take 3 got take 1's words and keep range)
    st = os.stat(path)
    content = hashlib.sha256()
    with open(path, 'rb') as stream:
        for block in iter(lambda: stream.read(4 * 1024 * 1024), b''):
            content.update(block)
    content.update((arg('--model', 'large-v3') + '|' + arg('--language', 'es')).encode())
    key = re.sub(r'[^A-Za-z0-9_-]', '_', os.path.splitext(os.path.basename(path))[0]) + '-' + content.hexdigest()[:24]
    wav, out = f'transcript/takes/{key}.wav', f'transcript/takes/{key}.json'
    if not os.path.exists(out):
        run(['ffmpeg', '-v', 'error', '-y', '-i', path, '-vn', '-ac', '1', '-ar', '16000', wav])
        run([sys.executable, os.path.join(SKILL, 'scripts', 'lib', 'transcribe_words.py'), wav, out,
             arg('--model', 'large-v3'), arg('--language', 'es')])
    words = [w for s in json.load(open(out, encoding='utf-8'))['segments'] for w in s['words']]
    return words


def color_params(path, t0, t1, strength):
    """Auto levels per channel (exposure, contrast and white balance in one), blended at `strength` (0..1)."""
    import numpy as np
    f = frames(path, t0, t1, max(0.5, 10 / max(1.0, t1 - t0)), 320).reshape(-1, 3) / 255.0
    lo, hi = np.percentile(f, 0.5, axis=0), np.percentile(f, 99.5, axis=0)
    p = {}
    for c, k in zip(range(3), 'rgb'):
        imin, imax = strength * lo[c], 1 - strength * (1 - hi[c])
        if imax - imin < 0.2: imin, imax = 0.0, 1.0   # a flat or odd frame: leave that channel alone
        p[f'{k}imin'], p[f'{k}imax'] = round(float(imin), 4), round(float(imax), 4)
    return p


def color_filter(p):
    return 'colorlevels=' + ':'.join(f'{k}={v}' for k, v in p.items())


def cover_candidates(takes, n=3):
    """Still, sharp frames with a face to camera; the trimmed head/tail (where the user poses) scores higher."""
    import cv2, numpy as np
    cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    found = []

    def scan(i, tk, t0, t1, fps, still_max=2.5):
        fr = frames(tk['path'], t0, t1, fps, 360)
        if len(fr) < 3: return
        gray = [cv2.cvtColor(x, cv2.COLOR_RGB2GRAY) for x in fr]
        motion = [0.0] + [float(np.mean(cv2.absdiff(gray[k], gray[k - 1]))) for k in range(1, len(gray))]
        for k in range(1, len(gray) - 1):
            t = t0 + k / fps
            still = max(motion[max(0, k - 2):k + 3])          # no movement around this frame
            if still > still_max: continue
            faces = cascade.detectMultiScale(gray[k], 1.1, 5, minSize=(40, 40))
            if not len(faces): continue
            x, y, w, h = max(faces, key=lambda b: b[2] * b[3])
            sharp = float(cv2.Laplacian(gray[k][y:y + h, x:x + w], cv2.CV_64F).var())
            posing = t < tk['keep'][0] or t > tk['keep'][1]
            edge_take = i in (0, len(takes) - 1)
            score = sharp * (1.6 if posing else 1.0) * (1.2 if edge_take else 1.0) / (1 + still)
            found.append({'take': i + 1, 't': round(t, 2), 'score': round(score, 1), 'posing': posing})

    # the pose lives in the silent head/tail that gets trimmed: scan those densely, the speech only if nothing was found
    # Whisper often pins the first word at 0.0 even after a silent pose, so the head/tail window is at least 1 s.
    for i, tk in enumerate(takes):
        scan(i, tk, 0, max(tk['keep'][0], min(1.0, tk['dur'])), 8)
        scan(i, tk, min(tk['keep'][1], max(0.0, tk['dur'] - 1.0)), tk['dur'], 8)
    if len(found) < n:   # no pose found (2026-10-20): look through the speech, denser and less strict about stillness
        for i, tk in enumerate(takes): scan(i, tk, tk['keep'][0], tk['keep'][1], 6, still_max=6.0)
    found.sort(key=lambda c: -c['score'])
    pick = []
    for c in found:
        if all(c['take'] != p['take'] or abs(c['t'] - p['t']) > 0.8 for p in pick): pick.append(c)
        if len(pick) == n: break
    return pick


def grab(path, t, vf, out):
    run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{t:.3f}', '-i', path, '-frames:v', '1', '-vf', vf, out])


def plan():
    from PIL import Image, ImageDraw
    paths = args_after('--takes')
    if not paths: raise SystemExit('usage: prep-takes.py plan --takes <take1> <take2> ...  (in order)')
    strength = float(arg('--color', 0.35))
    if not 0 <= strength <= 1:
        raise SystemExit('--color must be between 0 and 1')
    os.makedirs('manifests', exist_ok=True); os.makedirs('snapshots', exist_ok=True); os.makedirs('assets/source', exist_ok=True)
    takes = []
    for i, p in enumerate(paths, 1):
        info = probe(p)
        if abs(info['w'] / info['h'] - 9 / 16) > .005:
            raise SystemExit(f'take {i}: expected vertical 9:16 footage')
        if takes and (info['w'], info['h']) != (takes[0]['w'], takes[0]['h']):
            raise SystemExit('Mixed take resolutions need an explicit output-resolution decision; refusing silent downscaling')
        if info['hdr']:
            raise SystemExit(f'take {i} ({p}) is HDR. Ask the user to turn off Settings → Camera → Record Video → HDR Video, or convert it to SDR first; this script does not tone-map.')
        words = transcribe(p, i)
        if not words: raise SystemExit(f'take {i}: no speech found')
        a = max(0.0, words[0]['start'] - HEAD_PAD)
        b = min(info['dur'], words[-1]['end'] + TAIL_PAD)
        pauses = [{'from': round(w0['end'], 2), 'to': round(w1['start'], 2), 'seconds': round(w1['start'] - w0['end'], 2),
                   'after': w0['word']} for w0, w1 in zip(words, words[1:]) if w1['start'] - w0['end'] > LONG_PAUSE]
        takes.append({'path': p, 'w': info['w'], 'h': info['h'], 'fps': info['fps'], 'dur': round(info['dur'], 2),
                      'keep': [round(a, 2), round(b, 2)], 'cuts': [], 'long_pauses': pauses,
                      'color': color_params(p, a, b, strength), 'first_words': ' '.join(w['word'] for w in words[:6]),
                      'last_words': ' '.join(w['word'] for w in words[-6:])})
    # before | after, one row per take
    rows = []
    for i, tk in enumerate(takes, 1):
        t = (tk['keep'][0] + tk['keep'][1]) / 2
        grab(tk['path'], t, 'scale=360:-2', f'snapshots/_b{i}.png')
        grab(tk['path'], t, color_filter(tk['color']) + ',scale=360:-2', f'snapshots/_a{i}.png')
        b, a2 = Image.open(f'snapshots/_b{i}.png'), Image.open(f'snapshots/_a{i}.png')
        row = Image.new('RGB', (b.width * 2 + 8, b.height), (30, 30, 30)); row.paste(b, (0, 0)); row.paste(a2, (b.width + 8, 0))
        d = ImageDraw.Draw(row); d.text((8, 8), f'toma {i} antes', fill=(255, 255, 0)); d.text((b.width + 16, 8), f'despues ({int(strength * 100)} %)', fill=(255, 255, 0))
        rows.append(row); os.remove(f'snapshots/_b{i}.png'); os.remove(f'snapshots/_a{i}.png')
    sheet = Image.new('RGB', (rows[0].width, sum(r.height + 8 for r in rows)), (30, 30, 30))
    y = 0
    for r in rows: sheet.paste(r, (0, y)); y += r.height + 8
    sheet.save('snapshots/color-before-after.png')
    # cover candidates (from the raw takes, colour-corrected like the edit)
    cands = cover_candidates(takes)
    tiles = []
    for n, c in enumerate(cands, 1):
        tk = takes[c['take'] - 1]
        grab(tk['path'], c['t'], color_filter(tk['color']), f'assets/source/cover-candidate-{n}.png')
        im = Image.open(f'assets/source/cover-candidate-{n}.png'); im.thumbnail((360, 640))
        d = ImageDraw.Draw(im); d.text((8, 8), f"{n}: toma {c['take']} {c['t']:.2f}s", fill=(255, 255, 0)); tiles.append(im)
        c['png'] = f'assets/source/cover-candidate-{n}.png'
    if tiles:
        cs = Image.new('RGB', (sum(t.width + 8 for t in tiles), max(t.height for t in tiles)), (30, 30, 30))
        x = 0
        for t in tiles: cs.paste(t, (x, 0)); x += t.width + 8
        cs.save('snapshots/cover-candidates.png')
    out = {'color_strength': strength, 'voice_lufs': float(arg('--voice-lufs', -21.5)), 'takes': takes, 'cover_candidates': cands}
    json.dump(out, open(PLAN, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    total = sum(t['keep'][1] - t['keep'][0] for t in takes)
    print(f'{PLAN}: {len(takes)} takes → {total:.1f} s after trimming head/tail silence')
    for i, t in enumerate(takes, 1):
        print(f"  take {i}: keep {t['keep'][0]:.2f}-{t['keep'][1]:.2f} of {t['dur']:.2f} s"
              + (f" · {len(t['long_pauses'])} long pause(s) inside: " + ', '.join(f"{p['from']}-{p['to']} ({p['seconds']} s)" for p in t['long_pauses']) if t['long_pauses'] else ''))
    print('look at snapshots/color-before-after.png and snapshots/cover-candidates.png, then show them to the user')


def build():
    plan_ = json.load(open(PLAN, encoding='utf-8'))
    strength = float(arg('--color', plan_['color_strength']))
    takes = plan_['takes']
    if abs(strength - plan_['color_strength']) > 1e-6:          # the user asked for more / less: recompute
        for t in takes: t['color'] = color_params(t['path'], t['keep'][0], t['keep'][1], strength)
    for k in args_after('--keep'):                                # 2:1.60-15.34 — the user still settling in at the start
        m = re.match(r'(\d+):([\d.]+)-([\d.]+)$', k)
        if not m: raise SystemExit(f'bad --keep {k} (use take:start-end, seconds of that take)')
        index, start, end = int(m.group(1)) - 1, float(m.group(2)), float(m.group(3))
        if not 0 <= index < len(takes) or not 0 <= start < end <= takes[index]['dur']:
            raise SystemExit(f'invalid --keep range: {k}')
        takes[index]['keep'] = [start, end]
    for c in args_after('--cut'):                                 # 2:14.2-16.8 — a long inner pause the user OKed cutting
        m = re.match(r'(\d+):([\d.]+)-([\d.]+)$', c)
        if not m: raise SystemExit(f'bad --cut {c} (use take:start-end, seconds of that take)')
        index, start, end = int(m.group(1)) - 1, float(m.group(2)), float(m.group(3))
        if not 0 <= index < len(takes) or not takes[index]['keep'][0] <= start < end <= takes[index]['keep'][1]:
            raise SystemExit(f'invalid --cut range: {c}')
        takes[index]['cuts'].append([start, end])
    W, H, FPS = takes[0]['w'], takes[0]['h'], takes[0]['fps']
    segs = []
    for t in takes:                                               # keep range minus the OKed inner cuts
        a, b = t['keep']
        for c0, c1 in sorted(t['cuts']):
            if c0 > a: segs.append((t, a, c0))
            a = max(a, c1)
        if b > a: segs.append((t, a, b))
    inputs, chains = [], []
    for k, (t, a, b) in enumerate(segs):
        inputs += ['-ss', f'{a:.3f}', '-to', f'{b:.3f}', '-i', t['path']]
        chains.append(f"[{k}:v]setpts=PTS-STARTPTS,{color_filter(t['color'])},scale={W}:{H}:flags=lanczos,fps={FPS},setsar=1,format=yuv420p[v{k}]")
        chains.append(f"[{k}:a]asetpts=PTS-STARTPTS,aresample=48000,aformat=channel_layouts=stereo,afade=t=in:d=0.02,afade=t=out:st={max(0, b - a - 0.03):.3f}:d=0.03[a{k}]")
    graph = ';'.join(chains) + ';' + ''.join(f'[v{k}][a{k}]' for k in range(len(segs))) + f'concat=n={len(segs)}:v=1:a=1[v][a]'
    slug = arg('--slug', os.path.basename(os.getcwd()))
    tmp, out = 'assets/source/_edit_pass1.mov', f'assets/source/{slug}-edit.mp4'
    gop = max(1, int(round(FPS / 3)))
    run(['ffmpeg', '-v', 'error', '-y', *inputs, '-filter_complex', graph, '-map', '[v]', '-map', '[a]',
         '-c:v', 'libx264', '-preset', 'medium', '-crf', '12', '-g', str(gop), '-bf', '0', '-pix_fmt', 'yuv420p',
         '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-c:a', 'pcm_s24le', tmp])
    # voice to the house level (what the user's +15 dB in CapCut gave): linear gain into a -1 dBTP limiter
    e = run(['ffmpeg', '-hide_banner', '-nostats', '-i', tmp, '-af', 'ebur128', '-f', 'null', '-'], text=True).stderr
    I = float(re.search(r'I:\s+(-?[\d.]+)', e[e.rfind('Summary'):]).group(1))
    gain = plan_['voice_lufs'] - I
    run(['ffmpeg', '-v', 'error', '-y', '-i', tmp, '-map', '0:v', '-map', '0:a', '-c:v', 'copy', '-af',
         f'volume={gain:.2f}dB,aresample=192000,alimiter=limit=0.891:attack=1:release=50:level=false,aresample=48000',
         '-c:a', 'aac', '-b:a', '320k', '-movflags', '+faststart', out])
    os.remove(tmp)
    # a light copy for the user to WATCH: the join and the cuts are approved on the video, never on the list (gate 2)
    os.makedirs('review', exist_ok=True)
    run(['ffmpeg', '-v', 'error', '-y', '-i', out, '-vf', 'scale=1080:-2', '-c:v', 'libx264', '-crf', '24', '-preset', 'fast',
         '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', 'review/union-preview.mp4'])
    dur = probe(out)['dur']
    plan_['built'] = {'file': out, 'seconds': round(dur, 2), 'segments': len(segs), 'color_strength': strength,
                      'voice_in_lufs': I, 'voice_gain_db': round(gain, 1)}
    # The pipeline keeps the approved input immutable so a build cannot invalidate its own approval.
    built_path = arg('--out-built', PLAN)
    os.makedirs(os.path.dirname(os.path.abspath(built_path)), exist_ok=True)
    json.dump(plan_, open(built_path, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(f'{out}: {len(segs)} segment(s), {dur:.1f} s, {W}x{H} {FPS} fps · colour {int(strength * 100)} % · voice {I:.1f} → {plan_["voice_lufs"]} LUFS ({gain:+.1f} dB)')
    for i, t in enumerate(takes, 1):
        print(f"  take {i}: kept {t['keep'][0]:.2f}-{t['keep'][1]:.2f} of {t['dur']:.2f} s")
    print('GATE 2: send review/union-preview.mp4 to the user and wait for an explicit OK on the join and the cuts before B1')


if __name__ == '__main__':
    mode = sys.argv[1] if len(sys.argv) > 1 else ''
    if mode == 'plan': plan()
    elif mode == 'build': build()
    else: raise SystemExit(__doc__ or 'usage: prep-takes.py plan --takes ... | build')
