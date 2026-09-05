# Proporcion y consistencia

**Control 4 de 4.** Una grilla compartida entre placas, posiciones de arranque para cada
rol y reglas de espaciado. Lo que alinea la serie no se toca para cerrar un aviso del
audit.

Donde vive cada cosa:

| | Archivo |
|---|---|
| Margenes, arranques y ritmo de un estilo | `assets/templates/<NN>/grid.css` |
| Familias y paleta | `assets/templates/<NN>/tokens.css` |
| Chequeos por placa | `scripts/render-and-audit.mjs` |
| Chequeos de serie: cuerpo por rol, arranque por rol, variedad, filas | `scripts/audit-serie.mjs` |

Los dos scripts son necesarios y ninguno es suficiente: lo que sigue son las reglas que
gobiernan mientras se compone, y las que solo se ven mirando las placas estan en
`entrega.md`.

## Visual Rules

Use supporting imagery on every carousel:

- **Images the user supplies go on the slide as they are** — see *Images the user supplies* below. It is listed first because it outranks everything else in this section.
- **Images the agent picks come only from the brand's asset bank** — read `references/asset-bank.md`. The bank is a folder of finished PNGs (local or a git repo) whose **fully descriptive filenames are the selection mechanism**: the agent reads the names, matches them against each slide's job, opens only the shortlisted candidate to confirm, and proposes the pairing at the copy gate. Nothing fits → the slide goes without an asset, and the user is told what would have served. Never pull images from outside the bank or generate them on the fly.
- Diagrams, cards, charts, flow boards, visual metaphors, and icons built in HTML/CSS when they communicate better than an image — or always, for a brand with no bank.
- **Static icons may be sourced live from an open icon set** (Lucide, Tabler) instead of drawn in CSS, when a slide's job calls for one — see *Available rendering tools* in `references/html-rendering.md`. This is not the asset bank: nothing gets saved to a brand folder, the icon is fetched and inlined per slide, on the spot.
- **A real-data line, curve, or scaled chart may use `d3-shape`/`d3-scale`** instead of hand-picked bezier points — see the same section. Reach for it only when there are real numbers to plot; a purely illustrative shape (no data) stays hand-drawn SVG/CSS.
- Text overlays rendered in HTML/CSS, not baked into images.

### Images the user supplies

**An image the user hands over is used. That is the whole rule.** It arrives pasted into the
chat or as a path on disk; either way it goes on the slide, framed per the table below. The
asset-bank restriction in `references/asset-bank.md` governs images the *agent* chooses — it
has never governed what the user brings, and it does not gate this.

Save it into the package's `assets/` with a descriptive kebab-case filename and reference it
from `slide-data.js`, the same as any other asset.

**It does not go into the brand's asset bank, and it is not offered to.** The bank holds
reusable brand imagery — things that will serve some future carousel nobody has thought of
yet. A chart from one article, a screenshot of one dashboard, a photo of one thing belongs to
the carousel it arrived for and nowhere else. It lives in that package's `assets/` and that is
its whole life. Putting one-off material in the bank fills it with files no later carousel can
use, and every one of them still has to be read past when picking an asset.

**Do not object to it, and do not offer to replace it.**

- **Palette is not a reason.** A supplied image keeps its own colours — vendor blues, stock
  greys, a screenshot's chrome. It will not match the brand's accents and that is fine. Do
  not raise it, do not "harmonise" it, do not recolour it.
- **Neither is branding inside the image.** A published chart carrying its author's logo or
  wordmark is used with the logo. The preset's ban on logos and watermarks covers chrome the
  *agent* would add to a slide, not the contents of an image the user chose to include.
- **Never re-draw a chart the user supplied.** If they hand over the real chart, the real
  chart is what ships.

#### Framing

| What arrived | How it goes on the slide |
|---|---|
| PNG or SVG with a transparent background | Straight onto the field, no container. It has no edge, so there is nothing to frame. |
| Anything opaque — JPG, PNG with a background, screenshot, photo, a published chart | **Framed**: inside a container, inside the safe area. |

That is the whole decision, and it is already made. **Do not offer variants of it.** Rendering
the same image three ways and asking which one they like is not thoroughness — it re-opens a
question that was settled and makes the person choose again. Frame it and show the slide.

