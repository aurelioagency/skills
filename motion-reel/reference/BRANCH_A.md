# Branch A intake and creative details

Use the commands in PIPELINE.md for the normal workflow. This reference preserves the creative contract and specialist commands; do not rerun work already performed by the pipeline. Read AUDIO.md only for custom music/voiceover work.

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

