# QA and delivery

## Contents

- [Review order](#review-order)
- [Source checks](#source-checks)
- [Visual inspection](#visual-inspection)
- [Reels safe-zone audit](#reels-safe-zone-audit)
- [Required job package](#required-job-package)
- [Default synchronized deliverables](#default-synchronized-deliverables)
- [Blocking failures](#blocking-failures)

## Review order

1. Script approval.
2. Screen and timing-map approval.
3. Storyboard and asset approval.
4. Animation checkpoint approval.
5. Sound-design approval.
6. Final encoded-output inspection.

Do not use later polish to conceal an unapproved earlier layer.

## Source checks

Run the commands required by the installed HyperFrames version:

- lint;
- validate or check;
- inspect at dense samples;
- snapshot at every contracted panel and high-risk transition;
- draft render;
- final render.

Treat tool documentation and current CLI help as authority for exact flags.

## Visual inspection

Inspect:

- the first three seconds;
- every storyboard panel time;
- every transition boundary;
- every aspect-ratio-specific reflow;
- the final hold;
- the final encoded MP4.

Check:

- native text spelling;
- caption-to-audio timing;
- font loading;
- safe margins;
- label, arrow, caption, and asset overlap;
- face, product, and proof visibility;
- asset identity;
- unintended duplication or disappearance;
- continuity of scale, position, direction, and velocity;
- compression shimmer or thin-line instability;
- silence and SFX tails.

Automated metrics can expose failures but cannot prove that motion is smooth or a composition is premium.

## Reels safe-zone audit

For every Instagram or Facebook Reel, read [reels-9x16-safe-zones.md](reels-9x16-safe-zones.md) and calculate the actual canvas geometry:

```text
node <skill>/scripts/reels-safe-zone.mjs --width 1080 --height 1920 --json
```

Capture every contracted panel with the supplied debug overlay enabled. Check the full animated envelope, including entrances and exits.

Use HyperFrames `--caption-zone` checks for the three UI bands:

```text
npx hyperframes check --samples 31 --caption-zone "x0=0;y0=.65;x1=1;y1=1;severity=error"
npx hyperframes check --samples 31 --caption-zone "x0=0;y0=0;x1=1;y1=.14;severity=error"
npx hyperframes check --samples 31 --caption-zone "x0=.90;y0=.14;x1=1;y1=.65;severity=error"
```

These checks use element centers and do not replace visual inspection of the entire bounding box. Never waive a caption, logo, CTA, brand label, face, or key product with `data-layout-allow-caption-zone`. Disable the debug overlay before the clean preview and final render.

## Transition-boundary audit

For every narrative handoff, inspect at least three frames: immediately before the boundary, during the handoff, and immediately after it.

Verify:

- every future phase is fully hidden before its contracted entrance;
- the outgoing phase is fully cleared before replacement content occupies the same zone;
- no forgotten child layer, shadow, connector, or label survives its parent phase;
- no asset sits at low opacity between scenes and then “appears” a second time;
- a persistent subject remains one element with continuous position, scale, and direction;
- any simultaneous visibility is an approved handoff of approximately `0.20s` or less.

When browser inspection is available, record each phase wrapper's computed opacity and bounding box. Fail the boundary when two intersecting narrative phases are both above `0.05` opacity without a storyboard-approved exception.

## Required job package

```text
video-projects/<slug>/
  VIDEO_CONTRACT.md
  SCRIPT.md
  TIMING_MAP.md
  SCREEN_MAP.md
  STORYBOARD.md
  DESIGN.md
  SOUND_CUE_SHEET.md
  ASSET_MANIFEST.md
  VALIDATION.md
  assets/
    generated/
    reused/
    audio/
    fonts/
  storyboards/
  snapshots/
  source/
  deliverables/
```

## Default synchronized deliverables

When source audio exists:

```text
<slug>_<format>_master_full_mix.mp4
<slug>_<format>_plain_video.mp4
<slug>_<format>_sfx_stem.wav
<slug>_<format>_source_audio_stem.wav
```

Without source audio:

```text
<slug>_<format>_master_sfx_mix.mp4
<slug>_<format>_plain_video.mp4
<slug>_<format>_sfx_stem.wav
```

Every synchronized file starts at `00:00.000` and has the same exact duration. Preserve intentional leading silence.

Also deliver:

- editable HyperFrames source;
- approved documents and storyboard sheets;
- contact sheets and checkpoint frames;
- asset prompts and original generation outputs;
- asset/source/license/hash manifest;
- a short validation summary;
- dimensions, FPS, duration, video-track count, audio-track count, sample rate, and channel count.

## Blocking failures

Do not deliver as final when any of these remains:

- unapproved script or screen map;
- missing major asset;
- generated text that must be exact;
- one format cropped from another;
- captions outside safe areas;
- a Reel caption or critical asset outside its documented full-motion safe rectangle;
- Reel-safe geometry copied blindly to another vertical platform;
- important overlap or occlusion;
- an uncontracted future or outgoing phase visible above `0.05` opacity;
- an asset parked semi-transparent between narrative phases;
- text disappearing only to return at another size;
- missing sound support at a meaningful transition;
- voice obscured by SFX;
- duration mismatch between stems;
- an MP4 that has not been decoded and visually inspected.
