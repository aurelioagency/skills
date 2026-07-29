# ImageGen record — Reel 9:16 — Block A `00:00–00:10`

## Tool mode

- Skill: `imagegen`
- Mode: built-in ImageGen
- Initial use-case slug: `stylized-concept`
- Targeted correction use-case slug: `precise-object-edit`
- Generated storyboard sheets: `2`
- Selected project sheet: v2
- Newly generated production bitmaps: none
- Exact text requested from ImageGen: none

The built-in tool accepts at most five local references per call. The approved YouTube sheet carried the nine-beat relationship and the exact cursor/scissors identity; four production assets were also supplied directly. The warm paper, cursor, and scissors files were separately inspected. Final production uses every exact file recorded in `ASSET_MANIFEST.md`, not artwork extracted from either generated sheet.

## Initial reference inputs

1. Narrative/composition reference: `<local-user-root>\Desktop\Agency\video-intro-ai-workflow\phase-4\youtube-16x9\block-a-00-10\storyboard-sheet-youtube-16x9-block-a-00-10-v1.png`
2. Exact camera identity: `<local-user-root>\Documents\Playground\ASSETS\img_generated\camera_recording_icon.png`
3. Exact timeline identity: `<local-user-root>\Documents\Playground\ASSETS\img_generated\video_editor_timeline_panel.png`
4. Exact editing-stack identity: `<local-user-root>\Documents\Playground\ASSETS\img_generated\layered_video_editing_stack.png`
5. Exact folder identity: `<local-user-root>\Documents\Playground\ASSETS\img_generated\ai_skill_folder_black_coral.png`

Separately inspected exact production files:

- `<local-user-root>\Documents\Playground\ASSETS\img_generated\warm_cream_paper_background.png`
- `<local-user-root>\Documents\Playground\ASSETS\img_generated\pixel_hand_cursor.png`
- `<local-user-root>\Documents\Playground\ASSETS\img_generated\editing_scissors_icon.png`

## Initial generation prompt

```text
Use case: stylized-concept
Asset type: premium portrait storyboard sheet for Reel 9:16, block A from 00:00 to 00:10.
Input images and roles:
Image 1 is the approved YouTube block-A storyboard sheet. Use it only as the binding reference for the nine-beat narrative, persistent single-video identity, cream/ink/coral art direction, physical-card language, and exact editing-object relationships. Recompose every beat natively for portrait; do not crop its horizontal panels.
Image 2 is the exact approved coral-and-black broadcast camera identity. Preserve its microphone, lens hood, body proportions, coral shell, black controls, material finish, and three-quarter orientation. Do not simplify, redesign, remove, add, or reinterpret camera parts.
Image 3 is the exact approved dark editing timeline-panel identity.
Image 4 is the exact approved layered video-editing-stack identity.
Image 5 is the exact approved black/coral skill-folder identity, used only as a faint anticipatory echo in the last panel.
Primary request: Create one tall 9:16 portrait storyboard sheet containing exactly nine separate vertical 9:16 cinematic panels arranged in a precise 3 columns by 3 rows reading-order grid. Every miniature panel itself must be visibly portrait 9:16. Separate panels with narrow near-black gutters. Show the same single video introduction evolving continuously through nine moments; never show multiple video outputs.
Vertical composition rule inside every panel: reserve clean native-copy space in the upper band, place the proof/editor object in the middle band, and keep only nonessential depth in the lower band. Keep a narrow empty safety strip along the right edge and keep the bottom roughly 17 percent free of essential information. Do not draw guides or interface rails for these safe zones.
Panel progression, left to right then top to bottom:
1. Finished vertical intro already full-frame: warm cream paper, large clean copy zone in the upper third, exact broadcast camera large below and slightly right, one thin coral causal line.
2. Same exact frame and camera; larger clean upper/central copy zone for a hero word, same camera slightly lower and subtly rotated toward the copy zone.
3. Exact hold of panel 2, same camera and composition, quiet and stable.
4. The exact same intro becomes one single horizontal physical video card in the central-upper area of the vertical frame; exact dark timeline rises below it; one pixel hand cursor and one black/coral scissors act on that same project; clean copy zone at top.
5. Same one project: clean copy zone at top, one persistent video card in the center with three blank solid coral editable-layer cards inside, exact timeline beneath; one cursor selects one layer. The layer cards are material editing surfaces, never text or pseudo-text.
6. Same one project: clean copy zone at top; exact layered editing stack enters centrally and overlaps the same card/timeline in vertical depth; one coral material plate moves toward the same preview. No second screen.
7. Same one project at maximum controlled density: large clean copy zone remains above; timeline, stack, cursor and scissors align layers in the lower-middle band, all essential objects above the bottom safety reserve.
8. Exact still hold of panel 7 with identical object positions.
9. The same editor project compresses continuously back into one large physical video card centered around the middle of the portrait frame; the original broadcast-camera composition remains inside that card; exact black/coral skill folder appears only as a faint partial echo behind the lower-right of the card; large clean copy zone above. One video card only.
Style/medium: premium editorial 3D collage and motion-design keyframes, warm tactile paper, physically grounded objects, broad low soft shadows, disciplined negative space, faithful asset identity.
Color palette: warm cream paper, near-black ink and objects, structural coral #E2987F only. No green and no decorative blue.
Constraints: exactly nine panels; exactly 3 columns by 3 rows; every panel portrait 9:16; one persistent video introduction and one persistent video-card identity; camera must remain the exact broadcast design from Image 2 at every scale; vertical Reels safe-zone logic; clean upper copy zones left completely empty for later native Aventa/Saol overlays; no newly invented imagery.
Absolute text prohibition: do not render any word, letter, number, caption, logo, platform name, UI label, panel number, watermark, pseudo-text, scribble, typographic bar, or text-like mark anywhere.
Avoid: horizontal panel layouts, cropped YouTube frames, phone triptychs, multiple videos, multiple cards, content-factory imagery, extra screens, extra cameras, decorative charts, bars, metrics, progress indicators, interface rails, safe-zone guides, filler icons, emojis, green accents, random decoration.
```

