# ImageGen record — YouTube 16:9 — Block A `00:00–00:10`

## Tool mode

- Skill: `imagegen`
- Mode: built-in ImageGen, generation with local reference images plus one targeted identity edit
- Use-case slugs: `stylized-concept`; `precise-object-edit`
- Successful image outputs: `2`
- Selected project deliverables: `1` — the original v1 sheet
- Targeted visual iteration: generated and inspected, then rejected because it reduced fidelity to the exact camera asset
- Exact copy requested from ImageGen: none

The built-in tool accepts at most five local reference images per call. The five foreground assets most important to visual identity were supplied. The warm paper and folder files were separately inspected; final production must use their exact PNGs as recorded in `ASSET_MANIFEST.md`.

## Reference inputs

1. `<local-user-root>\Documents\Playground\ASSETS\img_generated\camera_recording_icon.png`
2. `<local-user-root>\Documents\Playground\ASSETS\img_generated\video_editor_timeline_panel.png`
3. `<local-user-root>\Documents\Playground\ASSETS\img_generated\pixel_hand_cursor.png`
4. `<local-user-root>\Documents\Playground\ASSETS\img_generated\editing_scissors_icon.png`
5. `<local-user-root>\Documents\Playground\ASSETS\img_generated\layered_video_editing_stack.png`

Separately inspected exact production files:

- `<local-user-root>\Documents\Playground\ASSETS\img_generated\warm_cream_paper_background.png`
- `<local-user-root>\Documents\Playground\ASSETS\img_generated\ai_skill_folder_black_coral.png`

## Final prompt

```text
Use case: stylized-concept
Asset type: premium landscape storyboard sheet for a 30-second editorial motion-graphics video, representing only block A from 00:00 to 00:10.
Input images and roles:
Image 1 is the exact coral-and-black professional video camera asset identity.
Image 2 is the exact dark editing timeline panel asset identity.
Image 3 is the exact pixel hand cursor asset identity.
Image 4 is the exact black-and-coral scissors asset identity.
Image 5 is the exact layered video editing stack asset identity.
Primary request: Create one wide 16:9 storyboard sheet containing nine separate 16:9 cinematic thumbnails in a precise 3 by 3 reading-order grid. Each thumbnail depicts a successive moment from one and the same video introduction, never multiple video outputs.
Panel progression, left to right then top to bottom:
1. Finished premium intro already full frame: warm cream paper, generous negative space for later native copy at upper left, exact camera at right, one thin coral causal line.
2. Same frame and same camera slightly larger and angled inward, more emphatic negative space at left for a later hero word.
3. Same finished composition held cleanly and calmly.
4. The exact same finished intro has physically shrunk into one single video card at upper right, revealing the exact dark editing timeline below/right, exact cursor and exact scissors; generous copy space at left.
5. Same single editor project: the one video card remains, three editable caption-layer shapes appear inside that same preview, cursor selecting one layer.
6. Same single editor project: exact layered editing stack enters behind and above the timeline, with one coral plate moving toward that same preview.
7. Same single editor project at maximum controlled density: timeline, stack, cursor and scissors causally aligning layers; one project only.
8. Same dense project held completely still.
9. That same editor project compresses continuously back into one large physical video card at right showing the original camera composition; a very faint black folder silhouette with a coral tab sits behind the card only as anticipation, not a reveal; generous copy space left.
Style/medium: premium editorial 3D collage and motion-design keyframes, physically grounded cards with broad low soft shadows, faithful to the supplied asset identities.
Composition/framing: one overall landscape sheet; nine equal 16:9 frames in a 3x3 grid separated only by narrow near-black gutters; preserve safe margins within every miniature; strong asymmetric 60/40 or 40/60 layouts; approximately one dominant descriptive asset per major frame.
Color palette: warm cream paper matching a tactile off-white paper texture, near-black ink and objects, structural coral #E2987F. No green.
Materials/textures: subtle tactile paper grain, matte black objects, restrained dimensional lighting.
Constraints: preserve the same camera, timeline, cursor, scissors, editing stack and video-card identity across panels; unmistakably one video project evolving through time; no duplicated videos, no phone triptych, no content factory, no multiple simultaneous outputs; no captions or typography baked into imagery; leave intentional clean negative space wherever native editable text will later be overlaid.
Avoid: every kind of word, letter, number, caption, logo, platform name, UI label, panel number, watermark, pseudo-text, scribbled text, decorative chart, bar, indicator, UI rail, filler icon, emoji, random decoration, green accent, extra screens, extra video cards, multiple content pieces.
```

