# Post for Me MCP Setup — Social Publishing for Claude

An agent skill that installs, verifies and troubleshoots the official [Post for Me](https://www.postforme.dev/) MCP server, so Claude can publish to your social accounts:

```
you describe the post  →  Claude uploads the media, targets the accounts, publishes, reports back
```

It covers the whole setup path: OS and path detection, Node/npx checks, safe JSON editing with backups and atomic writes, restart handling, read-only verification, and a diagnostic reference for every failure mode that actually shows up in practice. You never edit a config file by hand.

Works with agent harnesses that support file-based skills (Claude Code, Codex, and similar).

> **Note — this skill never publishes anything.** It installs and verifies, and that is all. Your connected accounts are real, a post is public the moment it lands, and Post for Me cannot retract it afterwards — you would have to delete it by hand on every network. Verification is done with a read-only `GET`. Publishing is something you ask for later, deliberately.

> **Note — run the install in Claude Code (terminal).** Claude Desktop rewrites its own config file whenever it saves a preference, so the config has to be edited while the app is closed. From a terminal session that is trivial. If you paste the prompt inside the desktop app instead, the skill still works — it just has to stop and ask you to close the app, then hand you the command to finish.

## What's in this folder

| Path | Purpose |
|---|---|
| [SKILL.md](SKILL.md) | The skill itself: install flow, restart handling, verification, hard rules |
| [references/files-touched.md](references/files-touched.md) | Every file created or modified, per OS, and how to revert |
| [references/troubleshooting.md](references/troubleshooting.md) | Known failures with symptom, evidence and fix |
| [scripts/install_mcp.py](scripts/install_mcp.py) | Idempotent cross-platform installer with backup and validation |
| [scripts/verify_mcp.py](scripts/verify_mcp.py) | Read-only verification, including an optional API key check |
| [agents/openai.yaml](agents/openai.yaml) | Agent interface metadata |

## Key features

- **Never publishes** — no test post, no draft, no "scheduled just to try it". Verification is a read-only account listing, so nothing ever reaches your audience by accident.
- **Safe config editing** — timestamped backup before writing, atomic write, JSON validated before and after, automatic restore if the result is broken. Your existing preferences are untouched.
- **Refuses to write while Claude is open** — the desktop app rewrites its config on every preference save and silently overwrites manual edits. This is the single most common reason an MCP install "doesn't work", and the installer simply blocks it.
- **Absolute `npx` path** — the official docs use a bare `"npx"`, which cannot launch on Windows because `npx` is a `.cmd` shim. The installer resolves the real path on every OS, which also survives an app whose `PATH` differs from your terminal's.
- **Idempotent** — re-running updates the entry instead of duplicating it. Safe to run as many times as you like.
- **Honest log reading** — a non-empty server log is normal (it stores informational traffic), and `Server disconnected` is a normal app shutdown. The verifier checks whether the most recent startup came after the most recent real failure, instead of guessing from file size.
- **Reports what it touched** — every run ends with a plain-language summary of the files modified and how to undo them.

## Installation

### Before you start

Three things, and only the last one takes any effort:

1. **Claude Code**, either the terminal CLI or the panel in the desktop app. The install prompt clones a repo and copies files, so it needs an agent with shell and file access — the claude.ai web chat cannot do it.
2. **A Post for Me account with your social accounts already connected.** You connect them once from the dashboard at [app.postforme.dev](https://app.postforme.dev); this skill does not handle that part.
3. **Your API key**, from that same dashboard under **Settings → API Keys**. It starts with `pfm_live_`. Have it at hand — the agent will ask for it and it is the only thing it cannot figure out on its own.

You do **not** need to download the Post for Me documentation, look up the package name, or know what the config file looks like. All of that already lives inside the skill, and once the MCP is running it ships its own documentation search, so the agent looks things up by itself.

### Option A — let your agent install it (recommended)

Open Claude Code and paste:

```text
Install the post-for-me-mcp-setup skill from https://github.com/aurelioagency/skills :
1. Run: git clone --filter=blob:none --sparse https://github.com/aurelioagency/skills.git into a temporary folder.
2. Inside it, run: git sparse-checkout set post-for-me-mcp-setup
3. Copy the post-for-me-mcp-setup/ folder into ~/.claude/skills/post-for-me-mcp-setup/
4. Delete the temporary clone and confirm the skill loads.
5. Check the requirements: Python 3.8+ and Node.js 18+. Install anything missing
   (ask me to approve each install command).
6. Then use the skill right away: ask me for my Post for Me API key and run the
   MCP installation end to end, including the verification step. Do not publish
   anything as a test.
```

The agent fetches only this skill (not the whole collection), installs it permanently in `~/.claude/skills/` for all future chats, and then walks you through connecting Post for Me in the same session. Step 6 is what makes this a single paste: you finish with a working MCP, not just an installed skill.

**What happens after you paste.** The agent does the work and stops to talk to you exactly twice: once to ask for your API key, and once to ask you to close Claude Desktop completely — the desktop app overwrites its own config while running, so the entry has to be written with the app closed. You reopen it, the agent verifies by listing how many accounts you have connected, and tells you which files it touched. Two answers from you, everything else automatic.

The prompt is written in English, but the agent answers in whatever language you write in — paste it as is and then keep talking to it however you like.

### Option B — manual

Clone the repo and run the bundled installer:

```powershell
git clone https://github.com/aurelioagency/skills.git
cd skills
node install-skills.mjs post-for-me-mcp-setup          # Claude Code
node install-skills.mjs post-for-me-mcp-setup --codex  # Codex
```

Any other harness: point it at this folder's `SKILL.md`.

## Updating

Improvements land in this repo; your installed copy never updates itself. To update, re-run the installer — it replaces the installed skill cleanly, records the installed commit in `.installed-from.json`, and prints the old and new commits. Open Claude Code and paste:

```text
Update my installed post-for-me-mcp-setup skill from https://github.com/aurelioagency/skills :
1. If I have a clone of the repo, run git pull in it; otherwise make a temporary
   sparse clone like in the install prompt.
2. In the clone, run: node install-skills.mjs post-for-me-mcp-setup
3. The installer prints the previous and new commit. Summarize what changed
   between them (git log --oneline <old>..<new> -- post-for-me-mcp-setup) in my language.
4. Confirm the skill still loads. Delete the temporary clone if you made one.
5. My Post for Me MCP config is NOT part of the skill, so it is untouched by this
   update — confirm it still works by running scripts/verify_mcp.py --check-api.
```

Updating the skill never touches your MCP configuration: the skill lives in `~/.claude/skills/`, while the MCP entry lives in Claude's own config file. They are independent, so a skill update cannot break a working connection.

To find out whether you are behind without installing anything, run this in an up-to-date clone:

```powershell
node install-skills.mjs post-for-me-mcp-setup --check
```

It compares the commit recorded in your installed copy against the checkout, counting only commits that touch this skill (exit code 3 means an update is available).

## Uninstalling

There are two separate things you may want to remove, and it is worth knowing which is which:

- **The skill** — the folder `~/.claude/skills/post-for-me-mcp-setup/`. Removing it means Claude no longer knows how to install or diagnose the MCP. It does **not** disconnect anything.
- **The MCP** — the `post_for_me_api` entry inside Claude's config file. Removing it is what actually disconnects Claude from your social accounts.

Open Claude Code and paste whichever you want:

```text
Remove the post-for-me-mcp-setup skill and the Post for Me MCP from my machine:
1. Use the skill to uninstall the MCP first: close Claude Desktop completely,
   remove the "post_for_me_api" entry from my claude_desktop_config.json,
   validate the JSON, and leave every other setting untouched.
2. Then delete the folder ~/.claude/skills/post-for-me-mcp-setup/.
3. Confirm the skill no longer loads. Do not touch my other installed skills,
   any clone of the skills repo, or anything in my Post for Me account —
   my connected social accounts and published posts must stay exactly as they are.
```

To remove **only the skill** and keep publishing working, use this instead:

```text
Delete the folder ~/.claude/skills/post-for-me-mcp-setup/ and confirm the skill no
longer loads. Leave my claude_desktop_config.json alone — I want the Post for Me
MCP to keep working, I just don't need the installer skill anymore.
```

Or manually — from a clone of the repo:

```powershell
node install-skills.mjs post-for-me-mcp-setup --remove
```

(which only deletes the installed copy, never the repo folder). Nothing else is left behind: this skill has no installer, no services, no registry entries, and installs no global packages. Your Post for Me account, connected accounts and published posts are never affected by any of this.

## Requirements

- **Python 3.8+** — the bundled scripts are plain `python`, standard library only, no install step.
- **Node.js 18+** on `PATH` — the MCP server itself runs through `npx`.
- **A Post for Me API key** — from the dashboard at `app.postforme.dev`, under Settings → API Keys. It starts with `pfm_live_`.
- **Claude Desktop or Claude Code** — the skill supports both targets (`--target desktop|code|both`).

The key is stored in plain text in Claude's config file, which is how MCP configuration works. Treat it like a password: anyone with access to that file can publish to your connected accounts.

## Usage

Once installed, the skill lives in `~/.claude/skills/post-for-me-mcp-setup/` and is available in **every** Claude Code session on the machine. It triggers on its own whenever you mention installing, configuring or repairing Post for Me — you can also invoke it explicitly with `/post-for-me-mcp-setup`.

### Installing the MCP

Describe it in your own words, for example:

> Install the Post for Me MCP on my machine. My API key is `pfm_live_...`

The skill detects your OS and config path, checks Node, shows you a dry run, handles the app-restart problem, writes the entry with a backup, and verifies the result by listing how many accounts you have connected. It finishes with a summary of exactly which files it touched.

### Repairing a broken install

Point it at the symptom — *"my Post for Me server shows an error"*, *"it worked yesterday and now it's gone"*, *"the MCP doesn't show up"* — and it works from evidence rather than guesswork: file creation vs. modification timestamps to tell whether the config was recreated, the server log's most recent startup vs. its most recent failure, `npx` resolution, JSON validity. The full catalogue is in [references/troubleshooting.md](references/troubleshooting.md).

### What it changes on your machine

One file is modified, ever:

| OS | File |
|---|---|
| Windows | `%APPDATA%\Claude\claude_desktop_config.json` |
| macOS | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Linux | `~/.config/Claude/claude_desktop_config.json` |

An `mcpServers` entry is **added** to it; everything already in the file stays as it was. A timestamped backup is written next to it first.

Two things then appear on their own, created by Claude rather than by this skill: the npx cache folder where the server is downloaded (`_npx` inside your npm cache), and two log files in `logs/`, next to the config.

That's the whole footprint. No installer, no services, no registry entries, no global packages, nothing in Program Files or Applications. Full inventory and revert steps in [references/files-touched.md](references/files-touched.md).

### Verifying at any time

```powershell
python ~/.claude/skills/post-for-me-mcp-setup/scripts/verify_mcp.py --check-api
```

Read-only. It reports the config entry, the resolved command, Node, running processes, the log state, and — with `--check-api` — how many accounts are connected, by platform. It never writes and never posts.

### After it's installed

Test with a question, not a post:

> What accounts do I have connected in Post for Me?

From there the MCP takes over and you can ask for real work: uploading a video to several networks, scheduling a post, checking why one of them failed.

## License

MIT — see [LICENSE](../LICENSE) at the repo root.