## Targeted safe-zone correction

V1 passed the nine-panel, identity, palette, and no-text checks. A1–A3 placed the camera too low for the conservative bottom reserve, so one permitted targeted edit raised only those three persistent camera groups. V2 passed inspection and is selected.

Correction inputs:

1. Edit target: `<local-user-root>\Desktop\Agency\video-intro-ai-workflow\phase-4\reel-9x16\block-a-00-10\storyboard-sheet-reel-9x16-block-a-00-10-v1.png`
2. Exact camera identity: `<local-user-root>\Documents\Playground\ASSETS\img_generated\camera_recording_icon.png`

Correction prompt:

```text
Use case: precise-object-edit
Asset type: one targeted safe-zone correction to the Reel 9:16 block-A storyboard sheet.
Input images:
Image 1 is the edit target: a complete portrait storyboard sheet with exactly nine vertical 9:16 panels in a 3x3 grid.
Image 2 is the binding exact camera-identity reference.
Primary request: Change only the vertical placement of the camera composition in the first three panels of the top row. Move the same camera and its attached coral causal line upward by roughly 14 percent of each miniature panel's height, so the camera occupies the middle-lower proof band and the bottom 18 percent of each of those three panels is clean cream paper except for a soft nonessential shadow. Keep the large clean native-copy zone above.
Camera identity invariant: preserve the exact coral-and-black broadcast-camera design from Image 2, including microphone, lens hood, coral shell, black controls, proportions, material finish, and three-quarter orientation. Use the same exact camera identity in all three panels. Do not simplify, redesign, add, remove, or reinterpret parts.
Change nothing else. Preserve the exact portrait canvas, nine-panel 3x3 grid, black gutters, panel sizes, all six panels in rows two and three, every timeline, video card, editing stack, cursor, scissors, folder, object scale, object relationship, cream/ink/coral palette, shadows, single-video narrative, and empty copy zones.
Text constraint: do not add any word, letter, number, caption, logo, platform name, UI label, panel number, watermark, pseudo-text, scribble, typographic bar, or text-like mark.
Avoid: additional cameras, multiple videos, extra screens, changed grid geometry, altered lower six panels, decorative elements, guides, rails, green or blue accents.
```

## Saved files

- Selected project sheet: `<local-user-root>\Desktop\Agency\video-intro-ai-workflow\phase-4\reel-9x16\block-a-00-10\storyboard-sheet-reel-9x16-block-a-00-10-v2.png`
- First project sheet retained for audit: `<local-user-root>\Desktop\Agency\video-intro-ai-workflow\phase-4\reel-9x16\block-a-00-10\storyboard-sheet-reel-9x16-block-a-00-10-v1.png`
- Built-in ImageGen v1 source retained at: `<local-user-root>\.codex\generated_images\019fab42-75a2-7280-ab63-5d02594b0c6d\exec-5c2ccef9-05ff-4e2f-8214-006914d9b7aa.png`
- Built-in ImageGen v2 source retained at: `<local-user-root>\.codex\generated_images\019fab42-75a2-7280-ab63-5d02594b0c6d\exec-dca6ea5f-ada6-4ed6-83d6-71153a503a63.png`

## Inspection result

- Exactly nine portrait panels are present in a `3×3` reading-order grid.
- The sheet and every miniature use portrait 9:16 geometry.
- The same broadcast camera and video-card identity persist across the block.
- A1–A3 now keep the lower safety reserve clear of essential camera geometry.
- Rows two and three preserve the accepted v1 composition.
- The editor density remains inside one video project; no triptych or multi-output promise appears.
- Palette remains cream, near-black, white, and coral; no green or decorative blue appears.
- No word, letter, number, caption, logo, platform name, UI label, panel number, watermark, or pseudo-text is baked into v2.
- Visible playback controls are intrinsic to the exact timeline asset.
- A9 production must use the specification's folder coordinates and maximum `0.14` opacity rather than the clearer mosaic depiction.
