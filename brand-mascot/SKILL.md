---
name: "brand-mascot"
description: "Create a brand mascot and generate new poses of that same character without its design or colors drifting. Trigger automatically on every message about creating, regenerating, correcting, editing, or varying an existing recurring mascot, including follow-up messages in the same chat even when the user does not name this skill again. For every pose, use only that mascot's master.png as the character reference; never use another pose, a correction, or a rejected image. Allow necessary generator previews and controlled background removal, but require the final deliverable to be one verified transparent PNG opened inline. Do not use for one-off illustrations with no recurring character, or for standalone logos, icons and vector assets."
---

# Brand mascot

## Turn-entry contract — run on every mascot message

Treat every follow-up request about the same recurring mascot as a fresh trigger
for this skill. The user does not have to invoke the skill again and does not
have to remind you to use the master.

Before any image action:

1. Read this skill completely.
2. Locate the character folder and read `CHARACTER.md` and `catalog.md`.
3. Open `<mascot>/master.png`; for any generative pose or regeneration, pass
   **that file and no pose file** as the character identity reference.
4. Classify every additional image narrowly: logo reference, prop reference,
   palette reference, or other secondary role. It never replaces `master.png`.
5. State the completed pose spatially, including what each movable part does and
   where every prop sits. Resolve left/right from the viewer's perspective when
   screen layout matters.

If any of these steps was skipped, stop before generation and perform it. A
previous turn's compliance does not substitute for this turn's entry check.

## Intermediate decision tree — final image only

For every potential production artifact, decide before creating it:

1. **Is it necessary to produce the requested final transparent PNG?**
   - No: do not create it.
   - Yes: create it only in `<mascot>/work/` and keep it out of the conversation.
2. **Will the chosen tool automatically display it?**
   - Yes: continue when that display is unavoidable for the available generator.
     Treat it as a temporary preview, never as the delivered asset.
   - No: continue internally.
3. **Has the artifact finished serving the pipeline?**
   - Yes: delete it immediately.
   - No: keep it only in `work/` until its dependent check is complete.
4. **Is the image about to be shown to the user?**
   - It must be the single approved final PNG in `poses/`, with RGBA/alpha
     verified and every acceptance gate passed. Otherwise do not show it.

Do not manually attach raw generations, chroma, opaque backgrounds, white or
gray proofs, fake checkerboards baked into RGB, masks, cutouts, rejected
attempts, or uncorrected previews. An unavoidable automatic generator preview
is permitted, but it never counts as the final delivery.

When delivering in Codex desktop, render the final asset inline with an absolute
Markdown image path (`![description](C:/.../poses/name.png)`). Do not provide
only a download hyperlink. One request produces one visible image: the final
transparent PNG.

Two situations, one underlying rule: the mascot must always be **the same
individual**, never a similar-looking character.

- **No mascot yet** → FLOW A: create it.
- **Mascot exists** → FLOW B: new poses, consistent.

Consistency here means everything: body, proportions, face, render style and
color. Each is held by a different mechanism, which is what the steps in FLOW B
correspond to.

## Never deliver an opaque image

Every image handed to the user — the master included — is a PNG with a real
alpha channel. No exceptions. These assets get dropped onto carousels, slides
and web pages; a solid background makes them useless.

Prefer native transparent alpha when the generator returns it. When the
available generator returns RGB, use its supported controlled workflow: request
one flat, saturated chroma background that does not occur in the mascot or its
props, then remove only that chroma deterministically. Do not use white, gray,
black, gradients, scenery or a fake checkerboard as a removable background.

After conversion, inspect file mode, alpha extrema, transparent corners and the
contour on both light and dark proofs. The final must be RGBA (or equivalent),
contain both alpha 0 and 255, and have no chroma fringe, white halo, dark rim,
holes or clipped details. A failed contour means discard the entire attempt and
regenerate from `master.png` on a better-separated chroma; do not repair the
character edge by painting, matting or generative editing.

Nothing reaches the user until the transparent result passes this validation.

## One file out, and only one

Everything the generator produces is scaffolding until something is approved. A
draft is useful while the user is choosing between attempts; the moment they pick
one, the rest are dead weight on their disk that nobody will ever open again.
Scaffolding gets deleted as soon as it has served its purpose.

The rule in one line: **generate into `work/`, deliver from the character folder,
delete `work/`.**

