---
name: social-carousel-generator
description: Create static social carousel packages from PDFs, URLs, YouTube videos, pasted text, screenshots, or image references. Use for TikTok or Instagram carousels, educational swipe posts, AI/tool explainers, article-to-carousel and video-to-carousel transformations, adapting existing carousels to another platform or size, and branded carousel exports that need PNG slides, editable HTML source, captions, and visual QA.
---

# Social Carousel Generator

Turn source material into a readable social carousel package for TikTok or Instagram.

Default to the static HTML screenshot workflow because it gives reliable text, layout, and export control. Use generated images, diagrams, charts, cards, and editorial visual systems as supporting imagery, but render final text in HTML/CSS.

## Core Workflow

1. Resolve the preset, language, and CTA mode. Size is fixed and never asked (see Format, length and density).
   Completion criterion: the active preset, language, footer behavior, and CTA behavior are explicit, and the preset carries no unfilled placeholder in any section this carousel will use.
2. Extract the source into shareable angles.
   Completion criterion: source facts, gaps, and one to three candidate carousel angles are captured in the brief without invented content.
3. Recommend the carousel split, present two hook options per carousel, and ask for confirmation.
   Completion criterion: the user has confirmed, reduced, or changed the number of carousels, and picked or edited a hook for each one, before any slide is drafted.
4. Draft the slides and get the copy approved.
   Completion criterion: each carousel has as many content slides as its material supports and no more than 9, each slide has one job and stays inside the density budget below, every technical term the argument depends on is grounded on its own slide (see *Grounding Technical Terms*), each slide's proposed asset (or none) is listed from the brand's asset bank **together with the viable alternatives**, and the user has approved the full slide copy plus the asset plan as plain text before any HTML is built.
5. Build the editable HTML package and render PNGs.
   Completion criterion: the delivery folder (`<tema-en-kebab-case>`) contains ordered `1080x1440` PNGs, with CTA appended only when the active preset says so.
6. Run visual QA from contact sheets.
   Completion criterion: every red issue is fixed in source and re-rendered, including clipped text, typography-floor violations, overlap, unsafe top/bottom placement, broken flow spacing, and stale CTA assets.
7. Build the vertical Short and get the music approved.
   Completion criterion: `short.mp4` is built from the approved slides, the user has seen the chosen track — already cut to the video's length — and approved it, and the track is recorded in `manifest.json` and appended to the brand's music log. Nothing is published before that yes.
8. Humanize captions and deliver.
   Completion criterion: the delivery folder holds the ordered PNGs, `caption.txt` **and `short.mp4`** and nothing else, it has been copied into the brand's Drive folder if the preset names one — and only after the user approved, never on the strength of a clean audit alone, the editable source is in place, and a short validation summary is given.

When the user brings an existing carousel to convert to another platform or size, steps 2-4 are replaced by Adaptation Mode below: verbatim transcription and faithful rebuild, never re-angling or rewriting approved content.

## Preset Resolution

Before planning content, ask which brand the carousel is for, unless the user already said so in their request:

`¿Para qué marca es este carrusel?`

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

**State the slide count you are proposing for each carousel, and why that number** — it is part of what the user is confirming here, and it is far cheaper to change now than after the copy is drafted. Size and the text budget per slide are fixed by the skill; the count is not. See Format, length and density below.

## Format, length and density

These three are skill-wide quality rules, not brand taste. They apply to every carousel regardless of the preset. A brand may override one only by saying so explicitly in its preset, with the reason.

### One size

Every carousel is **`1080x1440` (3:4)**. There is no platform question, no TikTok variant and no `1080x1920` carousel: the same export is published to Instagram and to TikTok, which displays it fine. The delivery folder carries no size or platform suffix at all — see *The delivery folder* below.

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
- **Final check:** if a slide is not understood in 2-3 seconds of reading, it is overloaded even when it sits inside the band.
- **Reference carousels** (checklist, comparison, template) tolerate more density, because the goal is that people save them and come back, not that they read them at speed. Never assume it — the user declares it when confirming the split, and it is recorded in `manifest.json`.

This budget is what governs while writing. The pixel bands in `scripts/render-and-audit.mjs` stay as the safety net that catches a slide which ends up a wall or a blank after rendering.

## Slide Grammar

Use this default grammar unless the source demands a different structure:

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

