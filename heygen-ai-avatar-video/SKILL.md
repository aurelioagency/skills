---
name: heygen-ai-avatar-video
description: HeyGen AI avatar video operator for script-to-video and repair workflows. Use for modular videos built from a script with ElevenLabs audio/captions, HeyGen avatar/lip-sync intros or outros, HyperFrames animated middle sections, segment rendering/assembly, paid HeyGen asset freezing, direct-audio HeyGen runs, source-video voice conversion, caption creation, or verification/repair. Do not use for Floyo/Wan Animate.
---

# HeyGen AI Avatar Video

Operate HeyGen avatar video jobs end to end. Default to a modular segment-first pipeline for script-driven videos: generate and freeze avatar sections, render shared animation sections separately, then assemble final variants without recapturing unchanged segments.

Video Cutter Lab is an optional local dependency used for direct runs. Locate its root on the current machine first (referred to below as `<video-cutter-lab-root>`). If it does not exist on this machine, report it as an optional dependency to install or locate; never assume a fixed absolute path from another user or machine.

For every video-editing, caption, animation, spacing, or render decision, first read and obey:

[`references/video-production-guidelines.md`](references/video-production-guidelines.md)

Completion means the run has final MP4 output, segment outputs, audio, transcripts/captions, manifests, frozen paid HeyGen assets, and verification metadata, or a specific provider/caption/render failure is reported with the artifact paths that exist.

## Choose The Branch

- Use **script-to-video modular** when the user provides a script, skill file, multiple hooks/openings, a shared animated middle, or a shared outro. This is the default for new edited videos.
- Use **direct HeyGen avatar** when the user provides a final MP3/M4A/WAV and wants one avatar/lip-sync output.
- Use **source-video conversion** only when the source video's audio must first be converted before HeyGen.
- Use **repair** when the user reports bad pronunciation, wrong captions, a frozen rendered frame, desync, overflow, wrong title text, or a bad segment. Repair the smallest segment possible.

Do not submit paid HeyGen work until the audio text, encoding, and segment plan are verified.

Hard branch rule: a script path is not a final audio file. For script-driven work, never collapse the script into a full paid HeyGen avatar run unless the user explicitly asks for a direct full-avatar video and accepts the paid provider usage. The default deliverable is intro avatar + animated middle + outro avatar assembled locally.

## Project Layout

Keep each script/video job in one global project folder under the active user's documents folder, `<Documents>\videos\` (derive it from the current environment), unless the user gives another path. Never default to an absolute path from another user or machine.

```text
videos\<script-slug>\
  source\
    script.md
    build-composition.mjs
  manifests\
    project.json
    segments.json
    audio-request.json
    audio-meta.json
    paid-assets.json
    heygen-jobs.json
    assemble.json
    audits\
  assets\
    voice\
    avatar\
    logos\
    music\
  public\
  renders\
    segments\
    final\
  snapshots\
```

Create the folder with the bundled initializer before generating media:

```powershell
node "<skill-dir>\scripts\init-project.mjs" --project "<project>" --script "<source-script.md>" --avatar-id "<heygen-avatar-id>" --voice-id "<elevenlabs-voice-id>"
```

Keep this output contract:

- `source\script.md` is the only in-project script copy. If the user provided an external script path, record that original path in `manifests\project.json`; do not create root `script.md`, `assets\source\`, or another script copy.
- `source\build-composition.mjs` is the authored composition generator. Do not create a root `build-composition.mjs` for new projects; root generators are legacy-only.
- `manifests\project.json` is the job-level index: source script path, avatar id, voice id, and final status. Do not duplicate the fixed folder contract inside it.
- `manifests\segments.json` is the segment registry: ids, kind, source text, audio path, avatar path, render path, dirty state, and repair notes.
- `manifests\audio-request.json` is the exact ElevenLabs request plan; `manifests\audio-meta.json` records generated audio durations and transcripts.
- `manifests\heygen-jobs.json` is the provider queue for concurrent avatar generation: ready/submitted/processing/frozen jobs, request fingerprints, lease/claim metadata, and remote ids.
- `manifests\paid-assets.json` records completed and frozen paid provider outputs; never rely only on provider dashboards or scattered run folders.
- `manifests\assemble.json` is the only final assembly manifest. It also records final post-processing such as `speed: 1.07` and `backgroundMusic` path/source/license/attribution.
- `manifests\audits\` contains read-only gate reports such as `plan-audit.json`, animation QA notes, and final verification summaries.
- `assets\voice\` and `assets\avatar\` are canonical reusable media assets.
- `assets\music\` contains frozen background music selected for the project. Do not hotlink music during final assembly.
- `public\` is the active browser composition used by HyperFrames/Playwright. Do not mirror voice files into `public\`. Browser composition code in `public\index.html` must reference canonical project assets with paths such as `../assets/voice/<segment-id>.wav` or the `browserSrc` value in `manifests\audio-meta.json`.
- `renders\segments\` contains reusable segment MP4s. `renders\final\` contains user-deliverable final MP4s.
- `snapshots\` contains QA screenshots and overflow/layout reports.
- `raws\` (optional, user-supplied-media jobs) contains the user's original source files for this video, copied verbatim during User Asset Intake. Create it with a plain mkdir when needed; never modify, rename, or delete anything inside it.

Do not create a project-local `tools\` folder for normal runs. Reuse this skill's bundled `scripts\`. If a one-off local tool is unavoidable for a legacy repair, keep it temporary and promote repeated behavior back into the skill.

## User Asset Intake

When the user must supply existing media (opening clips, body audio, outro, script) and has not given explicit paths, never fail or stall on missing placeholders. Collect the assets this way:

1. Ask only where the project should live (default `<Documents>\videos\<video-name>\`). Create the full project structure immediately, plus a `raws\` folder in the project root for the user's original files.
2. Tell the user: "drop this video's files into `<project>\raws\` and tell me when they are ready". Suggest descriptive file names aligned with the segments (`intro`/`opening`, `body`, `outro`, `script`) — helpful but never required.
3. Accept the two alternatives without friction: files dragged into the chat, or "they are in folder X". In both cases copy the originals into `<project>\raws\` yourself, so every project ends up self-contained: originals in `raws\`, deliverables in `renders\final\`.
4. Inventory `raws\` with ffprobe: duration, video/audio streams, resolution. Classify candidates (opening1..openingN, body audio, outro, script/notes) by file name first, probed metadata second (short video+audio clips are opening/outro candidates; a long audio-only file is the body).
5. **Intake mapping gate (blocking):** present the proposed file-to-segment mapping as a readable table — including any `raws\` files left unused — and wait for the user's confirmation or corrections before going further.
6. After confirmation, copy the selected files into the canonical layout (`assets\avatar\`, `assets\voice\`, `source\`) and record each original path in `manifests\project.json`. Never modify, rename, or delete the files in `raws\` or the user's sources outside the project.
7. When delivering, always report the exact final MP4 paths under `renders\final\` so the user never has to search for them.

Minimize generated folders. If Video Cutter Lab or a provider creates a separate run directory, freeze the useful output back into this project root and record it in the manifest. Do not leave required assets only in scattered provider folders.

## Script-To-Video Modular Workflow

### Creative Proposal Gate (blocking, requires the user)

Before building the body animation or any composite — and before generating any media or render — present a concrete creative proposal to the user and wait for explicit approval or modification requests:

- Color palette (exact hex values).
- Style and timing of transitions between acts/scenes.
- Caption animations (reveal effect, colors, typography, size).
- Effects on avatar clips (zoom, punch-in, etc.).
- End card / CTA: text, position, animation.
- Body act structure with the duration of each act.

Present it visually/schematically when possible (HTML mockup, snapshot, or structured description). Iterate with the user until explicit approval. Goal: the video comes out right on the first render, not after several costly correction cycles.

1. Parse the script.

- Split the script into explicit segment ids: `opening1`, `opening2`, `opening3`, shared `body*` sections, and shared `outro`.
- Default segment architecture is `opening*` avatar intro, `body*`/`middle` local HyperFrames animation, and `outro` avatar. Mirror this architecture from prior projects; do not copy only the selected opening variant.
- Keep display text separate from `ttsText` when SSML breaks or pronunciation-safe wording is needed.
- Do not use Markdown headings, file names, hook labels, metadata, or planning notes as visible captions or animation titles.
- Never invent a composite paid segment such as `opening3_full`, `full`, `whole`, `combined`, `deliverable-avatar-segment`, or any segment that joins opening + body + outro for HeyGen.
- Write/update `manifests\audio-request.json` and `manifests\segments.json` before generating media.

2. Generate and QA ElevenLabs audio.

- Inspect the exact UTF-8 payload that will be sent to ElevenLabs with Node or Python. Block on mojibake or replacement characters. Do not trust PowerShell display output for accented Spanish.
- Use short punctuation or SSML breaks for natural phrase-end pauses. Avoid stacking many breaks.
- Generate WAV/MP3 per segment, then transcribe the actual generated audio in Spanish.
- Compare transcript against intended spoken text. Preserve user-approved technical wording such as `skill`, product names, and brand names. Do not accept accidental translations such as `1 skill` becoming `una habilidad`.
- Store outputs under `assets\voice\`:

```text
assets\voice\<segment-id>.wav
assets\voice\<segment-id>.transcript.json
```

- Update `manifests\audio-meta.json` with segment duration and transcript path.
- For browser playback from `public\index.html`, use `manifests\audio-meta.json` `browserSrc` values such as `../assets/voice/<segment-id>.wav`. Do not create `public\assets\voice\` mirrors.
- After transcribing and before any segment render, run the splice-silence gate over ALL segment audio — generated and user-provided alike. User-provided audio is NOT clean audio: recorded head/tail silence must be measured, never assumed absent:

```powershell
node "<skill-dir>\scripts\audit-splice-silence.mjs" --project "<project>" --noise -35dB --max-head 0.45 --max-tail 0.45 --max-splice-gap 0.9
```

- Treat any `audit-splice-silence.mjs` failure as a hard stop before rendering: apply the exact trim recommendations from the report, update transcripts/manifests, and re-run the gate until it passes.

### Transcript Approval Gate (blocking, requires the user)

After obtaining the word-level transcript of each clip (Whisper or any other ASR) and BEFORE rendering any caption or composite:

1. Show the full plain text of every clip in the chat, one clip at a time, readable.
2. Explicitly flag suspicious words: proper nouns, brand/product names, low-confidence words, and very short tokens that could be split words. ASR engines systematically mis-transcribe proper nouns and brand names.
3. Wait for the user's correction or approval. Do NOT start any caption or composite render until explicit approval is received.
4. Apply the corrections to the timestamp JSON with these rules:
   - Word split into 2 tokens: merge into a single token with the start of the first token and the end of the second.
   - Missing word (articles/prepositions before names): insert it by splitting the neighboring token's time range.
   - Never invent timestamps outside the real audio range.

Catching a transcript error after the render costs a full re-render cycle; catching it here costs seconds.

3. Generate or reuse HeyGen avatar segments.

- Use HeyGen only for sections that need lip-sync, usually openings and outro.
- In the modular script-to-video branch, HeyGen job ids must normally be `opening*`, `intro*`, `outro*`, or `closing*`. `body*`, `middle*`, `shared-body`, `shared-middle`, `animation`, `motion`, `*_full`, and whole-script segments are local render work, not paid HeyGen work.
- Default maximum paid avatar segment length is 20 seconds. If an opening/outro exceeds that, stop and ask whether to shorten, split, or explicitly override. A 40-60 second full-script avatar job is a blocker, not a normal plan.
- Before generating, check whether a local HeyGen source clip or manifest already exists.
- For multiple avatar sections, plan provider work first:

```powershell
node "<skill-dir>\scripts\plan-heygen-jobs.mjs" --project "<project>" --all --concurrency 2 --max-avatar-duration 20
```

- Read the planner output before any provider submission. It must state the paid jobs and expected paid seconds. A correct modular plan looks like `HeyGen jobs = opening3, outro; local animation = body1..bodyN; expected paid seconds ~= intro + outro only`. If a planned job is `blocked`, fix the segment manifest instead of submitting paid work.
- Run the plan audit before spawning HeyGen workers:

```powershell
node "<skill-dir>\scripts\audit-modular-plan.mjs" --project "<project>" --max-avatar-duration 20 --max-total-paid-duration 40
```

- Treat any `audit-modular-plan.mjs` failure as a hard stop before paid provider work.
- If `audit-modular-plan.mjs --output` is used, the output path must stay under `manifests\audits\`.
- Keep paid/provider work off the main thread by default. Start one subagent or worker per ready job or small batch from `manifests\heygen-jobs.json`; each worker must claim its job, submit or wait for that specific HeyGen generation, freeze the completed output, and update the queue/manifests. Use `maxConcurrency` as the cap.
- Delegated HeyGen workers are the default for script-to-video projects. The main agent owns planning, audio QA, animation, assembly, and final verification; workers own paid avatar jobs only. If multi-agent tools are unavailable, process the same queue sequentially with `heygen-job-state.mjs`.
- Do not ask for a separate user opt-in for routine HeyGen worker delegation once the user has requested this workflow. It is part of the default project execution unless the user explicitly disables delegation.
- Subagents must not duplicate each other: before submitting, claim the job with `heygen-job-state.mjs`, then re-check `assets\avatar\`, `manifests\paid-assets.json`, and the job `requestFingerprint`.
- Subagents must reject any job whose id or segment text indicates `full`, `whole`, `combined`, `body`, `middle`, or a 40-60 second whole-script avatar clip. They must mark it failed/blocked and report it, not submit it.
- Download and freeze every completed paid output into `assets\avatar\` or `assets\` with a manifest recording remote id/session/page URL, local path, source audio, source text, and status.
- Never delete, cancel, overwrite, or discard paid HeyGen generations unless the user explicitly asks for that exact action.
- If a paid output was accidentally created, preserve it and use/download it when possible.
- If replacing audio under an existing avatar clip, prefer the exact source audio used to generate that HeyGen lip sync. New audio under old lips can drift.

### Default HeyGen Worker Delegation

After `plan-heygen-jobs.mjs`, the main agent must inspect `manifests\heygen-jobs.json`, choose up to `maxConcurrency` jobs with `status: "ready"`, and spawn one worker per job. Do not assign the same job id twice. Do not wait on workers while non-overlapping local work remains.

The main agent keeps ownership of:

- `source\`
- `public\`
- `renders\`
- `snapshots\`
- `manifests\audio-request.json`
- `manifests\audio-meta.json`
- `manifests\assemble.json`
- final QA and delivery

Each worker owns only:

- its one `manifests\heygen-jobs.json` job record;
- the matching `assets\avatar\<segment-id>.mp4`;
- matching entries in `manifests\paid-assets.json`.

Workers must update the queue through the bundled state helper, not by hand-editing shared JSON:

```powershell
node "<skill-dir>\scripts\heygen-job-state.mjs" claim --project "<project>" --job-id "heygen-opening1" --worker-id "<worker-name>"
node "<skill-dir>\scripts\heygen-job-state.mjs" status --project "<project>" --job-id "heygen-opening1" --claim-token "<token>" --status submitted --remote-id "<heygen-video-id>" --page-url "<url>"
node "<skill-dir>\scripts\download-freeze-heygen.mjs" --project "<project>" --source "<url-or-file>" --output "assets/avatar/opening1.mp4" --asset-id "opening1" --segment "opening1" --remote-id "<heygen-video-id>" --page-url "<url>" --source-audio "assets/voice/opening1.wav" --request-fingerprint "<fingerprint>"
node "<skill-dir>\scripts\heygen-job-state.mjs" freeze --project "<project>" --job-id "heygen-opening1" --claim-token "<token>" --local-path "assets/avatar/opening1.mp4" --remote-id "<heygen-video-id>" --page-url "<url>"
```

If the worker fails, it must mark the job failed:

```powershell
node "<skill-dir>\scripts\heygen-job-state.mjs" fail --project "<project>" --job-id "heygen-opening1" --claim-token "<token>" --error "<brief reason>"
```

Main-agent worker prompt template:

```text
You are a HeyGen worker for one paid avatar job in a modular avatar-video project.