The frame is a real container, not just rounded corners: a dark panel with a thin border and a
little padding, with the image inside it. Opaque artwork usually carries a light ground of its
own, and without a container that pale rectangle sits on the field looking like it was dropped
there. The container is what makes it read as a deliberate element.

**Never bleed an opaque image to the canvas edge.** It breaks the side clearance every other
element respects, and the extra width buys nothing: text baked into an image is unreadable at
this canvas size either way (see below), so the pixels gained do not buy legibility — only a
broken margin.

**Trim the image's own dead margin before framing it, and keep the container's padding
small.** A published chart almost always arrives with generous whitespace between its own
border and the plot — measured on the CursorBench chart of 2026-09: 69 px izquierda, 67
derecha, 82 arriba, 92 abajo, sobre 2640 px de ancho. Ese aire se suma al padding del
contenedor, y el resultado es un grafico chico flotando en un recuadro grande. Se recorta al
margen real de la tinta dejando ~14 px de respiro, y el contenedor va con un padding chico
(10 px), no con un marco ancho.

Recortar el aire vacio no es re-encuadrar el grafico: no se toca ni un pixel de lo dibujado,
se saca papel en blanco. Lo que sigue prohibido es escalar, estirar, recortar contenido o
redibujar.

```python
# margen real de tinta, salteando el borde del contenedor
from PIL import Image; import numpy as np
im = Image.open(f); g = np.array(im.convert('L')); h, w = g.shape
inner = g[8:h-8, 8:w-8]
bg = int(np.bincount(inner.flatten()).argmax())
ink = inner < bg - 12
cols = np.where(ink.any(axis=0))[0]; rows = np.where(ink.any(axis=1))[0]
pad = 14
im.crop((8+cols.min()-pad, 8+rows.min()-pad, 8+cols.max()+pad+1, 8+rows.max()+pad+1)).save(f)
```

Beyond that, the ordinary rules hold: inside the safe area, never under or over text, and it
counts toward the slide's density like any other block.

**The component already exists**: `userImg(s)` in `assets/templates/01-editorial-oscuro/index.html`, with `.ext-plain` and `.ext-card` in that template's stylesheet. Set `img` on the slide, plus `imgTransparent: true` when the file has no background, and it picks the right treatment. Do not rebuild it per carousel.

#### The one thing still worth saying

Text baked into an image cannot be measured or resized, so the typography floor cannot reach
it and `render-and-audit.mjs` cannot see it — it reads the DOM, and an image is pixels.

Say it **once**, as a fact, with the measured size, and move on:

> *The axis labels in that chart land at ~10px on the final PNG; the floor for text the
> reader must read is 40px. On a 1080px canvas no scaling fixes it — the image would have to
> render about 4000px wide.*

Then stop. **It is not a red issue, it does not block delivery, and it is not a reason to
re-draw anything.**

#### The slide's text carries the point; the image shows it

This is what makes the unreadable labels stop mattering, and it is a rule, not a judgement
call. **Whatever the reader needs — the figure, who wins, what changed — goes in the slide's
own copy, at full size.** The image then shows the shape of it: which bar is tallest, how far
apart they are, what the trend does. The reader never has to decode the axis, because the
answer was already given to them in type they can read.

So a headline like `CODE QUALITY: 43.6% AGAINST 34.4%` over that chart works: the number is
already delivered, and the chart backs it up at a glance. A headline like `LOOK AT THE
DIFFERENCE` over the same chart does not, because it sends the reader into the image to find
out what the difference is — and that is where the 10px labels live.

Applied at the copy gate, this is one question per image: *if the reader could not see this
picture at all, does the slide still say what it needs to say?* Yes → the image is doing its
job. No → move the missing piece into the headline or the body. Never into the image.

**Do not invent visual conventions.** The preset is the whole vocabulary: palette, type,
components, CTA. Anything you introduce that is not in it — a colour that means "before", a
shape that means "worse", a name for something the source leaves unnamed — is invention,
even when it is consistent across the carousel and even when it looks right. It reads as
brand while it lasts, and it does not survive to the next carousel, so the set drifts.

If a carousel needs a convention the preset does not have, say so and ask. If the user
wants it, it goes into the preset and becomes a rule; otherwise the carousel works with
what the preset already provides. Never establish one silently — a convention applied
across four slides looks decided, and nobody will think to question it later.

