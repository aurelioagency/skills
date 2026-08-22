# Verifying a clip before calling it done

`kie.mjs verify` produces, in the job's `out/` folder:

- `contact-sheet.png` — 16 frames of the clip in a 4×4 grid, reading order left to right, top to bottom
- `frame-first.png` / `frame-last.png` — the real first and last frames
- `verify.json` — dimensions, fps, duration, and `tileTimestamps` (which second each tile is)

An agent that can see images reads the contact sheet and answers the checklist itself. An agent
that cannot must print the checklist and hand it to the user, question by question — never skip it
and never assume a pass.

## The checklist

**1. Did it land?**
Compare `frame-last.png` against the image declared in `inputs.last_frame`. Same framing, same
position, same scale? If the clip drifts past the target or arrives late, the cut into the
surrounding footage will not work. (Only applies to image-to-video; ref2v has no final frame.)

**2. Did it invent anything?**
Scan the sheet for scenery that was not in the source image: new walls, furniture, windows, a
different room. Any of it means the camera went wider than the opening frame — finding 1 in
[`prompt-rules.md`](prompt-rules.md). The fix is the FRAMING RULE, not a negative.

**3. Is the effect actually there?**
The requested technique has to be visible in the tiles, at the seconds the timeline assigned to it.
A roll that only rotates 40° is a failure, not a partial success.

**4. Did anything fuse?**
Look for deformed or merged elements, especially where two things converge. Finding 3: split their
destinations.

**5. Did anything float?**
Objects that were supposed to stay put must be in the same place in every tile. Finding 7: anchor
them by name.

**6. Do the numbers match?**
`verify.json` — is `duration` the duration that was requested? Is the resolution the one that was
paid for?

## Verdict

Write one of three into `log.md`, with the reason:

- **usable** — ships as is
- **usable with an edit** — say which edit (trim, speed, crop)
- **failed** — say which of the six checks failed

## After a failure

Never resubmit the same prompt hoping for a better roll — there is no seed, but there is also no
free re-roll. Diagnose which check failed, map it to its finding, **change exactly one variable**,
and record in `log.md` what changed and why. One variable per attempt is the only way to learn
anything from a stochastic model.
