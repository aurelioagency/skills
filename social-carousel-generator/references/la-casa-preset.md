# La Casa de Aurelio preset

Use this preset when the user asks for La Casa de Aurelio, Agencia Aurelio, Aurelio, or the local default carousel style.

> **Esta es la copia que manda.** Vive con la skill, versionada en el repo, así que viaja a cualquier máquina y sobrevive a una reinstalación. Se edita acá, en el checkout, y se publica corriendo `node install-skills.mjs social-carousel-generator`. Editar la copia instalada en `~/.claude/skills/` sirve hasta la próxima instalación y después se pierde en silencio.
>
> Este archivo guarda **solo decisiones de marca**. Tamaño y densidad de texto son reglas de la skill y viven en `SKILL.md`; del largo, acá solo se declara el rango habitual de La Casa, nunca el techo.

## Defaults

- Tamaño y densidad de texto **no se definen acá**: son reglas de la skill, iguales para toda marca. Están en `SKILL.md`, sección *Format, length and density* — un solo tamaño `1080x1440` y de 120 a 220 caracteres por slide de contenido. La Casa no las pisa.
- **Largo habitual de La Casa: 7 a 10 imágenes exportadas** (6 a 9 slides de contenido más el CTA). Esto es formato de marca, no una regla de la skill: el techo de 10 lo pone `SKILL.md` y no se toca, pero el piso de 6 es de acá, porque los temas que publica La Casa —papers, procesos, comparativas— casi siempre necesitan separar afirmación de evidencia. Si un carrusel puntual no da para tanto, sale más corto: nunca se rellena para llegar al piso.
- Language: Spanish by default.
- Voice: practical, sharp, useful, human. Prefer clear Spanish. Use voseo only when the surrounding La Casa voice calls for it.
- Audience: builders, operators, founders, AI-system users, Codex users, and people learning agent workflows.
- Content density: useful, not encyclopedic.
- Cómo se aplica el presupuesto de caracteres de la skill en esta marca: la portada usa el máximo de 40 caracteres por línea sobre el titular Archivo Black y sobre el remate Georgia itálica por separado, que es lo que muestra el set publicado (titulares de 23 a 45 caracteres). Referencia histórica: los 37 slides publicados hasta el 2026-08-13 promedian 225 caracteres, es decir por encima de la banda actual — los carruseles nuevos salen más repartidos que los viejos.

## Brand system (canonical values)

Extracted from the published La Casa carousel set (2026-07). Use these exact values; never re-interpret the color names by eye. Earlier carousels drifted between near-duplicates of the same color (e.g. terracotta `#D66F50` vs `#D87152`) — new work always uses the canonical values below.

### Palette

Neutrals:

- Background: `#000000` base with a `#050505` field and four wide elliptical contour lines crossing it.
- **Contour lines — measured, not "barely lighter".** `#211d1b`, `stroke-width: 1.6`, container at `opacity: 1`. Rendered value over the field: `rgb(33,29,27)`.

  ```html
  <svg class="contours" viewBox="0 0 1080 1440">
    <g fill="none" stroke="#211d1b" stroke-width="1.6">
      <ellipse cx="540" cy="250"  rx="900"  ry="230"/>
      <ellipse cx="540" cy="470"  rx="980"  ry="270"/>
      <ellipse cx="540" cy="980"  rx="900"  ry="250"/>
      <ellipse cx="540" cy="1210" rx="1000" ry="290"/>
    </g>
  </svg>
  ```

  For `1080x1920` scale `viewBox`, `cy` and `ry` by `1.3333` (`cy` 333/627/1307/1613, `ry` 307/360/333/387); `rx` stays. Earlier work had them at `1.2px` and `opacity: 0.5`, which renders as `rgb(19,17,16)` — 14 levels over the field, invisible on a phone. If a render looks like it has no curves at all, check this value before assuming they are missing.
- **Dot grid — the period matters as much as the colour.** `26px` grid, `2x2px` dot, rendered value `rgb(14,14,14)` over the `#050505` field. Measured on the published set:

  ```css
  background-image: radial-gradient(circle, #0e0e0e 1px, transparent 1.1px);
  background-size: 26px 26px;
  ```

  At a coarser period (46px was tried) the dots stop reading as texture and start reading as individual specks scattered across the canvas — the field looks like a starfield instead of paper grain. If a rebuild ever looks "speckled", check this value first.
