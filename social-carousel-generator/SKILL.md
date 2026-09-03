---
name: social-carousel-generator
description: Create static social carousel packages from PDFs, URLs, YouTube videos, pasted text, screenshots, or image references. Use for TikTok or Instagram carousels, educational swipe posts, AI/tool explainers, article-to-carousel and video-to-carousel transformations, adapting existing carousels to another platform or size, and branded carousel exports that need PNG slides, editable HTML source, captions, and visual QA.
---

# Social Carousel Generator

Turn source material into a readable social carousel package for TikTok or Instagram.

Default to the static HTML screenshot workflow because it gives reliable text, layout, and export control. Use generated images, diagrams, charts, cards, and editorial visual systems as supporting imagery, but render final text in HTML/CSS.

## Los cuatro controles

Todo lo que sigue cuelga de estos cuatro. Cuando una placa sale mal, el defecto es de
uno de ellos, y el archivo donde vive el arreglo esta en la ultima columna.

| | Que exige | Donde |
|---|---|---|
| **Redaccion** | Entender el tema y recontarlo en lenguaje comun antes de disenar. Despues, cada placa expresa una idea completa y entendible por si sola. | `references/redaccion.md` |
| **Fidelidad** | Todo dato, ejemplo, comparacion o grafico sale de la fuente. Sin numeros no hay barras. Sin material no se rellena. | `references/fidelidad.md` |
| **Creatividad con limites** | El template es un sistema visual, no un guion. La composicion y el recurso varian segun la idea, sin perder familia visual ni repetir por inercia. | `references/composicion.md` |
| **Proporcion y consistencia** | Grilla compartida, arranques fijos por rol, espaciado reglado. Y una QA que mira la serie, no solo la placa. | `references/proporcion.md` |

**La regla de precedencia, que es la que se rompe mas seguido:**

> El objetivo decide el contenido. El contenido decide la estructura y la cantidad de
> placas. La estructura decide que recurso visual pide cada placa. El estilo decide solo
> como se dibuja ese recurso. **El estilo nunca decide cuantas placas hay, ni que dice
> una placa, ni que recurso aparece.**

De ahi salen las cuatro consecuencias que hay que tener a mano:

- El template define **unicamente** sistema visual: tipografias, paleta, jerarquias,
  grilla, margenes, ritmo, ilustracion y tratamiento de datos.
- La cantidad de placas la deciden el objetivo y el contenido, y la confirma el usuario.
  Una vez confirmada no se recorta por cuenta propia.
- Graficos, tablas y recursos visuales son **opcionales** y responden a datos reales del
  tema. Nunca se copian por estar presentes en una referencia.
- Cada placa tiene una funcion narrativa propia. No se recorta ni se estira el contenido
  para imitar la cantidad de placas de un ejemplo.

## Core Workflow

1. **Preset, idioma y CTA.** El tamano no se pregunta nunca (ver *Format, length and density*).
   Listo cuando: el preset activo, el idioma, el footer y el CTA estan explicitos, y el preset no tiene ningun placeholder sin llenar en las secciones que este carrusel usa.
2. **Entender la fuente y escribir la `Lectura`.**
   Listo cuando: todo el material sale de la fuente que paso el usuario y de ninguna otra (`references/fidelidad.md`), y la `Lectura` — la fuente recontada en lenguaje comun, en prosa — esta escrita **antes** de cualquier gancho o copy (`references/redaccion.md`).
3. **Arquetipo, split, ganchos y template — todo junto, y se confirma.**
   Listo cuando: se corrio el arbol de `references/content-archetypes.md` sobre la `Lectura`, y el usuario confirmo, redujo o cambio el arquetipo, la cantidad de carruseles, **la cantidad de placas**, el gancho y el template, antes de que se escriba un solo slide.
4. **Escribir la copy y elegir el recurso de cada placa. Gate de aprobacion.**
   Listo cuando: cada titular esta trazado a su frase de la `Lectura` en `srcFrase`, tiene verbo conjugado y entra en dos renglones; cada cifra tiene su `srcDato`; cada placa declara su recurso, corrido desde el contenido con `references/composicion.md`; cada placa declara su asset y las alternativas viables del banco; y el usuario aprobo todo eso **como texto plano**, antes de que exista un solo HTML.
5. **Armar el paquete y renderizar.**
   Listo cuando: la carpeta de entrega (`<tema-en-kebab-case>`) tiene los PNG ordenados a `1080x1440`, con el CTA solo si el preset lo pide.
6. **QA. Los dos scripts, y despues las placas.**
   Listo cuando: `render-and-audit.mjs` y `audit-serie.mjs` corrieron y sus red issues estan arreglados **en el fuente**; y cada PNG se abrio a tamano real y se miro, uno por uno (`references/entrega.md`). El contact sheet va al chat en cada tanda.
7. **Short vertical y musica aprobada.**
   Listo cuando: `short.mp4` sale de las placas aprobadas, el usuario vio el track ya cortado al largo del video y lo aprobo, y quedo registrado en `manifest.json` y en el log de musica de la marca.
8. **Caption y entrega.**
   Listo cuando: la carpeta tiene los PNG, `caption.txt` y `short.mp4` y nada mas; se copio al Drive de la marca si el preset lo nombra y **solo despues del si del usuario**; el fuente editable quedo en su lugar; y el mensaje termina con el bloque `bash` que abre la carpeta.

