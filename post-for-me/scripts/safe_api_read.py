#!/usr/bin/env python3
"""Read Post for Me data without printing account credentials or raw API objects."""

from __future__ import annotations

import argparse
import json
import re
import sys
import urllib.error
import urllib.parse
import urllib.request

from verify_mcp import desktop_config_path

API = "https://api.postforme.dev/v1"
POST_ID = re.compile(r"^sp_[A-Za-z0-9]+$")
CONFIG_FIELDS = {"title", "placement", "privacy_status", "is_draft", "share_to_feed"}


def pick(obj: dict, *fields: str) -> dict:
    return {field: obj.get(field) for field in fields}


def safe_account(obj) -> dict:
    if isinstance(obj, str):
        return {"id": obj}
    return pick(obj, "id", "platform", "username", "status")


def safe_post(obj: dict) -> dict:
    if not obj.get("id"):
        raise ValueError("Post for Me response has no post id")
    result = pick(obj, "id", "external_id", "status", "created_at", "scheduled_at", "caption")
    result["social_accounts"] = [safe_account(account) for account in obj.get("social_accounts") or []]
    result["account_configurations"] = [
        {
            "social_account_id": entry.get("social_account_id"),
            "configuration": {key: value for key, value in (entry.get("configuration") or {}).items()
                              if key in CONFIG_FIELDS},
        }
        for entry in obj.get("account_configurations") or []
    ]
    result["media_count"] = len(obj.get("media") or [])
    return result


def safe_result(obj: dict) -> dict:
    # The first line is enough to identify a platform error such as a quota failure.
    # Never print a raw error payload; it may embed request or account details.
    error = obj.get("error")
    summary = str(error).splitlines()[0][:180] if error else None
    if summary:
        summary = re.sub(r"(?i)(bearer\s+|pfm_live_|act\.|rft\.|ya29\.)\S+", "[REDACTED]", summary)
    return {
        "social_account_id": obj.get("social_account_id"),
        "success": obj.get("success"),
        "error_summary": summary,
        "url": (obj.get("platform_data") or {}).get("url"),
    }


def get(path: str, key: str) -> dict:
    req = urllib.request.Request(f"{API}/{path}", headers={"Authorization": f"Bearer {key}"})
    try:
        with urllib.request.urlopen(req, timeout=45) as response:
            return json.load(response)
    except urllib.error.HTTPError as error:
        raise RuntimeError(f"Post for Me returned HTTP {error.code}") from None


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--accounts", action="store_true")
    group.add_argument("--recent", action="store_true")
    group.add_argument("--external-id", metavar="SLUG")
    group.add_argument("--post", metavar="POST_ID")
    group.add_argument("--results", metavar="POST_ID")
    group.add_argument("--response", action="store_true", help="Safely project a JSON response from stdin")
    args = parser.parse_args()

    if args.response:
        output = safe_post(json.load(sys.stdin))
    else:
        config = json.loads(desktop_config_path().read_text(encoding="utf-8-sig"))
        key = config["mcpServers"]["post_for_me_api"]["env"]["POST_FOR_ME_API_KEY"]
        if args.accounts:
            output = [safe_account(account) for account in get("social-accounts?limit=50", key).get("data", [])
                      if account.get("status") == "connected"]
        elif args.recent:
            output = [pick(post, "id", "external_id", "status", "created_at", "scheduled_at")
                      for post in get("social-posts?limit=20", key).get("data", [])]
        elif args.external_id:
            query = urllib.parse.urlencode({"external_id": args.external_id})
            output = [pick(post, "id", "external_id", "status", "scheduled_at")
                      for post in get(f"social-posts?{query}", key).get("data", [])
                      if post.get("external_id") == args.external_id]
        else:
            post_id = args.post or args.results
            if not POST_ID.fullmatch(post_id):
                parser.error("Invalid Post for Me post ID")
            if args.post:
                output = safe_post(get(f"social-posts/{post_id}", key))
            else:
                output = [safe_result(item) for item in get(f"social-post-results?post_id={post_id}", key)
                          .get("data", [])]

    print(json.dumps(output, ensure_ascii=True, indent=2))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (KeyError, FileNotFoundError, urllib.error.URLError, json.JSONDecodeError, ValueError) as error:
        print(f"Could not read Post for Me data ({type(error).__name__}).", file=sys.stderr)
        raise SystemExit(1) from None