**A chart the source publishes is shown, not redrawn.** If the source ships the figure as an image and it matters to the carousel, that image is what goes on the slide. Rebuilding it in HTML is for when there is no published chart, or when the user asks for one. Redrawing a chart the user handed over is never right.

**Before drawing a chart or diagram yourself, read `references/data-encoding.md`.** It covers what
the automated QA cannot check: one metric per chart, one colour per series, labels naming
what varies rather than what stays constant, no bar height where the source publishes no
figure, a shared baseline, and the rule that a number belongs to exactly one slide. A
miscoded chart renders cleanly and passes every check while saying something the source
does not.

Hard QA rules:

- Export every slide at `1080x1440`.
- Enforce a typography floor. On any `1080px`-wide export, every user-facing word must have a computed font size of at least `40px`. Body copy, labels, captions, sources, caveats, methodological notes, footer brand text, and swipe text are not exempt. Scale these floors proportionally when the export width is not `1080px`. Two narrow exceptions, and only these:
  - **Page counters** made entirely of numbers, and purely decorative single-character marks: `24px`.
  - **Text inside a chart or diagram** — axis titles, scale marks, position labels, legends, reference notes: `24px`. Mark the container with the class `chart` or `diagram`; the audit reads that, nothing else. This exists because a chart label at the same size as a subheading competes with it, collides with the next column, and forces the real damage: **deleting words to dodge the floor**. Shortening published copy to satisfy a size rule is worse than the rule. The exception covers the reference layer of a graphic, never the slide's own copy — headline, body, verdict, checklist, footer and CTA stay at `40px`.
- **Every content slide carries a kicker and a headline.** That is the brand grammar, and it is checked. The headline may be an actual headline or a dominant figure (a stat at `90px+` plays the same role), but a slide built as `kicker + paragraph` is a red issue: without the headline level the slide reads empty, and the easy fix is to inflate the body, which is not the fix. Exception id: `slide-grammar`.
- Never shrink text below the typography floor to make content fit. Shorten the copy, split the content across slides, reflow the layout, or remove low-value detail instead. **The kicker is reading text and has no exemption**, and neither does any other element the reader is meant to read: the only exemptions are the two listed above. Do not add a per-slide size override field (`ksize` and friends) to the slide data — a field that exists to make one long label fit becomes the way the floor gets broken everywhere else.
- Treat any user-facing word below the typography floor as a red issue that blocks delivery.
- Always center the primary hook block on the first content slide. Its bounding box must be horizontally centered in the canvas and its text must use centered alignment. A left-aligned or edge-anchored cover hook is a red issue **unless the user decides otherwise** — see Documented Layout Exceptions below.
- Balance the vertical composition. The gap above the first content pixel and the gap below the last must be within `4%` of the canvas height of each other. This is the check that catches dead space nobody meant to leave: when you remove an element, revisit every layout constant that existed to accommodate it. A stage offset that once cleared a badge keeps pushing content down long after the badge is gone. Fixed CTA assets are exempt.
- **Dos piezas que cumplen el mismo rol llevan el mismo cuerpo.** Si una placa cierra con
  un remate y otra con una línea de cierre, las dos son *la línea de cierre de una placa*:
  mismo tamaño, mismo peso, mismo interletrado. Vale igual para rótulos, bajadas y
  etiquetas de tarjeta entre piezas distintas.

  **`render-and-audit.mjs` no lo ve.** Chequea el piso tipográfico, no el sistema: dos
  piezas a 44px y 52px pasan las dos. Se mira en el contact sheet, recorriendo la misma
  fila lógica en las nueve placas — y se mira siempre, porque el síntoma es que el
  carrusel "se lee desprolijo" sin que ninguna placa esté mal por separado. Un remate a
  52px contra un cierre a 44px sobrevive nueve renders limpios.

  El arreglo va **en el template**, no en el paquete: si dos piezas del template están
  desalineadas, todo carrusel que use ese template las hereda.
