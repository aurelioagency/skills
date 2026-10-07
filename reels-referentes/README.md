# Reels Referentes — Reference Reel Research Skill

An agent skill that finds the best-performing Instagram reels from reference accounts you choose, and for the one you approve extracts the audio, transcribes the dialogue, translates it if needed, and finds the resource the reel mentions:

```
accounts → fresh search → candidates with views and link → you approve ONE → audio → transcript → translation → resource
```

It is internal research. It never posts or shares anything.

Works with agent harnesses that support file-based skills (Claude Code, Codex, and similar). `SKILL.md` and its references are written in Spanish.

## What's in this folder

| Path | Purpose |
|---|---|
| [SKILL.md](SKILL.md) | The 4-step flow and the hard rules |
| [references/cuentas-lista-blanca.md](references/cuentas-lista-blanca.md) | The reference accounts the search is limited to |
| [references/temas.md](references/temas.md) | Which topics qualify (AI news, techniques, tools, or a shareable resource) and why the link matters for each |
| [references/cobalt.md](references/cobalt.md) | Why the cobalt.tools website is used instead of its API, and the `yt-dlp` fallback |
| [references/estado.md](references/estado.md) | Format of the state files kept in `Documents\reels-referentes\` |
| [scripts/transcribir.py](scripts/transcribir.py) | Local transcription with faster-whisper, language auto-detected |

## Key features

- **Four steps, each depending on the last.** Accounts → proposal → approval → extraction. Nothing is downloaded or transcribed before you approve a reel.
- **Every round starts from scratch.** Views and rankings change constantly, so there is no queue or backlog of old candidates: you pick one and the round closes.
- **Only whitelisted accounts, only on-topic reels.** A reel with many views about something else is never proposed.
- **Views read from public profiles, no login.** Account by account at a human pace — never an aggressive loop that gets flagged as a bot.
- **Audio only, never the full video.** Downloaded through cobalt.tools in the user's real browser; if cobalt returns an image instead of audio, it falls back to `yt-dlp` instead of retrying in a loop.
- **Free, local transcription** with the language detected automatically; non-Spanish dialogue is translated by the agent itself, with no translation API.
- **Finds the actual resource.** It looks in the spoken dialogue first, then the description, and if the reel only says "comment X", it searches for the real link instead of leaving it behind the creator's funnel.
- **Doesn't cry wolf on GitHub forks.** Several repos with the same name are checked for the "forked from" label before anything is called a clone.

## Installation

**Option A — let your agent install it (recommended).** Open Claude Code and paste:

```text
Install the reels-referentes skill from https://github.com/aurelioagency/skills :
1. Run: git clone --filter=blob:none --sparse https://github.com/aurelioagency/skills.git into a temporary folder.
2. Inside it, run: git sparse-checkout set reels-referentes
3. Copy the reels-referentes/ folder into ~/.claude/skills/reels-referentes/
4. Delete the temporary clone and confirm the skill loads.
5. Check the requirements: Python 3 with faster-whisper, and yt-dlp. Install
   anything missing (ask me to approve each install command).
6. Explain how to use the skill, tell me where its files ended up on my machine,
   and ask me if we look for my first reference reels now.
```

**Option B — manual.** Clone the repo and run the bundled installer:

```powershell
git clone https://github.com/aurelioagency/skills.git
cd skills
node install-skills.mjs reels-referentes          # Claude Code
node install-skills.mjs reels-referentes --codex  # Codex
```

Any other harness: point it at this folder's `SKILL.md`.

## Updating

Improvements land in the repo; your installed copy never updates itself. To update, re-run the installer from an up-to-date clone — it replaces the installed skill cleanly, keeps its `node_modules`, and records the installed commit in `.installed-from.json`:

```powershell
git pull
node install-skills.mjs reels-referentes
```

To find out whether you are behind without installing anything:

```powershell
node install-skills.mjs reels-referentes --check
```

## Uninstalling

The installed skill lives in `~/.claude/skills/reels-referentes/`. Removing it touches nothing else. From a clone:

```powershell
node install-skills.mjs reels-referentes --remove
```

Or simply delete that folder yourself. The research files it created in `Documents\reels-referentes\` are yours and are not touched.

## Requirements

- **A browser tool** the agent can drive: the built-in browser to read views, and a real Chrome session (e.g. Claude in Chrome) to download from cobalt.tools.
- **Python 3** with `faster-whisper`: `pip install faster-whisper`.
- **yt-dlp** — fallback only, when cobalt can't pass Instagram's block for a reel.
- **No API keys and no paid providers.**

## Usage

Once installed, the skill is available in **every** session on the machine and triggers from the request:

> Buscá reels referentes de estas cuentas: @cuenta1 @cuenta2

> Sacame el diálogo de este reel: `<link>`

> Auditá las cuentas de Instagram y proponeme los reels ganadores

It proposes candidates with account, link, approximate views, topic, and a one-line reason. You open them, approve one, and it delivers the dialogue (translated if needed) and the resource it found.

It is also the research layer of [content-diario](../content-diario/), which calls its first two steps to bring reel candidates into the daily menu.

## License

MIT — see [LICENSE](../LICENSE) at the repo root.
