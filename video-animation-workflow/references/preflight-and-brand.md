# Preflight and reusable brand profiles

## Contents

- [Capability tiers](#capability-tiers)
- [Dependency procedure](#dependency-procedure)
- [Image-generation capability](#image-generation-capability)
- [Brand discovery order](#brand-discovery-order)
- [Persistent profile structure](#persistent-profile-structure)
- [Profile update rules](#profile-update-rules)

## Capability tiers

Classify the active environment before promising output:

| Tier | Minimum capabilities | Valid result |
|---|---|---|
| Full production | Persistent files, local commands, Node/npx, browser render, HyperFrames, callable image generator | Storyboard sheets, assets, editable animation, audio stems, MP4 renders |
| Production without native ImageGen | Full local production except a callable raster generator | Continue through storyboard specifications, then pause with an asset prompt manifest |
| Planning only | Conversation and file attachments, but no persistent project or local render process | Contract, script, timing map, screen map, storyboard specification |

Never claim that an agent brand guarantees a tier. Inspect the available tools.

## Dependency procedure

Run `scripts/preflight.mjs`. When a dependency is missing, present the exact applicable command:

```text
npx skills add heygen-com/hyperframes --all
git clone https://github.com/blader/humanizer.git "<personal-skills-dir>/humanizer"
```

For an existing HyperFrames installation:

```text
npx hyperframes skills check --json
npx hyperframes skills update
```

The check is read-only after the HyperFrames CLI exists. The update is not. Ask before the initial install, every update, and every replacement.

If `humanizer` exists but its files do not prove the `blader/humanizer` source:

1. Preserve it.
2. Report its exact path.
3. Ask whether to replace it, use it as-is, or install the verified version in another skill root.
4. Never delete an existing skill merely to make the preflight green.

## Image-generation capability

Inspect tool names and schemas for a callable raster image generator. Rank routes:

1. user-selected provider;
2. OpenAI ImageGen when callable;
3. another native callable generator;
4. no generator: create prompts and pause before raster production.

Do not use a screenshot tool, SVG placeholder, emoji, CSS drawing, or approximate icon as a substitute for a required generated raster asset.

If tool metadata is ambiguous, explain the uncertainty and ask before one disposable generation test. A successful test proves the call path, not artistic quality.

## Brand discovery order

1. Inspect the current request.
2. Run `scripts/discover-brand.mjs`.
3. Search explicit brand files and high-authority project instructions.
4. List persistent profiles with `scripts/brand-profile.mjs list`.
5. Inspect the likely profile.
6. Ask for brand name if still unresolved.
7. Ask only for missing decisions that block the active video.

Look for:

- brand or design guides;
- websites and product pages;
- CSS variables and font declarations;
- exact logos and wordmarks;
- existing licensed fonts;
- published or approved videos;
- scripts, captions, transcripts, and writing samples;
- explicit forbidden treatments.

Frequency is evidence, not authority. A common color in screenshots is not automatically the primary color.

## Persistent profile structure

```text
~/.video-animation-workflow/
  brands/
    <brand-slug>/
      brand-profile.json
      brand-profile.md
      voice-profile.md
      asset-manifest.json
      assets/
        logos/
        fonts/
        images/
      references/
      samples/
        writing/
        audio/
        video/
```

`VIDEO_ANIMATION_WORKFLOW_HOME` may override the root.

Support multiple brands. Never silently merge two profiles. Select one active brand per job and record its path in `VIDEO_CONTRACT.md`.

## Profile update rules

- Copy a logo, font, or image into the profile only with user approval.
- Record the original path or URL, relative destination, purpose, approval status, and SHA-256.
- Preserve old decisions and surface conflicts.
- Treat explicit current user direction as higher authority than discovered project patterns.
- Do not infer voice from one sentence. Prefer multiple writing samples or a real audio/video sample.
- A missing sample is a gap to ask about, not permission to invent a personality.
