# Fable 5 Protocol

This folder contains two separate artifacts for the same working standard.

## Files

- `SKILL.md`: Codex skill version. Use this when the protocol should be invoked by an agent as part of a skill workflow.
- `fable5-project-EN.md`: Anthropic project-instructions version. Use this when you want to paste the protocol into a Claude project, system prompt, API wrapper, or reusable assistant configuration.

Keep them separate because they have different jobs. The skill is optimized for invocation and execution inside a skill system. The project file is optimized to be pasted directly into Anthropic project instructions or API-level configuration.

## Intended Use

Use the protocol to get more disciplined output from cheaper Anthropic models before paying for stronger models. It does not make Haiku or Sonnet equal to a larger model, but it gives them a clear process: frame the task, draft carefully, verify, prune, and escalate only when justified.

## Maintenance Rule

When changing the protocol, update both files intentionally. They should stay aligned in behavior, but they do not need identical wording because they serve different runtimes.
