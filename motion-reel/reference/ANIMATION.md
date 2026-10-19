# Animation language (Branch B)

The user's reference reels — **thomas**, **joebrunner**, **loucash** (talking-head reels about AI tools/resources) — define how
their videos should move. This file is that grammar, measured frame by frame, mapped to the `OV` kit (`engine/overlay.js`).
It is a **vocabulary to choose from per video and per moment, never a checklist**. Take the grammar, never the content.

## 0. Reference ≠ template (read this first)
The references teach **how things move, hit and sound** — never **what** to show. Every visual is created for THIS video,
from its own resource and its own words.
- **Never copy a reference's elements**: not the "0€" tag, not the "1 000 000 vues" counter, not the chat-bubble doodle, not
  the "OVER" / "NEVA" stamps, not the bell, not the pixel characters. Their *technique* (a slammed tag, a rolling number,
  a drawn illustration, a stamp) is the vocabulary; the content must come from the video at hand.
- **No recurring signature motifs across videos.** Most resources the user shares are free — so a "free" badge would end up
  in every video. Don't. Before planning, read the plans of the previous projects (`videos/*/docs/overlay_plan.md`) and do
  not reuse the same visual idea for the same kind of moment; find what is specific to this resource (its real UI, its
  numbers, its use case, what it replaces).
- **Locale**: the user is in Argentina and speaks rioplatense Spanish. Money is `$` / `USD` (never €), copy in rioplatense
  ("usá", "construila", "comentá").

## 1. The feel in one line
Things don't glide in — they **hit**. A key word, a screenshot, a tag or an icon is either already there on its frame or
lands in ~0.1 s, always with its sound on that same frame. Between hits, something new every 0.5–1 s while the speech is
dense, and the speaker regularly leaves the frame so the explanation can be *shown*.

## 2. Layouts (the frame)
| Layout | What it is | Seen in | Kit |
|---|---|---|---|
| **Full speaker** | Speaker fills the frame; graphics in the free zones (sky, wall) above the head, never over the face | all three | default |
| **Over the footage** | The resource floats over the video — a browser window with its real page, a repo card, an app screen — above the head; the speaker stays in frame | the user's first film (their favourite for their own page) | `OV.browser(parent, {…})` + `OV.slam` / `OV.cutIn` |
| **Split** | Resource / illustration on the top half, speaker on the bottom half (face centred in it) | thomas (screens, gameplay, code), joebrunner (illustrated "stage") | `OV.layout([[t,'split']], { face })` |
| **Full-screen cutaway** | Speaker gone, a complete animation fills the frame on a plain background (light or dark) while the voice keeps talking — 1.5 to 8 s | thomas (white bg + real GitHub card), loucash (dark bg + doodles / striking images) | `OV.layout([[t,'gone']])` + a scene with an opaque background |
**Which layouts a video uses is the user's call: propose them in the plan (with a one-line why) and ask before building** — e.g. "over the footage" for a page or tool, "split" for long screen walkthroughs, cutaways for explanations. Switches between layouts are **hard cuts**. A fade to white into a cutaway exists (thomas, once) — optional and rare
(RULES.md). Use the speaker's absence where the speech explains something visual; come back to the face for opinions,
emotion and the CTA.

## 3. Entrances (in order of use)
| Entrance | Motion (measured) | Use for | Kit | Sound |
|---|---|---|---|---|
| **Slam** | enters at ×1.5–1.8, transparent, lands at ×1 in **2–3 frames (≈0.1 s)** exactly on the cue; tiny settle; optional rotation (stamps −6…−10°) and a 2-frame landing shake | key words, tags ("0€", "open source"), stamps ("OVER", "NEVA"), buttons | `OV.slam(el, { at, rot, shake, from })` | word click |
| **Cut in** | just there on its frame, 2-frame ×1.06 snap | big key words one by one (loucash "DEMI / MILLION"), screenshots, cards, terminals | `OV.cutIn(el, { at, sfx })` | word click (`'screen'` for screens) |
| **Pop** | ×0.3 → ×1.15 in 0.08 s, settles to ×1 | icons, logos, emoji-like glyphs; in a run, 0.12–0.2 s apart | `OV.pop(el, { at })` | bubble (pitch climbs in a run) |
| **Draw on** | the outline draws itself in ~0.35 s, then the fill pops | hand-drawn illustrations: speech bubbles, phones, documents, arrows, circles around things | `OV.draw(path, { at, dur, fill })` | bubble when the fill lands |
| **Type on** | characters appear over the window | terminals, search bars, prompts, URLs | `OV.typeOn(el, text, { t0, t1 })` | key ticks |
| **Odometer** | every digit a rolling column, eases out to the value | a striking number (views, stars, users, money) | `OV.odometer(parent, { value, t0, t1, group: 3 })` | ticks |
| **Cursor click** | the cursor glides in, presses (×0.82) and a ring expands | "you click here", buttons, installing, toggles | `OV.cursor(parent, { path, clicks })` | mouse click |
Soft rises (`OV.slide`) are not the house look: only for a rare calm moment.

