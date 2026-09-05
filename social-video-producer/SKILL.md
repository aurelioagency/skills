---
name: social-video-producer
description: Short vertical social video producer (TikTok/Reels/Shorts, 1080x1920). Use for modular videos built from a script with ElevenLabs audio and word-level captions, avatar/lip-sync openings or outros via HeyGen, HyperFrames animated middle sections, segment rendering and assembly, assembling a video from clips the user already filmed, burning subtitles into a video that already exists, adding motion-graphics overlays (kinetic text cards, step/roadmap checklists, punch-in emphasis text) generated from what a video actually says, background music sourcing, paid provider asset freezing, direct-audio avatar runs, source-video voice conversion, or verification and repair of a bad segment, caption, or render. Do not use for Floyo/Wan Animate.
---

# Social Video Producer

Produce short vertical videos end to end. Default to a modular segment-first pipeline for script-driven videos: generate and freeze avatar sections, render shared animation sections separately, then assemble final variants without recapturing unchanged segments.

Provider names in this document — HeyGen for avatar lip-sync, ElevenLabs for speech — are the tools currently used for two specific steps, not the identity of the skill. Several branches, including burn-in captions and assembly from the user's own clips, call no paid provider at all.

Video Cutter Lab is an optional local dependency used for direct runs. Locate its root on the current machine first (referred to below as `<video-cutter-lab-root>`). If it does not exist on this machine, report it as an optional dependency to install or locate; never assume a fixed absolute path from another user or machine.

For every video-editing, caption, animation, spacing, or render decision, first read and obey:

[`references/video-production-guidelines.md`](references/video-production-guidelines.md)

Completion means the run has final MP4 output, segment outputs, audio, transcripts/captions, manifests, frozen paid HeyGen assets, and verification metadata, or a specific provider/caption/render failure is reported with the artifact paths that exist.

## Choose The Branch

- Use **script-to-video modular** when the user provides a script, skill file, multiple hooks/openings, a shared animated middle, or a shared outro. This is the default for new edited videos.
- Use **direct HeyGen avatar** when the user provides a final MP3/M4A/WAV and wants one avatar/lip-sync output.
- Use **burn-in captions** when the user hands over a video that is already shot and edited and only wants subtitles on it. There is no script, no TTS, and no paid provider work in this branch.
- Use **contextual overlays** when the user hands over a video that is already shot and wants motion-graphics overlays (kinetic text cards, step/roadmap checklists, punch-in emphasis text) generated from what is actually said in it — not subtitles, not a fixed template, not invented brand logos. There is no script, no TTS, and no paid provider work in this branch either.
- Use **source-video conversion** only when the source video's audio must first be converted before HeyGen.
- Use **repair** when the user reports bad pronunciation, wrong captions, a frozen rendered frame, desync, overflow, wrong title text, or a bad segment. Repair the smallest segment possible.

Do not submit paid HeyGen work until the audio text, encoding, and segment plan are verified.

Hard branch rule: a script path is not a final audio file. For script-driven work, never collapse the script into a full paid HeyGen avatar run unless the user explicitly asks for a direct full-avatar video and accepts the paid provider usage. The default deliverable is intro avatar + animated middle + outro avatar assembled locally.

## Project Layout

Keep each script/video job in one project folder under `<Documents>\social-video-producer\` (derive `<Documents>` from the current environment), unless the user gives another path. Never default to an absolute path from another user or machine.

Every video this skill produces lives under that one root, named after the skill, so the user has a single place to find all of them. It sits inside the documents folder for a second reason that matters operationally: **this harness only makes links clickable when the path is inside the working directory.** A deliverable written to `Downloads\` or anywhere else outside it can be described but never opened with a click — the link resolves to "outside the working directory" and fails. Keep everything in-tree.

**The project slug must be descriptive of the video's actual topic, in kebab-case** — the same rule `social-carousel-generator` uses for its `<tema-en-kebab-case>` delivery folder. Never name the project after the source filename, a date, or any other non-descriptive label (`0824`, `video1`, `final2`, `clip`). Derive the slug from what the video is actually about — the hook, the product, or the main topic — once enough of the script or transcript is known to name it (for script-driven projects, right after parsing the script; for burn-in-captions or contextual-overlays projects, right after the Transcript Approval Gate, since the slug is not knowable before the transcript is read). If a project must be created before the topic is known, use a short placeholder and rename the folder plus every file inside it that carries the slug as soon as the topic is confirmed — never ship a delivery folder or final filename still named after a placeholder.

The root holds two things: one delivery folder per video, named after the video, and a single `.work\` folder where every project's working tree lives out of the way.

```text
social-video-producer\<script-slug>\           <- DELIVERY: only what the user consumes
  <slug>-subs.mp4
  <slug>-caption.txt
  <slug>-transcript.txt