- **Reparti el espacio sobrante; no lo amontones en un lugar.** El chequeo de balance vertical de arriba solo compara los extremos — el hueco sobre el primer elemento contra el hueco bajo el ultimo — asi que un slide con todo pegado arriba y abajo y un agujero en el medio le pasa con diferencia cero. El chequeo de **hueco interno** mide el vacio vertical mas largo ENTRE bloques de contenido: avisa a los `260px` y bloquea a los `280px` sobre un lienzo de 1440 (escala con el alto). Los cortes salen de inspeccion visual sobre el set publicado: `252px` se lee como aire deliberado y `290px` como agujero. Exception id: `internal-gap`.

  **El arreglo es mas contenido o menos separacion, nunca agrandar lo que ya esta** — vale la misma regla de *Slide Grammar*: un slide que se ve vacio le falta contenido, no tamanio. En la practica hay dos caminos: sumarle al slide un dato de la fuente que todavia no esta, o repartir el sobrante entre varios huecos en vez de dejarlo en uno. Un layout que empuja su pieza al fondo con `margin-top: auto` concentra todo el sobrante arriba de esa pieza; agregando `margin-bottom: auto` se parte en dos. Ojo con las margenes automaticas adyacentes: **suman**, asi que dos piezas seguidas con `auto` de los dos lados dejan el hueco del medio al doble.

- Center chrome optically, not just geometrically. Symmetric CSS padding does not produce symmetric-looking boxes: a font's line box reserves dead space above the cap height that does not exist below the baseline, and emoji carry their own side bearing. Verify pills, chips, buttons, and counters by measuring the actual background margin around the ink in the rendered PNG, then compensate with asymmetric padding or a `translateY` on the text. The correction belongs to that element's font size and box height — never copy a working `translateY` onto a different pill. `scripts/render-and-audit.mjs` measures this automatically; in the footer it is a red issue.
- Size chrome for its role. Page counters, decorative marks, and similar non-reading elements sit at `24-26px` on a `1080px`-wide export. The `40px` floor is a minimum for text the reader is meant to read, not a target for every glyph on the canvas — and a chart's reference layer is not reading text either (see the floor exceptions above).
- Keep all readable content inside a central safe area with `5%` clearance from the left and right edges and `10%` clearance from the top and bottom edges. At `1080x1440` this means `x=54..1026` and `y=144..1296`. Approved fixed CTA assets are exempt.
- Expand the composition deliberately within that safe area. Increase type, reflow visual elements, and use the available width and height before accepting large empty regions around small content. An unnecessarily small composition surrounded by avoidable empty space is a red issue.
- **A small character/mascot asset is never the only thing in its row.** A brand mascot rendered at ~20-30% of canvas height (the size that keeps it from competing with the type) leaves most of that row empty if nothing sits beside it — this has shipped as a real defect more than once. Whenever a slide places a mascot, put a real component in the same row next to it (a verdict/punch box, a stat, a short card) so the row has content across its width, not a character floating alone against a blank field. Stacking a component above or below the mascot does not fix this: the empty space the reader notices is *beside* the character, at the same height, and only something occupying that height fixes it. Check this specifically before calling a render done — it will not show up as a red issue in `render-and-audit.mjs` (ink-coverage and block-count checks are per-slide totals, not per-row), so it has to be caught by eye on the contact sheet.
- **The cover's graphic has to depict the hook, not the carousel's table of contents.** Its job is to sell the claim in the headline/twist, so it draws that claim (a before/after, a comparison, the mechanism) — never a preview of slide topics or categories that haven't been introduced yet (e.g. don't put the four use-cases from a later slide on a cover about a speed claim: they have nothing to do with the hook and read as a non-sequitur before the reader knows what they mean). If the default fan-out pattern doesn't fit what the hook is actually claiming, use a different simple graphic (a two-card comparison, a before/after) instead of forcing unrelated content into the fan-out's destination slots.

## La portada

**La portada no se compone como el resto de la serie.** Las otras placas las lee alguien
que ya decidio quedarse; la portada tiene que conseguir esa decision, y compite contra
todo lo demas del feed en la miniatura. Una portada que se compone con la misma escala y
la misma densidad que una placa de contenido no falla por fea: falla porque no se
distingue de nada.

Estas reglas valen para **cualquier template**. Como las cumple cada uno esta en su
`estilo.md`.

- **El titular es la placa.** Va sensiblemente mas grande que el titular de contenido — el
  salto tiene que verse a simple vista, no medirse. En el `05-plano-de-taller` son 220px
  contra los 112px del resto de la serie.

  **El cuerpo no es una constante del template: se mide por carrusel.** El titular crece
  hasta que la linea mas larga llena el ancho util, y ahi para — el valor que trae el CSS
  es el techo, para un titular corto. Se renderiza, se mide la linea mas larga, y ese es
  el cuerpo.

  De ahi sale la unica regla de largo que tiene la portada: **cuanto mas larga la frase,
  mas chico entra**. Un titular de tres palabras va al doble que el de contenido; uno de
  ocho, apenas mas grande, y entonces la portada dejo de distinguirse. Por eso el titular
  de portada se escribe corto — no por elegancia, porque es lo que lo deja ir grande.
  **Un titular que no entra no se achica, se acorta.**