Project:
<project>

Skill:
<skill-dir>\SKILL.md

Job id:
<job-id>

Allowed write scope:
- manifests/heygen-jobs.json, only this job record through heygen-job-state.mjs
- manifests/paid-assets.json, only the matching paid asset entry
- assets/avatar/<segment-id>.mp4

Do not edit source/, public/, renders/, snapshots/, audio manifests, assemble manifests, or other jobs.
Do not delete, cancel, overwrite, or discard paid HeyGen generations.

Steps:
1. Read the skill and the project manifests.
2. Claim only <job-id> with heygen-job-state.mjs. If it is already frozen, report that and stop.
3. Reject the job before provider submission if the job id, segment id, source text, or audio duration indicates full-script/body/middle work rather than opening/outro lip sync.
4. Re-check assets/avatar/, manifests/paid-assets.json, and requestFingerprint before submitting paid work.
5. Submit or wait for the HeyGen avatar generation for this job only.
6. Freeze the completed output to the job output path with download-freeze-heygen.mjs.
7. Mark the job frozen with heygen-job-state.mjs.
8. Final response: job id, status, remote id/session/page URL, local output path, and any issue.
```

### Default Read-Only Verification Agents

Use verification subagents by default for script-to-video projects. These auditors are separate from HeyGen workers. They are read-only by contract: no provider calls, no paid submissions, no deletion/cancellation, and no edits to source, media, render, provider, or assembly files. Their only allowed write is an audit report under `manifests\audits\`.

If multi-agent tools are unavailable, the main agent must run the same scripts and checklist locally. Do not skip the gate.

**Plan Auditor, before HeyGen workers**

Spawn after `segments.json`, `audio-request.json`, `audio-meta.json`, and `heygen-jobs.json` exist, and before any paid HeyGen worker is allowed to claim a job. The Plan Auditor must run `audit-modular-plan.mjs` and compare the manifests to this skill and `references/video-production-guidelines.md`.

Plan Auditor prompt template:

```text
You are the read-only Plan Auditor for a modular HeyGen avatar-video project.