Cuando el usuario trae un carrusel ya publicado para llevarlo a otro tamano, los pasos 2 a 4 los reemplaza *Adaptation Mode*: transcripcion textual y reconstruccion fiel, nunca re-angular ni reescribir contenido ya aprobado.

## Preset Resolution

Before asking anything, list `references/*-preset.md`. That listing is the only source of truth for which brands exist — never answer "which brands are there" or "are there two presets" from memory, from filenames seen elsewhere (asset names, unrelated skills, prior conversations), or from a guess. If the user's request already names a brand, match it against that listing instead of asking.

Only if the listing does not resolve it, ask which brand the carousel is for:

`¿Para qué marca es este carrusel?`

**Never offer two names as if they were two separate options unless each has its own distinct file in that listing.** A preset's opening line may name several aliases for the same one file (see `la-casa-preset.md`: "La Casa de Aurelio, Agencia Aurelio, Aurelio" all resolve to one preset) — those are one brand, not a choice between brands. Presenting aliases of the same preset as a multi-choice question invents a distinction that is not in the file and has to be walked back later.

Then resolve the preset in this order — **never start the interview without checking first**:

1. **A preset that ships with the skill.** Look for `references/<brand-slug>-preset.md` — e.g. `references/la-casa-preset.md`. If it exists, read it and use it. Do not re-interview, and do not re-ask what the preset already answers — a preset that says how to pick its CTA has answered it, so deduce instead of asking. **This is the copy that governs**: it is versioned with the skill, so it travels to every machine and survives a reinstall.
2. **A workspace preset**, only for brands the skill does not carry: `<workspace>/social-carousels/brands/<brand-slug>/preset.md`. Read it the same way. If a brand has both, the skill's copy wins and the workspace one is stale — say so instead of silently picking one.
3. **A new brand**: run the setup interview below, and finish it by **writing that brand's preset** into `references/`.

**Presets live with the skill, in the repo.** That is deliberate: they are the document every future carousel obeys, so they belong under version control next to the code that reads them, not in a folder that exists on one machine. The consequence to respect: edit the preset **in the repo checkout** and re-run `node install-skills.mjs <skill-name>` to publish it. Editing the installed copy under `~/.claude/skills/` works until the next install, which overwrites it.

### Setup interview (new brand only)

1. Ask this bilingual language question exactly:
   `Default language is Spanish. Lenguaje es español. ¿Lo quieres cambiar o seguimos así?`
2. Do not ask for platform or size — every carousel is `1080x1440` (see Format, length and density below).
3. Ask for visual references first: URLs, screenshots, images, brand pages, or sample posts. **Derive values from them instead of asking** — pull the hex codes off the images, identify the fonts, read the footer. Ask only what the references cannot answer: palette gaps, tone, audience, footer text.
4. Ask for the brand's **font files** and copy them into the brand folder. A web font that silently falls back to a system sans is a red issue, so this cannot be left for later.
5. Ask whether to use a fixed CTA frame or generate a CTA each run. Recommend fixed. If fixed, ask for the CTA copy, the logo/brand asset and a layout reference, build the asset once in HTML at each size the brand publishes, and save it in the brand folder with its `.html` source.

Do not run a long questionnaire. When the user answers `default`, apply the recommended defaults for the active context.

### Writing the brand preset

The interview ends by filling `references/brand-preset-template.md` and saving it as:

```text
<skill>/references/<brand-slug>-preset.md   # the filled template — the copy that governs
<skill>/assets/brands/<brand-slug>/
  fonts/               # the brand's font files
  cta-<variant>.png    # fixed CTA per variant, if any
  cta.html             # the source that produced them
```

Show the filled preset to the user and get it approved before drafting slides — it is the document every future carousel of that brand will obey.

**A preset is never delivered with placeholders left in it.** Before using one — the brand's or the bundled one — scan it for unfilled `<…>` fields. Every section the carousel touches must be resolved, and two are wrong to leave open because the rest of the pipeline reads them directly: the **caption template** (the fixed blocks must be written out verbatim, or the caption cannot be assembled) and the **density budget** (either the brand's own bands, copied into `slide-data.js` as `densityBudget`, or the `density-budget` exception with its reason). If a field is still a placeholder when you need it, stop and ask the user for that value — never guess it and never fall back to another brand's.

### Editing a preset

A preset is a plain markdown file in the skill's `references/`. The user can edit it by hand, or ask for a change in the chat and the agent edits it. Either way:

- Changes apply to the **next** carousel; already-delivered packages keep the values they were built with.
- When a change contradicts something already recorded (a colour, a footer, a CTA), update the preset first and say what it means for future carousels — never let the preset and the rendered work drift apart.

**Edit it in the repo checkout, then re-install.** The installed copy under `~/.claude/skills/…` is a build output: the next `node install-skills.mjs` overwrites it. A change made only there is lost, and worse, it is lost silently — the carousel after the reinstall obeys the old values without anyone noticing.

**A preset holds brand decisions only** — palette, typography, components, CTA, caption template, asset bank. Size, carousel length and text density are skill-wide rules in Format, length and density above, identical for every brand. A preset may override one of those, but only by naming it and giving the reason; a preset that silently restates them is how the two documents start to contradict each other.

Two things a new brand must decide explicitly, because inheriting La Casa's answer is wrong:

- **The density budget.** The bands in `scripts/render-and-audit.mjs` were measured on La Casa's published set. Another brand either measures its own and updates the table, or lists `density-budget` under `layoutExceptions` with the reason in `manifest.json`. Judging a brand by another brand's density produces red issues that mean nothing.
- **The cover formula.** Which family and colour carry the headline, which different family and colour carry the twist line, and what graphic the cover uses.

## Template Resolution

Un **template** es un **sistema visual**: tipografias, paleta, grilla, margenes, ritmo, trazo, tratamiento de ilustracion y de datos. Nada mas que eso. No trae guion, no trae cantidad de placas y no trae una secuencia de contenido. Un **preset** son las decisiones de una marca sobre uno (paleta, fuentes, footer, CTA, caption). Varios presets pueden apuntar al mismo template; una marca que necesita otro layout, y no otros colores, se lleva un template nuevo.

**Lo que el template decide y lo que no**, porque es la confusion que produce carruseles copiados:

| Decide el template | No lo decide el template |
|---|---|
| Familias, pesos y roles tipograficos | Cuantas placas tiene el carrusel |
| Paleta y que significa cada acento | Que dice cada placa |
| Grilla, margenes, arranques, ritmo vertical | Que recurso visual va en cada placa |
| Grosores de linea y tratamiento de relleno | Si hay grafico, tabla o ilustracion |
| Como se dibuja un recurso, una vez elegido | Cual se elige |

La cantidad de placas sale del objetivo y del contenido, y la confirma el usuario. Los graficos, tablas y recursos visuales son opcionales y responden a datos reales del tema: **no se copian por estar presentes en una referencia.** Cada placa tiene una funcion narrativa propia; no se recorta ni se estira el contenido para imitar la cantidad de placas de un ejemplo.

Archivos de un template:

```text
assets/templates/<NN-nombre>/
  tokens.css           # identidad: familias y paleta. Lo unico que cambia por marca.
  grid.css             # grilla compartida: margenes, arranques, ritmo
  styles.css           # como se dibuja cada pieza. Importa los dos de arriba.
  index.html           # el render() del estilo
  slide-data.js        # configuracion del carrusel, con slides: []
  estilo.md            # las reglas del sistema visual
  cta-<variant>.html   # fuente del CTA, si lo tiene
  figures.js/icons.js  # libreria de ilustracion propia, si la tiene

ejemplos/<NN-nombre>/  # FUERA de la ruta de copia
  slide-data.js        # el carrusel con el que se armo el estilo
  piezas.md            # las piezas que ese render() ya dibuja
```

**El `ejemplos/` no se copia al paquete.** Es para mirar el estilo renderizado y como fixture de regresion cuando se toca el CSS. Un carrusel es evidencia de un carrusel: no dice cuantas placas soporta el estilo ni que placa corresponde a que contenido.

Templates hoy:

| # | Template | Sistema visual |
|---|---|---|
| 01 | `01-editorial-oscuro` | Campo negro con grilla de puntos, curvas de contorno y dos glows. Archivo Black / Roboto Mono / Inter / Georgia itálica. CTA como PNG fijo, dos variantes. |
| 02 | `02-editorial-oscuro-v2` | Segunda versión del mismo campo, plana: sin grilla ni curvas, un glow que rota de esquina, barra de progreso arriba. Archivo / Source Serif 4 / JetBrains Mono. CTA como slide HTML. |
| 03 | `03-cuaderno-de-taller` | Papel `#F2EFE7` con retícula de 60px. Titulares manuscritos (Architects Daughter), cuerpo Space Grotesk, rótulos JetBrains Mono. Regla de cota rombo-línea-rombo. Cuatro pasteles con borde de tinta. Tono didáctico. |
| 04 | `04-plano-en-negativo` | Campo `#101418` con retícula turquesa. Una sola familia (Space Grotesk) haciendo toda la jerarquía por peso y tamaño. Estado con punto de color en el encabezado. Tono de autoridad y prueba. |
| 05 | `05-plano-de-taller` | Papel `#EDEAE3`, Barlow Condensed en mayúsculas, relleno sólo por trama diagonal, dos grosores de línea en proporción 2:1, línea de eje como separador y cartucho ISO al pie. Trae **biblioteca de figuras** (`figures.js` / `figures.md`): 24 formas × 6 tramas, los 8 tipos de línea ISO 128-20 y simbología normalizada. |
| 06 | `06-handmade` | Papel crema `#FCEFE3`, dos manuscritas (Gochi Hand / Patrick Hand), cinco pasteles y cuatro marcas hechas con cajas de radio irregular. Trae **set de iconos** (`icons.js` / `icons.md`) y la excepcion declarada `repeticion-deliberada`: la repeticion de plantilla es parte de su identidad. |

Los seis son de La Casa de Aurelio y comparten la marca; lo que cambia es el sistema visual entero. Los 03, 04 y 05 son tres variantes de una misma estética de ingeniería, pero cada uno es un template independiente: no comparten paleta, tipografía ni componentes. Un diseño nuevo (`07-<nombre>`, …) entra como carpeta numerada nueva, nunca como variante pegada encima de los archivos de otro template.

