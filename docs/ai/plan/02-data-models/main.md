# Plan: Data Models & Calculations

**Source**: `docs/ai/brief/02-data-models.md`
**Status**: Ready
**Created**: 2026-04-27

---

## Goal

Create Mongoose schemas for `Profile` and `Measurement` collections with single-document enforcement on profiles, plus pure calculation functions for all body composition metrics defined in `spec.md:56-70`. All derived values computed on read, never persisted.

## Context snapshot

- MongoDB connection singleton at `src/lib/mongodb.ts:1` — models will register against this
- Zod validation pattern at `src/lib/env.ts:1` — use `z.object()` + `safeParse()` + aggregate errors
- `src/models/` directory does not exist yet — will be created
- Mongoose 8.23.1 (types ship with package, no `@types/mongoose` needed)
- Vitest 2.1.9 with jsdom + `@testing-library/jest-dom` already configured; `@/` alias works in tests
- `strictPropertyInitialization` on — use `field!: Type` for Mongoose schema class fields
- Prior plan `01-project-scaffold` complete — all deps installed, app boots

## Assumptions

- `defaultHeight` from Profile auto-populates measurement form as convenience — confirmed. This is a UI-layer concern and does not affect model schemas or calculations
- Mongoose schemas define types via `InferSchemaType`; Zod schemas (created in step 04) are separate runtime validators for API boundaries
- Test DB for model tests uses the same connection singleton; models register against the same `mongoose` instance via `dbConnect()`

## Execution

> Work through the steps in order. After completing a step, mark its checkbox, commit using the suggested message, then move to the next step. Do not skip ahead unless the step explicitly says it is optional.

- [ ] **01** — Profile model with single-document enforcement → [`01-profile-model.md`](./01-profile-model.md)
- [ ] **02** — Measurement model with subdocument schemas → [`02-measurement-model.md`](./02-measurement-model.md)
- [ ] **03** — Calculation functions → [`03-calculation-functions.md`](./03-calculation-functions.md)
- [ ] **04** — Zod validation schemas → [`04-zod-validation.md`](./04-zod-validation.md)

## Done when

- [ ] Every step above is checked off
- [ ] All acceptance criteria from the source brief pass
- [ ] Tests and lint are green

## References

- `docs/ai/brief/02-data-models.md` — source brief
- `docs/ai/brief/01-project-scaffold.md` — prior completed brief
- `spec.md:44-46` — skinfold protocol (J&P 7-site)
- `spec.md:56-70` — full list of calculations
- `spec.md:90-121` — data model definitions
- `src/lib/mongodb.ts` — existing DB connection
- `src/lib/env.ts` — Zod pattern to follow
- `vitest.config.ts` — test configuration
