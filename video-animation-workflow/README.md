# Video Animation Workflow

An agent skill for turning recorded audio, video, a script, or a topic into a branded motion-graphics video:

```text
source → brand profile → script → timing and screen map → storyboard → assets → HyperFrames animation → sound design → MP4 + editable source
```

It is designed first for Claude Code and Codex, with capability-based support for Gemini CLI, OpenCode, and other file-capable agents. Codex uses OpenAI ImageGen when that tool is available. Other agents use their callable native image generator. The skill never assumes image generation merely from the agent's name.

The default production contract is 15–30 seconds. Real audio sets the timing when supplied. A script-only job uses provisional timing and does not generate a voice unless the user explicitly asks for one.

## What is included

| Path | Purpose |
|---|---|
| [SKILL.md](SKILL.md) | Approval-gated production workflow |
| [scripts/preflight.mjs](scripts/preflight.mjs) | Detects OS, agent, skill roots, HyperFrames, Humanizer, and the persistent brand home |
| [scripts/discover-brand.mjs](scripts/discover-brand.mjs) | Finds existing brand evidence in a project before asking questions |
| [scripts/brand-profile.mjs](scripts/brand-profile.mjs) | Creates and reuses persistent multi-brand profiles |
| [references/](references/) | Contracts for onboarding, scripts, screen maps, storyboards, assets, captions, sound, QA, and delivery |
| [assets/starter-library/](assets/starter-library/) | Production/source images, semantic SFX, open fonts, and caption/typography guides |
| [assets/reference-projects/](assets/reference-projects/) | Editable HyperFrames reference compositions for 16:9 and 9:16 |
| [assets/reference-proof/](assets/reference-proof/) | Storyboards, prompts, approved checkpoints, and final reference MP4s |
| [assets/manifest.json](assets/manifest.json) | Bundled-file provenance, purpose, size, and SHA-256 |

The reference production demonstrates the workflow. It is not a fixed visual template. Every new job resolves the user's own brand first.

## Environment support

| Environment | Support |
|---|---|
| Codex with local files and commands | Full production; OpenAI ImageGen preferred when callable |
| Claude Code | Full production when a callable image generator is connected |
| Gemini CLI / OpenCode / similar local agent | Full production when required tools are available |
| Browser-only chat without persistent files or local commands | Planning package only; it cannot render HyperFrames locally |

## Installation

### Let the agent install it

Paste this into a local coding agent:

```text
Install the video-animation-workflow skill from https://github.com/aurelioagency/skills :
1. Detect my operating system, active agent, and personal skills directory.
2. Clone https://github.com/aurelioagency/skills.git into a temporary folder using a sparse checkout.
3. Run: git sparse-checkout set video-animation-workflow
4. Copy video-animation-workflow/ into my active personal skills directory as video-animation-workflow/.
5. Delete the temporary clone and confirm SKILL.md loads.
6. Run the skill's read-only scripts/preflight.mjs against my current project.
7. If HyperFrames is missing, show me the exact official install command from the preflight and ask permission before running it.
8. If the verified blader/humanizer skill is missing, show me the exact install command and ask permission before running it.
9. Inspect the active tool registry for a callable image-generation tool. Do not infer it from the agent brand and do not run a paid test without asking.
10. Search my current project for an existing brand identity, then list or create the persistent brand profile under ~/.video-animation-workflow/brands/.
11. Explain what was installed and ask for my audio, video, script, or topic plus the desired format.
```

### Manual installation

```powershell
git clone https://github.com/aurelioagency/skills.git
cd skills
node install-skills.mjs video-animation-workflow
node install-skills.mjs video-animation-workflow --codex
```

The first command installs to Claude Code. The second installs to Codex. Use `--dest <skills-directory>` for another file-based agent.

## First-run preflight

```powershell
node scripts/preflight.mjs --project "C:\path\to\project"
node scripts/discover-brand.mjs --project "C:\path\to\project" --json
node scripts/brand-profile.mjs list
```

The preflight does not install or update anything. It reports exact commands. The agent must ask before running them.

Missing HyperFrames:

```text
npx skills add heygen-com/hyperframes --all
```

Missing verified Humanizer:

```text
git clone https://github.com/blader/humanizer.git "<personal-skills-dir>/humanizer"
```

## Persistent brand profiles

Profiles are reusable across every project:

```text
~/.video-animation-workflow/brands/<brand-slug>/
```

Each profile stores:

- brand name, websites, audience, and offer;
- exact colors and their roles;
- anchor, connector, and editorial typography;
- approved logo, font, and image files;
- visual, caption, motion, and sound rules;
- writing, audio, video, and approved-script evidence;
- forbidden treatments;
- a manifest of copied assets and their hashes.

The skill searches the current project and existing profiles before asking questions. It asks only for unresolved gaps.

## Usage

Examples:

> Animate this 22-second voice note as a 9:16 Reel using my saved Acme brand profile.

> Turn this script into a 16:9 animated YouTube introduction. Do not generate a voice.

> Create the script and storyboard for a 25-second launch animation about this feature, then wait for approval.

> Make both 16:9 and 9:16 versions with the same script and timing, but compose each format intentionally.

## Approval sequence

1. Acceptance contract and format.
2. Script.
3. Timing map and exact content of every screen.
4. Storyboard sheets and asset manifest.
5. Animation checkpoints.
6. Sound design.
7. Final encoded renders and editable package.

The skill cannot skip a gate because later production has already started.

## Default delivery

With source audio:

```text
master_full_mix.mp4
plain_video.mp4
sfx_stem.wav
source_audio_stem.wav
editable HyperFrames source
contracts, storyboards, manifests, snapshots, and validation
```

Without source audio, the package contains the SFX mix/stem and does not invent a voice.

When two formats are requested, both share narrative and timing but use separate layouts and render projects.

## Updating

```powershell
git pull
node install-skills.mjs video-animation-workflow
node install-skills.mjs video-animation-workflow --codex
```

Check without installing:

```powershell
node install-skills.mjs video-animation-workflow --check
node install-skills.mjs video-animation-workflow --codex --check
```

## Uninstalling

```powershell
node install-skills.mjs video-animation-workflow --remove
node install-skills.mjs video-animation-workflow --codex --remove
```

Removing the skill does not remove persistent brand profiles or completed video projects.

## License

This skill and its original reference material are free for noncommercial use under the [PolyForm Noncommercial License 1.0.0](LICENSE).

Bundled Inter and Playfair Display fonts remain under the SIL Open Font License 1.1. Third-party tools and dependencies retain their own licenses. Users may add any fonts they are licensed to use; this repository does not grant rights to externally supplied fonts.
