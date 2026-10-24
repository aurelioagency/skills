# Model routing and token measurement

This skill targets Claude Code. `model: claude-opus-5-5` and `effort: high` request the user's creative model for the invocation, not permanent account settings. If unavailable, report it instead of silently claiming Opus ran. Other hosts may ignore these fields.

The model override lasts for the invoking turn. On later turns, invoke `/motion-reel` again or use the session's model/effort controls; a skill cannot promise permanent model selection. See the official [skill frontmatter reference](https://code.claude.com/docs/en/skills#frontmatter-reference) and [subagent model configuration](https://code.claude.com/docs/en/sub-agents#choose-a-model).

| Task | Executor |
|---|---|
| Direction, layout, semantic timing, original animation code | Opus 5.5, high |
| Creative motion/composition review | Opus; optional independent critic |
| Cut execution, color, mix, render, captions, cover layout, packaging | Local scripts through pipeline.py |
| Speech recognition | Local faster-whisper; no Claude tokens |
| File classification by rules, timestamps, dimensions, calculations | Code |
| Bounded code fault needing reasoning | Optional Sonnet subagent, medium |

Claude Code supports subagents with separate model/effort. Use its supported Agent interface or project `.claude/agents` definitions; verify available fields and model IDs in the actual runtime. This skill does not install persistent agent definitions or invoke a paid model API. Haiku is only worth considering for a small semantic task that code cannot perform reliably.

Delegate an exact question with scoped inputs and expected output. Do not copy the whole conversation, reference library or logs. Request findings/evidence. Resume the same specialist for related corrections when supported. No recursive agent tree for routine production: every agent consumes tokens; parallelism mainly saves elapsed time.

Measure equivalent runs with `scripts/usage-report.py --before <JSONL-or-folder> --after <JSONL-or-folder>`. Each explicit path must contain only the comparable run and its subagent logs. The report deduplicates assistant message IDs and separates normal input, cache writes/reads and output. Missing usage is not zero. Totals are not dollars: pricing, model routing, caching and subscription accounting differ. Refactoring is an up-front investment; savings start on later productions/revisions.
