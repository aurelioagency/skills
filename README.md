# Aurelio Agency — Agent Skills

A collection of reusable skills for AI coding agents (Claude Code, Codex, and similar harnesses). Each skill lives in its own folder with a `SKILL.md` entry point plus its bundled references, scripts, and templates.

## Available skills

| Skill | Description |
|---|---|
| [heygen-ai-avatar-video](heygen-ai-avatar-video/) | Modular short-video production (TikTok / Reels / Shorts): HeyGen avatar openings/outro + HyperFrames animated body, ElevenLabs TTS, word-level captions, approval gates, encode budget, and QA/verification gates. |

## Quick start — let your agent do everything

No manual setup needed. Open Claude Code and paste the install prompt of the skill you want, replacing `<skill-name>` with a folder name from the table above:

```text
Install the <skill-name> skill:
1. Run: git clone https://github.com/aurelioagency/skills.git into a temporary folder.
2. Copy only the <skill-name>/ folder from the cloned repo into ~/.claude/skills/<skill-name>/
3. Confirm the skill loads, then delete the temporary clone.
```

For example, for this repo's video skill use `heygen-ai-avatar-video` as `<skill-name>` — the exact prompt is also in [its README](heygen-ai-avatar-video/README.md).

Then just describe your job in the same session — the skill triggers automatically. Each skill's prompt template (e.g. [PROMPT-template.md](heygen-ai-avatar-video/PROMPT-template.md)) also self-installs its skill if it is missing, so you can simply fill in the placeholders and paste it as your first message.

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
