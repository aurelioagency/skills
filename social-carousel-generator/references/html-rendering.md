# Static HTML screenshot workflow

Use this workflow when creating the editable carousel package.

## Files

Create:

- `index.html`: reads query params such as `?carousel=<key>&slide=<n>`.
- `styles.css`: all visual system and platform-size layout.
- `slide-data.js`: structured slide data.
- `manifest.json`: platform, size, slide order, CTA status, source, and export directories.
- `carousel-brief.md`: source, angle decisions, slide plan, caveats.
- `post-descriptions.md`: captions and hashtags after humanizer pass.

## Rendering

Start a local server from the package folder:

```powershell
python -m http.server 8765 --bind 127.0.0.1
```

Use Playwright or an available Chromium browser to capture each slide at the target viewport. Prefer installed Chrome if bundled Playwright browsers are missing.

Use `deviceScaleFactor: 1` and the exact viewport size:

- TikTok: `1080x1920`
- Instagram: `1080x1440` (3:4)

Write working files to `exports/` and clean upload files to `exports-ready/`.

Stop the temporary server after rendering.

## Contact sheet QA

Create a contact sheet for each carousel after rendering. Inspect it before final delivery.

Treat any visual problem below as a red issue. A red issue blocks delivery until the source CSS/data is fixed and the affected carousel is re-rendered.

Look for:

- Bad line breaks.
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

Do not patch only the PNG.

## Typography floor QA

For `1080px`-wide exports, fail QA when any user-facing word has a computed font size below `40px`. This includes body copy, diagram labels, card text, captions, source lines, caveats, methodological notes, footer brand text, and swipe text. Permit `24px` only for page counters containing numbers and purely decorative single-character marks. Scale both floors proportionally for other export widths.

Inspect computed styles before delivery. Do not rely only on whether text fits inside its box. If copy does not fit at the floor, shorten it, split the slide, or change the layout, then re-render the affected carousel.

On the first content slide, inspect the primary hook block's bounding box and computed `text-align`. Fail QA unless the block is horizontally centered in the canvas and the title text is center-aligned. This cover-hook rule has no layout-style exception.

Use the central safe area bounded by `5%` side clearances and `10%` top/bottom clearances. At `1080x1920`, validate every readable element against `x=54..1026` and `y=192..1728`; at `1080x1440`, against `x=54..1026` and `y=144..1296`. Within that area, expand the composition before accepting avoidable empty space.

## Common layout patterns

Use centered patterns that stay stable:

- Two-card comparison.
- Four-card grid.
- Vertical flow board for 3-step processes.
- Compact formula grid.
- Cover slide with centered badge plus grid, not a crowded circular diagram.

Avoid circular loop diagrams unless labels are large enough and never overlap the center.
