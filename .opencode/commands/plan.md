---
description: Turn a brief (or raw problem statement) into an executable step-by-step plan in docs/ai/plan/
agent: plan
---

# /plan

Convert a brief or raw problem statement into an executable plan at `docs/ai/plan/<kebab-title>/`. The plan is composed of a `main.md` orchestrator plus numbered step files. Another agent (or a future `/execute-plan` command) should be able to work through `main.md` top-to-bottom, checking off steps as they are completed.

## Input

The user's input: **$ARGUMENTS**

Resolve `$ARGUMENTS` in this order:

1. If empty, ask the user what to plan. Do not proceed until they respond. If they say "just use the latest brief", pick the most recently modified file in `docs/ai/brief/`.
2. If it matches an existing file under `docs/ai/brief/` (exact path, filename, kebab-title, or kebab-title prefixed with `NN-`), load that brief as the source of truth. When matching by kebab-title alone, accept a file whose name is `NN-<kebab-title>.md`.
3. If it looks like a kebab-title that does not exist as a brief, ask whether to run `/brief` first or treat the argument as a raw problem statement.
4. Otherwise treat the full string as a raw problem statement and plan directly from it (note this in the plan's References).

State which path you took in one sentence before moving on.

## Workflow

Follow these phases in order. Do not skip phases.

### 1. Load source material

- Read the brief in full if one was resolved. Extract **Problem**, **Proposal**, **Acceptance Criteria**, **Out of scope**, **Risks**, and **Open Questions**.
- If no brief exists, synthesize the same sections mentally from the raw input so the plan has an anchor.

### 2. Explore the codebase

Use the Task tool with the `explore` subagent (thoroughness: `medium`) to gather what is needed to sequence the work. Focus on:

- Existing modules, services, or tests the plan will touch or extend
- Project conventions: file layout, naming, test framework, lint/format scripts
- Package manager and runtime (check `package.json`, lockfiles, `tsconfig.json`, etc.)
- Prior plans in `docs/ai/plan/` that may overlap (read their `main.md` if present)

Summarize findings in 3-6 bullets with `path:line` citations before moving on.

### 3. Ask clarifying questions (only if needed)

Only ask about gaps that block sequencing or tech choices. Typical gaps:

- Library or framework choice when the brief leaves it open
- Target file locations when the codebase gives no clear convention
- Test framework / runner when multiple are plausible
- Environment variables, secrets handling, or config location
- Any **Open Questions** from the brief that materially affect the plan

Batch related questions into one round. Never exceed two rounds. If the user says "just draft it", proceed with best assumptions and list them under **Assumptions** in `main.md`.

Do not re-ask questions the brief already answered.

### 4. Shape the plan

Break the work into ordered steps. Let complexity drive granularity:

- A trivial tweak may be one step. A greenfield service may be ten.
- Each step should be independently executable and verifiable (has its own acceptance check).
- Favor TDD ordering where it fits: a failing test step, then the implementation step, then refactor. Collapse into a single step when the cycle is tiny.
- Respect the repo's rules in `AGENTS.md` (TDD by default, DRY, KISS, meaningful naming, minimal comments, graceful error handling).
- Each step should map to one logical commit following the repo's commit convention (`<type>(<scope>): <description>`).

### 5. Write the plan files

Create the directory `docs/ai/plan/<NN>-<kebab-title>/`.

- `<NN>` is a zero-padded two-digit sequence number. If the source brief already carries a `NN-` prefix, **reuse that same `NN`** so the plan and brief stay aligned. Otherwise, list entries in `docs/ai/plan/` matching `^\d{2}-.+$`, take the highest `NN`, and use `NN+1` (start at `01` if none). Entries without a numeric prefix are ignored for this count.
- `<kebab-title>` is derived from the brief's title or the core subject of the raw input (lowercase, hyphen-separated, no date, no prefix).
- If the target directory already exists, append `-v2`, `-v3`, etc.

Write `main.md` first, then one file per step named `NN-<kebab-step-title>.md` (zero-padded, starting at `01`).

#### `main.md` template

```markdown
# Plan: <Human-readable title>

**Source**: <relative path to brief, or "raw input" if no brief>
**Status**: Ready
**Created**: <YYYY-MM-DD>

---

## Goal

<1-3 sentences restating the outcome in plan terms. What will be true when all steps are done?>

## Context snapshot

<3-6 bullets summarizing exploration findings and key decisions. Cite files as `path:line`.>

## Assumptions

- <Each assumption made because a question was skipped or the user said "just draft it">

## Execution

> Work through the steps in order. After completing a step, mark its checkbox, commit using the suggested message, then move to the next step. Do not skip ahead unless the step explicitly says it is optional.

- [ ] **01** — <step title> → [`01-<kebab-step-title>.md`](./01-<kebab-step-title>.md)
- [ ] **02** — <step title> → [`02-<kebab-step-title>.md`](./02-<kebab-step-title>.md)
- [ ] **03** — <step title> → [`03-<kebab-step-title>.md`](./03-<kebab-step-title>.md)

## Done when

- [ ] Every step above is checked off
- [ ] All acceptance criteria from the source brief pass
- [ ] Tests and lint/build are green

## References

- <brief path, related plan paths, key source files>
```

#### Step file template (`NN-<kebab-step-title>.md`)

```markdown
# Step NN — <Step title>

**Plan**: [`main.md`](./main.md)
**Depends on**: <previous step number(s), or "none">

## Objective

<1-2 sentences. What this step produces. No fluff.>

## Context

<Only what the executing agent needs that isn't in main.md: specific files to touch, patterns to follow, gotchas. Cite `path:line` where useful.>

## Approach

1. <Ordered, concrete action>
2. <Next action>
3. <...>

> If this step follows TDD: step 1 is "write failing test", step 2 is "confirm it fails", step 3 is "minimal impl", step 4 is "confirm green", step 5 is "refactor".

## Acceptance

- [ ] <Observable, testable outcome>
- [ ] <Another one>

## Verification

<Exact commands to run (tests, lint, build). Example: `npm test -- path/to/file.spec.ts`>

## Commit

```
<type>(<scope>): <imperative description under 72 chars>
```

## Notes

<Optional: trade-offs, follow-ups, links. Omit section if empty.>
```

### 6. Confirm

After writing all files, output:

1. The absolute path to the plan directory
2. A bullet list of every file created (main.md + each step)
3. A one-sentence summary of the execution path
4. Any **Open Questions** from the brief that the plan could not resolve

Then run `code docs/ai/plan/<NN>-<kebab-title>/main.md` via Bash to open the orchestrator (matches the user's personal rule for new `.md` files).

## Rules

- Do not write code changes during `/plan`. This command only produces `.md` files.
- Do not invent requirements the brief never stated. If a gap is material, ask. If it is not, note it under **Assumptions**.
- Keep step files tight. No filler. Bullets over paragraphs.
- Each step must be independently verifiable. If you cannot write a concrete **Verification** command, the step is too vague — split or clarify it.
- Never merge unrelated concerns into one step. One logical commit per step.
- If exploration reveals the work is already done, say so and ask whether to continue.
- If the source brief is missing or contradicts itself, pause and ask the user how to proceed rather than guessing.
