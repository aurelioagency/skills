---
name: opus-motion-studio
description: Genera videos de motion graphics (lanzamientos de producto, showreels de UI, explicativos animados) usando Opus 5.5 como generador de código — no como modelo de video nativo. Usar siempre que el usuario pida un video de motion graphics, un showreel animado, animar una UI/app/logo, un video de lanzamiento de producto con animaciones tipo "Apple", o mencione estilos como los videos virales generados con Opus/Claude en X/Twitter. También usar cuando pida clonar el estilo visual de un video de referencia para aplicarlo a su propio producto, sincronizar animación con música/beat, o armar un pipeline reusable para generar este tipo de video varias veces. Propone 2-3 direcciones concretas, el usuario aprueba una, y de ahí el pipeline corre solo hasta el video final sin pedir más aprobaciones intermedias. No usar para reels/TikToks con guion hablado, avatar o captions sobre video ya filmado — para eso existe la skill social-video-producer.
---

# Opus Motion Studio

Genera videos de motion graphics escribiendo el video entero en código (HTML/SVG/Canvas, o un framework de animación) y renderizándolo con un navegador headless + ffmpeg. Opus 5.5 no genera un MP4 directamente: recibe texto y referencias, escribe código, y ese código es lo que se renderiza. El resultado final depende mucho más del "harness" (reglas, referencias, archivos de contexto) que del prompt suelto — un prompt de una línea sin contexto da el típico video genérico de IA (texto centrado + degradado).

**El punto de aprobación es uno solo: la propuesta.** Reunís lo mínimo necesario, generás 2-3 direcciones concretas, el usuario elige una (o pide ajustes), y a partir de ahí el pipeline completo — reglas, archivos de contexto si hacen falta, código, render, critique loop, audio si corresponde — corre de punta a punta sin pausar a pedir aprobación en cada paso intermedio. Solo se vuelve a interrumpir si algo falla de verdad (falta un asset de marca real, el critique loop no logra pasar el umbral después del máximo de rondas, o hace falta instalar algo).

## 0. Verificar el entorno (automático)

Correr el preflight sin pedir nada todavía:

```text
node <skill>/scripts/preflight.mjs --json
```

Chequea Node, ffmpeg y si Playwright (con Chromium headless) está instalado — es lo que renderiza frame por frame en la ruta de "código desde cero". Si falta algo, recién ahí mostrar al usuario el comando exacto (`npm install playwright && npx playwright install chromium`, o el que corresponda) y pedir confirmación antes de correrlo, salvo que ya haya dado permiso explícito para esta tarea puntual. Si todo está listo, seguir sin comentarlo.

Si el usuario pide explícitamente Remotion o HyperFrames en vez de la ruta de código puro, instalar esos conectores desde Claude Code (Settings → Connectors) antes de seguir.

## 1. Reunir lo mínimo para proponer

El objetivo es no estar yendo y viniendo en una charla larga por un solo video. Priorizar inferir sobre preguntar:

- Qué es el producto/marca: si no está dicho y no hay forma de inferirlo (ni una URL, ni un nombre, ni un archivo adjunto), es la única pregunta que realmente bloquea — hacerla sola, no junto a una lista de cinco cosas.
- Video de referencia: solo si el usuario mencionó uno o adjuntó algo. Si no lo mencionó, no preguntar — asumir que no hay referencia y seguir.
- Assets de marca reales: si no los dio, no preguntar — que el modelo los investigue solo (como en [`references/prompts.md#2-con-marca-real-investigación-automática`](references/prompts.md)), y que lo diga en la propuesta en vez de frenar a pedirlos.
- Duración: si no la da, asumir 15 segundos sin preguntar y aclararlo en la propuesta.
- Voiceover/audio: si no lo menciona, asumir que no lleva audio y aclararlo en la propuesta — no preguntar por esto de entrada.

En la gran mayoría de los casos esto significa pasar directo al paso 2 con cero preguntas, usando lo que el usuario ya dio en su pedido. Cualquier supuesto que se tome (duración, sin audio, investigar marca solo) se declara en la propuesta misma — ahí es donde el usuario lo corrige si está mal, no antes.

Crear la carpeta del proyecto en `Documents\opus-motion-studio\<slug-del-producto>\` (slug descriptivo en kebab-case, nunca `video1` ni una fecha):

```text
opus-motion-studio\<slug>\
  brief.md       <- el pedido + inputs reunidos en este paso
  references\    <- frames extraídos de la referencia, si hay; screenshots/logo de marca
  context\       <- style-guide.md, direction.md, gotchas.md (se escriben solo si la propuesta elegida los necesita)
  code\          <- el código que genera la animación
  beats.json     <- solo si la propuesta elegida pide sonido sincronizado
  render\        <- frames exportados y el mp4 final
```

## 2. Generar las propuestas

Con esos inputs, pedirle a Opus 5.5 que arme **2-3 direcciones concretas y distintas entre sí** (no variaciones menores de la misma idea) usando el prompt de [`references/prompts.md#0-generar-propuestas`](references/prompts.md). Cada propuesta es un brief corto por escrito — no código, no render todavía — que describe: el concepto/género de la pieza, la estructura de planos (cuántos, qué muestra cada uno), la dirección visual, y si incluye sonido sincronizado o personajes. Si hay un video de referencia, al menos una propuesta debe clonar su gramática visual.

