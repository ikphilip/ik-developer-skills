# Review Architecture — Reference

Paste the relevant sections below directly into the subagent prompt if dispatching one manually. When auto-triggered from `ik-design-architecture`, the subagent loads this skill directly and has access to this file.

## Verification Checklist

- **Citation accuracy**: file path exists; the described pattern/function/component is actually present at that path and does what's claimed.
- **Requirement coverage**: every PRD user story / functional requirement maps to at least one architecture component in the traceability table.
- **Scope discipline**: every architecture component maps back to a PRD requirement — flag components that exist for no traceable reason.
- **Out-of-scope consistency**: the architecture's "Out of Scope" doesn't contradict the PRD's "Out of Scope" or anything in the traceability table.
- **Dependency justification**: every new dependency listed has a stated reason nothing already in the codebase covers it.
- **Data storage concreteness**: schema/migration changes are specific enough to implement directly, not just described in the abstract.
- **Task-breakdown readiness**: components are concrete (real file paths, not just names or vague descriptions) — a task-breakdown agent shouldn't need to re-derive design decisions.

## Report Structure

The subagent should return (and the orchestrating skill should save to `.local-notes/architecture/{feature-name}-{version}-review.md`):

```markdown
# Independent Review: [Feature Name] Architecture

**Source Architecture**: {feature-name}-{version}-architecture.md
**Source PRD**: {feature-name}-{version}-prd.md
**Reviewer**: Stella (Independent Architecture Reviewer)
**Review Date**: [YYYY-MM-DD]

## Citation Verification

| Claim | File Path | Verified? | Notes |
|---|---|---|---|

## Traceability

**Requirements without an architecture component**: [list, or "none"]
**Components without a traced requirement**: [list, or "none"]

## Findings

Ranked most severe first. For each:
- **Category**: broken-citation / pattern-mismatch / traceability-gap / scope-creep / dependency-unjustified / readiness-blocker
- **Section**: which architecture section it's in
- **Issue**: one sentence
- **Why it matters**: concrete consequence if unaddressed

## Verdict

[Approve as-is / Approve with minor fixes / Needs another iteration with ik-design-architecture]
```
