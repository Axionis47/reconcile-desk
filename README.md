# Reconcile Desk

A compact, synthetic payment-reconciliation application to serve as a computer-use automation target. It implements three adjacent workflows, interruptions, operator review, and observable outcomes. It does **not** implement the assignment's discovery agent, reusable automation artifact, or replay engine.

## Run and validate

Requires Node 22.13 or newer. Install with `npm ci`, then `npm run dev`. Run `npm run build` for the production build, `npx tsc --noEmit` for type checking, and `node --experimental-strip-types --test tests/model.test.mjs` for domain tests. Run `node scripts/count-lines.mjs` to verify the source budget.

The app uses memory within one browser page. Reloading resets the batch. Export session evidence before reloading if you want to keep the record. Hosted access is private to the owner; operator roles inside the sandbox are simulated, not authenticated identities.

## Three workflows

1. **Trace payment:** search a name, entry ID, or reference across both ledgers; inspect the supporting note and related entries. Selection is disabled here. This is an inquiry workflow, with no reconciliation side effect.
2. **Reconcile:** select one or more records from each ledger, verify totals and references, and reconcile the group. Reconciled records cannot be reused. Undo restores their availability without rewriting the source entries.
3. **Exceptions:** request review of a selection; automation pauses; the operator takes control, corrects the selection, and records a decision. Approved selections are checked again on resume. Reconciliation remains a separate explicit action. Declined reviews finish without fabricating a match.

Scenario lab adds controlled delays, an expired-session simulation, an unfamiliar interruption, a framed processor notice, alternate amounts, and batch reset. It is test administration, not a fourth business workflow.

## Acceptance cases

| Case | Procedure | Expected outcome |
| --- | --- | --- |
| Exact match | Reconcile L-101 with P-201 | One group for $1,250; neither entry reusable |
| Grouped payment | Reconcile L-102 and L-103 with P-202 | One group for $1,200 |
| Ambiguity | Select L-104 and P-204; try to reconcile | Refused despite equal amounts |
| Human correction | Request review, take control, deselect P-204 and select P-203, add reason, approve, resume, reconcile | Correct pair reconciled; intervention and checkpoint recorded |
| No authorized route | Select L-105 and P-205 | Shortage blocks matching and approval; operator can decline |
| Missing record | Search Olive; inspect L-106 | No processor counterpart; leave unmatched |
| Wrong workflow | Start a trace goal, navigate to Reconcile | Goal remains unmet until returning to Trace; future harness must detect the detour |
| Interruption | Select entries, trigger expired session in Scenario lab, restore | Same selection and ownership preserved; no automatic match |
| Change of input | Load alternate amounts, repeat Harbor grouping | Group for $2,400 using the same rule |
| Layout variation | Reverse row order, narrow window, enable embedded notice | Resolve records by identity and frame context, not row position |
| Undo | Undo a completed group | Original entries available; approval for that group revoked |

The twelve automated tests cover domain invariants and handoff transitions. The production build and TypeScript checks validate compilation. Browser interaction and visual QA have not been performed. The processor ledger is now a task-critical, same-origin iframe with nested layout tables, plain cell headings, repeated Select/Open buttons, and no dedicated test IDs or row-ID attributes. Every reconciliation requires selecting a processor entry there. Search, sorting, matched states, operator ownership and read-only tracing propagate into the frame. The optional notice remains separate. This is not a claim of cross-origin or native automation coverage.

## Keep the evaluation honest

Give the agent natural-language goals and a normal browser session. Do not let it call the reducer, read application source, use fixture controls, or inspect in-memory state as a shortcut. No application-level WebMCP tools are exposed because this app is specifically a UI-only evaluation target. Native Sites access/auth infrastructure is separate from the business workflow.

Separate development examples from held-out cases. This batch is small and known: passing it is evidence for these cases, not proof of generalization. Alternate amounts and row ordering test a limited kind of reuse. Before evaluating the agent, add independently designed held-out records and task wording, then freeze them; test against a second unrelated application if claiming engine generality. Do not hard-code the listed IDs into reusable automation logic.

The app does not infer that an agent is stuck. The future harness must maintain the goal and allowed actions, detect repeated no-progress observations or failed checkpoints, stop on bounded retries/timeouts, and transfer the same browser session to the operator. A declined business request is a terminal outcome, not an endless retry condition.

## Deliberate boundaries

All financial data is fictional. There are no payments, external integrations, credentials, durable database, tenant isolation, or real role enforcement. An automated browser can click the operator controls unless the external harness prevents it: the application state machine protects action order, but is not a security boundary.

For production tenancy, derive tenant and operator identity on the server; scope sessions, artifacts, records and evidence to that tenant; enforce authorization server-side; isolate browser profiles and secrets per run. For native-app extension, keep workflow steps and checkpoints independent of the browser adapter, then implement observation and action adapters for OS accessibility and screenshots. Those are future agent design requirements, not functionality delivered by this small target app.

Review evidence records the corrected selection and the operator reason. It does not automatically rewrite a future automation artifact. The future engine should capture intervention observations, propose a new artifact version separately, and validate it before reuse. Only supported, verified checkpoints may resume; there is no global optimal-path guarantee.

## Legacy surface version

Processor selection now happens only inside the Legacy settlement terminal iframe. The automation must enter the correct frame, identify a row by visible payment identity and reference, then use its repeated Select or Open control. Numeric position is unreliable after reversing the row order. The internal ledger remains semantic, giving the agent a mixed modern/legacy workflow.

Plain buttons retain keyboard activation and focus indicators; difficulty comes from frame context and weak table semantics, not invisible controls. The iframe uses the same app state and reconciliation checks as the main workspace, including disabled selections during handoff. It is a same-origin document rendered through a React portal, with scripts inside the frame disabled. The agent must still interact through the UI; the portal is implementation plumbing, not an automation API.

Acceptance walkthrough: select L-102 and L-103 in the main ledger; enter the settlement frame; locate Harbor / P-202 and Select it; confirm both totals in the parent; reconcile. Repeat after reversing row order. For handoff, select L-104 and P-204, request review, take control, change the framed selection to P-203, approve, resume, and reconcile. No processor Select button should be enabled during waiting or ready states, or in Trace payment.
