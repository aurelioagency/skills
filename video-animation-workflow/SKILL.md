---
name: video-animation-workflow
description: Create approval-gated branded motion-graphics videos from recorded audio, video, an approved script, or a topic. Use for 15-30 second animated introductions, explainers, social videos, YouTube segments, Reels, Shorts, native kinetic captions, storyboard-led HyperFrames production, separate 16:9 and 9:16 compositions, semantic sound design, reusable brand profiles, or delivery of editable video source and separated media stems.
---

# Video Animation Workflow

Build short branded animations through approval gates. Prefer real audio because it provides exact caption and visual timing. When no audio exists, build from an approved script with provisional timing and do not generate a voice unless the user explicitly requests it.

## 1. Run the preflight

Run:

```text
node <skill>/scripts/preflight.mjs --project <project-root> --json
```

Use the report to detect the operating system, active agent, personal skill directories, HyperFrames core skills, and the exact `blader/humanizer` installation.

Before running any install, update, reinstallation, or paid capability test:

1. Show the user the exact command and why it is needed.
2. Ask for permission.
3. Run only the approved command.
4. Re-run the read-only preflight and confirm the dependency.

Install missing HyperFrames skills from `heygen-com/hyperframes`. Install missing Humanizer from `https://github.com/blader/humanizer.git`. Never replace an existing Humanizer whose source is unverified without explicit approval.

Inspect the active tool registry for a callable raster image generator. Prefer OpenAI ImageGen when multiple native tools are available unless the user chooses another provider. Detect capability, not agent branding. If capability remains ambiguous, ask before generating one disposable test image.

Read [preflight-and-brand.md](references/preflight-and-brand.md) for environment tiers, approved commands, and persistent profile behavior.

Completion criterion: the production tier is known; HyperFrames and Humanizer are ready or their exact blockers are recorded; one image-generation route is confirmed or declared unavailable.

## 2. Resolve the reusable brand

Run brand discovery before asking onboarding questions:

```text
node <skill>/scripts/discover-brand.mjs --project <project-root> --json
node <skill>/scripts/brand-profile.mjs list --json
```

Search the project for brand guides, websites, CSS tokens, logos, fonts, approved videos, scripts, captions, and writing or speaking samples. Treat discoveries as evidence, not approval.

If the brand is still unclear, ask its name first. Select an existing reusable profile or initialize one:

```text
node <skill>/scripts/brand-profile.mjs init --name "<brand>" --project <project-root> --json
```

Profiles live under `~/.video-animation-workflow/brands/<brand-slug>/` unless `VIDEO_ANIMATION_WORKFLOW_HOME` overrides the root. Store approved logos, fonts, imagery, source references, palette, typography roles, visual tone, motion tone, caption rules, sound rules, and voice evidence there. Preserve previous decisions. Ask only for gaps that prevent the active job.

Completion criterion: one named brand profile is active; every applied brand choice has project evidence, profile evidence, or explicit user approval; required logos and font files resolve to exact paths.

## 3. Establish the acceptance contract

Accept:

- recorded audio;
- a video with usable audio;
- an approved script;
- a topic or brief that needs a script.

Ask for the target format after inspecting the source:

- `16:9`;
- `9:16`;
- both;
- a custom canvas.

When both are requested, keep the same narrative, spoken timing, asset identity, and sound plan, but author two intentional compositions. Never crop one format into the other.

Default to 15-30 seconds. Real audio sets the working duration. If supplied audio or an approved script falls outside that range, estimate the true duration and ask whether to preserve it or reduce it. Do not silently speed up speech or cut meaning.

Record:

- source and source authority;
- audience and intended platform;
- language and regional voice;
- working duration and FPS;
- output formats;
- brand profile;
- product or message promise;
- required facts and proof;
- forbidden claims or visuals;
- audio status;
- approval gates;
- final deliverables.

Read [production-contract.md](references/production-contract.md) and create `VIDEO_CONTRACT.md` in the job folder.

Completion criterion: the user approves the contract or has already supplied every field explicitly.

## 4. Lock the script

### Audio or video supplied

Transcribe the spoken words and measure the true duration. The recording is binding for captions and timing. Do not Humanize a verbatim transcript into different captions. If the user wants a rewrite, present it as a new script that requires a new recording.

### Script supplied

Estimate its natural spoken duration. Preserve approved meaning and facts. Invoke `$humanizer` with the active brand voice profile, then check that Humanizer did not alter facts, names, numbers, pronunciation, or intended duration.

### Topic or brief supplied

Draft a compact script using this default narrative grammar when it fits:

1. confirm the subject or promise in the first three seconds;
2. name the familiar pain or stakes;
3. introduce the different approach;
4. show concrete proof, examples, or mechanism;
5. state the believable transformation;
6. close on the next idea or handoff.

Then invoke `$humanizer` using the user's writing or speaking samples.

