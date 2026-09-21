# Selected-workflow setup

Use **Verify** when a recommendation depends on concrete capabilities or prices. Continue to **Specify** for a selected executable workflow, **Pilot** for an authorized test, and **Activate** for authorized recurring operation. Follow the main skill's Authority rules throughout.

## 1. Verify

Discover the actual host, connected tools, exposed actions, and working environment. Use current official documentation for material facts unavailable from the environment; [sources.md](sources.md) provides starting points. Record evidence and its date in the selected workflow, or the roadmap while it has no workflow file.

For each proposed connection, identify its business purpose, nonsecret account/resource scope, exact required operations, available operations, authentication steps, owner-only actions, costs, minimal test, and fallback. Search/read, draft creation, updating, sending/publishing, and event delivery are separate capabilities. A provider API feature does not prove its connector exposes that action.

Prefer the owner's existing tools. For a missing capability, evaluate a supported connector/plugin, direct integration, or suitable service. Check provenance and costs before recommending a new account. State currency, plan/usage assumptions, and the verification date for quoted costs. Distinguish provider-enforced permissions from prompt filters: limiting a query is not limiting credentials. Give the owner only the account/consent steps actually required, one at a time.

For recurring work, verify that the intended runner can access the inputs, required actions, output destination, authentication, and durable state in a fresh unattended run. Inspect local-machine availability and cloud write-back requirements where applicable. Interactive access in one product or session is not proof of scheduled access in another.

**Done:** every required capability is marked observed/tested, documented-but-untested, unavailable, or unknown, with evidence. Unknown or missing capabilities block their dependent execution, not a useful partial plan. An unavailable scheduler leads to a handoff marked “not created”, not a promise to run later or a silent switch of hosts.

## 2. Specify

Fill [../assets/workflow-template.md](../assets/workflow-template.md) for the selected opportunity. Keep the job's executable instructions in its single-run section; link to it rather than duplicating its rules elsewhere.

Choose manual, event-driven, or scheduled operation from the actual need. Prefer a supported event trigger for event-shaped work and a schedule for periodic work. If polling replaces an unsupported event, disclose its interval and detection delay. Prefer a native job in the chosen Codex/Claude environment; justify an external runner by a verified gap and obtain agreement to that change.

Bind an action approval to its content/version, recipient, and destination; material changes need renewed approval. Recheck time-sensitive facts before consequential actions.

Define an explicit result and review point, actual source identifiers, precedence for conflicting sources, owner-input freshness/fallback, output destination, workload/cost limits, failure notifications, and stop conditions. A job requiring fresh conversation needs a collection channel, saved approved input, an expiry rule, and behavior when input is absent. A run ends with work or a handoff; it does not wait indefinitely for an answer.

Schedule the single-run instructions, never the discovery interview. Future runs load the specified context and cannot depend on access to the current chat or the installed discovery skill.

For workflows that track items, define a stable item/version/action key and result ledger. Create `state/WF-001.md` only when a single-writer pilot can safely use it. Use a verified shared store and concurrency control for parallel runs or consequential writes; local changes in a temporary workspace are not durable write-back. Record confirmed output identifiers. Before retrying an uncertain write, reconcile the downstream result; stop for review when its outcome cannot be established.

**Done:** every runtime-critical value is concrete or the workflow is explicitly blocked. The run prompt can produce one bounded result without reopening discovery. A simple manual workflow may mark scheduling and processing state not applicable.

## 3. Pilot

Default to the least consequential useful test: read-only analysis or a draft. Use technical permission limits where available rather than treating the word “draft-only” as enforcement. The owner must have authorized the test scope; creating a draft in an external app still requires the corresponding authorization.

Test a representative case and proportionate failure cases: missing/stale input, no eligible work, unavailable access, duplicate processing, and the review boundary. A failed source check is incomplete work, not proof of “nothing new”. Include an uncertain-write case before enabling consequential retries.

Show the actual output, its supporting evidence, remaining human effort, observed problems, and the success measure. For recurring execution, also test access and persistence from a fresh run in the intended environment. Mark that verification pending until performed.

**Done:** record which tests passed, failed, or were not run. “Pilot-tested” requires an actual test result; “ready for recurring activation” additionally requires runtime-critical checks to pass. The owner can continue using a useful manual or partial solution while recurrence remains blocked.

## 4. Activate and review

Before creating or enabling a job, confirm the owner's authorization covers its actions, accounts/resources, trigger, timezone, destination, limits, and costs. Resolve critical placeholders and blockers. Apply the host's creation mechanism, then read back configuration when supported.

Record the returned job identifier, enabled/paused state, installed instruction version, trigger, destination, test evidence, and pause/disable route. Distinguish “created-paused”, “active/configured”, and “successful unattended run verified”; configuration alone proves no completed run. Without creation access, deliver the exact prompt and verified manual setup steps with status “not created”.

For scheduler fields that copy the run prompt, record its version or digest and reconcile edits before the next activation. The workflow file owns the design; the host owns actual job configuration. Any difference is drift to resolve, not permission to overwrite either silently.

Agree on a success metric and review point. Measure useful output, review/exception effort, cost, and maintenance; keep, simplify, pause, or retire accordingly. Revalidate permissions/capabilities after relevant changes. A recurring review is a separate optional job, and expanding an existing job requires authorization.

**Done:** activation is evidenced by the real host result, or a precise blocked/not-created handoff is recorded. Update the roadmap's next step and link to the workflow's operational record.
