#!/usr/bin/env python3
"""
Verification for the Post for Me MCP. Everything it does is READ-ONLY.

With --check-api it makes a single GET call to /v1/social-accounts to confirm
the key works. That is a read: it creates nothing, modifies nothing and
publishes nothing. POST is never used from here, deliberately.
"""

from __future__ import annotations  # allows "list[str]" annotations on Python 3.8/3.9

import argparse
import json
import os
import platform
import shutil
import subprocess
import sys
import urllib.error
import urllib.request
from pathlib import Path

DEFAULT_NAME = "post_for_me_api"
ENV_VAR = "POST_FOR_ME_API_KEY"
API = "https://api.postforme.dev/v1/social-accounts?limit=50"

OK, WARN, BAD, INFO = "[ok]", "[!]", "[x]", "[i]"


def mask(key: str) -> str:
    if not key:
        return "(empty)"
    return key[:9] + "..." + key[-4:] if len(key) > 12 else key[:3] + "..."


def desktop_config_path() -> Path:
    system = platform.system()
    if system == "Windows":
        base = os.environ.get("APPDATA") or (Path.home() / "AppData" / "Roaming")
        return Path(base) / "Claude" / "claude_desktop_config.json"
    if system == "Darwin":
        return Path.home() / "Library" / "Application Support" / "Claude" / "claude_desktop_config.json"
    return Path.home() / ".config" / "Claude" / "claude_desktop_config.json"


def logs_dir() -> Path:
    return desktop_config_path().parent / "logs"


def server_processes() -> list[str]:
    try:
        if platform.system() == "Windows":
            out = subprocess.run(
                ["wmic", "process", "where", "name='node.exe'", "get", "ProcessId,CommandLine"],
                capture_output=True, text=True, timeout=40,
            ).stdout
        else:
            out = subprocess.run(["ps", "-eo", "pid,command"], capture_output=True, text=True, timeout=40).stdout
        return [l.strip() for l in out.splitlines() if "post-for-me" in l]
    except Exception:
        return []


def check_api(key: str):
    req = urllib.request.Request(API, headers={"Authorization": f"Bearer {key}"}, method="GET")
    try:
        with urllib.request.urlopen(req, timeout=45) as r:
            payload = json.loads(r.read().decode("utf-8"))
        accounts = payload.get("data", [])
        by_platform = {}
        for a in accounts:
            by_platform[a.get("platform", "?")] = by_platform.get(a.get("platform", "?"), 0) + 1
        detail = ", ".join(f"{k}: {v}" for k, v in sorted(by_platform.items())) or "none"
        return True, f"{len(accounts)} connected account(s) -> {detail}"
    except urllib.error.HTTPError as e:
        if e.code == 401:
            return False, "HTTP 401: the key is invalid or was revoked."
        return False, f"HTTP {e.code}"
    except Exception as e:
        return False, f"Could not reach the API: {e}"


def main() -> int:
    p = argparse.ArgumentParser(description="Verify the Post for Me MCP (read-only).")
    p.add_argument("--name", default=DEFAULT_NAME)
    p.add_argument("--config", default=None)
    p.add_argument("--check-api", action="store_true", help="GET request to validate the key")
    args = p.parse_args()

    cfg = Path(args.config) if args.config else desktop_config_path()
    problems = 0

    print("=" * 62)
    print(" Post for Me MCP verification")
    print("=" * 62)
    print(f"{INFO} Config : {cfg}")

    # 1. Configuration
    if not cfg.exists():
        print(f"{BAD} The file does not exist. There is no install to verify.")
        return 1
    try:
        data = json.loads(cfg.read_text(encoding="utf-8-sig"))
    except json.JSONDecodeError as e:
        print(f"{BAD} Invalid JSON (line {e.lineno}): {e.msg}")
        print("    Claude discards the whole file when it cannot parse it.")
        return 1
    print(f"{OK} Valid JSON")

    entry = (data.get("mcpServers") or {}).get(args.name)
    if not entry:
        print(f"{BAD} No '{args.name}' entry under mcpServers.")
        print("    If it used to be there, it was probably edited with the app open.")
        return 1
    print(f"{OK} Entry '{args.name}' present")

    cmd = entry.get("command", "")
    print(f"{INFO} command: {cmd}")
    if platform.system() == "Windows" and cmd.lower() in ("npx", "npx.cmd") and not os.path.isabs(cmd):
        print(f"{BAD} Windows needs the absolute path to npx.cmd; this will not start.")
        problems += 1
    print(f"{INFO} args   : {' '.join(entry.get('args', []))}")

    key = (entry.get("env") or {}).get(ENV_VAR, "")
    if key:
        print(f"{OK} Key configured: {mask(key)}")
    else:
        print(f"{BAD} {ENV_VAR} missing from env.")
        problems += 1

    # 2. Environment
    node = shutil.which("node")
    print(f"{OK} node: {node}" if node else f"{BAD} node not found")
    if not node:
        problems += 1

    # 3. Processes
    procs = server_processes()
    if procs:
        print(f"{OK} Server running ({len(procs)} related process(es))")
    else:
        print(f"{WARN} No server processes. Normal if Claude is closed.")

    # 4. Logs
    ld = logs_dir()
    slog = ld / f"mcp-server-{args.name}.log"
    if slog.exists():
        size = slog.stat().st_size
        if size == 0:
            print(f"{OK} {slog.name} is empty: nothing logged yet")
        else:
            # This log accumulates history across every session, not just the
            # last one. Two traps when reading it:
            #  - Having content means nothing on its own: it stores
            #    informational startup and protocol traffic.
            #  - "Server disconnected" appears every time Claude closes.
            #    That is a normal shutdown, not a failure.
            # What matters is the most recent state: if the last successful
            # startup came after the last real failure, it is fine now.
            lines = slog.read_text(encoding="utf-8", errors="replace").splitlines()
            FAIL = ('"level":"error"', '"level":"fatal"', "ENOENT",
                    "is not recognized", "spawn ", "Cannot find module")
            START = ("running on stdio", "connected successfully", "Server started")

            last_fail = max((i for i, l in enumerate(lines) if any(m in l for m in FAIL)), default=-1)
            last_start = max((i for i, l in enumerate(lines) if any(m in l for m in START)), default=-1)
            closes = sum(1 for l in lines if "Server disconnected" in l)

            print(f"{INFO} {slog.name}: {len(lines)} lines, {closes} session close(s) (normal)")
            if last_fail > last_start:
                print(f"{BAD} The latest event in the log is a failure, not a startup:")
                print("      " + lines[last_fail][:150])
                problems += 1
            elif last_start >= 0:
                print(f"{OK} The most recent startup was successful")
            else:
                print(f"{WARN} No startup line at all. Claude has not launched it yet.")
    else:
        print(f"{WARN} {slog.name} does not exist. Claude has not launched it yet.")

    # 5. API (read-only)
    if args.check_api:
        if not key:
            print(f"{BAD} Cannot query the API without a key.")
            problems += 1
        else:
            ok, detail = check_api(key)
            print(f"{OK} API responded. {detail}" if ok else f"{BAD} {detail}")
            if not ok:
                problems += 1

    print()
    if problems == 0:
        print(f"{OK} All good.")
        print("    Final test in the chat: 'what accounts do I have connected in Post for Me'")
        print("    (a read query; do not publish anything to test)")
    else:
        print(f"{BAD} {problems} problem(s). See references/troubleshooting.md")
    return 0 if problems == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