Mostrarle las propuestas al usuario exactamente así, numeradas, y preguntar cuál elige (o si quiere combinar partes de varias, o ajustar algo puntual antes de aprobar). **Este es el único gate de la skill** — una vez que el usuario aprueba una dirección, seguir sin volver a preguntar hasta tener el video final o hasta un bloqueo real.

## 3. Ejecutar la propuesta elegida de punta a punta

Sin pausar entre estos sub-pasos:

1. Pegar el contenido completo de [`references/motion-studio-rules.md`](references/motion-studio-rules.md) en la conversación con Opus — siempre, no se negocia por proyecto.
2. Si la propuesta elegida clona un video de referencia, correr el procedimiento de extracción de estilo de [`references/prompts.md#4-clonar-estilo-de-referencia`](references/prompts.md) (paso A) antes de pedir el contenido final (paso B).
3. Si el proyecto es complejo (varias piezas, personajes, o la propuesta elegida lo amerita), escribir los archivos de contexto persistentes en `context\` — `style-guide.md`, `spec-list.md`, `direction.md`, `gotchas.md` — como se describe en [`references/director-brief-template.md`](references/director-brief-template.md) si hay personajes, o de forma más liviana si no. Para la mayoría de los proyectos de una sola pieza esto no hace falta: basta con el brief de la propuesta aprobada.
4. Si la propuesta incluye sonido sincronizado, aplicar el prompt de [`references/prompts.md#6-sincronizar-con-sonido`](references/prompts.md) — el código genera su propio track, mide los beats y exporta `beats.json`, y la animación se retimea contra eso.
5. Generar el código y renderizar.
6. Correr el **critique loop** ([`references/prompts.md#7-critique-loop`](references/prompts.md)) automáticamente, sin preguntar si hacerlo: puntaje por categoría, corrige lo que esté bajo el umbral (default 7/10), repite hasta pasar el umbral o hasta 3 rondas. Si después de 3 rondas sigue sin pasar, ahí sí interrumpir y mostrarle al usuario qué quedó sin resolver.
7. Si la propuesta incluye voiceover, generarlo con Fish Audio (paso 6 de esta skill) en este mismo paso, no como una pregunta aparte al final.

Entregar el resultado: el MP4 final en `render\`, mencionando brevemente qué propuesta se siguió y si el critique loop necesitó correcciones.

## 4. Proyectos ambiciosos (director's brief)

Si una de las propuestas que el usuario aprueba es del tipo "corto animado con personajes" en vez de una pieza de marketing simple, avisar **en la propuesta misma** (no después de empezar) que ese tipo de pieza suele necesitar muchas rondas de generación y corrección — el ejemplo real que inspiró esta skill tomó 163 llamadas al modelo y casi 7 horas — y usar la plantilla completa de [`references/director-brief-template.md`](references/director-brief-template.md) en el paso 3.

## 5. Critique loop

Documentado en detalle en [`references/prompts.md#7-critique-loop`](references/prompts.md). Se corre siempre, automáticamente, como parte del paso 3 — nunca como un paso que se le pregunta al usuario si quiere o no.

## 6. Audio y voz (Fish Audio, opcional)

Setup completo (crear cuenta, conectar el MCP en Claude Code, prompts de ejemplo) en [`references/fish-audio-setup.md`](references/fish-audio-setup.md). Si el usuario pidió voiceover en el paso 1, generarlo dentro del mismo paso 3 sin volver a preguntar; si no lo pidió, no ofrecerlo de más al final — ya quedó aclarado en la propuesta si el video tiene o no audio.

## 7. Empaquetar un pipeline que funcionó

Cuando un tipo de video ya funcionó bien una vez con esta skill, documentar en `opus-motion-studio\<slug-original>\pipeline.md` qué inputs variaron (marca/URL, duración, formato, audio) y qué quedó fijo (reglas base, dirección visual, estructura de la propuesta elegida). La próxima vez que el usuario pida "lo mismo pero para [otra marca]", releer ese `pipeline.md`, pedir solo los inputs que cambian, saltar directo a una única propuesta ya ajustada a ese pipeline (en vez de generar 2-3 desde cero), y ejecutar igual que el paso 3.

## Notas

- El trabajo real de "generar video" es Claude Opus 5.5 escribiendo código (HTML/SVG/Canvas, o Remotion/HyperFrames si están conectados), un navegador headless (Playwright) renderizando ese código frame por frame, y ffmpeg ensamblando los frames en un MP4.
- Nunca instalar, actualizar o conectar nada (Playwright, Remotion, HyperFrames, Fish Audio) sin mostrarle al usuario el comando exacto y esperar su confirmación, salvo que ya haya dado permiso explícito para esa tarea puntual.
- El único punto donde la skill se detiene a esperar al usuario es la elección de propuesta (paso 2), y cualquier bloqueo real (falta un asset de marca, el critique loop no cierra después de 3 rondas, falta instalar algo). Todo lo demás corre sin pausas.
- Esta skill no depende de ningún creador de contenido en particular — los ejemplos que inspiraron cada técnica son solo eso, inspiración, no parte del procedimiento ni dependencias del flujo.
