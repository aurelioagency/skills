# Cover (portada) — Branch B

Every finished Branch B video ships with a cover, made **exactly as social-video-producer makes it**: same script (`scripts/build-cover.mjs`), same font as the subtitles, same three-line block, same fixed sizes, and burned into the video as its frame 0. These rules are a copy of that skill's Cover section. When one changes, change the other in the same pass.

The cover is one frame of the video with a three-line headline burned onto it, as a PNG at the source's native resolution, named `<slug>-portada.png` and delivered next to the MP4. **This is not an optional extra and it is not something to ask about.** A finished reel is a publishable post, and the cover is what decides whether anyone opens it. Produce it in the same run, after the subtitles (SUBTITLES.md S8).

**Raw takes (SKILL.md B0b):** the base photo is the cover candidate picked from the user's still "posing" seconds (`assets/source/cover-candidate-<n>.png`, from the raw takes, colour-corrected like the edit), shown to the user at B0b gate 1; build with `--input <that png> --frame 0`. A smile without teeth is the usual pose; with teeth is fine too.

The agent writes the headline. The frame: **if the user supplied a cover image or pointed at a specific frame, use exactly that as the BASE PHOTO — never swap it for another.** If they did not, the agent picks the frame (that silence means "you choose it"). Either way, do not hand the decision back as a question — bring the result and let them veto it.

**"Use exactly that" answers a different question than "does it need a headline."** It says which photo is the base, not whether to add the title. A user-supplied cover image is raw material for `build-cover.mjs --input`, the same as any frame the agent would have picked; it still gets the headline burned onto it before it ships. Do not read "use exactly that image" as "ship it untouched": that rule is about the SOURCE, this one is about the TEXT. If the image is already a finished graphic with a headline composed on it (not a plain photo/frame), that is the one case "use exactly that" does mean ship as-is — ask if it is genuinely unclear which of the two the user handed over.

## House style (decided; not a menu)

- **The frozen caption font**, Neue Montreal Bold — the same file the subtitles use (`assets/fonts/captions/NeueMontreal-Bold.otf`). Always pass it with `--font-file`: Branch B projects also keep resource fonts in `assets/fonts/`, and the script would otherwise grab the first font it finds there.
- **The cover's treatment MUST match the subtitles burned into the video** — the two are seen side by side in the feed. Branch B subtitles are the house white style, so the cover is **`--style white`**: crisp solid-white fill, NO outline, NO blur on the letters, just a plain low-contrast drop shadow. A black outline or a blurred fill looks wrong on this style. Only if the user asked for cyan Inter Black subtitles does the cover go `--style cyan` (cyan fill, fully opaque black outline, soft drop; `--accent-big` for unusually busy footage). Neue Montreal never takes cyan.
- **Three lines, one block, anchored bottom.** Small setup line, big line, small payoff line, sitting over the torso.
- **The emphasis is per WORD.** Wrap what carries the cover in `*asterisks*` and it is set at the big size. Normally that is the whole middle line; a second word further down can take it too (`--line "y esta *skill* lo arregla"`).
- **`--anchor bottom` is the answer for a talking head.** Text above the speaker lands on hair and forehead and leaves a dead gap through the middle. Move it only over footage with real empty space up there, and only after looking at the frame.
- **Fixed sizes: `--small-size 68 --big-size 166`, never `--fit`.** `--fit` changes the rendered size per video depending on how many words the headline has, which is the exact inconsistency the fixed numbers exist to prevent. The numbers are literal: never substitute `--fit` or another pair "to make it look better". When asked to nudge the block, apply only the specific change requested (e.g. a given `--y-offset`) and leave the sizes untouched.
- **Never add an outline, a colour, or any treatment the current instructions did not ask for, even if older covers have it.** A past cover is a record of what an earlier session produced, not authority for this one. If a past example looks different and that difference seems worth copying, ask in one concrete question ("¿querés contorno negro como en `<archivo>` o liso como pide la skill?") instead of pattern-matching silently.

## Choosing the frame

Pick from the **source** (`assets/source/<file>`), at its native resolution: the cover is the speaker, not a graphic. Scan and *look*, do not guess a timestamp:

```
node <skill>/scripts/build-cover.mjs --scan --input assets/source/<file> --output snapshots/cover-scan.png
```

The sheet is head-and-shoulders crops at 5 fps, so the mouth is legible. Cell `(row, column)` is `t = (row * columns + column) / fps`. **When you are the one choosing the frame**, pick one with:

- **mouth closed or a slight smile** — a mid-word open mouth reads as a bad screenshot;
- eyes to camera;
- a clean band under the face for the text, clear of hands and props.

**When the user gave you the frame, you do not get to pick for a clean band — work with that frame.** Measure where the chin actually sits (a grid overlay beats eyeballing — the chin is usually lower than it looks) and place the block from there.

**The headline never covers the face — not the jaw, not the neck right under it.** If the block would touch the face, push it DOWN with `--y-offset` until the top line clears the chin — onto the neck/chest, and over the mic / hands if that is what it takes. Text over a prop is fine; text on the face is not. Keep all the lines.

## Writing the headline