- **Exactly one master, always named `master.png`.** Never `master-v2`,
  `master-final`, `master-transparent-clean`. Approving a new one replaces
  `master.png` and the previous file is deleted. If nothing was approved, nothing
  is saved outside `work/`.
- **One pose request produces one file** in `poses/`. Give it a descriptive
  lowercase hyphenated filename using this structure: **character + action +
  distinctive object or context**. This is an acceptance gate, not a suggestion:
  before saving, verify that all three components are present in the basename.
  Include the prop or setting that makes the pose recognizable; avoid vague
  names that mention only a broad concept. Example:
  `tiburon-presionando-boton-de-automatizacion.png`, not
  `tiburon-automatizacion.png`.
- **Never keep the chroma version or the pre-correction cut.** Once the corrected
  PNG exists they are worthless.
- **Never show an image the user did not ask for.** One request, one image on
  screen.

### Intermediates stay invisible

Chroma generations, failed attempts, raw generator outputs, cutouts, protection
masks, color-correction inputs and background proofs are production artifacts,
not user-facing choices. They may be technically necessary, but **never render,
attach or forward them into the conversation**. `view_image` is for the agent's
inspection and does not turn the inspected file into a deliverable.

Some built-in generators automatically publish every generated output to the
conversation. This behavior does not block the workflow and does not require an
API key or a different generator. Do not manually display the same preview
again. Continue immediately through background removal, validation and final
delivery. Clearly treat only the verified transparent PNG as the result.

### Correction decision tree — never patch identity damage

Classify the defect before touching a generated pose:

1. **Does it touch an identity-bearing character region?** This includes eyes,
   eyelids, brows or brow-like marks, muzzle, mouth, teeth, face contours, limbs,
   hands/fins, distinctive traits, internal layout, silhouette or anatomy.
   - Yes: reject the whole pose and regenerate from `master.png`. Never repair
     that region locally.
2. **Would the correction synthesize or infer replacement pixels?** Inpainting,
   clone/heal tools, content-aware fill, blur, smudge, generative fill, texture
   synthesis and painting with sampled neighboring color all infer appearance.
   - Yes: do not use it on the character. Reject and regenerate from
     `master.png`.
3. **Is it the controlled flat chroma background requested for this generation?**
   - Deterministic chroma removal is allowed. Preserve subject RGB wherever
     alpha remains nonzero. Inspect the contour on light and dark proofs.
   - Do not use generic segmentation, `rembg`, semantic matting or removal from
     white/gray/black/scenic backgrounds as a substitute for controlled chroma.
   - If keying damages the silhouette or leaves a fringe, discard the attempt
     and regenerate from `master.png`; never patch the damaged edge.
4. **Is it an external flat prop/logo with an exact supplied source or exact
   vector geometry?**
   - A deterministic paste/vector replacement is allowed only when the complete
     replacement is known, the region does not overlap the character, and every
     pixel outside the declared rectangle remains byte-for-byte identical.
5. **Anything else:** reject and regenerate from `master.png`.

A small defect is not automatically safe to patch. Location and method decide:
identity damage always regenerates; only exact, non-inferential external edits or
alpha-only cleanup qualify for local correction.

Manually show exactly one image only after it passes transparency and every
applicable acceptance gate: the final PNG. Do not manually show a background
proof, chroma version, mask, rejected generation or uncorrected preview, even
when explaining a failure. An unavoidable generator preview remains permitted.

The only exception is a genuine design decision that cannot be resolved without
the user choosing visually, such as selecting the initial mascot concept in
FLOW A. Explain why visual input is essential **before** showing options, label
them as choices rather than deliverables, and show only the minimum number
needed. Technical troubleshooting is not such a decision: diagnose and retry
internally. Delete all intermediates after approval or failure.

Deleting is part of the job, not something to ask permission for. Delete inside
`work/` and the master that was just superseded — nothing else, ever.

## Language

Write to the user in **their** language — whatever they use to talk to you.
These instructions are in English, but nothing here says the conversation has to
be. Every quoted phrase below is an example of *how* to say something, not text
to copy: translate it and make it sound natural.

The character sheet you write is for the user, so write it in their language
too. The script prints in English; relay what matters, translated.

## Storage contract — choose the asset bank first

