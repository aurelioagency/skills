# Static HTML screenshot workflow

Use this workflow when creating the editable carousel package.

## Starting the package

Do not improvise the skeleton. The active preset names its template (see *Template Resolution* in `SKILL.md`). Copy these files from `assets/templates/<NN-nombre>/` into the package:

| Archivo | Que es | Se toca |
|---|---|---|
| `tokens.css` | La identidad: familias tipograficas y paleta. | Solo al llevar el estilo a otra marca. |
| `grid.css` | La grilla compartida: margenes, arranque de cada rol, ritmo. | Nunca por carrusel. |
| `styles.css` | Como se dibuja cada pieza. Importa los dos de arriba. | Al agregarle una pieza al estilo. |
| `index.html` | El `render()` del estilo. | Al agregarle una pieza al estilo. |
| `slide-data.js` | La configuracion del carrusel, **con `slides: []`**. | Es donde se compone el carrusel. |
| `cta-*.html`, `make-cta.mjs` | Solo si el CTA hay que regenerarlo. | — |

Mas los archivos de fuente a `<package>/assets/fonts/`.

**El paquete arranca sin placas, y eso es a proposito.** `slides` viene vacio porque las placas de este carrusel todavia no existen: se componen desde el contenido, corriendo `references/composicion.md` placa por placa en el gate de aprobacion de copy. No hay nada que rellenar.

**El carrusel con el que se armo cada estilo esta en `ejemplos/<NN-nombre>/slide-data.js`, fuera de la ruta de copia.** Sirve para ver el estilo renderizado y como fixture de regresion cuando se toca el CSS. No se copia al paquete y no dice cuantas placas entran: es un carrusel, no la capacidad del estilo.

`tokens.css` y `grid.css` son la razon por la que la serie se ve alineada y de la misma familia. Un hex escrito a mano en el `styles.css` de un paquete, o una altura de arranque cambiada para que una placa entre, son errores: rompen la consistencia que esos dos archivos existen para garantizar.

**Si la marca no es La Casa pero usa un template existente**, el encabezado de `tokens.css` lista lo que hay que cambiar antes del primer render: el bloque `@font-face` mas los archivos de fuente de la marca, la paleta entera del `:root`, `footerBrand` / `footerSwipe` en `slide-data.js`, las dos familias y los dos colores de la portada, el asset de CTA, y las bandas de densidad (o la excepcion `density-budget`). Todo eso sale del `preset.md` de esa marca, nunca de este archivo ni de los valores de La Casa. Una marca que necesita otro layout, y no otros colores, se lleva su propio template numerado.

## Files

Create:

- `index.html`: reads query params such as `?carousel=<key>&slide=<n>`.
- `styles.css`: all visual system and platform-size layout.
- `slide-data.js`: structured slide data.
- `manifest.json`: platform, size, slide order, CTA status, source, and export directories.
- `carousel-brief.md`: source, angle decisions, slide plan, caveats.
- `caption.txt` inside the delivery folder: the caption, plain text, nothing else in the file.

## Available rendering tools

Hand-drawn SVG/CSS stays the default for illustrative shapes (no real numbers behind them) and
for anything already covered by an existing component in `styles.css`. These are the tools
allowed **in addition**, for the cases below — never installed via `npm`, never a build step,
just a file dropped in the package or markup pasted inline, the same way the brand's fonts and
CTA assets already work.

