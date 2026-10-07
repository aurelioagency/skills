# ReplyKaro Automation — Comment-to-DM Skill

An agent skill that creates, in [ReplyKaro](https://www.replykaro.com), the "comment the word, get the resource by DM" automation with a follow gate — only people who follow the account receive the resource:

```
approved reel + resource URL → fixed base template + per-reel message and link → create on each account → read it back and verify
```

It works for a reel that hasn't been posted yet (the default), the latest one, or a specific one. It never posts anything to Instagram.

Works with agent harnesses that support file-based skills (Claude Code, Codex, and similar). `SKILL.md` is written in Spanish.

## What's in this folder

| Path | Purpose |
|---|---|
| [SKILL.md](SKILL.md) | The skill: commands, the exact final state, limits, known errors, how to test |
| [scripts/replykaro.mjs](scripts/replykaro.mjs) | The CLI: `check`, `create`, `list`, `media`, `update`, `delete` |
| [references/plantilla-base.json](references/plantilla-base.json) | The fixed part of the automation: keyword, greeting, follow gate, public replies |

## Where it sits in the flow

1. [social-video-producer](../social-video-producer/) delivers the approved video.
2. [resource-page](../resource-page/) creates the resource's web page and returns its URL.
3. **replykaro-automation** creates the automation with `--link <that URL>`.

## Key features

- **Uses ReplyKaro's MCP endpoint, not its REST API.** The plain REST route silently drops the greeting, the follow-gate texts, the final message, and extra buttons. The MCP `create_automation` tool stores everything, and the script uses REST only to list, read, and delete.
- **Verifies what it saved.** After creating, it reads the automation back and fails loudly if the follow gate, greeting, follow button, final button, or link isn't what was asked.
- **Fixed template, two variables.** Only the final message and the resource link change per reel; the keyword, greeting, follow gate, and public replies come from the base template.
- **One link, in the button.** The final message carries no links; the single resource URL goes on the button (max 20 characters, e.g. "Abrir Scrapling").
- **Multiple accounts at once.** Keys for each Instagram account live in `~/.replykaro/keys.json`, outside the repo. Without `--account`, it acts on all of them, and one failing doesn't stop the other.
- **Handles the free plan's 3-active limit.** Before creating it counts the active automations of each account and deletes the oldest when there are already 3, reporting it in the output.
- **Edits in place.** `update` re-applies greeting, buttons, message, and link without deleting and recreating.
- **`--dry-run`** shows exactly what would be sent, creating nothing.
- **Public replies warn about hidden requests.** Instagram can route the DM to "Requests" or "Hidden requests"; the three public comment replies tell people where to look.

## Installation

**Option A — let your agent install it (recommended).** Open Claude Code and paste:

```text
Install the replykaro-automation skill from https://github.com/aurelioagency/skills :
1. Run: git clone --filter=blob:none --sparse https://github.com/aurelioagency/skills.git into a temporary folder.
2. Inside it, run: git sparse-checkout set replykaro-automation
3. Copy the replykaro-automation/ folder into ~/.claude/skills/replykaro-automation/
4. Delete the temporary clone and confirm the skill loads.
5. Check the requirements: Node 18+ and the ReplyKaro API key file. Walk me through
   creating the key without me pasting it into the chat.
6. Explain how to use the skill, tell me where its files ended up on my machine,
   and ask me if we create my first automation now.
```

**Option B — manual.** Clone the repo and run the bundled installer:

```powershell
git clone https://github.com/aurelioagency/skills.git
cd skills
node install-skills.mjs replykaro-automation          # Claude Code
node install-skills.mjs replykaro-automation --codex  # Codex
```

Any other harness: point it at this folder's `SKILL.md`.

## Updating

Improvements land in the repo; your installed copy never updates itself. To update, re-run the installer from an up-to-date clone — it replaces the installed skill cleanly, keeps its `node_modules`, and records the installed commit in `.installed-from.json`:

```powershell
git pull
node install-skills.mjs replykaro-automation
```

To find out whether you are behind without installing anything:

```powershell
node install-skills.mjs replykaro-automation --check
```

## Uninstalling

The installed skill lives in `~/.claude/skills/replykaro-automation/`. Removing it touches nothing else — automations already created stay in ReplyKaro. From a clone:

```powershell
node install-skills.mjs replykaro-automation --remove
```

Or simply delete that folder yourself. Your keys in `~/.replykaro/` are not touched.

## Requirements

- **Node.js 18+** — the script is plain `node`, no install step.
- **A ReplyKaro account per Instagram account**, each with an API key (Panel → Developer API → new key, with read and automation permissions).
- **The keys file** at `%USERPROFILE%\.replykaro\keys.json`: `{ "personal": "rk_live_...", "aurelio": "rk_live_..." }`. Keys never go in the chat or in a commit; if one is shown in a screenshot, revoke it.
- **The base template** is set up for the author's accounts and Spanish copy; edit `references/plantilla-base.json` (keyword, greeting, public replies) for yours.

## Usage

Normally it runs after [resource-page](../resource-page/) returns the URL. It can also be invoked directly:

> Armá la automatización del reel

> Pegale la automatización al último reel

> Listá las automatizaciones / limpiá la más vieja

The only real test of the follow gate is commenting the keyword from an account that does **not** follow the reel's account: it must not receive the resource until it follows. ReplyKaro replies once per person per automation, so test from a fresh account each time.

## License

MIT — see [LICENSE](../LICENSE) at the repo root.
