# Business AI Audit — Business Workflow Discovery Skill

An agent skill for a conversational discovery interview with a business owner or solo entrepreneur. It turns their account of real work into a living Markdown roadmap of tasks, pain points, full or partial solutions, relevant app connections, and useful recurring jobs.

```
one question at a time → trace a real occurrence → find the smallest useful fix → roadmap → (optional) pilot one workflow
```

Setup of a selected workflow is an explicit later stage, opt-in and separately authorized — never a consequence of running the interview.

Works with agent harnesses that support file-based skills (Claude Code, Codex, and similar).

## What's in this folder

| Path | Purpose |
|---|---|
| [SKILL.md](SKILL.md) | The skill itself: the five discovery stages, working rules, authority boundaries |
| [REVIEW.md](REVIEW.md) | Maintainer-only record of the writing-guide review this revision went through |
| [references/interview-guide.md](references/interview-guide.md) | Targeted follow-up questions for when the owner gives a vague answer or can't pick a task |
| [references/setup.md](references/setup.md) | The conditional Verify → Specify → Pilot → Activate path for a selected workflow |
| [references/sources.md](references/sources.md) | Sources behind the authoring and installation guidance |
| [assets/roadmap-template.md](assets/roadmap-template.md) | Template for the owner-facing `BUSINESS_AI_ROADMAP.md` |
| [assets/workflow-template.md](assets/workflow-template.md) | Template for a single selected workflow's executable design (`WF-001-<name>.md`) |
| [tests/acceptance.md](tests/acceptance.md) | Maintainer-only behavioral scenarios to run before releasing a change |
| [tests/static-validation.json](tests/static-validation.json) | Recorded static structure/link checks |

## Key features

- **One question at a time** — the question chosen is whichever answer would most change the recommendation, asked in the owner's own vocabulary, not a form to fill in.
- **Evidence over invention** — owner reports, observed evidence, hypotheses, and unknowns stay labeled as such throughout; a candidate without a real example stays a hypothesis.
- **Smallest useful fix first** — every opportunity is compared against a simpler process change or existing feature before reaching for automation or AI; "leave this manual" is a valid conclusion.
- **A living roadmap, not a one-shot report** — `BUSINESS_AI_ROADMAP.md` is created on the first concrete opportunity and updated at checkpoints; resuming a later session picks up from its recorded next step instead of starting over.
- **Discovery never acts on its own** — the interview authorizes discussion and the roadmap document, nothing else. New connections, accounts, subscriptions, sends, publishes, deletions, production changes, or recurring jobs each need their own explicit authorization, asked for one at a time.
- **Setup is opt-in and separate** — only a workflow the owner actually selects goes through Verify, Specify, Pilot, and Activate, and only as far as the request authorizes; a simple process improvement may need none of it.
- **No tool grants, no dependencies** — the package is instruction-only. It declares no executable hooks and installs nothing; it just needs a Markdown-capable agent host.

## Installation

### Option A — let your agent install it (recommended)

Open Claude Code and paste:

```text
Install the business-ai-audit skill from https://github.com/aurelioagency/skills :
1. Run: git clone --filter=blob:none --sparse https://github.com/aurelioagency/skills.git into a temporary folder.
2. Inside it, run: git sparse-checkout set business-ai-audit
3. Copy the business-ai-audit/ folder into ~/.claude/skills/business-ai-audit/
4. Delete the temporary clone and confirm the skill loads.
5. Explain how to use the skill and ask me if we start the interview now.
```

The agent fetches only this skill (not the whole collection) and installs it permanently in `~/.claude/skills/` for all future chats.

### Option B — manual

Clone the repo and run the bundled installer:

```powershell
git clone https://github.com/aurelioagency/skills.git
cd skills
node install-skills.mjs business-ai-audit          # Claude Code
node install-skills.mjs business-ai-audit --codex  # Codex
```

Any other harness: point it at this folder's `SKILL.md`.

## Updating

Improvements land in this repo; your installed copy never updates itself. To update, re-run the installer — it replaces the installed skill cleanly, records the installed commit in `.installed-from.json`, and prints the old and new commits. Open Claude Code and paste:

```text
Update my installed business-ai-audit skill from https://github.com/aurelioagency/skills :
1. If I have a clone of the repo, run git pull in it; otherwise make a temporary
   sparse clone like in the install prompt.
2. In the clone, run: node install-skills.mjs business-ai-audit
3. The installer prints the previous and new commit. Summarize what changed
   between them (git log --oneline <old>..<new> -- business-ai-audit) in my language.
4. Confirm the skill still loads. Delete the temporary clone if you made one.
```

To find out whether you are behind without installing anything, run this in an up-to-date clone:

```powershell
node install-skills.mjs business-ai-audit --check
```

It compares the commit recorded in your installed copy against the checkout, counting only commits that touch this skill (exit code 3 means an update is available). Teams working on the repo can keep a permanent clone: updating is just `git pull` + the installer command.

Updating the skill never touches your generated roadmaps: those live in your own `business-ai/<business-slug>/` workspace, completely separate from the installed skill folder.

## Uninstalling

The installed skill lives entirely in one folder: `~/.claude/skills/business-ai-audit/`. Removing it never touches roadmaps or workflow files you already generated (they live in `business-ai/<business-slug>/` in your own workspace), other installed skills, or any clone of this repo. Open Claude Code and paste:

```text
Remove the business-ai-audit skill from my machine:
1. Delete the folder ~/.claude/skills/business-ai-audit/ (all of it).
2. Confirm the skill no longer loads. Do not touch my generated roadmaps
   or workflow files under business-ai/, other installed skills, or any
   clone of the skills repo.
```

Or manually — from a clone of the repo:

```powershell
node install-skills.mjs business-ai-audit --remove
```

(which only deletes the installed copy, never the repo folder), or simply delete `~/.claude/skills/business-ai-audit/` yourself.

## Requirements

- **No API keys, no paid providers, no packages to install.** The skill is instruction-only: Markdown files read by your agent host, nothing executable.
- Any harness that supports file-based skills and can read/write local Markdown files (Claude Code, Codex, and similar).

## Usage

Once installed, the skill is available in **every** session on the machine, forever. Trigger it by describing your business or asking to continue a roadmap you already started:

> Help me find where AI or automation would make a practical difference in my business. Ask one question at a time and save a roadmap.

To resume a previous session:

> Continue from my business AI roadmap and work on the next unresolved step.

To move a selected opportunity into a real (draft-only) test:

> Test the first selected workflow in draft-only mode, within the scope we agreed. Explain any account connection I need to complete.

The interview and every generated document follow your own language — write in Spanish and it interviews and writes the roadmap in Spanish.

## License

MIT — see [LICENSE](../LICENSE) at the repo root.
