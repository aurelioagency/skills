---
name: social-carousel-generator
description: Create static social carousel packages from PDFs, URLs, pasted text, screenshots, or image references. Use for TikTok or Instagram carousels, educational swipe posts, AI/tool explainers, article-to-carousel transformations, and branded carousel exports that need PNG slides, editable HTML source, captions, and visual QA.
---

# Social Carousel Generator

Turn source material into a readable social carousel package for TikTok or Instagram.

Default to the static HTML screenshot workflow because it gives reliable text, layout, and export control. Use generated images, diagrams, charts, cards, and editorial visual systems as supporting imagery, but render final text in HTML/CSS.

## Core Workflow

1. Resolve the preset, platform, language, and CTA mode.
   Completion criterion: the active preset, slide size, language, footer behavior, and CTA behavior are explicit.
2. Extract the source into shareable angles.
   Completion criterion: source facts, gaps, and one to three candidate carousel angles are captured in the brief without invented content.
3. Recommend the carousel split and ask for confirmation.
   Completion criterion: the user has confirmed, reduced, or changed the number of carousels before rendering begins.
4. Draft the slides.
   Completion criterion: each carousel has 3-6 content slides, each slide has one job, and passages are concise enough for mobile reading.
5. Build the editable HTML package and render PNGs.
   Completion criterion: `exports/` and `exports-ready/` contain ordered platform-size PNGs, with CTA appended only when the active preset says so.
6. Run visual QA from contact sheets.
   Completion criterion: every red issue is fixed in source and re-rendered, including clipped text, overlap, unsafe top/bottom placement, broken flow spacing, and stale CTA assets.
7. Humanize captions and deliver.
   Completion criterion: `post-descriptions.md`, `manifest.json`, `carousel-brief.md`, ready exports, and a short validation summary are present.

## Preset Resolution

If the user asks for La Casa de Aurelio, Agencia Aurelio, or this workspace, read `references/la-casa-preset.md` and use that preset.

If no usable preset exists, run the setup interview before planning content:

1. Ask this bilingual language question exactly:
   `Default language is Spanish. Lenguaje es español. ¿Lo quieres cambiar o seguimos así?`
2. Ask for platform and ratio if not implied:
   TikTok default is `1080x1920`. Instagram feed default is `1080x1350`. Instagram square is `1080x1080`.
3. Ask whether to use a fixed CTA frame or generate a CTA each run. Recommend fixed CTA.
4. If fixed CTA is selected, ask for CTA copy, brand/logo asset, and CTA layout reference. Do not ask this again once the active preset explicitly sets a fixed CTA.
5. Ask for visual references: URLs, screenshots, images, brand pages, or sample posts. If none are provided, ask only the minimum questions needed for palette, tone, audience, and footer text.

Do not run a long questionnaire. When the user answers `default`, apply the recommended defaults for the active context.

## Source Intake

Accept PDFs, URLs, pasted text, screenshots, and image references.

For URLs:

1. Try browser capture or extraction first.
2. If extraction fails or the URL is blocked, ask for pasted text, screenshots, PDF export, or browser-captured images.
3. Never invent missing source content.

For source material, extract one to three shareable angles. Do not summarize the whole document unless the user asks. The carousel should feel useful, not like a dictionary entry.

## Series Decision

Make the best guess for whether the source should become one carousel or a short series.

Then ask for confirmation before rendering:

```text
I recommend [N] carousel(s):
1. [title] - [angle]
2. [title] - [angle]

Confirm, reduce, or change the split?
```

Keep each carousel to 3-6 content slides. If the preset has a fixed CTA frame, append it as an extra final slide. A 3-slide carousel with a fixed CTA exports 4 images.

## Slide Grammar

Use this default grammar unless the source demands a different structure:

1. Hook or claim.
2. Context or problem.
3. Key insight.
4. Example, framework, chart, or comparison.
5. Practical takeaway.
6. Optional content close.

Prefer fewer, clearer slides over dense slides. Each slide gets one job.

## Visual Rules

Use supporting imagery on every carousel:

- Generated images when they add meaning, especially for AI, Codex, software, and abstract workflow topics.
- Diagrams, cards, charts, flow boards, visual metaphors, icons, or product screenshots when they communicate better than generated art.
- Text overlays rendered in HTML/CSS, not baked into generated images.

Hard QA rules:

- Export every slide at the selected platform size.
- Center the main information inside the canvas.
- Keep every text element fully visible.
- Keep meaningful text out of app overlay zones. Do not peg headlines, labels, body text, CTA copy, logos, or footers to the top or bottom edge. For TikTok `1080x1920`, keep critical readable content below roughly `180px` from the top and above roughly `240px` from the bottom unless the platform or preset defines a stricter safe zone.
- Avoid overlapping cards, labels, diagrams, icons, and text.
- Avoid orphan arrows, accidental wraps, and empty gaps in process diagrams.
- Keep footer and CTA controls inside safe zones.

## Rendering

Use a project package with editable source and PNG exports.

Recommended package structure:

```text
social-carousels/<slug>/
  index.html
  styles.css
  slide-data.js
  carousel-brief.md
  post-descriptions.md
  manifest.json
  assets/
  references/
  exports/
  exports-ready/
```

Read `references/html-rendering.md` when implementing the static HTML screenshot workflow or visual QA.

## Captions

Always generate post descriptions with hashtags.

Use `$humanizer` on each slide passage and each post description before final export. If `$humanizer` is not installed, ask to install it globally with the skill installer when available. If installation is not available, continue only after applying the built-in humanizer pass:

- Remove generic AI phrasing.
- Remove inflated claims.
- Cut filler.
- Keep one meaning once.
- Use natural rhythm for the selected language.
- Avoid dictionary-style explanations.

## Deliverable

Return the ready export folders and a short validation summary.

Each final package must include:

- Ordered PNG exports.
- Editable HTML/CSS/data source.
- `carousel-brief.md`.
- `manifest.json`.
- `post-descriptions.md`.
- A visual QA note confirming size, readability, centered layout, CTA behavior, and any remaining caveat.
