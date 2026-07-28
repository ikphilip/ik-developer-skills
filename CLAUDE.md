# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

A set of six Claude Code Agent Skills (`skills/*/SKILL.md`) that implement an author → review → hand-off pipeline for taking a feature from a raw request to an executable task list. There is no application code, no build, no test suite, and no dependencies — the deliverable *is* the Markdown. "Changing this codebase" means editing skill instructions.

Git repo has no commits yet and no remote; `skills/` is currently untracked.

## The pipeline

Three stages. Each stage has an **author** skill and a matching **independent reviewer** skill with its own named persona. The core design principle throughout: **a builder cannot review its own work**, so every review runs in a fresh subagent that receives only file paths — never the authoring conversation.

| Stage | Author (persona) | Reviewer (persona) | Output |
|---|---|---|---|
| Requirements | `ik-define-requirements` (Mani) | `ik-review-requirements` (Chiman) | `.local-notes/requirements/{feature}-{version}-prd.md` |
| Architecture | `ik-design-architecture` (Cosmo) | `ik-review-architecture` (Stella) | `.local-notes/architecture/{feature}-{version}-architecture.md` |
| Tasks | `ik-plan-tasks` (Zaha) | `ik-review-tasks` (Eiffel) | `.local-notes/tasks/{feature}-{version}-tasks.md` + `.json` |

Reviews are always written alongside their source as `{feature}-{version}-review.md` in the same directory.

Full chain: Mani writes the PRD → auto-dispatches Chiman → if the review's **Recommendation** approves, dispatches Cosmo cold → Cosmo writes architecture → auto-dispatches Stella → if the review's **Verdict** approves, dispatches Zaha cold → Zaha writes tasks → auto-dispatches Eiffel. Each author reads its upstream document itself rather than inheriting session assumptions.

## Invariants to preserve when editing skills

These are the load-bearing rules. Breaking one silently degrades the pipeline into an agent grading its own homework.

- **Cold-context handoff.** Every author→reviewer and stage→stage dispatch uses `Agent` with `subagent_type: general-purpose`, foreground, and a prompt containing *only* file paths plus an instruction to load the target skill. Any change that leaks conversation context into these prompts defeats the whole design.
- **Reviewers never edit.** All three review skills explicitly review and report; they point findings back at the user. Don't add fix-it behavior.
- **`REFERENCE.md` must be self-contained and paste-able.** Reviewer subagents run without this repo's skill context, so rubrics and checklists in `REFERENCE.md` are pasted verbatim into subagent prompts — they can never be referenced by path.
- **The requirements rubric is duplicated on purpose.** The 100-point scoring breakdown lives in both `ik-define-requirements/SKILL.md` and `ik-review-requirements/REFERENCE.md` so the reviewer can score independently. If you change the rubric, change both.
- **Gate wording is parsed.** `ik-define-requirements` Step 6 keys off the review's "Recommendation" line; `ik-design-architecture` Step 6 keys off the "Verdict" line. Changing the phrasing in a reviewer's report template requires changing the matching author's gate check.
- **Per-stage independent versioning.** Architecture and task versions start at `1.0` and increment only when *that* document is revised — they do not track the upstream document's version.
- **Revisions carry a "Review Feedback Addressed" table.** Present only on versions ≥ the second pass, mapping each prior finding to its resolution.
- **`tasks.md` and `tasks.json` must stay byte-for-byte equivalent in content.** The JSON is what an execution agent consumes; the Markdown is what a human approves. Eiffel treats drift between them as a defect.

## Cross-skill references

Skills link to each other with relative paths (`../ik-review-requirements/SKILL.md`). Renaming or moving a skill directory requires updating these links in the sibling skills' Overview, Workflow, and DO/DON'T sections.

## Verifying a change

There's nothing to run. To validate an edit, invoke the affected skill against a scratch feature and confirm the artifacts land in the right `.local-notes/` subdirectory with the right filename pattern, and that the auto-dispatched review actually fired in a subagent.