**Un template puede traer su propia librería de ilustración**, en la misma carpeta: `figures.js` + `figures.md` en el 05, `icons.js` + `icons.md` en el 06. Es distinto del asset bank de la marca (`references/asset-bank.md`), que son PNG terminados y reutilizables: estas se dibujan en SVG al renderizar y pertenecen a un solo template, porque están hechas con las reglas de trazo de ese sistema visual.

**Every preset names which template it uses**, in its `Defaults` section (`Template: 01-editorial-oscuro`). Resolve the template from the preset, the same way the preset itself gets resolved — never ask which template unless the preset is silent about it or names more than one, and never assume a new brand wants the default just because it is the one most carousels used.

**Un template puede traer excepciones de layout de fábrica**, ya listadas en su `slide-data.js`. Son decisiones de diseño del template, no atajos: `02-editorial-oscuro-v2` trae `typography-floor`, `safe-area` y `cover-hook-centered`. No se sacan y no se agregan otras sin que el usuario lo decida. Al copiarlas al paquete, van también a `manifest.json` con su motivo, como cualquier excepción.

Starting a package copies the named template's folder, not a hardcoded path — see *Starting the package* in `references/html-rendering.md`.

## Source Intake

La fuente que te pasan es la unica fuente: el carrusel sale de ahi y de ningun otro lado.
No se busca en internet, no se traen papers, no se agregan estudios, cifras ni ejemplos
que el agente encontro por su cuenta. Si el material no da para una placa, esa placa no
existe.

Que se acepta, como se trata cada formato, que hacer con una captura que cita un estudio,
y los dos campos de trazabilidad (`srcFrase` y `srcDato`) estan en
**`references/fidelidad.md`**. Se lee antes del paso 2.

## Adaptation Mode (re-platform)

Use this mode when the user provides an existing carousel — final PNGs or an editable package — and asks to adapt it to another platform or size. This mode replaces angle extraction, the series decision, and slide drafting; everything else (rendering, QA, delivery) applies unchanged.

Scope: this mode is only for carousels that belong to the user or their brand. Screenshots of third-party carousels are never adapted or transcribed verbatim — they go through the normal creation flow as source material: extract the topic, facts, and cited sources, then write original copy in the active preset's voice. Topics and facts are free to use; another author's exact wording is not. If ownership is unclear, ask before choosing the mode.

1. Slide count, order, and content come from the original carousel. Do not propose new angles or a new split.
2. If the editable package (`index.html`, `styles.css`, `slide-data.js`) is available, adapt from source: retarget the size, reflow the layout, and re-render. Prefer this over working from PNGs.
3. From PNGs only: transcribe every slide's copy verbatim from the images and show the full transcription to the user for approval before building anything. Never paraphrase, rewrite, or "improve" already-approved content.
4. **Transcribe the copy, never the chrome.** Verbatim applies to what the slide says: headline, kicker, body, labels, captions, notes. Everything else — footer, page counter, logo, brand marks, badges, watermarks, initials, corner ornaments — comes from the active preset, even when the original PNGs clearly show something else. An element being visible in the source does not make it approved: the preset is the authority. If the original carries a brand mark the preset does not list, leave it out and tell the user you saw it.
5. Never scale, crop, stretch, or letterbox the original PNGs to the new size. Always rebuild the slides in HTML/CSS at the target size using the active preset.
6. Measure before reflowing. Run `scripts/measure-stage.mjs` against the rebuilt package to get the real height of every block per slide, then cut or expand against those numbers. Estimating block heights by eye costs two or three correction rounds on a shorter canvas.
7. If a passage cannot fit at the typography floor in the new ratio, propose the minimal copy adjustment to the user and wait for approval. Never shorten silently: this is published content.
8. Rebuild the fixed CTA at the target size following the active preset's CTA rules. **If an asset already exists at the target size, that asset is the reference** — not the other platform's artwork. Reuse its layout and change only what was asked.
9. Never carry absolute pixel proportions across aspect ratios. A block that reads correctly at 52% of width on `1080x1920` reads oversized on `1080x1440`, because the frame is 25% shorter while the block is not. What transfers between formats is the approved layout for that format, never the other format's measurements.
10. Run the full visual QA as with any new carousel. Record `"adapted_from"` with the original carousel's location in `manifest.json` and note the adaptation in `carousel-brief.md`.

In this mode the target platform is given by the request itself; do not re-ask the platform question. Confirm the brand only if it is not obvious from the original carousel.

## Series Decision

Make the best guess for whether the source should become one carousel or a short series.

Then ask for confirmation before rendering:

```text
I recommend [N] carousel(s):
1. [title] - [angle]
2. [title] - [angle]

Confirm, reduce, or change the split?
```

Include the two hook options per carousel (see Hooks), **el arquetipo narrativo** and **el template** in the same confirmation message, so archetype, split, hooks and template get approved together.

**El template se pregunta acá, y no se asume.** Es lo único del preset que no se deduce del material (ver *Template Resolution*): una marca con varios templates vigentes no tiene un "default seguro", y arrancar a componer con el equivocado tira el trabajo entero, porque cada template tiene sus propias piezas y su propia paleta. Si el pedido ya nombra uno, se usa ese y no se pregunta. Si no, va la lista de los que tiene la marca, con una línea de qué es cada uno.

Anunciar el template como supuesto —"sigo con el 01 salvo que digas otro"— **no cuenta como preguntarlo**: deja la decisión hecha y le pasa al usuario el costo de deshacerla, y arrancar con el template equivocado termina en un carrusel rehecho entero.

