---
name: kieai-minimax-h3
description: Generate short visual-effect video clips (4–15s) with MiniMax H3 on KIE.ai. Use when someone wants an FX clip, a transition, a camera move, an animated shot from one or two images, a clip to splice inside an existing video, a text-to-video shot, or a clip built from reference images/videos — and also when they know the feeling they want but not the technique, when they ask which eyecandy/eyecannndy technique fits, when a generated clip came out wrong and needs diagnosing, or when they ask about KIE credits, task polling, or a 2K re-run. Covers image-to-video, reference-to-video and text-to-video on minimax-h3.
---

# MiniMax H3 on KIE.ai — visual effect clips

Produce one 4–15 second clip that does a specific visual thing, and verify it before calling it
done. The model is stochastic and paid: every run costs credits, nothing is reproducible, and a
blind retry is money set on fire.

**Speak the user's language.** They write in Spanish, answer in Spanish; English in, English out.
This document is in English; the conversation is not. The prompt shown for approval is in the
user's language, the prompt sent to the API is always English.

Read before writing any prompt:

- [`references/prompt-rules.md`](references/prompt-rules.md) — what this model does wrong and the clauses that stop it
- [`references/model-limits.md`](references/model-limits.md) — the real API contract, limits and pricing
- [`references/eyecannndy-catalog.md`](references/eyecannndy-catalog.md) — 136 techniques, their links, and which ones work here
- [`references/verification-checklist.md`](references/verification-checklist.md) — how a finished clip is judged

Everything that touches the API or ffmpeg goes through `scripts/kie.mjs`. Never hand-roll a fetch
call to KIE, and never invent a parameter that is not in `model-limits.md`.

## Setup, once per machine

1. **API key** — `KIE_API_KEY` as a user environment variable, or `KIE_API_KEY=...` in a `.env`
   inside the job folder. Never print it, never commit it. Check it works: `node scripts/kie.mjs credits`
2. **Jobs folder** — ask the user where all the work for this skill should live, then:
   `node scripts/kie.mjs config --base "<folder>"`. It is remembered in `~/.kieai-minimax-h3.json`;
   ask only once, and never assume a path from another machine.
3. **ffmpeg** on PATH, for the verification step.

## Step 1 — Find out what they actually want

If the user already knows the animation they want, take it and move on. Do not interrogate someone
who came in with a clear brief.

If they do not, ask — and stop at three questions, not ten:

- **What is it for?** A hook, a transition, a product shot, a reveal.
- **Does it get spliced inside another video?** This is the question that picks the mode. If the
  clip must cut in and out cleanly, it is image-to-video and nothing else.
- **What should it feel like?** Then offer 2–4 techniques from the catalogue by name, each with its
  eyecannndy link, and say what each one would look like in their case.

**Always show real examples, never just the family.** Naming a technique is not an answer — the user
cannot picture it. Run the bundled index:

```bash
node scripts/find-reference.mjs phone portal
node scripts/find-reference.mjs --tech object-portal --limit 5
```

It searches 6,399 catalogued clips by tag, title and technique, and returns each clip's **GIF URL —
that is the effect itself**, plus its techniques and tags. Give the user 2–3 of those links.

Two mistakes to avoid, both made before: do not hand over the clip's "original source" link (the
full music video on YouTube or Vimeo) as if it were the effect — it is not, and those links go
stale. And do not point at a technique page hoping the user will find the right clip in a grid of
300; find the specific clips yourself.

Offer techniques flagged **works** first. If they want one flagged **works with a rule**, say which
clause it needs. If they want one flagged **does not work**, say so plainly and offer the closest
thing that does, or the post-production route.

## Step 2 — Pick the mode

| The user has | Mode | What they get / give up |
|---|---|---|
| A start image, an end image, or both | **i2v** | Exact first and last frame. The only mode that splices cleanly. Max 2 images. |
| A character, object or style to preserve, in up to 9 images and 3 videos | **ref2v** | More material in. No first/last frame control — the cut will not match. |
| Nothing but an idea | **t2v** | Full invention, `aspect_ratio` required. |

Two things to say out loud rather than decide silently:

- ref2v **does not carry camera movement** from a reference video. Appearance survives, motion does
  not — verified twice. If they want the move from a clip they have, it gets described in words.
- Reference audio only exists in ref2v and needs an accompanying image or video. What the model does
  with it is undocumented; do not promise a behaviour that has not been tested.

## Step 3 — Build the job

```bash
node scripts/kie.mjs init <slug> --mode i2v
```

Copy the input files into the job's `in/` folder, then fill `job.json`:

- `prompt_es` — the version shown to the user (in their language, whatever it is)
- `prompt_en` — the version that reaches the API, built with the structure in `prompt-rules.md`
- `duration` — integer 4–15
- `resolution` — **`768P` always on a first run.** Never open with 2K.
- `technique` — the eyecannndy name used, for the log

Show the user the prompt in their language and the technique, and get a yes before spending anything.

## Step 4 — Estimate, confirm, submit

```bash
node scripts/kie.mjs estimate --job "<dir>"
```

Show the credit number. Remember input video seconds are billed on top of generated seconds. Then,
**only after the user confirms that number**:

```bash
node scripts/kie.mjs run --job "<dir>" --yes
```

`run` uploads the inputs, creates the task, polls until it finishes, downloads the MP4 and builds
the verification material. The `--yes` flag means "the user confirmed the cost" — it is not a
convenience flag, and the CLI refuses to submit without it.

The individual steps (`upload`, `create`, `poll`, `verify`) exist for when a run breaks halfway.
If polling times out, the task usually keeps running: `node scripts/kie.mjs poll --job "<dir>"`
picks it back up.

## Step 5 — Verify

`verify` writes `out/contact-sheet.png` (16 frames in a 4×4 grid), `out/frame-first.png`,
`out/frame-last.png` and `out/verify.json`.

Look at the contact sheet and answer the six questions in
[`verification-checklist.md`](references/verification-checklist.md). If the current agent cannot see
images, print the checklist and walk the user through it — never skip it, never assume it passed.

Write the verdict into the job's `log.md`, which already holds both prompts, the parameters, the
taskId and the credits spent.

## Step 6 — 2K, only if they ask

A 768P take that came out right **cannot** be re-rendered at 2K. There is no seed; a 2K pass is a
new generation that may come out worse. Say this before they pay for it. If they still want it,
copy the job with `resolution: "2K"` and run the whole gate again — estimate, confirm, submit.

## Hard rules

1. **Never submit without an explicit confirmation of the credit cost.** Not "I'll go ahead", not
   an assumption from an earlier run. Each submission is its own approval.
2. **768P by default.** The API defaults to 2K; the skill overrides it. 2K only on explicit request.
3. **Never retry blind.** On a failure, diagnose from the contact sheet, map it to a finding in
   `prompt-rules.md`, change **exactly one variable**, and write down which one in `log.md`.
4. **Never invent API parameters.** There is no seed, no negative-prompt field, no prompt optimizer.
   If it is not in `model-limits.md`, it does not exist.
5. **Keep local copies.** KIE deletes uploaded files after 24 hours; the job folder is the record.
6. **Never print the API key.**
7. **When a run contradicts this documentation, fix the documentation.** A finding that cost credits
   to learn and did not get written down will cost those credits again.