social-video-producer\.work\<script-slug>\     <- the project; the user never has to open it
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
    fonts\
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
- `assets\fonts\` contains the caption font frozen for the project, with its licence file. Never reference a system font path at render time.
- `public\` is the active browser composition used by HyperFrames/Playwright. Do not mirror voice files into `public\`. Browser composition code in `public\index.html` must reference canonical project assets with paths such as `../assets/voice/<segment-id>.wav` or the `browserSrc` value in `manifests\audio-meta.json`.
- `renders\segments\` contains reusable segment MP4s. `renders\final\` contains user-deliverable final MP4s.
- `snapshots\` contains QA screenshots and overflow/layout reports.
- `raws\` (optional, user-supplied-media jobs) contains the user's original source files for this video, copied verbatim during User Asset Intake. Create it with a plain mkdir when needed; never modify, rename, or delete anything inside it.

Do not create a project-local `tools\` folder for normal runs. Reuse this skill's bundled `scripts\`. If a one-off local tool is unavoidable for a legacy repair, keep it temporary and promote repeated behavior back into the skill.

## User Asset Intake

When the user must supply existing media (opening clips, body audio, outro, script) and has not given explicit paths, never fail or stall on missing placeholders. Collect the assets this way:

1. Ask only where the project should live (default `<Documents>\social-video-producer\.work\<slug>\`). Create the full project structure immediately, plus a `raws\` folder in the project root for the user's original files.
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

1. Fix the language yourself first, before showing anything. Spelling, accents, verb forms, prefix joining, and register consistency are the agent's job, resolved against a dictionary and against the rest of the transcript — never a question for the user. See **Language Is Never A Question** below.
2. Show the full plain text of every clip in the chat, one clip at a time, readable, already corrected.
3. Ask about every word you genuinely doubt *was said*: proper nouns, brand and product names, acronyms, numbers, low-confidence tokens, and anything that does not parse. ASR engines systematically mis-transcribe proper nouns and brand names, and no dictionary can tell you which product the speaker meant — that is exactly what the user is for. What never goes in the list is how a word is spelled or accented.
4. Wait for the user's correction or approval. Do NOT start any caption or composite render until explicit approval is received.
5. Apply the corrections to the timestamp JSON with these rules:
   - Word split into 2 tokens: merge into a single token with the start of the first token and the end of the second.
   - Missing word (articles/prepositions before names): insert it by splitting the neighboring token's time range.
   - Never invent timestamps outside the real audio range.
   - Keep the raw ASR output untouched and write the corrected version alongside it as `<slug>.approved.json`, so the original stays auditable.

Catching a transcript error after the render costs a full re-render cycle; catching it here costs seconds.

#### Ask What Was Said, Never How It Is Written

There is a line through the middle of this gate, and it decides what belongs in the questions:

- **Ask freely about which word was spoken.** That is the point of the gate and the user is the only source for it. Anything the audio leaves genuinely ambiguous — a product name, an acronym, a number, a word Whisper flagged as low-confidence, a phrase that does not parse — goes in the list. Doubt is a good reason to ask.
- **Never ask how a word is written.** Spelling, accents, prefix joining, and which conjugation family the speaker uses are the agent's job, resolved against a dictionary and against the rest of the transcript. The user is a native speaker of the language they recorded in; asking them to adjudicate their own orthography is not diligence, it is offloading the work onto them, and it reads as insulting.

Two failure modes to avoid specifically:

- **Do not bundle unrelated words into one grammar question.** Five words listed together under a single "is this X or Y?" row is not five careful checks — it is one grammatical question the user never asked to be involved in, wearing a costume. Resolve the pattern once, apply it to all five, report it as done.
- **Do not name grammatical categories at the user.** Terms like *tuteo*, *voseo*, *aguda*, *llana*, *diacritic* are internal vocabulary. The user does not have to know them and should not have to learn them to approve a transcript. If a reason is needed, ground it in their own audio: "va en voseo porque en el audio decís *tenés* y *Seguime*" — one line, no lesson.

- **Accents/diacritics:** a solved rule, not an opinion. Apply the language's own orthography (Spanish: `haces` is llana ending in -s → no tilde; `hacés` is aguda ending in -s → tilde; `comentá` is aguda ending in a vowel → tilde). If unsure, look the form up — do not put the question to the user.
- **Prefixes and compounds:** apply the language academy's rule directly (RAE: prefixes join the base word, so `ultraliviano`, not `ultra liviano`).
- **Register consistency (tuteo vs. voseo, formal vs. informal, regional forms):** decide it from the audio, not from the user. Whisper systematically neutralises Rioplatense voseo to peninsular tuteo, but it rarely neutralises *every* instance. Find the forms that survived — `tenés`, `Seguime`, `podés`, `sos` — and normalise the whole transcript to that register. A transcript that mixes `tenés` with `instalas` is an ASR artefact and a grammatical inconsistency, never a stylistic choice the user made.
- Do not name the grammatical categories at the user unless they ask. State the correction and the reason in one line ("va en voseo porque en el audio decís *tenés* y *Seguime*") and move on.
- Report the fixes as a decision already applied, in a table of `what the ASR heard` → `what ships` → `why`. The user's only job is to veto something that looks wrong.

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

#### Never Downscale The Source

The source's native resolution is the floor for the deliverable, always. A 2160x3840 recording ships at 2160x3840; a 4K source never becomes a 1080p deliverable.

- **Never propose downscaling, and never ask whether to.** "The platform standard is 1080x1920" is not a reason — the platforms accept and prefer higher resolution, and they re-encode everything anyway, so handing them more pixels produces a better final stream on their side. Asking the question at all signals the quality rule was not read.
- File size is not a reason either. A 165 MB 4K deliverable is the correct output for a 34-second 4K source. Do not trade pixels for megabytes on your own initiative.
- The `1080x1920` in this document is the *default composition canvas* for videos this skill generates from scratch, not a ceiling imposed on footage the user shot. When the user supplies the video, its own dimensions are the target.
- Scale only when the user explicitly asks for a specific smaller size, and only inside an already-budgeted encode pass — never as an extra pass.
- Consequently, verify the burn against the SOURCE dimensions: `verify-render.mjs --expect-width <source-width> --expect-height <source-height>`, read from ffprobe, not from a hardcoded 1080x1920.
- Caption geometry is expressed against the 1080-wide house design, so scale every caption dimension by `sourceWidth / 1080` before building the `.ass`: at 2160 wide that means `--size 208 --outline 14 --shadow 10 --margin-lr 240 --margin-bottom 1000`. Passing the 1080 numbers onto a 4K frame renders captions at half their intended size.

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

## Burn-In Captions Branch

Use this branch when the video already exists — the user shot and edited it — and the only job is putting subtitles on it. No script, no TTS, no HeyGen, no paid provider work. Do not route this through the script-to-video modular workflow: there is nothing to segment and nothing to assemble.

Needs Node, ffmpeg, and Python with `faster-whisper` (transcription) and `Pillow` (text measurement): `pip install faster-whisper Pillow`. No API keys and no Playwright. Check this before starting, not when a script fails halfway through.

Captions here are burned in with libass, not rendered as an HTML composition. The pixels already exist, so the encode budget allows exactly **one** pass, and every caption decision lives in the `.ass` file.

1. Set up the project and keep the original untouched.

```powershell
node "<skill-dir>\scripts\init-project.mjs" --project "<project>" --slug "<slug>"
```

Copy the user's file into `<project>\raws\` and work from that copy. Record the original path in `manifests\project.json`. Leave `source\script.md`, the avatar id, and the voice id null — this branch has none.

2. Transcribe the real audio.

```powershell
node "<skill-dir>\scriptsreeze-caption-font.mjs" --project "<project>"
node "<skill-dir>\scripts\transcribe-media.mjs" --input "raws\<video>.mp4" --out-audio "assets\voice\<slug>.wav" --out-transcript "assets\voice\<slug>.transcript.json" --language es
```

The script reports `lowConfidence` words. Read the transcript from the JSON file with a UTF-8 reader, never from terminal output.

3. **Transcript Approval Gate (blocking).** Show the user the full text and flag every suspicious word — proper nouns, brand and product names, low-confidence tokens, and any form that clashes with the register of the rest (a `puedes` inside an otherwise voseo script is a misrecognition, not a style choice). Wait for explicit approval. Write the approved fixes to a corrections file:

```json
[{ "at": 4.72, "from": "puedes", "to": "podés" }]
```

4. Freeze a caption font into the project. Never point the burn at a system font path: it must come from `assets\fonts\` so the project stays reproducible on another machine.

```powershell
node "<skill-dir>\scripts\freeze-caption-font.mjs" --project "<project>"
```

With no flag this freezes **Inter Black**, the skill default, from the fonts bundled in `assets\fonts\`. All bundled fonts are SIL Open Font License, and the licence text is copied next to the frozen file, so the project carries its own proof and looks identical on any machine.

- `--list` shows the bundled set and the system candidates.
- `--bundled <name>` picks another bundled font: `archivoblack` (wider, more shout), `anton` (condensed, classic social), `bebasneue` (tall condensed caps, good for long words).
- `--system` copies the heaviest sans already installed instead, for a look the bundled set does not cover. Redistribution rights are then unverified, and the record says so.
- `--source <file-or-direct-url>` freezes a specific font. Direct font file only, never a zip.

Caption fonts want a heavy weight. At 104px a Regular reads thin over moving video.

**House default:** Inter Black at 104px, chunk reveal, `accent-mode active` — the accent colour moves word to word in sync with the audio (karaoke-style): each word turns colour as it's spoken, then returns to white, while the rest of the chunk stays visible and in place. That is what the scripts produce with no style arguments beyond the accent colour, and the reveal/font/timing choices in it **ship as-is** — they are a decided house style, not a starting point for a menu.

The accent colour itself has two standing options — ask the user which one before the first render of a new project, then reuse that answer for the rest of the project without asking again per segment:

1. **Cyan `#30D5FF`** (original default). Best when the caption band sits over dark/medium backgrounds — skin, hair, dark clothing, shadowed interiors. Contrast against black/dark backgrounds ~12:1; against white/light backgrounds it washes out (~1.7:1).
2. **Blue `#2F6FED`** (option 2). Best when the caption band sits over light/white backgrounds — screen recordings, light UI, bright rooms. Contrast against white ~4.6:1; against black ~5.1:1 — the more balanced of the two options across light and dark backgrounds, at a slightly softer saturation than a pure primary blue.