El arquetipo sale de correr el arbol de decision de `references/content-archetypes.md` sobre la `Lectura`. Su salida son tres lineas, y van antes del split:

```text
Arquetipo: [nombre]
Por que: [que condicion del arbol se cumplio]
Estructura: [la secuencia de ese arquetipo aplicada a este tema]
```

**El arquetipo puede fijar la cantidad de slides.** Tutorial es un paso por slide y listicle un item por slide: ahi la cuenta la da el material, no una eleccion. Si un proceso tiene 12 pasos son dos carruseles, porque el techo de 10 imagenes no se mueve.

**Antes de escribir el plan de placas, corré el test de *Las placas son las dimensiones del tema* (en *Slide Grammar*).** Un plan cuyos titulos son ejemplos de la fuente en vez de dimensiones del tema se aprueba igual de facil y se descubre recien con la copy escrita.

**State the slide count you are proposing for each carousel, and why that number** — it is part of what the user is confirming here, and it is far cheaper to change now than after the copy is drafted. Size and the text budget per slide are fixed by the skill; the count is not. See Format, length and density below.

## Format, length and density

These three are skill-wide quality rules, not brand taste. They apply to every carousel regardless of the preset. A brand may override one only by saying so explicitly in its preset, with the reason.

### One size

Every carousel is **`1080x1440` (3:4)**. There is no platform question, no TikTok variant and no `1080x1920` carousel: the same export is published to Instagram and to TikTok, which displays it fine. The delivery folder carries no size or platform suffix at all — see *La carpeta de entrega* en `references/entrega.md`.

The only `1080x1920` left in the pipeline is `short.mp4`, the vertical video, which centers the slides on the taller canvas. That is not a carousel.

### Up to 10 exported images

**The ceiling is the rule; there is no floor.**

- **Hard ceiling: 10 exported images** — at most 9 content slides plus the fixed CTA frame when the preset has one. Past that, the last slides lose most of their audience and the CTA is one of them. If the material does not fit, it is two carousels, not a longer one.
- **No minimum.** The count comes from the content: as many slides as the material actually supports, each doing one job inside the density budget. Three solid slides beat seven where four were padding. **Never invent a slide to reach a number** — that is the failure the density budget exists to prevent, arrived at from the other direction.
- **Typical, not mandatory:** an explainer built on a document, a study or a process usually lands at 6-9 content slides, because that is what it takes to separate claim from evidence. A single sharp point is often 3-4. Both are correct carousels.

The page counter counts every exported image, so 8 content slides plus CTA run `1/9` to `9/9`.

A brand whose format is more settled can declare its habitual range in its preset — that is a brand decision and it narrows the guidance, never the ceiling. Whatever the range, the actual count for a given carousel is proposed with the split and confirmed by the user before any slide is drafted.

The reason to lean long rather than short is density: more slides, each doing one job with less text on it, beats a short carousel of crowded slides. The reason not to lean too long is reach. Between the two, the content decides.

### 120 to 220 characters per content slide

Counted over all visible copy on the slide: kicker, headline, body, list items, card labels and verdict line, added together. That is roughly 20 to 36 words in Spanish.

**Count characters, not words.** Thirty short words and thirty long words do not occupy the same space, and what decides whether copy fits the canvas at the typography floor is real length. A word count reads as a budget and behaves as a guess.

- **One idea per slide, never two.** If a slide's text reads like a paragraph, it does not belong there: split it across two slides or move it to the caption.
- **Cover: 40 characters maximum per line**, counted separately for the headline and for the twist line. The limit is per line, not for the block — two lines do not fit in 40 characters, and the cover needs both.
- **Use the range; do not park at its floor.** 120-220 is a working range, not a ceiling to hover safely under. Sitting near the bottom of it on every slide is not caution, it is how a carousel comes out with slides that are 40% empty canvas — and the fix for that is more content, which is exactly what the room between the floor and the ceiling was for.
- **The upper bound is soft; the lower half is not a safe place to live.** A slide that lands somewhat over the top of the range and still reads cleanly is fine. The band exists to stop walls of text, not to be defended to the character. What decides it is the rendered slide, never the count.
- **Final check:** if a slide is not understood in 2-3 seconds of reading, it is overloaded even when it sits inside the band. And the check runs the other way too: a slide read in half a second, with most of its canvas empty, is under-built even when the count says it fits.
- **Reference carousels** (checklist, comparison, template) tolerate more density, because the goal is that people save them and come back, not that they read them at speed. Never assume it — the user declares it when confirming the split, and it is recorded in `manifest.json`.

This budget is what governs while writing. The pixel bands in `scripts/render-and-audit.mjs` stay as the safety net that catches a slide which ends up a wall or a blank after rendering.

**A character count is not a composition.** The budget measures how much someone reads; it says nothing about how much of the canvas is occupied. The same count is a full slide when it is carried by a chart, a set of cards or a list, and a near-empty one when it is four lines of prose. Treating the two as the same measure is what produces a carousel that passes the count and renders hollow.

## Estilo visual y secuencia de contenido

Dos cosas distintas que conviene no mezclar, porque mezclarlas es el defecto que produce
carruseles copiados:

| | Que es | Donde vive |
|---|---|---|
| **El estilo visual** | Paleta, tipografia, grilla, marcas y las reglas que hacen que todo lo que salga de ahi se vea de la misma familia | `assets/templates/<NN>/tokens.css`, `grid.css` y `estilo.md` |
| **El recurso de cada placa** | Que muestra esa placa: comparacion, esquema, dato destacado, secuencia, cita, checklist, metafora | `references/composicion.md` |
| **La secuencia de contenido** | Que dice cada placa y en que orden | `references/content-archetypes.md` y *Slide Grammar*, aca abajo |

**Un template es un estilo, no un molde para rellenar.** No trae un juego de placas
prearmadas donde solo se cambian las palabras: trae las reglas que dan consistencia
—que familias tipograficas, con que roles; que significa cada acento; que grosor de
linea; que margen; donde arranca cada rol— y un conjunto de piezas ya construidas.
Cada carrusel compone sus propias placas dentro de ese estilo, y si le falta una pieza
se agrega al template.

### El carrusel de ejemplo esta afuera, y no dice cuantas placas entran

El carrusel con el que se armo cada estilo vive en `ejemplos/<NN-nombre>/`, **fuera de la
ruta de copia**. El paquete arranca con `slides: []`: no hay nada que rellenar.

Que ese ejemplo tenga cuatro placas no significa que el estilo soporte cuatro. Una pieza
se repite tantas veces como haga falta. Y **una pieza que pide datos que la fuente no
tiene no cuesta una placa: se dibuja otra cosa.** Si la placa de barras necesita cifras
medidas y el articulo no publica ninguna, no se dibujan barras — la placa sigue
existiendo con el contenido que si hay, en el recurso que corresponda.

### El alcance aprobado no se reduce por tu cuenta

La cantidad de placas se confirma con el usuario en *Series Decision*, junto al arquetipo
y al gancho. **Despues de eso no se recorta**, ni por una limitacion del template, ni por
falta de material, ni por nada.

Si aparece un motivo real para acortar, se dice y decide el usuario. Entregar menos de lo
aprobado y explicar el motivo al final no es avisar: es hacerlo y despues contarlo.

### El test de la pieza forzada

**Si tuviste que inventar el contenido de un campo para que la pieza no quede vacia, la
pieza no va en esa placa.**

Es mecanico: mira lo que estas por escribir en cada campo y preguntate si sale del
material o si lo estas fabricando para llenar el hueco. El caso testigo son dos cajas
hechas para comparar dos magnitudes, llenadas con **SI** y **NO** en un carrusel que no
comparaba ninguna: dos cuadrados gigantes con una palabra adentro que no comparan nada.
El campo pedia una cifra, no habia cifra, y se le metio una palabra.

**La pieza no queda prohibida.** Esas dos cajas son correctas cuando hay dos magnitudes
que comparar. Lo que se juzga es si *esta* placa las pide, no si existen.

Y cuando la placa necesita algo que el estilo todavia no dibuja, **se agrega la pieza al
template** — la entrada en `ejemplos/<NN>/piezas.md`, el bloque en `render()`, sus clases
en `styles.css` usando solo `tokens.css` y `grid.css`. Eso es componer dentro del sistema
visual. Rellenar los campos de la pieza que vino en el ejemplo no lo es, y produce
carruseles que salen todos iguales con las palabras cambiadas.

Que recurso va en cada placa lo decide el material, corriendo el arbol de
`references/composicion.md`, y se propone en el gate de aprobacion de copy como cualquier
otra decision. Se registra en `carousel-brief.md` y en `manifest.json`.

## Slide Grammar

Es la secuencia por defecto, y vale para todo template y toda marca. Es tambien el paso 9 del arbol de `references/content-archetypes.md`: lo que se usa cuando ninguna condicion se cumple con claridad. Use this default grammar unless the source demands a different structure:

1. Hook or claim.
2. Context or problem.
3. Key insight.
4. Evidence: the number, the study, the measured result.
5. Example, framework, chart, or comparison.
6. The counter-case, limit, or caveat.
7. Practical takeaway.
8. Optional content close.

Steps 4 to 6 are where a carousel earns extra slides without padding: they split one crowded slide into the claim and the thing that backs it. If a step has nothing real to say, drop the step. A source that only supports steps 1, 3 and 7 makes a three-slide carousel, and that is a finished carousel, not a short one.

Prefer more, clearer slides over dense ones. Each slide gets one job.

### Las placas son las dimensiones del tema, no los ejemplos de la fuente

Cuando el tema es **una cosa** — un modelo, una herramienta, un producto, una tecnica, una
empresa — las placas son sus **dimensiones**: que es, que tan bueno es, que cuesta, que te
deja hacer, que riesgos tiene, que limites tiene. Los ejemplos que da la fuente son la
**evidencia que llena** esas placas. Nunca el titulo de una.

El defecto se ve asi. La fuente cuenta que el modelo encontro un bug imposible en un fondo
de inversion, diseno proteinas validadas en laboratorio y mapeo un tercio de Venus, y el
plan de placas sale `Millennium` · `Proteinas` · `Venus`. Las tres son ciertas y ninguna es
una placa de un carrusel sobre un modelo nuevo: son tres anecdotas sueltas donde tenian que
ir tres dimensiones. El que lee quiere saber si le sirve el modelo, y no encuentra donde
mirar.

