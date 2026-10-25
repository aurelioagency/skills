#!/usr/bin/env python
"""Render native-size, frame-exact silent segments with bounded local workers.

No AI calls. Owns and waits for every child; joins only verified complete segments.
Audio/subtitles/cover remain whole-film pipeline stages, so they cannot drift at joins.
"""
from __future__ import annotations

import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
import ctypes
import json
import math
import os
from pathlib import Path
import shutil
import subprocess
import sys
import time

from lib.pipeline_support import digest, file_hash, fingerprint, read_json, write_json

SIZES = {'9x16': (1080, 1920), '16x9': (1920, 1080), '1x1': (1080, 1080), '4x5': (1080, 1350)}
SCRIPTS = Path(__file__).resolve().parent


def frame_ranges(total, chunk):
    if total < 1 or chunk < 1:
        raise ValueError('Frame counts must be positive')
    return [(start, min(start + chunk, total)) for start in range(0, total, chunk)]


def available_memory():
    if os.name == 'nt':
        class Memory(ctypes.Structure):
            _fields_ = [('length', ctypes.c_ulong), ('load', ctypes.c_ulong)] + [
                (k, ctypes.c_ulonglong) for k in ('total', 'available', 'pageTotal', 'pageAvailable', 'virtualTotal', 'virtualAvailable', 'extended')]
        value = Memory(); value.length = ctypes.sizeof(value)
        if ctypes.windll.kernel32.GlobalMemoryStatusEx(ctypes.byref(value)):
            return value.available
    try:
        return os.sysconf('SC_AVPHYS_PAGES') * os.sysconf('SC_PAGE_SIZE')
    except (ValueError, OSError, AttributeError):
        return None