Look at a couple of representative frames from the actual footage before asking — if the caption band consistently falls over one kind of background, say so and recommend the matching colour rather than posing it as a coin flip. If it's genuinely mixed or unclear from the frames, ask the user directly which of the two to use.

The alternative is `accent-mode keyword` (`--accent-mode keyword --accent-terms "..."`) — only hand-picked key terms ever turn the accent colour, everything else stays white for the whole video. Switch to it only if the user asks for that specific look; do not default to it. `accent-mode` is only meaningful with `reveal=chunk`; with `reveal=word` it is a no-op since word reveal already colours the currently-spoken word.

5. **Render ONE preview frame of the house default (with the chosen accent colour) and keep going.** Burn the default `.ass` onto a real frame of this video, show that single image, and proceed straight to the full burn. This is a sanity check on placement over *this* footage — that the captions clear the speaker's face and any on-screen UI — not a style decision.

   **Do not offer 2-3 style candidates.** The skill already made the style decision; re-opening it hands a solved problem back to the user, wastes their attention, and implies the default is arbitrary. Generate alternative styles only when the user asks for a different look, and then render exactly the alternatives they described.

   The one thing that IS worth confirming per video is caption placement when the preview frame shows a conflict the guidelines can't resolve blind — a face in the lower third, a burned-in logo, on-screen UI under the caption band. Ask about that specific frame, not about taste.

6. Generate the subtitle file.

```powershell
node "<skill-dir>\scripts\build-burn-in-captions.mjs" --transcript "assets\voice\<slug>.approved.json" --output "renders\<slug>.ass" --font-file "assets\fonts\<font>.ttf" --video-width <source-width> --video-height <source-height> --size 104 --accent "#30D5FF"
```

Pass `--accent "#2F6FED"` instead when the user picked option 2 (blue) at the accent-colour question above.

`accent-mode` defaults to `active` (karaoke-style, no `--accent-terms` needed). Only add `--accent-mode keyword --accent-terms "<key terms>"` if the user asked for that specific keyword-only look instead.

Pass the SOURCE's real dimensions, and scale every caption dimension by `sourceWidth / 1080` — the geometry defaults are expressed against the 1080-wide house design. On a 2160x3840 source that is `--video-width 2160 --video-height 3840 --size 208 --outline 14 --shadow 10 --margin-lr 240 --margin-bottom 1000`. Leaving the 1080 numbers on a 4K frame renders captions at half their intended size, and it passes the width gate while doing it, because the gate measures against the same wrong width.

Use `--corrections "source\corrections.json"` for plain one-word substitutions. When a fix merges or splits tokens (`ultra` + `liviano` → `ultraliviano`), the corrections format cannot express it: write the corrected `<slug>.approved.json` directly, keep the raw `.transcript.json` untouched, and build from the approved copy.

7. Run the width gate before encoding.

