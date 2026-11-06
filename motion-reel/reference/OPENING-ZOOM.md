# Opening zoom + whoosh (optional)

Use this only when the user asks for it ("zoom de apertura", "zoom 500 a 100", "el efecto del woosh"). It is NOT part of the default film. Without that request, the opening stays clean footage (see RULES.md).

## What it is
- At t = 0 the speaker is zoomed to **500 %** (scale 5.0) and settles to **100 %** (scale 1.0) in **0.25 s**.
- Ease: ease-out cubic. With x = t / 0.25 and e = 1 - (1 - x)^3, the scale is `5 - 4 * e` (5.0 at t = 0, 1.0 at t = 0.25 s and after).
- The zoom is on the footage only (same transform as every other punch-in, around the frame centre). Graphics, cutaways and subtitles are not zoomed.
- A **whoosh** sound starts on frame 0, so it begins exactly when the zoom begins and has finished its main sweep by the time the picture lands. File: `sfx/opening/opening-whoosh.wav` (0.36 s, 44.1 kHz, the user's own whoosh), gain 1.0, `align: "start"`.

## How to apply it (motion-reel engine)
1. In `film/film.js`, add two punch keys at t = 0 at the front of the punch list:
   ```js
   punch([[0, 5, 'cut'], [0, 1, 'snap25'], ...P]);
   ```
   (`'cut'` jumps to 5.0 on frame 0, `'snap25'` eases from 5.0 to 1.0 in 0.25 s. `snap25` exists in `engine/overlay.js`.) If the film already has other punch keys, keep them after these two.
2. Copy `sfx/opening/opening-whoosh.wav` to the project as `assets/sfx/opening-whoosh.wav`.
3. In `timeline.json`, insert as the first `sfx` cue:
   ```json
   { "at": 0, "file": "assets/sfx/opening-whoosh.wav", "gain": 1.0, "what": "500-to-100 opening zoom whoosh requested by user" }
   ```
4. This is the one allowed exception to "no animation before the first word + 1 s": `pipeline.py` may stop the draft on it. Pass the user's request as the reason, or place nothing else animating before first word + 1 s.
5. Subtitles: sample the caption zones from the rendered draft as usual. The first 0.25 s is zoomed, so do not place a caption in it.
6. Show only the opening (first ~2 s) for approval before rendering the full video.

## Without the motion-reel engine (another tool or AI)
- Zoom: scale the footage from 5.0 to 1.0 over the first 0.25 s with the ease above, anchored on the centre. In ffmpeg this is a `zoompan`/`scale`+`crop` driven by the expression `5 - 4*(1-pow(1-min(t/0.25,1),3))`.
- Sound: mix `opening-whoosh.wav` into the audio starting at 0 s, at full volume, over the original voice (do not delay the voice).
- Do the effect on the first hook only if the user asks; when a topic has several hooks, apply the same effect to all of them so they match.

## Used on
Claude Duet hook 1 (original), Brag hooks 1-3, Book-to-Skill hooks 1-3 (2026-10-31).
