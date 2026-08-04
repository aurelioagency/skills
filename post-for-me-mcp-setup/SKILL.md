---
name: post-for-me-mcp-setup
description: Install, verify and troubleshoot the official Post for Me MCP server in Claude Desktop and Claude Code, end to end, without the user editing any config file by hand. Use whenever someone mentions installing, configuring, connecting or repairing Post for Me, postforme or post-for-me-mcp; when they ask to "connect my social accounts to Claude" or want Claude to publish to Instagram, TikTok, LinkedIn, Facebook or YouTube; and when they report that an MCP server will not start, does not show up, shows an error, or that their Claude config "deleted itself". Covers Windows, macOS and Linux, and applies regardless of the language the request is written in. Do not use this skill to publish content; it only sets up the connection.
---

# Post for Me MCP setup

Get the official Post for Me MCP server (`post-for-me-mcp`) working, so Claude can operate social publishing: list connected accounts, upload media, create and schedule posts, and check results.

The person asking usually does not want to learn the MCP config format — they want it to work. Do the mechanical work for them, then explain in plain language what was installed and what changed on their machine.

## The one rule: never publish anything

This skill installs and verifies. **It does not publish.** No test post, no draft, no "scheduled for later just to try it".

It is tempting to close an installation with "now let's test it by posting something", but connected accounts belong to a real person or brand, a post is public the instant it lands, and Post for Me **cannot retract it** — it would have to be deleted by hand on every network.

Verify with reads instead. `GET /v1/social-accounts` confirms the key works and the connection is live, and changes nothing. That is enough.

If someone explicitly asks to publish a test, finish the installation first, then tell them it will really go out to their audience, and wait for an explicit yes.

## Before touching anything

Three things:

1. **The Post for Me API key.** From the dashboard at `app.postforme.dev`, under Settings → API Keys. It starts with `pfm_live_`. Ask for it if you do not have it.
2. **Where Claude is running.** This decides the whole flow — see the next section.
3. **Node.js installed.** If it is missing the script says so; it comes from `nodejs.org`, then retry.

Never print the key — not in summaries, not in error messages. The scripts mask it automatically; hold the same standard in anything you write yourself.

## The ordering problem, which is the number one cause of failure

Claude Desktop keeps its configuration in memory and **rewrites the whole file** every time it saves a preference. Edit that file while the app is running and it will eventually be overwritten, with no error of any kind. The person reasonably concludes the install "didn't work".

That produces two paths depending on where you are running:

**Inside Claude Desktop** (the desktop app, either the chat or a Claude Code panel): you cannot close the application, because closing it kills you mid-task. Do this instead:

1. Run the script with `--dry-run` to validate everything that can be validated without writing: paths, Node, current JSON, whether it is already installed.
2. Show the summary and ask the person to **close Claude Desktop completely**, including the system tray icon.
3. Tell them to run the script from a separate terminal with the app closed. Give them the exact command, ready to copy.
4. When they reopen the app and tell you, verify.

**In a terminal** (Claude Code on the console, with Claude Desktop closed): do the whole thing in one go. The script still refuses to write if it detects the app alive, so nothing can break by accident.

Explain the reason in one line. Once someone understands that the app overwrites the file, they never fall into the trap again.

## Installing

`scripts/install_mcp.py` does the heavy lifting, in this order: detect the OS and the right config path, verify Node and npx exist, check that Claude is not running, save a timestamped backup, validate the current JSON, insert the entry without touching anything else, write atomically, and re-validate the result.

```bash
python scripts/install_mcp.py --api-key "pfm_live_..."
```

Options worth knowing:

| Option | Purpose |
|---|---|
| `--dry-run` | Validate and show what it would do, without writing. Always use this first. |
| `--target desktop\|code\|both` | Where to install. Defaults to `desktop`. `code` uses the `claude mcp add` CLI. |
| `--version 2.9.1` | Pin a version instead of `@latest`. |
| `--name my_name` | Change the server identifier. Defaults to `post_for_me_api`. |
| `--uninstall` | Remove the entry instead of adding it. |
| `--force` | Write even if Claude is running. Only when the person asks knowing the risk. |

