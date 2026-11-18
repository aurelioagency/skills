# Motion Reel — Beat-Synced Motion Graphics Made in Code

**Compatible con Codex y Claude Code, tanto para instalarla como para producir el video completo.** Claude Code conserva sus reglas de Sonnet/Opus y esfuerzo; Codex elige sus propios modelos y forma de trabajo según lo disponible. No necesitás Claude para usarla en Codex ni cambiar de agente para ejecutar el pipeline. Ver [las dos rutas de ejecución](reference/MODELS.md).

Produces motion graphics entirely in code, in one of two branches. `window.seek(t)` paints frame `t` in headless Chromium, ffmpeg encodes it, and picture + sound share one `timeline.json`.

- **Branch A — from scratch.** A product launch reel / showreel / promo. The pipeline captures a product URL's real brand assets with Playwright, writes a style guide and shotlist and **stops for your OK**, then animates with closed-form springs on a measured music beat grid.
- **Branch B — overlays on your own footage.** You hand over a video of yourself talking; the skill transcribes it (Whisper, word-level), writes an overlay plan (kinetic text cards, stat callouts, step chips — generated from what you actually say, never invented) and **stops for your OK**, then composites those overlays over your own footage with the same springs engine, timed to your speech instead of a music beat.

Both branches show the first build before creative critique. After approval, review up to three rounds, stopping when all eight criteria reach 8; repeat only for unresolved issues or changes. Branch B delivers native-resolution 9:16 footage with subtitles and cover; Branch A delivers the requested formats.

## Flujo con menos intervención del modelo

**Claude Code:** Opus 5.5 con esfuerzo alto se ocupa de la dirección, el plan, el código de animación y la revisión creativa. `scripts/pipeline.py` ejecuta la preparación, transcripción local, audio, render, subtítulos, portada y empaquetado. Guarda caché por contenido, resúmenes breves y aprobaciones vinculadas a los archivos revisados. Una corrección de audio reutiliza la captura de video.

Usá `/motion-reel` en Claude Code. El modelo y esfuerzo del frontmatter aplican al turno que invoca la skill, sujetos a disponibilidad/configuración del runtime. No se instalan agentes persistentes ni se llaman APIs pagas desde el ejecutor.

**Codex:** invocá `$motion-reel` o pedile que use la skill Motion Reel. Codex decide qué modelos, esfuerzo y organización usar, sin una equivalencia obligatoria con Sonnet u Opus. Ejecuta el mismo pipeline, escribe la animación y revisa el resultado con los mismos criterios. El frontmatter de Claude y su plugin de rescate no son requisitos para Codex.