```powershell
node "<skill-dir>\scripts\audit-caption-width.mjs" --ass "renders\<slug>.ass" --font-file "assets\fonts\<font>.ttf" --output "manifests\audits\caption-width.json"
```

Treat a failure as a hard stop. `check-overflow.cjs` inspects DOM boxes and cannot see burned-in captions at all.

8. Burn once, then verify.

```powershell
node "<skill-dir>\scripts\burn-in-captions.mjs" --input "raws\<video>.mp4" --ass "renders\<slug>.ass" --output "renders\final\<slug>-subs.mp4" --fonts-dir "assets\fonts"
node "<skill-dir>\scripts\verify-render.mjs" --file "renders\final\<slug>-subs.mp4" --expect-width <source-width> --expect-height <source-height>
```

Then extract frames from the FINAL file at several timestamps — at minimum one talking-head frame, one graphic/screen-recording frame, and one wrapped two-line caption — and look at them.

9. Build the cover. See **Cover (Portada)** — it ships with every subtitled video, unasked.

10. Write the post description, then package the delivery. See **Post Description** and **Delivery Package**:

```powershell
node "<skill-dir>\scripts\deliver-package.mjs" --project "<project>" --extra "renders\<slug>.ass"
```

Give the user the folder link from `folderUrl` before anything else.

### libass Behaviour That Costs A Render Cycle

- **The font family name is not the file name.** `Inter-Black.ttf` declares the family `Inter Black`; asking for `Inter` makes libass fall back to another font *silently* and the captions render at the wrong weight. `build-burn-in-captions.mjs` reads the family from the TTF name table, so let it auto-detect instead of passing `--font-name` by hand.
- **`\pos` and `\move` disable margin-based wrapping.** Once an event carries either tag, `MarginL`/`MarginR` no longer bound the line and long text runs straight off the frame. Line breaks must be inserted explicitly as `\N`, decided by measuring against the real font metrics.
- **ASS colour is `&HBBGGRR&`,** the reverse of CSS hex. Reversing it turns the accent into its complement, which is easy to miss on a warm frame.
- **Escape the Windows drive letter inside a filter argument** (`C\:/path/file.ass`), or ffmpeg reads the colon as the next filter option.
- Always pass `--fonts-dir`, so the burn uses the frozen project font rather than whatever the machine happens to have installed.
- **`-ss` before `-i` renders the wrong subtitle.** Input seeking rebases output timestamps to zero, so the `ass` filter draws whatever event lives at t=0 — usually nothing, which looks exactly like a silently broken filter. For any preview or QA frame, put `-ss` AFTER `-i`: `ffmpeg -i in.mp4 -ss 12.7 -frames:v 1 -vf "ass=...,scale=540:-1" out.png`. Slower, correct.
- A frame extracted exactly on an event's start time can come back blank: `\fad(70,0)` means alpha is still zero at that instant. Sample a few tenths inside the event, not at its boundary, before concluding a caption is missing.

## Contextual Overlays Branch

Use this branch when the video already exists and the ask is "add motion graphics / overlays" without a script, TTS, or paid provider. The deliverable is a set of animated kinetic-text elements (cards, step checklists, punch-in emphasis) composited onto the untouched source video in one final encode.

**What this branch is not:** it is not a fixed template and it is not literally reusable between videos — the overlay *content* (what each card says, when, in what order) is bespoke to this one video's transcript and must be designed fresh every time. What is reusable is the *mechanism*: the animation template (`assets/overlay-template.html`) and the two driver scripts (`capture-overlay-frames.mjs`, `composite-overlays.mjs`). Never propose "saving this as a reusable overlay set" — propose using the mechanism again on the next video's own content.

**Hard rule — no invented logos or brand icons.** Do not draw stand-in shapes for WhatsApp/Meta/n8n/any third-party product as if they were that product's logo; a generic icon that isn't the real mark reads as broken, not branded, and at overlay size it usually isn't legible either. Default to the kinetic-text-card language (see below) for every idea — a labelled panel says "n8n" better than an icon trying and failing to look like the n8n mark.

1. Set up the project and transcribe.

```powershell
node "<skill-dir>\scripts\init-project.mjs" --project "<project>" --slug "<slug>"
node "<skill-dir>\scripts\freeze-caption-font.mjs" --project "<project>"
node "<skill-dir>\scripts\transcribe-media.mjs" --input "raws\<video>.mp4" --out-audio "assets\voice\<slug>.wav" --out-transcript "assets\voice\<slug>.transcript.json" --language <es-or-en-or-whatever-was-detected>
```

Detect the spoken language before transcribing rather than assuming `es` — run a quick language-detect pass (`faster_whisper` with `language=None`) on the extracted audio first if it isn't obviously known, since the default second-pass language argument changes transcription quality.

2. **Transcript Approval Gate (blocking).** Same rule as every other branch: show the full transcript, flag low-confidence/suspicious words, wait for explicit approval before designing anything.

3. Read the frames — don't guess overlay placement. Extract 2-3 real frames from the moments you intend to cover and look at where the face, hands, and background clutter actually sit before picking a zone. A close talking-head shot usually leaves a clean band low-left and a clean top band above the hair; a wide shot is different every time.

4. Analyze content structure and design the overlay set. Read the transcript as a sequence of beats (hook, problem, credibility, promise, steps, CTA — whatever this video actually has) and design one overlay per beat that *quotes or tightly paraphrases* what is said at that timestamp. Default building blocks:
   - **textcard** — a lower-third-style panel with 1-2 lines of kinetic word-by-word reveal (stagger + slide + ease-out-back), an accent-colour bar that draws in, and a box pop-in. This is the proven, well-received default — reach for it first.
   - **steplist** — a row of chip panels that tick in one at a time (checkmark path-draw) against a shared timeline; use it for genuinely sequential/numbered content (steps, a short numbered list), never for content that a textcard already says just as well.
   - **punch** — a single big centered line for a closing beat or a one-word emphasis moment.

   Do not run two items in the same screen zone at overlapping times — a textcard and a steplist both anchored bottom-center at the same timestamp will visually collide. `composite-overlays.mjs` checks this and refuses to render on a collision; treat that check as a design bug to fix, not an obstacle to work around.

