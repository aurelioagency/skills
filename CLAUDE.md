# Skills collection — agent onboarding

This repo is a collection of agent skills, one per subfolder containing a `SKILL.md`. When a session starts inside this repo, or when a user pastes an install prompt pointing at it, run this onboarding immediately:

1. **Identify the skill the user wants.** If they already named one (the install prompts in each skill's README do), use it. Otherwise list the available skills (folders with a `SKILL.md`, or the table in `README.md`) and ask. Never install skills the user did not choose, and never touch skills they already have installed.
2. **Install it permanently** with the bundled installer:

   ```
   node install-skills.mjs <skill-name>
   ```

   This copies only that skill into `~/.claude/skills/` so it is available in every future chat (use `--codex` for Codex). Re-running it later updates that skill only.
3. **Confirm the skill loads**, then briefly explain — in the user's language — what it does and how it is used, based on the skill's own README.
4. **Offer to start the first job right away.** For `heygen-ai-avatar-video`, ask whether they want a full script-to-video production or an assembly from existing clips/audio. For assembly, offer to fill `heygen-ai-avatar-video/PROMPT-template.md` together: ask for each placeholder value conversationally, show the filled prompt, and ask "Do I apply this prompt and start?" before proceeding.
5. **Check requirements** for the chosen skill (Node, ffmpeg, Playwright, API keys per its README) and help set up anything missing.

Once a job starts, always respect the skill's own approval gates and hard rules.
