# Post for Me — Social Publishing for Claude

An agent skill for both halves of publishing with [Post for Me](https://www.postforme.dev/): getting its MCP server installed, and then actually posting with it.

```
you describe the post  →  Claude confirms the accounts and caption with you  →  publishes
                       →  reports the live links  →  marks the folder the files came from
```

**Setup** covers OS and path detection, Node/npx checks, safe JSON editing with backups and atomic writes, restart handling, read-only verification, and a diagnostic reference for every failure mode that shows up in practice. You never edit a config file by hand.

**Publishing** covers uploading local media, targeting the right accounts, per-platform options, a confirmation gate before anything goes out, reading the per-account results, and marking the delivery folder with its real publication date.

Works with agent harnesses that support file-based skills (Claude Code, Codex, and similar).

> **Note — nothing is published unless you asked for it and confirmed it.** Your connected accounts are real, a post is public the moment it lands, and Post for Me cannot retract it — you would have to delete it by hand on every network. So: no test posts, no drafts "just to see", and no fanning out to every connected account because you said "everywhere". Before any post goes out you get the accounts, the full caption, the media and the timing, and it waits for your yes. Verifying the install is done with a read-only `GET`.

> **Note — run the install in Claude Code (terminal).** Claude Desktop rewrites its own config file whenever it saves a preference, so the config has to be edited while the app is closed. From a terminal session that is trivial. If you paste the prompt inside the desktop app instead, the skill still works — it just has to stop and ask you to close the app, then hand you the command to finish.

## What's in this folder

| Path | Purpose |
|---|---|
| [SKILL.md](SKILL.md) | The skill itself: install flow, restart handling, verification, hard rules |
| [references/files-touched.md](references/files-touched.md) | Every file created or modified, per OS, and how to revert |
| [references/marking.md](references/marking.md) | Rule template for marking a delivery folder after publishing |
| [references/troubleshooting.md](references/troubleshooting.md) | Known failures with symptom, evidence and fix |
| [scripts/install_mcp.py](scripts/install_mcp.py) | Idempotent cross-platform installer with backup and validation |
| [scripts/verify_mcp.py](scripts/verify_mcp.py) | Read-only verification, including an optional API key check |
| [agents/openai.yaml](agents/openai.yaml) | Agent interface metadata |

## Key features

- **Publishes only what you confirmed** — no test post, no draft, no "scheduled just to try it", and no expanding "post it everywhere" into every connected account. You see the accounts, the full caption, the media and the timing before anything leaves. Verifying the install is a read-only account listing.
- **Safe config editing** — timestamped backup before writing, atomic write, JSON validated before and after, automatic restore if the result is broken. Your existing preferences are untouched.
- **Refuses to write while Claude is open** — the desktop app rewrites its config on every preference save and silently overwrites manual edits. This is the single most common reason an MCP install "doesn't work", and the installer simply blocks it.
- **Absolute `npx` path** — the official docs use a bare `"npx"`, which cannot launch on Windows because `npx` is a `.cmd` shim. The installer resolves the real path on every OS, which also survives an app whose `PATH` differs from your terminal's.
- **Idempotent** — re-running updates the entry instead of duplicating it. Safe to run as many times as you like.
- **Honest log reading** — a non-empty server log is normal (it stores informational traffic), and `Server disconnected` is a normal app shutdown. The verifier checks whether the most recent startup came after the most recent real failure, instead of guessing from file size.
- **Marks what you published** — building and publishing happen in different chats, so a delivery folder normally never learns that its content went out. After every account comes back successful, the skill renames (or moves, or logs) the folder using the real publication date from the API, and refuses to mark a partial publish.
- **Knows the traps** — local files need uploading before they can be posted, `stories` with several media makes one post per item rather than one story, YouTube and TikTok need a `title` and not just a caption, and a caption written as a multi-line template literal ships with every paragraph indented.
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
Install the post-for-me skill from https://github.com/aurelioagency/skills :
1. Run: git clone --filter=blob:none --sparse https://github.com/aurelioagency/skills.git into a temporary folder.
2. Inside it, run: git sparse-checkout set post-for-me
3. Copy the post-for-me/ folder into ~/.claude/skills/post-for-me/
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
node install-skills.mjs post-for-me          # Claude Code
node install-skills.mjs post-for-me --codex  # Codex
```

Any other harness: point it at this folder's `SKILL.md`.

## Updating

Improvements land in this repo; your installed copy never updates itself. To update, re-run the installer — it replaces the installed skill cleanly, records the installed commit in `.installed-from.json`, and prints the old and new commits. Open Claude Code and paste:

```text
Update my installed post-for-me skill from https://github.com/aurelioagency/skills :
1. If I have a clone of the repo, run git pull in it; otherwise make a temporary
   sparse clone like in the install prompt.
2. In the clone, run: node install-skills.mjs post-for-me
3. The installer prints the previous and new commit. Summarize what changed
   between them (git log --oneline <old>..<new> -- post-for-me) in my language.
4. Confirm the skill still loads. Delete the temporary clone if you made one.
5. My Post for Me MCP config is NOT part of the skill, so it is untouched by this
   update — confirm it still works by running scripts/verify_mcp.py --check-api.
```

Updating the skill never touches your MCP configuration: the skill lives in `~/.claude/skills/`, while the MCP entry lives in Claude's own config file. They are independent, so a skill update cannot break a working connection.

To find out whether you are behind without installing anything, run this in an up-to-date clone:

```powershell
node install-skills.mjs post-for-me --check
```

It compares the commit recorded in your installed copy against the checkout, counting only commits that touch this skill (exit code 3 means an update is available).

## Uninstalling

There are two separate things you may want to remove, and it is worth knowing which is which:

- **The skill** — the folder `~/.claude/skills/post-for-me/`. Removing it means Claude loses the publishing protocol and the diagnostics. The MCP tools keep working, so posts still go out — just without the confirmation gate or the folder marking. It does **not** disconnect anything.
- **The MCP** — the `post_for_me_api` entry inside Claude's config file. Removing it is what actually disconnects Claude from your social accounts.

Open Claude Code and paste whichever you want:

```text
Remove the post-for-me skill and the Post for Me MCP from my machine:
1. Use the skill to uninstall the MCP first: close Claude Desktop completely,
   remove the "post_for_me_api" entry from my claude_desktop_config.json,
   validate the JSON, and leave every other setting untouched.
2. Then delete the folder ~/.claude/skills/post-for-me/.
3. Confirm the skill no longer loads. Do not touch my other installed skills,
   any clone of the skills repo, or anything in my Post for Me account —
   my connected social accounts and published posts must stay exactly as they are.
```

To remove **only the skill** and keep publishing working, use this instead:

```text
Delete the folder ~/.claude/skills/post-for-me/ and confirm the skill no
longer loads. Leave my claude_desktop_config.json alone — I want the Post for Me
MCP to keep working, I just don't need the installer skill anymore.
```

Or manually — from a clone of the repo:

```powershell
node install-skills.mjs post-for-me --remove
```

(which only deletes the installed copy, never the repo folder). Nothing else is left behind: this skill has no installer, no services, no registry entries, and installs no global packages. Your Post for Me account, connected accounts and published posts are never affected by any of this.

## Requirements

- **Python 3.8+** — the bundled scripts are plain `python`, standard library only, no install step.
- **Node.js 18+** on `PATH` — the MCP server itself runs through `npx`.
- **A Post for Me API key** — from the dashboard at `app.postforme.dev`, under Settings → API Keys. It starts with `pfm_live_`.
- **Claude Desktop or Claude Code** — the skill supports both targets (`--target desktop|code|both`).

The key is stored in plain text in Claude's config file, which is how MCP configuration works. Treat it like a password: anyone with access to that file can publish to your connected accounts.

## Usage

Once installed, the skill lives in `~/.claude/skills/post-for-me/` and is available in **every** Claude Code session on the machine. It triggers on its own whenever you ask to publish or schedule something through Post for Me, and whenever you mention installing, configuring or repairing it — you can also invoke it explicitly with `/post-for-me`.

It is good for five things. Installing is the one that brings people here, but it is the one you do least:

| What for | What you say | How often |
|---|---|---|
| **Install** | *"install the Post for Me MCP, my key is pfm_live_…"* | Once per machine |
| **Diagnose and repair** | *"the server shows an error"*, *"it worked yesterday and now it's gone"* | Every time something breaks |
| **Verify** | *"is my Post for Me connection still working?"* | Whenever you are unsure |
| **Set up marking** | *"mark my folders when I publish them"* | Once, if you want it |
| **Uninstall** | *"remove the Post for Me MCP"* | Moving machines, or dropping it |

Diagnosing is the one that repeats. Installing happens once; things breaking does not — which is why `references/troubleshooting.md` is the largest file in the skill.

It also handles reconfiguration without a full reinstall: pin a version instead of `@latest` (`--version`), install into Claude Code as well as the desktop app (`--target both`), rotate your API key (just run it again — it updates rather than duplicates), or rename the server (`--name`).

### Publishing

Once the MCP is installed its tools are available in every chat, so you can already publish by asking. What this skill adds at that moment is the protocol around the call:

> Publish the carousel in this folder on Instagram and TikTok

It lists your connected accounts and shows which ones it intends to use, uploads any local media (Post for Me fetches by URL — it cannot see your disk), applies the per-platform options that matter, and then stops: accounts, full caption, media, timing. Nothing goes out until you say yes.

Afterwards it reads `socialPostResults` per account and reports the live links, or names exactly which account failed and why.

### Marking folders you have published

The problem: you build a deliverable in one chat and publish it from another, days later, so the folder never learns its content went out — and months later nothing tells you what already shipped.

The publish is the only moment that knows both halves, so the marking happens there. After every account comes back successful, the folder gets renamed to `YYYY-MM-DD-<slug>_POST` using the real publication date from the API. Already marked folders are left alone, and a partial publish is never marked.

Renaming is just the common choice — moving to a `published/` folder or appending to a log file work the same way. If you have no convention yet, the skill asks once and then uses your answer. Templates and a worked example in [references/marking.md](references/marking.md).

### Installing the MCP

Describe it in your own words, for example:

> Install the Post for Me MCP on my machine. My API key is `pfm_live_...`

The skill detects your OS and config path, checks Node, shows you a dry run, handles the app-restart problem, writes the entry with a backup, and verifies the result by listing how many accounts you have connected. It finishes with a summary of exactly which files it touched.

### Repairing a broken install

Point it at the symptom — *"my Post for Me server shows an error"*, *"it worked yesterday and now it's gone"*, *"the MCP doesn't show up"* — and it works from evidence rather than guesswork: file creation vs. modification timestamps to tell whether the config was recreated, the server log's most recent startup vs. its most recent failure, `npx` resolution, JSON validity. The full catalogue is in [references/troubleshooting.md](references/troubleshooting.md).

### What it changes on your machine

One file is modified by the install:

| OS | File |
|---|---|
| Windows | `%APPDATA%\Claude\claude_desktop_config.json` |
| macOS | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Linux | `~/.config/Claude/claude_desktop_config.json` |

An `mcpServers` entry is **added** to it; everything already in the file stays as it was. A timestamped backup is written next to it first.

Publishing writes nothing to your machine. The one exception is the marking step, which renames or moves the delivery folder you named — never anything else, and never before a post has actually succeeded.

Two things then appear on their own, created by Claude rather than by this skill: the npx cache folder where the server is downloaded (`_npx` inside your npm cache), and two log files in `logs/`, next to the config.

That's the whole footprint. No installer, no services, no registry entries, no global packages, nothing in Program Files or Applications. Full inventory and revert steps in [references/files-touched.md](references/files-touched.md).

### Verifying at any time

```powershell
python ~/.claude/skills/post-for-me/scripts/verify_mcp.py --check-api
```

Read-only. It reports the config entry, the resolved command, Node, running processes, the log state, and — with `--check-api` — how many accounts are connected, by platform. It never writes and never posts.

### After it's installed

Test with a question, not a post:

> What accounts do I have connected in Post for Me?

From there the MCP takes over and you can ask for real work: uploading a video to several networks, scheduling a post, checking why one of them failed.

## License

MIT — see [LICENSE](../LICENSE) at the repo root.
