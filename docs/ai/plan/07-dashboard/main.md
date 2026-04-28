# Plan: Dashboard (Home Screen)

**Source**: `docs/ai/brief/07-dashboard.md`
**Status**: Ready
**Created**: 2026-04-28

---

## Goal

Replace the placeholder home page with a functional dashboard that shows the active profile's latest measurement summary, four metric cards with deltas (vs previous & vs 30 days), and a weight trend chart — with proper empty, loading, and error states in Portuguese.

## Context snapshot

- **Tech stack**: Next.js 16 App Router, Chakra UI v3 (style props, no Tailwind), Recharts 2.15.4 (unused so far), Vitest 2.1.9 with `@testing-library/react`
- **Current page**: `src/app/page.tsx:1` — placeholder with profile-only states (loading, no-profile, profile-with-placeholder-text). Plan 03 Step 05 built these skeletons; measurement data was explicitly out of scope.
- **Active profile**: available via `useActiveProfile()` hook at `src/hooks/use-active-profile.ts:1`, backed by `ProfileProvider` at `src/lib/profile-context.tsx:1` and cookie util at `src/lib/cookies.ts:1`
- **Calculations**: pure functions in `src/lib/calculations.ts:1` — `computeAllMetrics(measurement, profile)` returns all 10 metrics (bmi, bodyFatPercent, leanMass, etc.)
- **API routes**: `GET /api/measurements?profileId=...&limit=3&sort=desc` at `src/app/api/measurements/route.ts:14`, `GET /api/profiles/[id]` at `src/app/api/profiles/[id]/route.ts:1` — both return raw Mongoose lean objects (no DTO layer for measurements)
- **Conventions**: co-located `*.test.tsx` files, `data-testid` selectors, hardcoded Portuguese strings, `"use client"` directive, Chakra `Box/Flex/Stack/Heading/Text` components, `vi.mock()` for server actions

## Assumptions

- Metric deltas use absolute difference (kg, pp, BMI points) — as stated in brief Open Questions
- Data fetches on page load only, no auto-refresh — as stated in brief Open Questions
- 30-day delta: find closest measurement within ±3 days of 30 days before current; show "—" if none
- Delta colors: green for improvement (weight/BF down), red for regression (weight/BF up), neutral for lean mass/BMI
- Profile data fetched via `GET /api/profiles/[activeId]` — raw lean object shape is fine for calculations
- Skeleton loading uses Chakra `Skeleton` / `SkeletonText` components

## Execution

> Work through the steps in order. After completing a step, mark its checkbox, commit using the suggested message, then move to the next step. Do not skip ahead unless the step explicitly says it is optional.

- [ ] **01** — Metric Cards Component → [`01-metric-cards.md`](./01-metric-cards.md)
- [ ] **02** — Weight Trend Chart → [`02-weight-chart.md`](./02-weight-chart.md)
- [ ] **03** — Latest Measurement Summary → [`03-latest-summary.md`](./03-latest-summary.md)
- [ ] **04** — Dashboard Data Hook → [`04-dashboard-data-hook.md`](./04-dashboard-data-hook.md)
- [ ] **05** — Assemble Dashboard Page → [`05-assemble-dashboard-page.md`](./05-assemble-dashboard-page.md)

## Done when

- [ ] Every step above is checked off
- [ ] All 10 acceptance criteria from the source brief pass
- [ ] Tests and lint/build are green (`npm test && npm run lint`)

## References

- `docs/ai/brief/07-dashboard.md` — source brief
- `docs/ai/brief/02-data-models.md` — calculations module spec
- `docs/ai/brief/03-multi-profile-support.md` — active profile cookie, profile scoping
- `docs/ai/brief/05-api-routes.md` — API endpoints
- `docs/ai/plan/03-multi-profile-support/05-dashboard-and-bottom-nav.md` — prior dashboard skeleton work
- `src/app/page.tsx` — current placeholder to replace
- `src/lib/calculations.ts` — metric computation functions
- `src/lib/cookies.ts` — `ACTIVE_PROFILE_ID` cookie utility
- `src/lib/profile-context.tsx` — `ProfileContext` with `useActiveProfile`
- `src/components/bottom-nav.tsx` — bottom navigation
- `src/app/api/measurements/route.ts` — measurements API
- `src/app/api/profiles/[id]/route.ts` — profile detail API
