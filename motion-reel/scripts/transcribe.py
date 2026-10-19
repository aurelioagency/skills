# Branch B: word-level transcript of the source video → transcript/transcript.json (whisper-style JSON).
#   python3 scripts/transcribe.py assets/source/<file> [--lang es] [--model large-v3-turbo]
# Uses faster-whisper (pip install faster-whisper): lighter than openai-whisper (no torch), same word timestamps.
# Prints one line per segment so the transcript can be read straight from the terminal.
import sys, json, os, subprocess, tempfile
from faster_whisper import WhisperModel

args = sys.argv[1:]
if not args: raise SystemExit('usage: python3 scripts/transcribe.py <video> [--lang es] [--model large-v3-turbo]')
src = args[0]
opt = lambda k, d: args[args.index(k) + 1] if k in args else d
lang, model = opt('--lang', None), opt('--model', 'large-v3-turbo')

wav = os.path.join(tempfile.mkdtemp(), 'a16k.wav')
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-vn', '-ac', '1', '-ar', '16000', wav], check=True)
m = WhisperModel(model, device='auto', compute_type='int8')
segs, info = m.transcribe(wav, language=lang, word_timestamps=True, vad_filter=True)
res = {'language': info.language, 'segments': []}
for s in segs:
    res['segments'].append({'start': s.start, 'end': s.end, 'text': s.text,
        'words': [{'word': w.word, 'start': round(w.start, 3), 'end': round(w.end, 3), 'probability': round(w.probability, 3)} for w in s.words]})
    print(f'[{s.start:6.2f}-{s.end:6.2f}] {s.text}')
os.makedirs('transcript', exist_ok=True)
json.dump(res, open('transcript/transcript.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(f'transcript/transcript.json  language {info.language}')
