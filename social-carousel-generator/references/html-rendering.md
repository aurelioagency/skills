# Static HTML screenshot workflow

Use this workflow when creating the editable carousel package.

## Starting the package

Do not improvise the skeleton. Copy `assets/template/` into the package (`index.html`, `styles.css`, `slide-data.js`, plus `cta-ig*.html` and `make-cta.mjs` if the CTA has to be regenerated) and the font files into `<package>/assets/fonts/`, then add the per-slide layouts. The template already carries the footer with its optical corrections, the safe-area constants, and the `layoutExceptions` field — rebuilding those from scratch is how they get re-broken.

**If the brand is not La Casa**, the template's header lists the six things that must change before the first render: the `@font-face` block plus the brand's actual font files, the `:root` palette, `footerBrand` / `footerSwipe` in `slide-data.js`, the cover's two families and two colours, the CTA asset, and the density bands (or the `density-budget` exception). Take all six from that brand's `preset.md` — never from this file and never from La Casa's values.

## Files

Create:

- `index.html`: reads query params such as `?carousel=<key>&slide=<n>`.
- `styles.css`: all visual system and platform-size layout.
- `slide-data.js`: structured slide data.
- `manifest.json`: platform, size, slide order, CTA status, source, and export directories.
- `carousel-brief.md`: source, angle decisions, slide plan, caveats.
- `caption.txt` inside the delivery folder: the caption, plain text, nothing else in the file.

## Rendering

Start a local server from the package folder:

```powershell
python -m http.server 8765 --bind 127.0.0.1
```

Use Playwright or an available Chromium browser to capture each slide at the target viewport. Prefer installed Chrome if bundled Playwright browsers are missing.

Use `deviceScaleFactor: 1` and the only viewport size: `1080x1440` (3:4). Carousels have one size — see *Format, length and density* in `SKILL.md`. The `1080x1920` viewport belongs to `short.mp4`, not to slides.

Write the PNGs straight into the delivery folder, named `<YYYY-MM-DD>-<tema-en-kebab-case>-ig` (pass it with `--out`). That folder holds the PNGs and `caption.txt` and nothing else: the user drags it into Drive as it is. There is no separate `exports/` — it was a byte-for-byte copy of the same files.

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
