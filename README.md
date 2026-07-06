# Aurelio Agency — Agent Skills

A collection of reusable skills for AI coding agents (Claude Code, Codex, and similar harnesses). Each skill lives in its own folder with a `SKILL.md` entry point plus its bundled references, scripts, and templates.

## Available skills

| Skill | Description |
|---|---|
| [heygen-ai-avatar-video](heygen-ai-avatar-video/) | Modular short-video production (TikTok / Reels / Shorts): HeyGen avatar openings/outro + HyperFrames animated body, ElevenLabs TTS, word-level captions, approval gates, encode budget, and QA/verification gates. |

## Quick start — let your agent do everything

No manual setup needed. Open Claude Code and paste:

```text
Install the heygen-ai-avatar-video skill from https://github.com/aurelioagency/skills :
clone the repo to a temporary folder, copy the heygen-ai-avatar-video/ folder into
~/.claude/skills/, and confirm the skill loads.
```

Then just describe your video job in the same session — the skill triggers automatically. Each skill's prompt template (e.g. [PROMPT-template.md](heygen-ai-avatar-video/PROMPT-template.md)) also self-installs the skill if it is missing, so you can simply fill in the placeholders and paste it as your first message.

## Manual installation

Clone the repo and copy the skill folder you want into your agent's skills directory:

```powershell
git clone https://github.com/aurelioagency/skills.git
```

- **Claude Code**: copy the skill folder to `~/.claude/skills/<skill-name>/` (or your project's `.claude/skills/`).
- **Codex**: copy it to `~/.codex/skills/<skill-name>/`.
- Any other harness: point it at the skill's `SKILL.md`.

Each skill's own README documents its requirements and usage.

## License

MIT — see [LICENSE](LICENSE). Applies to every skill in this repo.