def worker_count(requested, segments, pixels, memory=None, cpus=None):
    cpus = cpus or os.cpu_count() or 1
    # Reserve memory for the editor/OS; 3 GiB per 4K worker, scaled conservatively.
    per_worker = max(1.5, 3 * pixels / (2160 * 3840)) * 2**30
    memory_cap = max(1, int((memory - 2 * 2**30) / per_worker)) if memory is not None else 1
    cap = min(segments, max(1, cpus // 2), memory_cap, 8)
    if requested != 'auto':
        value = int(requested)
        if value < 1:
            raise ValueError('workers must be auto or a positive integer')
        return min(value, cap)
    return min(4, cap)


def verify_segment(path, width, height, fps, frames):
    r = subprocess.run(['ffprobe', '-v', 'error', '-count_frames', '-show_streams', '-of', 'json', str(path)],
                       capture_output=True, text=True)
    if r.returncode:
        raise ValueError(f'Unreadable segment: {path}')
    streams = json.loads(r.stdout)['streams']
    v = next((s for s in streams if s['codec_type'] == 'video'), {})
    num, den = map(float, v.get('avg_frame_rate', '0/1').split('/'))
    if ((v.get('width'), v.get('height')) != (width, height) or not den or abs(num / den - fps) > .001
            or int(v.get('nb_read_frames', 0)) != frames or any(s['codec_type'] == 'audio' for s in streams)):
        raise ValueError(f'Segment must be {width}x{height}, {fps} fps, {frames} frames, silent: {path}')
    return {k: v.get(k) for k in ('codec_name', 'profile', 'pix_fmt', 'width', 'height', 'r_frame_rate', 'time_base', 'color_space', 'color_transfer', 'color_primaries')}


def run_logged(args, root, log):
    with log.open('w', encoding='utf-8') as stream:
        child = subprocess.Popen(list(map(str, args)), cwd=root, stdout=stream, stderr=subprocess.STDOUT,
                                 creationflags=0x08000000 if os.name == 'nt' else 0)
        try:
            code = child.wait()
        except BaseException:
            if os.name == 'nt':
                subprocess.run(['taskkill', '/PID', str(child.pid), '/T', '/F'], capture_output=True)
            else:
                child.terminate()
            child.wait()
            raise
    if code:
        raise RuntimeError(f'Render command failed ({code}). See {log}')


def render(root, fmt, workers='auto', segment_seconds=3, crf=16, key=None):
    root = Path(root).resolve()
    tl = read_json(root / 'timeline.json')
    fps, duration, scale = float(tl['fps']), float(tl['duration']), float(tl.get('scale', 1))
    if any(not math.isfinite(v) or v <= 0 for v in (fps, duration, scale, segment_seconds)):
        raise ValueError('Invalid fps, duration, scale or segment length')
    w, h = (round(v * scale) for v in SIZES[fmt])
    if w % 2 or h % 2:
        raise ValueError('H.264 final dimensions must be even')
    total = round(fps * duration)
    ranges = frame_ranges(total, max(1, round(segment_seconds * fps)))
    memory = available_memory()
    count = worker_count(workers, len(ranges), w * h, memory)
    if count == 1:
        # With no useful concurrency, render the entire film once: avoid repeated
        # Chromium startups, prerolls and segment encodes on constrained machines.
        ranges = [(0, total)]
    identity = dict(format=fmt, width=w, height=h, fps=fps, total=total, crf=crf, blur=1,
                    ranges=ranges, tools=fingerprint([SCRIPTS / 'render.mjs', Path(__file__)]),
                    visual=key or fingerprint([root / 'timeline.json', root / 'film', root / 'assets', root / 'beats.json']))
    directory = root / 'renders/segments' / fmt / digest(identity)
    directory.mkdir(parents=True, exist_ok=True)
    # Reject low disk before starting Chromium; compressed outputs vary by content.
    if shutil.disk_usage(directory).free < max(512 * 2**20, w * h * total * .15):
        raise ValueError('Insufficient free disk for segments and joined master; free space and retry')
    lock = root / f'manifests/render-{fmt}.lock'
    lock.parent.mkdir(parents=True, exist_ok=True)
    try:
        fd = os.open(lock, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
    except FileExistsError:
        raise ValueError(f'Render lock exists: {lock}. Check its PID before removing a stale lock.')
    with os.fdopen(fd, 'w') as f:
        f.write(str(os.getpid()))
    started = time.monotonic()
    try:
        jobs = []
        for index, (start, end) in enumerate(ranges):
            jobs.append(dict(index=index, start=start, end=end, path=directory / f'{index:04d}.mp4'))

        def one(job):
            path = job['path']; receipt = path.with_suffix('.json')
            frames = job['end'] - job['start']
            if path.exists() and receipt.exists():
                saved = read_json(receipt)
                if saved.get('sha256') == file_hash(path):
                    signature = verify_segment(path, w, h, fps, frames)
                    return dict(index=job['index'], cached=True, signature=signature)
            partial = path.with_suffix('.partial.mp4')
            run_logged(['node', SCRIPTS / 'render.mjs', '--fmt', fmt, '--final-segment',
                        '--frames', f"{job['start']},{job['end']}", '--output', partial,
                        '--fps', fps, '--blur', '1', '--crf', crf, '--threads', max(1, min(4, (os.cpu_count() or 1) // count))],
                       root, path.with_suffix('.log'))
            signature = verify_segment(partial, w, h, fps, frames)
            partial.replace(path)
            write_json(receipt, {'sha256': file_hash(path), 'start': job['start'], 'end': job['end'], 'signature': signature})
            return dict(index=job['index'], cached=False, signature=signature)

        results, failed = [], []
        with ThreadPoolExecutor(max_workers=count) as pool:
            pending = {pool.submit(one, job): job for job in jobs}
            for future in as_completed(pending):
                try:
                    results.append(future.result())
                except Exception:
                    failed.append(pending[future])
        # One serial retry per failed segment, never unlimited loops or silent quality changes.
        for job in failed:
            results.append(one(job))
        results.sort(key=lambda v: v['index'])
        if any(r['signature'] != results[0]['signature'] for r in results):
            raise ValueError('Incompatible segment streams; refusing to concatenate')
        joined = directory / 'joined.partial.mp4'
        if len(jobs) == 1:
            shutil.copy2(jobs[0]['path'], joined)
        else:
            listing = directory / 'concat.txt'
            listing.write_text(''.join(f"file '{job['path'].name}'\n" for job in jobs), encoding='utf-8')
            run_logged(['ffmpeg', '-v', 'error', '-y', '-f', 'concat', '-safe', '1', '-i', listing,
                        '-map', '0:v:0', '-c:v', 'copy', '-an', '-movflags', '+faststart', joined], root, directory / 'concat.log')
        verify_segment(joined, w, h, fps, total)
        output = root / f'renders/{fmt}.mp4'
        joined.replace(output)
        report = dict(output=str(output), width=w, height=h, fps=fps, frames=total, blur=True,
                      workers=count, segments=len(jobs), mode='parallel' if count > 1 else 'single', reused=sum(r['cached'] for r in results),
                      retried=len(failed), seconds=round(time.monotonic() - started, 3),
                      availableMemoryBytes=memory, segmentsDirectory=str(directory))
        write_json(root / f'manifests/render-final-{fmt}.json', report)
        return report
    finally:
        lock.unlink()


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--project', default='.')
    parser.add_argument('--fmt', default='9x16', choices=SIZES)
    parser.add_argument('--workers', default='auto')
    parser.add_argument('--segment-seconds', type=float, default=3)
    parser.add_argument('--crf', type=int, default=16)
    parser.add_argument('--key', help='Visual input fingerprint supplied by pipeline.py')
    args = parser.parse_args()
    print(json.dumps(render(args.project, args.fmt, args.workers, args.segment_seconds, args.crf, args.key)))
