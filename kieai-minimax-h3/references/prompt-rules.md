# Writing prompts that this model obeys

Everything in this file was learned by burning credits on MiniMax H3, not by reading marketing
copy. Treat it as the default. Deviating from it costs money.

## The findings

### 1. The opening framing is the ceiling

If the camera ends up wider than the opening frame, the model **invents everything outside it** —
walls, furniture, windows that were never in the source image. It is not filling in; it is
hallucinating a set.

The clause that fixes it, verified:

```text
FRAMING RULE (highest priority) - The opening framing is the widest framing in the entire clip.
The camera never becomes wider than the opening framing at any point.
```

### 2. A negative list does not beat the framing

Listing `no full-body shot` does nothing if the shot is wide. The model draws what the framing
implies. **Fix the framing, not the negative list.** Negatives only work on details the framing
does not already dictate.

### 3. Two things aimed at the same point fuse

An object flying at the lens plus a character biting the lens become one deformed object. The model
merges anything converging on the same destination. **Never send two elements to the same target.**
Give each one its own path, its own arrival point, or its own moment in the timeline.

### 4. "Behind the shoulder" reads as depth, not as an entry point

Say `behind the shoulder` and the model puts the character on the same plane as the subject, where
they fuse (see 3). To make something enter from the foreground, state the depth relationship
explicitly:

```text
closer to the camera than the man
```

### 5. A subject gets bigger by approaching, never by the camera retreating

Left alone, the model pulls the camera back to make something look large — which then triggers
finding 1. The clause:

```text
SCALE RULE (highest priority) - The subject becomes large by moving toward the camera,
never by the camera moving away.
```

### 6. `reference_video_urls` does not carry camera movement

Verified twice out of two attempts: a source clip with a 360° roll, plus a written request to
recreate that roll, returned zero rotation both times.

Appearance survives (it is redundant in every frame). Movement does not (it lives between frames).

The same 360° roll **does** come out in image-to-video when it is described in the prompt. So:
reference video is for *what things look like*, never for *how the camera moves*. Ask for the
movement in words.

### 7. Anything that must stay still needs an explicit anchor

Unanchored objects drift and float. Name each one and pin it:

```text
The bottle stays fixed on the table for the entire clip and never moves.
```

### 8. Use eyecannndy technique names verbatim

`roll transition`, `hyperlapse`, `dolly zoom`, `crash zoom`, `pass through` — the model recognises
them. Use the exact name from [`eyecannndy-catalog.md`](eyecannndy-catalog.md) instead of describing
the movement from scratch, then add the timing around it.

**But check what the name actually means before pasting it, and never paste a tag.** The Eyecandy
vocabulary is built almost entirely around *what the camera does*, not what the subject does. Two
traps that follow from that:

- A technique whose reference clip *looks* right can still name the wrong thing. `lazy susan` is not
  "something rotates" — it is a camera at the centre of a table panning to each person. Put it in a
  prompt for "a man swivels in his chair while the camera stays locked" and you have just ordered
  the camera to rotate, against your own CAMERA block.
- **Tags are not techniques.** `spin`, `phone`, `portal` are how the curators labelled the clip's
  content; they are search keys for `find-reference.mjs`, not vocabulary the model knows. Only the
  names in the catalogue tables go into a prompt.

When no technique names what the subject is doing — and often none does — describe the action
plainly and keep whichever real technique names still apply (`motion blur`, `slow motion`).

### 9. Whatever the reference image does not show, the model invents

The framing rule stops it inventing *scenery*. It does not stop it inventing parts of the
**subject** that the input frame never showed. A man photographed from the front, turned 360° in his
chair, came back with a hair bun on the back of his head that does not exist — the model never saw
his nape, so it made one up.

Anything the camera will eventually reveal but the source image does not contain — the back of a
head, the far side of an object, what is behind a person — has to be described, or it will be
invented. Add an IDENTITY block naming the traits that must survive the reveal:

```text
IDENTITY - It is the same person throughout the whole rotation: same hair, same beard,
same grey hoodie, same white earphones.
```

That block did hold the face and clothing across a full turn. It said nothing about the nape, and
that is exactly where the invention landed.

### 10. Nothing is reproducible

There is no seed. Same prompt, different video, every time. Two consequences:

- A good 768P take **cannot** be re-rolled at 2K. Anything you send to 2K is a fresh gamble.
- After a failure, **never resubmit blind**. Diagnose from the contact sheet, change exactly one
  variable, and write down which one in `log.md`.

## Prompt structure that works

Write in this order, in English, always:

1. **Explicit role of each image** — `Image 1 is the opening frame. Image 2 is the final frame.`
2. **Rule blocks marked as priority**, before the timeline — the FRAMING RULE, the SCALE RULE,
   the anchors, whatever this shot needs. They must sit above the timeline, not after it.
3. **Second-by-second timeline** — one line per beat, with what the camera does and what each
   element does.
4. **Land on the final frame early** — reach the closing composition at second 3.6 of a 4-second
   clip and hold it to 4.0. The tail is what gets the clean cut.
5. **Negative list at the end** — short, and only for things the framing does not already settle.

### Skeleton

```text
Image 1 is the opening frame. Image 2 is the final frame.

FRAMING RULE (highest priority) - The opening framing is the widest framing in the entire clip.
The camera never becomes wider than the opening framing at any point.

SCALE RULE (highest priority) - <only if something has to grow>

ANCHORS - <object> stays fixed at <place> for the entire clip and never moves.

TIMELINE
0.0-1.0s - <camera> / <subject>
1.0-2.4s - <the technique, by its eyecannndy name>
2.4-3.6s - <settling into the closing composition>
3.6-4.0s - The frame matches Image 2 exactly and holds still.

NEGATIVE - no <things the framing does not already prevent>
```

## Two prompts, always

The Spanish version is shown to the user for approval. The English version is what goes into
`prompt_en` and reaches the API. They are stored side by side in `job.json` and copied into
`log.md` on every run, so a good take can be traced back to the exact words that produced it.
