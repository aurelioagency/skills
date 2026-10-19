# Subtitles (Branch B)

Branch B videos always ship with subtitles, and they must come out **identical to the ones social-video-producer burns**: same transcript pipeline, same approval gate, same font, same size, same one-word reveal, same per-shot placement under the face, same libass burn. These rules and the scripts are a copy of that skill's Burn-In Captions branch and Caption Contract. When one changes, change the other in the same pass so the two skills keep producing the same subtitles.

Subtitles are **not** drawn by the film (no HTML captions, no `OV` helper). The film renders clean; the subtitles are burned onto the final render with libass, as the last step. That is what makes them match social-video-producer pixel for pixel, and it lets the caption band follow the face as the film actually frames it (punch-ins, split, cutaways), not as the raw source framed it.

All subtitle scripts run from the skill folder (`node <skill>/scripts/...`, `python <skill>/scripts/...`), from the project root. They need Node, ffmpeg, and Python with `faster-whisper`, `Pillow` and `opencv-python`. Check this before starting, not when a script fails halfway through.

---

## S1. Transcribe the real audio (in B1)

```
node <skill>/scripts/transcribe-media.mjs --input assets/source/<file> --out-audio transcript/voice16k.wav --out-transcript transcript/transcript.json --language es
```

Detect the spoken language before transcribing rather than assuming `es` if it isn't obviously known. The script reports `lowConfidence` words. Read the transcript from the JSON file with a UTF-8 reader, never from terminal output (the Windows codepage mangles accented Spanish and invites approving text that was never wrong).

This one transcript is both the timing source of the animation and the source of the subtitles.

## S2. Transcript Approval Gate (blocking, requires the user)

Before asking for approval, run `detect-shots.py` on the raw transcript and the source, so the same message carries the transcript AND the structure:

```
python <skill>/scripts/detect-shots.py --video assets/source/<file> --transcript transcript/transcript.json --out-shots manifests/shots.json --out-check snapshots/shots-check.png
```

Never ask for approval with the transcript alone. The message body (never an intermediate message, never inside the question box) shows: the full text, the hook and the CTA as plain text with their time ranges, the list of shots with their time ranges, and the `shots-check.png` strip sent as an image.

1. Fix the language yourself first, before showing anything. Spelling, accents, verb forms, prefix joining, and register consistency are the agent's job, resolved against a dictionary and against the rest of the transcript — never a question for the user.
2. Show the full plain text, readable, already corrected.
3. Ask about every word you genuinely doubt *was said*: proper nouns, brand and product names, acronyms, numbers, low-confidence tokens, and anything that does not parse. ASR engines systematically mis-transcribe proper nouns and brand names, and no dictionary can tell you which product the speaker meant — that is exactly what the user is for. What never goes in the list is how a word is spelled or accented.
4. Wait for the user's correction or approval. Do NOT start any caption render until explicit approval is received.
5. Apply the corrections to the timestamp JSON:
   - Word split into 2 tokens: merge into a single token with the start of the first token and the end of the second.
   - Missing word (articles/prepositions before names): insert it by splitting the neighboring token's time range.
   - Never invent timestamps outside the real audio range.
   - Keep the raw ASR output untouched and write the corrected version alongside it as `transcript/approved.json`, so the original stays auditable. Plain one-word substitutions may instead go in `transcript/corrections.json` (`[{ "at": 4.72, "from": "puedes", "to": "podés" }]`, passed with `--corrections`); when a fix merges or splits tokens (`ultra` + `liviano` → `ultraliviano`), write `approved.json` directly.

From here on, the animation plan and the subtitles both read `transcript/approved.json`.

### Ask what was said, never how it is written

