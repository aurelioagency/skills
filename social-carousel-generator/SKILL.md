---
name: social-carousel-generator
description: Create static social carousel packages from PDFs, URLs, YouTube videos, pasted text, screenshots, or image references. Use for TikTok or Instagram carousels, educational swipe posts, AI/tool explainers, article-to-carousel and video-to-carousel transformations, adapting existing carousels to another platform or size, and branded carousel exports that need PNG slides, editable HTML source, captions, and visual QA.
---

# Social Carousel Generator

Turn source material into a readable social carousel package for TikTok or Instagram.

Default to the static HTML screenshot workflow because it gives reliable text, layout, and export control. Use generated images, diagrams, charts, cards, and editorial visual systems as supporting imagery, but render final text in HTML/CSS.

## Core Workflow

1. Resolve the preset, platform, language, and CTA mode.
   Completion criterion: the active preset, slide size, language, footer behavior, and CTA behavior are explicit.
2. Extract the source into shareable angles.
   Completion criterion: source facts, gaps, and one to three candidate carousel angles are captured in the brief without invented content.
3. Recommend the carousel split, present two hook options per carousel, and ask for confirmation.
   Completion criterion: the user has confirmed, reduced, or changed the number of carousels, and picked or edited a hook for each one, before any slide is drafted.
4. Draft the slides and get the copy approved.
   Completion criterion: each carousel has 3-6 content slides, each slide has one job, passages are concise enough for mobile reading, and the user has approved the full slide copy as plain text before any HTML is built.
5. Build the editable HTML package and render PNGs.
   Completion criterion: `exports/` and `exports-ready/` contain ordered platform-size PNGs, with CTA appended only when the active preset says so.
6. Run visual QA from contact sheets.
   Completion criterion: every red issue is fixed in source and re-rendered, including clipped text, typography-floor violations, overlap, unsafe top/bottom placement, broken flow spacing, and stale CTA assets.
7. Humanize captions and deliver.
   Completion criterion: `post-descriptions.md`, `manifest.json`, `carousel-brief.md`, ready exports, a ready-to-paste caption block, and a short validation summary are present.

When the user brings an existing carousel to convert to another platform or size, steps 2-4 are replaced by Adaptation Mode below: verbatim transcription and faithful rebuild, never re-angling or rewriting approved content.

## Preset Resolution

Before planning content, ask which brand the carousel is for, unless the user already said so in their request:

`¿Este carrusel es para La Casa de Aurelio o para otra marca?`

If the answer is La Casa de Aurelio, Agencia Aurelio, or this workspace, read `references/la-casa-preset.md` and use that preset.

If it is for another brand, run the setup interview before planning content:

1. Ask this bilingual language question exactly:
   `Default language is Spanish. Lenguaje es español. ¿Lo quieres cambiar o seguimos así?`
2. Ask for platform if not implied: TikTok or Instagram.
   2026 sizes: TikTok carousel is `1080x1920`. Instagram carousel is `1080x1440` (3:4).
3. Ask whether to use a fixed CTA frame or generate a CTA each run. Recommend fixed CTA.
4. If fixed CTA is selected, ask for CTA copy, brand/logo asset, and CTA layout reference. Do not ask this again once the active preset explicitly sets a fixed CTA.
5. Ask for visual references: URLs, screenshots, images, brand pages, or sample posts. If none are provided, ask only the minimum questions needed for palette, tone, audience, and footer text.

Do not run a long questionnaire. When the user answers `default`, apply the recommended defaults for the active context.

## Source Intake

Accept PDFs, URLs, pasted text, screenshots, image references, and YouTube video links.

Screenshots of third-party social posts or carousels are valid sources of information: use their topic, facts, and any cited studies (prefer chasing the original sources when cited), but always write new original copy. Never reuse their exact wording. Verbatim reuse is reserved for the user's own carousels in Adaptation Mode.

For URLs:

1. Try browser capture or extraction first.
2. If extraction fails or the URL is blocked, ask for pasted text, screenshots, PDF export, or browser-captured images.
3. Never invent missing source content.

