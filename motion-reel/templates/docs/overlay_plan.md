# Overlay plan: <source video> · <duration> s · formats <…>

STATUS: DRAFT — waiting for the user's OK. Nothing gets built until this says APPROVED.

Branch B (motion graphics over the user's own footage). Marks are literal timestamps on the source
video (bpm is 60 in `timeline.json`, so 1 beat = 1 second — no music, no measured grid). One row per
overlay; every row lists what is NEW on screen. The original narration is never paraphrased: the overlay's
exact words either match what's said, word for word, or are a deliberately shorter version of it — never
a claim that wasn't actually said.

| # | Time (s) | What's said (verbatim, the trigger) | Overlay type | On-screen text (exact) | Motion (preset) | SFX |
|---|---|---|---|---|---|---|
| 1 | | | | | | |
| 2 | | | | | | |
| … | | | | | | |

Overlay types (pick per moment, don't force every type into one video):
- **Kinetic text card** — the exact phrase just spoken, in big type, for emphasis on a key sentence.
- **Stat / number callout** — a number or claim just spoken, pulled out as its own card.
- **Step / checklist chip** — appears and stays while a numbered or sequential list is being spoken, checking items off as each is said.
- **Definition / term chip** — a technical term just spoken, with a one-line gloss.
- **Comparison** — two things just contrasted, shown side by side.

Rules this plan must satisfy:
- Every overlay's `at` mark sits on (or ~0.1–0.3 s after) the word that triggers it — never ahead of it, and never so late it reads as unrelated to what's being said by then.
- Nothing overlaps the speaker's face/mouth in a close-up shot; check this per format (9:16 crops tighter than 16:9 — see [reference/RULES.md](../reference/RULES.md) UI-zone rule).
- No overlay invents a number, feature, or claim that wasn't actually said in the video.
- The same "something new every 2–4 s" and "no dead time" rules from the house rules still apply — but here they apply to the **overlays**, not to the base footage, which keeps playing regardless.

## Source video
- File: `assets/source/<file>`, duration `<n>` s, format `<WxH>` (overlay formats re-block per output format; a 9:16 export crops a 16:9 source — flag to the user if the speaker leaves the safe crop in any format).
- Transcript: `transcript/transcript.json` (word-level timestamps from Whisper).

## Open questions for the user
-