- **Ask freely about which word was spoken.** Anything the audio leaves genuinely ambiguous — a product name, an acronym, a number, a word Whisper flagged as low-confidence, a phrase that does not parse — goes in the list.
- **Never ask how a word is written.** The user is a native speaker of the language they recorded in; asking them to adjudicate their own orthography is offloading the work onto them, and it reads as insulting.
- **Do not bundle unrelated words into one grammar question.** Resolve the pattern once, apply it to all of them, report it as done.
- **Do not name grammatical categories at the user** (*tuteo*, *voseo*, *aguda*, *llana*, *diacritic*). If a reason is needed, ground it in their own audio: "va en voseo porque en el audio decís *tenés* y *Seguime*" — one line, no lesson.
- **Accents/diacritics:** a solved rule, not an opinion (`haces` llana ending in -s → no tilde; `hacés` aguda ending in -s → tilde; `comentá` aguda ending in a vowel → tilde). If unsure, look the form up.
- **Prefixes and compounds:** RAE rule, prefixes join the base word (`ultraliviano`, not `ultra liviano`).
- **Register consistency:** decide it from the audio. Whisper systematically neutralises Rioplatense voseo to peninsular tuteo, but rarely every instance. Find the forms that survived (`tenés`, `Seguime`, `podés`, `sos`) and normalise the whole transcript to that register. A transcript that mixes `tenés` with `instalas` is an ASR artefact, never a stylistic choice.
- Report the fixes as a decision already applied, in a table of `what the ASR heard` → `what ships` → `why`. The user's only job is to veto something that looks wrong.

After approval, re-run `detect-shots.py` on `transcript/approved.json`.

## S3. Freeze the caption font

```
node <skill>/scripts/freeze-caption-font.mjs --project . --output assets/fonts/captions/NeueMontreal-Bold.otf
```

Never point the burn at a system font path: it must come from the project so it stays reproducible on another machine. The caption font lives in its own folder (`assets/fonts/captions/`) so the resource fonts `capture.mjs` drops into `assets/fonts/` never mix with it.

With no flag this freezes **Neue Montreal Bold**, the house default, from the fonts bundled in `<skill>/assets/fonts/`. `Inter-Black.ttf` is kept as a fallback for older projects (`--bundled inter`). `--list` shows what is bundled; `--system` copies the heaviest installed sans; `--source <file-or-direct-url>` freezes a specific font (direct font file only, never a zip). Caption fonts want a heavy weight: at 104px a Regular reads thin over moving video.

## House style (decided; not a menu)

**Neue Montreal Bold at 104px (1080-wide scale), all white, one word at a time** (`--max-words 1`): each word enters centred, holds while it is spoken, and is replaced by the next. **Crisp solid-white fill**: `--outline 0` (no black keyline) and `--blur 0` (no blur on the letters; a blurred glyph reads as broken, not soft). A plain drop shadow is the only depth. No colour accent. That is what the scripts produce with no style arguments, and it **ships as-is** — a decided house style, not a starting point.

**Do not offer 2-3 style candidates.** Re-opening the style hands a solved problem back to the user. Generate alternative styles only when the user asks for a different look, and then render exactly the alternatives they described.

An accent colour is opt-in, only when the user asks for it: `--accent "<hex>"` turns the currently-spoken word a colour. Two standing options:

1. **Cyan `#30D5FF`** — over dark/medium backgrounds (skin, hair, dark clothing, shadowed interiors). ~12:1 against dark; washes out over white (~1.7:1).
2. **Blue `#2F6FED`** — over light/white backgrounds (screen recordings, light UI, bright rooms). ~4.6:1 against white, ~5.1:1 against black.

For a keyword-only highlight add `--accent "<hex>" --accent-mode keyword --accent-terms "..."`.

## Caption contract

- Captions follow the actual spoken audio, and are only rendered from the transcript approved at S2, with word-level timing.
- Markdown headings, file names, hook labels, metadata and planning notes are never captions.
- Captions must never be tiny: readable on a phone at normal viewing distance.

### Reveal

- **House default: one word at a time, always centred.** Each word is its own chunk, so it enters centred, holds while spoken, and is replaced — no reflow, no lone-word-off-centre problem.
- If a project overrides to multi-word chunks, cap at 2 words; chunk-cut gap threshold 0.35 s. Existing words must not move when a new word appears AND the text must look centred; when those pull apart, **centering wins** — reveal the whole chunk at once, never word-by-word within a chunk, and never re-centre on every word.

### Position: always below the face

