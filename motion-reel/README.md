# Motion Reel — Beat-Synced Motion Graphics Made in Code

Produces motion graphics entirely in code, in one of two branches. `window.seek(t)` paints frame `t` in headless Chromium, ffmpeg encodes it, and picture + sound share one `timeline.json`.

- **Branch A — from scratch.** A product launch reel / showreel / promo. The pipeline captures a product URL's real brand assets with Playwright, writes a style guide and shotlist and **stops for your OK**, then animates with closed-form springs on a measured music beat grid.
- **Branch B — overlays on your own footage.** You hand over a video of yourself talking; the skill transcribes it (Whisper, word-level), writes an overlay plan (kinetic text cards, stat callouts, step chips — generated from what you actually say, never invented) and **stops for your OK**, then composites those overlays over your own footage with the same springs engine, timed to your speech instead of a music beat.

Both branches run the same critique loop — a fresh critic subagent scores the render against 8 criteria, fixes the worst problems, and repeats until everything is 8+ — before delivering the final MP4 in every requested format (16:9, 1:1, 4:5, 9:16).

Branch A is the kit the creator of "How to Make Insane Motion Graphics With Opus 5.5" gives away for free — brought into this repo as-is (engine, pipeline scripts, reference docs, presets, chapter prompts), not a reconstruction from the video's transcript. Branch B is built on top of that same engine (`engine/video.js`), added in this repo to cover the "I have my own talking video" case the original kit doesn't.

## What's in this folder

| Path | Purpose |
|---|---|
| [SKILL.md](SKILL.md) | The skill itself: intake → assets → style guide → beat grid → shotlist (OK gate) → build → critique loop → final render → deliver |
| [reference/RULES.md](reference/RULES.md) | House rules: render contract, look, rhythm, motion (springs), sound |
| [reference/ENGINE.md](reference/ENGINE.md) | Engine API (`window.C`, `window.TYPE`), project layout, render commands |
| [reference/AUDIO.md](reference/AUDIO.md) | Music → beat grid, SFX, Fish Audio voiceover, mix/master |
| [reference/CRITIQUE.md](reference/CRITIQUE.md) | The critic prompt — hand this to a fresh subagent after every render |
| [engine/](engine) | `core.js`, `film.js`, `type.js`, `lib/motion.js` (closed-form springs) — copied into every new project |
| [scripts/](scripts) | `init.sh`, `capture.mjs`, `music.py`, `beats.py`, `sfx.mjs`, `sync.mjs`, `mix.py`, `vo.py`, `review.py`, `render.mjs`, `preset.mjs` |
| [templates/](templates) | `brief.md`, `timeline.json`, `docs/style_guide.md`, `docs/shotlist.md`, `docs/review_log.md` |
| [presets/blank](presets/blank) | Every preset field, empty, with a comment on each one — copy it for your own brand |
| [presets/lukas-yt](presets/lukas-yt) | A worked example preset (brand, colours, font, 120 BPM, own-voice narration) |
| [prompts/](prompts) | The 14 chapter prompts this pipeline was built from, in order, plus the director's brief template and the critique scorecard — useful to read, not required to run the skill |

> **Note — needs a real machine.** Runs on Claude Code (terminal or desktop app). Not usable from claude.ai web chat: no persistent disk for the project folder, and it can't run Playwright/ffmpeg/Python there.

## Installation

**Opción A — que tu agente la instale.** Abrí Claude Code y pegá:

```text
Instalá la skill motion-reel desde https://github.com/aurelioagency/skills :
1. Clonar con: git clone --filter=blob:none --sparse https://github.com/aurelioagency/skills.git en una carpeta temporal.
2. Adentro, correr: git sparse-checkout set motion-reel
3. Copiar la carpeta motion-reel/ a ~/.claude/skills/motion-reel/
4. Dentro de ~/.claude/skills/motion-reel/, correr: npm install && npx playwright install chromium
5. Instalar las librerías de audio en Python: python -m pip install -r requirements.txt
   (si falla por "externally-managed-environment": python -m pip install --user --break-system-packages -r requirements.txt)
6. Borrar el clon temporal y confirmar que la skill carga en una sesión nueva.
7. Explicarme cómo usarla y preguntarme si arrancamos el primer video ahora.
```

**Opción B — manual.**

```powershell
git clone https://github.com/aurelioagency/skills.git
cd skills
node install-skills.mjs motion-reel
cd ..\..\.claude\skills\motion-reel   # o la ruta que corresponda
npm install
npx playwright install chromium
python -m pip install -r requirements.txt
```

## Requisitos

- Node 22+, ffmpeg, Playwright (con Chromium)
- Python 3.9+ con numpy, scipy, soundfile, librosa y pillow (`requirements.txt`)
- Los sonidos de la casa vienen incluidos en la skill (`sfx/`): se instalan con ella y cada proyecto los copia solo. No hay nada que copiar a mano.
- Solo Rama B: `faster-whisper` (incluido en `requirements.txt`), para la transcripción con timestamps por palabra (`scripts/transcribe.py`)
- Claude Code

## Actualizar

```powershell
cd skills
git pull
node install-skills.mjs motion-reel
```
`node_modules` instalado dentro de la copia (`~/.claude/skills/motion-reel/node_modules`) se preserva en la actualización.

## Créditos

Pipeline y motor originales de "Motion Reel Kit" (weekly10x.com), tal como se distribuye con la licencia del font Geist incluido (`OFL-Geist.txt` en `presets/lukas-yt/fonts`, si se usa).
