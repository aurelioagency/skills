# Registro ImageGen — Reel 9:16 — Bloque B `00:10–00:20`

## Ejecución

- Modo: built-in `image_gen`.
- Taxonomía: `illustration-story`, con intentos de corrección
  `precise-object-edit`.
- Source base:
  `<local-user-root>\.codex\generated_images\019fab42-b88e-7671-aee2-ddbe056e0e43\call_AsdDDZqtxgrOTW3NhTFSrL3T.png`.
- Source de la primera fila corregida:
  `<local-user-root>\.codex\generated_images\019fab42-b88e-7671-aee2-ddbe056e0e43\call_YRYuU938QJBD5NgXiYVuFzrJ.png`.
- Source de la corrección final B1:
  `<local-user-root>\.codex\generated_images\019fab42-b88e-7671-aee2-ddbe056e0e43\call_upeNPCzP5ToTLDbhR6bfFKft.png`.
- Copia de proyecto:
  `<local-user-root>\Desktop\Agency\video-intro-ai-workflow\phase-4\reel-9x16\block-b-10-20\storyboard-sheet-block-b-reel-9x16-v3.png`.
- Dimensión seleccionada: `864×1821`.
- Referencias del prompt base: cámara, folder, Claude, ChatGPT y Gemini exactos.
- Bitmaps faltantes/nuevos: **ninguno / ninguno**.
- Texto exacto horneado: **ninguno**.

Se inspeccionaron dos correcciones focalizadas. Ambas se descartaron:

1. la primera introdujo rectángulos que podían leerse como pseudo-texto y sustituyó
   la ventana reconocible de Claude;
2. la reparación recuperó mejor el shell, pero debilitó el handoff incompleto de
   Gemini.

El prompt base sigue siendo la fuente de B5–B13 porque conserva la composición más
limpia y B13 muestra Gemini claramente fuera de posición y todavía en movimiento.
La primera fila de la `v2` usa una corrección built-in ImageGen posterior, documentada
abajo.

El intento ImageGen de v2 corrigió B1–B4, pero redibujó indebidamente algunas
ventanas posteriores. Para cumplir simultáneamente ambos invariantes, el archivo
final se ensambló sin reescalar ni dibujar artwork nuevo:

- filas B1–B4: source corregido, píxeles `y=0–533`;
- filas B5–B13: source base validado, píxeles `y=534–1820`.

`v1` y `v2` permanecen en el proyecto; `v3` es un archivo nuevo y no sobreescribe
ningún artefacto.

## Prompt base seleccionado

