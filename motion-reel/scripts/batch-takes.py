# Batch mode for Branch B: one folder of raw phone takes covering several topics.
#
#   scan   --folder F [--model small] [--language es]
#          probes every video (duration, HDR, rotation), checks free disk, transcribes each
#          take word by word with local Whisper and flags pauses, repeats, doubtful words and
#          empty takes -> <batch>/takes.json (+ one compact line per take on stdout)
#   rename --folder F --map map.json [--dry-run]
#          renames per the Opus-written map -> tema_parte_IMG_n.ext / NO-USAR_motivo_IMG_n.ext;
#          never overwrites, logs every rename to <batch>/renames.json
#   undo   --folder F
#          restores the original names from renames.json
#   sdr    --folder F
#          converts every HDR take the map uses to SDR ONCE, sequentially, into <batch>/sdr/,
#          after checking there is room; topic projects take their takes from there
#
# <batch> = <Documents>/motion-reel/.work/_lote-<folder name>. The map is a JSON list:
#   [{"file": "IMG_4101.MOV", "topic": "book-to-skill", "part": "hook-1"},
#    {"file": "IMG_4115.MOV", "skip": "cortado-a-la-mitad", "topic": "cobalt"}]
# "topic" is optional on skipped takes. Never print transcripts: the Windows console
# mangles accents; they live in takes.json.
import argparse
import json
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

VIDEO = {'.mov', '.mp4', '.m4v'}
SLUG = re.compile(r'^[a-z0-9]+(-[a-z0-9]+)*$')


def documents():
    return Path(os.environ.get('USERPROFILE') or Path.home()) / 'Documents'


def batch_dir(folder):
    d = documents() / 'motion-reel' / '.work' / f'_lote-{Path(folder).resolve().name}'
    d.mkdir(parents=True, exist_ok=True)
    return d


def read(p, default=None):
    p = Path(p)
    return json.loads(p.read_text(encoding='utf-8')) if p.exists() else default


def write(p, value):
    Path(p).write_text(json.dumps(value, ensure_ascii=False, indent=2), encoding='utf-8')


def videos(folder):
    return sorted(p for p in Path(folder).iterdir() if p.suffix.lower() in VIDEO)


def probe(path):
    out = subprocess.run(['ffprobe', '-v', 'error', '-print_format', 'json', '-show_streams',
                          '-show_format', str(path)], capture_output=True, text=True)
    data = json.loads(out.stdout or '{}')
    v = next((s for s in data.get('streams', []) if s.get('codec_type') == 'video'), {})
    rot = 0
    for side in v.get('side_data_list', []):
        rot = int(side.get('rotation', rot) or 0)
    return {'duration': round(float(data.get('format', {}).get('duration', 0) or 0), 2),
            'width': v.get('width'), 'height': v.get('height'), 'rotation': rot,
            'hdr': v.get('color_transfer') in ('arib-std-b67', 'smpte2084')}


def norm(word):
    return re.sub(r'[^\wáéíóúñü]', '', word.lower())


def flags_of(words, duration):
    flags = []
    if duration < 1:
        return ['duracion-menor-a-1s']  # Whisper hallucinates words on near-empty takes
    if not words:
        return ['vacia']
    if words[0]['s'] < 0.05:
        flags.append('arranca-en-el-primer-cuadro')
    for a, b in zip(words, words[1:]):
        if b['s'] - a['e'] > 0.7:
            flags.append(f"pausa-{b['s'] - a['e']:.1f}s@{b['s']}")
        if norm(a['w']) and norm(a['w']) == norm(b['w']):
            flags.append(f"repite@{b['s']}")
    for k in (2, 3):
        for i in range(len(words) - 2 * k + 1):
            x = [norm(w['w']) for w in words[i:i + k]]
            if all(x) and x == [norm(w['w']) for w in words[i + k:i + 2 * k]]:
                flags.append(f"repite-{k}-palabras@{words[i + k]['s']}")
    low = sum(1 for w in words if w['p'] < 0.4)
    if low:
        flags.append(f'{low}-palabras-dudosas')
    return flags


def scan(args):
    from faster_whisper import WhisperModel
    folder, out = Path(args.folder), batch_dir(args.folder)
    cache = out / 'transcripts'
    cache.mkdir(exist_ok=True)
    files = videos(folder)
    total = sum(p.stat().st_size for p in files)
    free = shutil.disk_usage(out).free
    model = None
    takes = []
    for p in files:
        info = probe(p)
        dst = cache / f'{p.stem}.json'
        data = read(dst)
        if data is None:
            model = model or WhisperModel(args.model, device='cpu', compute_type='int8')
            segs, _ = model.transcribe(str(p), language=args.language, vad_filter=False,
                                       word_timestamps=True, condition_on_previous_text=False)
            data = [{'w': w.word.strip(), 's': round(w.start, 2), 'e': round(w.end, 2),
                     'p': round(w.probability, 2)} for s in segs for w in (s.words or [])]
            write(dst, data)
        take = {'file': p.name, **info, 'text': ' '.join(w['w'] for w in data),
                'flags': flags_of(data, info['duration'])}
        takes.append(take)
    # A phone films every take with the same rotation; one that differs came out upside down.
    rots = [t['rotation'] for t in takes]
    usual = max(set(rots), key=rots.count) if rots else 0
    for t in takes:
        if t['rotation'] != usual:
            t['flags'].append(f"rotacion-distinta({t['rotation']})")
        print(f"{t['file']} {t['duration']}s{' HDR' if t['hdr'] else ''}"
              f" {' '.join(t['flags'])}", flush=True)
    write(out / 'takes.json', takes)
    hdr = [t for t in takes if t['hdr']]
    print(json.dumps({'takes': len(takes), 'hdr': len(hdr), 'raw_gb': round(total / 1e9, 1),
                      'free_gb': round(free / 1e9, 1), 'out': str(out / 'takes.json')}))


