# Fase 6 — Sound-design cue sheet

## Estado

**PASS — biblioteca auditada; no faltan efectos y no se requiere búsqueda externa.**

Este rail rige tanto YouTube 16:9 como Reel 9:16. Comparten narración, timing y eventos semánticos; sólo cambia la composición visual. Los tiempos siguen siendo provisionales hasta medir la voz final de ElevenLabs.

Biblioteca auditada:

`<local-user-root>\Documents\Playground\ASSETS\audio_sound_effect`

Índice auditado:

`<local-user-root>\Documents\Playground\ASSETS\ASSET_INDEX.md`

## Criterio de mezcla

- La voz siempre domina.
- No hay música por ahora; el diseño se apoya en voz, silencio, tactilidad y cues breves.
- Un cue por grupo semántico. Cuando se indican dos archivos en un evento, funcionan como un único sonido compuesto y no como golpes separados.
- Ticks/clicks: gain provisional `0.05–0.07`.
- Pops/locks: gain provisional `0.07–0.09`.
- Whooshes/snaps/thumps: gain provisional `0.07–0.10`.
- Chime/confirmación: gain provisional `0.06–0.08`.
- Sin paneo extremo; rail centrado y mono-compatible para reproducción móvil.
- Recortar todo tail antes de la siguiente frase si compite con consonantes o plataformas.

## Cue sheet maestro