```text
Use case: illustration-story
Asset type: premium production storyboard sheet for a native 1080x1920 Instagram Reel, block 00:10–00:20
Input images: Image 1 is the exact coral-and-black camera subject; Image 2 is the exact black/coral square skill-folder subject; Images 3, 4, and 5 are the exact horizontal 16:9 workspace-card subjects in chronological order. Preserve their silhouettes, materials, colors, and aspect ratios without stretching.
Primary request: Create one polished TALL PORTRAIT storyboard sheet containing EXACTLY THIRTEEN separate PORTRAIT 9:16 panels. Arrange them in four unambiguous reading rows: 4 panels in the first row, then 3 centered panels in the second row, 3 centered panels in the third row, and 3 centered panels in the fourth row. Read strictly left-to-right and top-to-bottom. No title, footer, legend, extra cell, inset, or merged panel. Every storyboard panel must be visibly taller than wide, framed by restrained near-black gutters, and filled with warm cream paper.
Vertical composition system inside every panel: keep the upper 35% clean for later native typography; place the proof object in the middle; use the lower area for the persistent folder and causal routes. Keep essential objects away from the far-right controls band and the bottom interface band. This is a native vertical design, never a crop of a landscape layout.
Thirteen sequential states: 1) one and only one horizontal physical video-card sits centered in the middle band; a coral outline selects a completely blank caption zone within it; 2) the same single card persists and the coral outline moves to the exact camera subject inside it; 3) the same card persists while one coral path connects its blank caption zone, camera, and one tiny sound endpoint; 4) that same single card separates into exactly three recognizable layers—one blank caption plane, the exact camera subject, and one coral motion path—and all three descend into one translucent square folder at lower center; 5) the same folder is a very faint echo at lower center with three restrained coral downward velocity lines; 6) the same folder grows clearer in the same position; 7) the same folder becomes nearly sharp while preserving its center of mass; 8) the same square folder lands fully solid and open in the lower-middle band; 9) the first warm-coral horizontal 16:9 workspace card ejects vertically from that same folder and settles directly above it; 10) that folder and first workspace card remain fixed while two restrained upward coral motion streaks pass through the otherwise empty upper safe zone, suggesting a native-text phrase jump without drawing text or text boxes; 11) clean reset: the same first workspace card shifts to the left side of a compact lower fan, the same square folder remains below, and exactly three coral routes draw upward; the other two workspace cards are absent; 12) the second green-accent horizontal 16:9 workspace card rises from the same folder and locks in the center of the fan beside the first card; the blue-violet third card is completely absent; 13) preserve the first two cards and the single square folder, while the blue-violet third horizontal 16:9 workspace card is only about 55% through an entrance from outside the right edge along the last coral route, visibly still moving and not settled.
Style/medium: premium editorial motion-design storyboard, tactile 3D cutout objects, subtle warm cream paper texture, restrained wide soft shadows, precise spatial continuity, elegant art-direction sheet. Use strong above/below hierarchy rather than left/right horizontal staging.
Color palette: warm cream paper, near-black, coral #E2987F. Green may appear only as an intrinsic accent inside Image 4; blue-violet may appear only inside Image 5. No other saturated colors.
Identity and geometry constraints: one persistent video-card only; one persistent square folder only; all workspace cards remain horizontal 16:9 objects; never stretch the folder into a rectangle or the cards into portrait screens. Never show three phones, three videos, content outputs, a content factory, duplicate folders, or multiple skills.
Absolute text prohibition: render NO letters, NO words, NO numbers, NO logos, NO pseudo-text, NO illegible glyphs, NO captions, NO platform names, NO folder label, NO interface labels, NO panel labels, NO timestamps, NO headings, and NO watermark. Do not draw blank text bars or text-box placeholders; leave future native-text areas as uninterrupted clean cream paper.
Avoid: ornamental UI, rails, charts, graphs, metrics, progress bars, decorative indicators, frames inside frames, filler, unnecessary arrows, or objects added only to occupy vertical space.
```

## Corrección focalizada descartada

```text
Use case: precise-object-edit
Asset type: final Reel 9:16 storyboard sheet, block 00:10–00:20
Primary request: Edit only the THREE panels in the THIRD ROW of the just-generated 13-panel sheet. Keep every other panel, the exact 4/3/3/3 grid, all thirteen portrait 9:16 frames, cream paper, near-black gutters, tactile materials, exact single-video meaning, and overall style unchanged.
Third-row correction, left to right:
1) This panel must be the solid skill reveal before any platform appears. Remove the horizontal workspace card and remove its arrow. Show only the same single square black/coral folder, fully sharp, solid, open, and centered in the lower-middle band. Keep the upper 55% uninterrupted clean cream paper.
2) This panel must be the first-platform ejection. Preserve exactly one square folder below and one warm-coral horizontal 16:9 workspace card directly above it. Replace the two upper motion streaks with one restrained upward causal arrow that begins at the folder and ends beneath the workspace card. No other workspace cards.
3) This panel must be the phrase jump. Preserve exactly the same single folder and first horizontal workspace card in their positions. Remove the three branching routes. Add only two restrained upward coral motion streaks in the otherwise empty upper safe zone. Do not draw text blocks, text boxes, or placeholder bars.
Chronology after this edit: third row is solid folder reveal → first workspace card ejects → native-text phrase jump. The fourth row must remain unchanged as routes/reset → second green-accent card lock → blue-violet third card only midway entering from the right.
Absolute text prohibition: render NO letters, NO words, NO numbers, NO logos, NO pseudo-text, NO illegible glyphs, NO captions, NO platform names, NO folder label, NO interface labels, NO panel labels, NO timestamps, NO headings, and NO watermark.
Constraints: do not add or remove panels; do not change the first, second, or fourth row; never duplicate the folder; preserve the square folder and horizontal 16:9 card proportions; no phones, multiple videos, content factory, decorative UI, rails, charts, graphs, metrics, progress bars, filler, or extra arrows.
```

## Reparación con assets exactos descartada

