# Review Requirements — Reference

Paste the relevant sections below directly into the subagent prompt. The subagent has no access to this repo's skills, so nothing here can be referenced by path.

## Scoring Rubric (100 points, same as ik-define-requirements)

**Business Value & Goals (20 points)**
- 10 pts: Clear problem statement and business need
- 10 pts: Expected outcomes and business impact

**Functional Requirements (30 points)**
- 12 pts: Complete user stories with acceptance criteria
- 12 pts: Clear feature descriptions and workflows
- 6 pts: Edge cases and error handling defined

**User Experience (25 points)**
- 10 pts: Well-defined user personas
- 9 pts: User journey and interaction flows
- 6 pts: UI/UX preferences and constraints

**Technical Constraints (15 points)**
- 8 pts: Security and compliance needs
- 7 pts: Integration requirements

**Scope & Priorities (10 points)**
- 10 pts: Clear MVP definition

**Threshold**: 90+ is the bar ik-define-requirements uses before generating a PRD. The review should state whether it independently confirms that bar.

## Internal Consistency Checklist

Beyond the rubric score, check for contradictions a completeness score alone won't catch:

- **Scope creep**: Does anything in "Functional Requirements" or "User Stories" describe behavior listed under "Out of Scope"?
- **Testability**: Does every acceptance criterion have an unambiguous pass/fail condition? Flag vague ones ("should work well", "should be intuitive").
- **Persona-to-story alignment**: Does every user story reference a persona actually defined in "User Personas"?
- **MVP consistency**: Does "MVP Scope" match what "User Stories" and "Functional Requirements" treat as required? Flag anything required in one section but absent from MVP scope, or vice versa.
- **Risk-mitigation follow-through**: For each row in the Risk Assessment table, is the stated mitigation actually reflected somewhere in the requirements (not just asserted)?

## Report Structure

The subagent should return (and the orchestrating skill should save to `.local-notes/requirements/{feature-name}-{version}-review.md`):

```markdown
# Independent Review: [Feature Name]

**Source PRD**: {feature-name}-{version}-prd.md
**Reviewer**: Chiman (Independent Requirements Reviewer)
**Review Date**: [YYYY-MM-DD]

## Score Comparison

| | Business Value /20 | Functional /30 | UX /25 | Technical /15 | Scope /10 | Total /100 |
|---|---|---|---|---|---|---|
| PRD's claimed score | ... | ... | ... | ... | ... | ... |
| Independent score | ... | ... | ... | ... | ... | ... |

**Verdict**: [Confirms / Disputes] the PRD's claimed readiness (90+ threshold).

## Findings

Ranked most severe first. For each:
- **Category**: scope-creep / testability / persona-alignment / mvp-consistency / risk-followthrough / rubric-gap
- **Section**: which PRD section it's in
- **Issue**: one sentence
- **Why it matters**: concrete consequence if unaddressed

## Recommendation

[Approve as-is / Approve with minor fixes / Needs another iteration with ik-define-requirements]
```
