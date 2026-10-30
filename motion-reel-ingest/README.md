# Motion Reel Ingest

Incoming footage → classified batch → approved names → shared SDR → production briefs.

Includes a persistent **Python watcher with no AI inference**. It watches the current Windows user's Videos folder, claims ready batches, and starts Claude Code only when there is new work. Claude performs the semantic classification and follows `motion-reel-pipeline`.

## Install the package

From this repository:

```powershell
node install-skills.mjs motion-reel-ingest motion-reel-pipeline motion-reel resource-page replykaro-automation post-for-me
```

Requires Windows, Python 3.10+, authenticated Claude Code, FFmpeg and faster-whisper for batch processing, plus the production/integration dependencies of the other skills. The watcher itself needs no Python packages. On native Windows, the repository installer automatically runs watcher setup after copying the full package. Setup discovers/installs Claude Code, requests account login when needed, creates the folders and registers, starts and checks the Windows task. Missing prerequisites leave setup explicitly incomplete.

When installing by copying skill folders, the installing agent must run setup as the final installation step. The same command repairs an incomplete installation; no executable path is normally needed:

```powershell
powershell -NoProfile -File "$env:USERPROFILE\.claude\skills\motion-reel-ingest\scripts\install-watch.ps1"
```

Place each recording batch (mixed videos + script) in `Videos/Motion Reel/Crudos/<batch-name>`, then add an empty `LISTO` file after copying finishes. After 60 stable seconds it moves to `En proceso/<uuid>`, leaving the inbox free. Polling runs every 10 seconds and continues while Claude works. One Claude worker at a time; additional batches queue.

Claude first presents the classification map for approval. Renaming happens in En proceso after that approval. Further creative and publication approvals remain in force. REVIEW.md and CLAUDE-RESULT.txt inside the batch show pending work; `watch.py status` lists sessions and state. Resume with an actual user reply; archive only after confirming completion. Final packages go to Entregas, originals to Archivados.

Read [reference/WATCHER.md](reference/WATCHER.md) for commands, permissions, recovery and stopping. The Windows task starts at user login and restarts on failure. Continuous operation requires an awake PC and a logged-in user; it does not wake a powered-off PC. No external notifications are configured.

## Checks

```powershell
python -m unittest discover -s motion-reel-ingest/tests -v
```

Tests use temporary folders and simulated Claude output. They do not call AI, modify real footage, register a task or publish media.