For a new mascot, ask **one short storage question before generating anything**:
"¿En qué carpeta querés guardar el banco de imágenes finales de esta mascota?"
Do not choose an invisible technical path on the user's behalf. If the user has
already supplied a destination, use it without asking again. If they do not know,
propose a visible project-local `asset-bank/` path and obtain confirmation.

Record the resolved absolute asset-bank path in `CHARACTER.md` and report it
after creating the master and after the first pose. Reuse it on every follow-up;
never ask again unless the path is missing or inaccessible.

Keep user-facing assets separate from internal control files:

```
<mascot-system>/
  master.png        the reference. Exactly one, always this name.
  CHARACTER.md      who the character is, in words, and what to check
  catalog.md        authoritative detailed pose registry
  work/             attempts and intermediates. Deleted as soon as they are done.

<asset-bank>/
  00-<character>-pose-neutra-master.png
  01-<character>-<action>-<distinctive-context>.png
  02-...
  listado-poses.txt  simple user-facing index synchronized with the files
```

`master.png` is both the identity source and a usable final asset. Keep the sole
identity source at `<mascot-system>/master.png`; also copy it to the asset bank as
number `00` with a descriptive name. Every approved pose is saved directly in
the asset bank with the next available zero-padded number. Never make the user
search a technical output folder or manually consolidate assets afterward.

`catalog.md` is the internal source of truth. For every approved asset, record
its number, exact filename, action, props/context, expression, generation source,
and validation result. `listado-poses.txt` is the simple user index derived from
that catalog and contains one numbered exact filename per line. After every
master approval, pose, replacement, deletion, or accepted variant, update both
files in the same operation and verify all three agree: numeric prefix, catalog
entry, and real filename. Never renumber silently; replacements keep their
number, and a new accepted variant receives the next number.

On start, look for the system folder and recorded asset bank. If the system
folder does not exist or has no `master.png`,
that is FLOW A. If it is complete, FLOW B. Do not ask which one applies: look
and go.

---

## FLOW A — create the mascot

This flow has exactly one goal: **produce the master**. Everything else serves
that.

### Starting point — ask this first

**First resolve the asset-bank destination using the storage contract above.**
Then establish how much is already decided and whether they have images. Do not open a
questionnaire before knowing: if they already know what they want, half of this
flow is unnecessary.

- **They know what they want** ("a 3D cartoon shark, blue") → go straight to
  generating the master. Do not make them pick between three concepts they never
  asked for.
- **Half an idea** ("something with a shark, not sure how") → use the steps that
  help and skip the rest.
- **No idea** → the full flow, 1 to 11.

**Always accept reference images**, and label each one's role in the prompt,
because it completely changes what gets copied from it:

- **Style** — an illustration or a *different* character whose look should be
  imitated: finish, linework, palette, proportions. Handing over a cartoon
  penguin and asking for a shark *in that style* is a valid and effective way to
  work. The style is copied, **not** the subject: say so explicitly in the
  prompt.
- **Subject** — a photo or drawing of the thing itself: the real animal, the
  product they sell, their own sketch.
- **Palette** — brand colors, a logo, a color board.
- **Existing character** — if they bring a mascot that already exists, do not
  invent a new one. Look at it with `view_image` and judge whether it works as a
  master (front view, full body, neutral pose, nothing hidden). If it does, use
  it as is and jump to step 9. If it does not, regenerate **that same character**
  in master format, without redesigning it.

They may bring several at once, with different roles. If they bring one without
saying what it is for, ask what you should take from it.

### When you do need to guide them

When they do not arrive with everything settled, **your job is to steer, not to
run an exam**.

- **One question at a time.** A five-part questionnaire gets answered badly or
  not at all.
- **Never leave them staring at a blank page.** If they do not know, offer two or
  three concrete options and let them pick. "What would you like it to be?" is a
  bad question; "for a coffee brand I picture a mug with little hands, a bean
  with a face, or a laid-back capybara — which one pulls at you?" is a good one.
- **Turn every answer into a consequence.** "If it will mostly appear in
  stories, the silhouette has to read small" is worth more than another question.
- **You make the technical calls** and explain them in one line. Do not ask how
  many colors they want: decide, and tell them why.

**1. Understand the brand.** Three things are enough, asked one at a time: what
they sell and to whom, what personality they want to convey, and where the
mascot will be used (social, web, packaging, presentations). If they already have
brand colors, ask now.

