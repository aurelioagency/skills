# Resource Page — Per-Reel Resource Page Skill

An agent skill that creates the web page for the resource a reel promises, at `aurelioagency.com/blog/<slug>`, and returns its URL:

```
approved video → resource read → trilingual description → entry in the site repo → push to main → wait until online → URL
```

That URL is the single link the DM automation sends, so people land on the agency's site instead of the raw repo. The page is unlisted and `noindex`: it doesn't appear in the `/blog` list or in Google, and nothing links to it — only someone who receives the DM reaches it.

Works with agent harnesses that support file-based skills (Claude Code, Codex, and similar). `SKILL.md` is written in Spanish.

> **Note — this skill is tied to one website.** It edits the `Aurelio-Agency-Website` repository and publishes to `aurelioagency.com`. To use it for another site, adapt `scripts/add-resource.mjs` and the repo path.

## What's in this folder

| Path | Purpose |
|---|---|
| [SKILL.md](SKILL.md) | The skill: what data each resource needs, how to write the description, how to run it, exit codes, known problems |
| [scripts/add-resource.mjs](scripts/add-resource.mjs) | Adds the entry to the site repo, type-checks, commits, pushes, and waits for the page to answer 200 |

## Where it sits in the flow

1. [social-video-producer](../social-video-producer/) delivers the approved video.
2. **resource-page** creates the page and returns the URL.
3. [replykaro-automation](../replykaro-automation/) creates the comment-to-DM automation with `--link <that URL>`.

All of it belongs to the same approval — no second "OK" is asked.

## Key features

- **Description written from the resource itself.** It reads the repo or site (description, README, homepage) and cross-checks the approved video, then writes 2–3 simple sentences: what it is, what problem it solves, one or two concrete things it does.
- **Only confirmed facts.** Every claim must come from the README, the official description, or the video — nothing invented, no copied marketing slogans.
- **Three languages enforced.** The site requires `es`, `en`, and `br`; the script refuses to load just one. They are written naturally, not translated word by word.
- **One small commit to `main`.** Adds the block to `src/lib/resource-drops.ts`, runs `tsc`, commits (no co-author trailer), pushes.
- **Waits for the deploy.** Up to 5 minutes for the page to respond 200, then prints `ONLINE: <url>`. The URL carries no language — the site redirects each person to theirs.
- **Safe by default.** Refuses to run if the site repo has uncommitted changes, never reuses a slug, and offers `--dry-run` to preview the block without writing anything.
- **Fails loudly.** Exit `0` online, `4` pushed but not answering yet (the next skill must not run — the DM would carry a 404), `1` error.

## Installation

**Option A — let your agent install it (recommended).** Open Claude Code and paste:

```text
Install the resource-page skill from https://github.com/aurelioagency/skills :
1. Run: git clone --filter=blob:none --sparse https://github.com/aurelioagency/skills.git into a temporary folder.
2. Inside it, run: git sparse-checkout set resource-page
3. Copy the resource-page/ folder into ~/.claude/skills/resource-page/
4. Delete the temporary clone and confirm the skill loads.
5. Check the requirements: Node 18+, git, the gh CLI, and a clone of the site repo
   at Documents\Aurelio-Agency-Website. Set up anything missing (ask me to approve
   each command).
6. Explain how to use the skill, tell me where its files ended up on my machine,
   and ask me if we create my first resource page now.
```

**Option B — manual.** Clone the repo and run the bundled installer:

```powershell
git clone https://github.com/aurelioagency/skills.git
cd skills
node install-skills.mjs resource-page          # Claude Code
node install-skills.mjs resource-page --codex  # Codex
```

Any other harness: point it at this folder's `SKILL.md`.

## Updating

Improvements land in the repo; your installed copy never updates itself. To update, re-run the installer from an up-to-date clone — it replaces the installed skill cleanly, keeps its `node_modules`, and records the installed commit in `.installed-from.json`:

```powershell
git pull
node install-skills.mjs resource-page
```

To find out whether you are behind without installing anything:

```powershell
node install-skills.mjs resource-page --check
```

## Uninstalling

The installed skill lives in `~/.claude/skills/resource-page/`. Removing it touches nothing else — pages already published stay on the site. From a clone:

```powershell
node install-skills.mjs resource-page --remove
```

Or simply delete that folder yourself.

## Requirements

- **Node.js 18+** — the script is plain `node`, no install step.
- **git**, with push access to the site repo.
- **The site repo** cloned at `%USERPROFILE%\Documents\Aurelio-Agency-Website`. It is shared with other people, so keep it clean.
- **The `gh` CLI** (or web fetching) to read the resource's repo for the description.
- **No API keys and no paid providers.**

## Usage

Normally it runs on its own as part of the video delivery chain. It can also be invoked directly:

> Armá la página del recurso

> Creá la URL del recurso de este reel

> Sumá un recurso nuevo a la web

It always returns the page URL as a link in the final answer. It never publishes a page for a resource the user hasn't approved.

## License

MIT — see [LICENSE](../LICENSE) at the repo root.