The script is **idempotent**: if the entry already exists it updates it rather than duplicating. Run it as many times as needed.

One Windows detail the official docs do not cover, and which breaks installs: the published example uses `"command": "npx"`, but on Windows `npx` is a `.cmd` shim rather than an executable, so Claude cannot launch it and the server errors out. The script resolves the absolute path to `npx` on every OS, which avoids this and also protects against an app whose `PATH` differs from the terminal's.

## Verifying

After the person restarts Claude:

```bash
python scripts/verify_mcp.py
```

All read-only. It checks that the entry is in the config, that the JSON is still valid, that Node and npx respond, whether server processes are alive, and whether the log files appeared. Adding `--check-api` makes one `GET` call to confirm the key is valid and report how many accounts are connected — without listing sensitive data and without writing anything.

Two signals that mislead people, worth reading correctly:

- **A non-empty `mcp-server-<name>.log` does not mean something is wrong.** That file also collects informational startup and protocol traffic; it can reach tens of kilobytes on a perfectly healthy install. What matters is whether there are error lines (`"level":"error"`, `ENOENT`, `is not recognized`). Also note that `Server disconnected` appears every time Claude closes — that is a normal shutdown, not a failure. The script compares whether the most recent successful startup came after the most recent real failure, instead of guessing from file size.
- `logs/mcp-info.json` can be frozen for months and show an empty `activeServers` even when everything works. It is not a live indicator; ignore it.

The conclusive test is functional: ask Claude in the chat, "what accounts do I have connected in Post for Me?". A list means it is ready.

## The final report, which is half the value

Always end with a summary. The person just let an assistant modify configuration files on their machine; they deserve to know exactly what happened and how to undo it. Without this the install works but leaves someone without control over their own computer.

Include four things:

**What was installed.** The server, the version, and what they can do now — in plain words, not jargon: "you can now ask it to upload a video to your networks and it will".

**Which files were touched.** Full path and reason for each. The exact inventory is in `references/files-touched.md`; read it and adapt it to what actually happened in this install, without inventing files that were never created.

**How to uninstall.** That it comes out clean: remove the entry and restart. No installer, no services, no registry entries, nothing in Program Files.

**What to try now.** One concrete sentence to type in the chat. Reinforce that the first thing they try should be a read query, not a post.

If something is unfinished — for example, the person has not restarted the app yet — say so plainly instead of declaring the install complete.

## Uninstalling

Two different things can be removed, and it is worth asking which before deleting anything:

- **The MCP** — the `post_for_me_api` entry inside Claude's configuration. Removing it is what actually disconnects Claude from the networks.
- **The skill** — the folder `~/.claude/skills/post-for-me-mcp-setup/`. Removing it only means Claude loses these instructions; it disconnects nothing.

To remove the MCP:

```bash
python scripts/install_mcp.py --uninstall
```

It removes only that entry, leaves the rest of the file untouched, backs up first and validates afterwards. If no other servers remain it also drops the now-empty `mcpServers` key, leaving the file as it was. The usual requirement applies: the app must be closed.

Tell the person explicitly that **their Post for Me account, connected accounts and published posts are untouched**. Uninstalling disconnects Claude; it deletes nothing from their networks. That worry comes up every time, so get ahead of it.

## When something fails

Read `references/troubleshooting.md`. It covers what actually happens: the config that deletes itself, the server that will not start, invalid JSON, `npx` not resolving, the Microsoft Store packaged app and its duplicated paths, permissions, and what each log file means.

One piece of advice that applies to all of them: look at the evidence before proposing a cause. Comparing the config file's creation time against its modification time tells you whether it was recreated. The server log's most recent startup versus its most recent failure tells you the current state. Diagnosing from data instead of hypotheses saves a lot of back and forth.

## References

- `references/files-touched.md` — inventory of everything created or modified, per OS, and how to revert it.
- `references/troubleshooting.md` — known problems with symptom, evidence and fix.
- `scripts/install_mcp.py` — idempotent cross-platform installer with backup and validation.
- `scripts/verify_mcp.py` — read-only verification.