- **Two radial glows over that field.** Part of the brand, not optional polish: without them the background reads flat.

  ```css
  background-image:
    radial-gradient(circle 480px at 11% 23%, rgba(214, 111, 80, 0.12), rgba(214, 111, 80, 0) 100%),
    radial-gradient(circle 480px at 85% 71%, rgba(110, 164, 140, 0.107), rgba(110, 164, 140, 0) 100%);
  ```

  Warm glow: terracotta `#D66F50` at 12% alpha, centered upper-left. Cool glow: sage `#6EA48C` at 10.7%, centered lower-right. Both fall to the base field over ~480px. Centers are percentages so they hold across `1080x1920` and `1080x1440`. Peak value over the `#050505` field: `rgb(30,17,14)` warm.

  The first published set carried them at 6.2% / 5.5% (`rgb(18,11,9)` warm), which is below what a phone screen shows — the field read as flat black and the glows had to be measured on the PNG to prove they were there at all. These are the current values; the older ones are history, not a fallback.
- Primary text and headlines: `#F6F2E9` (warm off-white).
- Cream surfaces (footer pills, contrast cards): `#EDE8DE` with dark text.
- Dark panels (cards, UI mockups): `#191716` to `#2F2C2B`.

Accents — four families; bright value for text/fills, dark value for borders, badges, and tinted fills:

| Family | Bright | Dark | Observed roles |
|---|---|---|---|
| Terracotta | `#D66F50` | `#964F3A` (deep: `#603024`) | kickers/eyebrow labels, verdict-box borders, key data bar |
| Sage | `#6EA48C` | `#2C614A` | stat rings, progress bars, result labels, cream-card borders, twist lines (when dominant) |
| Ochre | `#D6B85E` | `#9C843C` | twist lines (when dominant), arrows, secondary bars |
| Dusty pink | `#ECACC7` | `#604854` | large stat figures, mockup buttons, twist lines (when dominant) |

Keep one dominant accent per slide. The four families may coexist across a carousel, but never all on one slide except in small grouped elements (traffic dots, multi-bar charts).

### Typography (canonical families)

Identified by per-glyph comparison against the published carousel set (2026-07). Use exactly these:

1. Headlines: **Archivo Black** (`font-family: 'Archivo Black', sans-serif`), tight leading, `letter-spacing: -0.02em`, `#F6F2E9`. Case varies by carousel in the published set: ALL CAPS or Title Case — pick one per carousel and keep it consistent across its slides.
2. Mono (kickers, technical labels, bar data, page counter): **Roboto Mono** bold (`font-family: 'Roboto Mono', monospace`), uppercase kickers with wide letter-spacing.
3. Large stat figures (big percentages/numbers): **Inter** bold (`font-family: 'Inter', sans-serif`). Identification margin note: Archivo bold scored nearly as close; if an original `styles.css` ever surfaces and says Archivo, switch and update this line.
4. Serif italic (footer signature `La Casa de Aurelio`, editorial support sentences): **Georgia Italic** (`font-family: Georgia, 'Lora', serif`). Identification margin note: Lora Italic is the close alternative; same correction rule as above.

Archivo Black, Roboto Mono, and Inter are on Google Fonts; Georgia ships with Windows/macOS. Load web fonts locally in the package (or via Google Fonts) so Playwright renders them identically on any machine — never let the render fall back to a default system sans.

### Recurring components

- Mono kicker in terracotta above or centered over the headline.
- Verdict box: 1px terracotta or sage border, dark fill, one bold caps sentence in `#F6F2E9`.
- Footer on content slides: **Inter** bold `aurelioagency.com` left · page-counter pill center (Inter bold, fill `#252422`, fully rounded `border-radius: 999px`) · `← Desliza` right, in the same Inter bold, size and colour as the brand line.
- Cream contrast cards (`#EDE8DE`, dark text, sage border) for outcomes/results, often paired against dark panel cards (`#191716`) for the "before"/technical side.

### Never on a slide

This list is closed on purpose. If an element is not in the components above, it does not go on the canvas — including when an older published carousel shows it.

