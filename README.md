# Aurelio Agency — Agent Skills

A collection of reusable skills for AI coding agents (Claude Code, Codex, and similar harnesses). Each skill lives in its own folder with a `SKILL.md` entry point plus its bundled references, scripts, and templates.

## Available skills

| Skill | Description |
|---|---|
| [brand-mascot](brand-mascot/) | **Codex only.** Creates a reusable brand mascot and consistent new poses from one canonical master, using Codex ImageGen plus local Python color correction, protected props, strict transparency, and five visual QA gates. |
| [fable-5-protocol](fable-5-protocol/) | Cost-aware quality protocol that raises cheaper Claude models (Haiku / Sonnet / Opus) toward Fable 5 discipline: answer structure, verification habits, and project/API instructions to cut spend without cutting rigor. |
| [generador-de-ganchos](generador-de-ganchos/) | Hooks for any content, from a topic in any format (text, image, PDF, link, transcript): one hook written per each of 10 psychological structures, plus an assessment of which ones actually fit that topic — where the number of recommendations is a result, not a quota. Text only, no dependencies. Answers in the language you ask in; written and calibrated for Rioplatense Spanish. |
| [heygen-ai-avatar-video](heygen-ai-avatar-video/) | Modular short-video production (TikTok / Reels / Shorts): HeyGen avatar openings/outro + HyperFrames animated body, ElevenLabs TTS, word-level captions, approval gates, encode budget, and QA/verification gates. |
| [pdf-markitdown](pdf-markitdown/) | Routes every PDF through Microsoft's MarkItDown before the agent reads it, so pages stop entering the context as images: 86–98% fewer tokens on real documents. Ships a `PreToolUse` hook that converts and cancels the direct read (a skill alone fires too late), a local Tesseract OCR fallback for scans — no API key, nothing leaves the machine — and a per-file report of tokens before, after, and saved. |
| [post-for-me](post-for-me/) | Publishing to social networks with Post for Me, plus the setup of its MCP server. Publishing: media upload, account targeting, per-platform options, a confirmation gate before anything goes out, per-account results, and marking the delivery folder with its publication date. Setup: OS and path detection, safe config editing with backups and atomic writes, app-restart handling, read-only verification, uninstall, and a diagnostic reference. Never posts anything that was not asked for and confirmed. |
| [social-carousel-generator](social-carousel-generator/) | Instagram and TikTok carousels from URLs, PDFs, YouTube videos, text, or screenshots — multi-brand: each brand keeps its own editable preset (palette, fonts, CTA, caption) and an asset bank the agent picks from by context. Editable HTML source, programmatic visual QA, adaptation between platforms, and a drag-to-Drive delivery folder with PNGs + caption.txt + a vertical MP4 for YouTube Shorts, built from the same slides with instrumental background music. |
| [video-animation-workflow](video-animation-workflow/) | Branded 15–30 second motion-graphics videos from audio, video, scripts, or topics, with persistent brand profiles, approval gates, HyperFrames source, semantic sound design, and intentional 16:9 and 9:16 layouts. |

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

MIT — see [LICENSE](LICENSE) — except where a skill folder contains its own
license. `video-animation-workflow` is free for noncommercial use under its
folder-level [PolyForm Noncommercial License 1.0.0](video-animation-workflow/LICENSE).
Bundled third-party resources retain their own licenses.
