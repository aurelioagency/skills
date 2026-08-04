#!/usr/bin/env python3
"""
Installer for the Post for Me MCP server, for Claude Desktop and Claude Code.

Design: idempotent, with backup, atomic write and validation before and after.
It refuses to write while Claude Desktop is running, because the app rewrites
its own configuration when it saves preferences and would silently overwrite
the change.

This script does NOT publish anything to social networks. It only writes local
configuration.
"""

from __future__ import annotations  # allows "str | None" annotations on Python 3.8/3.9

import argparse
import json
import os
import platform
import shutil
import subprocess
import sys
import tempfile
from datetime import datetime
from pathlib import Path

PACKAGE = "post-for-me-mcp"
DEFAULT_NAME = "post_for_me_api"
ENV_VAR = "POST_FOR_ME_API_KEY"

OK, WARN, BAD, INFO = "[ok]", "[!]", "[x]", "[i]"


# --------------------------------------------------------------- helpers

def mask(key: str) -> str:
    """Never show the full key: it is a secret that publishes to real accounts."""
    if not key:
        return "(empty)"
    if len(key) <= 12:
        return key[:3] + "..."
    return f"{key[:9]}...{key[-4:]}"


def desktop_config_path() -> Path:
    system = platform.system()
    if system == "Windows":
        base = os.environ.get("APPDATA")
        if not base:
            base = Path.home() / "AppData" / "Roaming"
        return Path(base) / "Claude" / "claude_desktop_config.json"
    if system == "Darwin":
        return Path.home() / "Library" / "Application Support" / "Claude" / "claude_desktop_config.json"
    return Path.home() / ".config" / "Claude" / "claude_desktop_config.json"


def claude_is_running() -> bool:
    system = platform.system()
    try:
        if system == "Windows":
            out = subprocess.run(
                ["tasklist", "/FI", "IMAGENAME eq Claude.exe", "/NH"],
                capture_output=True, text=True, timeout=25,
            ).stdout
            # tasklist reports the name lowercased ("claude.exe"), so this
            # comparison has to ignore case or the guard never fires and the
            # installer happily writes while the app is open.
            return "claude.exe" in out.lower()
        out = subprocess.run(["pgrep", "-x", "Claude"], capture_output=True, text=True, timeout=25)
        if out.returncode == 0 and out.stdout.strip():
            return True
        out = subprocess.run(["pgrep", "-f", "Claude.app"], capture_output=True, text=True, timeout=25)
        return out.returncode == 0 and bool(out.stdout.strip())
    except Exception:
        # If it cannot be determined, do not block: warn and continue.
        return False


def find_npx() -> str | None:
    """
    Resolve the absolute path on purpose. On Windows npx is a .cmd shim rather
    than an executable, so the bare "npx" from the official example fails to
    launch. It also protects against an app whose PATH differs from the
    terminal's.
    """
    for cand in ("npx.cmd", "npx.exe", "npx") if platform.system() == "Windows" else ("npx",):
        found = shutil.which(cand)
        if found:
            return str(Path(found).resolve())
    return None


def node_version() -> str | None:
    exe = shutil.which("node")
    if not exe:
        return None
    try:
        return subprocess.run([exe, "--version"], capture_output=True, text=True, timeout=30).stdout.strip()
    except Exception:
        return None


def load_json(path: Path):
    """Returns (data, error). Distinguishes 'missing' from 'broken'."""
    if not path.exists():
        return {}, None
    raw = path.read_text(encoding="utf-8-sig")
    if not raw.strip():
        return {}, None
    try:
        data = json.loads(raw)
    except json.JSONDecodeError as e:
        return None, f"Invalid JSON at line {e.lineno}, column {e.colno}: {e.msg}"
    if not isinstance(data, dict):
        return None, "The file does not contain a JSON object at the root."
    return data, None


def write_atomic(path: Path, data: dict) -> None:
    """Write to a temp file and rename, so the file is never left half-written."""
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(dir=str(path.parent), suffix=".tmp")
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as fh:
            json.dump(data, fh, indent=2, ensure_ascii=False)
            fh.write("\n")
        os.replace(tmp, path)
    except Exception:
        Path(tmp).unlink(missing_ok=True)
        raise