Project:
<project>

Skill:
<skill-dir>\SKILL.md

Rules:
- Do not call HeyGen, ElevenLabs, or any paid provider.
- Do not edit project files except writing the approved audit report under manifests/audits/.
- Verify the project follows script-to-video modular architecture before paid avatar work.

Required checks:
1. Run audit-modular-plan.mjs against the project.
2. Confirm the script path did not trigger a direct full-avatar branch.
3. Confirm HeyGen jobs are only opening/intro/outro/closing segments.
4. Confirm no *_full, whole, combined, body, middle, animation, or motion segment is a paid HeyGen job.
5. Confirm expected paid seconds are intro/outro only.
6. Confirm body/middle segments are local HyperFrames animation work.
7. Confirm TTS payload preflight exists or block until it is run.

Final response:
PASS or FAIL, audit report path, paid jobs summary, local animation summary, and exact blocking issues.
```

The main agent must not spawn HeyGen workers unless the Plan Auditor passes and `manifests\audits\plan-audit.json` has `ok: true`.

**Animation QA Auditor, before final assembly**

Spawn after the shared middle/outro composition has snapshots and overflow checks. The Animation QA Auditor reviews generated HTML/source, snapshots, and QA reports against the production guide.

Animation QA prompt template:

```text
You are the read-only Animation QA Auditor for a modular HeyGen avatar-video project.

