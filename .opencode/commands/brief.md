---
description: Iteratively gather context and produce a feature/issue brief in docs/ai/brief/
agent: plan
---

# /brief

Turn a raw feature idea or issue report into a well-structured brief saved to `docs/ai/brief/<kebab-title>.md`.

## Input

The user's input: **$ARGUMENTS**

If `$ARGUMENTS` is empty, ask the user to describe the feature or issue before doing anything else.

## Workflow

Follow these phases in order. Do not skip phases.

### 1. Classify

Decide whether the input describes a **feature** (new capability) or an **issue** (bug, defect, regression). State the classification in one sentence before moving on.

### 2. Explore the codebase

Use the Task tool with the `explore` subagent (thoroughness: `medium`) to research anything in the repo that is relevant to the input. At minimum, try to find:

- Existing code, modules, or components that overlap with the request
- Related tests, fixtures, or docs
- Prior briefs in `docs/ai/brief/` that may relate (read them if they exist)
- For issues: the suspected source files and recent changes to them

Summarize findings in 3-6 bullets before moving on. Cite files using `path:line` format.

### 3. Ask clarifying questions

Ask the user targeted questions to fill gaps. Ask only what you cannot infer from the input + exploration. Typical gaps:

- **Feature**: target user, trigger, success criteria, in/out of scope, constraints, dependencies
- **Issue**: reproduction steps, expected vs actual, environment, severity, first-seen

Batch related questions into one round. Do not ask more than two rounds total. If the user says "just draft it", proceed with best assumptions and list them under **Open Questions**.

### 4. Draft the brief

Write the brief to `docs/ai/brief/<NN>-<kebab-title>.md` using the Write tool.

- `<NN>` is a zero-padded two-digit sequence number. To pick it, list existing entries in `docs/ai/brief/` matching `^\d{2}-.+\.md$`, take the highest `NN`, and use `NN+1`. If no such entries exist, start at `01`. Files without a numeric prefix (e.g. `order.md`) are ignored for this count.
- `<kebab-title>` is derived from the core subject of the input (lowercase, hyphen-separated, no date, no prefix).
- If `<NN>-<kebab-title>.md` already exists, append `-v2`, `-v3`, etc. before `.md` (e.g. `05-transaction-engine-v2.md`).

Use this exact template:

```markdown
# <Human-readable title>

**Type**: Feature | Issue
**Status**: Draft
**Created**: <YYYY-MM-DD>

---

## Problem

<1-3 sentences. What hurts? Who feels it? Why now?>

## Context

<Relevant background: existing code, prior decisions, related briefs, constraints discovered during exploration. Cite files as `path:line` where useful.>

## Proposal

<The approach. For features: what we will build and how it behaves. For issues: the fix direction or root-cause hypothesis. Keep it implementation-light — this is a brief, not a spec.>

### Out of scope

- <Explicit non-goals>

## Acceptance Criteria

- [ ] <Observable, testable outcome>
- [ ] <Another one>
- [ ] <Edge cases handled>

## Risks & Trade-offs

- **<Risk name>**: <impact and mitigation>

## Open Questions

- <Unresolved question, with current assumption if proceeding>

## References

- <file paths, links, related briefs>
```

### 5. Confirm

After writing, output:

1. The absolute path to the new brief
2. A 2-3 bullet summary of what it contains
3. Any **Open Questions** that still need the user's answer

Then run `code <filepath>` via Bash to open the file (matches the user's personal rule for new `.md` files).

## Rules

- Do not invent requirements the user never stated. Put uncertainties under **Open Questions**.
- Keep the brief tight. No filler. Favor bullets over paragraphs.
- Never write code changes during `/brief` — this command only produces the `.md`.
- If exploration reveals the feature already exists or the bug is already fixed, say so and ask whether to continue.
