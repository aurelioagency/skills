# Motion Reel Pipeline — Animated Reel Workflow Skill

An agent skill that states the whole workflow of an animated reel built with motion-reel, in the order it is done, and calls the skill that handles each step:

```
reel → motion graphics + subtitles + cover + caption → approval → Drive → resource page → reply automation → publish
```

It adds no rules of its own: each step keeps the rules of its skill, and every one of those skills still works on its own.

Works with agent harnesses that support file-based skills (Claude Code, Codex, and similar). `SKILL.md` is written in Spanish.

## The order of work

1. **You hand over the reel.** [motion-reel](../motion-reel/) (Branch B) animates the video and creates the subtitles and the cover (frame 0). [social-video-producer](../social-video-producer/) creates the caption, the fallback DM message and the delivery folder, since motion-reel does not. You approve the video, the cover and the caption.
2. **Approved → Drive.** `social-video-producer` uploads the folder to the shared drive (Reels).
3. **Resource page.** [resource-page](../resource-page/) creates the page for the resource and returns its URL.
4. **Reply automation.** [replykaro-automation](../replykaro-automation/) creates the comment-to-DM automation with that URL.
5. **Publish.** [post-for-me](../post-for-me/) publishes to LinkedIn, TikTok and YouTube Shorts. Instagram is uploaded by hand from Edits.
6. **Wrap-up.** You get the delivery folder, the page URL and the links of what was published.

## What's in this folder

| Path | Purpose |
|---|---|
| [SKILL.md](SKILL.md) | The skill: the order of work above |

## The six skills in the package

| Skill | Step |
|---|---|
| `motion-reel-pipeline` | The order of work |
| [motion-reel](../motion-reel/) | Motion graphics, subtitles, cover |
| [social-video-producer](../social-video-producer/) | Caption, fallback DM, delivery, Drive |
| [resource-page](../resource-page/) | The resource page |
| [replykaro-automation](../replykaro-automation/) | The comment-to-DM automation |
| [post-for-me](../post-for-me/) | Publishing to LinkedIn, TikTok and YouTube Shorts |

Installing `motion-reel-pipeline` alone installs only that skill. The installer copies one skill per name, so the prompt below installs all six together.

## Installation

**Option A — let your agent install it (recommended).** Open Claude Code and paste:

```text
Install the Motion Reel Pipeline package from https://github.com/aurelioagency/skills :
1. Run: git clone --filter=blob:none --sparse https://github.com/aurelioagency/skills.git into a temporary folder.
2. Inside it, run: git sparse-checkout set motion-reel-pipeline motion-reel social-video-producer resource-page replykaro-automation post-for-me
3. Copy those six folders into ~/.claude/skills/ (one folder each).
4. Delete the temporary clone and confirm the six skills load.
5. Check the requirements of each skill (see its README) and set up anything missing,
   asking me to approve each command.
6. Explain how the reel workflow goes, tell me where the files ended up on my machine,
   and ask me if we start my first reel now.
```

**Option B — manual.** Clone the repo and run the bundled installer with the six names:

```powershell
git clone https://github.com/aurelioagency/skills.git
cd skills
node install-skills.mjs motion-reel-pipeline motion-reel social-video-producer resource-page replykaro-automation post-for-me          # Claude Code
node install-skills.mjs motion-reel-pipeline motion-reel social-video-producer resource-page replykaro-automation post-for-me --codex  # Codex
```

Any other harness: point it at each folder's `SKILL.md`.

## Updating

Your installed copies never update themselves. To update, re-run the installer from an up-to-date clone with the same six names:

```powershell
git pull
node install-skills.mjs motion-reel-pipeline motion-reel social-video-producer resource-page replykaro-automation post-for-me
```

To find out whether you are behind without installing anything, add `--check`.

## Uninstalling

Removing `motion-reel-pipeline` touches nothing else, and the other five keep working on their own:

```powershell
node install-skills.mjs motion-reel-pipeline --remove
```

To remove the whole package, pass all six names with `--remove`.

## Requirements

Each skill lists its own in its README (Node, ffmpeg, Python, API keys and accounts). `motion-reel-pipeline` itself needs nothing.

## Usage

> Te paso el reel para motion

> Armá todo el flujo con motion-reel

> Motion reel pipeline

## License

MIT — see [LICENSE](../LICENSE) at the repo root.
