# Brand preset — fill-in template

Copy this file to `references/<brand-slug>-preset.md` **in the repo checkout** and fill it in
with the user during the setup interview. From then on that brand costs the same as any
other: the interview never runs again.

`references/la-casa-preset.md` is the worked example — read it to see the level of detail
each section needs. **Measure values, never estimate them.** "A warm off-white" is not a
value; `#F6F2E9` is.

> Brand presets live **with the skill**, versioned in the repo, so they travel to every
> machine and survive a reinstall. Edit them in the checkout and publish with
> `node install-skills.mjs social-carousel-generator`. A change made only in the installed
> copy under `~/.claude/skills/…` is overwritten by the next install, silently.

> **A preset holds brand decisions only.** Size and text density are skill-wide rules in
> `SKILL.md` (*Format, length and density*) — identical for every brand. Do not restate them
> here. Override one only if this brand genuinely needs it, and then name the rule and give
> the reason.
>
> Carousel length is the one that is partly yours: the ceiling of 10 exported images belongs
> to the skill and does not move, but a brand that always publishes in a certain range can
> say so in Defaults below. Leave it out and the count simply follows the content, carousel
> by carousel.

## Brand folder layout

```text
references/<brand-slug>-preset.md   # this file, filled in
assets/brands/<brand-slug>/
  fonts/               # the brand's .ttf/.woff2 — copied into each package
  cta-<variant>.png    # fixed CTA per variant, if the brand uses one
  cta.html             # the HTML source that produced them
  logo.png             # only if the CTA artwork needs it
```

---

## Defaults

- Brand name: `<as the user writes it>`
- Carousel length: `<habitual range, e.g. 7-10 exported images — or delete this line to let the
  content decide each time. The skill's ceiling of 10 applies either way.>`
- Language: `<es | en | …>`
- Voice: `<3-6 words: how it talks, what it refuses to sound like>`
- Audience: `<who reads this>`
- Content density: `<useful / dense / minimal>`

## Brand system (canonical values)

### Palette

Neutrals:

- Background base and field: `<#hex>` / `<#hex>`
- Texture over the field, if any: `<dot grid / lines / none>` with its exact CSS and the
  rendered value it produces over the field.
- Primary text: `<#hex>`
- Contrast surfaces (cards, pills): `<#hex>` with `<dark|light>` text
- Panels: `<#hex>` to `<#hex>`

Accents — one row per family, bright value for text/fills, dark value for borders and
tinted fills:

| Family | Bright | Dark | Roles |
|---|---|---|---|
| `<name>` | `<#hex>` | `<#hex>` | `<kickers, verdict borders, …>` |

Rule: `<how many accents per slide; the default is one dominant accent per slide>`

### Typography

1. Headlines: `<family>`, `<weight>`, `<letter-spacing>`, `<colour>`. Case: `<ALL CAPS | Title Case>` — pick one per carousel and keep it.
2. Mono / labels: `<family>`
3. Numbers and stats: `<family>`
4. Support serif or secondary family: `<family>`

Font files go in the brand folder's `fonts/` and are copied into every package, so a render
is identical on any machine. A web font that silently falls back is a red issue.

### Cover formula

The cover is the one slide with a fixed recipe. Fill all four:

- Headline: `<family, colour, case>`
- Twist line: `<a different family AND a different colour from the headline>`
- Alignment: `<centered by default; anything else needs a documented layout exception>`
- Graphic: `<what simple visual carries the cover — never type alone>`

### Recurring components

- `<component>`: `<exact spec>`

### Never on a slide

Close this list on purpose — if an element is not in the components above, it does not go on
the canvas, even if an old published post shows it.

- `<e.g. no corner badge, no watermark, no logo on content slides>`

## Asset bank

See `references/asset-bank.md` for the full contract (what goes in, how the agent selects by looking).

- Location: `<none | local folder | git URL>` — default local: `brands/<brand-slug>/asset-bank/`. A folder of finished PNGs (transparent background by default); subfolders free. **Filenames must be fully descriptive — they are the only metadata an asset has** (naming rules in the contract).
- If `none`: slides use HTML/CSS graphics only. Valid choice; write it explicitly.
- Placement defaults this brand overrides, if any: `<max per slide, size range, corners it prefers, …>`
- Who produces new assets and how (the brand's own pipeline, outside this skill): `<e.g. designer, a character-generation skill, product screenshots>`

## Footer

- Bottom-left: `<text>` in `<family, size, colour>`
- Centre: page counter — numeric chrome, `26px` at 1080 wide, centered on the **canvas**
  (`left: 50%`), not distributed with `space-between`.
- Bottom-right: `<swipe text>` in `<family, size, colour>`
- The counter counts **every exported image, including the CTA frame**.

## CTA

- Mode: `<fixed asset | generated per carousel>`
- If fixed, one asset per variant, all at `1080x1440`:

  | `<variant name>` | `<path>` |
  |---|---|
  | `<variant name>` | `<path>` |

- Copy in each variant: `<verbatim>`
- The counter pill is composed on top at render time, so the asset serves any carousel
  length. Keep the counter band free of artwork.
- Regenerating an asset: the current asset at that size is the reference. Change only what
  was asked and prove it with `scripts/compare-blocks.mjs` — a pure background change must
  report `+0% +0px` on every block.

## Caption template

```text
<the exact block, with the fixed parts written out verbatim and the written parts marked>
```

Rules:

- Fixed blocks (greeting, service lines, links, fixed hashtags): reproduced verbatim, never
  adapted to the topic.
- Written block: `<what it must contain, in how many lines>`
- Hashtags: `<the fixed ones, in order>` plus `<N>` dynamic ones chosen by topic.
- The caption ships as `caption.txt` inside the delivery folder.

## Density budget

`scripts/render-and-audit.mjs` checks ink coverage, line count and visual blocks against
bands **measured on La Casa's published set**. For another brand you have two honest options:

1. **Measure your own bands.** Run the audit over your published carousels, take the p10/p90
   per slide type, and record them here. Then update the `BUDGET` table in the script.
2. **Document the exception.** Add `density-budget` to `layoutExceptions` in `slide-data.js`
   and record the reason in `manifest.json`. The check drops to an informational note and
   everything else keeps blocking.

Never leave it half-way: a brand judged by another brand's density bands produces red issues
that mean nothing.

Chosen here: `<1 or 2, and the numbers or the reason>`

If you measured your own bands, copy them into every package's `slide-data.js` as
`densityBudget` — the audit reads them from there and prints which keys came from the
brand. Whatever you leave out falls back to the default bands, so declare a key only when
you measured it.

## Editing this preset

Edit this file by hand, or ask the agent to change it in the chat. Changes apply to the
**next** carousel; carousels already delivered keep the values they were built with. Skill
updates never touch this file, because it lives in the workspace and not inside the skill.

Nothing here should stay as `<placeholder>` once the brand is in use: the pipeline reads
the caption template and the density budget directly, and a placeholder there stops the job
rather than being guessed.

## Layout checks

Everything in SKILL.md applies regardless of brand: typography floor, safe area, centered
cover hook, vertical balance, orphans, optical centering of chrome. List here only what this
brand adds or overrides, and record every override as a documented layout exception.

- `<override + why + the exception id it uses>`