**2. Decide what it is.** A mascot does not have to be an animal. It can be an
object (a mug, a suitcase, a tool), a plant, a vehicle, a food, an invented
creature, or an abstract shape with eyes. Plenty of brands have exactly that, and
it is usually more distinctive than yet another friendly fox: the object the
brand sells, or the one its people use every day, is almost always the best
candidate.

Offer three options **from different families** — not three animals — tied to
what they told you, and explain in one line why each fits. Let them pick or ask
for another round.

**3. Lock down what constrains everything downstream.** These are not up for
consultation: decide and report. They are the rules that make the character
usable in the pose flow.

- **Decide the degree of personification.** This is a design choice, not a
  consequence of what the mascot is. A real shark has no arms and a shark mascot
  can have them; a mug has none either and can have them too. Animal, object,
  plant or abstract shape, there are three degrees:

  - **Fully personified** — eyes, face, arms, hands and legs, even if the
    original has none of that. It stands, holds, points, waves, uses things. It
    gives the widest pose range, and usually suits a mascot that will be shown
    doing things.
  - **True to the original form** — keeps the real shape and adds little,
    sometimes only eyes. More distinctive and more recognizable as what it is. It
    solves actions by leaning, rolling, resting, deforming, looking.
  - **In between** — the original form with one specific liberty: fins that work
    as arms, a mug handle that acts as an arm, two branches that act as hands.

  None is better. Tell them in one line what each gains and gives up, let them
  choose, and **record the choice in the character sheet's repertoire**. From
  then on, what the character can do comes from the sheet, not from what the
  original would do in reality.
- **Flat colors.** No gradients, no textures — that is what drifts most. How many
  colors is up to the person: if the mascot needs six, it gets six.
- **Silhouette legible when small.** It has to read at 64px. No fine detail, no
  ornaments, no accessories glued to the body.
- **One distinctive trait.** Something memorable and easy to repeat: a patch, a
  tuft, a chipped ear. It is what makes it read as the same character.
- **Accessories, separately.** Cap, shirt, glasses: if they are part of the
  identity, they belong in the master. If they are circumstantial, better left
  out, because the script does not correct the color of anything the master does
  not have.

Tell them these decisions in two or three lines, not as a long list.

**4. Three concepts in words**, three or four lines each: what it is, what the
body is like, what expression it has, what colors. Do not generate images yet —
discarding in words is much faster. Let them pick one.

**5. Cheap drafts.** Use these only when the initial design still requires a
genuine visual choice. Tell the user first that seeing alternatives is essential
to choose the mascot's design. Generate the minimum useful number of variants at
low quality. Native transparency is preferred; controlled flat chroma is allowed
when needed. Label them as temporary choices, not final files, and delete every
unselected variant after the decision. If the design is already specified well
enough, skip drafts and proceed directly to the final master.

**6. Generate the master.** This is not just a nice image: it is the model sheet
every future pose will come from. If the character is born in three-quarter view
or with crossed arms, nobody ever saw what a whole arm looks like, and every
later pose carries that hole.

Mandatory master format:
- front view, at eye level, no high or low angle
- full body, centered, not touching the edges
- neutral, open pose: standing, limbs clear of the torso, nothing crossed,
  nothing hidden, no props, no accessories
- even studio light, soft, from above and in front
- no text, no signature, no logo
- 1024x1024

Use the `imagegen` skill. Prefer native transparent alpha; otherwise use its
controlled flat-chroma workflow and validate the converted contour before the
result can become `master.png`.

**If they brought reference images, they go in here too**, with the role stated
in the prompt. A style reference is used like this: *"copy the finish, linework
and proportions of the reference image; the character is a different one: a
shark"*. Without that clarification the generator copies the subject and hands
you back the penguin.

**7. Verify final alpha.** Inspect file mode, alpha extrema, transparent corners
and the contour on both light and dark backgrounds. Native alpha may pass
directly. A controlled flat-chroma source may pass only after deterministic
keying and the same contour checks. Reject fake checkerboards and any result
with halos, rims, holes or clipped details.

**8. Iterate until they like it, one change per round.** If they say "not quite",
do not regenerate blindly: ask which part — the face, the body, the color, the
attitude — and change only that. Changing three things at once makes it
impossible to know which one was the problem. Every attempt comes from the brief,
never from the previous image.

