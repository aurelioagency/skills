# House rules

Apply these in every project, including one with no CLAUDE.md. A project's CLAUDE.md wins where it is stricter.

## Render contract
- The film is a pure function of time. `window.seek(t)` paints frame t, in any order, cold or after any other frame.
- Render mode has no CSS transitions or animations, no `setTimeout`, no `requestAnimationFrame`, no `Date`, and no state carried between frames (no module variable mutated in `run()`).
- Randomness is seeded only (`C.mulberry32(seed)`, `C.noise1(seed)`). Never `Math.random`.
- Output is H.264 yuv420p, CRF 16, bt709 tags, 60 fps finals, AAC 320k, `+faststart`.
- Verify determinism once per project: `node scripts/render.mjs --verify --all`.
- No `will-change`, no `translate3d`, no `translateZ(0)`. A composited GPU layer caches its raster, so the same t paints differently depending on the previous frame (measured: 9/12 probes differed, up to 211/255 per pixel). Use 2D transforms (`C.put` does). If a shot truly needs CSS 3D (`perspective` / `rotateX`), run `--verify` on it. If it fails, fake the depth in 2D (skew + scale + shadow) or draw it on a canvas.

## Look
- **Banned defaults:**
  - a centred title on a gradient
  - everything fading in
  - corner labels
  - frame borders
  - glow on UI chrome
  - generic particle bursts
  - crossfades between shots
  - spins, glitches, light leaks, bounce on UI
- Use one display face and one UI face: the brand's real files (`capture.mjs` downloads them).
- Use one accent colour unless the brief says otherwise. If the reference is multi-coloured, translate it into a tonal ramp of the one accent.
- Use real product UI, captured from the site, and real logos. Never redraw UI that exists. When a piece exists only as a screenshot, rebuild it element by element and say so in a comment.
- Type is left-aligned at x ≥ 120 px (1080p), sentence case, and the brand's punctuation habit applies. Accent colour goes on the key word or the second phrase only.
- Anything that must be read is at least 28 px at 1080p and passes the 360 px-wide phone check. Scale the camera, not the font.
- 9:16 keeps key content out of the platform UI zones: top 14 %, bottom 20 %, right 12 %.

## Rhythm
- Something new must happen on screen every 2–4 s. Nothing holds longer than one bar without a new element. The end card holds ≤ 2 s and is never static.
- Hard cuts land on bar lines. Inner events land on beats or half-beats, in beats on the measured grid (`beats.json`), never in hard-coded seconds.
- The hook reads in the first 2 s, and frame 0 is never empty.
- Every held shot keeps moving: a micro push of 1.00 → 1.03–1.08, or drift.

## Motion (lib/motion.js springs)
| Preset | For |
|---|---|
| `heavy` | display type, logo lockups, camera |
| `default` | cards, panels, containers |
| `snappy` | buttons, pills, selection, indicators, pops |
| `playful` | mascots only; never UI or type |

- **Enters:**
  - rise through a mask
  - grow out of something (scale 0.8–0.9 → 1 with opacity snapping in within ≤ 4 frames)
  - type on
  - build (skeleton → content)
  - card rise
- **Exits:**
  - lift through the mask
  - get covered
  - get pushed past camera
  - collapse into what replaces it
  - a hard cut
- A pure opacity fade is never an enter or an exit. Only small eyebrow or sub lines may fade.
- **Visual hits lead the beat so they READ on it.** Use `C.spHit()`, never `C.sp()`, for anything with a sound. The audio stays on the grid.
- **Swaps are sequential.** The outgoing line is fully gone before the incoming one lands (`rise(t, L, in, out)` with out = next in minus exit). At most one frame of overlap is allowed, with the outgoing line ≥ 95 % gone.
- Masked words start ≥ 140 % of their size below the mask, so no glyph tops peek through the padding on the first frame.
- Scene pre-roll never cuts in over an unfinished wipe. The incoming scene takes over exactly when the cover is complete.
- Every scene's type is animated on every frame it is registered. Anything registered visible leaks outside its window.

## Sound
- Score and SFX are synthesized in code unless a track is supplied (`music.py`, `sfx.mjs`).
- Every hit sits on the measured beat grid (`beats.json`), and every SFX event is declared in `timeline.json` `sfx`.
- The mix sits at -14 LUFS integrated with true peak ≤ -1 dBTP (`mix.py`).
- Voiceover is cut into phrases and each phrase is placed on a beat. Never speed up a whole take.
- **Branch B:** SFX sit well under the voice — `mix.sfx` -14 dB, primary hits gain ≤ 0.5, texture ≤ 0.25. A low thump on a spoken word masks it: ≤ 0.1 or none. The narration is the user's finished audio; only loudness is touched, and a quiet source (> +8 dB needed) is reported to the user, not silently pumped.

## Branch B (motion graphics on the user's own footage)
**The point is the animation.** Subtitles are always on (`OV.subtitles()`), so every graphic must show something the caption doesn't.
- **No echo.** Never put a phrase on screen that the subtitle is showing, unless it is the key datum of that moment (a number, a name, a price, one keyword). Non-key phrases never — least of all in the hook: the first second is for the strongest visual, not for the opening words.
- **On-screen text is key data only:** short (1–3 words or a number), verbatim or shortened from what's said, never an invented claim, number or feature.
- **Shot types** — vary them; something new every 2–4 s:
  - *Footage move*: punch-in / zoom on the speaker on a strong line (1.00 → 1.10–1.20 on a heavy spring), slow drift, a small shake on an impact. Animate `OV.bg`.
  - *Resource demo*: the real resource in motion — scroll through its page, a cursor clicking, a zoom to the part that matters, a highlight drawn on the screenshot. Real UI only, never redrawn.
  - *Visual element*: logo grids, icons, counters, price tags, arrows / hand-drawn strokes, progress bars, split comparisons, stickers or emoji when the tone allows.
  - *Full-screen cutaway*: the speaker leaves the frame, a complete animation fills it while the voice keeps talking (subtitles stay on), then back to the speaker. Use it where the speech explains something visual.
  - *Behind the subject*: graphics passing behind the speaker (needs a person matte — not built yet; plan it only once `scripts/matte.py` exists).
- **Look:** taken from the resource being shown and from the user's reference reels, not from the user's brand unless asked. Type over bright footage sits on a panel.
- **Motion:** cards rise out of / lift into their own edge (`OV.slide`), never a fixed mask line floating in the frame; anything with a sound settles on its cue (`OV.settleOn`); no element pops in or vanishes in one frame; a scene's `from` must precede its first spring (`spHit` lead) or the root un-hides mid-rise.
- `timeline.json` uses `bpm: 60` with no measured grid, so marks are literal transcript timestamps.

## Process
- Loop before showing anything: contact sheet → score → fix the 3 worst → repeat until every score is ≥ 8, with at least 3 rounds.
- Judge from the rendered MP4s and sheets. Never judge from the page or from memory of the code.
- Parallel sessions may run the same brief. Use a distinctive `videos/<slug>`, never write into a folder you did not create, and if files change under you, stop and check.
