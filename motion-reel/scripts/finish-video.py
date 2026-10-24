#!/usr/bin/env python
"""Prepend exactly one cover frame and matching silence at the rendered resolution."""
import argparse
import json
from pathlib import Path
import subprocess

from lib.pipeline_support import probe


def finish(source, cover, output):
    source, cover, output = map(lambda p: Path(p).resolve(), (source, cover, output))
    if output in (source, cover):
        raise ValueError('Output must differ from both inputs')
    info = probe(source)
    if not info['audio'] or info['fps'] <= 0:
        raise ValueError('The final source needs video and audio')
    w, h, fps = info['width'], info['height'], info['fps']
    frame = 1 / fps
    duration = info['duration'] + frame
    output.parent.mkdir(parents=True, exist_ok=True)
    # Cover source can be a raw portrait in a different resolution. The final retains the master size.
    graph = (
        f'[0:v]scale={w}:{h}:flags=lanczos,setsar=1,fps={fps},trim=end_frame=1,setpts=PTS-STARTPTS,format=yuv420p[c];'
        '[1:v]setsar=1,setpts=PTS-STARTPTS[v];[c][v]concat=n=2:v=1:a=0[outv];'
        f'anullsrc=r=48000:cl=stereo,atrim=duration={frame},asetpts=PTS-STARTPTS[s];'
        '[1:a]aresample=48000,aformat=channel_layouts=stereo,asetpts=PTS-STARTPTS[a];'
        '[s][a]concat=n=2:v=0:a=1[outa]')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-loop', '1', '-i', str(cover), '-i', str(source),
                    '-filter_complex', graph, '-map', '[outv]', '-map', '[outa]', '-t', str(duration),
                    '-r', str(fps), '-c:v', 'libx264', '-crf', '14', '-preset', 'slow', '-pix_fmt', 'yuv420p',
                    '-c:a', 'aac', '-b:a', '320k', '-movflags', '+faststart', str(output)], check=True)
    result = probe(output)
    if (result['width'], result['height']) != (w, h) or abs(result['duration'] - duration) > max(.08, 2 / fps):
        raise ValueError('Finished video failed dimensions/duration verification')
    return result


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--input', required=True)
    parser.add_argument('--cover', required=True)
    parser.add_argument('--output', required=True)
    args = parser.parse_args()
    print(json.dumps(finish(args.input, args.cover, args.output)))
