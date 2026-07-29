# Social Carousel Generator — Branded Carousel Skill

An agent skill for turning source material into platform-ready social carousel packages:

```
source (PDF / URL / YouTube / text / screenshots) → angles → slides → HTML package → PNG exports + captions
```

It covers the full pipeline: source extraction, angle selection, slide drafting, an editable HTML/CSS package rendered to platform-size PNGs via browser screenshot, strict visual QA (typography floor, safe areas, centered hook), humanized captions, and a fixed brand CTA — with explicit confirmation gates before anything renders.

Works with agent harnesses that support file-based skills (Claude Code, Codex, and similar).

> **Note — this skill needs a real machine.** Production runs on Claude Code (the CLI in a terminal is enough; the desktop app also works). The claude.ai web chat cannot run it: its sandbox has no persistent disk for the carousel package, cannot start the local HTTP server, and cannot capture slides with Playwright/Chrome. The web chat is still fine for discussing angles and hooks conversationally — then bring the source to Claude Code on a computer to produce.

## What's in this folder

| Path | Purpose |
|---|---|
| [SKILL.md](SKILL.md) | The skill itself: workflow, gates, visual rules, QA |
| [references/html-rendering.md](references/html-rendering.md) | Static HTML screenshot workflow, contact-sheet QA, typography-floor QA |
| [references/la-casa-preset.md](references/la-casa-preset.md) | La Casa de Aurelio brand preset: voice, palette, measured background field, footer spec, fixed CTA |
| [scripts/render-and-audit.mjs](scripts/render-and-audit.mjs) | Renders every slide at platform size and runs the programmatic QA. Exits 3 on red issues |
| [scripts/measure-stage.mjs](scripts/measure-stage.mjs) | Real height of every block per slide — run it before reflowing to a shorter canvas |
| [scripts/compare-blocks.mjs](scripts/compare-blocks.mjs) | Block-by-block diff of two PNGs, to prove a fixed asset's layout did not move |
| [assets/template/](assets/template/) | Package scaffolding: `index.html`, `styles.css`, `slide-data.js`, plus `cta-ig.html` to regenerate the CTA |
| [assets/fonts/](assets/fonts/) | Archivo Black, Roboto Mono, Inter — bundled so renders are identical on any machine |
| [assets/la-casa-cta.png](assets/la-casa-cta.png) | Fixed final CTA frame for La Casa (1080×1920, TikTok) |
| [assets/la-casa-cta-ig.png](assets/la-casa-cta-ig.png) | Fixed final CTA frame for La Casa (1080×1440, Instagram) |

## Key features

- **Brand gate** — always asks whether the carousel is for La Casa de Aurelio or another brand. La Casa loads the bundled preset (voice, palette, footer, fixed CTA) with zero extra questions; other brands get a short setup interview instead.
- **Platform gate, 2026 sizes** — always asks TikTok or Instagram before planning. TikTok exports at `1080x1920`, Instagram at `1080x1440` (3:4).
- **Source-faithful extraction** — accepts PDFs, URLs, YouTube video links (via transcript), pasted text, and screenshots. Extracts 1–3 shareable angles; inventing content that is not in the source is prohibited.
- **Confirmation before rendering** — the recommended carousel split (how many carousels, which angles) plus two hook options per carousel (A/B with a reasoned recommendation) must be approved by the user before any slide is built.
- **Hook craft built in** — every hook follows the brand's two-part pattern (setup headline + twist subtitle) with explicit quality criteria: concrete numbers for authority, tension between the two lines, specific over generic, no clickbait the source can't back.
- **Editable HTML package** — every carousel is a small static site (`index.html` + `styles.css` + `slide-data.js`); PNGs are browser screenshots of it, so any fix is a source edit plus re-render, never a PNG patch.
- **Programmatic QA before your eyes** — `scripts/render-and-audit.mjs` renders each slide and fails the delivery on: a web font that silently fell back, any word under the typography floor, anything outside the safe area, orphan last lines, broken assets, canvas overflow, an off-centre cover hook, vertical imbalance, a counter off the canvas centre, an overlay landing on fixed artwork, and optical imbalance inside chrome — measured on real pixels, because a box can be symmetric while its ink is not. It writes `qa-report.json` and exits 3 if anything is red.
- **Documented layout exceptions** — a brand's approved layout sometimes contradicts a rule. Listing a check id in `slide-data.js` under `layoutExceptions` (and recording the reason in `manifest.json`) drops that one check to an informational note while everything else keeps blocking. Never a shortcut the agent takes on its own.
- **Typography floor** — on a 1080px-wide export every user-facing word must render at ≥ `40px` computed size (`24px` only for numeric page counters and decorative marks). Copy that doesn't fit gets shortened or split, never shrunk.
- **Safe-area QA** — all readable content stays ≥ `5%` from the side edges and ≥ `10%` from top/bottom (app overlay zones); the first-slide hook must be horizontally centered; small compositions floating in empty space are rejected.
- **Fixed brand CTA** — La Casa appends a fixed CTA frame after the content slides, with one bundled asset per size (TikTok and Instagram). The page counter is composed on top at render time, so the same asset serves a carousel of any length. Assets are never cropped or stretched across sizes.
- **Humanized captions** — every slide passage and post description passes a humanizer step (no generic AI phrasing, no filler, no dictionary tone) before delivery.
- **Adaptation mode** — bring an existing carousel of your own (final PNGs or its editable package) and convert it to another platform or size. Copy is transcribed verbatim and confirmed with you, slides are rebuilt in HTML at the target size (originals are never scaled or cropped), and any copy that can't fit the typography floor in the new ratio is adjusted only with your approval. Third-party carousels are never cloned: their screenshots enter the normal creation flow as information sources, and the copy is written from scratch in your brand's voice.

