# Plan: New Measurement Wizard

**Source**: `docs/ai/brief/06-new-measurement.md`
**Status**: Ready
**Created**: 2026-04-27

---

## Goal

A mobile-first, multi-step wizard at `/medir` that lets users record body measurements. Weight is the only required field. The wizard walks through 5 steps (basic info → skinfolds → perimeters → diameters → review) with validation, then POSTs to the existing `/api/measurements` endpoint.

## Context snapshot

- `/medir` page does not exist yet but nav link is wired (`src/components/bottom-nav.tsx:9`)
- Project uses plain controlled inputs + `useState` — no react-hook-form (`src/app/login/page.tsx:12-15`)
- `ProfileSwitcher` already uses a discriminated union state machine pattern suitable for wizard steps (`src/components/profile-switcher.tsx:12-17`)
- Active profile accessible via `useActiveProfile().activeProfileId` and `activeProfile?.defaultHeight` (`src/hooks/use-active-profile.ts:6`)
- Toast pattern: `toaster.create({ title, type: "error"|"success" })` (`src/app/login/page.tsx:40-43`)
- `POST /api/measurements` exists, validates with `measurementCreateSchema`, requires auth + profile ownership (`src/app/api/measurements/route.ts:15-75`)
- **Current model/schemas contradict the brief**: `measurementSchema`, `measurementCreateSchema`, and the Mongoose model all require `height`, `skinfolds`, `perimeters`, and `diameters`. The brief states only `weight` is required (`src/lib/validation.ts:43-67`, `src/models/measurement.ts:47-59`)

## Assumptions

- After save, redirect to `/historico` with a success toast (resolves Open Question from brief)
- No reference images for measurement sites in v1 (resolves Open Question from brief)
- Chakra UI v3 `Steps` component API is available and follows the pattern `<Steps.Root>`, `<Steps.Item>`, `<Steps.Trigger>`, `<Steps.Indicator>`, `<Steps.Title>`, `<Steps.Separator>`, `<Steps.CompletedContent>` — agent should verify against installed version
- `inputMode="decimal"` is passed as a plain HTML attribute on Chakra `Input` (works as passthrough prop)
- Height pre-fill comes from `activeProfile?.defaultHeight` if available, otherwise blank
- `measuredAt` defaults to today; the Zod `measurementCreateSchema` already handles this with `z.coerce.date().default(() => new Date())`

## Execution

> Work through the steps in order. After completing a step, mark its checkbox, commit using the suggested message, then move to the next step. Do not skip ahead unless the step explicitly says it is optional.

- [x] **01** — Relax measurement model & validation to allow partial measurements → [`01-relax-model-for-partial-measurements.md`](./01-relax-model-for-partial-measurements.md)
- [x] **02** — Create useMeasurementWizard hook → [`02-create-wizard-hook.md`](./02-create-wizard-hook.md)
- [x] **03** — Create Medir page with step navigation → [`03-create-medir-page-shell.md`](./03-create-medir-page-shell.md)
- [x] **04** — Implement input step forms (Básico, Skinfolds, Perimeters, Diameters) → [`04-implement-input-step-forms.md`](./04-implement-input-step-forms.md)
- [x] **05** — Implement review step & save → [`05-implement-review-and-save.md`](./05-implement-review-and-save.md)
- [x] **06** — Empty states & polish → [`06-empty-states-and-polish.md`](./06-empty-states-and-polish.md)

## Done when

- [x] Every step above is checked off
- [x] All acceptance criteria from the source brief pass
- [x] Tests and lint/build are green
- [x] `npm test` passes all wizard-related tests
- [x] `npm run build` succeeds

## References

- `docs/ai/brief/06-new-measurement.md` — source brief
- `docs/ai/brief/02-data-models.md` — data model definitions
- `docs/ai/brief/03-multi-profile-support.md` — active profile cookie
- `docs/ai/brief/05-api-routes.md` — API endpoints
- `spec.md:39-56` — measurement fields and protocols
- `spec.md:76` — new measurement screen spec
- `src/lib/validation.ts:43-67` — Zod measurement schemas
- `src/models/measurement.ts:47-59` — Mongoose measurement schema
- `src/hooks/use-active-profile.ts:6` — active profile hook
- `src/components/bottom-nav.tsx:9` — nav link to `/medir`
- `src/app/api/measurements/route.ts:15-75` — POST /api/measurements handler
