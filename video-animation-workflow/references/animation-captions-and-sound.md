# Animation, captions, and sound

Read the bundled guides before implementation:

- `assets/starter-library/guides/GENERIC_TYPOGRAPHY_SYSTEM.md`
- `assets/starter-library/guides/GENERIC_CAPTION_KINETIC_TYPE_BEST_PRACTICES.md`
- `assets/starter-library/guides/generic-kinetic-type.css`
- `assets/starter-library/guides/reels-9x16-safe-zone.css` for a Reel debug overlay

## HyperFrames ownership

Read `/hyperframes` first. Let the selected HyperFrames workflow own composition scaffolding and let its supporting skills own:

- creative system;
- media resolution;
- composition structure;
- animation strategy;
- keyframes;
- CLI validation and rendering.

This skill owns the approval sequence, reusable brand profile, screen map, storyboard contract, and delivery package.

## Caption behavior

- Render captions as native text.
- Build phrases cumulatively when the thought benefits from accumulation.
- Keep the same text node when it scales or moves.
- Animate transform and opacity, not font metrics or layout properties that cause reflow.
- Use one anchor face, one connector face, and at most one editorial accent.
- Do not create colored-word karaoke.
- Never cover faces, products, proof, embedded UI text, or platform controls.

When audio exists, align word events to measured onsets within approximately 80ms. Keep normal caption groups readable for at least 0.5 seconds unless a deliberately faster approved beat requires otherwise.

## Safe composition

### 16:9

- Keep essential text inside the central 90%.
- Reserve player-control and title-safe margins.
- Measure the full motion envelope of people and products.

### 9:16

- Identify the exact destination before authoring; Reels, Stories, TikTok, and Shorts do not share one UI.
- For Instagram or Facebook Reels, read [reels-9x16-safe-zones.md](reels-9x16-safe-zones.md).
- On `1080x1920` Reels, keep critical elements inside `x=65-1015`, `y=269-1248`.
- Keep captions and exact text inside the stricter workflow rectangle `x=65-972`, `y=269-1248`.
- Measure the complete animated bounding box while opacity is `0.5` or greater.
- Let nonessential backgrounds and bleed fill the top, bottom, and side UI regions.
- Recompose the hierarchy; never crop the 16:9 lockup.

Arrows and callout lines are content. They must not cross labels, caption ink, or important asset features. Give labels a higher visual layer than connector lines and stop lines before the label boundary.

## Motion behavior

- Use movement to explain causality or preserve continuity.
- Give each important screen an entry, readable hold, continuous motion, and exit.
- Use smooth progressive transformations.
- Prefer one persistent subject to duplicate outgoing and incoming copies.
- Treat a hard cut as intentional, not as a repair for an unfinished transition.
- Avoid ambient drift, bounce, overshoot, and decorative camera movement without narrative purpose.

For a persistent subject crossing scenes, build and inspect a short transition lab before the full destination scene.

## Phase ownership and anti-ghosting

Treat every meaningful micro-screen as a narrative phase. Group its copy, cards, labels, and connectors under one phase wrapper. Keep backgrounds and truly persistent identity assets outside those wrappers.

- Only one narrative phase may own a content zone at a time.
- Hide every future phase in base CSS or an equivalent deterministic state at timeline time zero.
- When using `immediateRender:false`, never rely on the tween's `from` values to hide the target before its start; provide the hidden CSS or initialization state explicitly.
- Clear the outgoing wrapper to zero opacity or `autoAlpha:0` before the incoming phase occupies the same zone.
- Limit an intentional handoff overlap to approximately `0.20s`, and allow it only when the storyboard calls for a cross-dissolve and the two phases do not create duplicate text or asset collisions.
- Never park a future or outgoing asset at low opacity to suggest continuity. A contextual dimmed layer is allowed only when the approved storyboard names it as a persistent background element and it remains visually deliberate.
- Preserve a recurring subject with one DOM element and continuous transforms. Do not create a translucent duplicate or “echo” to bridge scenes.
- Exit the phase wrapper, not only selected children. This prevents forgotten labels, connector lines, cards, or shadows from surviving the transition.

At every handoff, capture frames immediately before the exit, near the midpoint, and immediately after the entrance. Inspect computed opacity and bounding boxes. More than one intersecting narrative phase above `0.05` opacity is a failure unless the storyboard explicitly approves that exact handoff.

## Audio-first synchronization

When final audio exists before animation:

1. Measure phrase and word timings.
2. Use them in the timing map.
3. Build captions and visual events against real delivery.
4. Keep the original audio unchanged.

When audio arrives later:

1. Preserve the approved script and storyboard.
2. Replace provisional onsets with measured ones.
3. Micro-retime motion and SFX.
4. Do not time-stretch the voice to protect old timing.

## Sound design

Audit the starter SFX by semantic filename. Select sounds by footage purpose.

- One important idea equals one sound.
- One transition boundary gets one principal cue.
- Connector words do not get ticks.
- A multiword name gets one group cue.
- Keep voice dominant.
- Trim tails that interfere with the next phrase.
- Reuse a cue when its semantic role matches; do not add noise for variety.

Starting relative gains:

- quiet word/group tick: `0.06-0.08`;
- transition, lock, or reveal: `0.08-0.12`;
- impact: only as loud as needed to read beneath voice.

If no voice exists, do not overfill the silence. SFX must still correspond to visible causes.
