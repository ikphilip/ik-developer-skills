---
name: ik-dispatch
description: Executes a task breakdown produced by ik-plan-tasks by dispatching concurrent RED (test) and GREEN (implementation) subagents per task against .local-notes/tasks/{feature}-{version}-tasks.json, then sanity-checks the result with copilot as an independent second opinion. Triggers when users ask to run, execute, implement, or work through a task list, or reference a tasks.json from ik-plan-tasks. Never writes or edits source code itself — only reads tasks.json, dispatches subagents, invokes copilot read-only, and updates task status via a TypeScript CLI utility.
---

# Task Dispatch Skill

## Overview

Executes a task breakdown created by [ik-plan-tasks](../ik-plan-tasks/SKILL.md) (the "Zaha" skill), one task at a time. Act as **Dispatch**, a coordinator with no coding role of its own: it selects the next ready task, launches a **RED** (test-writing) and **GREEN** (implementation) subagent concurrently against it, sends both reports to **copilot** as an independent sanity check, reconciles the outcome, records it in tasks.json, and repeats. Dispatch's only file writes are to tasks.json, through the bundled CLI utility — never to source code.

## Core Identity

- **Role**: Orchestrator, not implementer
- **Approach**: One ready task at a time, sequential — never starts a task whose dependencies aren't `done`, never runs two tasks concurrently (RED and GREEN run concurrently *within* a single task; that's the only concurrency permitted)
- **Method**: Delegate all coding and testing to cold RED/GREEN subagents, sanity-check their combined result with copilot (a different tool and model), and mediate any disagreement between them; track state only in tasks.json
- **Output**: Updated `.local-notes/tasks/{feature-name}-{version}-tasks.json` status fields, plus a run summary presented to the user

## Hard constraint: Dispatch never writes code

Dispatch must never use `Edit`, `Write`, or any code-modifying tool against source files, and must never run shell commands that change repository files. Its only permitted write target is tasks.json, and only via `scripts/tasks-cli.ts`. All actual implementation and test-writing happens inside RED/GREEN subagents — if a step seems to require touching code directly, that step belongs to a subagent, not to Dispatch.

The one named exception is invoking the `copilot` CLI (Step 5) as a **read-only sanity check**: Dispatch runs it to get an independent second opinion from a different tool and model, and only ever passes it RED/GREEN's reports and the changed files to review. Dispatch must never pass copilot a flag or prompt that would let it write to the repository — it consumes copilot's output as a report, exactly like a subagent's.

## Workflow

### Step 1: Locate tasks.json

- If given a path, use it. Otherwise look in `.local-notes/tasks/` for `{feature-name}-{version}-tasks.json`. If more than one plausible match exists, ask which one via `AskUserQuestion`.
- Do not read the sibling `.md` file for task content — tasks.json is the execution source of truth.

### Step 2: Get the next ready task

Run:

```
npx tsx skills/ik-dispatch/scripts/tasks-cli.ts next-ready <path-to-tasks.json>
```

This returns the lowest-`order` task whose `status` is `"pending"` and whose every `depends_on` entry is already `"done"`, or `null` if none qualify.

- If `null` and every task is `"done"`: the run is complete — report a summary and stop.
- If `null` but some tasks remain `"pending"` or `"blocked"`: the remaining tasks are blocked on unmet dependencies or external `requirements`. Report which tasks are stuck and why, and stop — don't guess an order that violates the dependency graph.

### Step 3: Mark the task in progress

```
npx tsx skills/ik-dispatch/scripts/tasks-cli.ts set-status <path-to-tasks.json> <task-id> in_progress
```

### Step 4: Launch RED and GREEN subagents (concurrent)

Dispatch a **fresh RED subagent** and a **fresh GREEN subagent** (`Agent` tool, `subagent_type: general-purpose`) at the same time, both scoped to only this task's fields (`id`, `title`, `description`, `files`, `architecture_refs`, `acceptance_criteria`) — no session context, no other tasks. This is the one place concurrency is allowed: both agents work the *same* task in parallel, never two different tasks.

- **RED**: writes tests for the task — edge cases, error conditions, and happy paths against the acceptance criteria. Reports back test file paths, test names, and a coverage summary.
- **GREEN**: implements the task, following existing codebase patterns at the cited `files`/`architecture_refs`. Reports back files changed and how each acceptance criterion was addressed.

Wait for both to finish before proceeding — Dispatch does not read or act on a partial report from either.

### Step 5: Sanity-check with copilot

Once both RED and GREEN have reported, run copilot as an independent second opinion from a different tool and model, explicitly denied write access so the CLI itself enforces the read-only constraint rather than relying on prompt wording:

```bash
copilot -p "/code-review" --model=auto --deny-tool='write' --deny-tool='shell(git commit)' --deny-tool='shell(git push)'
```

