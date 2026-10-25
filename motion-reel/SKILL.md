---
name: motion-reel
description: Create code-rendered product reels, launch videos, showreels and promos, or animate the user's talking-head footage with resource demos, punch-ins, cutaways, synchronized sound, subtitles and a cover. Use for motion-reel requests and motion graphics on filmed videos. Branch A starts from a product; Branch B starts from footage.
model: claude-opus-5-5
effort: high
---

# Motion reel

Opus plans, writes original animation code and judges visual quality. Scripts perform the mechanical work. A film is `window.seek(t)` in Chromium, encoded by FFmpeg; Opus does not generate video pixels. Local Whisper is also AI, but consumes no Claude tokens.

## Execution contract

Use `python "<skill>/scripts/pipeline.py" <stage> --project "<project>"`. Read [PIPELINE.md](reference/PIPELINE.md) once for config and commands. Run scripts from the installed skill; project copies are recovery snapshots. Projects live at `<Documents>/motion-reel/.work/<descriptive-topic-slug>`; delivery at `<Documents>/motion-reel/<slug>`. Resolve Documents from the environment. Init refuses nonempty folders. Infer the topic before naming; never reuse another session's project.

Read references only for the current stage. Do not load all scripts, logs or images. stdout is compact; inspect `manifests/logs` only on failure. Reuse cached results rather than re-transcribing, re-capturing, re-rendering or rebuilding captions manually. Run `status` when resuming.

Approvals are real user decisions: show the actual material in the message body and wait. Record received approval using `approve --gate ... --note "<actual user OK>"`. Never fabricate approval or treat a successful script as approval. Changed inputs invalidate dependent approvals. Existing authorization counts when it covers the exact material.

Keep creative decisions with Opus. Subagents are optional for bounded tasks that warrant their extra context cost; never create one to run a script. See [MODELS.md](reference/MODELS.md). Do not promise a token saving percentage without comparable measured runs.

## Branch B: filmed talking head

Use actual SDR 9:16 footage at native resolution. Raw takes need preparation; edited footage goes directly to transcription. Infer spoken language before setting `language`; Spanish is only the initial default. Ask only for missing information that cannot be found. Use the user's resources; disclose additional sites/assets you find in the plan.

1. **Initialize:** `init --branch B --source "<edited-video>"` or `init --branch B --takes "<take1>" "<take2>"`. Determine take order from numbered/descriptive names, then speech if needed. For raw takes read [PREP.md](reference/PREP.md), run `prepare`, inspect ranges, start/end faces, false-start evidence, color and cover candidates. Color defaults to 35%; joined voice to -21.5 LUFS, true peak ≤ -1 dBTP. Set `edits.keep/cut` and cover input in config. Show cuts/color/cover; obtain `cuts` approval. Run `join`, send union preview, obtain `union` approval before transcription of the joined source.
2. **Transcript:** `transcribe` extracts audio, runs local Whisper, freezes the font and produces shot evidence. Correct spelling/register against the audio; ask only about ambiguous spoken words/names/numbers. Preserve raw JSON; write `transcript/approved.json`. Show full corrected text, hook, CTA, shot ranges and check strip; obtain `transcript` approval. [SUBTITLES.md](reference/SUBTITLES.md) S2 details corrections.
3. **Plan:** read [RULES.md](reference/RULES.md) and [ANIMATION.md](reference/ANIMATION.md). Configure resource URLs and run `assets`. First propose layouts and reasons: full footage, split, cutaways or a mix. Write `docs/overlay_plan.md`: trigger/time, shot type, what the image adds beyond subtitles, exact text, entrance, sound and a **Slam / impact** column. Explicitly list every slam/impact with second and trigger word. Nothing animates from second 0: the first row starts once the camera has settled and 1–3 s after the first spoken word; the Aurelio close lands early enough to finish (RULES.md Branch B). Keep faces, subtitle band and platform UI clear. Show the table; obtain `plan` approval before writing scenes.
4. **Animate:** Opus writes `film/film.js`, one scene per approved moment with the `OV` kit. Real assets, no invented UI, no copied reference motifs, no non-key phrase echoing subtitles. Animate the footage too: punch-ins, reframing, demos and cutaways under uninterrupted speech. No HTML subtitles. Read [ENGINE.md](reference/ENGINE.md) only for unfamiliar APIs; use `matte.py` only when a behind-person layer is needed. Visual code must not depend on `TL.mix` or `TL.sfx`.
5. **First look:** run `draft` for automatic cues, SFX, mandatory music, mix, capture, captions, width checks and review sheets. SFX bus -3 dB, bed 34 dB below narration; edited voice keeps its original level. Send the subtitled draft immediately as an unpolished first build. Apply feedback until the user approves `first-look`, before creative critique.
6. **Review:** follow the shared process below, then obtain separate `draft` approval on the latest video before `final`.
7. **Finish:** choose cover photo/headline and caption content in config. Read [COVER.md](reference/COVER.md) for composition exceptions and [DELIVERY.md](reference/DELIVERY.md) for text rules. Run `final`, then `deliver`: native master, subtitles, one cover frame with matching silence, checks and explicit final files. Inspect full cover/grid crop and final review images. Show video, cover and full caption. `publish` needs their explicit approval and retains work for future revisions.

