# HeyGen AI Avatar Video — Modular Video Skill

An agent skill for producing short vertical videos (TikTok / Reels / Shorts, 1080×1920) with a modular architecture:

```
opening (HeyGen avatar) + body (HyperFrames animation) + outro (HeyGen avatar)
```

It covers the full pipeline: script parsing, ElevenLabs TTS, HeyGen avatar/lip-sync segments, locally rendered animated body, word-level captions, segment assembly, and QA/verification gates — while protecting paid provider usage (plan audits, job queues, frozen assets) and video quality (strict encode budget).

Works with agent harnesses that support file-based skills (Claude Code, Codex, and similar).

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

Clone the repo and copy (or symlink) this skill's folder into your agent's skills directory:

```powershell
git clone https://github.com/aurelioagency/skills.git
```

- **Claude Code**: copy `skills/heygen-ai-avatar-video/` to `~/.claude/skills/heygen-ai-avatar-video/` (or your project's `.claude/skills/`).
- **Codex**: copy it to `~/.codex/skills/heygen-ai-avatar-video/`.
- Any other harness: point it at this folder's `SKILL.md`.

## Requirements

- **Node.js 18+** (bundled scripts are plain `node`, no install step).
- **ffmpeg** on `PATH`, or set `FFMPEG_PATH`, or pass `--ffmpeg` to the scripts.
- **Playwright** (for HyperFrames rendering, snapshots, and overflow checks): `npm i playwright` where the scripts run.
- **ElevenLabs**: set `ELEVENLABS_API_KEY` (env var or a `.env` in the project folder) — only for TTS branches.
- **HeyGen**: set `HEYGEN_API_KEY` — only for avatar-generation branches.

The assembly-only workflow in [PROMPT-template.md](PROMPT-template.md) requires **no paid provider keys** at all.

## Usage

1. Give your agent the skill (installed as above, or by path).
2. For a full script-to-video job: provide the script, a HeyGen avatar id, and an ElevenLabs voice id. The skill drives the modular workflow, including the approval gates.
3. For assembly-only jobs (avatar clips and audio already exist): fill in the placeholders (`<OPENING_1_PATH>`, `<PROJECT_PATH>`, `<NAMES>`, …) in [PROMPT-template.md](PROMPT-template.md) and send it as the task prompt.

All per-project data (product names, proper nouns, paths, style preferences) lives in the prompt; the skill itself stays project-agnostic.

## License

MIT — see [LICENSE](../LICENSE) at the repo root.
