---
name: motion-reel
description: Produce beat-synced motion graphics made entirely in code, in one of two branches. Branch A builds a product launch reel / showreel / promo from scratch: captures a product URL's real brand assets, writes a style guide, measures a beat grid, gets a shotlist approved, then builds with springs. Branch B takes a video the user filmed of themselves talking and animates it: the resource they mention shown in motion, logos, counters, diagrams, punch-ins on the speaker and full-screen cutaways under their voice, with subtitles and nothing that merely repeats them, timed to their speech. Both branches run 3+ scored critique rounds to 8+ before delivering H.264 in 16:9, 1:1, 4:5 and 9:16. Use when the user asks for a launch video, product reel, motion reel, showreel, promo, sizzle, social ad, or wants motion-graphics overlays added to a video of themselves talking, or says "motion-reel".
---

# Motion reel

A film is a pure function of time. `window.seek(t)` paints frame t in headless Chromium, and ffmpeg encodes it. Picture and sound share one `timeline.json` in beats on a measured grid.

**Read before building:** [reference/RULES.md](reference/RULES.md) (contract, look, rhythm, motion, sound).
**Also here:** [reference/ANIMATION.md](reference/ANIMATION.md) (Branch B motion language), [reference/ENGINE.md](reference/ENGINE.md) (engine API, patterns, commands), [reference/AUDIO.md](reference/AUDIO.md) (music, grid, SFX, VO, mix), [reference/CRITIQUE.md](reference/CRITIQUE.md) (critic prompt).
**Toolchain:** node + playwright (chromium), ffmpeg, python3 with numpy, scipy, soundfile, librosa and pillow, and (Branch B only) `faster-whisper` for word-level transcription (`scripts/transcribe.py`). `init.sh` checks the first set.

## Choose the branch

