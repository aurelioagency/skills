# HeyGen AI Avatar Video — Modular Video Skill

An agent skill for producing short vertical videos (TikTok / Reels / Shorts, 1080×1920) with a modular architecture:

```
opening (HeyGen avatar) + body (HyperFrames animation) + outro (HeyGen avatar)
```

It covers the full pipeline: script parsing, ElevenLabs TTS, HeyGen avatar/lip-sync segments, locally rendered animated body, word-level captions, segment assembly, and QA/verification gates — while protecting paid provider usage (plan audits, job queues, frozen assets) and video quality (strict encode budget).

Works with agent harnesses that support file-based skills (Claude Code, Codex, and similar).

> **Note — this skill needs a real machine.** Production runs on Claude Code (the CLI in a terminal is enough; the desktop app also works). The claude.ai web chat cannot run it: its sandbox has no persistent disk for project folders, cannot call the HeyGen/ElevenLabs APIs, and cannot render video with ffmpeg/Playwright. The web chat is still great for preparing your script and filling in [PROMPT-template.md](PROMPT-template.md) conversationally — then paste the finished prompt into Claude Code on a computer to produce.

## What's in this folder

| Path | Purpose |
|---|---|
| [SKILL.md](SKILL.md) | The skill itself: branches, workflow, gates, hard rules |
| [references/video-production-guidelines.md](references/video-production-guidelines.md) | Production guide for captions, animation, spacing, and render decisions |
| [scripts/](scripts) | Bundled Node helpers (project init, TTS, HeyGen job queue, render, assemble, QA) |
| [agents/openai.yaml](agents/openai.yaml) | Agent interface metadata |
| [PROMPT-template.md](PROMPT-template.md) | Ready-to-fill prompt for assembly-only jobs (no paid providers) |

## Key features

- **Modular segment-first pipeline** — openings, body, and outro are independent segments; changing one never re-renders the rest.
- **Paid-provider protection** — plan audit gate before any HeyGen submission, per-job claim/lease queue for concurrent workers, mandatory freezing of every paid output.
- **Approval gates** — the agent must get explicit user approval for the creative proposal (palette, transitions, caption style, end card) and for the ASR transcript before rendering any caption.
- **Encode budget** — hard limit of 2 encode generations per pixel; all per-segment effects composited in a single ffmpeg pass (CRF 10 intermediate / CRF 14 final, `setsar=1` after crop+scale).
- **Caption safety** — face-aware caption positioning, platform safe zones (nothing below y=1440 / above y=220), 2-word chunks, overflow checks.
- **Verification gates** — text-inventory scan for leaked metadata, snapshot QA at representative timestamps, final MP4 stream/duration/resolution checks.

## Installation

**Option A — let your agent install it (recommended).** Open Claude Code and paste:

```text
Install the heygen-ai-avatar-video skill from https://github.com/aurelioagency/skills :
1. Run: git clone --filter=blob:none --sparse https://github.com/aurelioagency/skills.git into a temporary folder.
2. Inside it, run: git sparse-checkout set heygen-ai-avatar-video
3. Copy the heygen-ai-avatar-video/ folder into ~/.claude/skills/heygen-ai-avatar-video/
4. Delete the temporary clone and confirm the skill loads.
5. Check the requirements: Node 18+, ffmpeg, and Playwright. Install anything
   missing (ask me to approve each install command).
6. Explain how to use the skill, tell me where PROMPT-template.md ended up on my
   machine, and ask me if we start my first video now.
```

The agent fetches only this skill (not the whole collection), installs it permanently in `~/.claude/skills/` for all future chats, and walks you into your first job. [PROMPT-template.md](PROMPT-template.md) also self-installs the skill if it is missing, so for assembly-only jobs you can skip this step entirely and just paste the filled template.

**Option B — manual.** Clone the repo and run the bundled installer:

```powershell
git clone https://github.com/aurelioagency/skills.git
cd skills
node install-skills.mjs heygen-ai-avatar-video          # Claude Code
node install-skills.mjs heygen-ai-avatar-video --codex  # Codex
```

Any other harness: point it at this folder's `SKILL.md`.

## Updating

Improvements land in this repo; your installed copy never updates itself. To update, re-run the installer — it replaces the installed skill cleanly, **preserves the `node_modules` you installed inside it** (Playwright keeps working), records the installed commit in `.installed-from.json`, and prints the old and new commits. Open Claude Code and paste:

```text
Update my installed heygen-ai-avatar-video skill from https://github.com/aurelioagency/skills :
1. If I have a clone of the repo, run git pull in it; otherwise make a temporary
   sparse clone like in the install prompt.
2. In the clone, run: node install-skills.mjs heygen-ai-avatar-video
3. The installer prints the previous and new commit. Summarize what changed
   between them (git log --oneline <old>..<new> -- heygen-ai-avatar-video) in my language.
4. Confirm the skill still loads and that Playwright still resolves from the
   installed skill's scripts. Delete the temporary clone if you made one.
```

