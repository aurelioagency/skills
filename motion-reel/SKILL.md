---
name: motion-reel
description: Produce beat-synced motion graphics made entirely in code, in one of two branches. Branch A builds a product launch reel / showreel / promo from scratch: captures a product URL's real brand assets, writes a style guide, measures a beat grid, gets a shotlist approved, then builds with springs. Branch B takes a video the user filmed of themselves talking and animates it: the resource they mention shown in motion, logos, counters, diagrams, punch-ins on the speaker and full-screen cutaways under their voice, with subtitles and nothing that merely repeats them, timed to their speech. The user sees the first build as a draft right away; once they OK what the animation looks like, up to 3 scored critique rounds polish it before delivering H.264 in 16:9, 1:1, 4:5 and 9:16. Use when the user asks for a launch video, product reel, motion reel, showreel, promo, sizzle, social ad, or wants motion-graphics overlays added to a video of themselves talking, or says "motion-reel".
---

# Motion reel

A film is a pure function of time. `window.seek(t)` paints frame t in headless Chromium, and ffmpeg encodes it. Picture and sound share one `timeline.json` in beats on a measured grid.

**Read before building:** [reference/RULES.md](reference/RULES.md) (contract, look, rhythm, motion, sound).
**Also here:** [reference/ANIMATION.md](reference/ANIMATION.md) (Branch B motion language), [reference/SUBTITLES.md](reference/SUBTITLES.md) and [reference/COVER.md](reference/COVER.md) (Branch B subtitles and cover, same as social-video-producer), [reference/DELIVERY.md](reference/DELIVERY.md) (Branch B caption, DM reply, delivery folder and Drive, same as social-video-producer), [reference/ENGINE.md](reference/ENGINE.md) (engine API, patterns, commands), [reference/AUDIO.md](reference/AUDIO.md) (music, grid, SFX, VO, mix), [reference/CRITIQUE.md](reference/CRITIQUE.md) (critic prompt).
**Toolchain:** node + playwright (chromium), ffmpeg, python3 with numpy, scipy, soundfile, librosa and pillow, and (Branch B only) `faster-whisper` and `opencv-python` for transcription and subtitles (`scripts/transcribe-media.mjs`, `scripts/detect-shots.py`), plus `onnxruntime` for the person matte (`scripts/matte.py`). `init.sh` checks the first set.

## Choose the branch

- **Branch A — from scratch.** The user wants a launch reel/showreel/promo for a product or brand, and there is no existing footage of them to build on. The film is built entirely as code: brand assets captured from a URL, synthesized or supplied music, springs-driven scenes.
- **Branch B — motion graphics on your own footage.** The user hands over a video of themselves talking and wants it animated: the resource they mention shown in motion, logos, counters, diagrams, punch-ins, full-screen cutaways under their voice — plus subtitles, identical to social-video-producer's. The footage and its audio stay the base; timing comes from the transcript, no beat grid.

Both branches share the same engine, springs, type system, critique loop and render pipeline. Only the way the video is built differs (intake, asset source, timing source); everything around it is the same for both.