Captions: Neue Montreal Bold 104px at design width 1080, white, shadow 6, outline/blur 0, one word at a time. One continuous shot uses one Y despite punch-ins; actual separate shots may have separate zones. Correct placement in the draft via `captions.zones`. Final scales approved draft zones and typography to native resolution, never re-detects them. No-face fallback zones require visual verification. Cover: white, three lines, sizes 68/166, bottom anchor, never auto-fit.

## Branch A: product film

Read [BRANCH_A.md](reference/BRANCH_A.md) for intake/creative details. `init --branch A [--preset <name>]`; fill brief, resource URLs, timeline, style guide and shotlist. Run `assets`. Use supplied music or synth; external voiceover only when requested with applicable credit approval. Obtain `plan` approval, then Opus builds deterministic spring-driven scenes with beat timing. `draft` handles music/grid, configured VO placement, sound, capture and review. Follow the same first-look, critique, draft approval, final and delivery stages. Final: 60fps, requested formats, -14 ±0.5 LUFS, true peak ≤ -1 dBTP. Never apply that normalization target to Branch B narration.

## Shared review and completion

Technical checks are code; creative quality still needs visual judgment. Verify determinism once (`node <skill>/scripts/render.mjs --verify --all` from the project). After first-look approval, read [CRITIQUE.md](reference/CRITIQUE.md), inspect rendered contact, phone/safe-zone views and motion strips; record eight scores with evidence in `docs/review_log.md`. An independent Opus critic may receive only the plan, approved transcript, compact metrics and relevant images.

Stop at all scores ≥8 or after three rounds. Another round requires an unresolved issue or new change. Fix the three largest problems; inspect changed moments and affected outputs, with a final whole-film check. Never change an approved creative idea while polishing. Report unresolved scores below 8.

Send the latest draft for `draft` approval. `final` uses resource-bounded parallel segments at native size (2160×3840 for vertical 4K sources), with the timeline fps and final motion blur. Never substitute a draft or lower resolution/fps/effects to meet a deadline. `--range` is a layout-size preview, never a final segment. For legacy projects use `render-final.py`; read [PIPELINE.md](reference/PIPELINE.md#parallel-final-rendering). Keep the owning command alive in the host's background execution session and wait for completion; never launch orphan workers. Code verifies every segment and the joined master before delivery. Report measured durations from `manifests/commands.jsonl`, never invented ETAs or guaranteed speedups. Deliver accessible links/previews using the host's conventions. Publishing is a separate approved action; local Drive copy does not prove cloud upload finished. Shared visual conventions do not authorize editing other skills.