Restate the video's strongest idea, then decide which WORDS carry it and set those big. Concrete beats clever. Match the video's own words and register (voseo if that is how it was spoken), with everyday words. Not a summary of the video, and never a line the video does not deliver on.

Break the lines around the emphasis, not around the grammar: the big word wants to end up alone or nearly alone on its line so it reads at a glance.

### The shape, from the two approved covers

These two shipped and were approved. Copy their shape; do not reinvent it per video.

```text
esta skill te da            Claude ignoró
  10 GANCHOS                LA HERRAMIENTA
para tu próximo video       y esta SKILL lo arregla
```

- **Three lines. One block. Anchored bottom, over the torso.** Not two blocks, not a band above the head.
- **The middle line is the big one**, and it is the whole line. A second word may go big further down (`skill` above), but the middle line carries the cover.
- **Six to eight words**, small line → BIG line → small line.
- **Read the big words alone and it still has to mean something**: "10 ganchos", "la herramienta · skill".
- **No punctuation.** No commas, no full stops — the line breaks do that work, and a comma in display type reads as a stray dot. Question marks are the exception; they carry meaning.
- **Do not mix the big and small size inside the first or third line by default.** One line fully small, one line fully big, one line fully small. Mixing sizes within a small line is only for a genuinely needed second emphasised word (the `skill` example), and is the exception.

Budget the width before writing: at the house sizes a big word runs about `0.17 x frameWidth` per character and a small one about `0.07 x frameWidth`, against a usable width of `frameWidth - 140/1080 x frameWidth` — roughly 9-10 big characters or ~24 small ones per line. The script measures the real font metrics and refuses to render an over-wide line; then shorten the line, never shrink the sizes.

## Building it

```
node <skill>/scripts/build-cover.mjs --project . --input assets/source/<file> --frame 19.0 --font-file assets/fonts/captions/NeueMontreal-Bold.otf --style white --line "esta skill te da" --line "*10 ganchos*" --line "para tu próximo video" --anchor bottom --small-size 68 --big-size 166 --output renders/final/<slug>-portada.png
```

Geometry is expressed in 1080-wide design space and scaled by `sourceWidth / 1080`, so a 4K source gets 4K-sized text with no arguments. The script gates the width against the real font metrics, verifies the rendered fill colour, and reports `insideGridCrop` — whether the block survives the profile grid's crop. Treat `false` as a blocker, not a warning: nudge with `--y-offset` (positive is down, in source pixels) and rebuild.

Then **look at both outputs** — the full cover and the grid-crop preview it writes next to it. The text landing across the speaker's hands or a prop is the failure the script cannot see.

**A cover made from a still image** (`.png`/`.jpg` the user supplies): pass `--frame 0`. The geometry scales from the image width. Measure where the chin sits and push the block below it with `--y-offset` before building.

## The cover goes into the video, as frame 0 (mandatory)

Building `<slug>-portada.png` is not the last step. The cover is also burned into the final video as its literal **frame 0** — one single frame, exactly `1/fps` long, never a multi-second title card. Once that frame is in, the video is finished.

1. Build a one-frame clip from the cover, matching the subtitled video's own codec, resolution, fps and audio params exactly (check with `ffprobe` first — Branch B finals are 60 fps, do not assume 30):

   ```
   ffmpeg -y -loop 1 -i renders/final/<slug>-portada.png -f lavfi -i "anullsrc=r=<rate>:cl=stereo" -frames:v 1 -r <fps> -vf "scale=<w>:<h>:flags=lanczos,setsar=1,format=yuv420p" -c:v libx264 -profile:v high -crf 14 -preset slow -c:a aac -b:a 192k -t <1/fps> renders/intro-card-1frame.mp4
   ```

2. Concatenate it onto the subtitled video with **one clean re-encode pass**, never `-f concat -c copy`: stream-copying two independently encoded H.264 streams produces a corrupted, washed-out frame right at the splice.

   ```
   ffmpeg -y -i renders/intro-card-1frame.mp4 -i renders/final/<slug>-subs.mp4 -filter_complex "[0:v:0][0:a:0][1:v:0][1:a:0]concat=n=2:v=1:a=1[outv][outa]" -map "[outv]" -map "[outa]" -c:v libx264 -crf 14 -preset slow -c:a aac -b:a 192k renders/final/<slug>-final.mp4
   ```

Verify with `verify-render.mjs` (duration = the subtitled video plus one frame, not plus a second) and pull the first two frames: frame 0 is the cover, frame 1 is already the real film. `renders/final/<slug>-final.mp4` and `renders/final/<slug>-portada.png` are the deliverables.

## Two failures worth knowing about

- **`YCbCr Matrix` in the ASS header is target-dependent.** `TV.709` is right burning into an MP4 and wrong rendering to a PNG (the fill lands dimmer and greyer; `#30D5FF` arrived as `#39C7EB`, which reads as "half transparent letters"). PNG output declares `None`. `build-cover.mjs` samples the rendered strip and fails if the fill does not match.
- **The profile grid crops the cover to a centred 3:4 tile**, not a square (for 1080x1920 the surviving band is y=240..1680). The script reports `insideGridCrop` against that tile. Do not quote a grid measurement to the user without reading it out of the script (`gridCropHeight` in `scripts/build-cover.mjs`).