- No corner badge, initial, monogram, or boxed letter (an `A` mark in a corner is not part of this brand system).
- No watermark, no logo on content slides. The `AURELIO` wordmark lives inside the fixed CTA artwork and nowhere else.
- No on-screen source line or URL beyond the footer's `aurelioagency.com`.
- No decorative ornaments, frames, or corner marks beyond the dot-grid field and the faint contour lines.

In Adaptation Mode this list outranks the source PNGs: transcribe the copy, take the chrome from here.

## Asset bank

- Location: `social-carousels/brands/la-casa/asset-bank/` (carpeta local). PNG de fondo transparente, terminados; subcarpetas libres (iconos, personaje, ilustraciones, lo que haga falta). **El nombre de archivo es la única descripción del asset y tiene que decir completo qué muestra la imagen**, en kebab-case: `tiburon-agobiado-cubierto-de-postits.png`, nunca `final2.png`. Reglas completas: `references/asset-bank.md` de la skill.
- **El estado del banco se lee, nunca se declara acá.** Listá la carpeta en el momento de elegir assets: este archivo no registra cuántos hay ni qué contienen, porque quedaría desactualizado con el primer archivo que entre o salga. Si la carpeta está vacía, ese carrusel sale con gráficos HTML/CSS; si tiene archivos, se elige por nombre.
- Producción de assets nuevos (pipeline propio de la marca, fuera de esta skill): la mascota se genera con la skill `aurelio-personaje` (ChatGPT web + postprocess); iconos, dibujos e ilustraciones, por el camino que corresponda. Al banco solo entran archivos terminados.
- Placement: defaults del contrato (uno por slide, dentro del safe area, nunca detrás del texto).

## Content slides

- Background: black editorial field per the canonical palette above.
- Typography: per the typography roles above — large off-white sans headlines, mono labels, serif italic support.
- Typography floor at `1080px` width: `40px` for every readable word, including card text, source lines, caveats, methodological notes, footer brand text, and swipe text. Never shrink copy below the floor to make it fit. Two exceptions, both from `SKILL.md`: the numeric page counter and decorative single-character marks at `24px`, and the reference layer inside a chart or diagram (axis titles, scale marks, position labels, legends) at `24px`, in a container marked `chart` or `diagram`.
- First content slide: center the primary hook block horizontally and center-align the title text. A left-aligned cover headline is only allowed as a Documented Layout Exception (see SKILL.md) — decided by the user and recorded in both `slide-data.js` and `manifest.json`.
- Cover hook follows the two-part structure defined in SKILL.md (Hooks), and the cover is built on a fixed contrast — **two fonts and two colours, both centered**:
  - Setup line: Archivo Black in `#F6F2E9`, ALL CAPS, the largest type on the canvas.
  - Twist line: **Georgia italic** in the cover's dominant accent (ochre, dusty pink, or sage — the published set uses all three), in sentence case. Italic caps lose the contrast against the headline, which is the whole point of the second line.
  - One accent per cover. The kicker takes that same accent.
- The cover also carries **one simple, direct graphic** — never text alone. The default pattern is a fan-out: a cream node with the system's name, a stem, a distribution bracket and a row of pills for the destinations (`.fanout` in `assets/template/styles.css`). Any equally simple graphic works; a crowded illustration does not.
- Content clearance: keep all readable content at least `5%` from the left and right edges and `10%` from the top and bottom edges. En `1080x1440`, el único tamaño: `x=54..1026`, `y=144..1296`.
- No on-screen source line. Traceability lives in `carousel-brief.md`, not on the slides.
- Composition scale: expand content inside the safe area with larger type and reflowed visual elements. Do not accept a small composition surrounded by avoidable empty space.
- Accents: only the canonical accent values from the brand system above — never eyeballed approximations.
- Visual style: crisp editorial infographic with centered information.
- Safe zone: keep meaningful text away from the top and bottom app overlay bands. Do not peg headlines, body copy, labels, logo, CTA copy, or footer text to the canvas edge.
- Footer on content slides. These values come from measuring rendered pixels, not from estimating — copy `assets/template/styles.css`, which has them baked in, and re-run the audit after any change:
  - Bottom-left: `aurelioagency.com` in Inter bold `40px` (not serif italic).
  - Center: page counter pill, Inter bold **`26px`** — it is numeric chrome, not reading text, so the `40px` floor does not apply and a counter at `40px` is oversized. Fill `#252422`, `border-radius: 999px`, padding `9px 20px`.
  - The counter is centered on the **canvas** (`left: 50%`, absolute), not distributed with `space-between`. Those are different positions whenever the brand line and the swipe line have different widths, and the canvas center is the correct one.
  - Bottom-right: `← Desliza` in plain text — Inter bold `40px`, colour `#F6F2E9`, no pill, no emoji. Same font, size, colour and baseline as the brand line on the left, so the footer reads as one row. Having no background, it needs no optical padding correction; the counter pill is the only footer element that does.