To find out whether you are behind without installing anything, run this in an up-to-date clone:

```powershell
node install-skills.mjs heygen-ai-avatar-video --check
```

It compares the commit recorded in your installed copy against the checkout, counting only commits that touch this skill (exit code 3 means an update is available). Teams working on the repo can keep a permanent clone: updating is just `git pull` + the installer command.

> Installed before `.installed-from.json` existed? The first re-install starts the tracking; from then on `--check` and the update summaries work.

## Requirements

- **Node.js 18+** (bundled scripts are plain `node`, no install step).
- **ffmpeg** on `PATH`, or set `FFMPEG_PATH`, or pass `--ffmpeg` to the scripts.
- **Playwright** (for HyperFrames rendering, snapshots, and overflow checks): `npm i playwright` where the scripts run.
- **ElevenLabs**: set `ELEVENLABS_API_KEY` (env var or a `.env` in the project folder) — only for TTS branches.
- **HeyGen**: set `HEYGEN_API_KEY` — only for avatar-generation branches.

The assembly-only workflow in [PROMPT-template.md](PROMPT-template.md) requires **no paid provider keys** at all.

## Usage

Once installed, the skill lives in `~/.claude/skills/heygen-ai-avatar-video/` and is available in **every** Claude Code session on the machine, forever. Nothing is re-installed per video. Videos themselves never go there: each job gets its own project folder (default `Documents\videos\<video-name>\`), created automatically by the skill.

There are two ways to use it:

### Mode 1 — full production from a script (no template needed)

Open a Claude Code session anywhere and describe the job in your own words, for example:

> Turn `C:\...\script.md` into a modular vertical video: 3 openings, animated body, outro. HeyGen avatar `<id>`, ElevenLabs voice `<id>`.

The skill triggers automatically by matching your request (you can also invoke it explicitly with `/heygen-ai-avatar-video`). From there it drives everything and asks for what it needs:

1. Shows you a **creative proposal** (color palette, transitions, caption style, end card, act structure) and waits for your approval — nothing is generated or spent before this.
2. Creates the project folder with its full structure (source, manifests, assets, renders, snapshots).
3. Generates the TTS audio and shows you the **transcript for approval/corrections** before rendering any caption.
4. Audits the paid-provider plan (only openings/outro may cost money, never the full script), generates the avatar clips, and freezes them locally.
5. Renders the animated body locally, runs visual QA (safe zones, overflow, spelling), assembles the finals within the 2-encode quality budget, and verifies each MP4.
6. Reports the final video paths under `renders\final\`.

### Mode 2 — assembly-only job (use the template)

Use [PROMPT-template.md](PROMPT-template.md) when the avatar clips and body audio **already exist** and you only need the animated body plus final assembly — zero paid API calls. This is a deliberate manual copy-paste flow, so you see and control the exact work order before sending it:

1. Open `PROMPT-template.md` — it is installed with the skill, so it is already on your machine at `~/.claude/skills/heygen-ai-avatar-video/PROMPT-template.md` — and fill in what you can. **You don't need to type any file paths**: leave them as placeholders and the agent creates the whole project structure plus a `raws\` folder, then tells you to drop this video's files in there (descriptive names like `intro`, `body`, `outro` help but aren't required). If your files already live somewhere else — or you drag them into the chat — the agent copies them into `raws\` for you. Either way it probes each file and shows you its proposed opening/body/outro mapping for confirmation before touching anything, your originals are never modified, and the finished videos come back in the same project under `renders\final\`. Do fill the brand names / proper nouns: nobody can guess those.
2. Copy the whole text and paste it as your **first message** in a Claude Code session. That paste *is* the invocation — the header even installs the skill first if the machine doesn't have it yet.
3. The same approval gates still apply (transcript, creative proposal) before anything renders.

If you'd rather not edit the file by hand, ask the agent to fill it with you: it will ask for each value conversationally, show you the completed prompt, and confirm before starting.

### Multiple videos and repairs

- Each video = its own project folder. Making video #2 creates a new folder and never touches video #1.
- To fix an existing video, point the skill at its project folder (e.g. *"fix the caption at 0:12 in `Documents\videos\my-video`"*). It reads that project's manifests and re-renders only the affected segment, reusing everything else — including the frozen paid HeyGen clips, so repairs cost nothing.

All per-project data (product names, proper nouns, paths, style preferences) lives in your prompt or conversation; the skill itself stays project-agnostic.

## License

MIT — see [LICENSE](../LICENSE) at the repo root.