### Creative Proposal Gate (blocking, requires the user)

Before capturing any frames, present the full beat breakdown: each overlay's id, type, exact on-screen text, timestamp window, and accent colour/zone. This is the direct analogue of the script-to-video Creative Proposal Gate — get it approved before spending a render cycle, because a rejected overlay design after capture costs the full capture-and-composite cycle to fix, not just an edit.

5. Write `manifests/overlays.json` once the beat breakdown is approved:

```json
{
  "width": 1920, "height": 1080,
  "items": [
    { "id": "problem1", "type": "textcard", "start": 8.7, "end": 15.9,
      "position": "bottom-left", "accent": "#ff8a6a",
      "lines": [["El", "problema:"], ["parches", "o", "conexiones", "inestables."]],
      "accentWords": ["inestables."] },
    { "id": "roadmap", "type": "steplist", "start": 33.7, "duration": 8.8,
      "position": "bottom-center", "accent": "#30D5FF",
      "steps": [{ "label": "Configurar Meta", "tickAt": 0.0 },
                { "label": "Token permanente", "tickAt": 3.3 },
                { "label": "Conexión estable", "tickAt": 5.3 }] },
    { "id": "punch", "type": "punch", "start": 42.8, "end": 46.16,
      "accent": "#30D5FF", "html": "Vamos <span class=\"accent\">con ello.</span>" }
  ]
}
```

`position` for `textcard`/`steplist` is one of `bottom-left`, `bottom-center`, `top-left`, `top-center`, `center`. `textcard` and `punch` need `start`+`end`; `steplist` needs `start`+`duration` (its own exit adds ~0.3s after that).

6. Capture the animation frames, then composite in one encode pass:

```powershell
node "<skill-dir>\scripts\capture-overlay-frames.mjs" --project "<project>"
node "<skill-dir>\scripts\composite-overlays.mjs" --project "<project>" --input "raws\<video>.mp4" --output "renders\final\<slug>-overlays.mp4"
```

`capture-overlay-frames.mjs` renders each item's animation (word-stagger entrance, hold, exit; or continuous tick-in frames for a steplist) as transparent PNGs under `renders\overlay-frames\<item-id>\` and writes `renders\overlay-frames\capture-manifest.json`. `composite-overlays.mjs` reads that manifest plus `overlays.json`, builds the ffmpeg `filter_complex` for every item in a single pass (each item concatenated from its own enter/hold/exit or continuous/exit pieces, time-shifted to its `start`, then overlaid in sequence), and encodes once. Re-running `composite-overlays.mjs` alone (without re-capturing) is enough after a pure timing/color JSON edit; re-run `capture-overlay-frames.mjs` whenever the text content itself changes.

7. Verify like every other branch: check final resolution/duration/streams, extract frames at each overlay's entrance and mid-hold, and confirm text matches the approved transcript exactly (no accidental respelling, no leaked internal labels).

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
- The face rule outranks "captions centered in the middle of the screen" in the production guide. In a normal selfie or talking-head shot the face *is* in the middle, so the lower third is the correct answer and the centered-in-frame guidance does not apply. Centered-in-frame is for sections where nothing important sits behind the caption band.

Caption reveal, when stability and centering collide:

- Two rules pull apart with multi-word chunks: existing words must not move when a new word appears, and the visible text must actually look centered. Reserving the chunk's full width holds the first rule but renders a lone first word off-centre; re-centering each state holds the second but makes the earlier word jump sideways.
- **Centering wins.** Default to chunk-level reveal: the whole chunk enters at once, always centred, never reflowing. Mark emphasis with colour on the words that matter rather than on "the word being spoken".
- Word-by-word reveal is still correct with one-word chunks, which satisfy both rules at once, at the cost of a much busier rhythm.
- Never ship the third option — re-centering on every word — however natural it looks in a still frame.

Platform safe zone for TikTok/Reels/Shorts (1080x1920):

- No text or important element below y=1440px (the bottom 25% is covered by the platform UI), above y=220px, or within ~120px of the right edge (button column).
- "Link in comment"-style end cards: text at top <=1200px, arrow at top <=1360px.
- For Video Cutter Lab direct runs, captions belong in the run top-level folder:

```text
captions\<prefix>.captions.json
captions\<prefix>.captions.srt
```

- If captions fail after an avatar video completes, keep the video and report the caption failure plus expected caption paths.

## Cover (Portada)

Every finished video ships with a cover: one frame of the video with a three-line headline
burned onto it, as a PNG at the source's native resolution, named `<slug>-portada.png` and
delivered next to the MP4. **This is not an optional extra and it is not something to ask
about.** A request for subtitles is a request for a publishable post, and the cover is what
decides whether anyone opens it. Produce it in the same run.

The agent chooses the frame and writes the headline. Do not hand either decision back to the
user as a question — bring them the result and let them veto it.

### House Style (decided; not a menu)

- Frozen project caption font, Inter Black by default — the same file the captions use.
- **All the text in cyan `#30D5FF`**, the same cyan as the caption accent. Cover and
  captions speaking one colour is what makes the profile grid recognisable.
- **Three lines, one block, anchored bottom.** Small setup line, big line, small payoff
  line, sitting over the torso. That is the shape of both approved covers and the shape
  to start from — see **The Shape, From The Two Approved Covers** below.
- **The emphasis is per WORD.** Wrap what carries the cover in `*asterisks*` and it is
  set at the big size. Normally that is the whole middle line; a second word further down
  can take it too (`--line "y esta *skill* lo arregla"`). The rest of the line stays small
  around it.
- **`--anchor top|center|bottom` exists, but `bottom` is the answer for a talking head.**
  Text placed above the speaker lands on hair and forehead and leaves a dead gap through
  the middle of the frame. Move it only over footage with real empty space up there, and
  only after looking at the frame — `insideGridCrop` checks the thumbnail edges, never
  what is behind the text.