```text
Use case: precise-object-edit
Asset type: final native-vertical Reel storyboard sheet, block 00:10–00:20
Input images: Image 1 is the edit target and must remain visually unchanged except for the three panels in its THIRD ROW. Image 2 is the exact square black/coral folder subject. Image 3 is the exact horizontal 16:9 warm-coral workspace-card subject that must be used in two corrected panels.
Primary request: Preserve Image 1's complete 4/3/3/3 grid of exactly thirteen portrait 9:16 panels, all first-row, second-row, and fourth-row panels, cream paper, gutters, object scale, palette, safe zones, and style. Modify only the THIRD ROW, left to right.
Third-row panel 1: show only Image 2, one fully sharp, solid, open square folder centered in the lower-middle area. No workspace card, no arrow, no rectangle, and no other object. The upper 55% is uninterrupted cream paper.
Third-row panel 2: show exactly one Image 2 folder below and exactly one recognizable Image 3 horizontal 16:9 workspace card directly above it, retaining Image 3's black frame, coral left column, and blank cream workspace. Use one restrained upward causal arrow from folder to card. No other card, no blank replacement rectangle, and no placeholder.
Third-row panel 3: preserve the same exact folder and exact Image 3 workspace card in the same positions as panel 2. Remove the folder-to-card arrow. Add only two thin upward coral motion streaks high in the empty upper safe zone to signal a native-text phrase jump. No branching routes.
Critical invariants: Image 3 must remain a horizontal 16:9 card with its recognizable supplied shell; Image 2 must remain square and must never be duplicated inside one panel. Do not simplify either subject into a blank rectangle. The fourth row remains exactly as in Image 1: first card plus three routes, then first and green-accent second card, then blue-violet third card only midway entering from the right.
Absolute text prohibition: render NO letters, NO words, NO numbers, NO logos, NO pseudo-text, NO illegible glyphs, NO captions, NO platform names, NO folder label, NO interface labels, NO panel labels, NO timestamps, NO headings, and NO watermark. Do not create text bars, label boxes, empty text rectangles, or caption placeholders anywhere.
Avoid: any change outside the third row; extra or missing panels; phones; multiple video outputs; duplicate folders; decorative UI; rails; charts; graphs; metrics; progress bars; filler; or extra arrows.
```

## Prompt de corrección B1–B4 usado en v2

```text
Use case: precise-object-edit
Asset type: non-overwriting v2 Reel 9:16 storyboard sheet, block 00:10–00:20
Input images: Image 1 is the edit target. Preserve its exact 4/3/3/3 grid, all thirteen vertical 9:16 panels, and every pixel-level composition decision in panels B5 through B13. Image 2 is the exact camera subject for B1–B4. Image 3 is the exact square folder subject already present in B4 onward.
Primary request: Edit ONLY the four panels in the FIRST ROW of Image 1, corresponding to B1–B4. Do not change any gutter, frame boundary, panel count, later panel, palette, lighting, shadow language, or blank copy zone.
Persistent-subject correction: B1, B2, and B3 must show the SAME plain horizontal Physical Card inherited across all three panels. It is a warm-cream paper card with a clean cream surface, subtle physical thickness, restrained wide shadow, and no dark application shell. Remove every sidebar, toolbar, top bar, window chrome, play button, editor control, decorative UI element, or interface icon from these three panels. The card is one continuous identity, not a workspace window and not a video editor.
B1: one plain cream Physical Card centered in the middle/lower proof band. Inside it, use only a thin coral selection outline around a blank caption area. Do not add text, bars, icons, or camera yet.
B2: preserve that exact same plain cream card, size, perspective, and position. Add Image 2, the exact coral-and-black camera, inside the card. Move the same thin coral selection outline around the camera subject. No other internal UI.
B3: preserve the exact same card and exact camera. Keep one small blank caption selection outline if needed, then draw one restrained coral route connecting the blank caption area to the camera and ending in ONE SIMPLE SOLID CORAL CIRCULAR ENDPOINT DOT. Remove every waveform, audio badge, sound icon, speaker icon, play icon, or approximate symbol. Exactly one endpoint dot.
B4: retain the existing vertical convergence composition and the same single translucent square folder at lower center. The same Physical Card separates into exactly three recognizable layers: one blank cream caption plane, Image 2 camera, and one coral route. Replace the current waveform/audio badge with ONE SIMPLE SOLID CORAL CIRCULAR ENDPOINT DOT on that route. No other symbol. The three layers descend toward the one folder.
Strict preservation: panels B5–B13 must remain unchanged from Image 1, including the folder opacity progression, the first warm-coral platform card, the phrase-jump streaks, the three routes, the second green-accent platform card, and the final blue-violet card visibly only midway entering from outside the right edge. Preserve one folder per panel and all source aspect ratios: folder square, platform cards horizontal 16:9.
Absolute text prohibition: NO letters, words, numbers, logos, pseudo-text, illegible glyphs, captions, platform names, folder labels, interface labels, panel labels, timestamps, headings, or watermark. No blank text bars or UI placeholders.
Avoid: changes outside B1–B4; extra or missing panels; dark workspace shell in B1–B3; sidebar; play button; editor UI; waveform icon; audio icon; approximate icon; phones; multiple videos; content factory; duplicate folders; charts; rails; progress bars; filler.
```