## Targeted camera-identity iteration

The lead initially requested a simplified camera test. After the edit completed, the exact `camera_recording_icon.png` was reopened and confirmed to be the coral/black broadcast camera with microphone and lens hood. The simplified edit therefore moved away from the approved asset identity and was rejected. It was not copied into the project directory and v1 remains selected.

Targeted edit inputs:

1. Edit target: `<local-user-root>\Desktop\Agency\video-intro-ai-workflow\phase-4\youtube-16x9\block-a-00-10\storyboard-sheet-youtube-16x9-block-a-00-10-v1.png`
2. Identity reference: `<local-user-root>\Documents\Playground\ASSETS\img_generated\camera_recording_icon.png`

Targeted edit prompt:

```text
Use case: precise-object-edit
Asset type: corrected premium landscape storyboard sheet for YouTube 16:9 block A, 00:00 to 00:10.
Input images:
Image 1 is the edit target. Preserve its exact overall 3 by 3 storyboard-sheet layout, panel order, cream-paper environments, black gutters, timeline, cursor, scissors, editing stack, folder anticipation, shadows, negative-space strategy, and single-video narrative.
Image 2 is the primary and binding identity reference for the approved camera asset.
Primary request: Change only every depiction of the camera in Image 1. Across all nine panels, replace the current photoreal broadcast-camera rendering with one consistent, simplified coral-and-black camera object derived from Image 2's approved silhouette, body proportions, coral/black color blocking, material style, and three-quarter orientation. The same exact simplified camera identity must persist at every scale, including inside the video-card previews.
Camera invariants: compact clean coral-and-black object silhouette; simplified physical 3D icon treatment; consistent body proportions; restrained surface detail; same camera in every panel.
Explicit removals: no microphone, no lens hood, no extra buttons, no dense control arrays, no cable, no branding, no logo, no alternative camera design, no photoreal broadcast-camera complexity.
Change only the camera identity. Keep everything else in Image 1 unchanged as closely as possible, including the nine equal 16:9 panels in a precise 3x3 reading-order grid and the continuous story of one video project.
Color palette: warm cream paper, near-black ink and objects, structural coral #E2987F; no green.
Text constraint: do not add any word, letter, number, caption, logo, platform name, UI label, panel number, watermark, pseudo-text, or scribbled text.
Avoid: multiple video outputs, extra screens, phone triptychs, content-factory imagery, decorative charts, bars, indicators, filler icons, emojis, random decoration, additional cameras.
```

Rejected generated source, retained only in the built-in ImageGen archive for audit:

- `<local-user-root>\.codex\generated_images\019fab42-75a2-7280-ab63-5d02594b0c6d\exec-ccb4f486-03ce-49c9-b47b-ce6dc34292c1.png`

## Saved files

- Selected project copy: `<local-user-root>\Desktop\Agency\video-intro-ai-workflow\phase-4\youtube-16x9\block-a-00-10\storyboard-sheet-youtube-16x9-block-a-00-10-v1.png`
- Built-in ImageGen source retained at: `<local-user-root>\.codex\generated_images\019fab42-75a2-7280-ab63-5d02594b0c6d\exec-73b3af3e-5ea7-4b13-8e40-aa7cf1962584.png`

## Inspection result

- Nine frames are present in a 3×3 reading-order layout.
- The same camera/video-card identity persists across the block.
- Manual-editing density occurs inside one project only.
- Palette is limited to cream, near-black, white, and coral; no green cue appears.
- No exact word, caption, logo, platform name, UI label, panel number, or pseudo-text is baked into the sheet.
- The targeted simplified-camera output also contains no baked text, but it was rejected because it removed approved broadcast-camera features.
- The selected v1 sheet remains the closer visual match to `camera_recording_icon.png`.