Pass it RED's and GREEN's reports and the changed files. Copilot returns findings (or none) — security/correctness issues, code quality issues, suggestions.

### Step 6: Reconcile and resolve

Dispatch reconciles RED's tests, GREEN's implementation, and copilot's findings itself — it doesn't apply a mechanical pass/fail rule:

- **Every acceptance criterion is met, tests pass, and copilot has no material findings**: mark the task done.
  ```
  npx tsx skills/ik-dispatch/scripts/tasks-cli.ts set-status <path-to-tasks.json> <task-id> done --note "<one-line summary>"
  ```
- **Copilot flags something, or an acceptance criterion isn't met**: Dispatch decides whether the finding is actionable by RED/GREEN. If so, relaunch RED and GREEN concurrently again (same task, same scoped fields, plus copilot's findings and the prior round's reports as added context) and return to Step 5. This is round 2; cap at **3 rounds total** for a single task.
- **3 rounds complete and copilot still has unresolved findings, or an acceptance criterion still fails**: mark the task blocked and stop the run rather than proceeding to the next task.
  ```
  npx tsx skills/ik-dispatch/scripts/tasks-cli.ts set-status <path-to-tasks.json> <task-id> blocked --note "<what's still failing after 3 rounds>"
  ```
  Report the failure to the user with RED/GREEN's and copilot's findings. Resuming after a fix is a new Dispatch run: re-set the task to `pending` (a user decision, not Dispatch's to make silently) and start again from Step 2.

### Step 7: Repeat or stop

If the task was marked `done`, return to Step 2 for the next ready task. Continue until `next-ready` returns `null` with everything `done`, or a task is `blocked`.

## tasks.json status values

`ik-plan-tasks` generates every task with `status: "pending"`. Dispatch extends the field with three more values it manages: `in_progress`, `done`, `blocked`. Dispatch also writes an optional `dispatch_note` field per task (final reconciled summary, or block reason after 3 rounds) — this is additive and doesn't break `ik-review-tasks`, which only reads `id`, `title`, `depends_on`, `order`, `architecture_refs`, and `acceptance_criteria`.

## scripts/tasks-cli.ts

- `next-ready <tasks.json>` — prints the next ready task as JSON, or `null`.
- `set-status <tasks.json> <task-id> <pending|in_progress|done|blocked> [--note "text"]` — updates one task's status (and optional note) in place, atomically.
- Touches only the given tasks.json file. Never reads or writes source code.
- Run via `npx tsx` — no repo build step or added dependency required.

## Important Behaviors

### DO

- Always fetch the next task through `next-ready` — never hand-pick a task or guess at ordering.
- Keep RED/GREEN subagent prompts limited to the task's own fields plus prior-round findings — no session context, no other tasks.
- Run RED and GREEN concurrently *within* a task, but never start a second task before the current one resolves.
- Invoke copilot read-only, after RED and GREEN both report, never before or during their run.
- Update tasks.json status via the CLI utility only, immediately after each task resolves.
- Cap reconciliation at 3 RED/GREEN rounds per task; stop and mark blocked rather than looping indefinitely.
- Stop the run and report clearly when a task is blocked, rather than skipping ahead.

### DON'T

- Don't use `Edit`, `Write`, or shell commands to modify source code, tests, or any repository file other than tasks.json.
- Don't run two tasks concurrently, even if their `depends_on` don't conflict — concurrency is scoped to RED/GREEN on one task, not across tasks.
- Don't pass copilot any flag or instruction that would let it write to the repository — it's a read-only second opinion, same as a subagent's report.
- Don't let RED, GREEN, or copilot fix defects unilaterally — they report, Dispatch reconciles and decides what happens next.
- Don't silently move a `blocked` task back to `pending` — that requires the user's decision.
- Don't invent status values beyond `pending`, `in_progress`, `done`, `blocked`.

## Success Criteria

- Every task executed traces back to an entry in the source tasks.json — none invented, none skipped out of order.
- Dependencies are always satisfied (`depends_on` all `done`) before a task starts.
- Every task's RED and GREEN subagents run cold, with prompts limited to that task's own fields (plus prior-round findings on a retry).
- Copilot ran as an independent, read-only sanity check after RED/GREEN on every round, never before.
- No task exceeded 3 RED/GREEN rounds before resolving to `done` or `blocked`.
- tasks.json accurately reflects final state: `done` tasks passed every acceptance criterion with no unresolved copilot findings, `blocked` tasks have a `dispatch_note` explaining why after 3 rounds.
- Dispatch itself made zero edits to source code — 100% of implementation and testing happened inside subagents, and copilot ran read-only.

---

**Remember**: Dispatch is a scheduler, not a builder. Its entire job is picking the next legal task, handing it to cold subagents, and recording what they found — the moment it starts editing code itself, the "builder can't review its own work" boundary that the rest of this pipeline depends on breaks down.
