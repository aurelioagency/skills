---
name: motion-reel
description: Produce beat-synced motion graphics made entirely in code, in one of two branches. Branch A builds a product launch reel / showreel / promo from scratch: captures a product URL's real brand assets, writes a style guide, measures a beat grid, gets a shotlist approved, then builds with springs. Branch B takes a video the user already filmed of themselves talking and adds motion-graphics overlays (kinetic text cards, stat callouts, step chips, comparisons) generated from what they actually say in it, timed to their own speech instead of a music beat. Both branches run 3+ scored critique rounds to 8+ before delivering H.264 in 16:9, 1:1, 4:5 and 9:16. Use when the user asks for a launch video, product reel, motion reel, showreel, promo, sizzle, social ad, or wants motion-graphics overlays added to a video of themselves talking, or says "motion-reel".
---

# Motion reel

A film is a pure function of time. `window.seek(t)` paints frame t in headless Chromium, and ffmpeg encodes it. Picture and sound share one `timeline.json` in beats on a measured grid.

**Read before building:** [reference/RULES.md](reference/RULES.md) (contract, look, rhythm, motion, sound).
**Also here:** [reference/ENGINE.md](reference/ENGINE.md) (engine API, patterns, commands), [reference/AUDIO.md](reference/AUDIO.md) (music, grid, SFX, VO, mix), [reference/CRITIQUE.md](reference/CRITIQUE.md) (critic prompt).
**Toolchain:** node + playwright (chromium), ffmpeg, python3 with numpy, scipy, soundfile, librosa and pillow, and (Branch B only) `whisper` (openai-whisper) for word-level transcription. `init.sh` checks the first set.

## Choose the branch

- **Branch A — from scratch.** The user wants a launch reel/showreel/promo for a product or brand, and there is no existing footage of them to build on. The film is built entirely as code: brand assets captured from a URL, synthesized or supplied music, springs-driven scenes.
- **Branch B — overlays on your own footage.** The user hands over a video of themselves (or someone) talking and wants motion graphics added on top of it — kinetic text cards, numbers called out, steps checked off — generated from what is actually said. The original footage and its own audio stay the base layer; nothing is generated from scratch, and no music/beat grid is measured — timing comes from the transcript.

Both branches share the same engine, springs, type system, critique loop and render pipeline. Only the intake, asset source, and timing source differ.

---

## Branch A — product film from scratch

### A0. Intake
Fill `brief.md` (template in `templates/`). Required inputs:
- product and URL
- duration
- formats
- brand colours and fonts (default: measured from the site)
- reference film (optional)
- music: a supplied file or `synth`
- voiceover: Fish Audio (voice) or none

If the user names a preset, apply it in step A1. `--preset <name>` looks in the project's `presets/` first, then in this skill's own `presets/` (`blank`, `lukas-yt`, plus any the user added): it fills the brand, colours, fonts, timeline defaults, voiceover and house notes. Then ask only for what it left as `?`.

Ask for every missing input in ONE AskUserQuestion round. Use a default only where the user says "your call".

### A1. Scaffold
```
sh <skill>/scripts/init.sh videos/<distinctive-slug> [--preset presets/<name>]
```
`--preset` runs `scripts/preset.mjs`. It copies the preset's fonts to `assets/fonts/`, writes its colour tokens into `film/index.html`, merges its timeline defaults and prefills `brief.md`. Start from `presets/blank/preset.jsonc`, which documents every field.
Parallel sessions may run the same brief. `init.sh` refuses an existing folder, so never write into one you didn't create. Work from the project root from here on.

### A2. Assets
```
node scripts/capture.mjs <url> --sections "Feature A,Feature B,Get started"
```
This gathers real screenshots, font files, colours, CSS variables, logos and the OG image into `assets/`. Add anything the user supplies. Point `film/index.html` `@font-face` at the real display and UI faces, and set the `:root` tokens.
If a reference film is given, extract frames and cuts:
```
ffmpeg -i ref.mp4 -vf fps=2 refs/frames/f_%03d.jpg
ffmpeg -i ref.mp4 -vf "select='gt(scene,0.3)',showinfo" -f null - 2>&1 | grep pts_time
```