| ID | Tiempo provisional | Evento visual/semántico | Archivo exacto | Tratamiento | Formato |
|---|---:|---|---|---|---|
| S01 | `00:00.12` | La cámara/proof entra sin tapar el primer fonema. | `whoosh_short_scene_or_text_transition.mp3` | Sólo ataque y cuerpo corto; gain `0.06`. | Ambos |
| S02 | `00:01.75` | `ASÍ` queda fijo y confirma el click. | `tick_important_word.mp3` | Un tick; gain `0.07`; tail limpio. | Ambos |
| S03 | `00:04.22` | La prueba termina de revelar timeline/capas sobre “a mano”. | `snap_timeline_cut_or_folder_open.mp3` | Recortar al snap principal; gain `0.08`. | Ambos |
| S04 | `00:04.78` | Se selecciona la primera capa de captions. | `click_soft_important_word_or_ui_lock.mp3` | Click seco; gain `0.055`. | Ambos |
| S05 | `00:05.72` | Los assets del mismo video aparecen como un grupo. | `pop_social_content_cards.mp3` | Usar como pop agrupado, no como señal social; gain `0.075`. | Ambos |
| S06 | `00:06.68–00:08.00` | Tareas, capas y playhead se acumulan hasta “lleva tiempo”. | `ratchet_repeat_rewind_action.mp3` + ataque corto de `snap_timeline_cut_or_folder_open.mp3` | Un evento compuesto: ratchet `0.055`, snap final `0.065`; terminar antes de la pausa. | Ambos |
| S07 | `00:08.42` | El editor vuelve a convertirse en la misma intro-card. | `whoosh_clean_scene_wipe.mp3` | Wipe corto; gain `0.075`; sin nuevo golpe en `10.00`. | Ambos |
| S08 | `00:10.98` | `WORKFLOW` queda identificado dentro de la card. | `tick_important_word.mp3` | Gain `0.055`; sin ticks en cada label. | Ambos |
| S09 | `00:12.38` | El breakdown termina sobre “compartir”. | `click_soft_important_word_or_ui_lock.mp3` | Lock sobrio; gain `0.055`. | Ambos |
| S10 | `00:12.72` | Todas las animaciones convergen hacia el folder. | `whoosh_fast_transition.mp3` + `impact_hero_word_or_low_thump.mp3` | Un único evento: whoosh `0.07`, thump `0.055` bajo `ANIMACIONES`. | Ambos |
| S11 | `00:14.56` | `GENERÉ` se bloquea. | `tick_important_word.mp3` | Gain `0.06`; muy debajo de voz. | Ambos |
| S12 | `00:15.63` | El folder se abre y `SKILL` queda revelado. | `snap_timeline_cut_or_folder_open.mp3` | Snap/latch principal; gain `0.085`. | Ambos |
| S13 | `00:16.37` | Claude aparece desde el sistema. | `pop_warm_ui_claude_reveal.mp3` | Pop cálido; gain `0.075`. | Ambos |
| S14 | `00:17.26` | Phrase jump de Claude hacia `adaptable`. | `whoosh_fast_transition.mp3` + `impact_hero_word_or_low_thump.mp3` | Un solo salto: whoosh `0.065`, thump `0.045`. | Ambos |
| S15 | `00:17.74` | Se abren las rutas de compatibilidad. | `click_soft_important_word_or_ui_lock.mp3` | Click suave al inicio; las rutas no reciben golpes individuales. | Ambos |
| S16 | `00:18.82` | ChatGPT llega a su slot. | `lock_phone_or_platform_card.mp3` | Lock mecánico; gain `0.075`. | Ambos |
| S17 | `00:19.57–00:20.32` | Gemini entra y completa el trío. | `chime_glass_gemini_reveal.mp3` | Ataque en `19.57`, cuerpo/tail cruza naturalmente a C1; gain `0.07`. | Ambos |
| S18 | `00:20.36` | Claude, ChatGPT y Gemini forman un solo sistema. | `confirm_three_platform_nodes.mp3` | Confirmación única; gain `0.065`. | Ambos |
| S19 | `00:21.03` | Las plataformas regresan al package: “Recibís la skill”. | `snap_timeline_cut_or_folder_open.mp3` | Lock físico corto; gain `0.075`. | Ambos |
| S20 | `00:22.18` | Sale la hoja `WORKFLOW`. | `gift_pop_object_or_section_reveal.mp3` | Un pop de documento; gain `0.07`. | Ambos |
| S21 | `00:23.49` | Timeline, cámara y Claude salen como assets del mismo video. | `pop_social_content_cards.mp3` | Un solo grupo; gain `0.07`; nada por cada card. | Ambos |
| S22 | `00:24.58` | `DIRECTIVAS` queda asentado. | `click_soft_important_word_or_ui_lock.mp3` | Gain `0.055`. | Ambos |
| S23 | `00:25.48–00:26.18` | Coral→slate y cámara coral→asset slate durante “personalizar color”. | `swipe_social_content_transition.mp3` | Recortar a un swipe sobrio; gain `0.07`; sin sparkle. | Ambos |
| S24 | `00:26.69` | `DIRECTO` cambia a `CERCANO` sobre “tono”. | `tick_important_word.mp3` | Tick editorial; gain `0.05`. | Ambos |
| S25 | `00:27.12` | Preview y Brand Board bloquean el `ESTILO DE MARCA`. | `lock_phone_or_platform_card.mp3` | Lock muy bajo; gain `0.055`. | Ambos |
| S26 | `00:29.18` | El lienzo queda completo y `CERO` se confirma. | `click_soft_important_word_or_ui_lock.mp3` | Click seco; gain `0.06`; sin thump adicional. | Ambos |
| S27 | `00:29.55–00:30.00` | Hold final. | Ninguno | Dejar morir S26; silencio limpio. | Ambos |

## Cues auditados pero no usados

- `cash_money_value_word.mp3`: no hay cue de dinero/valor explícito en este guion.
- `shutter_camera_recording_reveal.mp3`: la cámara demuestra animación, no una toma fotográfica nueva; el shutter sería demasiado literal.
- `slice_typography_split.mp3`: no hay split tipográfico que justifique el gesto.
- `sparkle_success_or_magic_reveal.mp3`: evitar lectura mágica o promesa exagerada.

## Resultado del audit

- Los `27` eventos se resuelven con efectos existentes y documentados.
- No se generó ni descargó sonido nuevo.
- No se creó documentación dentro del subfolder de audio.
- La cue sheet reemplaza las referencias de tiempo antiguas del asset index sólo para este proyecto; no modifica el uso histórico de esos archivos.
- Los tiempos exactos se micro-retimarán después de generar la voz final, nunca mediante time-stretch antinatural.
