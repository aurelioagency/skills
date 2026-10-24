# Deterministic production runner

Run `python "<skill>/scripts/pipeline.py" STAGE --project "<absolute-project>"` from anywhere. Requires Node, FFmpeg/ffprobe, Python with numpy/scipy/soundfile/librosa/Pillow; Branch B also faster-whisper/opencv-python; matte only onnxruntime. Playwright and Chromium must be installed in the skill. Alternatively set `MOTION_REEL_NODE_MODULES` to existing node_modules. No paid API calls.

## Commands and approval gates

| Command | Work / prerequisite |
|---|---|
| `init --branch B --source <file>` | New project, unchanged edited footage |
| `init --branch B --takes <ordered-files...>` | Raw takes in explicitly supplied order |
| `init --branch A [--preset <name-or-path>]` | New product project |
| `prepare` | Local per-take transcript, proposed trim/color/cover, edge-frame sheets and local transcription of flagged opening bursts |
| `approve --gate cuts --note "<received OK>"` | Current raw proposal shown and approved |
| `join` | Approved edit + union preview; proposal stays immutable |
| `approve --gate union --note "<received OK>"` | User watched/approved joined preview |
| `transcribe` | Metadata, local transcript, voice, font, shot evidence; raw needs union OK |
| `approve --gate transcript --note "<received OK>"` | Corrected approved.json with valid timestamps |
| `assets` | Configured sites, each in its own asset folder |
| `approve --gate plan --note "<received OK>"` | Current brief and overlay plan/shotlist |
| `draft` | Audio, cached silent capture, mux, captions, QA, review images |
| `approve --gate first-look --note "<received OK>"` | Current first build shown before creative critique |
| `review` | Draft review evidence, no model call |
| `approve --gate draft --note "<received OK>"` | Latest reviewed draft approved |
| `cover` / `texts` | Optional cover and caption previews |
| `final` | Current draft OK; native render, approved zones, cover frame, QA, texts |
| `deliver` | Explicit final files, detached copies |
| `approve --gate publish --note "<received OK>"` | Video, cover, caption approved for publishing |
| `publish [--reels <mounted-folder>]` | Drive copy, keeps work, no overwrite |
| `status` | Compact state/current approval validity |

Receipts bind actual renders to inputs: changing config then approving cannot approve an old render. Never manufacture user approval notes. Show the actual substantive plan/transcript, not a template.

## pipeline.json

Init generates the config. Paths are relative to the project or absolute. Edit only needed values.

```json
{
  "version": 1,
  "branch": "B",
  "source": "assets/source/source.mp4",
  "takes": [],
  "language": "es",
  "model": "large-v3",
  "resources": [{"url": "https://example.com", "sections": ["Features"]}],
  "edits": {"color": 0.35, "keep": [], "cut": []},
  "captions": {"singleShot": true, "zones": null},
  "cover": {"input": null, "frame": 1.2, "lines": ["Setup", "*KEY WORD*", "Payoff"], "yOffset": 0},
  "caption": {"paragraph": "Approved text.", "hashtags": ["#One", "#Two", "#Three", "#Four"], "commentWord": "", "resourceName": "", "resourceUrl": ""}
}
```

- Raw: select candidate PNG in `cover.input`. Keep/cut ranges are `"1:0.8-12.3"`, one-based take index. Silence flags are evidence, never proof of a false start. Confirm semantically before removing speech; inner pauses require user OK. PREP.md covers editorial checks.
- Edge frames and isolated burst audio/text are in `manifests/take-evidence/evidence.json`. Code gathers this evidence; Opus decides whether a burst is a mistake. No long pause is automatically removed.
- `singleShot=true`: one Y across continuous footage/punch-ins. False for actual separate framings. Corrections: point `captions.zones` to `[{"start":0,"end":12.3,"marginBottom":500}]`, covering full time in 1080x1920 design coordinates. Never edit generated scaled zones; final reuses approved draft positions.
- `cover.input=null` uses a source frame. For an already finished user-supplied cover, set `cover.ready=true` with that image as input; no redraw.
- Paragraph/four hashtags need editorial judgment. Code appends fixed links/signature. For comment-for-resource CTA set `commentWord`, `resourceName` and explicitly confirmed HTTPS `resourceUrl`; no URL guessing or duplicate CTA in the paragraph.
- Optional `bed: {"track":"<file>"}` selects music. Default is the included steady library. Music is mandatory unless the user requests removal.
- Optional `transcriptInput: "<word-timestamp-json>"` imports existing timestamps; transcript review/approval still applies.
- `timeline.json` controls creative timing, formats, music/manual SFX. Auto cues live separately in `manifests/auto-cues.json` and do not mutate timeline.

## Cache and recovery

`manifests/pipeline-state.json` stores content hashes, steps, receipts and approvals. Missing/changed outputs regenerate; script changes conservatively invalidate stages. Keep state and project together. Existing ad-hoc projects retain their original workflow; no in-place automatic migration.

Rerun affected stages. Sound edits remux captured frames; film edits recapture. Caption placement rebuilds captions without scene capture. Cover/caption changes reuse the approved master. Draft-affecting changes require fresh draft/approval.

Detailed logs: `manifests/logs`; measured machine times/exit codes: `manifests/commands.jsonl` (not model tokens). On failure inspect named log, fix, rerun. A lock prevents simultaneous writers; after a crash verify its PID has stopped before removing `manifests/pipeline.lock`.

Delivery replaces only a package matching its recorded files. Outside changes stop replacement. Detached copies prevent later rebuilds from changing delivered files through hardlinks. Publishing retains cache/work; cleanup is separate.

Technical checks cannot prove pleasing animation, spelling, facial expression or semantic cuts. No-face zones, false starts, quiet voice and sync heuristics remain flagged for focused review. `technicalChecks: passed` is never creative approval.