La correccion es mecanica y se hace **antes de proponer el split**: agrupa cada ejemplo bajo
la dimension que prueba. El bug imposible prueba *capacidades*. Las proteinas, Venus y los
kernels prueban *investigacion cientifica*. Las tres anecdotas pasan a ser el contenido de
dos placas, y las placas se llaman por lo que el lector esta buscando.

**El test, sobre el plan de placas y antes de escribir una linea:** leé los titulos solos,
sin el contenido. Si son ejemplos — nombres propios, casos, anecdotas — falta el paso de
agrupar. Si son las preguntas que alguien se hace sobre el tema, esta bien.

Vale al reves tambien: cuando el tema **es** un caso — un cliente, un experimento, una
historia — las placas si son los momentos de ese caso. Lo que decide es que es el tema, no
que trae la fuente.

**A slide that looks empty is missing content, not size.** Add a fact from the source — the number behind the claim, the counter-case, the second experiment — or accept the air. Never fill a slide by enlarging what is already on it. Scaling type or graphics to occupy the canvas produces a slide that is bigger and says the same, and it is how a carousel drifts out of the brand: the type outgrows the headline level, the graphics turn into walls, and every later correction is about size. If the source has nothing more to say on that slide, the slide is finished at the size the content needs.

There is deliberately **no minimum fill metric**. `measure-stage.mjs` reports slack and flags overflow; it does not judge how full a slide is, because a threshold there gets chased and the chase is the defect.

## Hooks

El gancho es lo unico que hace la primera placa: frenar el scroll. Se escribe y se aprueba
antes que cualquier otra placa, y va en el mismo mensaje que el split.

El patron por default es **el tema + que es**: el setup nombra el tema tal cual, el remate
dice en una linea que es. Hay que tener un motivo concreto para no usarlo.

Los dos patrones, la estructura de las dos lineas, los criterios de calidad y el formato
del gate estan en **`references/redaccion.md`**.

## Copy Approval Gate

**El mensaje arranca con los titulares solos, en orden, y nada más.** Numerados, sin kicker, sin
bajada, sin piezas, sin assets. Recién después va el detalle placa por placa.

```text
Primero los titulares solos. Si estos no cuentan el carrusel, no hace falta leer el resto:

1. <titular de portada> — <remate>
2. <titular>
...
```

No es un resumen de cortesía: es el chequeo 3 de *Los tres chequeos* de `references/redaccion.md`, hecho donde el
usuario también lo ve. Enterrados adentro de nueve bloques completos, los titulares flojos no
se notan: nueve placas donde seis titulares no dicen nada se aprueban sin que nadie lo vea,
y el problema aparece recién cuando se los lee de corrido. Cuesta diez segundos y es el único
momento en que el defecto se ve entero.

Después de esa lista, y en el mismo mensaje, va cada placa completa como texto plano —
kicker, titular, bajada, rótulos y remate—, **con su recurso visual y su trazabilidad en la
misma entrada**. Ese es el formato, y las cuatro líneas son obligatorias:

```text
Placa 4 — COSTO POR TAREA
  Titular: Llevamos años premiando al que adivina.
  Bajada:  <...>
  srcFrase: "los benchmarks llevan años premiando al modelo que arriesga una respuesta"
  Recurso: comparación cuantitativa · por qué: la fuente publica los dos números y el punto
           de la placa es la brecha · srcDato: "43,6% frente a 34,4%" (párrafo 7)
```

- **`srcFrase` es la frase de la `Lectura` de la que se recortó el titular.** Vacía significa
  que el titular es invención y se reescribe antes de seguir. No es documentación: es el único
  chequeo que agarra el cambio de registro sin que nadie tenga que juzgar si la línea está
  buena.
- **`srcDato` es la cita textual de la fuente** para cada cifra que se muestra o se dibuja. Sin
  ella no hay barra, altura, área, proporción ni escala.
- **El recurso se elige corriendo `references/composicion.md`**, desde el contenido — no
  eligiendo una pieza del template y buscándole con qué llenar los campos. Los dos campos van a
  `slide-data.js` con esos nombres, y `audit-serie.mjs` bloquea la entrega si falta `srcFrase`.

**El recurso de cada placa es lo que más se saltea.** Una placa cuyo recurso nunca se decidió no
termina sin recurso: termina con lo que el layout deje por defecto, y un carrusel donde eso pasa
en la mayoría de las placas se renderiza como una tira de marcos casi iguales y medio vacíos. El
síntoma es inconfundible en el contact sheet e invisible en la copy, y por eso se resuelve acá,
en texto, antes de que se construya nada.

Deciding the component is also what makes the density budget reachable: prose spends the character budget without filling the canvas, while the same facts inside a component fill it and read faster. If a slide has nothing to put in a component, that is worth knowing at this gate — it usually means the slide is carrying less than it should.

**The asset plan is part of this same gate.** For every slide, show which asset from the brand's bank goes on it and **which other bank assets could also work**, so the user chooses instead of discovering the agent's pick inside a rendered image:

```text
Slide 2 — asset propuesto: personaje/tiburon-agobiado-cubierto-de-postits.png (es el slide del problema)
          tambien podrian ir: personaje/tiburon-preocupado-rascandose-la-cabeza.png · iconos/pila-de-papeles.png
Slide 4 — sin asset (el diagrama de pasos comunica mejor) · podria ir: iconos/engranajes-conectados.png
```