### A3. Style guide
Write `docs/style_guide.md` from the template: palette (measured hex and source), type, rhythm (the reference's measured shot table), transitions, camera, texture, text in/out, and sound. Take the reference's grammar, never its content.

### A4. Beat grid
Set the bpm, duration and marks in `timeline.json`. Then:
- **Synth music:** `python3 scripts/music.py`, then `python3 scripts/beats.py audio/music.wav --stem audio/drums.wav`.
- **Supplied music:** copy it to `audio/music.wav`, then `python3 scripts/beats.py audio/music.wav`.

Then run `node scripts/sync.mjs`. Details: AUDIO.md §1.

### A5. Shotlist, then STOP for the OK
Write `docs/shotlist.md` from the template. Each shot needs beats and time, exact on-screen text, motion and transition, the SFX mark, the exact VO line, and 9:16 notes. It must satisfy the rules: hook by 2 s, something new every 2–4 s, end card ≤ 2 s.

Send the user a short summary: shotlist table, palette, fonts, music plan, VO voice, and the VO credit cost if any. **Wait for an explicit OK.** Build nothing until then. Mark the shotlist APPROVED, and reflect every change the user asks for.

### A6. Voiceover (only if requested)
Fish Audio MCP: test the tightest line on 2–3 voices, generate one take per line, download it, run `vo.py --scan`, write `vo.json`, run `vo.py`, then `sync.mjs`. Details: AUDIO.md §3.

### A7. Build with springs
Replace the starter scenes in `film/film.js`. One `C.scene()` per shot; marks and cues live in `timeline.json`. Use:
- `C.spHit` for anything with a sound
- `TYPE.rise` for type
- `C.pick` for per-format layout
- `Motion.indicator` / `track` for multi-target motion

Declare every SFX in `timeline.sfx` as you build it. After each edit, check with:
```
node scripts/render.mjs --sheet --all        # LOOK at review/sheets/*.jpg (Read the images)
node scripts/render.mjs --at 3.2,3.25 [--fmt 9x16]
node scripts/render.mjs --range 3,5
```
Verify determinism once per project: `node scripts/render.mjs --verify --all` (must report all probes identical).

### A8–A10. Critique loop, final render, deliver
Shared with Branch B — see **Critique loop**, **Final render** and **Deliver** below.

---

## Branch B — overlays on your own footage

The user's own video (and its own audio) is the base layer for the whole film — nothing is generated from scratch. Timing comes from what is actually said, not from a music beat: `timeline.json` uses `bpm: 60` with no measured grid, so `C.bt(n)` resolves `n` directly as seconds. Marks in `timeline.json` are therefore literal timestamps from the transcript, and every spring/type/indicator helper in the engine (`sp`, `spHit`, `trk`, `TYPE.rise`, …) works completely unchanged — only what the marks *mean* is different.

### B0. Intake
Ask (one round) for anything missing:
- the source video file (and its language, if not obvious)
- what the overlays are for (a reel, a course clip, a talk excerpt — affects tone, not mechanics)
- duration/formats to deliver (default: same duration as the source, 16:9 + 9:16)
- whether the source already has music/SFX under the voice that must be preserved

### B1. Transcribe
```
whisper assets/source/<file> --model medium --word_timestamps True --output_format json --output_dir transcript/
```
Use a larger model (`large-v3`) for a noisy recording or a language other than English; add `--language <code>` if auto-detect is wrong. This produces word-level timestamps — the raw material for deciding exactly when each overlay should land.

### B2. Scaffold
```
sh <skill>/scripts/init.sh videos/<distinctive-slug> --overlay
```
`--overlay` additionally copies `engine/video.js` into `film/` and wires it into `film/index.html` (loaded just before `film.js`). Copy the source video into `assets/source/`. Skip `A4`'s beat grid entirely — there is no music.mjs/beats.py step in this branch.

### B3. Overlay plan, then STOP for the OK
Read the transcript and write `docs/overlay_plan.md` from the template: one row per overlay moment, with the exact words that trigger it, the overlay type (kinetic text card, stat callout, step/checklist chip, definition chip, comparison — pick per moment, don't force every type into one video), the exact on-screen text, and which spring preset/SFX it uses. **Every on-screen word is either a verbatim quote of what's said or a deliberately shorter version of it — never an invented claim, number, or feature.** Check face-safe zones per format (a 9:16 export crops a 16:9 source tighter; flag it if the speaker's face leaves the safe crop in any requested format).

Send the user the plan as a short table. **Wait for an explicit OK.** Build nothing until then.

### B4. Build with the video as background
In `film/film.js`, right after `C.start();` (the last line), add:
```js
C.videoBG('../assets/source/<file>');
```
`C.videoBG` (from `engine/video.js`) inserts the video behind the stage, keeps it muted (the original audio is muxed back in during mix, never played twice), and transparently keeps `window.seek(t)` synchronized: it seeks the `<video>` element to `t` and waits for the browser to actually decode that frame before any overlay scene paints. No change to `render.mjs`, `core.js`, or the audio scripts is needed for this — it only activates when `C.videoBG` is called.

Build each approved overlay as its own `C.scene()`, anchored to the plan's timestamps (now literal beats, i.e. seconds) exactly as Branch A anchors to music beats. Reuse `TYPE.rise`/`TYPE.type` for text, `Motion.indicator` for progress/checklist bars, `C.spHit` for anything with a sound. The same render commands from A7 apply (`--sheet`, `--at`, `--range`, `--verify`).

### B5. Audio
There is no synthesized or supplied music track — the base track **is** the original narration:
```
ffmpeg -i assets/source/<file> -vn -ar 48000 -ac 2 -c:a pcm_s24le audio/music.wav
```
(Naming it `music.wav` is what lets the existing `mix.py` work completely unmodified — see AUDIO.md §4.) If the overlay plan calls for SFX on overlay entrances (a pop on a stat card, a click on a checklist item), declare them in `timeline.sfx` exactly as in Branch A and run `node scripts/sfx.mjs`. Skip `vo.py` — there is no separate voiceover to place; the narration is already the base track. Then `python3 scripts/mix.py`.

### B6–B8. Critique loop, final render, deliver
Shared with Branch A — see below. One addition to the critique loop for this branch: the critic must also check that every overlay's on-screen text matches what was actually said (score it under **Brand accuracy** in `reference/CRITIQUE.md`, repurposed here as "accuracy to the source" — flag any overlay that drifts from or overstates what's spoken).

---

## Critique loop: at least 3 rounds, until every score is ≥ 8
Each round:
1. `node scripts/sfx.mjs && python3 scripts/mix.py` (draft sound, so sync can be scored)
2. `node scripts/render.mjs --sheet --all && node scripts/render.mjs --draft --all`
3. `python3 scripts/review.py <N> --draft`
4. **Critic:** spawn a fresh subagent with `reference/CRITIQUE.md`, the project path and N. It LOOKS at every sheet and strip, scores the 8 criteria with evidence, and appends the round to `docs/review_log.md`.
5. Fix the 3 worst problems, verify each fix with stills or clips, and log what changed.

Stop only when the verdict is SHIP: every score ≥ 8 and at least 3 rounds done. Never show the user a film before that.

## Final render, SFX, mix, all formats
1. **Render** the primary format: `node scripts/render.mjs` (60 fps, adaptive 180° motion blur). Watch it via `review.py` on the final: `python3 scripts/review.py final`.
2. **SFX:** re-check `metrics.sync` on the final. Nudge marks or gains in `timeline.sfx`, then run `sync.mjs` and `sfx.mjs`.
3. **Mix:** `python3 scripts/mix.py`. It must reach -14 LUFS with true peak ≤ -1 dBTP and print no WARNING.
4. **All formats:** `node scripts/render.mjs --all` (or `--mux --all` if only the audio changed). Run `python3 scripts/review.py final` again and look at every `phone_*.jpg` and `safe_9x16.jpg`.

## Deliver
Report:
- `renders/<fmt>.mp4` paths, duration, loudness, and final scores (the table from `review_log.md`)
- the contact sheet
- anything knowingly left imperfect

Offer tweaks. Changes go through `timeline.json` / `film.js`, followed by `--draft` and `review.py` before any re-final.