Every attempt is written to `work/`, numbered, and stays there while they choose.
That is what drafts are for: comparing attempt 2 against attempt 3.

**The moment they approve one, do this, in this order, without asking:**

1. Move the approved file to `<mascot-system>/master.png`. Move, not copy.
2. Copy that approved transparent master to the recorded asset bank as
   `00-<character>-pose-neutra-master.png`.
3. Create or update its `catalog.md` entry and regenerate `listado-poses.txt`.
4. Verify the number and exact filename agree across the asset bank, catalog and
   text index.
5. Delete `work/` entirely.
6. There is now exactly one identity master. No `master-v2`, no `master-final`, no
   `master-transparent-clean`.

A rejected attempt has no use left: nobody will ever ask for a pose based on one.
Keeping them just fills the user's disk with files they will never open. If they
later approve a different master, the new one replaces `master.png` and the old
one is deleted too.

**9. Measure the master** once approved:

```
python scripts/mascot.py <mascot>/master.png --describe
```

It returns the character's materials with their exact hex, measured on the image.
Do not invent or eyeball them: use these.

**Read the self-check it prints at the end.** The script evaluates itself on this
particular character, whatever it is:

- *"materials are clearly separated"* → carry on.
- *"WARNING: X and Y are not clearly separated"* → they get corrected as one.
  The difference between them is preserved, but they are not targeted
  individually. Mention it in one line and continue: the character still gets
  made, do not change the design over this.
- *"CHECK: X contains two tones"* → this one is yours to resolve. The script
  cannot tell two design colors apart from one color with shading. **Open the
  master with `view_image` and decide by looking.** If they are two real colors
  of the character, record both in the sheet so they show up in prompts. If it is
  shading, ignore it.

**10. Write `CHARACTER.md`.** Look at the master with `view_image` and describe
it. Template at the end of this file. The sheet is what makes FLOW B possible:
without it, "body consistency" is an intention, not a result.

**11. Close.** Build the character folder, save the master, and tell them in two
lines that from now on all they need to do is ask for a pose. Offer the first
three, chosen based on where they said it would be used.

---

## FLOW B — a new pose

**1. Check the repertoire.** Read the REPERTOIRE in the sheet before writing
anything, and judge **against the master, never against what the character would
be in real life**. If it is a shark with arms, it holds a bottle just fine; that
a real shark could not is irrelevant. If it is a mug with little hands, it waves.

Only if the request exceeds what *this* design has, say so in one line and
**offer the alternative that reads the same intent with this body**: coiling
around the bottle instead of gripping it, nudging it with its snout, balancing it
on its tail, eyeing it. Let them choose. If they insist on the impossible
version, warn that parts the character does not have will show up, and do it
anyway.

**2. Complete the pose.** If it arrives half-specified ("waving"), write it out
fully before generating:
- body posture (standing, sitting, coiled, in profile, leaning)
- what each movable part is doing, separately — arms if it has them, otherwise
  tail, head, body, fins
- facial expression
- camera/viewpoint: unchanged from the master unless the user explicitly asks
  for another view
- rigid transformation: name which rigid parts translate or rotate as one unit;
  never describe them as bending, stretching or receding in perspective

A half-specified pose produces unusable images. Show the full version and
generate from that.

Translate the requested emotion into observable facial signals before
generation. Do not approve a semantically adjacent expression just because it
looks polished. For **playful concentration while balancing**, require a steady
gaze toward the balance point, gently curved or mildly knitted brows, and a
closed small smile, pursed playful mouth or tiny tongue gesture. Reject:

- raised worried brows plus wide eyes or an open oval mouth — fear/surprise
- sharply descending V-shaped brows plus a flat mouth — anger/seriousness
- half-lidded sideways eyes plus a smirk — suspicion/arrogance

Judge the combined eyes + brows + mouth, not any feature in isolation.

**Expression is contextual, never automatic.** Treat this as an acceptance gate
for every pose. Infer the emotion from the scene's narrative meaning and exact
moment, translate it into observable eyes, mouth and posture, and write those
signals explicitly into the generation prompt. Never default to the master's
smile, rotate expressions for variety, or require the mascot to smile in every
image. Teeth are permitted only when the chosen expression has a genuinely open
mouth; a closed-mouth smile must show neither teeth nor mouth interior.