## Installation

**Option A — let your agent install it (recommended).** Open Claude Code and paste:

```text
Install the social-carousel-generator skill from https://github.com/aurelioagency/skills :
1. Run: git clone --filter=blob:none --sparse https://github.com/aurelioagency/skills.git into a temporary folder.
2. Inside it, run: git sparse-checkout set social-carousel-generator
3. Copy the social-carousel-generator/ folder into ~/.claude/skills/social-carousel-generator/
4. Delete the temporary clone and confirm the skill loads.
5. Check the requirements: Python 3 and Playwright (or an installed Chrome).
   Install anything missing (ask me to approve each install command).
6. Explain how to use the skill and ask me if we start my first carousel now.
```

**Option B — manual.** Clone the repo and run the bundled installer:

```powershell
git clone https://github.com/aurelioagency/skills.git
cd skills
node install-skills.mjs social-carousel-generator          # Claude Code
node install-skills.mjs social-carousel-generator --codex  # Codex
```

Any other harness: point it at this folder's `SKILL.md`.

## Updating

Improvements land in the repo; your installed copy never updates itself. To update, re-run the installer from an up-to-date clone — it replaces the installed skill cleanly and records the installed commit in `.installed-from.json`:

```powershell
git pull
node install-skills.mjs social-carousel-generator
```

To find out whether you are behind without installing anything:

```powershell
node install-skills.mjs social-carousel-generator --check
```

## Uninstalling

The installed skill lives entirely in one folder: `~/.claude/skills/social-carousel-generator/`. Removing it never touches your carousel packages (they live in their own project folders), other installed skills, or any clone of the repo. From a clone:

```powershell
node install-skills.mjs social-carousel-generator --remove
```

Or simply delete `~/.claude/skills/social-carousel-generator/` yourself.

## Requirements

- **Python 3** on `PATH` — serves the carousel package locally (`python -m http.server`) during rendering.
- **Playwright** (`npm i playwright`) — captures each slide at the exact platform viewport with `deviceScaleFactor: 1` and drives the bundled QA scripts. The scripts resolve it from the package folder, the skill folder, or a sibling skill's `node_modules`.
- **No API keys and no paid providers** — everything renders locally.

## Usage

Once installed, the skill is available in **every** Claude Code session on the machine. Each carousel job gets its own package folder (`social-carousels/<slug>/`); nothing is stored inside the skill.

Open a Claude Code session and describe the job in your own words, for example:

> Carrusel para La Casa de Aurelio de este artículo: `<url>`

> Carrusel de este video de YouTube: `<link>`

> Adaptá estos carruseles de TikTok a Instagram: `<carpeta o PNGs>`

The skill triggers automatically by matching your request. From there it drives everything and asks for what it needs:

1. Asks the **brand** (La Casa de Aurelio → bundled preset; other brand → short setup interview) and the **platform** (TikTok or Instagram) — skipping any question you already answered in your request.
2. Extracts the source (article text, YouTube transcript, PDF, screenshots) and captures facts and candidate angles in a brief — nothing invented.
3. Proposes the **carousel split** (how many carousels, which angle each) and waits for your confirmation before building anything.
4. Drafts 3–6 content slides per carousel, one job per slide.
5. Builds the editable HTML package and renders ordered PNGs at platform size.
6. Runs `scripts/render-and-audit.mjs` first, then the contact-sheet pass by eye for what a machine cannot judge: meaning, overlap, rhythm. Every red issue is fixed in source and re-rendered before delivery — PNGs are never patched.
7. Delivers `exports-ready/` PNGs plus captions (`post-descriptions.md`), the brief, and a `manifest.json`, with a short validation summary.

### Package output

```text
social-carousels/<slug>/
  index.html          # editable slide source
  styles.css          # visual system
  slide-data.js       # slide content data
  carousel-brief.md   # source, angles, decisions
  post-descriptions.md# captions + hashtags (humanized)
  manifest.json       # platform, size, slide order, CTA status
  qa-report.json      # programmatic QA results per slide
  contact-sheet.png   # all slides on one sheet, for the visual pass
  exports/            # working renders
  exports-ready/      # clean upload files
```

### Multiple carousels and fixes

- Each job = its own package folder. Carousel #2 never touches carousel #1.
- To fix a delivered carousel, point the skill at its package folder — it edits the HTML/CSS/data source and re-renders only the affected slides. PNGs are never patched directly.

## License

MIT — see [LICENSE](../LICENSE) at the repo root.