- Page counter counts **every exported image, including the final CTA frame**. A carousel with 5 content slides plus the CTA runs `1/6` through `6/6`.
- The CTA frame carries only the counter pill (its final number) — no brand line and no swipe prompt. Its own `La Casa de Aurelio` signature stays part of the CTA artwork.

## Fixed CTA

La Casa tiene el frame de CTA fijo activado, en **dos variantes**. **No se pregunta cuál va: se deduce del carrusel.**

- **Normal** (`Guarda este post`) es el default y cubre la enorme mayoría de los casos: un paper, un artículo, un video, un proceso, una comparativa, cualquier contenido explicativo. Se usa sin preguntar nada.
- **Comentario** (`Comenta AURELIO` y te enviamos la skill por DM) solo corresponde cuando **el carrusel entrega algo por DM** — una skill, un template, un prompt, un recurso descargable — y ese algo es el tema del carrusel, no una mención al pasar. Ahí no se pregunta tampoco: se propone junto con el split, en una línea, y el usuario dice que no si no va.

Preguntar la variante en cada carrusel es ruido: la respuesta ya está en el material. Solo se pregunta si el propio usuario deja la intención ambigua — por ejemplo, si pide un carrusel sobre una skill pero no aclara si la va a regalar.

- Append it after the content slides.
- Do not include a swipe prompt on the CTA frame.
- Fixed CTA assets a `1080x1440`, uno por variante:

  | Normal | `assets/la-casa-cta-ig.png` |
  |---|---|
  | Comentario | `assets/la-casa-cta-ig-aurelio.png` |

- Los dos assets `1080x1920` (`la-casa-cta.png` y `la-casa-cta-aurelio.png`) quedaron **fuera de uso** desde la decisión de tamaño único del 2026-08-13. Siguen versionados en `assets/` por si alguna vez vuelve a hacer falta ese tamaño; no se usan en carruseles nuevos y no se recortan ni estiran para llenar el lugar del asset de `1080x1440`.