Project:
<project>

Skill:
<skill-dir>\SKILL.md

Rules:
- Do not call paid providers.
- Do not edit project files except writing an audit report under manifests/audits/.
- Inspect the composition, snapshots, overflow reports, and text inventory.

Required checks:
1. Confirm no visible metadata leaked: OpenAI skill, question hook, Pregunta hook, file names, source paths, or internal labels.
2. Confirm captions are large, readable on mobile, and synced to the intended audio/transcript.
3. Confirm cards have no empty internal space and no overflow/clipping.
4. Confirm real logos/screenshots/assets are used when public subjects are referenced.
5. Confirm middle/body animation follows the production guide and does not use paid avatar video.
6. Confirm outro CTA follows the Link en los comentarios implementation when required.
7. Confirm frames near splice boundaries were snapshotted.

Final response:
PASS or FAIL, inspected files/snapshots, and exact visual/timing issues.
```

The main agent must fix failed Animation QA findings before final assembly.

**Final Render Auditor, before final answer**

Spawn after final MP4s are rendered or assembled. This auditor verifies artifacts only.

Final Render Auditor prompt template:

```text
You are the read-only Final Render Auditor for a modular HeyGen avatar-video project.

Project:
<project>

Skill:
<skill-dir>\SKILL.md

Rules:
- Do not call paid providers.
- Do not edit project files except writing an audit report under manifests/audits/.
- Verify final deliverables and manifests only.

Required checks:
1. Verify each final MP4 exists.
2. Verify 1080x1920 unless the user requested another format.
3. Verify video stream and audio stream.
4. Verify duration is expected after speed/music post-processing.
5. Verify paid HeyGen outputs are frozen locally and preserved in paid-assets manifest.
6. Verify assemble and verification manifests point to the final outputs.
7. Run ffmpeg silencedetect over each final MP4 and verify no splice pause exceeds ~0.9s of dead air.

