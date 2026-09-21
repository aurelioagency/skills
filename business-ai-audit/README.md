# Business AI Audit

Version: 0.2.0 · Reviewed: 2026-09-21

A conversational skill for business owners and solo entrepreneurs. It produces a living Markdown roadmap of tasks, pain points, full or partial solutions, relevant app connections, and useful recurring jobs. Setup is an optional next stage, not a consequence of installing the skill.

## Install or replace the earlier version

Keep the `business-ai-audit/` directory together. Replace the earlier installed skill folder rather than adding a second copy. Keep the owner's generated `business-ai/` workspace untouched.

**Codex local:** place the folder at `~/.agents/skills/business-ai-audit/`, or a project's `.agents/skills/business-ai-audit/`. On Windows, the home directory is normally `%USERPROFILE%`. Use the host's skill picker; CLI/IDE users can mention `$business-ai-audit`. See [source C](references/sources.md#c--openai-skill-authoring-and-installation).

**Claude Code:** use `~/.claude/skills/business-ai-audit/` or the project's `.claude/skills/business-ai-audit/`, then invoke `/business-ai-audit`. See [source D](references/sources.md#d--claude-code-skills).

**Claude app / Cowork:** upload the ZIP as a custom skill and enable it in **Customize > Skills**. A local Claude Code skill folder alone does not install it into Cowork. See [sources D](references/sources.md#d--claude-code-skills) and [E](references/sources.md#e--claude-custom-skills).

Available UI, account settings, and permissions can differ; consult those current official sources when installation differs from these instructions.

## Start

After selecting the skill:

> Help me find where AI or automation would make a practical difference in my business. Ask one question at a time and save a roadmap.

To resume:

> Continue from my business AI roadmap and work on the next unresolved step.

To enter a pilot:

> Test the first selected workflow in draft-only mode, within the scope we agreed. Explain any account connection I need to complete.

The discussion and generated business documents follow the owner's language.

## For maintainers

Read [REVIEW.md](REVIEW.md) for the changes against the requested writing guide. Use [tests/acceptance.md](tests/acceptance.md) to check actual conversations and tool effects before releasing to customers. Author-review material is not loaded during normal discovery.

The main skill owns discovery and authority rules; the conditional setup reference owns technical rollout; templates define output fields. Each generated workflow owns its runnable design, and the roadmap links to it.

The skill remains discoverable from natural-language requests. It declares no tool grants, executable hooks, or runtime dependencies. Actual activation remains explicitly authorized.

**Validation:** static structure/link checks are recorded in [tests/static-validation.json](tests/static-validation.json). Live Codex/Claude behavior and unattended app integrations were not tested by this revision. The package is instruction-only; it does not itself provide connectors or a scheduler.
