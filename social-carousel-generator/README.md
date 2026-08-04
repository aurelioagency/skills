# Social Carousel Generator — Branded Carousel Skill

An agent skill for turning source material into platform-ready social carousels (Instagram 1080×1440 / TikTok 1080×1920) with an editable architecture:

```
source (PDF / URL / YouTube / text / screenshots) → angles → hooks → slides → HTML package → PNG + caption
```

It covers the full pipeline: source extraction, angle selection, hook craft, slide drafting, an editable HTML/CSS package rendered to platform-size PNGs via browser screenshot, programmatic visual QA (typography floor, safe areas, centered hook, density budget), humanized captions, and a fixed brand CTA — with explicit approval gates before anything renders.

Works with agent harnesses that support file-based skills (Claude Code, Codex, and similar).

> **Note — this skill needs a real machine.** Production runs on Claude Code (the CLI in a terminal is enough; the desktop app also works). The claude.ai web chat cannot run it: its sandbox has no persistent disk for the carousel package, cannot start the local HTTP server, and cannot capture slides with Playwright/Chrome. The web chat is still fine for discussing angles and hooks conversationally — then bring the source to Claude Code on a computer to produce.

## What's in this folder

| Path | Purpose |
|---|---|
| [SKILL.md](SKILL.md) | The skill itself: workflow, gates, visual rules, QA |
| [references/la-casa-preset.md](references/la-casa-preset.md) | La Casa de Aurelio brand preset: voice, palette, measured background field, cover formula, footer spec, fixed CTA |
| [references/brand-preset-template.md](references/brand-preset-template.md) | Fill-in template for **your own brand**: palette, fonts, cover formula, footer, CTA, caption, density budget, asset bank |
| [references/asset-bank.md](references/asset-bank.md) | The asset bank contract: a folder (local or git) of brand imagery the agent places **by looking at it** |
| [references/html-rendering.md](references/html-rendering.md) | Static HTML screenshot workflow, contact-sheet QA, typography-floor QA, implementation traps |
| [scripts/](scripts) | Bundled Node helpers (render + programmatic QA, stage measuring, block diff, contact sheet) |
| [assets/template/](assets/template/) | Package scaffolding: `index.html`, `styles.css`, `slide-data.js`, plus `cta-ig*.html` and `make-cta.mjs` to regenerate a CTA |
| [assets/fonts/](assets/fonts/) | Archivo Black, Roboto Mono, Inter — bundled so renders are identical on any machine |
| [assets/](assets/) | The four fixed CTA frames for La Casa: normal and comment variant, one pair per size |

## Key features