- **Fully opaque black outline**, plus a semi-transparent drop shadow, always on, even when
  the background looks easy. It is what survives a backlit or pale-walled shot. The two
  alphas are different decisions on purpose: a semi-transparent outline lets the background
  bleed through the ring around every glyph, and the colour then reads washed out and
  "half transparent" even though the fill itself is solid. The shadow stays soft because it
  is meant to be a drop, not a second outline.

Why cyan and not the lime yellow that the Spanish IG-tips niche defaults to: yellow sits next
to skin and warm-wood interiors on the colour wheel and leans on the shadow to separate, and
half that niche already uses it. Cyan is complementary to those backgrounds and is already
this account's caption colour. `--accent-big` renders white lines with only the big one in
cyan — reach for it when the footage is unusually busy and the full-colour block stops
reading, not as a matter of taste.

### Choosing The Frame

Scan the video and *look*, do not guess a timestamp:

```powershell
node "<skill-dir>\scripts\build-cover.mjs" --scan --input "raws\<video>.mp4" --output "snapshots\cover-scan.png"
```

The sheet is head-and-shoulders crops at 5 fps, so the mouth is legible. Cell `(row, column)`
is `t = (row * columns + column) / fps`. Pick a frame with:

- **mouth closed or a slight smile** — a mid-word open mouth reads as a bad screenshot;
- eyes to camera;
- a clean band under the face for the text, clear of hands and props.

### Writing The Headline

Restate the video's strongest idea, then decide which WORDS carry it and set those big.
Concrete beats clever. Match the video's own words and register (voseo if that is how it
was spoken). Not a summary of the video, and never a line the video does not deliver on.

Break the lines around the emphasis, not around the grammar: the big word wants to end up
alone or nearly alone on its line so it reads at a glance.

#### The Shape, From The Two Approved Covers

These two shipped and were approved. Copy their shape; do not reinvent it per video.

```text
esta skill te da            Claude ignoró
  10 GANCHOS                LA HERRAMIENTA
para tu próximo video       y esta SKILL lo arregla
```

- **Three lines. One block. Anchored bottom, over the torso.** Not two blocks, not a band
  above the head — see the note on ANCHORS in build-cover.mjs for why that was removed.
- **The middle line is the big one**, and it is the whole line. A second word may go big
  further down (`skill` above), but the middle line is what carries the cover.
- **Six to eight words**, small line → BIG line → small line.
- **Read the big words alone and it still has to mean something**: "10 ganchos",
  "la herramienta · skill".
- **No punctuation.** No commas, no full stops — the line breaks do that work, and a comma
  set in display type reads as a stray dot hanging off a centred line. It is also
  all-or-nothing: a comma in the middle commits you to a full stop at the end. Question
  marks are the exception; they carry meaning, not just rhythm.
- **House cyan, always**, the same as the captions inside the video. That is what makes the
  grid recognisable.

The exact invocation behind the right-hand cover, worth copying verbatim as a starting
point (the sizes and `--fit` are what make it fill the frame):

```powershell
--line "Claude ignoró" --line "*la herramienta*" --line "y esta *skill* lo arregla" `
  --anchor bottom --small-size 82 --big-size 150 --fit
```


### Building It

```powershell
node "<skill-dir>\scripts\build-cover.mjs" --project "<project>" --input "raws\<video>.mp4" --frame 19.0 `
  --line "esta skill te da" --line "*10 ganchos*" --line "para tu próximo video" --anchor bottom --fit
```

**Always pass `--fit`.** The cover is judged at thumbnail size, so a headline that stops
short of the margin is a headline set too small — `--fit` grows both sizes until the widest
line just reaches it. Width left unused is legibility thrown away.

The `66 / 160` house sizes are a *starting ratio*, not a floor, and their 1:2.4 contrast is
harder than the format usually runs (~1:1.9). When the small lines look weak next to the
big word, raise them with `--small-size` and give the big word back some room with
`--big-size` — `--small-size 82 --big-size 150 --fit` is a good second try. The small text
carries most of the sentence; it has to be readable on its own.

Budget the width before writing the headline: at the house sizes a big word runs about
`0.163 x frameWidth` per character and a small one about `0.067 x frameWidth`, against a
usable width of `frameWidth - 140/1080 x frameWidth`. In practice that is ~10 big
characters or ~25 small ones on a line, and `--fit` then scales the whole block up from
there. The script measures the real font metrics and refuses to render an over-wide line,
but knowing the budget saves a round trip.

Bigger text means a taller block, so re-check `insideGridCrop` after `--fit` and nudge with
`--y-offset` — growing the type is what pushes a block out of the profile grid's square.

Geometry is expressed in 1080-wide design space and scaled by `sourceWidth / 1080`, so a 4K
source gets 4K-sized text with no arguments. The script gates the width against the real font
metrics, verifies the rendered fill colour, and reports whether the block survives the profile
grid's centred square crop.

Then **look at both outputs** — the full cover and the grid-crop preview it writes next to it.
The text landing across the speaker's hands or a prop is the failure the script cannot see;
nudge the block with `--y-offset` (positive is down, in source pixels) and rebuild.

### Two Failures Worth Knowing About

- **`YCbCr Matrix` in the ASS header is target-dependent.** `TV.709` is correct burning into
  an MP4 and wrong rendering to a PNG: libass converts the fill for limited-range video and it
  lands dimmer and greyer than asked for. `#30D5FF` arrived as `#39C7EB`, which reads to the
  eye as *"the letters look half transparent"* — the fill is fully opaque, just wrong. PNG
  output declares `None`. `build-cover.mjs` samples the rendered strip and fails if the fill
  does not match, so this cannot ship again.
- **The profile grid crops the cover to a centred 3:4 tile**, not to a square. Instagram
  moved the grid off 1:1 in early 2025; for a 1080x1920 cover the surviving band is
  y=240..1680. `build-cover.mjs` hardcoded a centred square until this was caught, which
  pushed headlines ~180px further from the top of the frame than necessary and made
  "arriba" and "dentro del grid" look mutually exclusive when they are not. The script
  reports `insideGridCrop` against the 3:4 tile; treat `false` as a blocker, not a warning.
  Do not quote a grid measurement to the user without reading it out of the script — the
  number lives at `scripts/build-cover.mjs` `gridCropHeight`, and it was wrong once.

