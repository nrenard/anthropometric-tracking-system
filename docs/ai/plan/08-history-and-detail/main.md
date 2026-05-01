# Plan: History List & Measurement Detail

**Source**: `docs/ai/brief/08-history-and-detail.md`
**Status**: Ready
**Created**: 2026-04-28

---

## Goal

A browseable chronological history list at `/historico` with period filters, edit/delete actions, and a drill-down detail page at `/historico/[id]` showing all raw values + computed metrics. Both pages respect the active profile.

## Context snapshot

- Next.js App Router with Chakra UI v3, no Tailwind; all client components use `"use client"` directive (`src/app/layout.tsx:17`)
- Raw `fetch()` for API calls, no axios or shared client utility (`src/hooks/use-dashboard-data.ts:69-75`)
- Toast via `toaster.create()` from `@/components/ui/toaster` (`src/app/medir/page.tsx:71`)
- Delete confirmation uses discriminated union state + fixed overlay (no Chakra modals) (`src/components/profile-switcher.tsx:120-149`)
- Active profile via `useActiveProfile()` hook backed by cookie + context (`src/hooks/use-active-profile.ts:1-12`)
- `computeAllMetrics(measurement, profile)` in `src/lib/calculations.ts:152` — pure function, run client-side
- TDD co-located tests: `page.tsx` next to `page.test.tsx` (Vitest + @testing-library/react)

## Assumptions

- **Edit reuses wizard**: Edit button navigates to `/medir?edit=<id>`. The wizard must be updated to accept this query param (Step 01). This follows the brief's stated assumption.
- **No sparkline on detail**: The detail page does not include a weight trend sparkline. Full charts live on `/graficos` (future plan).
- **Period filter uses `from`/`to` query params**: The API already supports these on `GET /api/measurements` (`src/app/api/measurements/route.ts:14`).
- **Delete from detail reloads history**: After deleting from the detail page, navigate back to `/historico` rather than staying on a 404 page.

## Execution

> Work through the steps in order. After completing a step, mark its checkbox, commit using the suggested message, then move to the next step. Do not skip ahead unless the step explicitly says it is optional.

- [ ] **01** — Wizard Edit Mode → [`01-wizard-edit-mode.md`](./01-wizard-edit-mode.md)
- [ ] **02** — History List Page → [`02-history-list-page.md`](./02-history-list-page.md)
- [ ] **03** — Delete from History → [`03-delete-from-history.md`](./03-delete-from-history.md)
- [ ] **04** — Measurement Detail Page → [`04-measurement-detail-page.md`](./04-measurement-detail-page.md)

## Done when

- [ ] Every step above is checked off
- [ ] All acceptance criteria from the source brief pass
- [ ] Tests and lint/build are green

## References

- `docs/ai/brief/08-history-and-detail.md` — source brief
- `docs/ai/brief/06-new-measurement.md` — wizard that edit mode extends
- `docs/ai/brief/02-data-models.md` — calculations module
- `spec.md:77-78` — history and detail screen specs
- `src/lib/calculations.ts` — `computeAllMetrics` and all metric functions
- `src/hooks/use-active-profile.ts` — active profile hook
- `src/app/api/measurements/route.ts` — list endpoint with `from`/`to` params
- `src/app/api/measurements/[id]/route.ts` — single measurement GET/PUT/DELETE
- `src/components/bottom-nav.tsx` — existing nav link to `/historico`
- `src/app/medir/page.tsx` — wizard page to extend for edit mode
- `src/hooks/use-measurement-wizard.ts` — wizard state machine
