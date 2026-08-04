---
name: social-carousel-generator
description: Create static social carousel packages from PDFs, URLs, YouTube videos, pasted text, screenshots, or image references. Use for TikTok or Instagram carousels, educational swipe posts, AI/tool explainers, article-to-carousel and video-to-carousel transformations, adapting existing carousels to another platform or size, and branded carousel exports that need PNG slides, editable HTML source, captions, and visual QA.
---

# Social Carousel Generator

Turn source material into a readable social carousel package for TikTok or Instagram.

Default to the static HTML screenshot workflow because it gives reliable text, layout, and export control. Use generated images, diagrams, charts, cards, and editorial visual systems as supporting imagery, but render final text in HTML/CSS.

## Core Workflow

1. Resolve the preset, platform, language, and CTA mode.
   Completion criterion: the active preset, slide size, language, footer behavior, and CTA behavior are explicit, and the preset carries no unfilled placeholder in any section this carousel will use.
2. Extract the source into shareable angles.
   Completion criterion: source facts, gaps, and one to three candidate carousel angles are captured in the brief without invented content.
3. Recommend the carousel split, present two hook options per carousel, and ask for confirmation.
   Completion criterion: the user has confirmed, reduced, or changed the number of carousels, and picked or edited a hook for each one, before any slide is drafted.
4. Draft the slides and get the copy approved.
   Completion criterion: each carousel has 3-6 content slides, each slide has one job, passages are concise enough for mobile reading, each slide's proposed asset (or none) is listed from the brand's asset bank **together with the viable alternatives**, and the user has approved the full slide copy plus the asset plan as plain text before any HTML is built.
5. Build the editable HTML package and render PNGs.
   Completion criterion: the delivery folder (`<YYYY-MM-DD>-<tema>-<ig|tt>`) contains ordered platform-size PNGs, with CTA appended only when the active preset says so.
6. Run visual QA from contact sheets.
   Completion criterion: every red issue is fixed in source and re-rendered, including clipped text, typography-floor violations, overlap, unsafe top/bottom placement, broken flow spacing, and stale CTA assets.
7. Humanize captions and deliver.
   Completion criterion: the delivery folder holds the ordered PNGs **and `caption.txt`** and nothing else, the editable source is in place, and a short validation summary is given.

When the user brings an existing carousel to convert to another platform or size, steps 2-4 are replaced by Adaptation Mode below: verbatim transcription and faithful rebuild, never re-angling or rewriting approved content.

## Preset Resolution

Before planning content, ask which brand the carousel is for, unless the user already said so in their request:

`¿Para qué marca es este carrusel?`

Then resolve the preset in this order — **never start the interview without checking first**:

1. **A workspace preset for that brand.** Look for `<workspace>/social-carousels/brands/<brand-slug>/preset.md`. If it exists, read it and use it, whatever the brand is. Do not re-interview; ask only what the preset marks as per-carousel (platform, CTA variant). This wins over anything bundled, so a brand the user has edited keeps its edits.
2. **La Casa de Aurelio** (also Agencia Aurelio, Aurelio, or this workspace) with no workspace preset: read the bundled `references/la-casa-preset.md`. It ships a fixed CTA in two variants, so ask which one closes this carousel — normal (`Guarda este post`) or comment (`Comenta AURELIO` to receive the skill by DM). Nothing else about the CTA is up for discussion.
3. **A new brand**: run the setup interview below, and finish it by **writing that brand's preset**.

La Casa is bundled because it is the worked example, not because it is special. To edit it the way any other brand is edited, eject it into the workspace once — copy `references/la-casa-preset.md` to `social-carousels/brands/la-casa/preset.md` along with the fonts and the CTA assets it uses — and edit there. From then on step 1 picks it up and skill updates stop overwriting your changes.

### Setup interview (new brand only)

1. Ask this bilingual language question exactly:
   `Default language is Spanish. Lenguaje es español. ¿Lo quieres cambiar o seguimos así?`
2. Ask for platform if not implied: TikTok or Instagram.
   2026 sizes: TikTok carousel is `1080x1920`. Instagram carousel is `1080x1440` (3:4).
3. Ask for visual references first: URLs, screenshots, images, brand pages, or sample posts. **Derive values from them instead of asking** — pull the hex codes off the images, identify the fonts, read the footer. Ask only what the references cannot answer: palette gaps, tone, audience, footer text.
4. Ask for the brand's **font files** and copy them into the brand folder. A web font that silently falls back to a system sans is a red issue, so this cannot be left for later.
5. Ask whether to use a fixed CTA frame or generate a CTA each run. Recommend fixed. If fixed, ask for the CTA copy, the logo/brand asset and a layout reference, build the asset once in HTML at each size the brand publishes, and save it in the brand folder with its `.html` source.