For YouTube video links:

1. Open the video page in the browser and extract the transcript (open the description, expand "Show transcript" / "Mostrar transcripción", and read it), plus title and description.
2. Treat the transcript as the source text. Capture key claims, numbers, and examples with enough context to quote them accurately.
3. If the video has no transcript and no captions, ask the user for an alternative: key screenshots with on-screen text, their own notes, or a summary. Never reconstruct video content from memory or general knowledge of the topic or channel.

For source material, extract one to three shareable angles. Do not summarize the whole document unless the user asks. The carousel should feel useful, not like a dictionary entry.

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

Include the two hook options per carousel (see Hooks) in the same confirmation message, so split and hooks get approved together.

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

## Hooks

The hook is the first slide's only job: stop the scroll. Write and approve hooks before drafting any other slide.

### Structure

Every hook is two parts:

1. Setup line: a strong, specific claim — the main headline.
2. Twist line: the tension, break, or consequence. Styled with the carousel's dominant accent color from the active preset's palette, or as a serif italic support sentence — never hardcoded to one color.

Both lines must be short enough to hold the typography floor without shrinking. If a line only works small, rewrite it shorter.

### Approval gate

Draft exactly two hook options (A and B) per carousel. Present them together with the split confirmation, each with a one-line rationale, and recommend one. Never draft the remaining slides or render anything before the user picks, edits, or replaces a hook.

```text
Carousel 1 - [title]
Hook A:
[setup line]
[twist line]
Hook B:
[setup line]
[twist line]
Recommendation: [which and why, one line]
```

### Quality criteria

- Specific beats generic. A concrete number creates authority ("80.508 personas", "25,6%").
- The two lines must create tension between them: contrast, contradiction, or a negated expectation ("La respuesta no fue...", "El estudio no dice X. Dice algo más útil...").
- Techniques that work in this brand's published set: number + twist; expectation negation; contrast pairs (casa/trabajo, antes/después, modelo/método); direct challenge to the reader's current practice ("Tu empresa todavía la usa para escribir emails.").
- Two valid flavors: broad/shareable vs operator/practical. Pick per the carousel's goal and say which in the rationale.
- No clickbait the slides cannot back with the source. If the hook needs a claim the source does not support, change the hook, never the claim.
- No hook ships without a verified source behind it. If the source is pending, the carousel waits.

## Copy Approval Gate

Before building any HTML, show the user the complete copy of every slide as plain text — kicker, headline, body, labels, and any verdict line — numbered by slide. Wait for approval, edits, or replacements.

Rendering before this gate wastes work and hides copy problems inside images, where they are slower to spot and slower to fix.

## Copy Accuracy