Choose the expression from the **narrative meaning and exact moment of the
requested pose**, not from a rotation, variety quota, recent-pose count, or the
master's default expression. First state what the character should emotionally
feel in that scene; then translate it into observable eyes, mouth and posture.
For example, a before-and-after transformation from disorder to organization
calls for relief or quiet satisfaction—relaxed eyes and a small closed-mouth
smile—not an exuberant open promotional grin. Celebration may justify a broad
open smile; diagnosis calls for concentration; an unresolved problem may call
for concern. Repeating an expression is acceptable when separate contexts
genuinely call for it, and changing it merely for variety is not. Never copy the
master's smile just because the master is the identity reference. Specify the
chosen eyes-and-mouth treatment explicitly in the prompt. Teeth appear only
when the mouth is open enough to reveal them.

**3. Generate a single image**, with `master.png` as the reference and a short
prompt. The likeness is held by the reference image, not by the amount of text;
the color is closed by the script in step 4. A long prompt does not improve the
result.

The available generator may auto-display its raw result. Accept that unavoidable
preview and do not manually attach it. Continue the workflow until the verified
transparent PNG is produced; that PNG is the only final deliverable.

```
Same character as the reference image, same design.
The only thing that changes is the pose.
<color line from the character sheet>
Square 1024x1024. Prefer native transparent alpha. If unsupported, use one flat
saturated chroma background absent from the character and props. No scenery,
ground shadow, fake checkerboard or text.
The character fills most of the frame without touching the edges.
Pose: <the full pose>
Rigid invariants: <rigid-parts line from the character sheet>. Orthographic view;
translation and in-plane rotation are allowed, perspective warp is not.
```

**Always square, always 1024, always a cutout.** Never generate at the
destination's aspect ratio — a vertical canvas for a vertical carousel just bakes
empty space into the PNG and wastes resolution on the character. The framing
happens later, when the slide is composed.

One pose per image. If they ask for several, generate them one at a time:
together they come back as a single sheet instead of separate images.

If the generated pose has native alpha, validate it directly. If it has the
requested controlled flat chroma, remove that chroma deterministically and
validate the contour. Any other opaque background is rejected and regenerated
from `master.png`.

**If the pose contains a one-off prop, garment or accessory, protect it before
color correction.** Create a same-size PNG mask: white/opaque over every prop
pixel, black or transparent everywhere else. Inspect the mask over the cutout;
it must cover the full prop without swallowing character pixels. A visible prop
without a verified mask does not proceed to correction.

**4. Correct the color:**

```
python scripts/mascot.py <mascot-system>/master.png pose.png -o work/corrected.png
python scripts/mascot.py <mascot-system>/master.png pose.png \
  --protect-mask work/prop-mask.png -o work/corrected.png
```

Use the first command only when there is no one-off prop. Use the protected form
whenever there is one. The report must say `protected: N px` with N greater than
zero. Protected RGB is restored exactly after correction. This step is not
optional.

**5. Verify with your eyes.** Open **both** images with `view_image` — the master
and the corrected pose — and compare them side by side, item by item, against the
CHECKLIST in the sheet. The script fixes color, not form.

Do not skim. Go through the checklist out loud, one line at a time, and say
whether each one passes. The failure mode is not missing something obvious, it is
glancing at the image, thinking "close enough" and moving on. The most common
drift is **internal layout**: elements that changed position or order while the
silhouette stayed right — a grid whose squares rearranged, a patch that moved to
the other side, a face element that slid off center. It looks like the same
character until you put them next to each other.

Run five independent gates; all five must pass:

1. **Identity and anatomy** — same individual, same parts, no additions.
2. **Geometry** — rigid components keep aspect ratio, subdivisions, parallelism,
   spacing and internal order. In-plane rotation is allowed; perspective warp is
   not unless explicitly requested.
3. **Color** — corrected character materials match the master.
4. **Props** — material and color match the request, the protection mask covered
   the complete prop, and protected pixels were not repainted.
5. **Expression semantics** — the combined eyes, eyebrows and mouth communicate
   the requested emotion, not fear, anger, seriousness or another nearby state.

Passing one gate never compensates for failing another.

Also check that no parts grew that the character does not have: hands on a snake,
fingers on a fin, legs on something that had none. That is the most common
failure when a pose asks for an action the body does not support.