## Post Description (Social Caption)

Every finished video ships with a ready-to-publish post description in `<slug>-caption.txt` next to the final MP4 in `renders\final\`, plus pasted in the chat. Plain text, UTF-8, no markdown, no headings, nothing but the caption itself, ready to select-all and paste.

**Caption template (Instagram / TikTok), La Casa de Aurelio:**

```text
Bienvenidos a la Casa de Aurelio!

<2-4 lineas que resumen el gancho o insight principal del video, tono directo, sin relleno>

De la teoría a la práctica: Aurelio Agency →
https://www.aurelioagency.com/es

Unite a la comunidad:
https://www.skool.com/la-casa-de-aurelio-2061

<4 hashtags dinamicos segun el tema> #LaCasaDeAurelio
```

Rules:

- The greeting, the services paragraph links, and both URLs are **fixed**. Never reword, translate, shorten, or adapt them.
- The only written block is the 2-4 line paragraph: it restates the video's strongest idea, hook, or figure — not a recap of every line spoken. No filler, no generic AI phrasing, no inflated claims. Natural rhythm for the language actually spoken in the video.
- **Deduce the variant from what the video's outro actually says — never ask when the material already answers it.** If the outro asks the viewer to comment a word to receive something by DM (a skill, a template, a resource), insert a `Comentá <PALABRA> y te la mando por DM.` line right after the written paragraph, and make sure that exact word also appears written out in the paragraph itself. Otherwise, skip that line entirely — do not invent a comment CTA the video never asked for. Only ask the user if the outro itself leaves the intent ambiguous.
- **Exactly 5 hashtags, always.** One fixed: `#LaCasaDeAurelio`, always last, as signature. The other four are dynamic, picked by the video's actual topic:
  - Agentes / automatización de tareas → `#AIAgents #Agentic #Automatizacion #AIWorkflows`
  - n8n / workflows → `#n8n #NoCode #WorkflowAutomation #Automatizacion`
  - OpenAI / modelos puntuales → `#OpenAI #Codex #GPT #IA`
  - Claude / Anthropic → `#Claude #Anthropic #IA #AIWorkflows`
  - Productividad / negocio → `#Productividad #FutureOfWork #PYMES #IA`
  - Desarrollo / código → `#DevTools #SoftwareEngineering #IA`
  - Ninguna categoría encaja → construí los cuatro con palabras literales del video (nombres de herramientas, conceptos técnicos, el tema puntual tratado).
- A hashtag off-topic subtracts more than it adds: don't reach for `#Claude`, `#IA`, `#Automatizacion` or `#AIWorkflows` as filler defaults when the video isn't actually about that — pick what the video is actually about.
- Blank lines between blocks exactly as shown in the template.

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
node "<skill-dir>\scripts\transcribe-media.mjs" --input "<project>\raws\source.mp4" --out-audio "<project>\assets\voice\source.wav" --out-transcript "<project>\assets\voice\source.transcript.json" --language es
node "<skill-dir>\scripts\build-burn-in-captions.mjs" --transcript "<project>\assets\voice\source.transcript.json" --output "<project>\renders\source.ass" --font-file "<project>\assets\fonts\Inter-Black.ttf" --size 104 --accent "#30D5FF"
node "<skill-dir>\scripts\audit-caption-width.mjs" --ass "<project>\renders\source.ass" --font-file "<project>\assets\fonts\Inter-Black.ttf" --output "<project>\manifests\audits\caption-width.json"
node "<skill-dir>\scripts\burn-in-captions.mjs" --input "<project>\raws\source.mp4" --ass "<project>\renders\source.ass" --output "<project>\renders\final\source-subs.mp4" --fonts-dir "<project>\assets\fonts"
node "<skill-dir>\scripts\build-cover.mjs" --scan --input "<project>\raws\source.mp4" --output "<project>\snapshots\cover-scan.png"
node "<skill-dir>\scripts\build-cover.mjs" --project "<project>" --input "raws\source.mp4" --frame 19.0 --line "esta skill te da" --line "*10 ganchos*" --line "para tu próximo video" --anchor bottom --fit
node "<skill-dir>\scripts\deliver-package.mjs" --project "<project>"
node "<skill-dir>\scripts\capture-overlay-frames.mjs" --project "<project>"
node "<skill-dir>\scripts\composite-overlays.mjs" --project "<project>" --input "<project>\raws\source.mp4" --output "<project>\renders\final\source-overlays.mp4"
node "<skill-dir>\scripts\deliver-package.mjs" --project "<project>"
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
- `check-overflow.cjs`: inspect visible DOM boxes for clipped/off-frame text. Browser compositions only — it cannot see burned-in captions.
- `scan-text-inventory.mjs`: catch leaked metadata strings such as `question hook`.
- `freeze-caption-font.mjs`: copy a caption font into the project. Defaults to the bundled Inter Black (SIL OFL, licence copied alongside); `--bundled` picks another shipped font, `--system` takes the heaviest sans installed on the machine, `--source` takes a file or direct URL.
- `transcribe-media.mjs`: extract speech audio from any video/audio file and produce a word-level transcript, reporting low-confidence words to take to the Transcript Approval Gate.
- `build-burn-in-captions.mjs`: build an `.ass` subtitle file from an approved transcript, reading the font family from the TTF name table and inserting explicit line breaks measured against the real font metrics.
- `audit-caption-width.mjs`: pre-encode read-only gate that measures every caption line against the usable width and fails with the offending lines. The burn-in equivalent of `check-overflow.cjs`.
- `burn-in-captions.mjs`: burn an `.ass` file into a video in a single encode pass, copying the original audio.
- `build-cover.mjs`: `--scan` writes a head-and-shoulders contact sheet for choosing the cover frame by looking at it; the build mode extracts that frame at native resolution and composes the house headline onto it. Takes the headline as repeated `--line`s, sets the words wrapped in `*asterisks*` at the big size so the emphasis lands per word rather than per line, places the single block with `--anchor top|center|bottom`, and with `--fit` grows the type until the widest line fills the usable width (`--small-size`/`--big-size` set the starting ratio). Gates text width against the real font metrics, verifies the rendered fill colour against the requested hex, and reports whether the block survives the profile grid's centred square crop. The legacy `--top/--big/--bottom` form still builds the fixed three-line block.
- `verify-render.mjs`: confirm duration, resolution, video stream, audio stream, and output path.
- `capture-overlay-frames.mjs`: read `manifests/overlays.json`, render each item (`textcard`, `steplist`, `punch`) with `assets/overlay-template.html` via Playwright, and write transparent PNG frames plus `renders/overlay-frames/capture-manifest.json`. The template itself is reusable; the JSON content describing what each overlay says is not — write it fresh per video from that video's own transcript.
- `composite-overlays.mjs`: read `overlays.json` + the capture manifest, refuse to proceed if two items share a screen zone at an overlapping time, and composite every item onto the source video in one ffmpeg `filter_complex` pass.
- `deliver-package.mjs`: copy the final video(s), the cover PNG, the post description and a readable plain-text transcript into one descriptively named folder in the user's Downloads, then open that folder in the file manager. Ships no JSON or other intermediates. Refuses to deliver under a placeholder slug. Mandatory final step of every branch.