Como punto de partida para Codex: **GPT-6.2 Sol con esfuerzo alto** para el plan y las animaciones, **Sol con esfuerzo medio** para ejecutar el pipeline y hacer ajustes habituales, y **GPT-6.1 Terra con esfuerzo medio** como apoyo opcional para revisar fotogramas. No obliga a crear subagentes ni a cambiar de modelo en cada etapa; Codex puede resolver el trabajo completo con Sol y adaptar la organización a lo disponible y al presupuesto. Ver [modelos sugeridos y tareas](reference/MODELS.md#codex).

Detalles: [flujo y configuración](reference/PIPELINE.md), [distribución de tareas y modelos](reference/MODELS.md). El reconocimiento local con Whisper también es IA, aunque no consume tokens de Claude. El ahorro total se mide con registros comparables, incluyendo subagentes:

```powershell
python scripts/usage-report.py --before <registros-anteriores> --after <registros-nuevos>
python -B -m unittest discover -s scripts/tests -v
```

Los proyectos antiguos conservan su procedimiento original; el ejecutor empieza en proyectos nuevos. Las entregas son copias independientes y la publicación conserva `.work` para reutilizar caché. No se modifican otras skills por compartir convenciones visuales.

Branch A is the kit the creator of "How to Make Insane Motion Graphics With Opus 5.5" gives away for free — brought into this repo as-is (engine, pipeline scripts, reference docs, presets, chapter prompts), not a reconstruction from the video's transcript. Branch B is built on top of that same engine (`engine/video.js`), added in this repo to cover the "I have my own talking video" case the original kit doesn't.

## What's in this folder

| Path | Purpose |
|---|---|
| [SKILL.md](SKILL.md) | The skill itself: intake → assets → style guide → beat grid → shotlist (OK gate) → build → critique loop → final render → deliver |
| [reference/RULES.md](reference/RULES.md) | House rules: render contract, look, rhythm, motion (springs), sound |
| [reference/ENGINE.md](reference/ENGINE.md) | Engine API (`window.C`, `window.TYPE`), project layout, render commands |
| [reference/AUDIO.md](reference/AUDIO.md) | Music → beat grid, SFX, Fish Audio voiceover, mix/master |
| [reference/CRITIQUE.md](reference/CRITIQUE.md) | Scoped creative review after first-look approval |
| [engine/](engine) | `core.js`, `film.js`, `type.js`, `lib/motion.js` (closed-form springs) — copied into every new project |
| [scripts/](scripts) | `init.sh`, `capture.mjs`, `music.py`, `beats.py`, `sfx.mjs`, `sync.mjs`, `mix.py`, `vo.py`, `review.py`, `render.mjs`, `preset.mjs` |
| [templates/](templates) | `brief.md`, `timeline.json`, `docs/style_guide.md`, `docs/shotlist.md`, `docs/review_log.md` |
| [presets/blank](presets/blank) | Every preset field, empty, with a comment on each one — copy it for your own brand |
| [presets/lukas-yt](presets/lukas-yt) | A worked example preset (brand, colours, font, 120 BPM, own-voice narration) |
| [prompts/](prompts) | The 14 chapter prompts this pipeline was built from, in order, plus the director's brief template and the critique scorecard — useful to read, not required to run the skill |

> **Entorno de ejecución:** funciona en Codex o Claude Code con acceso a una terminal, disco persistente y las herramientas locales de abajo. La compatibilidad es con ambos agentes; la posibilidad de instalar dependencias depende de los permisos y del entorno de la sesión. Un chat sin terminal ni entorno de ejecución no puede renderizar el video por sí solo.

## Installation

**Opción A — que tu agente la instale.** Abrí Codex o Claude Code en tu PC y pegá:

```text
Instalá la skill motion-reel desde https://github.com/aurelioagency/skills :
Es compatible con Codex y Claude Code. Usá la ruta correspondiente al agente en el que estás trabajando.
Antes de ejecutar los pasos, comprobar qué herramientas ya están instaladas y resolver solo lo que falte, según el sistema y los permisos disponibles. Node.js debe estar disponible antes de usar install-skills.mjs.
1. Clonar con: git clone --filter=blob:none --sparse https://github.com/aurelioagency/skills.git en una carpeta temporal.
2. Adentro, correr: git sparse-checkout set motion-reel
3. En Codex: node install-skills.mjs motion-reel --codex (destino ~/.codex/skills/motion-reel/).
   En Claude Code: node install-skills.mjs motion-reel (destino ~/.claude/skills/motion-reel/).
   Si el agente usa un directorio personalizado de skills, usar --dest con ese directorio.
4. Dentro de la carpeta instalada, correr: npm install y luego npx playwright install chromium
5. Instalar las librerías de audio en Python: python -m pip install -r requirements.txt
   (si falla por "externally-managed-environment": python -m pip install --user --break-system-packages -r requirements.txt)
6. Verificar al terminar Node.js, npm, Python, pip, ffmpeg, ffprobe y que Playwright puede arrancar Chromium. Si algo falla, mostrar el comando y el error exactos; no afirmar que Codex o Claude Code lo prohíben sin evidencia.
7. Borrar el clon temporal y confirmar que la skill carga en una sesión nueva.
8. Explicarme cómo usarla y preguntarme si arrancamos el primer video ahora.
```

**Opción B — manual.** Cloná el repositorio:

```powershell
git clone https://github.com/aurelioagency/skills.git
cd skills
```

En **Codex**, instalá con:

```powershell
node install-skills.mjs motion-reel --codex
Set-Location "$env:USERPROFILE\.codex\skills\motion-reel"
```

En **Claude Code**, instalá con:

```powershell
node install-skills.mjs motion-reel
Set-Location "$env:USERPROFILE\.claude\skills\motion-reel"
```

Los ejemplos de cambio de carpeta son para PowerShell en Windows. En macOS/Linux, usá `cd ~/.codex/skills/motion-reel` o `cd ~/.claude/skills/motion-reel`. Si configuraste un directorio diferente (por ejemplo, `CODEX_HOME`), instalá con `node install-skills.mjs motion-reel --dest <directorio-de-skills>` y entrá en su subcarpeta `motion-reel`.

En ambos casos, desde la carpeta instalada:

```powershell
npm install
npx playwright install chromium
python -m pip install -r requirements.txt
```

## Requisitos

- Node 22+, ffmpeg, Playwright (con Chromium)
- Python 3.9+ con numpy, scipy, soundfile, librosa y pillow (`requirements.txt`)
- Los sonidos de la casa vienen incluidos en la skill (`sfx/`): se instalan con ella y cada proyecto los copia solo. No hay nada que copiar a mano.
- Solo Rama B: `faster-whisper` y `opencv-python` (incluidos en `requirements.txt`), para la transcripción con timestamps por palabra (`scripts/transcribe-media.mjs`) y los subtítulos (`scripts/detect-shots.py`). Los subtítulos salen igual que en social-video-producer: ver `reference/SUBTITLES.md`.
- Codex o Claude Code con acceso a terminal y disco persistente. En Codex se usan sus propios modelos; las reglas de Sonnet/Opus aplican a Claude Code.

## Si no se pueden instalar las dependencias

Node.js (incluye npm), Python, FFmpeg y Playwright son herramientas del entorno local. La skill admite ambos agentes; eso no garantiza que una sesión concreta tenga red, permisos de escritura o permiso para ejecutar instaladores.

Antes de instalar, comprobá lo disponible con `node --version`, `npm --version`, `python --version`, `python -m pip --version`, `ffmpeg -version` y `ffprobe -version`. En algunos sistemas Python se invoca como `python3` o `py`; usá el comando que exista. Dentro de la skill instalada, `node -p "require.resolve('playwright')"` comprueba el paquete y este comando prueba que Chromium puede arrancar:

```powershell
node -e "require('playwright').chromium.launch({headless:true}).then(async b=>{console.log('Chromium OK');await b.close()}).catch(e=>{console.error(e.message);process.exitCode=1})"
```

Si falta algo, instalá esa dependencia con el mecanismo adecuado para el sistema y los permisos de la sesión. Si una instalación o comprobación falla, informá **el comando, el error exacto y qué paso quedó pendiente**. Distinguí entre un comando que no está en `PATH`, un fallo de descarga/red, permisos del sistema y una restricción de la sesión. No atribuyas una prohibición al autor ni al agente por el solo hecho de que falte una herramienta. Si la sesión no permite instalar, indicá el paso concreto que debe ejecutar el usuario; la skill puede copiarse y quedar instalada aunque el render quede pendiente de esas dependencias.

## Actualizar

En Claude Code:

```powershell
cd skills
git pull
node install-skills.mjs motion-reel
```

En Codex:

```powershell
cd skills
git pull
node install-skills.mjs motion-reel --codex
```

Si instalaste con `--dest`, repetí el mismo destino al actualizar. `node_modules` instalado dentro de la copia (`~/.claude/skills/motion-reel/node_modules` o `~/.codex/skills/motion-reel/node_modules`) se preserva en la actualización. Abrí una sesión nueva si el agente todavía muestra la versión anterior.

## Créditos

Pipeline y motor originales de "Motion Reel Kit" (weekly10x.com), tal como se distribuye con la licencia del font Geist incluido (`OFL-Geist.txt` en `presets/lukas-yt/fonts`, si se usa).