**A slide that looks empty is missing content, not size.** Add a fact from the source — the number behind the claim, the counter-case, the second experiment — or accept the air. Never fill a slide by enlarging what is already on it. Scaling type or graphics to occupy the canvas produces a slide that is bigger and says the same, and it is how a carousel drifts out of the brand: the type outgrows the headline level, the graphics turn into walls, and every later correction is about size. If the source has nothing more to say on that slide, the slide is finished at the size the content needs.

There is deliberately **no minimum fill metric**. `measure-stage.mjs` reports slack and flags overflow; it does not judge how full a slide is, because a threshold there gets chased and the chase is the defect.

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

The copy shown here has already passed the filter in *Grounding Technical Terms* below: every term the argument depends on is readable on its own slide, and nothing is explained that did not need to be.

## Copy Accuracy

- Proper nouns are copied verbatim from the source: product names, company names, feature names, people. Never assemble a name by combining a company with a topic (`Anthropic` + `Cowork` is not the product's name; the source says `Claude Cowork`). When a kicker names a product, use the product's real name.
- Every slide must stand alone. When a slide compresses a quote or a long passage, read the result cold: if it no longer states a complete, understandable idea, rewrite it. Compression that loses the logical connector is a defect, not a style choice.
- Numbers, percentages, dates, and limits are transcribed exactly. If a figure needs rounding for the layout, say so on the slide.
- **Never turn a descriptor into a name.** The source's *"the ultra capability setting in ChatGPT"* is not a product called "modo ultra". Translating a description into a proper noun invents a product.
- **A third-party name earns its place only if the slide can say who it is without spending a line.** A company the audience cannot place — sitting in the kicker or the verdict, the most visible line — costs attention and returns nothing. Keep the fact, drop the name, and record it in `carousel-brief.md` with its quote. Apply it to every such name in the carousel or to none: one named startup among three anonymous ones reads as an oversight.
- **A description the reader cannot resolve is worse than a proper noun.** "El modelo grande" names nothing; `GPT-5.5` does. When a model, tool or product needs its size or role understood, attach it to the name in the same sentence, or in the graphic's label.
- **Every fact on a slide comes from the same passage.** An example borrowed from another section, dropped onto a slide about a specific company, reads as that company's example. That is misattribution even when both facts are true.
- **Name the action the source describes.** *"After enabling retained reasoning"* is enabling, not implementing: a checklist item that says "guardá lo que el modelo pensó" invents manual work that does not exist.
- **Body copy is sentences, not notes.** Two fragments without a subject ("Encontrar datos difíciles en la web. La misma prueba, tres meses después.") read as an outline. If a line has no verb and no subject, it is not finished.

## Grounding Technical Terms

The goal is that most readers follow the carousel end to end without stopping at a word they do not know. That is not the same as explaining everything: a carousel that defines every term reads like a glossary and loses the argument.

Apply this filter **term by term**, not to the carousel as a whole:

- **The slide's argument holds even if the reader does not know the word → do not explain it.** It is background: the thing being talked about, not the thing being explained. On a carousel about prompting, `modelo`, `LLM` and `prompt` are background. Same for a term that only appears in passing — if `api key` shows up in one line of a carousel about something else, it is not this carousel's job to explain it.
- **The slide's argument depends on the word → ground it in the same slide, the first time it appears.** `MÁS CAPAS, MÁS SESGO` says nothing to someone who does not know what a `capa` is: there the term is the axis of the slide.
- **The word is one item in a list of options and the point is "these alternatives exist" → rename it by what it does, or leave it.** `Codificaciones posicionales` became `Atar cada palabra a sus vecinas más cercanas`. Nobody needed the technical name to understand that four levers exist.

### Change the words, do not add a definition

This is the part that goes wrong first, and it goes wrong while feeling helpful. The reflex is to stick a definition in front of the term — *"Una capa es…"* — and a definition eats the whole line, sounds like a manual, and stops the story. Almost always the same meaning fits **inside the sentence that was already there**, just written differently:

| Definition (the wrong reflex) | Same idea, just written differently |
|---|---|
| *Una regla del modelo: cada palabra solo puede mirar a las anteriores.* | *Cada palabra solo puede mirar a las anteriores: lo que viene después le queda tapado.* — "tapado" is what makes the headline `LA MÁSCARA CAUSAL` land. |
| *Una capa es cada pasada del modelo sobre el texto.* | *Relee el texto capa por capa, y cada pasada hereda lo que la anterior priorizó.* — capa ≈ pasada, by context, without a definition. |
| *Le dicen "perdido en el medio".* | *Se pierde justo cuando queda en el medio.* — translates the English headline `LOST IN THE MIDDLE` without announcing that it is translating it. |

Evaluate case by case: a short gloss does earn its place sometimes. What is never right is reaching for one by default. **The term keeps its real name** — the máscara causal is still called máscara causal; what changes is that the sentence around it makes it obvious.

**A graphic's label is the cheapest place to ground a term**, because it has to name the object anyway. `Todo lo que le pegás, de principio a fin` over the cover's context bar grounds `contexto` without spending a single sentence of body copy.

### When it does not fit

Cutting the concept is the **last** option, not the first. Before dropping anything, try, in this order:

1. Reword it shorter — most of the time the sentence was carrying dead weight anyway.
2. Move the grounding to the graphic's label, where it costs no body copy.
3. Split the idea across two slides. There is room: the ceiling is 10 exported images.
4. Move the detail to the caption, which has no density budget.

Only if none of those work does the concept come out of the carousel, and even then say so to the user instead of dropping it silently — it may be worth its own carousel.

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

**Before drawing any chart or diagram, read `references/data-encoding.md`.** It covers what
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
- Center chrome optically, not just geometrically. Symmetric CSS padding does not produce symmetric-looking boxes: a font's line box reserves dead space above the cap height that does not exist below the baseline, and emoji carry their own side bearing. Verify pills, chips, buttons, and counters by measuring the actual background margin around the ink in the rendered PNG, then compensate with asymmetric padding or a `translateY` on the text. The correction belongs to that element's font size and box height — never copy a working `translateY` onto a different pill. `scripts/render-and-audit.mjs` measures this automatically; in the footer it is a red issue.
- Size chrome for its role. Page counters, decorative marks, and similar non-reading elements sit at `24-26px` on a `1080px`-wide export. The `40px` floor is a minimum for text the reader is meant to read, not a target for every glyph on the canvas — and a chart's reference layer is not reading text either (see the floor exceptions above).
- Keep all readable content inside a central safe area with `5%` clearance from the left and right edges and `10%` clearance from the top and bottom edges. At `1080x1440` this means `x=54..1026` and `y=144..1296`. Approved fixed CTA assets are exempt.
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

Valid ids: `cover-hook-centered`, `vertical-balance`, `counter-centered`, `optical-padding`, `density-budget`, `slide-grammar`. A listed exception drops that check from red issue to informational note, so the rest of the QA keeps blocking normally.

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
  claude-piloto-automatico/                  # la carpeta de entrega
```

### The delivery folder

One folder per carousel, named so the user can drag it straight into Drive without renaming anything:

```text
<tema-en-kebab-case>
```

**The topic and nothing else** — no date prefix, no platform or size suffix. It is the same string as the package slug, so the delivery folder repeats its parent's name; that is expected, not a mistake.

Both extras were dropped on 2026-08-14 because they cost more than they gave:

- **No date.** The delivery date is already in `manifest.json`, and the one date worth having on the folder is the *publication* date, which `post-for-me` stamps on when it actually publishes (`<folder>` → `YYYY-MM-DD-<folder>_POST`). With a date already in the name that rename produced two of them.
- **No `-ig`.** There is only one carousel size and it goes to Instagram and TikTok alike, so the suffix labelled nothing and read as a restriction that does not exist.

Inside it, **only three kinds of file**: the ordered PNGs (`01.png`, `02.png`, …), `caption.txt` and `short.mp4`. Nothing else ever goes in there — no report, no contact sheet, no working copy. Render straight into it with `--out <carpeta>`.

### Copying it to Drive

If the preset names a Drive folder, copy the delivery folder into it so the user does not have to
drag anything.

**Only after the user's approval — never before.** Drive is shared: whatever lands there is
visible to everyone with access and syncs to their machines, so it is publication-adjacent, not
a working directory. The copy happens when *all* of these are true:

- the visual QA passes with no red issues;
- the user has approved the track (the gate in *Music* above);
- there is no correction pending — no open question, no "cambiá esto" waiting on an answer.

Passing the automated audit is **not** approval. A carousel can be clean at the pixel level and
still get five copy changes in the next message; that happened on the carousel this rule came
from. If in doubt about whether the last round closed, ask before copying.

**Copy once, at the end; never render into Drive.** It is tempting to point `--out` straight at
the synced folder and skip the copy, and it is wrong: a carousel gets re-rendered on every QA
round and every correction — eight times in one real session — so Drive would sync seventy-odd
PNGs to end up holding nine, and the user would watch half-finished versions appear and vanish
in a shared folder. Render locally, deliver locally, copy once when it is approved.

Check first whether a folder of that name is already there and **never overwrite one** — ask
instead. If the carousel changes after it was copied, re-copy it and say so, rather than leaving
Drive holding a version the user already asked you to change.

`qa-report.json` and `contact-sheet.png` are working files: produced during the job, read during QA, and **deleted before delivery**. There is no `exports/` (it was a byte-for-byte duplicate) and no `post-descriptions.md` — the caption ships as `caption.txt` inside the delivery folder, and whatever is worth remembering about it goes in `carousel-brief.md`.

Read `references/html-rendering.md` when implementing the static HTML screenshot workflow or visual QA.

## The vertical Short (MP4)

Every carousel also ships a `1080x1920` video built from the same approved slides, so the
same work covers YouTube Shorts. Build it with `scripts/build-short.mjs` after the visual QA
passes — never from unapproved slides.

**A clean QA is not sign-off.** Build the video only once the user has said the images are
finished. Any slide that changes afterwards invalidates the frames, and rebuilding fetches a
different track, so the approval round starts over. It happened twice in one session.

```bash
node <skill-dir>/scripts/build-short.mjs --port 8765 --out <carpeta-de-entrega>/short.mp4
```

- **Frames are re-rendered with `?video=1`**, which drops the swipe prompt. In a Short there
  is nothing to swipe, and the line reads as leftover carousel chrome. The PNGs the user
  publishes as a carousel are not touched.
- **Slide duration is shared out by how much text each slide carries**, mapped onto `3-8s`
  against that carousel's own lightest and heaviest slide. The CTA gets `3s`. The music is
  then cut to exactly that total — there is no fixed video length.
- The slides sit centered on the taller canvas and the bands are filled with the brand's
  field colour, not black, so the seam does not show.

**The video does not promise legibility.** A slide carrying a methodological note cannot be
read in 8 seconds. The Short invites the viewer to pause; it does not replace the carousel.
Say that to the user rather than stretching the video until it is unwatchable — a carousel
like the OpenAI one needs ~92s to actually be read, and that is not a Short any more.

### Music

`scripts/fetch-music.mjs` picks an instrumental background track from archive.org. No
account, no API key, no browser.

**The methodology is fixed — do not "improve" it into fetching more:** one page of results
chosen at random, 20 rows, filter those 20, pick one at random among the survivors. The next
run lands on a different page, so the pool rotates.

- The query carries **genre terms only**. Never add `background music` on its own: it drags
  in corporate, epic, Christmas, horror stock and 1950s department-store muzak, all of which
  pass any decency filter and none of which sets a mood.
- Title filters drop covers and compilations of other people's songs, type beats, YouTube
  rips, vocals, stingers, explicit content, and wrong genres.
- **No language, alphabet or country filters, and do not add any.** Lofi is not any
  country's national music: if the search returns country-tagged material, the query is
  wrong, not the language. Measured over 200 candidates with the genre query, rules for
  Cyrillic/CJK/Thai/Arabic caught exactly zero. What did show up was foreign pop relabelled
  as lofi, and the "version or compilation of another song" rule catches that in any language.
- Tracks must run **1 to 5 minutes**. Below that there is nothing to choose from; above it
  they stop being songs and become hour-long mixes.
- The track is downloaded whole and its loudness profile measured end to end, then the
  steadiest window of the video's length is cut, normalised to `-16 LUFS` with fades.

### Cuando el buscador de archive.org se cae

Pasa, y pasa entero: `advancedsearch.php` devuelve **HTTP 200 con
`{"error":"[BACKEND_ERROR] ..."}`** mientras `/metadata` y las descargas siguen
funcionando perfectamente. Probar si el dominio responde no sirve para detectarlo.

El carrusel no se queda sin video por eso. La cadena, en orden:

1. **Búsqueda normal.** Lo de arriba.
2. **`--item <id>`**, que saltea el buscador y toma la pista de un item conocido —
   misma criba de títulos, mismo rango de duración, misma ventana medida. El
   identificador sale de `manifest.json > short.music.source` de cualquier carrusel
   anterior, o de la URL del item. Lo aceptan `fetch-music.mjs` y `build-short.mjs`:

   ```bash
   node <skill-dir>/scripts/build-short.mjs --port 8765 --item jamendo-464313 --out <carpeta>/short.mp4
   ```
3. **Reusar un recorte local** (`<paquete>/assets/music.mp3` de otro carrusel), solo si
   dura al menos lo que el video nuevo. Es el último recurso porque el recorte ya está
   normalizado y con fades: no se le puede elegir otra ventana.

**Repetir música entre carruseles no es problema** — decisión de La Casa, 2026-08-16.
No hace falta buscar una pista nueva a toda costa; una ya aprobada sirve igual.

**Show the chosen track to the user and wait for a yes before publishing.** This gate is not
optional and cannot be automated away: the filters read titles, so a track can be named well
and sound wrong, and nothing in the pipeline can listen to it.

### Logging the approved track

Once the user says yes, the track gets recorded in **two** places. Neither is optional, and a
carousel is not delivered until both are done.

1. **`manifest.json > short.music`**, with `title`, `artist`, `source` (the archive.org page) and
   `window` (how many seconds from where). This is the copy that survives: a package whose
   manifest has no music block cannot have its track recovered later. It has already happened —
   `openai-jornada-reemplazo` is logged as `SIN REGISTRO` forever because of exactly this.
2. **The brand's music log**, if the preset names one. Its URL and column list live in the
   preset, because which log a brand keeps is a brand decision.

**A native Google Sheet cannot be written to, a synced `.xlsx` can.** The Drive connector reads
spreadsheets but only edits file metadata — title and parent folder, never cells. And the local
Drive mount does not help by itself: a native Sheet lands on disk as a `.gsheet` stub of about
190 bytes that merely points at the real file on Google's servers, so writing over it destroys
the shortcut and changes nothing.

What does work, and is what La Casa uses: keep the log as a real `.xlsx` inside the synced Drive
folder. It is an ordinary file on disk, so the agent opens it, appends the row and saves, and
Drive syncs it up. Google Sheets opens and edits `.xlsx` the same as a native sheet. Check the
preset for the brand's log path and column order.

Two things not to do:

- Do **not** rebuild a native sheet with `create_file` to fake a write. A new file is a new ID,
  which breaks every existing link to the log and throws away its formatting and history.
- Do **not** write to a synced file the user may have open in the browser without saying so
  first — Drive resolves that into a conflicted copy. Mention it, or ask.

If a brand insists on a native Sheet, the row is emitted **ready to paste** instead:
tab-separated, in the log's exact column order, handed over with the sheet link and a plain
statement that pasting it is the user's step.

### Gotchas that already cost a debugging round

- `ebur128` only emits its per-frame profile with `-loglevel verbose`. Without it there are
  zero samples and the window picker silently falls back to a fixed offset — which looks like
  a working measurement until you notice every track lands on the same percentage.
- ffmpeg writes that profile to **stderr and exits 0**, so `execFileSync` inside a `try/catch`
  never sees it. Use `spawnSync` and read `.stderr` unconditionally.
- The profile line reads `t: 1.0  TARGET:-23 LUFS  M:-14.2`. A pattern expecting `t:` directly
  followed by `M:` never matches.
- Do **not** compute slide durations as "reading speed, then clamp to a maximum": every
  content slide overshoots the cap, so they all come out at exactly the maximum and the
  share-out shares nothing.
- ffmpeg cannot seek cleanly into an arbitrary point of a long MP3 — it reads forward.
  Measured on an 8-hour, 1 GB file: jumping to minute 10 took 19s, jumping to hour 7 never
  finished. The duration ceiling is what keeps the download cheap.
- archive.org returns a file's `length` sometimes as `MM:SS` and sometimes as seconds.

## Captions

Always generate post descriptions with hashtags.

**Never more than 5 hashtags, on any platform.** This is a platform limit, not brand taste, so it holds for every preset and outranks a caption template that asks for more: if the template's fixed tags plus its dynamic ones add up past 5, the template is wrong and gets fixed before the caption is written — never trimmed silently at the last moment. How the 5 are split between fixed and per-topic tags is a brand decision and lives in the preset.

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

- Ordered PNG exports in `<tema-en-kebab-case>/`.
- `caption.txt` in that same folder — the caption alone, plain text, ready to paste.
- `short.mp4` in that same folder — the vertical video, same caption, for YouTube Shorts.

What the package keeps so the carousel can be fixed later without rebuilding it:

- Editable HTML/CSS/data source plus `assets/`.
- `manifest.json` (size, CTA variant, layout exceptions).
- `carousel-brief.md` — short: source, angles, decisions, caveats. Not a report.

Nothing else ships. `qa-report.json` and `contact-sheet.png` are deleted after the QA pass; there is no `exports/` and no `post-descriptions.md`.

And in the chat: the caption pasted in full, plus a visual QA note confirming size, readability, centered layout, CTA behavior, and any remaining caveat.