# ------------------------------------------------------------------ actions

def install_desktop(args) -> int:
    cfg = Path(args.config) if args.config else desktop_config_path()
    print(f"{INFO} System : {platform.system()} {platform.release()}")
    print(f"{INFO} Config : {cfg}")

    npx = find_npx()
    if not npx:
        print(f"{BAD} npx not found. Install Node.js from https://nodejs.org and try again.")
        return 2
    nv = node_version()
    print(f"{OK} Node {nv or '(unknown version)'}")
    print(f"{OK} npx: {npx}")

    running = claude_is_running()
    if running and not args.force and not args.dry_run:
        print()
        print(f"{BAD} Claude Desktop is open. Not writing.")
        print("    The app rewrites its configuration when it saves preferences")
        print("    and would erase this change without reporting any error.")
        print("    Close Claude completely (including the tray icon) and run this again.")
        return 3
    if running and args.dry_run:
        print(f"{WARN} Claude Desktop is open. On a real run I would stop here.")

    data, err = load_json(cfg)
    if err:
        print(f"{BAD} {err}")
        print("    Fix the file or restore a backup before continuing.")
        print("    Invalid JSON makes Claude discard the whole file and write a")
        print("    default configuration, which is how installs get lost.")
        return 4
    print(f"{OK} Current JSON is valid ({len(data)} root keys)")

    servers = data.get("mcpServers")
    if servers is None:
        servers = {}
    elif not isinstance(servers, dict):
        print(f"{BAD} 'mcpServers' exists but is not an object. Manual review needed.")
        return 4

    already = args.name in servers
    spec = f"{PACKAGE}@{args.version}" if args.version else f"{PACKAGE}@latest"
    entry = {
        "command": npx,
        "args": ["-y", spec],
        "env": {ENV_VAR: args.api_key},
    }

    if already:
        print(f"{WARN} '{args.name}' already existed: updating instead of duplicating.")

    if args.dry_run:
        preview = json.loads(json.dumps(entry))
        preview["env"][ENV_VAR] = mask(args.api_key)
        print()
        print(f"{INFO} Dry run. This would be added at mcpServers['{args.name}']:")
        print(json.dumps(preview, indent=2, ensure_ascii=False))
        print()
        print(f"{INFO} Nothing was written. Drop --dry-run to apply.")
        return 0

    backup = None
    if cfg.exists():
        stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
        backup = cfg.with_name(f"{cfg.stem}.backup-{stamp}{cfg.suffix}")
        shutil.copy2(cfg, backup)
        print(f"{OK} Backup: {backup.name}")

    servers[args.name] = entry
    data["mcpServers"] = servers

    try:
        write_atomic(cfg, data)
    except Exception as e:
        print(f"{BAD} Could not write: {e}")
        if backup:
            print(f"    The intact backup is still at {backup}")
        return 5

    check, err = load_json(cfg)
    if err or args.name not in check.get("mcpServers", {}):
        print(f"{BAD} The file ended up invalid after writing. Restoring the backup.")
        if backup:
            shutil.copy2(backup, cfg)
        return 5

    print(f"{OK} Entry '{args.name}' written and verified")
    print(f"{OK} Package: {spec}")
    print(f"{OK} Key    : {mask(args.api_key)}")
    print()
    print(f"{INFO} One step left that I cannot do for you: open Claude Desktop.")
    print("    On startup it reads the config and launches the server with npx.")
    print("    The first time takes a few extra seconds while the package downloads.")
    return 0