## 3b. The camera (the footage moves too)
- **Jump-cut zooms** (`OV.punch([[t, 1.15–1.25]])`, default kind `'cut'`): the speaker is suddenly closer on a strong word, and back out on the next beat. `'snap'` gets there in 0.12 s; `'smooth'` is a slow push for a calm line. Something every few seconds in talking stretches.
- **Impact jolt**: when something slams in, the whole frame (footage + graphics) jolts for 2–4 frames (± ~10 px and a 1.5 % kick). Every `OV.slam` does it by default (`impact: 0` turns it off; smaller elements ~6); `OV.impact(at, amp)` adds one.

## 4. Exits
**Hard cut** by default (`out:`) — the element is simply gone on the next shot. `outKind: 'drop'` (shrinks out in 0.1 s) for
an element that leaves while the shot continues. Never a slow fade.

## 5. Where every animation comes from
Two sources, always together:
1. **What the user says** (the transcript): each moment's animation illustrates that sentence — the thing named, the number
   said, the action described, the problem and the fix. Planning starts by reading the transcript and marking those moments.
2. **The resource** the video is about: its real images, screenshots, GIFs, logo, UI and colours. Scroll its page, zoom
   into what matters, cut in its real images. **The visual world of the video is the resource's world**, not the user's
   brand and not the references' look: a GitHub repo that runs AI agents in Minecraft (AgentCraft) → the animations live in
   its Minecraft imagery (its characters, blocks, screenshots); a finance API → its charts and data; the user's own page →
   its own black/cream look.
   - Gather it: `capture.mjs <url>` for pages; for a GitHub repo, the repo page plus the README's images/GIFs and the
     social preview; logos from the official site. Prefer the resource's own visuals over anything drawn from scratch.
   - Colours: the resource's palette for tags, panels and drawn elements (never red + white).

## 5b. What to show (content of the animations)
- **The real resource**: its page, its repo card, its UI, its numbers — screenshots from `capture.mjs`, cut in on white or
  dark cutaways or on the split's top half. Highlight the part that matters (a circle drawn on, a tag slammed next to it).
- **Explaining icons**: whatever turns *this* sentence into a picture, drawn for it (an icon that rings, a cross over what's
  not allowed, a lock, a check, a button being clicked are kinds of ideas, not assets to reuse).
- **Key data**: one number or 1–3 words, huge (loucash: white serif ~25–30 % of the frame width per word) or in a solid tag.
- **Illustrated "stage"** (joebrunner): a simple flat scene (board, room, desk) where small elements keep landing — an
  option when the resource has no UI to show.
- Never a sentence the subtitles already show (RULES.md "No echo").

## 6. Rhythm
- Dense speech: a new visual every **0.5–1 s** (joebrunner, thomas); calmer stretches: every 2–3 s at most.
- The speaker leaves the frame roughly every **5–10 s**, for 1.5–8 s.
- The hook (first 1–2 s) is a hit — the strongest visual, not the opening words.
- The CTA ("comentá X") is a slam of the keyword in a solid tag, on the face shot.

## 7. Sound (automatic)
Every kit entrance registers its cue on the frame it lands; `node scripts/autosfx.mjs` writes them into `timeline.sfx`
(house map in the script and in AUDIO.md §2): words and screens → `clic_palabra_loucash`, icons → `bubble`, cursor →
`click`, typing / counters → `tick`. Two sounds on the same frame are deduplicated. Hand-written cues are kept.

## 8. Colour
From the resource being shown; solid, high-contrast tags. **Never red and white** (RULES.md).
