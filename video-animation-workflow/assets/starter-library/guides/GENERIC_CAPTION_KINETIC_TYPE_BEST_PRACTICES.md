# Generic caption and kinetic-type best practices

This is a project-neutral production contract for:

- greeting cards and company/name reveals;
- object-led animations where a generated asset replaces or illustrates a spoken word;
- complete video introductions;
- storyboard-driven motion graphics;
- talking-head and avatar captions;
- YouTube, Reel, Shorts, and TikTok adaptations.

## 1. Start from a visual contract

Lock the script and storyboard before animation.

For every beat, define:

- exact time range;
- narration or spoken phrase;
- native on-screen text;
- asset identity and file;
- composition, position, and approximate scale;
- entrance, continuous motion, and exit;
- transition sound;
- separate landscape and portrait layouts.

Once approved, the storyboard is a binding composition contract. The implementation
must preserve hierarchy, asset identity, position, proportion, timing, and transition
logic—not merely create something similar.

## 2. Use an asset-first scene strategy

- Inspect the existing asset library before generating anything new.
- Use one meaningful descriptive asset per major screen when the idea benefits from
  an object.
- Generate missing bitmap illustrations with an image-generation tool.
- Keep captions, labels, logos, and exact UI text out of generated images; render them
  as native editable text.
- A visual object may replace a spoken noun as a rebus, but the meaning must remain
  obvious.
- Storyboard assets and final assets must be separately addressable and documented.

## 3. Separate text functions

Use three semantic roles:

- **connector:** grammar and supporting language;
- **anchor:** names, actions, results, and essential concepts;
- **editorial:** one expressive or emotional keyword.

Font and sizing rules live in `GENERIC_TYPOGRAPHY_SYSTEM.md`.

Avoid random font changes, full-sentence script type, and equal emphasis on every word.

## 4. Build phrases cumulatively

Each word appears at its spoken moment and remains visible until the full phrase becomes
one finished typographic composition.

Correct:

```text
THIS
THIS SYSTEM
THIS SYSTEM CREATES
THIS SYSTEM CREATES CONTENT
```

Incorrect:

```text
THIS disappears
SYSTEM appears
SYSTEM disappears
CREATES appears
```

The final frame of a beat should normally contain the complete thought.

## 5. Preserve element identity

If typography must move or become smaller:

- keep the same DOM/object identity;
- scale and reposition it progressively;
- animate its surrounding layout to make room;
- preserve continuity through masks, tracking states, or camera movement.

Do not make text disappear and reappear solely to change its size or position.

## 6. Standard word animation

Animate `transform` and `opacity`, not glyph metrics.

Default GSAP entrance:

```js
gsap.fromTo(
  selector,
  {
    opacity: 0,
    y: 26,
    scale: startScale,
  },
  {
    opacity: 1,
    y: 0,
    scale: 1,
    duration: 0.18,
    ease: "power3.out",
  },
  wordStartTime,
);
```

Starting scale:

| Semantic intensity | Scale |
|---|---:|
| Connector | `1.04` |
| Medium emphasis | `1.08` |
| Major anchor | `1.10–1.12` |

The movement should feel like a word being placed into the composition, not a
bounce-heavy preset.

Reserve one deliberately different animation for the editorial keyword:

```js
gsap.fromTo(
  selector,
  {
    opacity: 0,
    x: -54,
    scale: 1.04,
  },
  {
    opacity: 1,
    x: 0,
    scale: 1,
    duration: 0.22,
    ease: "expo.out",
  },
  wordStartTime,
);
```

Do not invent a unique effect for every word.

Never animate:

- letter spacing;
- font weight;
- blur;
- layout properties that cause text reflow.

## 7. Design transitions as semantic boundaries

Use transitions to move between ideas, not as decoration.

Common sequence:

1. greeting or hook;
2. object/benefit reveal;
3. speaker, proof, or system;
4. handoff into the main video.

For a three-part intro there are normally two transition boundaries:

- greeting → body/reveal;
- intro → main content.

Each boundary should have one intentional sound. Avoid adding multiple effects to the
same transition.

## 8. Use wide/tight pacing intentionally

Alternate composition scale to renew attention:

- wide context;
- tight keyword or object;
- wider proof;
- tight transformation;
- wide final lockup or handoff.

When a final performer or avatar is unavailable, storyboard with an anonymous
placeholder. Do not treat the placeholder as the final identity or attempt to match its
face.

Prefer hard cuts or two-to-three-frame motion-assisted punch cuts over an unmotivated
continuous zoom.

## 9. Protect people, products, and proof

Before placing text, inspect representative frames and measure the worst-case envelope
of:

- face and eyes;
- torso;
- hands and gestures;
- chair or important props;
- product/interface proof;
- baked-in text and watermarks.

Place captions in a stable clean zone. Never cover eyes. Ensure captions remain inside
platform-safe margins.

## 10. Tie timing to the real voice

Storyboard timing is provisional until final audio exists.

Workflow:

1. Lock the script.
2. Build a provisional phrase and beat map.
3. Design and validate storyboards.
4. Generate or approve the final voice.
5. Obtain word-level timings.
6. Replace provisional word onsets with real onsets.
7. Micro-retime typography, object animation, and SFX.

Do not distribute words at equal intervals. Use the real performance.

Caption timing requirements:

- a word event should match speech within approximately 80ms;
- a displayed group must envelop all its words;
- a normal caption group remains readable for at least 0.5s;
- silence should remain visually quiet;
- do not unnaturally time-stretch final speech to fit an old storyboard.

## 11. Sound by meaning

Use one quiet tick only for an important semantic group:

- person or subject;
- company or organization;
- central object or benefit;
- main action or transformation;
- final result or technology.

Do not tick connector words. A multiword name or idea receives one sound for the
complete group.

Technical starting point:

- use approximately the first `0.12s` of a soft-click asset;
- volume multiplier around `0.060–0.075`;
- keep every cue clearly below the voice;
- trim long tails before the next spoken phrase.

Rule:

> One important idea equals one sound.

## 12. Rendering workflows

### Pure motion graphics

- Use deterministic, seek-safe animation.
- Render approved landscape and portrait compositions separately.
- Verify opening, signature move, and final hold frames before final render.

### Caption overlay on live footage

- Keep original footage outside the browser renderer.
- Render only captions on a transparent canvas.
- Export a transparent VP9 WebM or another approved alpha-capable format.
- Composite the overlay over native footage with FFmpeg.
- Preserve frame rate, frame count, speed, and lip synchronization.
- Do not interpolate, drop, or duplicate frames.
- Keep audio separate if additional editing is required.

## 13. Sound and voice approval boundary

Storyboards and provisional animation may be produced without paid voice/avatar
generation.

Do not submit paid voice or avatar work until:

- script is approved;
- pronunciation is approved;
- storyboard is approved;
- timing assumptions are documented;
- the correct voice/avatar identity is confirmed.

After provider generation, treat the approved media as frozen and retime graphics to
it.

## 14. Quality-control checklist

- [ ] Script and storyboard are approved.
- [ ] The correct generated/reused asset appears in every contracted scene.
- [ ] Native text is spelled correctly.
- [ ] Font choice follows semantic role.
- [ ] The editorial face appears only where intentionally assigned.
- [ ] Words accumulate instead of replacing one another unnecessarily.
- [ ] Text scales/repositions smoothly without disappearing.
- [ ] Important people, products, gestures, and interfaces remain unobstructed.
- [ ] Landscape and portrait layouts are separately composed.
- [ ] Every word appears at its real spoken onset.
- [ ] SFX attach to ideas and transitions, not every word.
- [ ] Voice remains dominant.
- [ ] Transparent overlays contain valid alpha.
- [ ] Native footage retains frame count, speed, and lip sync.
- [ ] Final media decodes without audio or video errors.
