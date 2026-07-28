# Review Task Breakdown — Reference

Paste the relevant sections below directly into the subagent prompt if dispatching one manually. When auto-triggered from `ik-plan-tasks`, the subagent loads this skill directly and has access to this file.

## Verification Checklist

- **Doc/JSON sync**: tasks.md and tasks.json contain the same task IDs, titles, order, depends_on, requirements, and acceptance criteria — no drift between them.
- **Architecture traceability (forward)**: every task's architecture reference points to a component that actually exists in the source architecture doc.
- **Architecture traceability (backward)**: every New Component in the architecture doc is covered by at least one task.
- **Scope discipline**: no task exists without a traceable architecture reason.
- **Acyclic graph**: the `depends_on` graph has no cycles. If one is found, name the tasks involved and the edge that closes the loop.
- **Valid topological order**: no task's `order` places it before a task it depends on.
- **Blocker classification**: `requirements` entries are genuinely external (credentials, third-party deliverables, design assets) — not a task-to-task dependency mislabeled as external.
- **Task independence**: each task can be completed and verified without silently depending on unstated context from another task not captured in `depends_on`.
- **Acceptance criteria quality**: criteria are concrete and checkable, not a restatement of the description.
- **Granularity**: no two tasks are so entangled they should be one task; no task is broad enough it should be split.

## Report Structure

The subagent should return (and the orchestrating skill should save to `.local-notes/tasks/{feature-name}-{version}-review.md`):

```markdown
# Independent Review: [Feature Name] Task Breakdown

**Source Tasks**: {feature-name}-{version}-tasks.md / .json
**Source Architecture**: {feature-name}-{version}-architecture.md
**Reviewer**: Eiffel (Independent Task Plan Reviewer)
**Review Date**: [YYYY-MM-DD]

## Doc/JSON Sync Check

[Any drift found, or "in sync"]

## Traceability

**Architecture components without a covering task**: [list, or "none"]
**Tasks without a traced architecture component**: [list, or "none"]

## Dependency Graph Check

**Cycles found**: [list task IDs and the closing edge, or "none"]
**Order validity**: [valid, or list the tasks placed before a dependency]
**Misclassified requirements**: [entries in `requirements` that are actually task-to-task dependencies, or "none"]

## Findings

Ranked most severe first. For each:
- **Category**: sync-drift / broken-citation / traceability-gap / dependency-cycle / ordering-error / misclassified-blocker / granularity-issue / weak-acceptance-criteria
- **Task(s)**: which task ID(s) it's about
- **Issue**: one sentence
- **Why it matters**: concrete consequence if unaddressed (e.g., "an execution agent would start T4 before T2's migration lands")

## Verdict

[Approve as-is / Approve with minor fixes / Needs another iteration with ik-plan-tasks]
```