Show the complete script, word count, estimated duration, and any pronunciation notes. Wait for approval.

Completion criterion: one exact script is approved; every factual claim is supported or marked as a proof placeholder; the duration decision is explicit.

## 5. Lock the screen and timing map

Divide the approved script or transcript into spoken phrases. For each phrase specify:

- estimated or measured start and end;
- planned pause;
- emphasized words;
- native on-screen text;
- visual beat;
- asset identity or asset need;
- transition;
- semantic SFX opportunity.

If real audio exists, use measured word timings. Otherwise mark all timings provisional.

Then create a screen map that states exactly what the viewer will see at every meaningful visual change. Present the text and screen map before generating storyboards.

Completion criterion: the user approves the words and what appears on every screen.

## 6. Build and approve the storyboard

Split a 15-30 second job into blocks of at most ten seconds. Add a panel at every meaningful visual change, not one panel per block.

Every panel must specify:

- exact time range;
- narration;
- native editable text;
- composition and hierarchy;
- exact asset file or missing-asset identifier;
- position and approximate scale;
- entry animation;
- continuous motion;
- exit transition;
- sound opportunity;
- landscape layout when requested;
- portrait layout when requested;
- purpose of the shot.

Use the confirmed image-generation tool for storyboard sheets and every new raster illustration. Keep captions, logos, UI labels, and exact spelling out of generated images. Save each generated asset separately with its prompt and source output.

Read [storyboard-and-assets.md](references/storyboard-and-assets.md) before generating boards or assets.

Present:

- detailed panel specifications;
- generated storyboard sheets;
- asset reuse/new-generation manifest;
- format-specific layouts.

Wait for storyboard approval. The approved storyboard becomes a binding composition contract.

Completion criterion: every panel, asset identity, layout, timing, hierarchy, and transition is approved and technically reproducible.

## 7. Produce the animation

Invoke `$hyperframes` before authoring animation source, follow its routing to the narrowest matching workflow, and load only the supporting HyperFrames skills it requires. Use the bundled reference projects as motion and implementation evidence, not as a fixed visual template.

Requirements:

- deterministic, seek-safe animation;
- native editable captions;
- stable element identity;
- progressive scale, position, masking, tracking, and camera changes;
- no text disappearing and returning merely to become smaller;
- no decorative filler in unused space;
- no automatic layout that covers a face, product, proof element, caption, or platform UI safe area;
- separate composition logic for every requested aspect ratio;
- one meaningful visual asset on major screens when it adds meaning;
- one continuous composition when a subject must persist across a boundary.

Render checkpoints at every approved panel and high-risk transition. Compare them against the binding storyboard before adding final sound design.

Read [animation-captions-and-sound.md](references/animation-captions-and-sound.md) for caption geometry, safe areas, audio-first synchronization, semantic motion, and SFX behavior.

Completion criterion: all checkpoint frames reproduce the approved hierarchy, assets, approximate positions, proportions, timings, and transitions in every format.

## 8. Add sound design

Audit `assets/starter-library/sfx/` before searching or generating anything new. Use one cue per semantic group, not one cue per word. Support every meaningful transition without making the mix noisy.

If voice or source audio exists:

- keep it dominant;
- attach caption and motion events to measured words;
- trim SFX tails before the next phrase;
- never time-stretch speech unnaturally.

If no audio exists, build a restrained SFX-only mix against the approved provisional timing.

Document every cue, source, license, timeline position, trim, and gain. Ask before downloading or generating any new sound.

Completion criterion: every transition has intentional support, every cue has a semantic purpose, and the mix remains readable with or without voice.

## 9. Validate and deliver

Run the HyperFrames lint, check, inspect, snapshot, and render commands required by the installed version. Inspect the encoded MP4, not only live HTML frames.

Read [qa-and-delivery.md](references/qa-and-delivery.md). Fix every red issue in editable source and re-render.

Default delivery:

- final master MP4 with approved mix;
- plain video MP4 without audio;
- SFX stem matching the full duration;
- source/voice audio stem when one was supplied;
- editable HyperFrames source;
- script, contract, timing map, storyboard, and contact sheets;
- asset manifest with prompts, sources, licenses, and hashes;
- validation report;
- format-specific files for every requested canvas.

All synchronized media starts at `00:00.000` and has the same exact duration.

Completion criterion: every output decodes, dimensions and duration are verified, captions remain readable, no required subject is obstructed, separate formats are intentionally composed, and the evidence package can reproduce the render.

## Bundled reference implementation

Use [starter-asset-catalog.md](references/starter-asset-catalog.md) to locate:

- production-ready and source ImageGen assets;
- semantic SFX;
- caption and typography systems;
- approved storyboard sheets and checkpoints;
- editable HyperFrames reference projects for `16:9` and `9:16`;
- final reference MP4 renders.

Do not treat the reference brand, colors, copy, fonts, or camera object as the user's brand. Resolve and apply the active brand profile first.