- **La mitad de arriba del lienzo es del titular**, y el separador —regla, filete, cota,
  lo que el template use— cae en la mitad exacta. Es lo que hace que la portada se lea
  distinta de un vistazo, antes de leer una palabra.
- **El separador mide el titular**, no una fraccion arbitraria del ancho. Un filete mas
  corto que el titular lo corta por la mitad; uno del ancho del titular lo cierra. Se mide
  la linea mas larga renderizada y ese es el ancho. Si cambia el cuerpo del titular, se
  vuelve a medir.
- **La portada va centrada, incluso en templates alineados a la izquierda.** Es la
  excepcion al eje del template, y es deliberada: la portada es la unica placa que no
  pertenece a la lectura corrida. Un template cuya portada esta centrada **no necesita** la
  excepcion `cover-hook-centered` — sacala de `layoutExceptions` en vez de arrastrarla.
- **Poca informacion.** Titular, y el grafico. Nada mas es el default. Lo que la portada
  nunca lleva es un parrafo que explique el carrusel: eso es lo primero que la vuelve una
  placa de contenido mas. Sobre el remate opcional, ver *Hooks* en `references/redaccion.md`.
- **El grafico si va**, y ocupa el espacio que le queda abajo con cuerpo suficiente para
  leerse en la miniatura. Un grafico de portada compuesto como una nota al pie —cuerpo
  chico, gris, contra el borde— no aporta y ademas ensucia. Que dibuja ese grafico esta
  unas lineas mas arriba: el gancho, nunca el indice del carrusel.
- **El aire que queda no se rellena.** Sacar el parrafo deja hueco, y el hueco es correcto:
  el chequeo de `internal-gap` sigue valiendo, y si avisa, el arreglo es subir o agrandar
  el grafico — nunca devolver el parrafo ni inventar una linea para tapar el agujero.

**Esto es composicion, no copy.** Que dice la portada esta en `references/redaccion.md`;
esta seccion dice como se ve.

- Center the main information inside the canvas.
- Keep every text element fully visible.
- Keep meaningful text out of app overlay zones by enforcing the `5%` side and `10%` top/bottom safe area. Do not use a weaker overlay clearance for headlines, labels, body text, CTA copy, logos, or footers.
- Avoid overlapping cards, labels, diagrams, icons, and text.
- Avoid orphan arrows, accidental wraps, and empty gaps in process diagrams.
- Keep footer and CTA controls inside safe zones.

## Documented Layout Exceptions

A brand's approved layout sometimes contradicts a rule here. That is allowed, but only as an explicit, recorded decision — never as a silent drift and never to quiet the audit.

An exception is valid when all three are true:

1. The user decided it, in this conversation or a prior recorded one.
2. Its id is listed in `slide-data.js` under `layoutExceptions`, with a comment naming the decision and its date.
3. `manifest.json` carries the same id under `layout_exceptions`, with the reason.

Valid ids: `cover-hook-centered`, `vertical-balance`, `counter-centered`, `optical-padding`, `density-budget`, `slide-grammar`, `typography-floor`, `safe-area`. A listed exception drops that check from red issue to informational note, so the rest of the QA keeps blocking normally.

`typography-floor` and `safe-area` are the two most expensive to grant, because they drop **every** warning of their kind to a note — including the genuine mistake that slips in among them. They exist for a template whose design deliberately sits below the floor or outside the clearance (`02-editorial-oscuro-v2` uses both, plus `cover-hook-centered`), and they come from the template, already listed in its `slide-data.js`. Never add either to make one stubborn slide pass, and when a template carries them, read the report's notes instead of trusting a clean exit code.

`density-budget` is the one a new brand is most likely to need: the density bands are La Casa's, measured on its published set. A brand with a different visual weight either measures its own bands or takes this exception — see the brand preset template.

Never add an exception on your own judgment to make a render pass. If a rule is in the way and the user has not ruled on it, ask.