List every viable alternative the bank actually has for that slide's job — if there is only one candidate, or none, say that. Do not build a single slide until the user has approved copy **and** assets together; swapping an asset costs nothing at this stage and a re-render round after.

Rendering before this gate wastes work and hides copy and asset problems inside images, where they are slower to spot and slower to fix.

The copy shown here has already passed the filter in *Grounding Technical Terms* (`references/redaccion.md`): every term the argument depends on is readable on its own slide, and nothing is explained that did not need to be.

## Visual Rules

Que recurso visual va en cada placa: **`references/composicion.md`**.
Como se compone dentro de la grilla, el piso tipografico, el area segura, el balance y los
huecos: **`references/proporcion.md`**.
Como se vuelca un dato en un grafico: **`references/data-encoding.md`**.
Que imagen puede elegir el agente: **`references/asset-bank.md`**.

Las tres que no se delegan, porque son las que mas caro salen:

- **Una imagen que pasa el usuario se usa. Esa es toda la regla.** No se objeta, no se
  ofrece reemplazarla, no se redibuja y no se recolorea. Va framed segun la tabla de
  `proporcion.md` y listo.
- **Un grafico que publica la fuente se muestra, no se redibuja.**
- **No inventes convenciones.** Un color que significa "antes", una forma que significa
  "peor", un nombre para algo que la fuente deja sin nombre: es invencion aunque sea
  consistente en las nueve placas. Si hace falta una, se dice y decide el usuario.

## Documented Layout Exceptions

El layout aprobado de una marca a veces contradice una regla de esta skill. Se permite,
pero solo como decision explicita y registrada: nunca como deriva silenciosa y nunca para
callar el audit.

Una excepcion es valida cuando se cumplen las tres:

1. La decidio el usuario, en esta conversacion o en una registrada.
2. Su id esta en `slide-data.js` bajo `layoutExceptions` (o `seriesExceptions`), con un
   comentario que nombra la decision.
3. `manifest.json` lleva el mismo id con el motivo.

Ids validos, por placa: `cover-hook-centered`, `vertical-balance`, `counter-centered`,
`optical-padding`, `density-budget`, `slide-grammar`, `typography-floor`, `safe-area`,
`internal-gap`. De serie: `arranque-por-rol`, `cuerpo-por-rol`, `variedad-de-recurso`,
`recurso-consecutivo`, `icono-repetido`, `acento-consecutivo`, `fila-despoblada`,
`repeticion-deliberada`.

`typography-floor` y `safe-area` son las dos mas caras, porque bajan a nota **todos** los
avisos de su tipo — incluido el error real que se cuele entre ellos. Existen para un
template cuyo diseno se sienta deliberadamente por debajo del piso o fuera del margen, y
vienen del template, ya listadas. Nunca se agregan para que una placa terca pase, y cuando
un template las trae hay que leer las notas del reporte en vez de confiar en el exit code.

El detalle de cada chequeo esta en `references/proporcion.md`. **Nunca agregues una
excepcion por criterio propio para que un render pase.** Si una regla estorba y el usuario
no se pronuncio, se pregunta.

## Fixing a Reported Defect

When the user reports a specific problem, fix that problem and nothing else. This is the rule that is easiest to break while believing you are being helpful.

- Change one thing. If the report is "these dots are too pronounced", the deliverable is the dots — not the dots plus the logo size plus the spacing you noticed on the way.
- Adjacent findings get **named, not applied**. Say what else you saw, in one line, and let the user decide whether it is in scope. A finding you are sure about is still not a mandate.
- Watch for cascades. A change you were not asked to make often forces a second one to keep the layout working — that is the signal you already left the requested scope, not a reason to keep going.
- If the fix requires touching something else to be coherent, say so and ask first.

After any change to a fixed asset or a shared layout, prove the rest did not move: `scripts/compare-blocks.mjs` against the previous version, and report the table.

## Deriving Brand Rules From a Published Set

When extracting or updating a brand preset from already-published carousels:

1. Inspect **every** available carousel, not a convenient sample. One cover is evidence of one cover.
2. If a trait varies across the set (accent color of a line, headline case, footer style), document the variation and the rule that governs the choice. Never promote what appeared in a single example to a fixed law.
3. State measured values (hex, px, ratios) rather than adjectives, and record how they were measured.
4. Where identification is uncertain (a font from PNGs only), write the confidence and the runner-up, so a later correction is cheap.

## Render, QA y entrega

Como se arma el paquete, con que archivos y en que orden: **`references/html-rendering.md`**.
La carpeta de entrega, el Short vertical, la musica, la caption, la revision visual placa
por placa y el bloque que abre la carpeta: **`references/entrega.md`**.

Los dos scripts de QA corren siempre, y ninguno alcanza solo:

| Script | Que ve | Que NO ve |
|---|---|---|
| `render-and-audit.mjs` | Cada placa por separado: piso tipografico, area segura, balance, huecos, densidad, centrado optico | Nada que dependa de comparar placas |
| `audit-serie.mjs` | La serie: cuerpo por rol, arranque por rol, variedad de recurso, iconos repetidos, filas despobladas | El sentido, el ritmo y si la placa dice algo |

Lo que ninguno de los dos ve lo ve una persona mirando los PNG a tamano real. **`QA
automatica OK` no quiere decir que este bien**: quiere decir que ningun chequeo salto, y
los chequeos no leen.