- Proper nouns are copied verbatim from the source: product names, company names, feature names, people. Never assemble a name by combining a company with a topic (`Anthropic` + `Cowork` is not the product's name; the source says `Claude Cowork`). When a kicker names a product, use the product's real name.
- Every slide must stand alone. When a slide compresses a quote or a long passage, read the result cold: if it no longer states a complete, understandable idea, rewrite it. Compression that loses the logical connector is a defect, not a style choice.
- Numbers, percentages, dates, and limits are transcribed exactly. If a figure needs rounding for the layout, say so on the slide.

## Fixing a Reported Defect

When the user reports a specific problem, fix that problem and nothing else. This is the rule that is easiest to break while believing you are being helpful.

- Change one thing. If the report is "these dots are too pronounced", the deliverable is the dots — not the dots plus the logo size plus the spacing you noticed on the way.
- Adjacent findings get **named, not applied**. Say what else you saw, in one line, and let the user decide whether it is in scope. A finding you are sure about is still not a mandate.
- Watch for cascades. A change you were not asked to make often forces a second one to keep the layout working — that is the signal you already left the requested scope, not a reason to keep going.
- If the fix requires touching something else to be coherent, say so and ask first.

After any change to a fixed asset or a shared layout, prove the rest did not move: `scripts/compare-blocks.mjs` against the previous version, and report the table.

## Visual Rules

Use supporting imagery on every carousel:

- Generated images when they add meaning, especially for AI, Codex, software, and abstract workflow topics.
- Diagrams, cards, charts, flow boards, visual metaphors, icons, or product screenshots when they communicate better than generated art.
- Text overlays rendered in HTML/CSS, not baked into generated images.

Hard QA rules:

- Export every slide at the selected platform size.
- Enforce a typography floor. On any `1080px`-wide export, every user-facing word must have a computed font size of at least `40px`. Body copy, labels, captions, sources, caveats, methodological notes, footer brand text, and swipe text are not exempt. Only page counters made entirely of numbers and purely decorative single-character marks may use `24px`. Scale these floors proportionally when the export width is not `1080px`.
- Never shrink text below the typography floor to make content fit. Shorten the copy, split the content across slides, reflow the layout, or remove low-value detail instead.
- Treat any user-facing word below the typography floor as a red issue that blocks delivery.
- Always center the primary hook block on the first content slide. Its bounding box must be horizontally centered in the canvas and its text must use centered alignment. A left-aligned or edge-anchored cover hook is a red issue **unless the user decides otherwise** — see Documented Layout Exceptions below.
- Balance the vertical composition. The gap above the first content pixel and the gap below the last must be within `4%` of the canvas height of each other. This is the check that catches dead space nobody meant to leave: when you remove an element, revisit every layout constant that existed to accommodate it. A stage offset that once cleared a badge keeps pushing content down long after the badge is gone. Fixed CTA assets are exempt.
- Center chrome optically, not just geometrically. Symmetric CSS padding does not produce symmetric-looking boxes: a font's line box reserves dead space above the cap height that does not exist below the baseline, and emoji carry their own side bearing. Verify pills, chips, buttons, and counters by measuring the actual background margin around the ink in the rendered PNG, then compensate with asymmetric padding or a `translateY` on the text. `scripts/render-and-audit.mjs` measures this automatically; in the footer it is a red issue.
- Size chrome for its role. Page counters, decorative marks, and similar non-reading elements sit at `24-26px` on a `1080px`-wide export. The `40px` floor is a minimum for text the reader is meant to read, not a target for every glyph on the canvas.
- Keep all readable content inside a central safe area with `5%` clearance from the left and right edges and `10%` clearance from the top and bottom edges. At `1080x1920` this means `x=54..1026` and `y=192..1728`; at `1080x1440` it means `x=54..1026` and `y=144..1296`. Approved fixed CTA assets are exempt.
- Expand the composition deliberately within that safe area. Increase type, reflow visual elements, and use the available width and height before accepting large empty regions around small content. An unnecessarily small composition surrounded by avoidable empty space is a red issue.
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

Valid ids: `cover-hook-centered`, `vertical-balance`, `counter-centered`, `optical-padding`. A listed exception drops that check from red issue to informational note, so the rest of the QA keeps blocking normally.

Never add an exception on your own judgment to make a render pass. If a rule is in the way and the user has not ruled on it, ask.

## Deriving Brand Rules From a Published Set

When extracting or updating a brand preset from already-published carousels:

1. Inspect **every** available carousel, not a convenient sample. One cover is evidence of one cover.
2. If a trait varies across the set (accent color of a line, headline case, footer style), document the variation and the rule that governs the choice. Never promote what appeared in a single example to a fixed law.
3. State measured values (hex, px, ratios) rather than adjectives, and record how they were measured.
4. Where identification is uncertain (a font from PNGs only), write the confidence and the runner-up, so a later correction is cheap.

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

If the active preset defines a caption template, follow it exactly: fixed blocks (greetings, service lines, links, fixed hashtags) are reproduced verbatim and never adapted to the topic; only the blocks the template marks as written change per carousel. Deliver the caption as one plain-text block, clearly labelled and ready to paste with no further editing.

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
- A ready-to-paste caption block in the active preset's template.
- A visual QA note confirming size, readability, centered layout, CTA behavior, and any remaining caveat.