- Sample **every distinct framing in the film**, not "2-3 timestamps". In Branch B the film itself creates framings: punch-ins (the face grows and drops), `split` (the speaker in the bottom half), full-screen cutaways (no face), plus whatever cuts the source already had. For each framing, find the LOWEST the chin gets.
- Captions must NOT cover the face. Face in the upper/middle third → visible lower third (above the platform UI safe zone). Face centred → the band between the chin and the safe zone.
- **The caption band follows the face across shots; it is never one fixed Y.** A fixed band that clears the face in one shot lands across the mouth in another. "Below the face" also means *not* stranded at the very bottom of the frame where the face rides high — each shot gets a band just below its own chin. Never above the head.
- **In a wide/full-body shot the caption goes on the chest, just below the chin, the same rule as the close framings.** Never push the band down to sit below the speaker's hand or held object (mic, prop, phone): the text belongs next to the face, where the viewer is looking, not further down the body. The user corrected this explicitly (2026-10-19): an earlier version anchored the wide-shot band under the hand/prop, which was wrong. The band may overlap the hand or the prop if that is what sits right under the chin; it must never cover the face. Re-derive the chin position per project; never reuse a previous video's number.
- **A crossfade or dissolve is not an instant cut.** The zone boundary goes where the outgoing framing's face stops matching, not where the transition starts; a word that starts just before a 0.2-0.3 s crossfade takes the position of the shot it resolves into. Sample frames in ~0.1 s steps across it.
- **The word that falls on a shot change takes the position of the new shot**: the zone boundary goes before that word, never after.
- The face rule outranks "captions centred in the middle of the screen". Centred-in-frame is only for sections where nothing important sits behind the band (e.g. a full-screen cutaway).
- Minimum horizontal padding: 120px per side at 1080 width.
- **A single word is never split and never shrunk, even a domain or a URL** (`aurelioagency.com,`). A one-word line may use the frame width minus a thin padding (64px at 1080). If the width gate still fails, ask the user.
- The one thing worth confirming per video is placement when a frame shows a conflict the rules can't resolve blind — a face in the lower third (e.g. a `split` layout that pushes the chin under y=1440), a burned-in logo, on-screen UI under the band. Ask about that specific frame, not about taste.

### Platform safe zone (9:16, at 1080x1920)

No text or important element below y=1440 (the bottom 25% is covered by the platform UI), above y=220, or within ~120px of the right edge (button column).

### Graphics and subtitles share the frame

The subtitles are burned on top of everything, so a graphic placed in the caption band gets covered. When planning (B3) and building (B4), keep the band just under the speaker's chin free of graphics in every framing; put graphics above the head, to the sides, or in a full-screen cutaway. The no-echo rule (RULES.md) still applies: a graphic never repeats the phrase the subtitle is showing.

---

## S4. Final render without subtitles

After the critique loop reaches SHIP, render the primary format as a high-quality master for the burn (the burn is one more encode, so the master goes in nearly lossless):

```
node scripts/render.mjs --crf 10
```

`renders/9x16.mp4` is now the clean film at the source's resolution. It is not a deliverable on its own.

## S5. Detect shots and caption zones on the rendered film

```
python <skill>/scripts/detect-shots.py --video renders/9x16.mp4 --transcript transcript/approved.json --out-shots manifests/shots.json --out-zones manifests/caption-zones.json --out-check snapshots/shots-check.png
```

Run it on the **rendered film**, not on the source: punch-ins, `split` and cutaways move the face, and the zones must follow the face the viewer will actually see.

The script finds the **hook** (first full sentence), the **CTA** (last full sentence, extended backwards over sentences that also ask the viewer to do something) and the **body**, then the framing changes from where the speaker's face sits (never from pixel scene-detect). The hook and the CTA are each kept inside one shot; every other cut is moved onto the start of a word (a word starting up to 0.25 s before a cut takes the new shot), so no word is split between two zones. Zones never overlap: each ends exactly where the next starts. It measures the lowest chin per shot and writes `manifests/caption-zones.json`. Where there is no face (a full-screen cutaway) it falls back to the median chin.

It prints `Plano 1 (...): <text>`, ..., `GANCHO (...)` and `CTA (...)` (`ATENCION` if either is split). `--out-check` writes ONE image with labelled frames at the start and end of the hook and the CTA and just before and after every cut. **Look at it** before burning: the first and last word of the hook and the CTA, and the words around each cut, must sit in the right zone for their shot.

**Then check placement across every framing, not one frame.** Scan the whole film (a 1 fps contact sheet of the lower half is enough), identify each framing and the LOWEST the chin gets in it, adjust `caption-zones.json` where the script got it wrong (wide shots: on the chest just below the chin, never pushed under the hand/mic; crossfades; `split`), and burn a preview frame at the worst moment of each framing. Getting this wrong costs a full 4K re-burn, so spend the minutes here.

