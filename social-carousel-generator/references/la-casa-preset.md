# La Casa de Aurelio preset

Use this preset when the user asks for La Casa de Aurelio, Agencia Aurelio, Aurelio, or the local default carousel style.

## Defaults

- Platform: always ask before planning content, even when this preset is active. Ask exactly once, in Spanish:
  `¿Para qué plataforma es este carrusel? ¿TikTok o Instagram?`
  If the user already named the platform in their request, skip the question and use it. If the user answers `default`, use TikTok. In Adaptation Mode the target platform comes with the request; never re-ask it.
- 2026 sizes:
  - TikTok: `1080x1920`.
  - Instagram: `1080x1440` (3:4).
- Language: Spanish by default.
- Voice: practical, sharp, useful, human. Prefer clear Spanish. Use voseo only when the surrounding La Casa voice calls for it.
- Audience: builders, operators, founders, AI-system users, Codex users, and people learning agent workflows.
- Content density: useful, not encyclopedic.

## Brand system (canonical values)

Extracted from the published La Casa carousel set (2026-07). Use these exact values; never re-interpret the color names by eye. Earlier carousels drifted between near-duplicates of the same color (e.g. terracotta `#D66F50` vs `#D87152`) — new work always uses the canonical values below.

### Palette

Neutrals:

- Background: `#000000` base with a `#050505` field, subtle dot-grid texture around `#0E0E0E`, and faint elliptical contour lines barely lighter than the field.
- Primary text and headlines: `#F6F2E9` (warm off-white).
- Cream surfaces (footer pills, contrast cards): `#EDE8DE` with dark text.
- Dark panels (cards, UI mockups): `#191716` to `#2F2C2B`.

Accents — four families; bright value for text/fills, dark value for borders, badges, and tinted fills:

| Family | Bright | Dark | Observed roles |
|---|---|---|---|
| Terracotta | `#D66F50` | `#964F3A` (deep: `#603024`) | kickers/eyebrow labels, verdict-box borders, key data bar |
| Sage | `#6EA48C` | `#2C614A` | stat rings, progress bars, result labels, cream-card borders, twist lines (when dominant) |
| Ochre | `#D6B85E` | `#9C843C` | twist lines (when dominant), arrows, secondary bars |
| Dusty pink | `#ECACC7` | `#604854` | large stat figures, mockup buttons, twist lines (when dominant) |

Keep one dominant accent per slide. The four families may coexist across a carousel, but never all on one slide except in small grouped elements (traffic dots, multi-bar charts).

### Typography (canonical families)

Identified by per-glyph comparison against the published carousel set (2026-07). Use exactly these:

1. Headlines: **Archivo Black** (`font-family: 'Archivo Black', sans-serif`), tight leading, `letter-spacing: -0.02em`, `#F6F2E9`. Case varies by carousel in the published set: ALL CAPS or Title Case — pick one per carousel and keep it consistent across its slides.
2. Mono (kickers, technical labels, bar data, page counter): **Roboto Mono** bold (`font-family: 'Roboto Mono', monospace`), uppercase kickers with wide letter-spacing.
3. Large stat figures (big percentages/numbers): **Inter** bold (`font-family: 'Inter', sans-serif`). Identification margin note: Archivo bold scored nearly as close; if an original `styles.css` ever surfaces and says Archivo, switch and update this line.
4. Serif italic (footer signature `La Casa de Aurelio`, editorial support sentences): **Georgia Italic** (`font-family: Georgia, 'Lora', serif`). Identification margin note: Lora Italic is the close alternative; same correction rule as above.

Archivo Black, Roboto Mono, and Inter are on Google Fonts; Georgia ships with Windows/macOS. Load web fonts locally in the package (or via Google Fonts) so Playwright renders them identically on any machine — never let the render fall back to a default system sans.

### Recurring components

- Mono kicker in terracotta above or centered over the headline.
- Verdict box: 1px terracotta or sage border, dark fill, one bold caps sentence in `#F6F2E9`.
- Footer on content slides: **Inter** bold `aurelioagency.com` left · page-counter pill center (Inter bold, fill `#252422`, fully rounded `border-radius: 999px`) · cream `Swipe 👉` pill right.
- Cream contrast cards (`#EDE8DE`, dark text, sage border) for outcomes/results, often paired against dark panel cards (`#191716`) for the "before"/technical side.