**Charts with real, plotted data — `d3-shape` + `d3-scale`.** Use these two modules only (not
full D3) when a slide plots real numbers along a line, curve, or scale: they compute the pixel
math (`d3.scaleLinear`, `d3.scaleLog`) and the curve interpolation (`d3.line().curve(d3.curveCatmullRom)`
or `d3.curveNatural`) instead of hand-picked bezier control points, which is where manual charts
go wrong (a curve that looks "off," an axis that doesn't line up with its ticks). Vendor the
built file locally — `d3-shape` and `d3-scale` together are a few KB minified — into
`<package>/assets/vendor/d3-shape-scale.min.js` and load it with a plain `<script>` tag; do not
fetch it from a CDN at render time, for the same reason fonts are never loaded remotely (a
render has to be identical on any machine, offline included). D3 outputs SVG, so it drops
straight into the existing `.chart`/`.diagram` container and the screenshot pipeline sees it the
same as any other inline SVG — no animation, no timing to wait on.

**Do not reach for `Chart.js` for slides that get screenshotted.** It draws to `<canvas>`, and by
default animates the draw-in; a screenshot taken before that animation settles captures a
half-drawn chart, so every use requires disabling animation and confirming the canvas painted
before Playwright captures the frame. If a request specifically needs `Chart.js` (an interactive
preview outside this pipeline, for instance), it is available the same way — vendored locally,
no CDN — but it is not the default reach for a static PNG export the way `d3-shape`/`d3-scale`
is.

**Static icons — Lucide or Tabler, fetched and inlined per slide.** Neither needs installing.
Open the icon set's own site (lucide.dev, tabler.io/icons), find the icon that matches the
slide's job, copy its raw `<svg>` markup, and paste it inline in that slide's HTML — the same
way the cover's fan-out graphic or the background contours are inline SVG already. Set
`stroke="currentColor"` (both sets ship stroke-based icons) and drive the colour from CSS
(`color: var(--terracotta)` on the wrapping element) so it follows the slide's accent instead of
carrying a hardcoded colour. **This is not the asset bank** — `references/asset-bank.md` governs
the agent's own choice of *raster images*; a vector icon fetched live for one slide is picked in
context, used once, and never saved to a brand folder. If a brand's preset wants a fixed
stroke-width or corner style for consistency across its carousels, that preference lives in the
brand's `preset.md`; which icon set is available at all is a skill-wide capability, not a brand
decision.

## Rendering

Start a local server from the package folder:

```powershell
python -m http.server 8765 --bind 127.0.0.1
```

Use Playwright or an available Chromium browser to capture each slide at the target viewport. Prefer installed Chrome if bundled Playwright browsers are missing.

Use `deviceScaleFactor: 1` and the only viewport size: `1080x1440` (3:4). Carousels have one size — see *Format, length and density* in `SKILL.md`. The `1080x1920` viewport belongs to `short.mp4`, not to slides.

Write the PNGs straight into the delivery folder, named `<tema-en-kebab-case>` — the topic alone, no date and no platform suffix (pass it with `--out`). That folder holds the PNGs and `caption.txt` and nothing else: the user drags it into Drive as it is. There is no separate `exports/` — it was a byte-for-byte copy of the same files.

Stop the temporary server after rendering.

## Automated QA (run before looking at anything)

The skill bundles `scripts/render-and-audit.mjs`. Run it from the package folder with the local server up:

```powershell
node "<skill-dir>/scripts/render-and-audit.mjs" --port 8765
```

It renders every slide at the platform viewport and fails (exit code 3) on any of these, which humans miss or read slowly from a contact sheet:

- A web font that did not actually load (silent fallback to a system sans).
- Any user-facing word below the typography floor, measured on computed styles.
- Any readable element outside the `5%` side / `10%` top-bottom safe area, measured by bounding box.
- Orphan lines: a text block whose last line is under `22%` of its widest line.
- Images or assets that failed to load (`naturalWidth === 0`).
- Canvas overflow beyond `1080x1440`.
- A cover hook that is not horizontally centered.
- Vertical imbalance: the gap above the first content pixel versus below the last differs by more than `4%` of canvas height. Catches dead space left behind when an element is removed but its layout offset survives.
- A page counter not centered on the canvas.
- Optical imbalance inside compact chrome (pills, chips, buttons): it feeds the rendered PNG back into the browser and measures the real background margin around the ink. In the footer this is a red issue; elsewhere it prints as a warning.

It also prints non-blocking **warnings** — read them. They flag what the DOM cannot see, because the box is symmetric while the ink is not.

Checks listed in `slide-data.js` under `layoutExceptions` drop to informational notes. See Documented Layout Exceptions in SKILL.md: those are user decisions, never your own shortcut.

Fix the source and re-render. Never patch the PNG. Passing this script is necessary, not sufficient — the contact-sheet pass below still has to run, because meaning, overlap, and rhythm are not machine-checkable.

## Measure before reflowing

When retargeting to a shorter canvas, run:

```powershell
node "<skill-dir>/scripts/measure-stage.mjs" --port 8765
```

It prints, per slide, the real height of every stage block plus its margins against the available height, and says whether the slide overflows or is under-filled. Estimating those heights by eye costs two or three correction rounds; measuring resolves it in one.

## Replacing a fixed asset

Before overwriting any fixed asset (a CTA frame, a composed logo), keep a copy of the current one and diff the result:

```powershell
node "<skill-dir>/scripts/compare-blocks.mjs" anterior.png nuevo.png
```

It lists every ink block in both images with its vertical position and width, and flags the ones that moved. If the requested change was not a layout change, every row must read `+0% +0px`. Report the table — "no se movio nada" is a claim, the table is the evidence.

Fixed assets cannot be reflowed at render time, so anything composed on top (a counter pill, a badge) has to land on empty artwork. `render-and-audit.mjs` checks that ring automatically and fails if there is ink within 14px of the overlay.

## Contact sheet

`scripts/contact-sheet.mjs` finds the delivery folder on its own (the one with `01.png`, `02.png`, ...) and builds the sheet from it:

```powershell
node "<skill-dir>/scripts/contact-sheet.mjs"
```

Run it from the package folder; `--cols` changes the grid. It needs no local server — the PNGs are inlined as data URIs.

## Implementation notes

- Namespace slide-type classes (`s-cover`, `s-verdict`, …). A bare type class collides with same-named component classes and silently restyles the whole slide.
- Control line breaks explicitly. Give each headline its own font size in the slide data and place `<br>` deliberately instead of letting the browser wrap; that is how orphans are prevented rather than detected.
- Verify every derived or extracted asset by looking at it before wiring it in. A logo cut out of another image can come out inverted or opaque and still render "successfully".
- Load fonts from files inside the package so the render is identical on any machine.
- Use `text-wrap: balance` on running text (`.serif-line`, `.note`, `.body-copy`, punch lines). It prevents orphans without touching approved copy — the only orphan fix available in Adaptation Mode.
- Never center chrome with symmetric padding alone. A font's line box reserves dead space above the cap height that does not exist below the baseline, so `padding: 7px 22px` can render as 21px of background above the ink and 9px below — that is why the counter pill carries an asymmetric correction. Compensate with asymmetric padding or a `translateY` on an inner `<span>`, then confirm with the audit.
- When you delete an element, grep for the layout constants that existed because of it. A `top` offset that once cleared a corner badge keeps pushing content down forever after the badge is gone.
- **Distribute slack with two `.spacer`s, not a fixed `margin-top`.** A head block followed by `margin-top: 46px` on the middle block pushes all the leftover space into one gap between the middle block and whatever closes the slide. That layout *passes* the vertical-balance check — the first and last content pixels are still symmetric — and still reads as a hole in the middle of the slide. Put a `.spacer` before and after the middle block and let flexbox split the slack in two.
- **Optical corrections are per-element measurements, not reusable constants.** The counter pill's `translateY(-3px)` belongs to its font size and box height. Copying it onto the cover's network pills over-corrected them: 17px of background above the ink against 26px below. Removing it balanced them. Measure the new element; never inherit the number.
- **Known false positive in the optical check:** a pill whose border colour contrasts strongly with its fill reads as ink at the box edge, so the horizontal test reports `0px` of background on one side. It fired on an ochre-bordered `+3 más` pill. Confirm on the PNG before chasing it.
- **Known non-blocking warnings, both letterform:** descenders (the `g` in `Instagram`) push the ink down ~10px against the box; the left side bearing of `Y` and `T` leaves ~8px more air on the left. Both are optically correct. Fixing them would need per-word padding.
- **Verify a line break, do not estimate it.** A `<br>` placed by guessing the width of a headline is how a two-line title becomes three with an orphan word. Render and count the lines.
- **A table-like block is ONE grid, not a grid per row.** With a grid on each row and an `auto` column, every row sizes that column to its own label and the columns drift apart. Put the grid on the container and give the rows `display: contents`. A rule that has to cross the whole block is then its own grid item spanning all columns — as a per-cell `border-top` it comes out broken into segments by the column gaps.
- **Cap the width of a block paired with the mascot.** Left at `flex: 1` it stretches into a long thin label beside the character and pushes the row to both edges. A fixed max width plus `justify-content: center` gives a squarer box and a centred row.
- Playwright is resolved from the package, then the skill folder, then a sibling skill (`loadChromium`). If none has it, `npm i playwright` inside the package — or copy `node_modules` from a previous package, which is faster and works.

## Contact sheet QA

Create a contact sheet for each carousel after rendering. Inspect it before final delivery.

Treat any visual problem below as a red issue. A red issue blocks delivery until the source CSS/data is fixed and the affected carousel is re-rendered.

Look for:

- Bad line breaks and orphan words on the last line.
- Clipped headlines.
- User-facing words below the typography floor.
- A first-slide hook block that is left-aligned or not horizontally centered. The cover hook must always be centered.
- Readable text outside the `5%` side and `10%` top/bottom content clearances.
- A small composition surrounded by avoidable empty space. Content must expand within the safe area before the layout is accepted.
- Meaningful text too close to the top or bottom app overlay zones.
- Off-canvas diagrams.
- Overlapping text.
- Cards covering labels.
- Orphan arrows.
- Empty spaces that break the flow.
- Footer or swipe buttons too close to edges.
- More black above the composition than below it, or the reverse.
- Chrome elements in the same row sitting at different heights or on different baselines.

Do not patch only the PNG.

## Typography floor QA

For `1080px`-wide exports, fail QA when any user-facing word has a computed font size below `40px`. This includes body copy, diagram labels, card text, captions, source lines, caveats, methodological notes, footer brand text, and swipe text. Permit `24px` only for page counters containing numbers and purely decorative single-character marks. Scale both floors proportionally for other export widths.

Inspect computed styles before delivery. Do not rely only on whether text fits inside its box. If copy does not fit at the floor, shorten it, split the slide, or change the layout, then re-render the affected carousel.

On the first content slide, inspect the primary hook block's bounding box and computed `text-align`. Fail QA unless the block is horizontally centered in the canvas and the title text is center-aligned. The only way around this rule is a Documented Layout Exception (SKILL.md): decided by the user, recorded in `slide-data.js` and `manifest.json`. Never assume it.

Use the central safe area bounded by `5%` side clearances and `10%` top/bottom clearances. At `1080x1440`, validate every readable element against `x=54..1026` and `y=144..1296`. Within that area, expand the composition before accepting avoidable empty space.

## Common layout patterns

Use centered patterns that stay stable:

- Two-card comparison.
- Four-card grid.
- Vertical flow board for 3-step processes.
- Compact formula grid.
- Cover slide with centered badge plus grid, not a crowded circular diagram.

Avoid circular loop diagrams unless labels are large enough and never overlap the center.
