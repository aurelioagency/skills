---
name: opus-motion-studio
description: Genera videos de motion graphics (lanzamientos de producto, showreels de UI, explicativos animados) usando Opus 5.5 como generador de código — no como modelo de video nativo. Usar siempre que el usuario pida un video de motion graphics, un showreel animado, animar una UI/app/logo, un video de lanzamiento de producto con animaciones tipo "Apple", o mencione estilos como los videos virales generados con Opus/Claude en X/Twitter. También usar cuando pida clonar el estilo visual de un video de referencia para aplicarlo a su propio producto, sincronizar animación con música/beat, o armar un pipeline reusable para generar este tipo de video varias veces. No usar para reels/TikToks con guion hablado, avatar o captions sobre video ya filmado — para eso existe la skill social-video-producer.
---

# Opus Motion Studio

Genera videos de motion graphics escribiendo el video entero en código (HTML/SVG/Canvas, o un framework de animación) y renderizándolo con un navegador headless + ffmpeg. Opus 5.5 no genera un MP4 directamente: recibe texto y referencias, escribe código, y ese código es lo que se renderiza. El resultado final depende mucho más del "harness" (reglas, referencias, archivos de contexto) que del prompt suelto — un prompt de una línea sin contexto da el típico video genérico de IA (texto centrado + degradado).

Esta skill documenta ese harness completo: reglas base que se pegan siempre, una progresión de prompts de más simple a más ambiciosa, cómo clonar el estilo de un video de referencia sin copiar su contenido, cómo sincronizar la animación con sonido, cómo mantener consistencia de marca entre sesiones, y cómo empaquetar un pipeline que funcionó bien para reusarlo.

## 0. Verificar el entorno

Antes de generar nada, correr el preflight:

```text
node <skill>/scripts/preflight.mjs --json
```

Chequea Node, ffmpeg y si Playwright (con el navegador Chromium headless) está instalado — es lo que renderiza frame por frame cuando el modelo elige la ruta de "código desde cero". Si falta algo, el script lo informa pero **no instala nada solo**: mostrar al usuario el comando exacto (`npm install playwright && npx playwright install chromium`, o el que corresponda) y pedir confirmación antes de correrlo, salvo que el usuario ya haya dado permiso explícito para esta tarea puntual.

Si el usuario quiere usar Remotion o HyperFrames en vez de la ruta de código puro (opcional, no es necesario para la mayoría de los casos), instalar esos conectores desde Claude Code: Settings → Connectors → buscar "Remotion" o "HyperFrames" → instalar → autenticar.

## 1. Crear el proyecto

Cada video vive en su propia carpeta bajo `Documents\opus-motion-studio\<slug-del-proyecto>\`, igual que hace `social-video-producer` — así los links que se muestran al usuario son clickeables (el harness solo hace clickeables los paths dentro del directorio de trabajo). El slug es descriptivo del producto/tema real, en kebab-case (ej. `magic-path-launch`, `showreel-aurelio`), nunca un nombre genérico como `video1` o una fecha.

```text
opus-motion-studio\<slug>\
  brief.md                 <- el pedido original + decisiones tomadas en esta sesión
  references\               <- frames extraídos de videos de referencia, screenshots de marca, logos
  context\                  <- style-guide.md, spec-list.md, direction.md, gotchas.md (paso 4)
  code\                      <- el código que genera la animación (html/js, o remotion/hyperframes)
  beats.json                 <- si hay sincronización de sonido (paso 5)
  render\                    <- frames exportados y el/los mp4 finales
