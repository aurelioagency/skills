# Transcripcion local de dialogo con faster-whisper. No usa ninguna API paga.
#
# Uso: python transcribir.py <audio> <salida.json> [modelo]
# Detecta el idioma solo (no se fuerza) y devuelve el texto completo del dialogo.
import json
import sys

try:
    from faster_whisper import WhisperModel
except ImportError:
    sys.stderr.write("Falta faster-whisper. Instalar con: pip install faster-whisper\n")
    sys.exit(2)

if len(sys.argv) < 3:
    sys.stderr.write("Uso: python transcribir.py <audio> <salida.json> [modelo]\n")
    sys.exit(2)

audio_path, out_path = sys.argv[1], sys.argv[2]
model_size = sys.argv[3] if len(sys.argv) > 3 else "large-v3"

model = WhisperModel(model_size, device="cpu", compute_type="int8")
segments, info = model.transcribe(audio_path, language=None, vad_filter=True)

texto = " ".join(segment.text.strip() for segment in segments).strip()

data = {
    "idioma_detectado": info.language,
    "confianza_idioma": round(info.language_probability, 3),
    "duracion_seg": round(info.duration, 1),
    "texto": texto,
}

with open(out_path, "w", encoding="utf-8") as handle:
    json.dump(data, handle, ensure_ascii=False, indent=2)

# No imprimir el texto en la consola: en Windows el codepage de la terminal
# rompe acentos y puede invitar a aprobar texto que en realidad esta mal.
print(json.dumps({"ok": True, "out": out_path, "idioma": info.language}))
