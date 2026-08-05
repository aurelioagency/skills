# Brand Mascot

An agent skill for creating a reusable brand mascot and generating new poses without letting the character's identity, anatomy, proportions, colors, or internal layout drift.

```text
brand brief → transparent master → measured character sheet → consistent pose → color correction → visual QA → transparent PNG
```

The workflow keeps one canonical `master.png` per mascot. Every new pose starts from that master—not from a previous pose—and passes deterministic color correction, transparency checks, and a visual comparison before delivery.

Works with file-based agent harnesses that can generate images and run local Python scripts, including Codex and similarly capable local agents.

## What's in this folder

| Path | Purpose |
|---|---|
| [SKILL.md](SKILL.md) | Complete mascot creation, pose generation, correction, and QA workflow |
| [scripts/mascot.py](scripts/mascot.py) | Measures master colors, removes controlled chroma backgrounds, corrects pose colors, and reports diagnostics |
| [scripts/test_mascot.py](scripts/test_mascot.py) | Regression tests for the mascot processing script |

## Key features

- **One canonical identity reference** — every pose uses only the mascot's `master.png`; generated poses are never chained as references.
- **Persistent character specification** — `CHARACTER.md` records anatomy, repertoire, colors, rigid geometry, internal layout, and the verification checklist.
- **Measured color consistency** — the bundled script extracts material colors from the master and corrects each generated pose back to them.
- **Protected props** — one-off props and clothing can be masked so their intended colors survive character color correction.
- **Strict transparency** — delivered masters and poses must be real RGBA PNGs with transparent corners and clean contours.
- **Five independent QA gates** — identity/anatomy, geometry, color, props, and expression semantics must all pass.
- **Clean artifact contract** — one request produces one finished PNG; temporary generations, masks, proofs, and rejected attempts are removed.

## Installation

**Option A — let your agent install it (recommended).** Open a local coding agent and paste:

```text
Install the brand-mascot skill from https://github.com/aurelioagency/skills :
1. Run: git clone --filter=blob:none --sparse https://github.com/aurelioagency/skills.git into a temporary folder.
2. Inside it, run: git sparse-checkout set brand-mascot
3. Copy the brand-mascot/ folder into my active personal skills directory as brand-mascot/.
4. Delete the temporary clone and confirm SKILL.md loads.
5. Check the requirements: Python 3, NumPy, Pillow, and a callable image-generation tool.
   Install anything missing (ask me to approve each install command).
6. Run: python scripts/test_mascot.py
7. Explain how to create my first mascot and ask whether we should start now.
```

The agent fetches only this skill, installs it permanently for future chats, validates the bundled script, and walks you into the first mascot brief.

**Option B — manual.** Clone the repo and use the bundled installer:

```powershell
git clone https://github.com/aurelioagency/skills.git
cd skills
node install-skills.mjs brand-mascot          # Claude Code
node install-skills.mjs brand-mascot --codex  # Codex
```

Any other file-based harness can point directly at this folder's `SKILL.md`.

## Updating

Improvements land in this repo; an installed copy does not update itself. Re-run the installer from an up-to-date clone:

```powershell
git pull
node install-skills.mjs brand-mascot
node install-skills.mjs brand-mascot --codex
```

Check whether an update is available without installing it:

```powershell
node install-skills.mjs brand-mascot --check
node install-skills.mjs brand-mascot --codex --check
```

The installer replaces only the installed skill folder. Mascot project folders, masters, character sheets, catalogs, and completed poses live outside the skill and are not touched.

## Uninstalling

From a clone of the repo:

```powershell
node install-skills.mjs brand-mascot --remove
node install-skills.mjs brand-mascot --codex --remove
```

Removing the skill does not remove any mascot project or generated asset.

## Requirements

- **Python 3** on `PATH`.
- **NumPy** and **Pillow** for measurement, correction, masking, and PNG validation.
- **A callable image-generation tool** that accepts a reference image. Native transparent output is preferred; controlled flat-chroma output is supported.
- **Local file access** so the agent can maintain each mascot's master, character sheet, pose catalog, and temporary work folder.

Run the regression suite with:

```powershell
python scripts/test_mascot.py
```

## Usage

### Create a mascot

Describe the brand and whatever is already decided. Reference images are welcome; identify whether each one is for the subject, visual style, palette, or an existing character.

> Create a friendly 3D mascot for my coffee brand. It should be a fully personified coffee bean in our brown and coral palette, mainly for Instagram carousels.

The skill guides the unresolved design choices, generates a neutral full-body master, verifies real transparency, measures its colors, and writes the character specification used by every future pose.

### Generate a new pose

Point the agent at the mascot folder and describe the action:

> Using the mascot in `C:\path\to\my-mascot`, create a welcoming pose waving with its right hand.

The skill reads `CHARACTER.md` and `catalog.md`, opens `master.png`, completes the pose spatially, generates from the master, corrects color, runs all visual gates, updates the catalog, and delivers one transparent PNG under `poses/`.

### Mascot project structure

```text
my-mascot/
  master.png        # the only canonical character reference
  CHARACTER.md      # identity, repertoire, colors, geometry, QA checklist
  catalog.md        # approved poses and exact prop specifications
  poses/            # one transparent PNG per approved pose
  work/             # temporary production files; removed after completion
```

## License

MIT — see [LICENSE](../LICENSE) at the repo root.
