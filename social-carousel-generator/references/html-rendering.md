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
- Instagram portrait: `1080x1350`
- Instagram square: `1080x1080`

Write working files to `exports/` and clean upload files to `exports-ready/`.

Stop the temporary server after rendering.

## Contact sheet QA

Create a contact sheet for each carousel after rendering. Inspect it before final delivery.

Treat any visual problem below as a red issue. A red issue blocks delivery until the source CSS/data is fixed and the affected carousel is re-rendered.

Look for:

- Bad line breaks.
- Clipped headlines.
- Meaningful text too close to the top or bottom app overlay zones.
- Off-canvas diagrams.
- Overlapping text.
- Cards covering labels.
- Orphan arrows.
- Empty spaces that break the flow.
- Footer or swipe buttons too close to edges.

Do not patch only the PNG.

## Common layout patterns

Use centered patterns that stay stable:

- Two-card comparison.
- Four-card grid.
- Vertical flow board for 3-step processes.
- Compact formula grid.
- Cover slide with centered badge plus grid, not a crowded circular diagram.

Avoid circular loop diagrams unless labels are large enough and never overlap the center.