## S6. Build the subtitle file

```
node <skill>/scripts/build-burn-in-captions.mjs --transcript transcript/approved.json --output renders/subs.ass --font-file assets/fonts/captions/NeueMontreal-Bold.otf --video-width <w> --video-height <h> --size 104 --zones manifests/caption-zones.json
```

Pass the RENDER's real dimensions (`ffprobe renders/9x16.mp4`), and scale every caption dimension by `width / 1080` — the defaults are expressed against the 1080-wide house design. On a 2160x3840 film that is `--video-width 2160 --video-height 3840 --size 208 --outline 0 --shadow 8 --blur 0 --margin-lr 240 --margin-bottom 1000`. Leaving the 1080 numbers on a 4K frame renders captions at half their size, and it passes the width gate while doing it.

Each caption takes the `marginBottom` of the first zone whose `[start, end)` contains its start time; gaps and time past the last zone fall back to `--margin-bottom`. Example:

```json
[
  { "start": 0,    "end": 3.4,  "marginBottom": 1480 },
  { "start": 3.4,  "end": 8.0,  "marginBottom": 830 },
  { "start": 8.0,  "end": 38.0, "marginBottom": 650 },
  { "start": 38.0, "end": 39.6, "marginBottom": 545 },
  { "start": 39.6, "end": 60,   "marginBottom": 650 }
]
```

Two failure modes this example encodes:

- **A "wide intro" is not one zone.** A wide framing where the face rides high (`1480`) that cuts at 3.4 s to a tighter shot where the face drops (`830`) needs a boundary exactly on the cut. One zone left the caption stranded far below a high face.
- **A 2-line chunk grows upward from the baseline**, so in a low-face shot it can touch the chin even when 1-line captions clear it, and the width gate cannot see this. Give that moment its own lower micro-zone (38.0–39.6), or size the type down so nothing wraps.

## S7. Width gate (hard stop)

```
node <skill>/scripts/audit-caption-width.mjs --ass renders/subs.ass --font-file assets/fonts/captions/NeueMontreal-Bold.otf --output manifests/audits/caption-width.json
```

A failure is a hard stop. No DOM/overflow check can see burned-in captions.

## S8. Burn once, then verify

```
node <skill>/scripts/burn-in-captions.mjs --input renders/9x16.mp4 --ass renders/subs.ass --output renders/final/<slug>-subs.mp4 --fonts-dir assets/fonts/captions
node <skill>/scripts/verify-render.mjs --file renders/final/<slug>-subs.mp4 --expect-width <w> --expect-height <h>
```

One encode pass: the whole caption design lives in the `.ass`; never chain extra ffmpeg passes to add caption features. Then extract frames from the FINAL file — at minimum one per framing (talking head, punch-in, split, cutaway) and one wrapped two-line caption if any — and look at them.

Then build the cover and burn it in as frame 0 (COVER.md); `renders/final/<slug>-final.mp4` is the deliverable. If the mix changes later, re-mux (`render.mjs --mux`) the clean master and burn again; the `.ass` and zones are kept in the project so a re-burn takes seconds.

## libass behaviour that costs a render cycle

- **The font family name is not the file name.** `Inter-Black.ttf` declares `Inter Black`; asking for `Inter` makes libass silently fall back to another font. `build-burn-in-captions.mjs` reads the family from the font's name table; let it auto-detect instead of passing `--font-name`.
- **`\pos` and `\move` disable margin-based wrapping.** Line breaks must be inserted explicitly as `\N`, measured against the real font metrics.
- **ASS colour is `&HBBGGRR&`**, the reverse of CSS hex.
- **Escape the Windows drive letter inside a filter argument** (`C\:/path/file.ass`).
- Always pass `--fonts-dir`, so the burn uses the frozen project font.
- **`-ss` before `-i` renders the wrong subtitle** (timestamps rebase to zero). For any preview or QA frame put `-ss` AFTER `-i`: `ffmpeg -i in.mp4 -ss 12.7 -frames:v 1 -vf "ass=...,scale=540:-1" out.png`.
- A frame extracted exactly on an event's start can come back blank (`\fad(70,0)`): sample a few tenths inside the event before concluding a caption is missing.