def uninstall_desktop(args) -> int:
    """Remove the MCP entry. Touches nothing else in the file, and nothing remote."""
    cfg = Path(args.config) if args.config else desktop_config_path()
    print(f"{INFO} Config : {cfg}")

    if not cfg.exists():
        print(f"{OK} The file does not exist: nothing to uninstall.")
        return 0

    if claude_is_running() and not args.force and not args.dry_run:
        print(f"{BAD} Claude Desktop is open. Close it completely and run this again.")
        return 3

    data, err = load_json(cfg)
    if err:
        print(f"{BAD} {err}")
        return 4

    servers = data.get("mcpServers")
    if not isinstance(servers, dict) or args.name not in servers:
        print(f"{OK} Entry '{args.name}' is not present. Nothing to do.")
        return 0

    if args.dry_run:
        print(f"{INFO} Dry run: would remove mcpServers['{args.name}']. Nothing was written.")
        return 0

    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    backup = cfg.with_name(f"{cfg.stem}.backup-{stamp}{cfg.suffix}")
    shutil.copy2(cfg, backup)
    print(f"{OK} Backup: {backup.name}")

    del servers[args.name]
    if servers:
        data["mcpServers"] = servers
    else:
        # No servers left: drop the key entirely so the file looks like it did
        # before the install.
        data.pop("mcpServers", None)

    try:
        write_atomic(cfg, data)
    except Exception as e:
        print(f"{BAD} Could not write: {e}")
        shutil.copy2(backup, cfg)
        return 5

    check, err = load_json(cfg)
    if err:
        print(f"{BAD} The file ended up invalid. Restoring the backup.")
        shutil.copy2(backup, cfg)
        return 5

    print(f"{OK} Entry '{args.name}' removed; the rest of the file is untouched")
    print(f"{INFO} Restart Claude Desktop so it stops launching the server.")
    print(f"{INFO} Your Post for Me account, connected accounts and published posts")
    print("    were not touched: this only disconnects Claude.")
    return 0


def install_code(args) -> int:
    """Claude Code (CLI) keeps its own registry, managed through its command."""
    claude = shutil.which("claude")
    if not claude:
        print(f"{WARN} 'claude' command not found. Skipping the Claude Code install.")
        return 0

    cmd = [
        claude, "mcp", "add", args.name,
        "--env", f"{ENV_VAR}={args.api_key}",
        "--", find_npx() or "npx", "-y",
        f"{PACKAGE}@{args.version}" if args.version else f"{PACKAGE}@latest",
    ]
    shown = list(cmd)
    shown[shown.index(f"{ENV_VAR}={args.api_key}")] = f"{ENV_VAR}={mask(args.api_key)}"
    print(f"{INFO} Claude Code: {' '.join(shown)}")

    if args.dry_run:
        print(f"{INFO} Dry run: not executed.")
        return 0

    res = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
    if res.returncode != 0:
        print(f"{WARN} The command returned code {res.returncode}")
        if res.stderr.strip():
            print("    " + res.stderr.strip().splitlines()[-1])
        return 0
    print(f"{OK} Registered in Claude Code")
    return 0


def main() -> int:
    p = argparse.ArgumentParser(
        description="Install the Post for Me MCP in Claude. Publishes nothing to social networks."
    )
    p.add_argument("--api-key", help="Post for Me key (starts with pfm_live_). Not needed with --uninstall")
    p.add_argument("--uninstall", action="store_true", help="Remove the MCP entry instead of adding it")
    p.add_argument("--name", default=DEFAULT_NAME, help=f"Server name (default {DEFAULT_NAME})")
    p.add_argument("--version", default=None, help="Package version; defaults to latest")
    p.add_argument("--target", choices=["desktop", "code", "both"], default="desktop")
    p.add_argument("--config", default=None, help="Alternative path to the configuration file")
    p.add_argument("--dry-run", action="store_true", help="Validate and show, without writing")
    p.add_argument("--force", action="store_true", help="Write even if Claude is open")
    args = p.parse_args()

    if args.uninstall:
        print("=" * 62)
        print(" Post for Me MCP uninstaller")
        print("=" * 62)
        return uninstall_desktop(args)

    if not args.api_key:
        p.error("--api-key is required to install (not needed with --uninstall)")
    if not args.api_key.startswith("pfm_"):
        print(f"{WARN} The key does not start with 'pfm_'. Check it is the right Post for Me key.")

    print("=" * 62)
    print(" Post for Me MCP installer")
    print("=" * 62)

    rc = 0
    if args.target in ("desktop", "both"):
        rc = install_desktop(args)
        if rc != 0 and args.target == "both":
            return rc
    if args.target in ("code", "both"):
        print()
        rc2 = install_code(args)
        rc = rc or rc2
    return rc


if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\nCancelled.")
        sys.exit(130)
