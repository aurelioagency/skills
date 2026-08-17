# Hook Generator

An agent skill that turns a topic into written hooks — one per known hook structure — and tells you which ones actually fit that topic:

```
topic (text / image / PDF / URL / transcript) → topic read → fit evaluation → 10 written hooks, ranked by fit
```

The hook is the only part of a piece of content that decides whether the rest gets consumed. Everything else can be fixed in the edit; this can't.

Works with agent harnesses that support file-based skills (Claude Code, Codex, and similar).

> **Note — this skill runs anywhere.** It is pure text: no scripts, no rendering, no local files, no API keys. Unlike the video and carousel skills in this repo, it works fine in the claude.ai web chat, in the desktop app, and in a terminal alike. The only hard limit is input it cannot read (see Requirements).

**Works in any language, tuned for Spanish.** The skill writes the hooks in whatever language you speak to it in, headings included — it triggers on a request in any language and answers in that one. `SKILL.md` itself is written in Spanish, and its ~30 example hooks are Rioplatense: they carry the register for the Spanish case, which is the one this skill is calibrated for. For any other language they still teach each type's *mechanism*, and an explicit rule forbids translating them — the hook gets written natively in your language, at your language's length.

## What's in this folder

| Path | Purpose |
|---|---|
| [SKILL.md](SKILL.md) | The whole skill: topic ingestion, the pre-writing read, fit evaluation, the 10 hook types with mechanism and failure signals, writing rules, output format, and iteration rules |

Single file, self-contained. No `scripts/`, no `assets/`, no `references/`.

## How it works

A hook does not depend on the industry. It depends on **which psychological mechanism it activates**. The same mechanism that makes a finance hook work makes an engineering or a cooking hook work — what changes is the content, not the structure.

So the skill is built in two separate layers:

1. **The 10 structures** — universal, they apply to any topic.
2. **The user's context** (the `Contexto: Aurelio` section) — the world, vocabulary, and tone the structures get filled with.

Adapting the skill to another brand means rewriting layer 2 and leaving layer 1 untouched.

### The 10 types

Ordered by general retention power. That order is information, not instruction: the type that fits the topic beats the type that sits higher.

Named as they appear in `SKILL.md`:

| # | Type | Mechanism | Fits when the topic has… |
|---|---|---|---|
| 1 | Negativo / alerta (negative / alert) | Survival — loss is detected before opportunity | A very common badly-done version |
| 2 | Identificación (identification) | Connection — "that's me" | A known frustration rather than a technical error |
| 3 | Pregunta (question) | Internal dialogue — the reader answers mentally | A possible self-diagnosis |
| 4 | Contraintuitivo (counterintuitive) | Dissonance — "that makes no sense, explain" | An installed belief refutable with a real argument |
| 5 | Curiosidad (curiosity) | The brain hates gaps | A concrete reveal that justifies the wait |
| 6 | Problema-solución (problem-solution) | Concrete expectation — the reader knows there's a way out | A specific solution to deliver at the end |
| 7 | Visual | The image stops the scroll before the message | A strong, actually available visual contrast |
| 8 | Desafío (challenge) | Ego — staying to check whether they know | An audience that already knows you |
| 9 | Autoridad (authority) | Credibility — positions, but does not retain | Real accumulated experience behind the claim |
| 10 | Storytelling | Narrative — the highest ceiling and the highest risk | A real story with a turn |

Each type in `SKILL.md` carries its mechanism, its structure, a *worked well / went wrong* pair, warnings where the type burns credibility, and three example hooks.

## Key features