- **Bring your own brand** — La Casa de Aurelio ships as a worked example, but the skill is not tied to it. The first carousel for a new brand runs a short setup interview (derived from your references, not from a questionnaire) and ends by writing that brand's own preset: palette with measured hex values, font files, cover formula, footer, fixed CTA and caption template. It is saved in your workspace — `social-carousels/brands/<brand>/` — so it survives skill updates, and from the second carousel on that brand costs exactly what the bundled one costs.
- **Approval gates before anything renders** — the carousel split and two hook options (A/B with a reasoned recommendation) must be approved first, then the complete slide copy as plain text, with each slide's proposed asset listed next to it. Rendering before the copy is approved hides problems inside images, where they are slower to spot and slower to fix.
- **Asset bank, chosen by context** — each brand can carry a bank of imagery (mascot poses, icons, drawings, diagrams, illustrations, product shots — anything) as a plain folder of transparent PNGs, local or in a git repo. Nothing to maintain: dropping a file in the folder is the whole registration, because **fully descriptive filenames are the metadata** (`tiburon-agobiado-cubierto-de-postits.png`, never `img_003.png` — the naming rules are in the contract). The agent reads the names, matches them to each slide's job and proposes the pairing at the copy gate — its pick **plus the other viable options per slide** — so nothing gets built until you chose with the alternatives in view. Nothing outside the bank ever lands on a slide, no slide is forced to carry one, and gaps are reported instead of improvised.
- **Source-faithful extraction** — PDFs, URLs, YouTube links (via transcript), pasted text and screenshots. It extracts 1–3 shareable angles; inventing content that is not in the source is prohibited, and proper nouns are copied verbatim.
- **Hook craft built in** — every hook is a two-part structure (setup headline + twist line) with explicit quality criteria: concrete numbers for authority, tension between the lines, specific over generic, and no claim the source cannot back.
- **Editable HTML package** — every carousel is a small static site (`index.html` + `styles.css` + `slide-data.js`); the PNGs are browser screenshots of it, so any fix is a source edit plus a re-render, never a PNG patch.
- **Programmatic QA before your eyes** — `scripts/render-and-audit.mjs` renders each slide and fails the delivery on: a web font that silently fell back, any word under the typography floor, anything outside the safe area, orphan last lines, broken assets, canvas overflow, an off-centre cover hook, vertical imbalance, a counter off the canvas centre, an overlay landing on fixed artwork, optical imbalance inside chrome, and a **density budget** — ink coverage, line count and visual blocks measured on the PNG against the bands of the published set, so a slide that "va cargado" is caught before you are. It writes `qa-report.json` and exits 3 if anything is red.
- **Typography floor** — on a 1080px-wide export every user-facing word renders at ≥ `40px` computed size (`24px` only for numeric page counters and decorative marks). Copy that does not fit gets shortened or split, never shrunk.
- **Safe-area QA** — all readable content stays ≥ `5%` from the side edges and ≥ `10%` from top/bottom (app overlay zones); the first-slide hook must be horizontally centered; small compositions floating in empty space are rejected.
- **Documented layout exceptions** — a brand's approved layout sometimes contradicts a rule. Listing a check id in `slide-data.js` under `layoutExceptions` (and recording the reason in `manifest.json`) drops that one check to an informational note while everything else keeps blocking. Never a shortcut the agent takes on its own.
- **Fixed brand CTA, two variants** — La Casa appends a fixed CTA frame after the content slides and asks which one closes the carousel: normal (`Guarda este post`) or comment (`Comenta AURELIO` to get something by DM). Two bundled assets per size; the page counter is composed on top at render time, so the same asset serves a carousel of any length, and assets are never cropped or stretched across sizes.
- **A delivery folder you can drag as-is** — the PNGs and `caption.txt` land in a folder named `<YYYY-MM-DD>-<tema>-<ig|tt>`, holding nothing else. Drag it into Drive without renaming anything.
- **Humanized captions** — every slide passage and the caption pass a humanizer step (no generic AI phrasing, no filler, no dictionary tone) before delivery.
- **Adaptation mode** — bring an existing carousel of your own (final PNGs or its editable package) and convert it to another platform or size. Copy is transcribed verbatim and confirmed with you, slides are rebuilt in HTML at the target size (originals are never scaled or cropped), and any copy that cannot fit the typography floor in the new ratio is adjusted only with your approval. Third-party carousels are never cloned: their screenshots enter the normal creation flow as information sources, and the copy is written from scratch in your brand's voice.

## Installation

**Option A — let your agent install it (recommended).** Open Claude Code and paste:

```text
Install the social-carousel-generator skill from https://github.com/aurelioagency/skills :
1. Run: git clone --filter=blob:none --sparse https://github.com/aurelioagency/skills.git into a temporary folder.
2. Inside it, run: git sparse-checkout set social-carousel-generator
3. Copy the social-carousel-generator/ folder into ~/.claude/skills/social-carousel-generator/
4. Delete the temporary clone and confirm the skill loads.
5. Check the requirements: Python 3 and Playwright (npm i playwright inside the
   installed skill). Install anything missing (ask me to approve each install command).
6. Explain how to use the skill and ask me if we start my first carousel now.
```

The agent fetches only this skill (not the whole collection), installs it permanently in `~/.claude/skills/` for all future chats, and walks you into your first job.

**Option B — manual.** Clone the repo and run the bundled installer:

```powershell
git clone https://github.com/aurelioagency/skills.git
cd skills
node install-skills.mjs social-carousel-generator          # Claude Code
node install-skills.mjs social-carousel-generator --codex  # Codex
```

Any other harness: point it at this folder's `SKILL.md`.

## Updating

Improvements land in this repo; your installed copy never updates itself. To update, re-run the installer — it replaces the installed skill cleanly, **preserves the `node_modules` you installed inside it** (Playwright keeps working), records the installed commit in `.installed-from.json`, and prints the old and new commits. Open Claude Code and paste:

```text
Update my installed social-carousel-generator skill from https://github.com/aurelioagency/skills :
1. If I have a clone of the repo, run git pull in it; otherwise make a temporary
   sparse clone like in the install prompt.
2. In the clone, run: node install-skills.mjs social-carousel-generator
3. The installer prints the previous and new commit. Summarize what changed
   between them (git log --oneline <old>..<new> -- social-carousel-generator) in my language.
4. Confirm the skill still loads and that Playwright still resolves from the
   installed skill's scripts. Delete the temporary clone if you made one.
```

To find out whether you are behind without installing anything, run this in an up-to-date clone:

```powershell
node install-skills.mjs social-carousel-generator --check
```

It compares the commit recorded in your installed copy against the checkout, counting only commits that touch this skill (exit code 3 means an update is available). Teams working on the repo can keep a permanent clone: updating is just `git pull` + the installer command.

> **Careful if you improved your installed copy by hand.** The installer replaces the skill's files. Anything you edited inside `~/.claude/skills/social-carousel-generator/` that was never committed to the repo is lost on update. Bring it to the repo first.

## Uninstalling

