# Animation plan: <source video> · <duration> s · formats 9x16

STATUS: DRAFT — waiting for the user's OK. Nothing gets built until this says APPROVED.

Branch B. Marks are literal seconds on the source (bpm 60). The video carries subtitles (from the user's subtitles skill),
so every row must show something the subtitles don't say. Rules: reference/RULES.md "Branch B".

**Layout proposal (the user chooses):** over the footage / split / full-screen cutaways / mix — and why: …

| # | Time (s) | Trigger (what's said) | Shot type | What the viewer SEES that the subtitle doesn't say | On-screen text (key data only, or —) | Motion | SFX (type/file · gain) |
|---|---|---|---|---|---|---|---|
| 1 | | | | | | | |
| 2 | | | | | | | |

Shot types: footage move (punch-in / drift / shake) · resource demo (scroll, cursor, zoom, highlight on the real UI) ·
visual element (logos, icons, counter, price tag, arrows, comparison) · full-screen cutaway (voice continues) ·
behind the subject (only once a person matte exists).

Checks before sending:
- The hook (0–2 s) is the strongest visual, and it does not repeat the opening words.
- No row restates a non-key phrase that the subtitle shows at that moment. A row that adds nothing is cut.
- Something new every 2–4 s, and at least 3 different shot types across the film.
- Faces stay clear; key content stays out of the 9:16 UI zones (top 14 %, bottom 20 %, right 12 %).

## Source
- `assets/source/<file>` as it came (deliverable at its resolution: `timeline.scale`), transcript `transcript/transcript.json`.
- Resource: <url / screenshots> · References: `references/*.mp4` → `docs/style_guide.md`.

## Open questions for the user
-
