#!/usr/bin/env python
"""Make edge-frame sheets and transcribe flagged opening speech bursts locally, without deciding cuts."""
import argparse
from pathlib import Path
import subprocess

from lib.pipeline_support import read_json, write_json


def speech_bursts(pauses, limit):
    cursor, spans = 0.0, []
    for pause in sorted(pauses, key=lambda p: p['end']):
        start = max(0, pause['end'] - pause['duration'])
        if min(start, limit) - cursor > .12:
            spans.append((cursor, min(start, limit)))
        cursor = min(limit, max(cursor, pause['end']))
    if limit - cursor > .12:
        spans.append((cursor, limit))
    return spans


def main():
    from PIL import Image, ImageDraw
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--model', default='large-v3')
    parser.add_argument('--language', default='es')
    args = parser.parse_args()
    plan = read_json('manifests/takes-plan.json')
    flags = read_json('manifests/false-start-candidates.json')
    folder = Path('manifests/take-evidence'); folder.mkdir(parents=True, exist_ok=True)
    model, evidence = None, []
    for index, (take, flag) in enumerate(zip(plan['takes'], flags), 1):
        times = sorted({round(max(0, min(take['dur'] - .05, t)), 3)
                        for edge in take['keep'] for t in (edge - .6, edge - .2, edge, edge + .2)})
        tiles = []
        for k, at in enumerate(times):
            frame = folder / f'take-{index}-edge-{k}.png'
            subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', str(at), '-i', take['path'],
                            '-frames:v', '1', '-vf', 'scale=180:-2', str(frame)], check=True)
            with Image.open(frame) as source:
                tile = source.convert('RGB')
            ImageDraw.Draw(tile).text((4, 4), f'toma {index}: {at:.2f}s', fill='yellow', stroke_width=1, stroke_fill='black')
            tiles.append(tile)
        sheet = Image.new('RGB', (sum(t.width for t in tiles), max(t.height for t in tiles)))
        x = 0
        for tile in tiles:
            sheet.paste(tile, (x, 0)); x += tile.width
        sheet_path = folder / f'take-{index}-edges.png'; sheet.save(sheet_path)
        row = {**flag, 'edgeSheet': str(sheet_path), 'bursts': [], 'automaticCut': False}
        if flag['needsFalseStartReview']:
            if model is None:
                from faster_whisper import WhisperModel
                model = WhisperModel(args.model, device='cpu', compute_type='int8')
            for k, (start, end) in enumerate(speech_bursts(flag['pauses'], min(12, take['dur']))):
                wav = folder / f'take-{index}-burst-{k}.wav'
                subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', str(start), '-to', str(end),
                                '-i', take['path'], '-vn', '-ar', '16000', '-ac', '1', str(wav)], check=True)
                segments, _ = model.transcribe(str(wav), language=None if args.language == 'auto' else args.language,
                                              vad_filter=False, condition_on_previous_text=False)
                row['bursts'].append({'start': start, 'end': end, 'audio': str(wav),
                                      'text': ' '.join(s.text.strip() for s in segments)})
        evidence.append(row)
    write_json(folder / 'evidence.json', evidence)
    print(f'{folder}/evidence.json: {len(evidence)} takes; inspect flagged bursts before deciding cuts')


if __name__ == '__main__':
    main()
