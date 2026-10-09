# Opus Motion Studio — Motion Graphics con Opus 5.5

Skill para generar videos de motion graphics (lanzamientos de producto, showreels, explicativos de UI animados) usando **Opus 5.5 como generador de código**, no como modelo de video nativo. El modelo recibe texto y referencias, escribe código (HTML/SVG/Canvas, o un framework como Remotion/HyperFrames), y ese código se renderiza frame por frame con un navegador headless (Playwright) y se ensambla con ffmpeg.

El resultado depende mucho más del "harness" (reglas base, referencias, archivos de contexto persistentes) que del prompt suelto. Esta skill documenta ese harness completo:

- Reglas base fijas (render contract, look, sound, feedback loop) que se pegan siempre al arrancar.
- Una progresión de 7 niveles de prompts, de un showreel genérico a un "director's brief" completo con personajes.
- Cómo clonar el estilo visual de un video de referencia sin copiar su contenido.
- Cómo mantener consistencia de marca entre sesiones con archivos markdown persistentes.
- Cómo sincronizar la animación con sonido generado en código (beats.json).
- Un critique loop para que el modelo se autoevalúe y corrija antes de entregar.
- Cómo agregar voiceover gratis con Fish Audio (MCP).
- Cómo empaquetar un pipeline que funcionó bien para reusarlo con otra marca.

## Qué hay en esta carpeta

| Path | Para qué |
|---|---|
| [SKILL.md](SKILL.md) | La skill: flujo completo paso a paso, con gates de aprobación |
| [references/motion-studio-rules.md](references/motion-studio-rules.md) | Las 4 reglas base que se pegan siempre |
| [references/prompts.md](references/prompts.md) | Todos los prompts, de un showreel genérico al critique loop |
| [references/director-brief-template.md](references/director-brief-template.md) | Plantilla para proyectos ambiciosos con personajes/múltiples escenas |
| [references/fish-audio-setup.md](references/fish-audio-setup.md) | Setup paso a paso de voz/voiceover gratis |
| [scripts/preflight.mjs](scripts/preflight.mjs) | Chequea Node/ffmpeg/Playwright sin instalar nada solo |

> **Nota — necesita una máquina real.** Corre en Claude Code (terminal o app de escritorio). No funciona en claude.ai web: no tiene disco persistente para la carpeta del proyecto, ni puede correr Playwright/ffmpeg.

## Instalación

**Opción A — que tu agente la instale (recomendado).** Abrí Claude Code y pegá:

```text
Instalá la skill opus-motion-studio desde https://github.com/aurelioagency/skills :
1. Clonar con: git clone --filter=blob:none --sparse https://github.com/aurelioagency/skills.git en una carpeta temporal.
2. Adentro, correr: git sparse-checkout set opus-motion-studio
3. Copiar la carpeta opus-motion-studio/ a ~/.claude/skills/opus-motion-studio/
4. Borrar el clon temporal y confirmar que la skill carga.
5. Correr node opus-motion-studio/scripts/preflight.mjs y chequear Node, ffmpeg
   y Playwright. Instalar lo que falte (pidiéndome aprobación para cada comando).
6. Explicarme cómo usarla y preguntarme si arrancamos el primer video ahora.
```

**Opción B — manual.**

```powershell
git clone https://github.com/aurelioagency/skills.git
cd skills
node install-skills.mjs opus-motion-studio
```

Cualquier otro harness: apuntarlo directamente a `SKILL.md` de esta carpeta.

## Actualizar

Las mejoras quedan en este repo; la copia instalada no se actualiza sola. Para actualizarla, volver a correr el instalador — reemplaza la skill instalada y preserva la lógica de versión del repositorio:

```powershell
cd skills
git pull
node install-skills.mjs opus-motion-studio
```
