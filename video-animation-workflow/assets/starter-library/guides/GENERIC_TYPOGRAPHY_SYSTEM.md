# Generic typography system for motion and captions

This file is project-neutral. It defines a reusable semantic font hierarchy for
storyboards, greetings, visual-object reveals, full intros, kinetic typography,
talking-head overlays, avatars, YouTube videos, and vertical social formats.

Copy-paste CSS: `generic-kinetic-type.css`

Archived font binaries: `fonts/`

## Semantic hierarchy

Choose fonts by meaning, not randomly word by word.

| Role | Meaning | Bundled production face | User-supplied fallback |
|---|---|---|---|
| Anchor | Names, brands, actions, results, essential concepts | Inter Black 900 | A licensed brand bold/black face |
| Editorial | One expressive or emotional keyword per scene | Playfair Display Regular Italic | A licensed brand editorial face |
| Connector | Articles, pronouns, prepositions, conjunctions, supporting words | Inter Regular 400 | A licensed brand text face |

Use one anchor family, one connector family, and at most one editorial accent family
inside a composition.

## Font-use rules

- Anchors are uppercase, tightly tracked, and visually dominant.
- Connectors remain quiet and must not compete with the main message.
- Editorial type is scarce: normally one word per scene.
- Do not use the editorial face for a full explanatory sentence.
- Do not assign a new font merely because a new word enters.
- Do not synthesize unavailable weights or italics.
- Avoid colored-word karaoke. Build hierarchy through family, weight, scale, case,
  tracking, placement, and motion intensity.

## Reference sizing

These are starting values, not mandatory copy-fitting overrides.

### 1920×1080

| Role | Recommended range | Line height | Tracking |
|---|---:|---:|---:|
| Label | 22–28px | 1.00 | `0` to `+0.02em` |
| Connector | 52–68px | 1.00–1.05 | `0` to `-0.015em` |
| Supporting anchor | 64–94px | 0.82–0.95 | `-0.045em` to `-0.065em` |
| Main anchor | 108–156px | 0.72–0.84 | `-0.055em` to `-0.07em` |
| Editorial word | 126–164px | 0.88–0.94 | approximately `-0.055em` |

### 1080×1920

| Role | Recommended range | Line height | Tracking |
|---|---:|---:|---:|
| Label | 28–36px | 1.00 | `0` to `+0.02em` |
| Connector | 68–84px | 1.00–1.05 | `0` to `-0.015em` |
| Supporting anchor | 96–126px | 0.82–0.95 | `-0.045em` to `-0.065em` |
| Main anchor | 132–168px | 0.76–0.88 | `-0.055em` to `-0.07em` |
| Editorial word | 120–150px | 0.88–0.94 | approximately `-0.055em` |

For a 2560×1440 render based on 1920×1080 coordinates, multiply pixel values by
`1.3333`.

## Composition and spacing

- Maximum two lines for a normal caption group.
- Designed headline lockups may use three lines if they form one coherent shape.
- Avoid a one-word orphan on the final line.
- Stack related heavy words tightly: approximately `0.72–0.84` line height.
- Leave `0.16–0.28em` between a connector line and its anchor group.
- Leave `0.08–0.16em` between tightly related anchor words.
- Use spatial hierarchy: one dominant word, one medium supporting phrase, one thin
  connector phrase.
- Resize only the word or group that exceeds its safe zone. Do not shrink the entire
  typography system uniformly.

## Safe areas

### Landscape

- Keep essential text inside the central 90% of the frame.
- Respect title-safe and player-control margins.
- When a person is present, measure the union of face, torso, hands, chair, and gesture
  movement across representative frames.
- Place typography in the clean zone opposite or beside that envelope.

### Portrait

- Keep essential text between 12% and 78% of frame height.
- Use approximately 6–7% side margins.
- Reserve the bottom 22% for platform UI.
- Recompose the layout for portrait; never crop a landscape lockup.

## Color and legibility

Recommended neutral system:

- ink: `#111111`;
- warm paper: `#f7f3ea`;
- muted neutral: `#807970`;
- optional single accent: `#e2987f`.

Default caption treatment:

```css
color: #111111;
background: none;
outline: none;
text-shadow: 0 2px 18px rgba(247, 243, 234, 0.55);
```

Use one saturated accent per scene at most. On live footage, prefer neutral text and
local glyph shadow/scrim rather than a generic subtitle box.

## Bundled files

The public starter library includes Inter Variable and Playfair Display Italic
Variable from the official Google Fonts repository under the SIL Open Font License
1.1. Users may add any brand fonts they are licensed to use. The CSS includes
deterministic system fallbacks when a user-supplied font is unavailable.
