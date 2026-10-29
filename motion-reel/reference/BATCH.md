# Batch mode: one folder of raw takes, several topics

Use it when the user hands over a folder of raw phone takes (often dozens, unsorted, named `IMG_xxxx`) plus a script file (PDF, doc, text) with several topics, each with hooks, a body and a CTA. The user no longer sorts or checks takes before handing them over (user, 2026-10-29): this mode does it. It ends with every take renamed and one topic per session; each topic then runs the normal Branch B from step 1.

Batch state lives in `<Documents>/motion-reel/.work/_lote-<folder name>/`. Commands: `python "<skill>/scripts/batch-takes.py" <scan|rename|undo|sdr> --folder "<folder>"`.

## L1. Read the script and scan the takes

1. Convert the script to text first (a PDF goes through `pdf-markitdown`, never read as page images). List per topic: its hooks (numbered), body and CTA.
2. `scan` probes every video, checks free disk, transcribes each take word by word with local Whisper (cached, no Claude tokens) and writes `takes.json`. Run it in the background: about 1.5 GB of takes takes several minutes. stdout gives one compact line per take with flags; read `takes.json` for the text.

## L2. Map every take

Match each take's text against the script and write `map.json` (format at the top of the script). Every file gets an entry; `rename` refuses to run otherwise.

- **Parts:** `hook-1`…`hook-N` with the script's numbering (a missing hook keeps the gap: hook-1 and hook-3 if hook 2 was never filmed). The body as the user filmed it: `cuerpo-y-cta` when one take holds both; `cuerpo` + `cta` when split; `cuerpo-1`…`cuerpo-N` when the body comes in several takes, in speaking order; a take that finishes the body and then says the CTA is `cuerpo-final-y-cta`.
- **Topic slugs:** short, lowercase, hyphens (`book-to-skill`, `claude-startups`).
- **Takes to drop** (`"skip"` with a descriptive reason as the name): cut off mid-sentence (`cortado-a-la-mitad`), an incomplete version when a complete one of the same part exists (`cuerpo-incompleto`), empty or under a second (`duracion-0-1-segundos`), speech unrelated to any topic (`fuera-de-guion`). When two takes say the same part, keep the complete one, then the cleanest.
- **Do not drop for small things the topic session cuts anyway:** a word to the camera person before the hook ("¿listo?"), noise after the CTA, a false start at the head of a take (PREP.md handles those). Note them in the brief instead.
- **Spoken text differs from the script:** that is normal; subtitles follow what was said. Match by meaning.
- **Resource per topic:** every "comentá Aurelio" promises a resource, and the animation is built from it (user, 2026-10-29). Identify it here, not in each topic: the name in the script and in the spoken body (Whisper garbles names: "SSE" was ECC, "Bucto Skill" Book to Skill), plus any URL in the script. Confirm the exact page with a search (GitHub repo, official site); record URL and a one-line note on what it is. A topic whose resource you cannot pin down with confidence goes to the user in the L3 table, never guessed.
- **Flag for the user, do not drop:** takes whose first word starts on frame 0 (may sound clipped), a hook missing its first words, a confusing or rushed body, a slip that stays in the audio, a recording rotated wrong (`rotacion-distinta` in the scan: check one frame; an upside-down take gets turned 180° in its topic).

## L3. Show the map, then rename

One message: a table per topic (take → part, plus its resource URL), the takes dropped with their reason, the hooks or topics never filmed, and the takes worth listening to before approving, with why. Wait for the user's OK. Then `rename --dry-run`, check it, and `rename`. Names: `<topic>_<part>_IMG_<n>.MOV` and `NO-USAR_[<topic>_]<reason>_IMG_<n>.MOV` (underscore between fields, hyphen inside a field, original number kept). Renaming happens before any topic project exists, so every project starts from the final names; `undo` restores the originals.

## L4. Convert to SDR once and check the disk

iPhone takes usually come in HDR, which `prepare` refuses. Never let each topic convert its own copies: twelve topics converting at once filled the system disk on 2026-10-29. `sdr` converts every HDR take the map uses once, one at a time, into `<batch>/sdr/`, and refuses when free space is short (about twice the raw size plus 20 GB). If it refuses, ask the user whether to free space or work on another drive; never delete or move anything to make room. Final 4K renders need space too: with little margin, run topics a few at a time, not all at once.

## L5. One topic per session

Each topic produces as many videos as hooks were filmed: one project per hook, same body and CTA, animated once and identical in all of them; only the hook and what depends on it (cover headline, caption if needed) change. When the host can start separate sessions, start one per topic. Otherwise run topics one after another in this session. Each brief carries: the topic, its approved resource URL (the session sets it in config at init and does not search again), the renamed takes per part (SDR copies from `<batch>/sdr/` when converted), the hooks missing, the notes from L2 for that topic, the script text for the topic, and the rule above. Topic sessions follow every gate of Branch B with the user.

The session that ran the batch stays light afterwards: it relays decisions that apply to every topic (a short message to each session) and does not read topic transcripts unless asked. Creative approvals (cuts, cover, animation) happen in each topic's session, where the images are.
