# Word-level transcription with faster-whisper.
#
# Used by transcribe-media.mjs. Emits the transcript shape the caption tools expect:
#   { language, duration, segments: [ { start, end, text, words: [ {word,start,end,prob} ] } ] }
#
# Usage: python transcribe_words.py <audio.wav> <out.json> <model> <language>
import json
import sys

try:
    from faster_whisper import WhisperModel
except ImportError:  # pragma: no cover
    sys.stderr.write(
        "faster-whisper is required. Install it with: pip install faster-whisper\n"
    )
    sys.exit(2)

audio, out_path = sys.argv[1], sys.argv[2]
model_size = sys.argv[3] if len(sys.argv) > 3 else "large-v3"
language = sys.argv[4] if len(sys.argv) > 4 else "es"

model = WhisperModel(model_size, device="cpu", compute_type="int8")
segments, info = model.transcribe(
    audio,
    language=language,
    word_timestamps=True,
    vad_filter=False,
    beam_size=5,
)

data = {"language": info.language, "duration": info.duration, "segments": []}
for segment in segments:
    data["segments"].append(
        {
            "id": segment.id,
            "start": round(segment.start, 3),
            "end": round(segment.end, 3),
            "text": segment.text.strip(),
            "words": [
                {
                    "word": word.word.strip(),
                    "start": round(word.start, 3),
                    "end": round(word.end, 3),
                    "prob": round(word.probability, 3),
                }
                for word in (segment.words or [])
            ],
        }
    )

with open(out_path, "w", encoding="utf-8") as handle:
    json.dump(data, handle, ensure_ascii=False, indent=2)

# Never print the transcript to the console: on Windows the terminal codepage
# mangles accented Spanish and invites approving text that was never wrong.
print(json.dumps({"ok": True, "out": out_path, "segments": len(data["segments"])}))