- **Always writes all 10.** Even the types that fit poorly get their best possible version, plus a line saying why they're weak — so they can be discarded on merit instead of never being seen.
- **The number of recommendations is a result, not a quota.** It can be one, four, all, or none. A personal topic that only works as *identificación* is reported as exactly that, with no two invented fillers. A neutral topic where nothing stands out is reported as that too — useful information, not a failure.
- **Fit beats the power ranking.** A well-placed *identificación* hook beats a forced *negativo*. The ranking informs the user's decision; it doesn't filter the output.
- **No industry gate.** There is no allowed-topics list and the skill never asks whether a topic qualifies. If a topic arrives, hooks get written.
- **Reads the topic before writing it.** Six questions answered internally first — pain, belief, gap, solution, scene, enemy. If none can be answered, the skill asks for context instead of padding with generic copy.
- **Format filters the types.** Reels take all 10 and the visual is the first frame; a carousel's hook is slide 1; text posts and blog/newsletter drop *visual* entirely, and in long text *curiosidad* reads as a trick while *storytelling* and *contraintuitivo* gain.
- **Writing rules that block the usual failure modes** — concrete over abstract (a hook that could be pasted onto any other content unchanged doesn't count), banned marketing jargon, hard length limits per format, no closure (the loop stays open), and no exaggeration.
- **Disciplined iteration.** On a change request it rewrites only what was named and returns the rest identical — no new types, sections, or variants that weren't asked for. "More aggressive" maps to *negativo* or *desafío*; "too salesy" maps to *identificación* or *pregunta*.
- **Two-layer design.** The brand context lives in one clearly marked section, so forking the skill for another brand is one section rewrite.

## Installation

**Option A — let your agent install it (recommended).** Open Claude Code and paste:

```text
Install the hook-generator skill from https://github.com/aurelioagency/skills :
1. Run: git clone --filter=blob:none --sparse https://github.com/aurelioagency/skills.git into a temporary folder.
2. Inside it, run: git sparse-checkout set hook-generator
3. Copy the hook-generator/ folder into ~/.claude/skills/hook-generator/
4. Delete the temporary clone and confirm the skill loads.
5. Explain how to use the skill, tell me where its files ended up on my machine,
   and ask me if we write my first hooks now.
```

There is no requirements step: this skill installs nothing and needs nothing.

**Option B — manual.** Clone the repo and run the bundled installer:

```powershell
git clone https://github.com/aurelioagency/skills.git
cd skills
node install-skills.mjs hook-generator          # Claude Code
node install-skills.mjs hook-generator --codex  # Codex
```

Any other harness: point it at this folder's `SKILL.md`.

## Updating

Improvements land in the repo; your installed copy never updates itself. To update, re-run the installer from an up-to-date clone — it replaces the installed skill cleanly and records the installed commit in `.installed-from.json`:

```powershell
git pull
node install-skills.mjs hook-generator
```

To find out whether you are behind without installing anything:

```powershell
node install-skills.mjs hook-generator --check
```

## Uninstalling

The installed skill is one file in one folder: `~/.claude/skills/hook-generator/`. Removing it touches nothing else. From a clone:

```powershell
node install-skills.mjs hook-generator --remove
```

Or simply delete `~/.claude/skills/hook-generator/` yourself.

## Requirements

- **Nothing to install.** No Node, no Python, no ffmpeg, no Playwright, no fonts.
- **No API keys and no paid providers.**
- **What the skill can't read:** audio and video cannot be transcribed in this environment. Bring the transcript or the idea as text — the skill says so plainly instead of attempting workarounds that won't work. Everything else is fair game: loose text, images and screenshots, PDF / docx / xlsx / csv from disk, URLs, and transcripts.

## Usage

Once installed, the skill is available in **every** session on the machine. It triggers by matching your request — you never have to name it, you don't have to say the word *hook*, and it works in whatever language you write in:

> Give me hooks for a reel about why agents break in production

> `<url>` — how do I open this?

> Make this grab people: `<paste the text>`

> Dame ganchos para un carrusel sobre esto: `<pdf>`

> I need this to stop the scroll

If the topic arrives very raw, the skill asks exactly one question — *what do you want the person to understand or do after seeing this* — and writes from there.

### Output

One markdown document per topic. The template ships in Spanish because that is the default case; ask in another language and the headings come back translated:

```text
# Ganchos: <topic in 4-6 words>

**Formato:** reel / carrusel / post / blog / newsletter
**Ángulo:** the pain, belief, or gap being attacked

## Encajan mejor acá                    ← "these fit best"
### <Type> — why it fits THIS topic
> hook
> variant, another angle on the same type
[...as many as genuinely fit — one, three, six, or none]

## El resto                             ← "the rest"
### <Type>
> hook
[...the remainder, up to 10]

**Nota:** only when needed — e.g. a type came out weak and why
```

When nothing stands out, the "Encajan mejor acá" section is replaced by a line saying so, and the 10 are listed flat.

### Iterating

Ask for changes in plain language and only what you named gets rewritten:

> Number 3 doesn't land, give me another

> More aggressive

> I already used the storytelling one last week

## Adapting it to another brand

The skill ships with one brand's world baked in. Install it as is and the structures get filled with Aurelio's context — AI systems, agents, and a mechanical engineer's lens on them. If that isn't your field, the hooks will be well-built and about the wrong things.

The fix is one section. Open `SKILL.md` and replace **`Contexto: Aurelio`** — it defines three things: where the content lands, the lens it is written through, and what the content is for. That section is marked in the file as the customizable layer precisely so a fork knows where to cut.

`SKILL.md` is written in Spanish. A fork can translate it wholesale, but the example hooks are the part that earns its keep — they calibrate register, not just structure. Replacing them with examples in your own language and voice is worth more than translating the prose around them.

Leave the 10 types, the writing rules, and the output format alone: they are brand-independent by design. A hook's mechanism doesn't change with the industry — only what you fill it with does.

## License

MIT — see [LICENSE](../LICENSE) at the repo root.