Do not run a long questionnaire. When the user answers `default`, apply the recommended defaults for the active context.

### Writing the brand preset

The interview ends by filling `references/brand-preset-template.md` and saving it as:

```text
<workspace>/social-carousels/brands/<brand-slug>/
  preset.md            # the filled template
  fonts/               # the brand's font files
  cta-<size>.png       # fixed CTA per size and variant, if any
  cta.html             # the source that produced them
```

Show the filled preset to the user and get it approved before drafting slides — it is the document every future carousel of that brand will obey.

**A preset is never delivered with placeholders left in it.** Before using one — the brand's or the bundled one — scan it for unfilled `<…>` fields. Every section the carousel touches must be resolved, and two are wrong to leave open because the rest of the pipeline reads them directly: the **caption template** (the fixed blocks must be written out verbatim, or the caption cannot be assembled) and the **density budget** (either the brand's own bands, copied into `slide-data.js` as `densityBudget`, or the `density-budget` exception with its reason). If a field is still a placeholder when you need it, stop and ask the user for that value — never guess it and never fall back to another brand's.

### Editing a preset

A preset is a plain markdown file in the user's workspace. They can edit it by hand, or ask for a change in the chat and the agent edits it. Either way:

- Changes apply to the **next** carousel; already-delivered packages keep the values they were built with.
- Skill updates never touch it, because it lives outside the skill folder.
- When a change contradicts something already recorded (a colour, a footer, a CTA), update the preset first and say what it means for future carousels — never let the preset and the rendered work drift apart.

**It lives in the workspace, never inside the skill folder.** Re-installing the skill replaces its files: a preset saved into `~/.claude/skills/…` disappears on the next update. The bundled `references/la-casa-preset.md` is the worked example to imitate, not the place to write.

Two things a new brand must decide explicitly, because inheriting La Casa's answer is wrong:

