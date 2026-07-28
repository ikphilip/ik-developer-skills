# Review Requirements — Reference

Paste the relevant sections below directly into the subagent prompt. The subagent has no access to this repo's skills, so nothing here can be referenced by path.

## Scoring Rubric (100 points, same as ik-define-requirements)

**Business Value & Goals (30 points)**
- 10 pts: Clear problem statement and business need
- 10 pts: Measurable success metrics and KPIs
- 10 pts: Expected outcomes and ROI justification

**Functional Requirements (25 points)**
- 10 pts: Complete user stories with acceptance criteria
- 10 pts: Clear feature descriptions and workflows
- 5 pts: Edge cases and error handling defined

**User Experience (20 points)**
- 8 pts: Well-defined user personas
- 7 pts: User journey and interaction flows
- 5 pts: UI/UX preferences and constraints

**Technical Constraints (15 points)**
- 5 pts: Performance requirements
- 5 pts: Security and compliance needs
- 5 pts: Integration requirements

**Scope & Priorities (10 points)**
- 5 pts: Clear MVP definition
- 3 pts: Phased delivery plan
- 2 pts: Priority rankings

**Threshold**: 90+ is the bar ik-define-requirements uses before generating a PRD. The review should state whether it independently confirms that bar.

## Internal Consistency Checklist

Beyond the rubric score, check for contradictions a completeness score alone won't catch:

- **Scope creep**: Does anything in "Functional Requirements" or "User Stories" describe behavior listed under "Out of Scope"?
- **Testability**: Does every acceptance criterion have an unambiguous pass/fail condition? Flag vague ones ("should work well", "should be intuitive").
- **Metric traceability**: Does every KPI in "Success Metrics" map to at least one functional requirement or user story that could plausibly move it?
- **Persona-to-story alignment**: Does every user story reference a persona actually defined in "User Personas"?
- **MVP-phase consistency**: Does "Phase 1: MVP" list match what "User Stories" and "Functional Requirements" treat as required? Flag anything required in one section but deferred in another.
- **Risk-mitigation follow-through**: For each row in the Risk Assessment table, is the stated mitigation actually reflected somewhere in the requirements (not just asserted)?

## Report Structure

The subagent should return (and the orchestrating skill should save to `.local-notes/requirements/{feature-name}-{version}-review.md`):

```markdown
# Independent Review: [Feature Name]

**Source PRD**: {feature-name}-{version}-prd.md
**Reviewer**: Chiman (Independent Requirements Reviewer)
**Review Date**: [YYYY-MM-DD]

## Score Comparison

| | Business Value /30 | Functional /25 | UX /20 | Technical /15 | Scope /10 | Total /100 |
|---|---|---|---|---|---|---|
| PRD's claimed score | ... | ... | ... | ... | ... | ... |
| Independent score | ... | ... | ... | ... | ... | ... |

**Verdict**: [Confirms / Disputes] the PRD's claimed readiness (90+ threshold).

## Findings

Ranked most severe first. For each:
- **Category**: scope-creep / testability / metric-traceability / persona-alignment / mvp-consistency / risk-followthrough / rubric-gap
- **Section**: which PRD section it's in
- **Issue**: one sentence
- **Why it matters**: concrete consequence if unaddressed

## Recommendation

[Approve as-is / Approve with minor fixes / Needs another iteration with ik-define-requirements]
```