## Content slides

- Background: black editorial field per the canonical palette above.
- Typography: per the typography roles above — large off-white sans headlines, mono labels, serif italic support.
- Typography floor at `1080px` width: `40px` for every readable word, including diagram labels, card text, source lines, caveats, methodological notes, footer brand text, and swipe text. Use `24px` only for the numeric page counter and decorative single-character marks. Never shrink copy below the floor to make it fit.
- First content slide: always center the primary hook block horizontally and center-align the title text. A left-aligned cover headline is not permitted.
- Cover hook follows the two-part structure defined in SKILL.md (Hooks): setup line as the off-white Archivo Black headline; twist line in the carousel's dominant accent (ochre, dusty pink, or sage — the published set uses all three) or as a serif italic support sentence. One accent per cover.
- Content clearance: keep all readable content at least `5%` from the left and right edges and `10%` from the top and bottom edges. Per size:
  - `1080x1920`: `x=54..1026`, `y=192..1728`.
  - `1080x1440`: `x=54..1026`, `y=144..1296`.
- Composition scale: expand content inside the safe area with larger type and reflowed visual elements. Do not accept a small composition surrounded by avoidable empty space.
- Accents: only the canonical accent values from the brand system above — never eyeballed approximations.
- Visual style: crisp editorial infographic with centered information.
- Safe zone: keep meaningful text away from the top and bottom app overlay bands. Do not peg headlines, body copy, labels, logo, CTA copy, or footer text to the canvas edge.
- Footer on content slides:
  - Bottom-left: `aurelioagency.com` in Inter bold (not serif italic).
  - Center: page counter pill.
  - Bottom-right: `Swipe 👉` cream pill.
- Page counter counts **every exported image, including the final CTA frame**. A carousel with 5 content slides plus the CTA runs `1/6` through `6/6`.
- The CTA frame carries only the counter pill (its final number) — no brand line and no swipe prompt. Its own `La Casa de Aurelio` signature stays part of the CTA artwork.

## Fixed CTA

The La Casa preset has a fixed final CTA frame enabled.

- Append it after the 3-6 content slides.
- Do not include a swipe prompt on the CTA frame.
- Fixed CTA assets, one per size — use the matching one, never crop or stretch across sizes:
  - TikTok `1080x1920`: `assets/la-casa-cta.png`
  - Instagram `1080x1440`: `assets/la-casa-cta-ig.png`
- CTA copy in both assets: `Guarda este post` and `y sígueme para más`, over the `AURELIO` wordmark and the serif italic `La Casa de Aurelio` signature.
- Compose the CTA slide as the fixed asset plus the counter pill drawn on top at render time. This keeps the asset reusable while the number stays correct for any carousel length.
- If a new size is ever needed, rebuild the CTA once in HTML/CSS at that size, save it as a new fixed asset, and reference it here.

Do not ask for the CTA every run when this preset is active. Ask only if the user explicitly wants to replace the CTA.

## Layout checks

Before delivery, visually check:

- Main content is centered.
- No meaningful text is stuck to the top or bottom edge. Keep La Casa headlines, body text, labels, logo, CTA copy, and footer clear of TikTok app overlay zones.
- Text is not clipped.
- Every readable word meets the typography floor at computed style level.
- The first-slide hook block is horizontally centered and its title text is center-aligned.
- All readable text respects the `5%` side and `10%` top/bottom clearances.
- The composition expands within the safe area instead of remaining small amid avoidable empty space.
- Diagrams do not overlap labels.
- Flow arrows connect deliberate steps.
- Cards do not create random empty spaces.
- CTA frame uses the fixed asset for the target size, with the counter pill composed on top.
- Every accent color in the render matches the canonical palette exactly (no near-duplicate hex drift).
- Rendered text uses the canonical font families (Archivo Black / Roboto Mono / Inter / Georgia Italic) — verify the web fonts actually loaded before capture; a silent fallback to a system sans is a red issue.
- Delivered files are true PNG exports from the render pipeline — never JPEG re-saves renamed to `.png`.
