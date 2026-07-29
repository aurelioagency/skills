# Animation, captions, and sound

Read the bundled guides before implementation:

- `assets/starter-library/guides/GENERIC_TYPOGRAPHY_SYSTEM.md`
- `assets/starter-library/guides/GENERIC_CAPTION_KINETIC_TYPE_BEST_PRACTICES.md`
- `assets/starter-library/guides/generic-kinetic-type.css`

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

- Use approximately 6-7% side margins.
- Keep essential text primarily between 12% and 78% of frame height.
- Reserve the bottom 22% for platform UI.
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