The installed skill lives entirely in one folder: `~/.claude/skills/social-carousel-generator/`. Removing it never touches your carousel packages (they live in their own project folders, e.g. `Documents\social-carousels\<slug>\`), other installed skills, or any clone of this repo. Open Claude Code and paste:

```text
Remove the social-carousel-generator skill from my machine:
1. Delete the folder ~/.claude/skills/social-carousel-generator/ (all of it,
   including its node_modules).
2. Confirm the skill no longer loads. Do not touch my carousel package folders,
   other installed skills, or any clone of the skills repo.
```

Or manually — from a clone of the repo:

```powershell
node install-skills.mjs social-carousel-generator --remove
```

(which only deletes the installed copy, never the repo folder), or simply delete `~/.claude/skills/social-carousel-generator/` yourself. You can reinstall at any time with the [Installation](#installation) prompt; only remember to reinstall Playwright afterwards (`npm i playwright` inside the installed skill) since it is removed along with the folder.

## Requirements

- **Node.js 18+** (bundled scripts are plain `node`, no build step).
- **Python 3** on `PATH` — serves the carousel package locally (`python -m http.server`) during rendering.
- **Playwright** (`npm i playwright`) — captures each slide at the exact platform viewport with `deviceScaleFactor: 1` and drives the bundled QA scripts. The scripts resolve it from the package folder, the skill folder, or a sibling skill's `node_modules`, so one install serves every carousel.
- **No API keys and no paid providers** — everything renders locally.

## Usage

Once installed, the skill lives in `~/.claude/skills/social-carousel-generator/` and is available in **every** Claude Code session on the machine, forever. Nothing is re-installed per carousel. Carousels themselves never go there: each job gets its own package folder (default `Documents\social-carousels\<slug>\`), created automatically.

There are two ways to use it:

### Mode 1 — a new carousel from a source

Open a Claude Code session anywhere and describe the job in your own words, for example:

> Carrusel para La Casa de Aurelio de este artículo: `<url>`

> Carrusel de este video de YouTube: `<link>`

> Carrusel de estas capturas, para Instagram

The skill triggers automatically by matching your request. From there it drives everything and asks for what it needs:

1. Asks the **brand**, the **platform** (Instagram or TikTok) and **which CTA** closes it — skipping anything you already answered in your request. For the brand it looks for a saved preset first (`social-carousels/brands/<brand>/preset.md`), falls back to the bundled La Casa one, and only interviews you if the brand is new — then saves its preset so it never asks again.
2. Extracts the source (article text, YouTube transcript, PDF, screenshots) and captures facts and candidate angles in a brief — nothing invented.
3. Proposes the **carousel split** plus **two hook options** per carousel, and waits for your pick before drafting a single slide.
4. Drafts 3–6 content slides, one job per slide, and shows you the **complete copy as plain text for approval** before building any HTML.
5. Builds the editable HTML package and renders ordered PNGs at platform size.
6. Runs `scripts/render-and-audit.mjs` first, then the contact-sheet pass by eye for what a machine cannot judge: meaning, overlap, rhythm. Every red issue is fixed in source and re-rendered before delivery — PNGs are never patched.
7. Delivers the folder you drag into Drive, plus a short validation summary.

### Setting up your own brand (once)

The first time you ask for a brand the skill does not know, it runs a short setup interview: platform, language, your visual references, your font files, and how the CTA works. It reads what it can straight off your references — hex values, fonts, footer text — instead of asking you to describe them, and it only asks what the references cannot answer.

It ends by filling [references/brand-preset-template.md](references/brand-preset-template.md) and saving it as `social-carousels/brands/<your-brand>/preset.md`, together with your fonts and your CTA asset. You approve that document before any slide is drafted; from then on every carousel of that brand obeys it and the interview never runs again.

Two decisions the template forces you to make, because inheriting them from the bundled brand would be wrong: your **cover formula** (which family and colour carry the headline, which different family and colour carry the twist line) and your **density budget** (measure your own bands and declare them as `densityBudget` in `slide-data.js`, or take the documented `density-budget` exception).

**Presets are editable.** They are plain markdown in your workspace: change them by hand or ask for the change in the chat. Edits apply to the next carousel, already-delivered packages keep what they were built with, and a skill update never touches them. That last part is why they live outside the skill folder — and why the bundled La Casa preset can be *ejected* into `brands/la-casa/` if you want to edit it the same way: a workspace preset always wins over the bundled one.

### Mode 2 — adapt a carousel you already published

Point the skill at your own carousel (its package folder, or just the final PNGs) and ask for the other size:

> Adaptá este carrusel de TikTok a Instagram: `<carpeta o PNGs>`

Angle extraction, the split and the hook gate are all skipped. The copy comes from the original — transcribed verbatim from the PNGs and shown to you for approval when there is no editable source — and the slides are rebuilt in HTML at the target size. Originals are never scaled, cropped or letterboxed, and the chrome (footer, counter, CTA) comes from the preset rather than from the old images.

### Package output

```text
social-carousels/
  brands/
    mi-marca/
      preset.md                    # your brand's rules — survives skill updates
      fonts/                       # your brand's font files
      cta-1080x1440.png            # your fixed CTA, if you use one
      asset-bank/                  # your imagery: transparent PNGs (or a cloned git repo)
  <slug>/
    index.html                     # editable slide source
  styles.css                       # visual system
  slide-data.js                    # slide content data
  carousel-brief.md                # source, angles, decisions
  manifest.json                    # platform, size, slide order, CTA variant
  assets/                          # fonts and the CTA frame used
  2026-08-03-mi-tema-ig/           # ← the delivery folder
      01.png … 06.png
      caption.txt
```

The delivery folder is named `<YYYY-MM-DD>-<tema>-<ig|tt>` and holds the images and the caption, nothing else — drag it into Drive as it is. Working files (`qa-report.json`, `contact-sheet.png`) are produced during the job and deleted before delivery.

### Multiple carousels and fixes

- Each job = its own package folder. Carousel #2 never touches carousel #1.
- To fix a delivered carousel, point the skill at its package folder (e.g. *"cambiá el titular del slide 3 en `Documents\social-carousels\mi-tema`"*). It edits the HTML/CSS/data source and re-renders only the affected slides. PNGs are never patched directly.

## License

MIT — see [LICENSE](../LICENSE) at the repo root.
