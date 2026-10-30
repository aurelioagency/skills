---
name: motion-reel-ingest
description: Prepare mixed raw-video batches and scripts for motion-reel, classify and rename takes after map approval, convert HDR once, and manage a continuous Windows inbox watcher that starts Claude Code only for new ready batches. Use for incoming footage folders, batch intake, watcher setup, status and recovery.
---

# Motion Reel Ingest

This skill owns batch preparation and the AI-free inbox watcher. `motion-reel` owns video production; `motion-reel-pipeline` owns the full workflow order. A single edited video or already organized takes can go directly to production.

## Intake

Read [BATCH.md](reference/BATCH.md) when processing footage. Use this skill's `scripts/batch-takes.py`. Scan/transcription, classification against the script, resource identification, map review, reversible renaming and shared SDR conversion belong here. Never rename before the user approves the actual map. Never delete discarded takes.

For a watched batch the watcher has already moved the whole folder from `Crudos` to `En proceso/<batch-id>`. Work there; preserve the ID. Runtime batch data is `<batch>/.ingest/`. For legacy work with existing `<Documents>/motion-reel/.work/_lote-<name>` state, reuse that state rather than retranscribing or renaming again.

Write one brief per topic under `.ingest/briefs/`: topic, absolute take paths by part, actual hook numbers, body/CTA order, script excerpt, confirmed resource URL, uncertain words and recording issues. Use SDR copies where available. Hand the briefs to `motion-reel` through the pipeline. Hook animation reuse belongs to `motion-reel/reference/VARIANTS.md`.

For watched jobs use `<Videos>/Motion Reel/Entregas/.work/<unique-topic-slug>` for production projects. The existing production packager then writes `<Videos>/Motion Reel/Entregas/<unique-topic-slug>`. Avoid collisions across batches; keep existing projects where they are. The source batch stays in `En proceso` through all review and publishing stages.

## Watcher setup and operation

Read [WATCHER.md](reference/WATCHER.md) for setup, readiness, commands and failure recovery. The script never calls a model to check folders. The Windows task keeps it alive; Claude Code runs only for a queued batch or an explicit user continuation. Polling is continuous every 10 seconds, with 60 seconds of unchanged files after `LISTO` is present. No daily AI automation is used.

The watcher starts `motion-reel-pipeline` in a separate Claude Code session with installed user skills. Preserve skill approval gates and configured tool permissions. Missing credentials, CLI, dependencies or MCP connections are setup failures; do not bypass permissions to proceed.

At every human gate, write `<batch>/REVIEW.md` with the actual review material's absolute paths, concise findings and exact question, then return. The watcher stores the final response and session ID. Show the material to the user when they open the session. Continue through `watch.py resume` with their actual reply, or open the saved session interactively while the watcher is idle for that job. Never run both on the same session at once.

Only after the user confirms the entire job is complete, use `archive --confirm-complete` to move the source batch to `Archivados`. Moving source files changes their absolute paths: reopening an archived production project requires restoring the batch to its original `En proceso/<id>` location first. Work projects and deliveries are retained. Failures and pending reviews remain in `En proceso`.
