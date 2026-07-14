# La Casa de Aurelio preset

Use this preset when the user asks for La Casa de Aurelio, Agencia Aurelio, Aurelio, or the local default carousel style.

## Defaults

- Platform: TikTok carousel unless the user requests Instagram.
- TikTok size: `1080x1920`.
- Language: Spanish by default.
- Voice: practical, sharp, useful, human. Prefer clear Spanish. Use voseo only when the surrounding La Casa voice calls for it.
- Audience: builders, operators, founders, AI-system users, Codex users, and people learning agent workflows.
- Content density: useful, not encyclopedic.

## Content slides

- Background: black editorial field with subtle grey contour or paper-relief lines.
- Typography: large white sans-serif headlines, occasional serif italic support text when useful.
- Accents: muted terracotta, sage, dusty pink, ochre, and off-white.
- Visual style: crisp editorial infographic with centered information.
- Safe zone: keep meaningful text away from the top and bottom app overlay bands. Do not peg headlines, body copy, labels, logo, CTA copy, or footer text to the canvas edge.
- Footer on content slides only:
  - Bottom-left: `La Casa de Aurelio`
  - Center: page count
  - Bottom-right: `Swipe 👉`

## Fixed CTA

The La Casa preset has a fixed final CTA frame enabled.

- Append it after the 3-6 content slides.
- Do not include a swipe prompt on the CTA frame.
- Use `assets/la-casa-cta.png` as the fixed CTA asset.
- CTA copy in the asset: `Guarda este post` and `y sígueme para más`.

Do not ask for the CTA every run when this preset is active. Ask only if the user explicitly wants to replace the CTA.

## Layout checks

Before delivery, visually check:

- Main content is centered.
- No meaningful text is stuck to the top or bottom edge. Keep La Casa headlines, body text, labels, logo, CTA copy, and footer clear of TikTok app overlay zones.
- Text is not clipped.
- Diagrams do not overlap labels.
- Flow arrows connect deliberate steps.
- Cards do not create random empty spaces.
- CTA frame matches the bundled asset.
