# Model routing and token measurement

Motion Reel supports **Codex and Claude Code** as complete execution hosts. The routes below share the same pipeline, creative requirements and quality checks. Claude-specific configuration is not an installation or usage restriction for Codex.

## Codex

Use the models and native tools available in Codex. Codex chooses its own model, reasoning effort, delegation and organization for the job; no specific Codex model, fixed subagent structure or equivalent of Sonnet/Opus is required. Planning, animation code, script execution and creative review can all be handled directly in Codex. Use delegation only when available and appropriate under the host's instructions.

Suggested starting points, when available in the current host:

| Task | Model | Reasoning effort |
|---|---|---|
| Creative direction, composition, semantic timing, planning and animation code | GPT-6.2 Sol (`gpt-6.2-sol`) | High |
| Pipeline commands, routine code fixes and delivery preparation | GPT-6.2 Sol (`gpt-6.2-sol`) | Medium |
| Optional review of rendered frames: legibility, composition and safe zones | GPT-6.1 Terra (`gpt-6.1-terra`) | Medium |

These are starting recommendations, not mandatory model switches or separate subagents. Codex can use Sol for the whole job and decide whether a Terra review adds value. Respect the session's model selection, supported routing and the user's budget; if a suggested model is unavailable, choose from the available models. A skill cannot select a model through a tool the host does not provide. Rendering, encoding and transcription remain local script work and do not need a separate model for each stage.

The `model: claude-sonnet-5-5` and `effort: medium` frontmatter belong to the Claude Code route. They do not select a Codex model, require Claude access or prevent Codex from loading and using this skill. Instructions naming Opus/Sonnet or the Claude Agent tool describe Claude's execution strategy; Codex performs the same responsibilities with its own strategy.

Run the same `scripts/pipeline.py` commands and keep the same plans, project state, approvals, rendered evidence and final checks. Use Codex's supported process/session controls and wait for long-running commands to complete. The Claude Code `/codex:rescue` plugin is not needed when already running in Codex; `docs/codex-handoff.md` remains a normal project handoff file when useful.

## Claude Code — existing model routing

`model: claude-sonnet-5-5` and `effort: medium` run the session's mechanical work; the creative work goes to one Opus subagent at high effort (user 2026-10-31). If unavailable, report it instead of silently claiming Opus ran. Other hosts may ignore these fields.

The model override lasts for the invoking turn. On later turns, invoke `/motion-reel` again or use the session's model/effort controls; a skill cannot promise permanent model selection. See the official [skill frontmatter reference](https://code.claude.com/docs/en/skills#frontmatter-reference) and [subagent model configuration](https://code.claude.com/docs/en/sub-agents#choose-a-model).

| Task | Executor |
|---|---|
| Running scripts, transcript correction, handoff file, delivery | Session: Sonnet 5.5, medium |
| Direction, layout, semantic timing, original animation code | Opus 5.5 subagent, high, reads only docs/codex-handoff.md |
| Creative motion/composition review | Opus; optional independent critic |
| Cut execution, color, mix, render, captions, cover layout, packaging | Local scripts through pipeline.py |
| Speech recognition | Local faster-whisper; no Claude tokens |
| File classification by rules, timestamps, dimensions, calculations | Code |
| Bounded code fault needing reasoning | Optional Sonnet subagent, medium |

Claude Code supports subagents with separate model/effort. Use its supported Agent interface or project `.claude/agents` definitions; verify available fields and model IDs in the actual runtime. This skill does not install persistent agent definitions or invoke a paid model API. Haiku is only worth considering for a small semantic task that code cannot perform reliably.

Delegate an exact question with scoped inputs and expected output. Do not copy the whole conversation, reference library or logs. Request findings/evidence. Resume the same specialist for related corrections when supported. No recursive agent tree for routine production: every agent consumes tokens; parallelism mainly saves elapsed time.

## Token measurement

`scripts/usage-report.py` parses Claude JSONL exports; it is not a Codex usage parser or a prerequisite for producing a film in Codex. For Codex, use the host's own usage reporting when available.

Measure equivalent runs with `scripts/usage-report.py --before <JSONL-or-folder> --after <JSONL-or-folder>`. Each explicit path must contain only the comparable run and its subagent logs. The report deduplicates assistant message IDs and separates normal input, cache writes/reads and output. Missing usage is not zero. Totals are not dollars: pricing, model routing, caching and subscription accounting differ. Refactoring is an up-front investment; savings start on later productions/revisions.