- **The density budget.** The bands in `scripts/render-and-audit.mjs` were measured on La Casa's published set. Another brand either measures its own and updates the table, or lists `density-budget` under `layoutExceptions` with the reason in `manifest.json`. Judging a brand by another brand's density produces red issues that mean nothing.
- **The cover formula.** Which family and colour carry the headline, which different family and colour carry the twist line, and what graphic the cover uses.

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
2. Twist line: the tension, break, or consequence. It must contrast with the headline in **both font and colour** — the active preset defines how (La Casa: serif italic in the carousel's dominant accent, sentence case). Never hardcode a colour.

Both lines are centered, and both must be short enough to hold the typography floor without shrinking. If a line only works small, rewrite it shorter.

The cover also carries one simple graphic. A cover that is only type reads as a title card, not as a hook — see the preset for the default pattern.

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

**The asset plan is part of this same gate.** For every slide, show which asset from the brand's bank goes on it and **which other bank assets could also work**, so the user chooses instead of discovering the agent's pick inside a rendered image:

```text
Slide 2 — asset propuesto: personaje/tiburon-agobiado-cubierto-de-postits.png (es el slide del problema)
          tambien podrian ir: personaje/tiburon-preocupado-rascandose-la-cabeza.png · iconos/pila-de-papeles.png
Slide 4 — sin asset (el diagrama de pasos comunica mejor) · podria ir: iconos/engranajes-conectados.png
```

List every viable alternative the bank actually has for that slide's job — if there is only one candidate, or none, say that. Do not build a single slide until the user has approved copy **and** assets together; swapping an asset costs nothing at this stage and a re-render round after.

Rendering before this gate wastes work and hides copy and asset problems inside images, where they are slower to spot and slower to fix.

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

- **Image files come only from the brand's asset bank** — read `references/asset-bank.md`. The bank is a folder of finished PNGs (local or a git repo) whose **fully descriptive filenames are the selection mechanism**: the agent reads the names, matches them against each slide's job, opens only the shortlisted candidate to confirm, and proposes the pairing at the copy gate. Nothing fits → the slide goes without an asset, and the user is told what would have served. Never pull images from outside the bank or generate them on the fly.
- Diagrams, cards, charts, flow boards, visual metaphors, and icons built in HTML/CSS when they communicate better than an image — or always, for a brand with no bank.
- Text overlays rendered in HTML/CSS, not baked into images.

Hard QA rules:

- Export every slide at the selected platform size.
- Enforce a typography floor. On any `1080px`-wide export, every user-facing word must have a computed font size of at least `40px`. Body copy, labels, captions, sources, caveats, methodological notes, footer brand text, and swipe text are not exempt. Only page counters made entirely of numbers and purely decorative single-character marks may use `24px`. Scale these floors proportionally when the export width is not `1080px`.
- Never shrink text below the typography floor to make content fit. Shorten the copy, split the content across slides, reflow the layout, or remove low-value detail instead.
- Treat any user-facing word below the typography floor as a red issue that blocks delivery.
- Always center the primary hook block on the first content slide. Its bounding box must be horizontally centered in the canvas and its text must use centered alignment. A left-aligned or edge-anchored cover hook is a red issue **unless the user decides otherwise** — see Documented Layout Exceptions below.
- Balance the vertical composition. The gap above the first content pixel and the gap below the last must be within `4%` of the canvas height of each other. This is the check that catches dead space nobody meant to leave: when you remove an element, revisit every layout constant that existed to accommodate it. A stage offset that once cleared a badge keeps pushing content down long after the badge is gone. Fixed CTA assets are exempt.
- Center chrome optically, not just geometrically. Symmetric CSS padding does not produce symmetric-looking boxes: a font's line box reserves dead space above the cap height that does not exist below the baseline, and emoji carry their own side bearing. Verify pills, chips, buttons, and counters by measuring the actual background margin around the ink in the rendered PNG, then compensate with asymmetric padding or a `translateY` on the text. The correction belongs to that element's font size and box height — never copy a working `translateY` onto a different pill. `scripts/render-and-audit.mjs` measures this automatically; in the footer it is a red issue.
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

Valid ids: `cover-hook-centered`, `vertical-balance`, `counter-centered`, `optical-padding`, `density-budget`. A listed exception drops that check from red issue to informational note, so the rest of the QA keeps blocking normally.

`density-budget` is the one a new brand is most likely to need: the density bands are La Casa's, measured on its published set. A brand with a different visual weight either measures its own bands or takes this exception — see the brand preset template.

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
  manifest.json
  assets/
  2026-08-03-claude-piloto-automatico-ig/    # la carpeta de entrega
```

### The delivery folder

One folder per carousel, named so the user can drag it straight into Drive without renaming anything:

```text
<YYYY-MM-DD>-<tema-en-kebab-case>-<ig|tt>
```

The date is the delivery date, the middle is the carousel's topic (the package slug), and the platform uses the abbreviation people actually use: `ig` for Instagram, `tt` for TikTok.

Inside it, **only two kinds of file**: the ordered PNGs (`01.png`, `02.png`, …) and `caption.txt`. Nothing else ever goes in there — no report, no contact sheet, no working copy. Render straight into it with `--out <carpeta>`.

`qa-report.json` and `contact-sheet.png` are working files: produced during the job, read during QA, and **deleted before delivery**. There is no `exports/` (it was a byte-for-byte duplicate) and no `post-descriptions.md` — the caption ships as `caption.txt` inside the delivery folder, and whatever is worth remembering about it goes in `carousel-brief.md`.

Read `references/html-rendering.md` when implementing the static HTML screenshot workflow or visual QA.

## Captions

Always generate post descriptions with hashtags.

If the active preset defines a caption template, follow it exactly: fixed blocks (greetings, service lines, links, fixed hashtags) are reproduced verbatim and never adapted to the topic; only the blocks the template marks as written change per carousel. Deliver the caption as one plain-text block, clearly labelled and ready to paste with no further editing.

Check the template is actually filled before writing a single caption. A preset whose caption section still carries `<…>` placeholders, or that has no caption section at all, is not usable: ask the user for the greeting, the fixed lines, the links and the fixed hashtags, write them into the preset, and only then assemble the caption. Shipping a caption invented around a placeholder is worse than asking.

**Ship the caption as a file, not only as chat text.** Write it to `caption.txt` inside the delivery folder — plain text, UTF-8, no markdown, no headings, no code fences, nothing but the caption itself, ready to select-all and paste. It sits next to the PNGs because that is the folder the user opens to publish. Paste it in the chat too.

Use `$humanizer` on each slide passage and each post description before final export. If `$humanizer` is not installed, ask to install it globally with the skill installer when available. If installation is not available, continue only after applying the built-in humanizer pass:

- Remove generic AI phrasing.
- Remove inflated claims.
- Cut filler.
- Keep one meaning once.
- Use natural rhythm for the selected language.
- Avoid dictionary-style explanations.

## Deliverable

Return the delivery folder and a short validation summary.

What the user actually publishes — everything else is working material:

- Ordered PNG exports in `<YYYY-MM-DD>-<tema>-<ig|tt>/`.
- `caption.txt` in that same folder — the caption alone, plain text, ready to paste.

What the package keeps so the carousel can be fixed later without rebuilding it:

- Editable HTML/CSS/data source plus `assets/`.
- `manifest.json` (platform, size, CTA variant, layout exceptions).
- `carousel-brief.md` — short: source, angles, decisions, caveats. Not a report.

Nothing else ships. `qa-report.json` and `contact-sheet.png` are deleted after the QA pass; there is no `exports/` and no `post-descriptions.md`.

And in the chat: the caption pasted in full, plus a visual QA note confirming size, readability, centered layout, CTA behavior, and any remaining caveat.
