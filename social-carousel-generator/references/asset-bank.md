# Asset bank — how carousels get their imagery

A brand can carry an **asset bank**: a folder of images the agent can place on slides.
Any kind of asset — mascot poses, icons, drawings, diagrams, illustrations, product
shots. Nothing here assumes one kind.

The bank is just files. There is no catalog, no index, no metadata file to maintain —
nothing that has to be updated when an asset is added or removed. Dropping a finished
file into the folder **is** the whole registration. The filename carries the meaning:
the agent selects by reading names, so names must be fully descriptive (see Naming).

## Where the bank lives

The brand's preset declares it, one of:

- **Local folder** — default: `social-carousels/brands/<brand-slug>/asset-bank/`
- **Git repo** — the preset stores the URL; clone it once into
  `brands/<brand-slug>/asset-bank/` and treat it read-only. Update with `git pull` only
  when the user asks; never push from a carousel job.

No bank declared = no imagery from files: slides use HTML/CSS graphics only (diagrams,
cards, charts), which is a perfectly valid brand choice.

## What goes in it

- **PNG with transparent background** is the default: it sits on any slide background.
  SVG is fine too (it scales without loss). Opaque images (screenshots, photos) are
  allowed but get framed as cards, never bled into the field.
- Finished, approved files only. The bank is not a working folder: nothing half-made,
  no drafts, no source files. How the brand produces an asset is its own pipeline,
  outside this skill.
- Subfolders are free (`iconos/`, `personaje/`, `ilustraciones/`, `diagramas/`, …) — use
  them when the bank grows, the agent walks the whole tree either way.

## Naming — read this before adding your first file

The filename is the only description an asset has, so it must say **what the image
shows**, completely, to someone who has never seen the file. The agent chooses by name;
a file whose name does not describe it will never be chosen, or worse, chosen wrong.

Rules:

- Kebab-case, lowercase, no spaces or accents: words separated by `-`.
- Describe the content, not the project: subject + what it is doing / what it is +
  distinguishing detail.
- If it only works in some context, put the context in the name.

| Bad (invisible to the agent) | Good |
|---|---|
| `img_003.png` | `tiburon-agobiado-cubierto-de-postits.png` |
| `final2.png` | `icono-reloj-de-arena-amarillo.png` |
| `nuevo.png` | `ilustracion-cohete-despegando.png` |
| `captura.png` | `captura-panel-modo-oscuro.png` |

If a file arrives with a non-descriptive name, the agent proposes a rename to the user —
it never renames silently and never guesses what an opaque name contains.

## How the agent selects

1. At slide-drafting time, list the bank (all subfolders) and read the filenames.
2. Match each slide's job against the names — that is the selection. Open an image only
   to confirm a shortlisted candidate before proposing it, never the whole bank
   file-by-file.
3. Present the plan inside the copy-approval gate, **before building anything**: per
   slide, the proposed asset with its reason **plus every other bank asset that could
   also serve that slide**, so the user picks with the options in view:
   `Slide 2 — asset propuesto: personaje/tiburon-agobiado-cubierto-de-postits.png (slide de problema) · tambien podrian ir: personaje/tiburon-preocupado.png, iconos/pila-de-papeles.png`
   — or `Slide 4 — sin asset`. No slide is obliged to carry one, and no slide is built
   until the user approved copy and assets together: swapping an asset costs nothing
   here and a re-render round later.
4. At build time, copy the chosen files into the package's `assets/` so the package stays
   self-contained, and reference them from `slide-data.js`.

## Hard rules

- **Bank or nothing — for what the agent chooses.** Never go looking for an image outside
  the bank: no stock, no web, no generating on the fly, no reusing an image from an old
  package that never entered the bank.
- **This does not apply to images the user supplies.** Anything they paste into the chat or
  point at by path goes on the slide as it is, without entering the bank first and without
  being questioned over palette or the branding it carries. See *Images the user supplies*
  in `SKILL.md`.
- **One-off material never enters the bank.** A chart from one article, a screenshot of one
  dashboard, a photo of one thing: it belongs to the carousel it arrived for, lives in that
  package's `assets/`, and stays there. The bank is for imagery that will serve carousels
  nobody has planned yet — filling it with single-use files means every future pick has to
  read past them. Do not add it, and do not offer to.
- **A gap is information, not a blocker.** If nothing in the bank fits a slide, say so at
  the approval gate and propose the slide without imagery or with an HTML/CSS graphic.
  Tell the user what asset would have served, so they can produce it for the next time —
  through whatever pipeline that brand uses.
- **Assets are placed, not edited.** Scale and position, yes. Recolor, flip, filter,
  crop into a different meaning, composite — no. An asset that needs rework goes back to
  the brand's pipeline.
- **Placement obeys the slide's rules**: inside the safe area, never behind or
  overlapping text, and it counts toward the slide's density like any other block.
  Default one asset per slide; the preset may override.
- QA already enforces the rest: a broken image path is a red issue, and the contact-sheet
  pass checks overlap and rhythm.
