# Review — Business AI Audit 0.1.0 → 0.2.0

Reviewed: 2026-09-21  
Inputs: the original eight-file package, the requested AIHero article, its linked writing-for-agents skill and SKILL-MECHANICS reference, and current official skill-format/installation documentation. Sources are recorded in [references/sources.md](references/sources.md).

## Result

The original package covered the requested business function. Its main weakness was instruction organization: repeated execution policy, technical setup details in the discovery path, and stage boundaries described more as aspirations than observable completion conditions. The revision retains discovery, Markdown reporting, partial solutions, app proposals, and opt-in recurring setup.

This is an editorial and structural review. It is not evidence that one model performs better with the revision; live host scenarios remain unrun.

## Changes made

| Review area | Original finding | Revision |
|---|---|---|
| Invocation scope | The description mixed trigger cases, output detail, and authorization commentary. | A narrower description names business discovery, resumption, and preparing a selected roadmap opportunity. Authority stays in the body. |
| Information hierarchy | Main sections 6–9 repeated much of the runtime reference while discovery was still in progress. | The main file retains the conversational path; setup mechanics live in a conditional reference. |
| Conditional references | The interview guide was loaded “when needed,” without a concrete diagnostic condition. | Its trigger is inability to choose a task, vague answers, or an ambiguous bottleneck. Setup has separate verification/design entry conditions. |
| Completion | A final completion check existed, but individual phases had uneven stopping rules. | Five discovery stages and four setup stages each end with a checkable done-condition and an explicit blocked/provisional route. |
| Ownership of meaning | Approval, run configuration, missing-input rules, and activation state appeared in several narrative sections and templates. | Discovery authority lives in the main file; setup procedure lives in its reference; a generated workflow owns its run instructions. The roadmap links to execution details. |
| Pruning | Mission commentary, broad taxonomies, and repeated cautionary sentences added length. | Removed or consolidated them while retaining specific safety boundaries and business requirements. |
| Positive targets | Many instructions were framed as prohibitions. | Ordinary behavior is described as a target action; explicit prohibitions remain for consequential boundaries and are paired with the safe action. |
| Compact concepts | Similar ideas were explained repeatedly. | Familiar headings—Trace, Pilot, Verify, Specify, Activate—organize the work without introducing a new jargon system for the owner. |
| Template weight | The owner-facing roadmap and execution template repeated policy and each other's specifications. | A smaller roadmap captures business decisions; a separate single-run contract holds executable detail. |
| Environment lookup | The runtime guide carried a dated mini-catalogue of host behavior. | Verification consults the actual host and current official information. Installation facts stay in the human-facing README. |
| Operational evidence | Actual configuration and a successful unattended run were distinguished in prose but less clearly in the record. | Separate fields record creation, installed prompt version, fresh-run access, and actual unattended success. |
| Regression coverage | Eighteen scenarios existed, without resource-loading and instruction-drift checks. | Twenty-nine scenarios include early-stop behavior, premature setup, irrelevant invocation, permission limits, and prompt-version drift. |

The review criteria above come from [source A](references/sources.md#a--writing-for-agents); the findings and revisions are this package's design assessment. Existing OpenAI and Claude documentation also supports concise descriptions and referenced resources; see sources C–E.

## Measured size

| Scope | Before | After |
|---|---:|---:|
| Main SKILL.md words | 2,637 | 1,007 |
| Main SKILL.md lines | 220 | 84 |
| Main plus operational guides/templates, words | 6,238 | 3,029 |

The main file has 61.8% fewer words. Operational text was reduced overall, not merely moved into references. Counts use whitespace-separated words, including frontmatter and template placeholders; they are not token counts, speed measurements, or quality scores. README, sources, review, and test documents are excluded from the operational-text comparison on both sides.

## Requirements retained

| Requested behavior | Authoritative location in the revision |
|---|---|
| Nontechnical, focused business discussion | SKILL.md — Working rules; Orient; Trace |
| Tasks and pain points grounded in the business | SKILL.md — Trace; roadmap template |
| AI value beyond simple time savings | SKILL.md — Find the smallest useful improvement |
| Full and partial solutions; remaining human work | SKILL.md — improvement criterion; roadmap columns |
| Living Markdown and continuity | SKILL.md — Workspace; roadmap “Resume here” |
| Specific relevant app connections | SKILL.md — Recommend; setup Verify; connection evidence |
| Recurring-job proposals and setup | SKILL.md — Recommend/Pilot; setup Specify/Activate |
| Owner feedback and saved context across runs | Workflow single-run instructions |
| Proposals separate from authorized real actions | SKILL.md — Authority; setup gates and evidence record |
| No dependence on the original publishing example | Business-specific evidence rules and T26 |

## Deliberate choices

**Keep natural-language discovery.** The skill remains eligible for model selection because the intended owner may not know a slash command. It still supports explicit selection. This follows the invocation tradeoff in the requested mechanics guide, rather than copying Loop Me's manual-only setting. The trigger scope excludes unrelated one-off execution. Tool grants are not declared. Test T27 checks over-triggering.

**Keep one entry-point skill.** Setup is a plain conditional reference, not a second skill the owner must learn to invoke. This avoids another always-loaded description. Reading that reference is not a fresh context boundary: it reduces what must be loaded before setup, but does not guarantee earlier/later instructions are forgotten. Completion gates, not file splitting alone, address premature progress.

**Do not cut the runtime safety contract for a size target.** A generated job runs separately from the discovery conversation, so its own instructions must carry scope, approval, source-trust, and failure behavior. These runtime-specific safeguards are intentional boundary restatement, not a second independently maintained copy of the discovery policy.

**Keep the roadmap useful before implementation is complete.** An evidence gap blocks the dependent claim or action, not delivery of all supported findings. Owners can stop, resume, choose a manual solution, or use a partial pilot.

## Validation and remaining uncertainty

Static checks examine metadata, package structure, local references/anchors, Markdown fences, stage completion markers, and the absence of unresolved template placeholders in the main instruction file. Their result is in [tests/static-validation.json](tests/static-validation.json).

The scenarios in [tests/acceptance.md](tests/acceptance.md) still require live runs in the target Codex/Claude environments. No claim is made that shortening the instructions improves reliability, that every deleted sentence was a model-proven no-op, or that an integration/scheduler is available. No accounts, external records, or recurring jobs were changed.

## Upgrade

Replace the installed `business-ai-audit/` skill directory with the new directory, keeping the same skill name. Preserve generated business roadmaps and workflow/state data in their separate business workspace. Review any locally customized skill content before replacement. The new package no longer uses `references/runtime-and-integrations.md`; its live instructions are in `references/setup.md`.
