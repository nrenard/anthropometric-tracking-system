# Plan: Compare Measurements

**Source**: `docs/ai/brief/09-compare.md`
**Status**: Ready
**Created**: 2026-04-28

---

## Goal

A `/comparar` page where users pick any two measurements from the active profile's history, see a side-by-side comparison table grouping all raw fields and computed metrics, with absolute + percentage deltas color-coded by improvement direction.

## Context snapshot

- Next.js App Router + Chakra UI v3, client components use `"use client"` (`src/app/layout.tsx:17`)
- `useActiveProfile()` from `@/hooks/use-active-profile` returns `{ activeProfileId, activeProfile }` (`src/hooks/use-active-profile.ts:6`)
- `activeProfile` (type `ProfileDTO`) has `id`, `name`, `dateOfBirth` (ISO string), `sex`, `defaultHeight` — needed for `ProfileInput` in `computeAllMetrics` (`src/lib/calculations.ts:152`)
- `computeAllMetrics(measurement: MeasurementInput, profile: ProfileInput): AllMetrics` — pure, client-side (`src/lib/calculations.ts:152-191`)
- Raw `fetch()` for API calls, no shared utility; toast via `toaster.create()` from `@/components/ui/toaster`
- Measurements API: `GET /api/measurements?profileId=...&sort=desc` returns full measurement docs with all fields (`src/app/api/measurements/route.ts`)
- TDD pattern: co-located `page.test.tsx` next to `page.tsx` (Vitest + @testing-library/react), test setup in `src/app/historico/page.test.tsx:1-188`
- Bottom nav has 4 items (Início, Medir, Histórico, Perfis) — Compare not in bottom nav (`src/components/bottom-nav.tsx:7-12`)
- History page already converts profile/measurements to compute metrics (`src/app/historico/page.tsx:112-159`)

## Assumptions

- **Picker uses Chakra NativeSelect**: Dropdown approach (not modal picker) since measurement history per user is unlikely to be unwieldy. Options show date + weight.
- **Fetch list once**: The `GET /api/measurements?profileId=...` response includes all fields needed for computation (skinfolds, perimeters, diameters). No need to fetch each selected measurement individually.
- **Profile from context, not API**: Use `activeProfile` (ProfileDTO) from context rather than a separate `GET /api/profiles/[id]` call — it's already loaded and kept in sync.
- **No "Comparar" link in bottom nav**: Confirm the brief's assumption — accessible only from history toolbar and detail page footer.
- **Color heuristic follows brief**: Green = weight/BF/waist down or leanMass/muscleMass/BMR up; red = opposite. Metrics with ambiguous direction (boneMass, bodyDensity) use no color.

## Execution

> Work through the steps in order. After completing a step, mark its checkbox, commit using the suggested message, then move to the next step. Do not skip ahead unless the step explicitly says it is optional.

- [ ] **01** — Compare Page → [`01-compare-page.md`](./01-compare-page.md)
- [ ] **02** — Navigation Entry Points → [`02-navigation-entry-points.md`](./02-navigation-entry-points.md)

## Done when

- [ ] Every step above is checked off
- [ ] All acceptance criteria from the source brief pass
- [ ] Tests and lint/build are green

## References

- `docs/ai/brief/09-compare.md` — source brief
- `src/lib/calculations.ts` — `computeAllMetrics`, `MeasurementInput`, `ProfileInput`, `AllMetrics`
- `src/hooks/use-active-profile.ts` — active profile hook
- `src/app/historico/page.tsx` — history list (where "Comparar" button goes)
- `src/app/historico/[id]/page.tsx` — measurement detail (where compare link goes)
- `src/components/bottom-nav.tsx` — bottom nav (NOT modified)
- `src/app/api/measurements/route.ts` — list endpoint
- `src/app/actions/profile-actions.ts` — `ProfileDTO` type
- `src/lib/date-utils.ts` — `formatDateTime`