If an existing project still has older local tools such as `render-local.cjs`, `snapshot-qa.cjs`, or `check-overflow.cjs`, those may be used for that project, but migrate repeated behavior back into the bundled scripts.

## Verification Gate

Before reporting completion:

- Run a text inventory over generated HTML/source for leaked metadata such as `OpenAI skill`, `question hook`, `Pregunta hook`, file titles, or internal labels.
- Before launching the full frame-by-frame caption render, render the caption HTML at 3-5 representative timestamps (screenshots on a dark background) and verify: spelling (against the transcript approved at the Transcript Approval Gate), position (does not cover the face, inside safe zones), and that no word overflows horizontally. An error caught here costs seconds; caught after the render it costs the full cycle.
- Snapshot affected timestamps before final render or assembly.
- Run overflow/layout checks on affected timestamps. For burned-in captions this means `audit-caption-width.mjs`, which must pass before the encode; `check-overflow.cjs` cannot see them.
- After rendering or assembly, verify each final MP4 has:
  - expected duration;
  - the SOURCE's dimensions for user-supplied footage (never downscaled — see **Never Downscale The Source**), or `1080x1920` for compositions this skill generates from scratch, unless the user requested another format;
  - H.264 or expected video stream;
  - AAC or expected audio stream;
  - clear output path.
- Extract or inspect at least one rendered frame near any repaired region and near each splice boundary.
- Run ffmpeg silencedetect over each final MP4: no splice pause may exceed ~0.9s of silence. Splice pauses must stay comparable to the natural pauses between spoken phrases.

## Delivery Package (mandatory final step, every branch)

A file buried in `renders\final\` next to manifests, audits and snapshots has not been delivered. Every finished run ends by gathering the deliverables into the video's own folder, `<Documents>\social-video-producer\<slug>\` — the script derives it from the project's location under `.work\`:

```powershell
node "<skill-dir>\scripts\deliver-package.mjs" --project "<project>"
```

- It lives inside the project, which lives inside the working directory — that is what makes the links clickable. The script refuses to run under a placeholder slug (`tmp-0826`, `video1`, `final2`), because the whole point is that the user can tell which video is which from the folder name.
- Large files are hardlinked rather than copied, so the tidy folder costs no extra disk. Editing a delivered file edits the one in `renders\final\` too — they are the same bytes. Re-run with `--overwrite` after a re-render.
- The folder contains exactly four kinds of thing:
  - every final video from `renders\final\`;
  - the cover `<slug>-portada.png`;
  - the post description `<slug>-caption.txt`;
  - `<slug>-transcript.txt`, the full transcript as readable wrapped prose.
- **The word-level transcript JSON does NOT ship.** It is a build input for the caption pipeline, not a deliverable. It stays in the project under `assets\voice\`. The same goes for every other intermediate: manifests, audits, snapshots, segment renders, the extracted WAV. A delivery folder is what the user consumes, not a copy of the workspace.
- Add something else only when the user would actually use it, via `--extra` (the `.ass` when they may want to re-edit subtitles, the attribution text for licensed music).
- **Hand over clickable links, and know exactly what is clickable.** Three rules learned the hard way:
  - A link works only when its href is a path **relative to the working directory and inside it**. A path that escapes the working directory fails with "outside the working directory", so `../Downloads/...` never works from `Documents`.
  - A `file:///` URL is never clickable here. Do not use one.
  - **A folder link cannot be opened. Verified twice on this harness:** a path outside the working directory fails with "outside the working directory", and a folder path *inside* it fails with "no se pudo encontrar este archivo" even when the folder demonstrably exists — the viewer resolves files only. Do not offer a folder as a clickable link, and do not promise one. If the user asks for one, say plainly that this interface cannot do it and give them the two things that work.
- **To give the user a one-click "open the delivery folder", use a shell command block.** The harness puts a Run button on any fenced ` ```bash ` block, so this is the click that actually opens the folder — the thing a markdown link cannot do. Always include it, right at the top of the handoff:

  ````text
  ```bash
  explorer.exe "<Documents>\social-video-producer\<slug>"
  ```
  ````

  (`open` on macOS, `xdg-open` on Linux.) When the user asks for "a clickable link to the folder", this is the answer — not an apology about what links cannot do. Reach for a Run block whenever the goal is an action rather than viewing a file.
- Then, underneath: **one link per file**, relative to the working directory — `[<slug>-subs.mp4](social-video-producer/<slug>/<slug>-subs.mp4)` — and the absolute path as plain text to copy-paste. The script also opens the folder once on its own when it finishes.
- The script also opens the folder in the file manager (`--no-open` to skip), which is the only way a folder actually opens for the user.
- Still send the final video itself through the normal file-sending path so it previews in the conversation. If it is too large to upload, say so plainly and point at the folder.

- Report exact final paths, segment paths when relevant, manifests, HeyGen ids/page URLs, and any remaining risk — after the delivery folder link.
