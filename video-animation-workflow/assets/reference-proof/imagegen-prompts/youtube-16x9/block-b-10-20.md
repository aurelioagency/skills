# ImageGen record — YouTube 16:9 — Block B `00:10–00:20`

## Execution

- Mode: built-in `image_gen`.
- Use-case taxonomy: `illustration-story`, followed by
  `precise-object-edit`.
- Selected generated source:
  `<local-user-root>\.codex\generated_images\019fab42-b88e-7671-aee2-ddbe056e0e43\call_Q2tPWmdnz7TKor0GAQQdcHwJ.png`.
- Project copy:
  `<local-user-root>\Desktop\Agency\video-intro-ai-workflow\phase-4\youtube-16x9\block-b-10-20\storyboard-sheet-block-b-youtube-16x9-v2.png`.
- Iteration performed: **yes, once**.
- Standalone missing assets generated: **none**.
- Text baked into selected sheet: **none requested or accepted**.

The built-in tool accepts at most five reference paths. The successful base
generation used the five subject PNGs directly: camera, folder, Claude shell,
ChatGPT shell, and Gemini shell. The warm paper and the approved board were
inspected separately and encoded as explicit prompt constraints.

## Successful base-generation prompt

```text
Use case: illustration-story
Asset type: premium production storyboard sheet for a 1920x1080 editorial motion-graphics video, block 00:10–00:20
Input images: Image 1 is the exact coral-and-black camera asset; Image 2 is the exact black/coral skill-folder subject; Images 3, 4, and 5 are the exact three workspace-card subjects, in that order. Preserve their silhouettes, material, palette, and identity.
Primary request: Create one polished LANDSCAPE storyboard sheet that depicts thirteen consecutive visual states in strict left-to-right, top-to-bottom reading order. Use a clean 5-panel top row, 4-panel middle row, and 4-panel bottom row, separated by restrained near-black gutters. Every panel is a true 16:9 warm cream-paper frame. The sequence must communicate ONE video introduction being inspected and transformed—not many pieces of content.
Sequence states: 1) one large physical video-card dominates the right, with a coral selection outline around its blank caption layer and blank negative space at left; 2) the same card, selection outline smoothly relocated around the exact camera layer; 3) the same card with one coral motion path connecting blank caption layer, camera layer, and a tiny sound endpoint; 4) the single card separates into exactly three recognizable layers—one blank caption plane, the exact camera asset, and one coral motion path—and all three converge toward one translucent folder; 5) the folder is only a faint echo on the right with three coral velocity lines; 6) the same folder grows clearer while preserving its position; 7) the same folder becomes nearly sharp as the lines reach it; 8) the same folder lands solid and open, large on the right; 9) the first warm coral workspace card ejects from that same folder and settles above it; 10) folder and first card remain fixed while only abstract blank typographic slabs on the left jump upward as one unit; 11) a clean reset with the same folder and first card traveling continuously into the final arrangement while three coral routes draw outward; 12) the second workspace card rises from the same folder and locks into the upper middle; 13) the third blue-violet workspace card is midway entering from the right along the last coral route, with no settle yet.
Style/medium: premium editorial motion-design storyboard, tactile 3D cutout objects, subtle warm cream paper texture, restrained wide soft shadows, precise spatial continuity, elegant art-direction sheet. The folder and workspace-card cluster should follow a consistent approved geometry: the first card upper-left, second card upper-middle, third card approaching upper-right, and exactly one folder centered below.
Composition/framing: preserve generous blank areas for later native typography, especially on the left. From state 5 onward use a strong left-copy/right-object hierarchy. Keep every critical object comfortably inside each panel.
Color palette: warm cream paper, near-black ink and gutters, coral #E2987F for structural paths and accents. Do not introduce green, decorative charts, decorative UI rails, graphs, progress bars, or filler ornaments; the only blue-violet may remain inside Image 5.
Constraints: show one persistent video-card and one persistent folder identity; never duplicate the folder; never show three phones, three videos, content cards, a content factory, or simultaneous content outputs. Do not redesign or substitute the supplied camera, folder, or workspace-card subjects. Keep transitions visually continuous across adjacent states.
Text prohibition: render NO letters, NO words, NO numbers, NO platform names, NO captions, NO logos, NO interface labels, NO panel labels, NO timestamps, NO headings, and NO watermark. Any typography areas must be completely blank geometric placeholders only.
```

## Single targeted iteration prompt

```text
Use case: precise-object-edit
Asset type: final premium landscape storyboard sheet for block 00:10–00:20
Primary request: Edit the storyboard sheet just generated. Change only the spatial layout and progression in panels 5 through 13; keep panels 1 through 4, the 5/4/4 thirteen-panel grid, cream-paper texture, near-black gutters, tactile materials, exact single-video meaning, and overall style unchanged.
Required correction 1 — left typography reserve: in every panel from 5 through 13, move the folder and all workspace-card subjects decisively into the RIGHT 45% of that panel, leaving the LEFT 45% clean warm cream paper with no objects. Preserve exactly one persistent folder. Coral velocity lines and route paths may bridge the middle but must not clutter the reserved left area.
Required correction 2 — platform timing: keep all thirteen states distinct. Panel 12 must show the first warm-coral workspace card plus the second green-accent workspace card locked above the single folder; the third blue-violet card must be completely absent. Panel 13 must preserve those two cards and show the third blue-violet workspace card only MIDWAY entering from the far right along the final coral route, visibly cropped only by motion/framing and not yet settled. Do not show the completed three-card system in panel 13.
Required correction 3 — identity: preserve the supplied black/coral folder, warm-coral first window, green-accent second window, and blue-violet third window as distinct persistent subjects. Do not turn them into phones, content cards, or duplicate skills.
Text prohibition: render NO letters, NO words, NO numbers, NO platform names, NO captions, NO logos, NO interface labels, NO panel labels, NO timestamps, NO headings, and NO watermark. Keep all future native-text zones as clean blank cream paper; do not add pseudo-text or illegible glyphs.
Constraints: no decorative charts, bars, UI rails, graphs, progress indicators, or filler. No multiple-video factory. Change only the corrections above and preserve everything else.
```

## Validation

- Thirteen visual frames are present in a `5 / 4 / 4` reading order.
- The first four frames depict one persistent video-card and its layers.
- Exactly one folder persists through the reveal.
- The final platform family remains visually distinct.
- Gemini is shown entering from the right in the final frame, not as a settled
  completed hold.
- No caption, platform name, folder-tab label, panel number, timestamp, or other
  exact production text was requested from ImageGen.
- Small UI-like geometric marks belong to the supplied shell design; production
  names and labels still must be native overlays.