- Copy in the normal variant: `Guarda este post` / `y sígueme para más`. In the comment variant: `Comenta AURELIO` / `y te enviamos la skill por DM`. Both sit over the `AURELIO` wordmark and the serif italic `La Casa de Aurelio` signature, in the same layout.
- When the comment variant is used, the word to comment must also appear in the caption's written paragraph. If it ever changes, it changes in both places.
- Los cuatro assets llevan el mismo campo que los slides de contenido: grilla de puntos, los dos glows y las curvas. Ninguno es plano.
- Compose the CTA slide as the fixed asset plus the counter pill drawn on top at render time. This keeps the asset reusable while the number stays correct for any carousel length.
- If a new size is ever needed, rebuild the CTA once in HTML/CSS at that size, save it as a new fixed asset, and reference it here.
- **Sources.** `assets/template/cta-ig.html` and `cta-ig-aurelio.html` produce the two `1080x1440` assets; render them with `assets/template/make-cta.mjs`. The two `1080x1920` assets have **no HTML source**: that artwork predates this repo and its colour strokes are hand-drawn, slightly rotated (bounding boxes 23/18/17/11px tall against the flat 9px bars of the Instagram asset). They cannot be re-rendered without inventing them, so they are maintained by compositing — new field underneath, original artwork on top through a luminance mask. If the TikTok CTA ever needs a copy change, expect to redraw by hand whatever the old text was painted over: under the glyphs there is no artwork left to recover (the comment variant's pink underline had to be redrawn from its measured geometry, 630x9px centered at 576.5/823.5, rotated -1.18°).
- **Regenerating an existing CTA asset:** the current asset at that size is the reference, not the other platform's artwork. Keep its block layout (positions and widths) and change only what was asked. Verify with `scripts/compare-blocks.mjs` against the previous file before replacing it, and keep the counter band free of artwork — the asset cannot be reflowed once the counter is composed on top. A pure background change must report `+0% +0px` on **every** block; a copy change may only move the text blocks.

Nunca ofrecer diseñar un CTA nuevo mientras este preset esté activo — solo si el usuario pide explícitamente reemplazarlo.

## Caption template (Instagram / TikTok)

Every carousel ships a ready-to-publish caption in this exact structure, written to `caption.txt` inside the delivery folder (plain text, UTF-8, nothing but the caption) and also pasted in the chat, with nothing left for the user to edit.

```text
Bienvenidos a la Casa de Aurelio!

<2-4 lineas que resumen el gancho o insight principal del carrusel, tono directo, sin relleno>

De la teoría a la práctica: Aurelio Agency →
https://www.aurelioagency.com/es

Únete a la comunidad:
https://www.skool.com/la-casa-de-aurelio-2061

<4 hashtags dinamicos segun el tema> #LaCasaDeAurelio
```

Rules:

- The greeting, the services paragraph, and both links are **fixed**. Never reword, translate, shorten, or adapt them to the carousel's topic.
- The only written paragraph is the second block: it restates the carousel's strongest idea or figure in 2-4 lines. No filler, no recap of every slide.
- **Exactly 5 hashtags, siempre.** El tope de 5 es de plataforma y está en `SKILL.md`; acá se define cómo se reparten esos 5 en esta marca.
- **Uno solo es fijo: `#LaCasaDeAurelio`,** y va al final, como firma.
- **Los otros cuatro son dinámicos**, elegidos por el tema central del carrusel. Referencias por categoría:
  - Agentes / automatización de tareas → `#AIAgents #Agentic #Automatizacion #AIWorkflows`
  - n8n / workflows → `#n8n #NoCode #WorkflowAutomation #Automatizacion`
  - OpenAI / modelos puntuales → `#OpenAI #Codex #GPT #IA`
  - Claude / Anthropic → `#Claude #Anthropic #IA #AIWorkflows`
  - Productividad / negocio → `#Productividad #FutureOfWork #PYMES #IA`
  - Desarrollo / código → `#DevTools #SoftwareEngineering #IA`
  - Ninguna categoría encaja → construí los cuatro con palabras literales del carrusel (nombres de herramientas, conceptos técnicos).
- Un hashtag fuera de tema resta más de lo que suma: `#claude` en un carrusel que no habla de Claude es ruido. `#claude`, `#ia`, `#Automatizacion` y `#AIWorkflows` **dejaron de ser fijos** el 2026-08-14 justamente por eso — siguen disponibles como dinámicos cuando el tema los pide.
- Blank lines between blocks exactly as shown.
- The humanizer pass applies to the written paragraph only; fixed blocks pass through untouched.

## Layout checks

Before delivery, visually check:

- Main content is centered.
- No meaningful text is stuck to the top or bottom edge. Keep La Casa headlines, body text, labels, logo, CTA copy, and footer clear of TikTok app overlay zones.
- Text is not clipped.
- Every readable word meets the typography floor at computed style level.
- The first-slide hook block is horizontally centered and its title text is center-aligned.
- The cover reads as two fonts and two colours: Archivo Black headline in `#F6F2E9`, Georgia italic twist in the dominant accent. And it carries a graphic, not text alone.
- All readable text respects the `5%` side and `10%` top/bottom clearances.
- The composition expands within the safe area instead of remaining small amid avoidable empty space.
- Diagrams do not overlap labels.
- Flow arrows connect deliberate steps.
- Cards do not create random empty spaces.
- CTA frame uses the fixed asset for the target size **and the chosen variant**, with the counter pill composed on top. If it is the comment variant, the word to comment also appears in the caption.
- Every accent color in the render matches the canonical palette exactly (no near-duplicate hex drift).
- Rendered text uses the canonical font families (Archivo Black / Roboto Mono / Inter / Georgia Italic) — verify the web fonts actually loaded before capture; a silent fallback to a system sans is a red issue.
- Delivered files are true PNG exports from the render pipeline — never JPEG re-saves renamed to `.png`.