**Any mismatch means regenerate**, not deliver with a caveat. "Close enough" is
what breaks a mascot over ten poses. If two attempts in a row fail the same
checklist line, say so and add that element explicitly to the prompt.

**Check the final background is truly transparent.** The delivered asset gets
dropped into carousels, decks and web pages, so a solid or simulated background
makes it unusable. Confirm the final is RGBA, its alpha contains both 0 and 255,
its corners are transparent, and its contour passes on light and dark proofs.
Record whether transparency was native or produced from controlled flat chroma.

**6. Record, publish and clean up.** Determine the next available number, prepend
it to the descriptive basename, and write the detailed pose entry into
`catalog.md`. Then, without
asking:

1. Move the corrected file directly to
   `<asset-bank>/<NN>-<character>-<action>-<distinctive-context>.png`.
2. Regenerate `<asset-bank>/listado-poses.txt` from the catalog, using the exact
   numbered filename on one line per asset.
3. Verify every line resolves to a real file and the numeric prefix matches the
   line number; also verify the new catalog entry uses that exact filename.
4. Delete `work/` entirely — raw generations, masks, proofs
   and any retry. Also delete generator-default copies after the selected final
   has been saved in the asset bank.
5. Show the user **one** image: the final one, and report both the asset-bank path
   and the `listado-poses.txt` path.

Deliver the PNG with the final dE on one line. Every delivered pose is a PNG with
a real alpha channel, ready to drop onto any background.

One request in, one file out. If they asked for one pose and end up with four
files on disk and three images on screen, the flow failed even if the pose is
good.

---

## Reading the script report

**The report is not approval.** A final dE of 0.00 is what the correction does by
construction: it moves each material's median onto the target, so it lands on
0.00 whenever the material was detected at all. It says nothing about form,
anatomy, geometry, props, or about a material that was classified as the wrong
thing. Never write "dE 0.00, so it is consistent". Only your eyes approve.

| signal | meaning | what to do |
|---|---|---|
| final dE < 1 | the materials it recognized were corrected | necessary, not sufficient — still verify visually |
| final dE > 2 | a material was detected badly | look at the image; the design may have changed |
| `absent in this pose` | that material is not visible | normal with a closed mouth; suspicious if something large is missing |
| `protected: N px` | pixels excluded by the verified prop mask | N must be greater than zero when a visible one-off prop exists |
| `foreign: N px` | unprotected pixels belonging to no material | inspect them; this is not a substitute for prop protection |
| **low `foreign` with an unprotected visible prop** | **the prop may have been absorbed and repainted** | **stop; create a protection mask and rerun** |
| `suspicious subject fraction` | the background was not flat | retry with `--tol 9` |

`foreign` is diagnostic only. It cannot prove that a prop was preserved: a prop
may resemble a character material and be classified as that material. The
deterministic guarantee is `--protect-mask` plus a nonzero `protected` report.

## Fixed rules

- **The reference is always `master.png`**, never a previously generated pose.
  Chaining outputs accumulates drift: each one starts from the last and moves a
  little further away.
- **Never fix a pose with a generative edit or inferred raster repair.** "Change only the tool" does not
  exist in a generative edit: the model redraws the whole image and the character
  comes back slightly different. Inpainting, clone/heal, blur, smudge,
  content-aware fill and sampled-color painting also invent pixels and may turn
  a small eye or face defect into a larger identity artifact. Any defect on the
  character's face, eyes, mouth, limbs, silhouette, anatomy, internal layout or
  distinctive trait means discard the pose and regenerate from `master.png`.
  Local correction is limited to deterministic controlled-chroma removal or
  alpha-only cleanup that preserves subject RGB, or an exact external prop/logo
  replacement with known source pixels or vector
  geometry. Compare before/after, require all pixels outside the declared region
  to remain byte-for-byte identical, preserve alpha unless alpha is the stated
  target, and re-run all gates. If any guarantee fails, discard and regenerate
  from the master through a path that does not expose intermediates.
- **Rigid parts stay rigid.** If the character contains a rigid structure — a
  grid, a screen, a logo, a pattern with a fixed layout — a pose may move or
  rotate it as one solid piece, never stretch it, re-divide it or bend it into
  perspective. Leaning a body is where this breaks most often: the model reads
  "leaning" as perspective and warps the structure. Say it in the prompt: the
  structure is rigid and keeps its proportions.