```

## 2. Pegar siempre las reglas base

Al arrancar cualquier proyecto nuevo (antes del primer prompt de contenido), pegar el contenido completo de [`references/motion-studio-rules.md`](references/motion-studio-rules.md) en la conversación con Opus 5.5. Son 4 bloques de reglas — render contract, look, sound, feedback loop — que evitan el 90% de los problemas típicos (renders que no llegan a término, el look genérico de IA, silencio total, o no saber cómo iterar). No se negocian por proyecto; son la base fija de esta skill.

## 3. Elegir el nivel de ambición del pedido

Preguntarle al usuario (si no es obvio por el pedido) qué tan elaborado quiere el video, y avanzar por esta progresión — cada nivel es un gate de aprobación antes de pasar al siguiente si el usuario quiere más:

1. **Showreel genérico** (prueba rápida de calibración, sin marca): usar el prompt de [`references/prompts.md#1-prompt-de-una-línea-showreel`](references/prompts.md). Sirve para validar que el entorno renderiza bien antes de invertir tiempo en marca.
2. **Con marca real, investigación automática**: el modelo busca screenshots/logo/colores reales del producto. Ver [`references/prompts.md#2-con-marca-real-investigación-automática`](references/prompts.md).
3. **Con marca real, brief directo**: el usuario da 2-3 frases describiendo el producto en vez de dejar que el modelo investigue. Ver [`references/prompts.md#3-brief-directo`](references/prompts.md).
4. **Clonando el estilo de un video de referencia**: cuando el usuario tiene un video que le gusta visualmente (propio o de inspiración) y quiere ese mismo lenguaje visual aplicado a su producto. Ver el procedimiento completo en [`references/prompts.md#4-clonar-estilo-de-referencia`](references/prompts.md) — nunca copiar el contenido, logos o personajes de la referencia, solo su "gramática" visual.
5. **Sistema de consistencia de marca** (para proyectos con más de un video, o videos largos/complejos): escribir los archivos de contexto persistentes antes de generar código. Ver paso 4 más abajo.
6. **Sincronizado con sonido/beat**: cuando el video debe sentirse musical, con cada corte y transición cayendo sobre el ritmo. Ver paso 5 más abajo.
7. **Director's brief completo**: para el proyecto más ambicioso, con personajes, múltiples escenas y horas de iteración esperada — no es de un solo intento. Ver paso 6 más abajo.

En todos los casos, después de generar código y antes de renderizar el video final, aplicar el **critique loop** (paso 7) al menos una vez.

## 4. Consistencia de marca entre sesiones

Si el proyecto va a tener más de una pieza, o es lo bastante complejo como para que valga la pena no repetir todo el brief cada vez, pedirle a Opus 5.5 que escriba y guarde en `context\` dentro de la carpeta del proyecto:

- `style-guide.md` — paleta de colores, tipografía, duración de planos, tipos de transición, movimiento de cámara, grano/textura, cómo entra y sale el texto.
- `spec-list.md` — inventario de componentes de UI que puede necesitar animar: botones, loaders, checkmarks, charts, etc., con su estado por defecto y sus variantes.
- `direction.md` — la dirección específica de la pieza. Ejemplo real: *"Product film. UI motion. One container never cuts. Every state is the same element changing size, radius, and fill while its content swaps behind a short blur."* Si no es obvio, pedirle a Opus que proponga esta dirección a partir de la referencia o del tipo de producto, y el usuario la aprueba antes de seguir.
- `gotchas.md` — lista de cosas que el modelo no debe hacer en este proyecto (ej. "nunca usar el logo deformado", "nunca cortar a negro entre escenas").

Antes de generar el código final, pedirle a Opus que muestre el **beat grid**: una tabla frame-por-frame (o escena-por-escena) de cómo va a ser la animación, para revisar y ajustar sin haber gastado tiempo de render. Solo después de aprobar el beat grid se genera el código real.

## 5. Sincronizar con sonido

Cuando el video necesita sentirse "musical" — cada transición y cada aparición de texto cae sobre un beat — usar el prompt de [`references/prompts.md#6-sincronizar-con-sonido`](references/prompts.md). El propio código genera un track original en el bpm elegido, mide sus propios beats y los exporta a `beats.json` (bpm, beats, downbeats, hits), sintetiza sonidos de UI (click en cada click de cursor, whoosh en cada transformación de contenedor, thump en el logo), y retimea toda la animación visual contra ese JSON. Esto es más robusto que "agregar música después" porque el movimiento nace ya alineado al ritmo.