**Project folders, names and delivery: the same for both branches, identical to social-video-producer's.** Every rule and both scripts live in [reference/DELIVERY.md](reference/DELIVERY.md):
- every project lives at `<Documents>\motion-reel\.work\<slug>\` and its delivery folder at `<Documents>\motion-reel\<slug>\`, split into `source\` + `output\`, with a slug that says what the video is about;
- the post description `caption-<slug>.txt`, plus `dm-reply-<slug>.txt` when the caption asks to comment a word for the resource;
- `deliver-package.mjs` builds the delivery folder; only after the user approves, `publish-to-drive.mjs` copies it to the Aurelio **Reels** shared drive and deletes the `.work\<slug>\` project.

Follow DELIVERY.md to the letter; when it changes in one skill, change it in the other.

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
sh <skill>/scripts/init.sh <Documents>/motion-reel/.work/<distinctive-slug> [--preset presets/<name>]   # layout and slug rules: DELIVERY.md
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
- **Never lower the quality of the deliverable**: an edited source is used as it comes; raw takes go through ONE visually-lossless encode at their own resolution (B0b); the final renders at the source's own resolution.

**Subtitles: always on, and identical to social-video-producer's.** Every rule and script lives in [reference/SUBTITLES.md](reference/SUBTITLES.md) (a copy of that skill's burn-in captions branch): transcript approval gate, Neue Montreal Bold 104px all white one word at a time, per-shot zones below the face, libass burn. The film never draws subtitles; they are burned onto the final render as the last step (S4–S8), so they follow the face as the film frames it. Follow SUBTITLES.md to the letter; when it changes in one skill, change it in the other.

**Cover: always, identical to social-video-producer's.** Every rule lives in [reference/COVER.md](reference/COVER.md): a frame of the source with the three-line headline (Neue Montreal Bold, white style, `--small-size 68 --big-size 166`, never `--fit`), delivered as `<slug>-portada.png` AND burned into the video as its frame 0. Not optional and not something to ask about.

### B0. Intake
The user sends either **raw phone takes** (one or several, straight from the phone: silence at the head and tail, no colour or volume work — the normal case from 2026-10-20, so nothing goes through CapCut any more) → B0b first; or an **already edited video** (through CapCut, audio finished) → straight to B1. Always vertical 9:16, at its own resolution. Ask only for what's missing and can't be found:
- the **resource** the video talks about, if the video names something without a findable link — usually something someone else made (a site, a tool, a repo, a doc). It is the main asset source.
- new **reference reels** (.mp4), only if the user offers them (`references/` in the project).

Don't ask for formats (always 9:16), duration (the source's), a brand kit, colours or a logo: the look comes from the resource and the reference reels, not from the user's brand, unless the user asks for it.

**Resources come from the user (user, 2026-10-20).** The material shown is what the resource itself has (its repo, its site, its images, its UI); the user hands it over, or Claude asks for it. When Claude finds something the user did not hand over (the tool's own website, a better image on it), it says so in the plan ("encontré su web, reverseapi.dev, y uso su imagen de portada") instead of slipping it in silently. There is no fixed recipe of what to show first: use what the resource has.

### B0b. Pre-edit the raw takes (replaces CapCut)
After `init.sh` (B1's first line), with the takes in their real order. **The order comes from the file names when they are ordered or descriptive** (`rae1`, `rae2`, `rae3`; `01-gancho`, `02-cuerpo`), not from the order they were pasted in the message (the user pasted `rae3 rae2 rae1` on 2026-10-20 and the names were right). When the names say nothing, work the order out from the video itself: the take that opens with the hook goes first, the one with the CTA ("seguime, comentá…") goes last, the rest by what the speech builds on. Never ask the user for the order:
```
python <skill>/scripts/prep-takes.py plan --takes <take1> <take2> ...
```
It transcribes each take, keeps from the first word to the last (head and tail silence out, with a small margin), measures light and colour, and finds the cover candidates. What the user agreed (2026-10-20):
- **False starts get cut, well, without asking (user, 2026-10-20).** A take can open with a false start: the user says a few words, stops, says something to whoever films ("vamos de vuelta") and starts again. **The transcript hides it**: Whisper merges the repeated opening into one and drops the aside, so it never shows up as text (on 2026-10-20 it stretched one word over 3 s instead). Find it in the audio: run `ffmpeg -af silencedetect=n=-40dB:d=0.15` on the head of every take, and when there are speech bursts before the first long-ish silence (> 0.6 s), transcribe each burst on its own (cut it out with `-ss/-to`; faster-whisper with `vad_filter=False`, `condition_on_previous_text=False`). A repeated opening or an aside to the camera person means everything before the good start goes (`build --keep <take>:<start>-<end>`, ~0.2 s margin before the good first word). Analyse before cutting: cut what is a mistake, never cut for the sake of cutting. Nothing extra to show the user about it: the joined video of gate 2 is the check. A long pause INSIDE the speech (> 1.2 s, listed by the plan) is still cut only after asking (`build --cut <take>:<start>-<end>`).
- **Colour and light:** an automatic levels correction (exposure, contrast, white balance; it also evens out takes shot in different light) at **35 %** by default — the user sets CapCut's auto adjust to 30–40 %, never its suggested 80 %. Show `snapshots/color-before-after.png`; the user may ask for more or less (`build --color 0.25`).
- **Voice level:** `build` brings the joined voice to **-21.5 LUFS** (true peak ≤ -1 dBTP): the level the user got from +15 dB in CapCut, the level of the approved reels.
- **Cover frame:** the user stands still for a few seconds "posing", usually at the start of the first take or the end of the last — inside the silence that gets trimmed, so the candidates come from the raw takes. Look at `snapshots/cover-candidates.png` and pick the sharpest frame looking at camera, with a smile — usually without teeth, with teeth is fine too. The chosen `assets/source/cover-candidate-<n>.png` is the BASE PHOTO for COVER.md (`build-cover.mjs --input <that png> --frame 0`).
- **HDR takes:** the plan stops; ask the user to turn off Settings → Camera → Record Video → HDR Video. HEVC (the iPhone's "High Efficiency") is fine: the build re-encodes to H.264 anyway, in a couple of minutes.

- **Look at every take's start and end before showing the cuts.** The first word's timestamp is not where the take really starts: before speaking the user often settles in (adjusts, makes a face, takes a breath with the mouth open), and that moment must go too. Check frames across the second before each take's first word and after its last; if the speaker is still settling, move the keep range (`build --keep <take>:<start>-<end>`) so the take opens on a still face that starts talking.

**Everything the user approves is in the message body (user, 2026-10-20).** At every gate (cuts, transcript, plan, draft, cover, caption) the thing to approve is written or attached in the message itself, before the question: the full transcript as text, the plan as a table, the caption as a text block, the image or the video sent. Never ask to approve something the message only refers to ("arriba están el texto y el gancho") or that sits only in a file or in the question box.

**Gate 1** (blocking): show the user, in one message, the cut list (per take: kept range, seconds trimmed, any long inner pause to ask about), the colour before/after image and the cover candidate you picked (plus the sheet with the other two). On the OK:
```
python <skill>/scripts/prep-takes.py build [--color 0.35] [--cut 2:14.2-16.8] [--keep 2:1.60-15.34]
```
→ `assets/source/<slug>-edit.mp4`: one H.264 file at the takes' own resolution, colour-corrected, voice levelled, seekable by Chromium (no render copy needed), plus `review/union-preview.mp4`, a light copy (1080 wide, well under 30 MB) of the same joined video.

**Gate 2: the user watches the joined video** (blocking, never skipped): send `review/union-preview.mp4` with the cut list again and **wait for an explicit OK on the join and the cuts**. The cut list on paper is not enough: only the video shows a face being made, a bad start or a jump at the join (user, 2026-10-20: "si no me pasás el video unido y recortado, yo no puedo aprobarte para que continúes"). An OK to the colour or to the cover at gate 1 is not an OK to the cuts. Nothing of B1 (transcription included) starts before this OK; every correction rebuilds and sends the preview again. Only then is `<slug>-edit.mp4` the source from here on: B1 continues on it (skip the `cp`). The raw takes stay in `.work` and never ship.

### B1. Scaffold, source, transcript
```
sh <skill>/scripts/init.sh <Documents>/motion-reel/.work/<distinctive-slug> --overlay   # layout and slug rules: DELIVERY.md
cp <source> assets/source/                     # as it comes — never re-encoded, never downscaled
ffprobe -v error -show_entries stream=width,height:stream_side_data=rotation -of csv=p=0 assets/source/<file>
node <skill>/scripts/transcribe-media.mjs --input assets/source/<file> --out-audio transcript/voice16k.wav --out-transcript transcript/transcript.json --language es
```
- **Transcript Approval Gate (blocking):** SUBTITLES.md S2. Show the corrected transcript with hook, CTA and shots, wait for the OK, write `transcript/approved.json`. Everything after this (animation marks and subtitles) reads the approved transcript. Then freeze the caption font (S3).
- `--overlay` sets Branch B defaults in `timeline.json` (bpm 60, 9x16, narration base, **SFX at -3 dB**, AUDIO.md §2b), copies `engine/video.js` + `engine/overlay.js` (the `OV` kit: `settleOn`, `slide`, `putSlide`, `OV.bg`) and the Branch B starter `film.js`. The transcription and subtitle scripts run from the skill folder.
- **Deliverable resolution = the source's.** The film is laid out at 1080x1920; set `timeline.scale` to the source's width / 1080 (2 for a 2160x3840 phone 4K) and the final render captures at that size. Drafts, sheets and stills stay at 1080 for speed — they are never delivered.
- Point `C.videoBG` at the source file itself (after B0b, the `-edit.mp4`). Only if headless Chromium cannot decode it (e.g. an edited HEVC video) make an internal visually-lossless H.264 copy **at the same resolution** for rendering (a couple of minutes, fine with the user), and never deliver anything below the source's resolution.
- The narration is the base track: `ffmpeg -i assets/source/<file> -vn -ar 48000 -ac 2 -c:a pcm_s24le audio/music.wav`. `mix.py` keeps it at its own level (B0b already levelled raw takes to -21.5 LUFS); if it warns that the source is quiet, tell the user — an edited video whose voice was not raised.

### B2. Assets and references
- Resource: `node scripts/capture.mjs <url>` (screenshots incl. the full page for scroll-throughs, logos, fonts, colours). Logos of tools the user names: from their own sites.
- Reference reels: extract the grammar (never the content) into `docs/style_guide.md` — shot types and how often each appears, transition types, motion speed, text treatment, where graphics sit, and every SFX with its timing and level relative to the voice:
```
ffmpeg -i references/ref.mp4 -vf fps=4 refs/frames/f_%03d.jpg
ffmpeg -i references/ref.mp4 -vf "select='gt(scene,0.3)',showinfo" -f null - 2>&1 | grep pts_time
```
- SFX the user wants from a reference: cut moments where the sound is isolated into `assets/sfx/`, or identify the library it comes from; use them via `"file"` in `timeline.sfx` (AUDIO.md §2).

### B3. Animation plan, then STOP for the OK
Write `docs/overlay_plan.md` from the template. **First propose the layout(s)** — over the footage (e.g. a floating browser window), split, full-screen cutaways, or a mix — with a one-line why, and let the user choose (ANIMATION.md §2). Then one row per moment with the trigger words, the **shot type** (RULES.md Branch B), **what the viewer SEES that the subtitle doesn't say**, any on-screen text (key data only), motion and SFX. A row whose answer to "what does it add" is nothing gets cut. Check face-safe zones, the 9:16 UI zones, and keep the subtitle band (just under the chin, in every framing) free of graphics (SUBTITLES.md).

**Name the slams and impacts in the plan (user, 2026-10-20).** The slam (`OV.slam`: something falls in big and lands in 0.1 s) and the impact (`OV.impact` / the slam's own jolt: the whole frame shakes for 2–4 frames) are what grab attention most, so the user wants to see them in writing before approving. Every row says its entrance by name, and every row with a slam or an impact says so explicitly, with the word it lands on ("slam + impact en 'API'"); never hide them behind a vague "cae" or "aparece". The table sent to the user carries a "Slam / impact" column, and a line under it lists every slam and impact of the film with its second.

Send the user the plan as a short table. **Wait for an explicit OK.** Build nothing until then.

### B4. Build
Start from the starter `film/film.js`: scenes per plan row (no subtitles in the film), `C.start()`, then `C.videoBG('../assets/source/<file>')`. Build with the `OV` kit (ANIMATION.md §3, header of `engine/overlay.js`) — declare in each scene's `build()`:
- entrances: `OV.slam`, `OV.cutIn`, `OV.pop`, `OV.draw`, `OV.typeOn`, `OV.odometer`, `OV.cursor` (each lands ON its cue and registers its sound)
- the frame: `OV.layout([[t,'full'|'split'|'gone'], …], { face })`, snap zooms `OV.punch([[t, scale], …])`
- behind the speaker, only where a graphic does not fit above the head: `python <skill>/scripts/matte.py` + `C.videoBG(src, { matte })` + `scene({ behind: true })` (ANIMATION.md §2b)
- full-screen cutaway: `'gone'` + a scene with an opaque full-frame background; the voice keeps playing
- exits: `out:` (hard cut) or `outKind: 'drop'`
- type over bright footage sits on a panel, never bare
Render checks as in A7 (`--sheet`, `--at`, `--range`, `--verify`).

### B5. Audio
`node scripts/autosfx.mjs` writes the kit's cues into `timeline.sfx` (house sounds: words/screens → `clic_palabra_loucash`, icons → `bubble`, cursor → `click`, typing/counters → `tick`); hand-written entries are kept. Then `node scripts/sync.mjs && node scripts/sfx.mjs && python3 scripts/bed.py && python3 scripts/mix.py`.

**Background music is mandatory (user, 2026-10-20: "no es algo que pueda faltar, tiene que estar siempre").** `python3 scripts/bed.py` lays a steady track from the skill's library 34 dB under the narration (`audio/bed.wav`, AUDIO.md §2b) and `mix.py` adds it. It runs BEFORE the first draft the user sees, so every draft already carries the music and the user judges the whole sound (voice, SFX and music) on the draft, never for the first time on the final. Before sending any draft, check that `mix.py` lists `bed` among its inputs. Only the user can ask for a video without music.

 SFX sit well under the voice (`mix.sfx` -14 dB default; primary hits gain ≤ 0.5). Thumps/low hits on a spoken word mask it: keep them ≤ 0.1 or skip them. The voice is never re-processed or re-levelled. House sounds: AUDIO.md §2.

### B6–B8. Critique loop, final render, deliver
Shared with Branch A — see below, with the Branch B criteria in `reference/CRITIQUE.md` (redundancy with the subtitles, animation-first, accuracy to the source). Every draft the USER sees carries the subtitles (SUBTITLES.md S-draft); the critic judges redundancy against `transcript/approved.json`.

Branch B differs at the end: after the rounds the user watches the subtitled draft and approves it (**User review of the draft**, below); only then the final render is the clean master (`node scripts/render.mjs --crf 10`, only the 9x16 format), then the subtitles are burned onto it (SUBTITLES.md S4–S8), then the cover is built and burned in as frame 0 (COVER.md). The deliverables are `renders/final/<slug>-final.mp4` and `renders/final/<slug>-portada.png`. If the mix changes later, `--mux` the master, burn the subtitles again and re-add frame 0.

---

## First look: the user sees the first build before any critique round (blocking)
As soon as every scene of the approved plan/shotlist is built, and before round 1: `node scripts/sfx.mjs && python3 scripts/bed.py && python3 scripts/mix.py && node scripts/render.mjs --draft --all` (Branch B: the background music is in the draft, B5), burn the subtitles on it in Branch B (SUBTITLES.md S-draft), and send the user the draft, saying it is the unpolished first build (it may have errors). The plan was text; this is the first time the user sees how the animations appear and what is on screen, and their comments now are cheaper than after the rounds.
- **Wait for the user's comments or an explicit go-ahead.** Apply the comments and send a new draft each time; iterate on the draft with the user until they OK how the animation looks. Only then start the critique loop. If a correction is about one moment, send just that frame or a few seconds of it instead of a full draft (cheaper and faster).
- The rounds polish what the user already saw and approved; they never change it. Three rounds of polishing on something the user then rejects is the waste this order exists to prevent (user, 2026-10-19).

## Critique loop: after the user's OK on the first look, up to 3 rounds
Each round:
1. `node scripts/sfx.mjs && python3 scripts/mix.py` (draft sound, so sync can be scored; Branch B: `audio/bed.wav` from B5 must already exist, so the mix keeps the music)
2. `node scripts/render.mjs --sheet --all && node scripts/render.mjs --draft --all`
3. `python3 scripts/review.py <N> --draft`
4. **Critic:** spawn a fresh subagent with `reference/CRITIQUE.md`, the project path and N. It LOOKS at every sheet and strip, scores the 8 criteria with evidence, and appends the round to `docs/review_log.md`.
5. Fix the 3 worst problems, verify each fix with stills or clips, and log what changed.

Stop when the verdict is SHIP (every score ≥ 8) or after 3 rounds, whichever comes first; report any score still under 8. A round only fixes problems inside what the user approved (blank frames, legibility, sync, levels, finish): a fix that would change an approved animation goes to the user as a question instead.

## User review of the draft (blocking)
After the rounds, send the user the latest draft with its subtitles (SUBTITLES.md S-draft; low quality, under 30 MB so it reaches their phone). An approved plan is only text: whether the animations work is decided by seeing them, so the user reviews the draft before anything final.
- **Wait for the user's corrections or an explicit OK on the draft.** Sending the draft is not an approval, and neither is silence or an OK given earlier to the plan.
- Apply each correction, re-render the draft (`--draft`, plus stills of the moments touched) and send it again. Repeat until the user OKs the draft.
- Only that explicit OK starts the final render (and, in Branch B, the subtitles and the cover).

## Final render, SFX, mix, all formats
**Times are measured, never guessed (user, 2026-10-20: "no mientas").** Never give the user a time estimate that was not measured; time every step (`date` before and after) and report the real number. Measured on 2026-10-20 (30.6 s reel, 4K source, 11 scenes): first draft from the approved plan to the subtitled draft sent **6 min**; every corrected draft **4–6 min** (the draft render is ~3.7 min of it); the 4K final master (`--crf 10`, 60 fps, 1836 frames) **42 min** (~1.4 s per frame), plus ~5 min for the subtitle burn and frame 0. Scale by duration and say it is an estimate from that measurement.

**A final costs ~40 min at 4K for a 30 s reel: it never starts untested.** Run `node scripts/render.mjs --preflight` first (seconds): it renders final-size frames and stops unless they are exactly W×H with the whole frame drawn. The final render runs the same check itself and aborts on its first frame if a capture comes back the wrong size. Any change to `render.mjs`, the capture, `film/video.js` or `timeline.scale` is tested with `--preflight` (and a final-scale clip when the change is in the capture) before a full final; never launch a full final to find out whether a fix works.
1. **Render** the primary format: `node scripts/render.mjs` (60 fps, adaptive 180° motion blur). Watch it via `review.py` on the final: `python3 scripts/review.py final`.
2. **SFX:** re-check `metrics.sync` on the final. Nudge marks or gains in `timeline.sfx`, then run `sync.mjs` and `sfx.mjs`.
3. **Mix:** `python3 scripts/mix.py`. It must reach -14 LUFS with true peak ≤ -1 dBTP and print no WARNING.
4. **All formats:** `node scripts/render.mjs --all` (or `--mux --all` if only the audio changed). Run `python3 scripts/review.py final` again and look at every `phone_*.jpg` and `safe_9x16.jpg`.

## Deliver
Both branches end the same way, as in social-video-producer (DELIVERY.md):
1. Put in `renders/final/` exactly the video(s) that ship, and nothing else: in Branch B the 9x16 with subtitles and frame 0, plus `<slug>-portada.png`; in Branch A the final `renders/<fmt>.mp4` of each format, renamed `<slug>-<fmt>.mp4`.
2. Write `renders/final/caption-<slug>.txt` and, when it carries the comment-for-DM line, `renders/final/dm-reply-<slug>.txt`.
3. `node <skill>/scripts/deliver-package.mjs --project "<project>"` and hand over the delivery folder, plus: duration, loudness, the final scores (the table from `review_log.md`), the contact sheet, and anything knowingly left imperfect.
4. Only after the user's explicit approval of the video, cover and caption: `node <skill>/scripts/publish-to-drive.mjs --project "<project>"`.

Changes before approval go through `timeline.json` / `film.js`, followed by `--draft` and `review.py` before any re-final, and then `deliver-package.mjs --overwrite`.
