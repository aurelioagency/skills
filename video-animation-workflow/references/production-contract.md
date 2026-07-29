# Production contract, script, and screen map

## Contents

1. Contract template
2. Duration handling
3. Script handling
4. Timing map
5. Screen map approval

## Contract template

Create `VIDEO_CONTRACT.md`:

```text
# Video acceptance contract

Source:
Source authority:
Active brand profile:
Audience:
Platform:
Language and regional form:
Requested format: 16:9 | 9:16 | both | custom
Canvas dimensions:
Working duration:
FPS:
Audio status: final | provisional | none
Promise or subject:
Required facts and proof:
Proof placeholders:
Required assets:
Forbidden substitutions:
Caption behavior:
Motion behavior:
Sound behavior:
Approval gates:
Final deliverables:
```

The contract is approved when another agent can determine whether a result matches the request without reopening the entire conversation.

## Duration handling

Default target: 15-30 seconds.

### Audio supplied

Measure the complete usable audio. Recommend that exact duration. If it exceeds 30 seconds, offer:

- preserve the full recording;
- select an approved excerpt;
- create a shorter script for a new recording.

Never speed up or time-stretch speech merely to hit the default.

### Script supplied

Estimate natural delivery using the selected language and voice evidence. State word count, estimated words per minute, pause allowance, and estimated range. Ask whether to preserve or change it when the estimate falls outside 15-30 seconds.

### Topic supplied

Draft for a specific target inside 15-30 seconds. Do not draft an undefined-length script and force the visuals to absorb it later.

## Script handling

### Generated or rewritten copy

Use:

1. Hook or subject confirmation.
2. Pain, stakes, or familiar friction.
3. Different approach.
4. Concrete proof, examples, or mechanism.
5. Believable outcome.
6. Handoff or close.

Not every script needs all six beats. Remove any beat that does not earn time.

After drafting:

1. Invoke `$humanizer` with the active voice profile and samples.
2. Read the result aloud for rhythm.
3. Verify every name, number, claim, and pronunciation against source.
4. Recalculate duration.
5. Show one exact final script for approval.

Humanizer is an editing pass, not a factual source.

### Existing recording

Transcribe verbatim. Correct only clear transcription errors by listening again. Captions must match spoken words. If better copy is needed, create a separate proposed script and explain that the user must record it.

## Timing map

Create a table with one row per spoken phrase or silent beat:

| Start | End | Phrase | Pause | Emphasis | Native text | Visual beat | Asset | Transition | SFX opportunity | Timing authority |
|---:|---:|---|---|---|---|---|---|---|---|---|

Timing authority is one of:

- measured audio;
- approved transcript estimate;
- provisional script estimate.

Do not distribute words evenly. Real audio timing replaces estimates as soon as audio exists.

## Screen map approval

Before storyboard generation, show every meaningful screen as plain text:

```text
Screen 01 — 00:00.00-00:02.40
Narration:
Native text:
Primary visual:
Secondary visual:
Composition:
Persistent elements:
Transition out:
Purpose:
```

Approval binds:

- exact native words;
- which visual idea appears;
- persistent asset identity;
- order of screens;
- format-specific hierarchy.

It does not bind pixel-level geometry yet. That becomes binding at storyboard approval.