Final response:
PASS or FAIL, final paths, media metadata, manifest paths, and exact blocking issues.
```

The main agent must include auditor failures in the final response if any remain.

4. Render animation and avatar overlays as segments.

- Prefer the project orchestrator for normal segment renders:

```powershell
node "<skill-dir>\scripts\render-avatar-video-project.mjs" --project "<project>" --segment "middle"
node "<skill-dir>\scripts\render-avatar-video-project.mjs" --project "<project>" --variant "opening2"
node "<skill-dir>\scripts\render-avatar-video-project.mjs" --project "<project>" --all --concurrency 2
```

- Let the orchestrator prepare segment-specific `public\index.html` and storyboard inputs, skip clean segment outputs, render only dirty segments, and assemble affected variants.
- Render each final reusable piece as its own segment where feasible:

```text
renders\segments\opening1.mp4
renders\segments\opening2.mp4
renders\segments\opening3.mp4
renders\segments\middle.mp4
renders\segments\outro.mp4
```

- Put captions, CTA overlays, and any visible graphics inside the segment that owns them.
- Render the shared animated middle once for all variants unless its content changes.
- Render the shared outro once for all variants unless its video, captions, audio, or CTA changes.
- Avoid full-variant re-renders when only one segment changed.
- If the current project is legacy/monolithic, full re-rendering is allowed, but treat that as a limitation to fix in the next iteration.

### Encode Budget (non-negotiable quality rule)

- Maximum 2 encode generations per pixel: 1 intermediate encode per segment + 1 final assembly encode (or stream-copy concat when the streams match).
- Chaining re-encode passes is FORBIDDEN (e.g. captions → zoom → end card → concat as 4 separate encodes). All per-segment effects (caption overlay, zoom, end cards, graphics) must be composited in ONE ffmpeg `filter_complex` pass per segment.
- Intermediate segment encode: CRF 10 (or higher quality), preset slow.
- Final assembly encode: CRF 14 maximum.
- Any filter chain that includes crop + scale MUST end with `setsar=1` (without it the SAR ends up non-square, e.g. 3320:3321, and degrades the result).
- If a new pipeline step would require an additional encode, the correct answer is to integrate it into an existing pass, never to add another encode.
- In production, invoke segment renders with `render-segment.cjs ... --crf 10 --frame-format png` so the intermediate encode meets this budget from lossless PNG frame capture (JPEG capture artifacts degrade kinetic-text sharpness). The script defaults (`--crf 18`, JPEG q92) stay backward compatible.

5. Assemble final variants.

- Assemble final MP4s from the frozen/rendered segments:

```text
opening1 + middle + outro -> renders\final\<slug>-opening1.mp4
opening2 + middle + outro -> renders\final\<slug>-opening2.mp4
opening3 + middle + outro -> renders\final\<slug>-opening3.mp4
```

- Use stream-copy concat only when codecs, resolution, fps, audio sample rate, and channel layout match. Otherwise encode once at final assembly.
- Default final pacing for short social videos is `1.07` speed unless the user asks for natural timing or exact sync. Apply speed only at final assembly, after segment renders and provider outputs are frozen.
- Add low-volume background music only from a frozen, license-checked local file under `assets\music\`. For narration/avatar videos, start around `-24 dB` and keep speech intelligible.
- The agent must find, download, and freeze the music asset. Do not ask the user to download the track manually.
- Record music provenance in `manifests\assemble.json`:

```json
{
  "postprocess": {
    "speed": 1.07,
    "backgroundMusic": {
      "path": "assets/music/lofi.mp3",
      "volumeDb": -24,
      "sourceUrl": "https://...",
      "license": "Pixabay Content License",
      "attribution": "Track by Artist"
    }
  }
}
```

- Verify a frame near every splice boundary.

## Background Music Sourcing

- Use "royalty-free" as a licensing workflow, not a guarantee. Check the track page and license terms on the day of download.
- Prefer Pixabay Music for lofi hip hop background beds when the user has not provided a track. Use the search page `https://pixabay.com/music/search/lofi%20hip%20hop/`, choose an instrumental track that supports the video tone, and confirm the Pixabay Content License before download.
- Fall back to YouTube Audio Library, Mixkit, or Free Music Archive tracks with compatible Creative Commons licenses only when Pixabay does not fit the brief.
- Avoid tracks marked NonCommercial, no-derivatives, unclear AI-generated rights, or "free download" without explicit reuse terms when the video could be monetized or used commercially.
- Freeze the downloaded MP3/WAV into `assets\music\` with the bundled helper, then record source URL, license name, author, track title, attribution requirement, and download date in `manifests\assemble.json`:

```powershell
node "<skill-dir>\scripts\freeze-background-music.mjs" --project "<project>" --source "<mp3-download-url-or-local-file>" --output "assets/music/lofi.mp3" --source-url "<pixabay-track-page>" --title "<track-title>" --artist "<artist>" --license "Pixabay Content License" --speed 1.07 --volume-db -24
```

- Use the actual audio download URL or a locally downloaded audio file for `--source`; a Pixabay HTML track page is not an audio file. If direct download requires a browser session, use the browser to download it, then freeze the local file with the helper.
- If attribution is required, return the exact attribution text with the final paths so the user can place it in the platform description.

## Direct HeyGen Avatar Branch

Use this branch when the user provides final audio and wants one HeyGen avatar/lip-sync output. Direct audio uploads normalized audio to HeyGen as `audio_asset_id`; do not replace it with `script` plus `voice_id` unless the user explicitly asks to regenerate audio.

```powershell
cd "<video-cutter-lab-root>"
node .\bin\video-cutter.js ai-avatar-video `
  --provider heygen `
  --heygen-source avatar `
  --avatar-id "<heygen-avatar-id>" `
  --audio "<audio-file>" `
  --name "<run-name>" `
  --heygen-resolution 1080p `
  --heygen-aspect-ratio 9:16 `
  --yes
