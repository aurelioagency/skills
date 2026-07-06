# Aurelio Agency — Agent Skills

A collection of reusable skills for AI coding agents (Claude Code, Codex, and similar harnesses). Each skill lives in its own folder with a `SKILL.md` entry point plus its bundled references, scripts, and templates.

## Available skills

| Skill | Description |
|---|---|
| [heygen-ai-avatar-video](heygen-ai-avatar-video/) | Modular short-video production (TikTok / Reels / Shorts): HeyGen avatar openings/outro + HyperFrames animated body, ElevenLabs TTS, word-level captions, approval gates, encode budget, and QA/verification gates. |

## Quick start — one paste, fully automatic

Each skill's README has a ready-made install prompt: copy it, paste it into Claude Code, done. The agent fetches **only that skill** from this repo (sparse checkout), installs it permanently for all future chats, explains how to use it, and offers to start your first job right away.

For example, for [heygen-ai-avatar-video](heygen-ai-avatar-video/README.md):

```text
Install the heygen-ai-avatar-video skill from https://github.com/aurelioagency/skills :
1. Run: git clone --filter=blob:none --sparse https://github.com/aurelioagency/skills.git into a temporary folder.
2. Inside it, run: git sparse-checkout set heygen-ai-avatar-video
3. Copy the heygen-ai-avatar-video/ folder into ~/.claude/skills/heygen-ai-avatar-video/
4. Delete the temporary clone and confirm the skill loads.
5. Check the skill's requirements (see its README) and install anything missing
   (ask me to approve each install command).
6. Explain how to use the skill, tell me where its files ended up on my machine,
   and ask me if we start my first job now.
```

The generic pattern for any skill in the table above is the same with `<skill-name>` swapped in. Installing one skill never touches other skills you already have. Each skill's prompt template (e.g. [PROMPT-template.md](heygen-ai-avatar-video/PROMPT-template.md)) also self-installs its skill if it is missing, so you can simply fill in the placeholders and paste it as your first message.

## Manual installation

Clone the repo and install the skill you want with the bundled installer:

```powershell
git clone https://github.com/aurelioagency/skills.git
cd skills
node install-skills.mjs <skill-name>          # ~/.claude/skills/ (Claude Code)
node install-skills.mjs <skill-name> --codex  # ~/.codex/skills/ (Codex)
```

Run it with no arguments to list the available skills. Any other harness: point it at the skill's `SKILL.md`. Each skill's own README documents its requirements and usage.

## License

MIT — see [LICENSE](LICENSE). Applies to every skill in this repo.