- **If a prop is part of who the character is, put it in the master.** A tool the
  mascot always carries, its glasses, its cup: inside the master they become a
  measured material with an exact target color, and they stay identical across
  every pose. That is what the master is for. Only genuinely one-off objects
  should be handled as props.
- **Props can use their correct real-world color, including one the character
  already uses, only when protected by a verified mask.** Without a mask, color
  similarity can make the classifier absorb and repaint the prop. Never dodge
  the intended palette as a workaround; protect the intended color instead.
- Never text, watermarks, signatures or logos inside the image.
- **Props and clothing**: always pin them down with **an exact hex and a
  material**, then protect them with `--protect-mask`. Prompt wording alone is
  not a color guarantee. Use a specification, not
  an adjective. "A gray vernier caliper" invites drift; "a vernier caliper in
  matte steel gray #8A8F94" defines the intended target, while the protection
  mask guarantees the generated prop is not repainted during correction.
  Write that exact wording into the pose entry in `catalog.md`, so a regeneration
  reuses the same string instead of inventing a new one.
- If the pose hides a large part of the body, say so: with little of the
  character visible, color correction is less reliable.
- If the user brings their own master as a JPG or on a white background, the
  script still cuts it out. `--describe` reports how it went.

## The script

```
python scripts/mascot.py master.png --describe          measure the master
python scripts/mascot.py master.png pose.png -o ok.png  correct one pose
python scripts/mascot.py master.png pose.png --protect-mask prop.png -o ok.png
python scripts/mascot.py master.png folder/ -o out/     correct several
python scripts/mascot.py master.png pose.png --check    report without writing
python scripts/test_mascot.py                            run regression tests
```

It discovers the character's materials by measuring them on its own master,
assuming nothing about what color it is or what it is made of: animal, object,
plant or abstract shape, three colors or seven. It cuts the background to alpha
when needed, brings each material to its measured color, and reports dE before
and after.

Requires `numpy` and `Pillow`.

## CHARACTER.md template

Write it in the user's language.

```markdown
# <NAME>

WHAT IT IS: <one line>

## Storage
Asset bank (absolute path): <path chosen and confirmed by the user>
Identity master: <absolute path to mascot-system/master.png>
User index: <absolute path to asset-bank/listado-poses.txt>

## Identity — what never changes
- head and face:
- body and proportions:
- limbs:
- distinctive trait:

## Repertoire — what THIS character can do
This list rules, not what the character would be in real life.

What it is: <animal / object / plant / vehicle / creature / abstract shape>
Degree: <fully personified / true to the original form / in between>
Movable parts: <arms and hands / legs / tail / head / fins / handle / branches / whole body>
Can: <hold, point, wave, coil, lean, tilt, look>
Does not have: <what this design does not include>
When something it cannot do is requested, the answer is: <how this character solves it>
Never draw parts the master does not have in order to satisfy a pose.

## Render style
<finish, lighting, outline>

## Colors (measured with --describe)
<material>: base #XXXXXX · shadow #XXXXXX · light #XXXXXX

Prompt line: <a single line with the 2 or 3 colors that matter most>

## Internal layout — position and order, not just presence
<Where each element sits and in what order. This is what drifts most and what
is hardest to notice. Examples: "3x3 grid, white square dead center, blue top
left, green top right"; "the patch is over the left eye, never the right".>

## Rigid parts
<Structures that may move or rotate as one piece but never stretch, re-divide
or bend into perspective. Example: "the 3x3 grid is rigid: nine equal square
cells, always square, never in perspective".>

For every rigid part record measurable invariants:
- aspect ratio:
- subdivision count and order:
- parallel or aligned edges:
- fixed landmark positions and spacing:
- allowed transforms: translation / uniform scale / in-plane rotation
- forbidden transforms: nonuniform scale / bend / shear / perspective warp

Camera lock: <same orthographic/front view as the master unless explicitly changed>

## Verification checklist
Check on every pose before delivering, one line at a time, against the master
open side by side. Any failure means regenerate. Approving one dimension does
not excuse another.

Identity and anatomy:
- 
Geometry and proportions:
- internal layout identical to the master (see above)
- rigid parts undeformed (see above)
Color:
- 
Props:
- the prop kept its color and did not turn into a character color
- a verified protection mask covered the whole prop and `protected: N px` was nonzero
```