def target_name(entry, src):
    num = Path(src).stem
    if entry.get('skip'):
        parts = ['NO-USAR', entry.get('topic'), entry['skip']]
    else:
        parts = [entry['topic'], entry['part']]
    parts = [x for x in parts if x]
    for x in parts[1:] if parts[0] == 'NO-USAR' else parts:
        if not SLUG.match(x):
            raise SystemExit(f'{src}: "{x}" must be lowercase words joined by hyphens')
    return '_'.join(parts + [num]) + Path(src).suffix


def rename(args):
    folder, out = Path(args.folder), batch_dir(args.folder)
    entries = read(args.map)
    present = {p.name for p in videos(folder)}
    mapped = {e['file'] for e in entries}
    missing = sorted(present - mapped)
    if missing:
        raise SystemExit(f'not in the map, decide them first: {", ".join(missing)}')
    plan = [(e['file'], target_name(e, e['file'])) for e in entries if e['file'] in present]
    names = [n for _, n in plan]
    if len(set(names)) != len(names):
        raise SystemExit('two takes would get the same name; fix the map')
    log = read(out / 'renames.json', [])
    for old, new in plan:
        print(f'{old} -> {new}')
        if args.dry_run or old == new:
            continue
        if (folder / new).exists():
            raise SystemExit(f'{new} already exists; nothing overwritten')
        (folder / old).rename(folder / new)
        log.append({'from': old, 'to': new})
        write(out / 'renames.json', log)
    by_topic = {}
    for e, (_, new) in zip([e for e in entries if e['file'] in present], plan):
        if not e.get('skip'):
            by_topic.setdefault(e['topic'], []).append(new)
    write(out / 'topics.json', by_topic)
    print(json.dumps({'renamed': 0 if args.dry_run else len(plan), 'topics': len(by_topic),
                      'out': str(out / 'topics.json')}))


def undo(args):
    folder, out = Path(args.folder), batch_dir(args.folder)
    log = read(out / 'renames.json', [])
    for item in reversed(log):
        if (folder / item['to']).exists() and not (folder / item['from']).exists():
            (folder / item['to']).rename(folder / item['from'])
    write(out / 'renames.json', [])
    print(json.dumps({'restored': len(log)}))


TONEMAP = ('zscale=t=linear:npl=100,format=gbrpf32le,zscale=p=bt709,tonemap=hable:desat=0,'
           'zscale=t=bt709:m=bt709:r=tv,format=yuv420p')


def sdr(args):
    folder, out = Path(args.folder), batch_dir(args.folder)
    topics = read(out / 'topics.json')
    if topics is None:
        raise SystemExit('run rename first')
    used = [folder / n for files in topics.values() for n in files]
    todo = [p for p in used if probe(p)['hdr']]
    dest = out / 'sdr'
    dest.mkdir(exist_ok=True)
    pending = [p for p in todo if not (dest / f'{p.stem}-sdr.mp4').exists()]
    need = sum(p.stat().st_size for p in pending) * 2
    free = shutil.disk_usage(dest).free
    if need > free - args.min_free_gb * 1e9:
        raise SystemExit(f'not enough room: needs ~{need / 1e9:.0f} GB plus {args.min_free_gb} GB '
                         f'margin for the renders, '
                         f'{free / 1e9:.0f} GB free on {dest.anchor}. Ask the user where to work.')
    for p in pending:
        tmp = dest / f'{p.stem}-sdr.part.mp4'
        cmd = ['ffmpeg', '-v', 'error', '-y', '-i', str(p), '-vf', TONEMAP, '-c:v', 'libx264',
               '-crf', '16', '-preset', 'medium', '-c:a', 'aac', '-b:a', '256k',
               '-movflags', '+faststart', str(tmp)]
        if subprocess.run(cmd).returncode:
            tmp.unlink(missing_ok=True)
            raise SystemExit(f'ffmpeg failed on {p.name}')
        tmp.rename(dest / f'{p.stem}-sdr.mp4')
        print(f'{p.name} -> sdr/{p.stem}-sdr.mp4', flush=True)
    print(json.dumps({'hdr_used': len(todo), 'converted': len(pending), 'dir': str(dest)}))


def main():
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest='cmd', required=True)
    for name in ('scan', 'rename', 'undo', 'sdr'):
        p = sub.add_parser(name)
        p.add_argument('--folder', required=True)
        if name == 'scan':
            p.add_argument('--model', default='small')
            p.add_argument('--language', default='es')
        if name == 'rename':
            p.add_argument('--map', required=True)
            p.add_argument('--dry-run', action='store_true')
        if name == 'sdr':
            p.add_argument('--min-free-gb', type=float, default=20)
    args = ap.parse_args()
    {'scan': scan, 'rename': rename, 'undo': undo, 'sdr': sdr}[args.cmd](args)


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    main()
