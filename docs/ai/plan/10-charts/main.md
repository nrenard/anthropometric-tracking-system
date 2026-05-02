# Plan: Charts & Trends

**Source**: `docs/ai/brief/10-charts.md`
**Status**: Ready
**Created**: 2026-05-01

---

## Goal

Create a charts page at `/graficos` with a metric selector, period filter, and a Recharts `<AreaChart>`. Users can visualize any tracked metric over configurable time periods for the active profile.

## Context snapshot

- Next.js App Router, Chakra UI v3, Recharts v2.15 — same stack as all existing pages (`package.json:1-43`)
- Active profile via `useActiveProfile()` hook backed by `ProfileContext` (`src/lib/profile-context.tsx:1-89`)
- Measurements fetched from `GET /api/measurements?profileId=[id]&from=...&to=...&sort=asc` (`src/app/api/measurements/route.ts:14-49`)
- `computeAllMetrics()` in `src/lib/calculations.ts:152` computes all 10 derived metrics; each can be charted
- Dashboard weight-chart already clicks through to `/graficos` (`src/components/dashboard/weight-chart.tsx:64`)
- Bottom nav at `src/components/bottom-nav.tsx:7` has 4 items; no link to `/graficos` yet
- No prior plan for charts exists; highest plan NN is 09

## Assumptions

- **5th nav item**: Add "Gráficos" to bottom nav rather than only using dashboard click-through
- **Single chart color**: One primary theme color (blue `#3182ce`) for all metrics, not per-metric colors
- **Metric selector**: Use Chakra `<NativeSelect>` dropdown (consistent with `comparar/page.tsx`)
- **Period filter**: Chakra button chips styled with `colorPalette`
- **Auth**: Middleware already protects `/graficos` automatically (not in `PUBLIC_PATHS`, `src/middleware.ts:5`)

## Execution

> Work through the steps in order. After completing a step, mark its checkbox, commit using the suggested message, then move to the next step. Do not skip ahead unless the step explicitly says it is optional.

- [ ] **01** — Add Gráficos nav item → [`01-add-graficos-nav-item.md`](./01-add-graficos-nav-item.md)
- [ ] **02** — Charts page shell with metric selector & period filter → [`02-charts-page-shell.md`](./02-charts-page-shell.md)
- [ ] **03** — Data fetching & AreaChart rendering → [`03-chart-data-rendering.md`](./03-chart-data-rendering.md)

## Done when

- [ ] Every step above is checked off
- [ ] All acceptance criteria from the source brief pass
- [ ] Tests and lint are green (`npm test` + `npm run lint`)

## References

- `docs/ai/brief/10-charts.md` — source brief
- `spec.md:72-81` — screen #7 specification
- `src/lib/calculations.ts:139-192` — `computeAllMetrics` and `AllMetrics` type
- `src/lib/date-utils.ts:17-33` — `subDays`, `subMonths`, `subYears` helpers
- `src/components/dashboard/weight-chart.tsx:1-85` — existing chart pattern to extend
- `src/app/comparar/page.tsx:1-530` — page state-handling pattern to follow
- `src/components/bottom-nav.tsx:7-12` — NAV_ITEMS to extend