## Prompt de corrección B1 usado en la v3 vinculante

```text
Use case: precise-object-edit
Asset type: non-overwriting binding v3 Reel 9:16 storyboard sheet, block 00:10–00:20
Input images: Image 1 is the edit target. Image 2 is the exact coral-and-black broadcast camera subject.
Primary request: Change ONLY panel B1, the TOP-LEFT portrait panel of Image 1. Preserve every other panel, gutter, frame boundary, blank copy zone, palette, shadow, object, route, and the exact 4/3/3/3 thirteen-panel grid unchanged.
B1 correction: Keep the existing plain warm-cream Physical Card, its size, position, perspective, physical thickness, soft shadow, and coral blank-caption selection outline. Place Image 2 inside that same Physical Card, matching the camera scale, orientation, material, and centered placement used in the immediately adjacent B2 and B3 panels. The camera must be the same persistent subject already present at the A9→B1 boundary and in B2/B3. Preserve B1's upper native-copy safe zone as uninterrupted cream paper. Preserve the existing coral caption-selection outline; do not move it onto the camera.
Strict preservation: do not change B2 through B13; do not change the unfinished Gemini arrival in the final panel; do not alter platform windows, folder states, card proportions, or routes. One camera inside one Physical Card.
Absolute text prohibition: NO letters, words, numbers, logos, pseudo-text, illegible glyphs, captions, platform names, folder labels, interface labels, panel labels, timestamps, headings, or watermark.
Avoid: changing any panel except B1; dark workspace shell; sidebar; toolbar; play button; editor UI; audio icon; waveform; extra endpoint; phones; duplicate camera; multiple videos; content factory; duplicate folder; charts; rails; progress bars; filler.
```

## Ensamble final v3

El output de la corrección B1 preservó correctamente cámara, card y selector, pero
el archivo vinculante debía garantizar que ningún otro panel cambiara. Se integró
únicamente la región interior B1 (`x=10–200`, `y=130–390`) sobre la `v2`, usando un
feather de ocho píxeles. No hubo scaling, generación programática de artwork ni
redibujo: ambos lados del ensamble son outputs built-in ImageGen.

- Base: `storyboard-sheet-block-b-reel-9x16-v2.png`.
- Región B1: `call_upeNPCzP5ToTLDbhR6bfFKft.png`.
- Final binding: `storyboard-sheet-block-b-reel-9x16-v3.png`.
- SHA-256: `1046A903DF8AD3A5FD9CA8496C96A374D7EE518E7D4C520EC1C87017C9B08C66`.

## Validación del artefacto seleccionado

- Exactamente 13 paneles en lectura `4 / 3 / 3 / 3`.
- Todos los paneles son verticales y usan copy-zone superior limpia.
- B1 continúa A9 con la misma cámara exacta dentro de la misma Physical Card.
- B1 conserva el selector coral del caption y la cámara mantiene escala/orientación
  hacia B2/B3.
- B1–B3 continúan una misma Physical Card crema sin workspace shell, sidebar,
  play button ni editor UI.
- B3/B4 usan una ruta con un solo endpoint circular coral, sin waveform/audio icon.
- Las ventanas permanecen horizontales, aproximadamente `16:9`.
- El folder mantiene proporción cuadrada.
- Una sola video-card converge en un solo folder.
- Claude aparece primero; ChatGPT después; Gemini entra último.
- B13 conserva Gemini parcialmente fuera del borde derecho y sin settle.
- No se aceptó copy, nombres, labels, numeración, timestamps ni pseudo-texto.
- El spec vertical y el manifest corrigen el límite visualmente comprimido B8→B9.
- B5–B13 provienen pixel-identical de la `v1`; no fueron redibujados en la `v2`.
- B2–B13 permanecen pixel-identical a la `v2`; `v3` modifica sólo el interior de B1.
