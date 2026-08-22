# kieai-minimax-h3

Short visual-effect clips (4–15 s) generated with **MiniMax H3 on [KIE.ai](https://kie.ai)**, from an
agent that talks you through the technique first and refuses to spend a credit before you approve
the number.

What it does:

- **Interviews you only when you need it.** Know the animation you want? It takes it and builds.
  Don't? Three questions — what it's for, whether it gets spliced into another video, what it should
  feel like — and then it offers techniques by name from a bundled
  [eyecannndy.com](https://eyecannndy.com) catalogue, with the link to each one.
- **Picks the right mode.** image-to-video (exact first and last frame, the only one that splices
  cleanly), reference-to-video (up to 9 images and 3 videos, no frame control), or text-to-video.
- **Writes the prompt with the rules that this model needs** — the framing clause that stops it from
  inventing walls, the scale clause that stops it from pulling the camera back, the anchors that stop
  objects from floating. Every one of them learned by burning credits.
- **Shows you the prompt in your language**, sends the English one.
- **Estimates the credits and stops.** The CLI will not submit without an explicit `--yes` that means
  "the user approved this cost". Input video seconds are billed too, and the estimate says so.
- **Polls, downloads, and verifies.** A 4×4 contact sheet plus the real first and last frames, judged
  against a six-point checklist: did it land on the final frame, did it invent scenery, is the effect
  actually there, did anything fuse, did anything float, do the numbers match.
- **Logs every run** — both prompts, parameters, taskId, credits, verdict — so a good take is
  traceable and a bad one is diagnosable.

Works the same in Claude Code and Codex: all the API and ffmpeg work lives in one CLI, not in
agent-improvised calls.

## Requirements

- **Node 18+** (no dependencies to install)
- **ffmpeg / ffprobe** on PATH — for the contact sheet and the credit estimate
- **A KIE.ai API key** with credits, as `KIE_API_KEY`

Set the key as a user environment variable:

```bash
setx KIE_API_KEY "your-key-here"
```

Or put `KIE_API_KEY=your-key-here` in a `.env` file inside the job folder. Never commit it.

## Install

Paste this into Claude Code or Codex:

```text
Install the kieai-minimax-h3 skill from https://github.com/aurelioagency/skills :
1. Run: git clone --filter=blob:none --sparse https://github.com/aurelioagency/skills.git into a temporary folder.
2. Inside it, run: git sparse-checkout set kieai-minimax-h3
3. Copy the kieai-minimax-h3/ folder into ~/.claude/skills/kieai-minimax-h3/
4. Delete the temporary clone and confirm the skill loads.
5. Check the skill's requirements (see its README) and install anything missing
   (ask me to approve each install command).
6. Explain how to use the skill, tell me where its files ended up on my machine,
   and ask me if we start my first clip now.
```

Or, from a full clone of the repo:

```bash
node install-skills.mjs kieai-minimax-h3
```

Add `--codex` to install into `~/.codex/skills/` instead.

## Use it

Just ask, in whatever language you speak:

> I need a 4-second clip where the camera rolls 360° around the bottle and lands exactly on this
> frame, to splice into a reel.

Or, if you don't know what you want yet:

> I need something with more punch between these two shots. What are my options?

## The CLI

The agent drives this for you, but it is a normal CLI:

```bash
node scripts/kie.mjs config --base "<folder>"     # where all jobs are stored, asked once
node scripts/kie.mjs credits                      # credit balance
node scripts/kie.mjs init <slug> --mode i2v       # new job folder + job.json skeleton
node scripts/kie.mjs upload --job <dir>           # upload local inputs, save the URLs
node scripts/kie.mjs estimate --job <dir>         # cost, before spending anything
node scripts/kie.mjs create --job <dir> --yes     # submit (refuses without --yes)
node scripts/kie.mjs poll --job <dir>             # wait, then download the MP4
node scripts/kie.mjs verify --job <dir>           # contact sheet + first/last frame
node scripts/kie.mjs run --job <dir> --yes        # the whole pipeline
```

A job folder looks like this:

```text
<base>/<slug>/
  job.json          mode, both prompts, duration, resolution, inputs
  in/               your source images and videos
  uploads.json      the URLs KIE gave back (they expire in 24h)
  task.json         taskId and the exact payload that was sent
  out/
    <slug>.mp4
    contact-sheet.png
    frame-first.png
    frame-last.png
    verify.json
  log.md            every run: prompts, parameters, credits, verdict
```

## What this model can and cannot do

Read [`references/model-limits.md`](references/model-limits.md) for the full contract. The short
version:

| | |
|---|---|
| Duration | 4–15 s, integer |
| Resolution | `768P` (16 credits/s) or `2K` (26 credits/s) — the skill defaults to 768P, the API defaults to 2K |
| Billing | `rate × (generated seconds + input video seconds)` |
| image-to-video | exactly 2 images: first frame and last frame |
| reference-to-video | up to 9 images + 3 videos + 3 audios, no frame control |
| Seed | **none** — nothing is reproducible |

That last row is the one that matters: a 768P take that came out right **cannot** be re-rendered at
2K. A 2K pass is a fresh roll of the dice. The skill says so before you pay for it.

Camera movement is **not** inherited from a reference video — verified twice. Appearance survives,
motion does not. Ask for the movement in words.

## License

MIT, same as the rest of the repo. The eyecannndy catalogue is a cached index of publicly listed
technique names and links from [eyecannndy.com](https://eyecannndy.com), which remains theirs.