```

Use `--submit-only` only when the user wants to create HeyGen jobs without waiting. Use `--wait` only against an existing matching `run-manifest.json`.

When changing Video Cutter Lab workflow behavior or debugging an unexpected run, read `README.md`, `CONTEXT.md`, `docs/adr/0004-ai-avatar-video-provider-neutral-workflow.md`, and `docs/implementation/ai-avatar-video-workflow.md`. Run `npm.cmd run check`, `npm.cmd test`, and `node .\bin\video-cutter.js doctor` when code changed or reliability matters. Confirm `HEYGEN_API_KEY` is set without printing it.

## Caption Contract

- Captions must follow actual spoken audio, not the earlier script.
- Captions may only be rendered from a transcript approved at the Transcript Approval Gate.
- Use word-level transcript timing when available.
- For avatar sections, caption against the audio that generated the visible lip sync.

Caption positioning over video with people:

- Before fixing the vertical caption position, inspect frames of the clip (screenshots at 2-3 timestamps) to locate the speaker's face.
- Captions must NOT cover the face. If the face is in the upper/middle third, place captions in the visible lower third (but above the platform UI safe zone). If the face is centered, use the band between the chin and the safe zone.
- Minimum horizontal padding: 120px per side at 1080px width.
- `overflow: hidden` on every caption container.
- Chunks of at most 2 words for word-by-word captions; chunk-cut gap threshold: 0.35s (with 3-word chunks and a larger threshold, a chunk can hide before its last word appears).

Platform safe zone for TikTok/Reels/Shorts (1080x1920):

- No text or important element below y=1440px (the bottom 25% is covered by the platform UI), above y=220px, or within ~120px of the right edge (button column).
- "Link in comment"-style end cards: text at top <=1200px, arrow at top <=1360px.
- For Video Cutter Lab direct runs, captions belong in the run top-level folder:

```text
captions\<prefix>.captions.json
captions\<prefix>.captions.srt
```

- If captions fail after an avatar video completes, keep the video and report the caption failure plus expected caption paths.

## Repair Rules

- Bad TTS pronunciation or wrong wording: fix `ttsText`, regenerate only that audio segment, transcribe it, update timing/captions, then re-render only the affected segment and final assemblies.
- Bad captions with correct audio: fix transcript/caption mapping only. Do not regenerate HeyGen.
- Rendered freeze/desync when the source HeyGen clip is clean: debug the local render/assembly path first. Use seek-safe video capture and compare frames from the source clip.
- Need exact lip sync on an existing avatar clip: use the exact source audio that generated the HeyGen video, or ask before accepting drift.
- Visual overflow in one animation: snapshot/check only affected timestamps, repair the segment, then reassemble.
- Paid asset missing locally: search manifests and provider records before creating a new paid run.
- Dead air / audio vacuum at a splice (the pause between segments is too long): measure with `audit-splice-silence.mjs`. Trim the head of the offending audio leaving ~0.25-0.35s before the voice, preserving the untouched original as `<id>-original.wav` and shifting ALL word-level transcript timestamps by the same offset (clamp to >= 0). Cut mute tails without modifying source files by reducing the segment's effective duration to last word +0.3s via `durationSec` in `manifests\audio-meta.json`. Then re-render only the affected segments and re-assemble only the affected variants.

## Reusable Tools To Prefer

Prefer this skill's bundled helper scripts for repeated fragile steps. Promote one-off repair scripts into parameterized bundled tools when they become useful.

This skill bundles reusable scripts in `scripts/`. Prefer these before rewriting one-off project tools:

```powershell
node "<skill-dir>\scripts\init-project.mjs" --project "<project>" --script "<source-script.md>" --avatar-id "<heygen-avatar-id>" --voice-id "<elevenlabs-voice-id>"
node "<skill-dir>\scripts\preflight-tts-payload.mjs" --file "<project>\manifests\audio-request.json" --json-path "lines[].text" --json-path "lines[].ttsText"
node "<skill-dir>\scripts\generate-elevenlabs-segment.mjs" --project "<project>" --segment "opening2" --must-contain "skill"
node "<skill-dir>\scripts\plan-heygen-jobs.mjs" --project "<project>" --all --concurrency 2 --max-avatar-duration 20
node "<skill-dir>\scripts\audit-modular-plan.mjs" --project "<project>" --max-avatar-duration 20 --max-total-paid-duration 40
node "<skill-dir>\scripts\audit-splice-silence.mjs" --project "<project>" --noise -35dB --max-head 0.45 --max-tail 0.45 --max-splice-gap 0.9
node "<skill-dir>\scripts\heygen-job-state.mjs" claim --project "<project>" --job-id "heygen-opening2" --worker-id "<worker-name>"
node "<skill-dir>\scripts\download-freeze-heygen.mjs" --project "<project>" --source "<url-or-file>" --output "assets/avatar/opening2.mp4" --asset-id "opening2"
node "<skill-dir>\scripts\heygen-job-state.mjs" freeze --project "<project>" --job-id "heygen-opening2" --claim-token "<token>" --local-path "assets/avatar/opening2.mp4"
node "<skill-dir>\scripts\freeze-background-music.mjs" --project "<project>" --source "<mp3-download-url-or-file>" --output "assets/music/lofi.mp3" --source-url "<pixabay-track-page>" --title "<track-title>" --artist "<artist>" --license "Pixabay Content License" --speed 1.07 --volume-db -24
node "<skill-dir>\scripts\render-avatar-video-project.mjs" --project "<project>" --segment "middle"
node "<skill-dir>\scripts\render-segment.cjs" --project "<project>" --output "renders/segments/middle.mp4"
node "<skill-dir>\scripts\assemble-variants.mjs" --manifest "<project>\manifests\assemble.json"
node "<skill-dir>\scripts\assemble-variants.mjs" --manifest "<project>\manifests\assemble.json" --speed 1.07 --music "assets/music/lofi.mp3" --music-volume-db -24
node "<skill-dir>\scripts\snapshot-qa.cjs" --project "<project>" --variant "opening2" --at "32.35,32.95"
node "<skill-dir>\scripts\check-overflow.cjs" --project "<project>" --at "32.35,32.95"
node "<skill-dir>\scripts\scan-text-inventory.mjs" --file "<project>\public\index.html"
node "<skill-dir>\scripts\verify-render.mjs" --file "<project>\renders\final\video-opening2.mp4" --expect-width 1080 --expect-height 1920
```

- `init-project.mjs`: create the canonical one-folder project layout and starter manifests without overwriting existing files.
- `preflight-tts-payload.mjs`: validate exact UTF-8 text/JSON fields before TTS.
- `generate-elevenlabs-segment.mjs`: generate one TTS segment, normalize WAV, transcribe, require key terms, and update `manifests\audio-meta.json`.
- `plan-heygen-jobs.mjs`: build `manifests\heygen-jobs.json` from segment/audio manifests without provider calls, so paid HeyGen work can be delegated concurrently.
- `audit-modular-plan.mjs`: pre-paid read-only gate that blocks full-script/body/middle HeyGen jobs, mojibake, missing manifests, blocked provider jobs, and excessive paid avatar duration.
- `audit-splice-silence.mjs`: pre-render read-only audio gate that measures head/tail silence of every segment audio with silencedetect, projects the dead-air pause at each assembly splice, and fails with exact trim recommendations when the silence budget is exceeded.
- `heygen-job-state.mjs`: claim, update, freeze, fail, release, or list HeyGen jobs with a lock so concurrent workers do not duplicate paid jobs.
- `download-freeze-heygen.mjs`: download/copy completed HeyGen output into the project root and update `manifests\paid-assets.json`; it never deletes remote assets.
- `freeze-background-music.mjs`: download/copy a selected, license-checked background track into `assets\music\` and update `manifests\assemble.json` with speed, volume, source, license, and attribution metadata.
- `render-avatar-video-project.mjs`: read manifests, decide dirty segments/variants, prepare segment-specific browser composition inputs, render changed segments, and assemble affected variants.
- `render-segment.cjs`: render the current HyperFrames `public/index.html` with seek-safe video capture and storyboard audio mixing.
- `assemble-variants.mjs`: assemble final videos from segment MP4s by concat copy or final encode, then optionally apply final speed and background music from `manifests\assemble.json`.
- `snapshot-qa.cjs`: capture exact timestamps for visual review.
- `check-overflow.cjs`: inspect visible DOM boxes for clipped/off-frame text.
- `scan-text-inventory.mjs`: catch leaked metadata strings such as `question hook`.
- `verify-render.mjs`: confirm duration, resolution, video stream, audio stream, and output path.

If an existing project still has older local tools such as `render-local.cjs`, `snapshot-qa.cjs`, or `check-overflow.cjs`, those may be used for that project, but migrate repeated behavior back into the bundled scripts.

## Verification Gate

Before reporting completion:

- Run a text inventory over generated HTML/source for leaked metadata such as `OpenAI skill`, `question hook`, `Pregunta hook`, file titles, or internal labels.
- Before launching the full frame-by-frame caption render, render the caption HTML at 3-5 representative timestamps (screenshots on a dark background) and verify: spelling (against the transcript approved at the Transcript Approval Gate), position (does not cover the face, inside safe zones), and that no word overflows horizontally. An error caught here costs seconds; caught after the render it costs the full cycle.
- Snapshot affected timestamps before final render or assembly.
- Run overflow/layout checks on affected timestamps.
- After rendering or assembly, verify each final MP4 has:
  - expected duration;
  - `1080x1920` unless the user requested another format;
  - H.264 or expected video stream;
  - AAC or expected audio stream;
  - clear output path.
- Extract or inspect at least one rendered frame near any repaired region and near each splice boundary.
- Run ffmpeg silencedetect over each final MP4: no splice pause may exceed ~0.9s of silence. Splice pauses must stay comparable to the natural pauses between spoken phrases.
- Report exact final paths, segment paths when relevant, manifests, HeyGen ids/page URLs, and any remaining risk.
