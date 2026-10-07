# Content Diario — Daily Content Menu Skill

An agent skill that builds, every morning, a numbered menu of carousel and reel ideas from a whitelist of technical sources, and hands the one you pick to the right producer:

```
sources → novelty vs. theory → verify theory → strong news first → menu (~5 carousels + ~5 reels) → you pick → carousel or reel script
```

It only proposes and drafts. It never publishes anything.

Works with agent harnesses that support file-based skills (Claude Code, Codex, and similar). `SKILL.md` and its references are written in Spanish.

## What's in this folder

| Path | Purpose |
|---|---|
| [SKILL.md](SKILL.md) | The 6-step flow, the hard rules, and what happens when an idea is chosen |
| [references/fuentes.md](references/fuentes.md) | The source spreadsheet and how its sources are classified by category |
| [references/canales-lista-blanca.md](references/canales-lista-blanca.md) | Whitelisted YouTube channels |
| [references/verificacion.md](references/verificacion.md) | When and how theory content is re-verified, with examples |
| [references/estado.md](references/estado.md) | Format of `backlog.json`, where ideas and their status are kept |

## Key features

- **Three independent sources.** A Google Sheet of technical sources (official labs, technical press, newsletters, research, practitioners), whitelisted YouTube channels, and whitelisted Instagram reference accounts.
- **Strict whitelist.** No lab, outlet, channel, or account outside those lists ever enters the menu — a general web search is only used to find the latest item from a source that is already listed.
- **Direct links only.** Every idea carries the link to the specific article, post, video, or reel. No direct link, no idea.
- **News vs. theory.** Announcements and releases are classified apart from explanatory content.
- **Theory gets re-verified.** Older material from practitioners and papers is checked against a current source before it is proposed; official academies are the source of truth and are never re-verified.
- **Strong news takes priority.** A major release is proposed the same day as both a carousel and a reel, theory is trimmed to make room, and several simultaneous releases get one idea each plus a comparison.
- **A persistent backlog.** Ideas are never deleted, only change status; unchosen theory returns on a quiet day.
- **Delegation on pick.** A chosen carousel goes to [social-carousel-generator](../social-carousel-generator/). A chosen reel gets a ~40-second script plus 2–3 real hook options — written by this skill itself, never through `hook-generator` or `social-video-producer`.
- **Reel scripts from real transcripts.** Instagram reels go through [reels-referentes](../reels-referentes/) steps 3–4; YouTube videos through `yt-dlp` and the same local transcriber.

## Installation

**Option A — let your agent install it (recommended).** Open Claude Code and paste:

```text
Install the content-diario skill from https://github.com/aurelioagency/skills :
1. Run: git clone --filter=blob:none --sparse https://github.com/aurelioagency/skills.git into a temporary folder.
2. Inside it, run: git sparse-checkout set content-diario reels-referentes social-carousel-generator
3. Copy those three folders into ~/.claude/skills/ (content-diario depends on the other two).
4. Delete the temporary clone and confirm the skills load.
5. Check the requirements of the three skills (see their READMEs) and install anything
   missing (ask me to approve each install command).
6. Explain how to use content-diario, tell me where its files ended up on my machine,
   and ask me if we build today's menu now.
```

**Option B — manual.** Clone the repo and run the bundled installer for each skill:

```powershell
git clone https://github.com/aurelioagency/skills.git
cd skills
node install-skills.mjs content-diario
node install-skills.mjs reels-referentes
node install-skills.mjs social-carousel-generator
```

Add `--codex` to install into Codex instead. Any other harness: point it at each skill's `SKILL.md`.

## Updating

Improvements land in the repo; your installed copy never updates itself. To update, re-run the installer from an up-to-date clone — it replaces the installed skill cleanly, keeps its `node_modules`, and records the installed commit in `.installed-from.json`:

```powershell
git pull
node install-skills.mjs content-diario
```

To find out whether you are behind without installing anything:

```powershell
node install-skills.mjs content-diario --check
```

## Uninstalling

The installed skill lives in `~/.claude/skills/content-diario/`. Removing it touches nothing else. From a clone:

```powershell
node install-skills.mjs content-diario --remove
```

Or simply delete that folder yourself. Your backlog in `Documents\content-diario\` is not touched.

## Requirements

- **The two skills it delegates to:** [reels-referentes](../reels-referentes/) and [social-carousel-generator](../social-carousel-generator/), with their own requirements.
- **A browser tool** and web fetching, to read the source sites and Instagram profiles.
- **`yt-dlp`** — only to transcribe a YouTube video chosen as a reel.
- **Your own source list.** `references/fuentes.md` links the author's spreadsheet; point it at yours, and fill `canales-lista-blanca.md` and the Instagram whitelist with the channels and accounts you trust.
- **No API keys and no paid providers.**

## Usage

It is designed to run on its own through a scheduled task at 7 AM, so the menu is ready when you open the session. It can also be invoked manually:

> El menú de hoy

> Ideas para hoy

> Arrancá el contenido del día

The menu is numbered; choose any mix of carousels and reels. The skill only works on ideas you chose explicitly.

## License

MIT — see [LICENSE](../LICENSE) at the repo root.