## 6. Director's brief (proyectos ambiciosos)

Para videos con personajes, múltiples escenas, o una ambición tipo "corto animado" en vez de una pieza de marketing simple, usar la plantilla completa de [`references/director-brief-template.md`](references/director-brief-template.md). Avisar al usuario de antemano: este tipo de proyecto suele necesitar **muchas rondas de generación y corrección** (el ejemplo real que inspiró esta skill tomó 163 llamadas al modelo y casi 7 horas) — no es un video de un solo prompt, y vale la pena dejarlo corriendo en background con el critique loop activo en vez de esperar un resultado final de una sola vez.

## 7. Critique loop

Después de cualquier render (sea el nivel 1 o el nivel 7), antes de entregarlo como final, correr al menos una ronda del critique loop: pedirle a Opus que se autoevalúe con un puntaje explícito por categoría (ej. composición, timing, legibilidad de texto, fidelidad a la marca, calidad de sonido — del 1 al 10), que identifique qué categorías están por debajo de un umbral (default 7/10), que las corrija, y que repita hasta que todo esté arriba del umbral o hasta un máximo de rondas acordado con el usuario. El prompt exacto está en [`references/prompts.md#7-critique-loop`](references/prompts.md).

## 8. Audio y voz (Fish Audio, opcional)

Si el video necesita un voiceover, usar **Fish Audio** vía su conector MCP en vez de una API que cobra por carácter — tienen un modelo (S2.1 Pro) gratis sin límite de uso, 83 idiomas y clonación de voz. El setup completo (crear cuenta, conectar el MCP en Claude Code, prompts de ejemplo para generar voz o clonar la del usuario) está en [`references/fish-audio-setup.md`](references/fish-audio-setup.md). Esto es un paso opcional y aparte del render visual — se puede agregar en cualquier nivel de la progresión del paso 3.

## 9. Empaquetar un pipeline que funcionó

Cuando un tipo de video (ej. "lanzamiento de producto animado para una marca") ya funcionó bien una vez con esta skill, no hace falta repetir todo el brief a mano la próxima vez. Documentar en `opus-motion-studio\<slug-original>\pipeline.md` qué inputs variables tuvo ese proyecto (marca/URL, duración, formato de salida, si tuvo sonido o voz) y qué quedó fijo (las reglas base, la dirección visual, la estructura del brief). La próxima vez que el usuario pida "lo mismo pero para [otra marca]", releer ese `pipeline.md`, pedir solo los inputs que cambian, y correr el mismo flujo de pasos 0 a 7 con esos valores — en vez de redescubrir el brief desde cero.

## Notas

- El trabajo real de "generar video" es Claude Opus 5.5 escribiendo código (HTML/SVG/Canvas, o Remotion/HyperFrames si están conectados), un navegador headless (Playwright) renderizando ese código frame por frame, y ffmpeg ensamblando los frames en un MP4. No hace falta ninguna API de "texto a video" para esta skill — eso solo entra en juego si el usuario explícitamente quiere mezclar clips generados por un modelo de imagen/video con las animaciones de código (ruta 3 de las 4 posibles, mencionada en el paso 0 de esta introducción).
- Nunca instalar, actualizar o conectar nada (Playwright, Remotion, HyperFrames, Fish Audio) sin mostrarle al usuario el comando exacto y esperar su confirmación, salvo que ya haya dado permiso explícito para esa tarea puntual.
- Esta skill no depende de ningún creador de contenido en particular — los ejemplos que inspiraron cada técnica son solo eso, inspiración, no parte del procedimiento ni dependencias del flujo.
