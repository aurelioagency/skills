# What gets touched on the machine

Inventory for the final report. Tell the person what **actually happened** in their install: if a file was not created, do not mention it.

## The honest summary

Exactly one file is modified. Everything else is either a backup or a file Claude creates on its own when it starts the server. There is no installer, no services, no registry entries, and nothing is written to Program Files or `/Applications`.

Publishing writes nothing to the machine. The one exception is the marking step, which renames or moves a folder the person named themselves — never anything else, and never without a successful post first.

## 1. The only file that is modified

| OS | Path |
|---|---|
| Windows | `%APPDATA%\Claude\claude_desktop_config.json` |
| macOS | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Linux | `~/.config/Claude/claude_desktop_config.json` |

An `mcpServers` key is added at the root level (or an entry is added to it if it already existed). The rest of the file is left alone: preferences, sessions and everything else are untouched.

```json
"mcpServers": {
  "post_for_me_api": {
    "command": "<absolute path to npx>",
    "args": ["-y", "post-for-me-mcp@latest"],
    "env": { "POST_FOR_ME_API_KEY": "..." }
  }
}
```

**The API key is stored in plain text in that file.** That is how MCP configuration works, and it is better said than hidden: anyone with access to the file can publish to the connected accounts. Worth mentioning if the machine is shared.

### Note on Windows and the Microsoft Store build

The packaged (MSIX) build also exposes this path:

```
C:\Users\<user>\AppData\Local\Packages\Claude_pzs8sxrjxfjjc\LocalCache\Roaming\Claude\claude_desktop_config.json
```

**It is the same file**, redirected by package virtualization. Editing either one is equivalent. If someone sees both paths and thinks there are two separate configs, that is the explanation.

## 2. Backup (created by the installer)

`claude_desktop_config.backup-YYYYMMDD-HHMMSS.json`, in the same folder. One per run, so several accumulate if the script is run more than once. Safe to delete.

## 3. npx cache (created by the system)

| OS | Path |
|---|---|
| Windows | `%LOCALAPPDATA%\npm-cache\_npx\<hash>\` |
| macOS / Linux | `~/.npm/_npx/<hash>/` |

Where npx downloads `post-for-me-mcp` and its dependencies the first time. **No global package is installed.** It can be cleared with `npm cache clean --force`; it simply downloads again.

## 4. Logs (created by Claude Desktop)

In the `logs/` folder next to the config file:

- `mcp-server-post_for_me_api.log` — server startup and activity. Size means nothing on its own; look for error lines.
- `mcp.log` — protocol trace: initialization, tool listing, messages.
- `main.log` — general app log; `Connected to post_for_me_api` shows up here.

`logs/mcp-info.json` can be months out of date and show empty lists even when everything works. It is not a usable indicator.

## 5. If it was also installed in Claude Code

The CLI keeps its own registry in `~/.claude.json`. Remove it with:

```bash
claude mcp remove post_for_me_api
```

## How to uninstall completely

1. Close Claude Desktop entirely.
2. Run `python scripts/install_mcp.py --uninstall`, or manually delete the `post_for_me_api` entry from `mcpServers` (or the whole `mcpServers` key if no other servers remain).
3. Confirm the JSON is still valid.
4. Open Claude.

Optionally delete the backups and clear the npx cache. Nothing else is left behind. The person's Post for Me account, connected accounts and published posts are never affected — uninstalling disconnects Claude, it does not delete anything from their networks.
