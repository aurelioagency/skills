# Final voice-over timing

Status: **GENERATED, MEASURED AND INTEGRATED**
Date: 2026-07-29

## Generation

- Provider: ElevenLabs
- Voice ID: `[configured reference voice]`
- Voice resolved by ElevenLabs: `Gustavo Voz`
- Model: `eleven_v3`
- Language: Spanish (`es`)
- Stability: `1.0` (`Robust`)
- Raw take: `voiceover/tts_[curi_20260729_024523.mp3`
- Paced master: `voiceover/voiceover_master_robust_paced.wav`

The paced master preserves the original generated performance. It is not
time-stretched. Only short PCM silence segments were inserted at semantic
boundaries so the delivery breathes naturally and the visual beats remain
readable.

## Performance prompt

The synthesis uses restrained Eleven v3 direction:

- `[curious]` for the opening question.
- `[exhales]` after the manual-editing frustration.
- `[warmly]` for the closing promise.
- Ellipses, paragraph breaks and punctuation for natural phrasing.

See `VOICEOVER_PROMPT.md` for the exact synthesis text and settings.

## Measured source take

- Raw MP3 duration: `23.12 s`
- Channels: mono
- Output encoding: MP3, 44.1 kHz, 128 kbps

Inserted pauses:

| Source boundary | Added pause |
|---:|---:|
| 3.38 s | 0.50 s |
| 7.90 s | 0.60 s |
| 10.80 s | 0.60 s |
| 14.18 s | 0.30 s |
| 16.20 s | 0.60 s |
| 17.96 s | 0.30 s |
| 19.46 s | 0.20 s |
| 22.00 s | 0.45 s |

Total added silence: `3.55 s`
Final paced master duration: `26.67 s`

## Composition timing

The master starts at composition time `00:00.25`.

| Composition time | Spoken phrase / event |
|---|---|
| 00:00.25–00:03.63 | “¿Querés que tus videos se vean así… sin animar todo a mano?” |
| 00:04.39–00:08.17 | “Diseñar captions, buscar assets y sincronizar movimientos lleva tiempo.” |
| 00:08.49–00:08.65 | Small audible exhale |
| 00:09.37–00:12.15 | “Esta introducción se construyó con el workflow que voy a compartir.” |
| 00:13.11–00:16.13 | “Y todas estas animaciones… las generé con una skill para Claude,” |
| 00:16.63–00:18.45 | “adaptable a ChatGPT o Gemini.” |
| 00:19.31–00:20.81 | “Recibís la skill con el workflow,” |
| 00:21.39–00:22.61 | “los assets y directivas” |
| 00:22.81–00:25.35 | “para personalizar color, tono y estilo de marca.” |
| 00:26.06–00:26.84 | “No empezás de cero.” |

## Integration

The same paced master is used without cropping or time-stretching in:

- `phase-7/youtube-16x9/assets/audio/voiceover_es_robust_paced.wav`
- `phase-7/reel-9x16/assets/audio/voiceover_es_robust_paced.wav`

Both compositions start it at `00:00.25` at full voice level. Semantic SFX are
kept restrained beneath the narration and were micro-retimed to the measured
words.
