# Continuous Windows watcher

Requires Python 3.10+, authenticated Claude Code CLI, installed pipeline skills and their dependencies. Batch scanning additionally needs ffmpeg/ffprobe and faster-whisper in the Python used for processing. Production and downstream integrations retain their own requirements. The watcher itself uses only Python's standard library.

The default root is the current Windows user's Videos known-folder registry setting, including relocated folders. No username or drive is hardcoded. `--root` overrides it for testing/custom storage. All child folders must remain on the same volume; the watcher atomically renames ready batches and refuses symlinks/junctions. Do not place scripts or Claude project configuration from untrusted sources into the trusted `.control/workspace`.

```
Videos/Motion Reel/
  Crudos/<human-named-batch>/    videos + script + empty LISTO file
  En proceso/<uuid>/           claimed originals + .ingest + REVIEW.md
  Archivados/<uuid>/           completed source batch
  Entregas/.work/<topic>/      production working projects
  Entregas/<topic>/            source/ and output/ delivery package
  .control/                   config, job journals, logs, trusted workspace
```

## Install

Install the skill permanently before registering the task. First authenticate Claude Code interactively and verify it can access the installed skills, required tools and MCP connections. `claude -p` does not open the Desktop app; review is through local files or the saved CLI session.

```powershell
python "<skill>/scripts/watch.py" init --claude "<absolute-path-to-claude.exe>"
powershell -NoProfile -File "<skill>/scripts/install-watch.ps1" -ClaudeExe "<absolute-path-to-claude.exe>"
```

The installer registers a per-user task, starts it now, restarts on failure and starts on Windows login, with no execution time limit. It uses the logged-in user's credentials and permissions. The PC must stay on, awake and logged in for uninterrupted 24/7 operation; locked screen is fine. It resumes after login/restart. It does not change power settings or store passwords. Boot-before-login operation would require a separate service account/credential setup.

Tool permissions are inherited from Claude configuration. For unattended tools, configure explicit reviewed `allowed_tools` in `.control/config.json` or repeated `init --allow-tool` arguments; never use a blanket permission bypass. The polling loop performs no AI inference and launches at most one Claude child at a time. Multiple waiting-review jobs may coexist.

Copy a whole batch under Crudos, then create its empty `LISTO` file after upload/copy completes. Do not add more material after marking ready. The watcher checks all files remain unchanged for 60 seconds before claiming. It moves the folder out of Crudos before starting Claude, even if another batch is running; queued folders remain in En proceso. A video and script may cover several topics.

## Review and resume

```powershell
python "<skill>/scripts/watch.py" status
python "<skill>/scripts/watch.py" resume <job-uuid> --reply-file "<UTF-8-text-with-actual-user-reply>"
python "<skill>/scripts/watch.py" archive <job-uuid> --confirm-complete
```

Global `--root` must precede the subcommand if overriding the root. `status` prints batch names, IDs, states, session IDs and logs. `En proceso/<id>/CLAUDE-RESULT.txt` contains the last response; `REVIEW.md` contains review links and the question. No email, chat notification or social publication is sent by the watcher. To inspect a session interactively use `claude --resume <session-id>`; do not queue a continuation until that interactive session is closed.

Returning successfully from Claude means `waiting_review`, never automatic completion. Completion is a human decision. Approval of a map does not approve a final video or publication.

Failed runs are not automatically retried. Inspect `.control/logs`, fix the cause, and resume explicitly. After a watcher crash, a running job becomes `interrupted` and is not relaunched automatically because its child may still be running. Check Task Manager/Claude session first. A crash during claim is recovered from the journal; if the source was never moved, inspect and repair before retrying. Archive moves are journaled as well. Do not delete state to retry: that can duplicate work.

To stop/remove: use Task Scheduler, or `install-watch.ps1 -Remove -ClaudeExe unused`. Stopping the watcher may leave an existing Claude child alive; inspect it before resuming. Removing the scheduled task preserves all files and state.