- **Branch A — from scratch.** The user wants a launch reel/showreel/promo for a product or brand, and there is no existing footage of them to build on. The film is built entirely as code: brand assets captured from a URL, synthesized or supplied music, springs-driven scenes.
- **Branch B — motion graphics on your own footage.** The user hands over a video of themselves talking and wants it animated: the resource they mention shown in motion, logos, counters, diagrams, punch-ins, full-screen cutaways under their voice — plus subtitles (from the user's subtitles skill). The footage and its audio stay the base; timing comes from the transcript, no beat grid.

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

## Branch B — motion graphics on your own footage

The user's own talking-head video (and its own audio) is the base. Timing comes from what is said: `timeline.json` uses `bpm: 60` with no measured grid, so every beat/mark is a literal second of the source, and every spring/type/indicator helper works unchanged.

**What this branch is for: ANIMATION.** The user hands over the raw video and Claude does everything else. Read [reference/ANIMATION.md](reference/ANIMATION.md) (the motion language from the user's reference reels) and the Branch B rules in [reference/RULES.md](reference/RULES.md) before planning — the ones that matter most:
- **Never echo a non-key phrase the subtitles show.** A key number, name or keyword in an animation is fine; a restated sentence is not — and never as the hook ("Alguien en internet" on a card in second 0 is the canonical failure).
- **Animate the footage too**, not only on top of it: punch-ins, moves, full-screen cutaways while the voice keeps talking.
- **Never lower the quality of the deliverable**: the source is used as it comes (no conversion), and the final renders at the source's own resolution.

**Subtitles: pending.** They will come 100 % from the user's own subtitles skill (style, chunking, position), integrated at the end of this work. Until then, any subtitle rendering in this skill (`OV.subtitles`, `captions.py`) is a temporary placeholder, not the final spec — don't add subtitle rules here.

### B0. Intake
The user sends the raw video (always vertical 9:16, at its own resolution; normally already through CapCut, so the audio arrives finished). Ask only for what's missing and can't be found:
- the **resource** the video talks about, if the video names something without a findable link — usually something someone else made (a site, a tool, a repo, a doc). It is the main asset source.
- new **reference reels** (.mp4), only if the user offers them (`references/` in the project).

Don't ask for formats (always 9:16), duration (the source's), a brand kit, colours or a logo: the look comes from the resource and the reference reels, not from the user's brand, unless the user asks for it.

### B1. Scaffold, source, transcript
```
sh <skill>/scripts/init.sh videos/<distinctive-slug> --overlay
cp <source> assets/source/                     # as it comes — never re-encoded, never downscaled
ffprobe -v error -show_entries stream=width,height:stream_side_data=rotation -of csv=p=0 assets/source/<file>
python3 scripts/transcribe.py assets/source/<file> --lang es
```
- `--overlay` sets Branch B defaults in `timeline.json` (bpm 60, 9x16, narration base, **SFX at -14 dB**), copies `engine/video.js` + `engine/overlay.js` (the `OV` kit: `settleOn`, `slide`, `putSlide`, `OV.bg`), the Branch B starter `film.js` and `transcribe.py`.
- **Deliverable resolution = the source's.** The film is laid out at 1080x1920; set `timeline.scale` to the source's width / 1080 (2 for a 2160x3840 phone 4K) and the final render captures at that size. Drafts, sheets and stills stay at 1080 for speed — they are never delivered.
- Point `C.videoBG` at the source file itself. Only if headless Chromium cannot decode it (e.g. HEVC) make an internal visually-lossless H.264 copy **at the same resolution** for rendering — tell the user, and never deliver anything below the source's resolution.
- The narration is the base track: `ffmpeg -i assets/source/<file> -vn -ar 48000 -ac 2 -c:a pcm_s24le audio/music.wav`. `mix.py` keeps it at its own level; if it warns that the source is quiet, tell the user — probably the raw phone take that skipped CapCut.

### B2. Assets and references
- Resource: `node scripts/capture.mjs <url>` (screenshots incl. the full page for scroll-throughs, logos, fonts, colours). Logos of tools the user names: from their own sites.
- Reference reels: extract the grammar (never the content) into `docs/style_guide.md` — shot types and how often each appears, transition types, motion speed, text treatment, where graphics sit, and every SFX with its timing and level relative to the voice:
```
ffmpeg -i references/ref.mp4 -vf fps=4 refs/frames/f_%03d.jpg
ffmpeg -i references/ref.mp4 -vf "select='gt(scene,0.3)',showinfo" -f null - 2>&1 | grep pts_time
```
- SFX the user wants from a reference: cut moments where the sound is isolated into `assets/sfx/`, or identify the library it comes from; use them via `"file"` in `timeline.sfx` (AUDIO.md §2).

### B3. Animation plan, then STOP for the OK
Write `docs/overlay_plan.md` from the template. **First propose the layout(s)** — over the footage (e.g. a floating browser window), split, full-screen cutaways, or a mix — with a one-line why, and let the user choose (ANIMATION.md §2). Then one row per moment with the trigger words, the **shot type** (RULES.md Branch B), **what the viewer SEES that the subtitle doesn't say**, any on-screen text (key data only), motion and SFX. A row whose answer to "what does it add" is nothing gets cut. Check face-safe zones and the 9:16 UI zones.

Send the user the plan as a short table. **Wait for an explicit OK.** Build nothing until then.

### B4. Build
Start from the starter `film/film.js`: scenes per plan row, the subtitles placeholder, `C.start()`, then `C.videoBG('../assets/source/<file>')`. Build with the `OV` kit (ANIMATION.md §3, header of `engine/overlay.js`) — declare in each scene's `build()`:
- entrances: `OV.slam`, `OV.cutIn`, `OV.pop`, `OV.draw`, `OV.typeOn`, `OV.odometer`, `OV.cursor` (each lands ON its cue and registers its sound)
- the frame: `OV.layout([[t,'full'|'split'|'gone'], …], { face })`, snap zooms `OV.punch([[t, scale], …])`
- full-screen cutaway: `'gone'` + a scene with an opaque full-frame background; the voice keeps playing
- exits: `out:` (hard cut) or `outKind: 'drop'`
- type over bright footage sits on a panel, never bare
Render checks as in A7 (`--sheet`, `--at`, `--range`, `--verify`).

### B5. Audio
`node scripts/autosfx.mjs` writes the kit's cues into `timeline.sfx` (house sounds: words/screens → `clic_palabra_loucash`, icons → `bubble`, cursor → `click`, typing/counters → `tick`); hand-written entries are kept. Then `node scripts/sync.mjs && node scripts/sfx.mjs && python3 scripts/mix.py`. SFX sit well under the voice (`mix.sfx` -14 dB default; primary hits gain ≤ 0.5). Thumps/low hits on a spoken word mask it: keep them ≤ 0.1 or skip them. The voice is never re-processed or re-levelled. House sounds: AUDIO.md §2.

### B6–B8. Critique loop, final render, deliver
Shared with Branch A — see below, with the Branch B criteria in `reference/CRITIQUE.md` (redundancy with the subtitles, animation-first, accuracy to the source).

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
