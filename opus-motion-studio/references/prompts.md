# Prompts — de más simple a más ambicioso

Todos estos prompts van en inglés porque es el idioma en el que Opus 5.5 parece razonar mejor sobre motion graphics (es el idioma de las reglas base y de casi todo el material de referencia disponible). Reemplazar cualquier `[PLACEHOLDER]` con el dato real antes de enviar.

## 1. Prompt de una línea (showreel)

Sirve para calibrar el entorno sin invertir tiempo en marca — útil como primer test en un proyecto nuevo, o para mostrarle al usuario rápido qué tan bien renderiza el setup actual.

```
Make a dynamic 15 second motion graphics video that shows what an incredible motion designer you are. Like it's your showreel for resume. Go all out.
```

Por qué funciona:
- "showreel for resume" fija un género con reglas conocidas — el modelo sabe qué forma tiene ese tipo de pieza.
- "incredible motion designer" hace que muestre técnica (transiciones, tipografía, movimiento de cámara) en vez de explicar un producto.
- 15 segundos es corto para terminar en una sola pasada de render, pero largo para 6-8 planos distintos — fuerza variedad sin volverse inabarcable.
- "go all out" funciona como multiplicador de esfuerzo encima del nivel de esfuerzo ("high"/"max") ya elegido en la sesión.

Resultado esperado: buen movimiento y buena técnica, pero sin marca — va a salir con la estética por defecto del modelo (suele ser oscura, con acentos de color único). No usar este resultado como entrega final; es solo para validar el pipeline.

## 2. Con marca real, investigación automática

Para que el modelo busque los assets reales en vez de inventar un producto genérico:

```
Make a [DURATION]-second motion graphics launch video for [BRAND/PRODUCT NAME] ([URL IF AVAILABLE]).

Research the brand yourself before writing any code: use actual product screenshots, the real logo assets, and the real brand colors and typography. Do not invent a placeholder product — if you can't find a real asset, ask me for it instead of generating a stand-in that might ship by mistake.

Follow the Motion Studio Rules already given in this session.
```

## 3. Brief directo (sin investigación)

Cuando el usuario ya tiene claro qué decir sobre el producto y prefiere no depender de que el modelo investigue solo:

```
Make a [DURATION]-second motion graphics launch video for [BRAND/PRODUCT NAME].

What it does: [2-3 sentences describing the product/feature in plain language].

Use these real assets: [logo path/description, brand colors, fonts, UI screenshots — attach or reference them directly].

Follow the Motion Studio Rules already given in this session.
```

## 4. Clonar estilo de referencia

Cuando el usuario tiene un video de referencia (propio o encontrado como inspiración) y quiere ese mismo lenguaje visual aplicado a su producto, **nunca su contenido, logos ni personajes**. Es un proceso de dos pasos.

**Paso A — extraer el estilo de la referencia:**

```
This is the reference video: [PATH OR URL].

Download it and extract every frame at half-second intervals. Write a style guide markdown file (style-guide.md) that documents:
- color palette (exact hex values where possible)
- typography (typeface style, weight, size relationships)
- average shot length and how much it varies
- transition types used between shots
- camera movement patterns (push, pan, static, parallax, etc.)
- texture and grain, if any
- how text enters and exits the frame

Take only the grammar of this reference — never its content, logos, or characters. This style guide should be reusable for a completely different product.
```

**Paso B — aplicar ese estilo al producto real:**

```
Using the style guide you just wrote, create a shortlist markdown (shortlist.md) for a [DURATION]-second launch video about [BRAND/PRODUCT NAME], in that exact visual style.

Use real screenshots and real brand assets from [BRAND/PRODUCT NAME] — the reference only informs the grammar (pacing, transitions, camera, type treatment), never the subject matter.

Once I approve the shortlist, generate the code and render it, following the Motion Studio Rules already given in this session.
```

## 5. Beat grid antes de renderizar

Dentro de cualquiera de los niveles anteriores, antes de que el modelo escriba el código final, pedir el blueprint:

```
Before writing any code, show me the state list on a beat grid — a table, one row per shot, with: start time, duration, what's on screen, what enters/exits, and the camera move (if any). I'll review and adjust this before you render anything.
```

## 6. Sincronizar con sonido

Para que la animación nazca alineada al ritmo en vez de agregarle música después:

```
Score the [PROJECT NAME] film to the beat. Synthesize an original [BPM]bpm track in code on the same timeline as the picture. Measure the track programmatically and output beats.json with: bpm, beats (array of timestamps), downbeats, and hits (named sound events with timestamps).

Synthesize UI sound effects in code: a click sound on every cursor press, a whoosh on every container morph/transform, a thump on the logo reveal. Keep every sound functional — it must mark a specific visual event, never just ambience.

Then retime the visual animation to match beats.json exactly: cuts, text reveals, and transitions should land on beats or downbeats, not on arbitrary timestamps.
```

## 7. Critique loop

Correr después de cualquier render, antes de entregarlo como final:

```
Critique the render you just produced against the Motion Studio Rules given at the start of this session. Score it honestly from 1-10 in each category: composition/look, pacing and shot variety, brand fidelity, text legibility, and sound (if applicable — skip if this render has no audio).

For any category scoring below [THRESHOLD, default 7]: identify the specific frame ranges or shots responsible, fix only those, and leave everything that already scored well untouched.

Re-render only what changed, re-score, and repeat until everything is at or above [THRESHOLD] or until we've done [MAX ROUNDS, default 3] rounds — if it's still below threshold after that, stop and report exactly what's still wrong instead of attempting more blind variations.
```
