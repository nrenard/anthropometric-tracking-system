# Dashboard (Home Screen)

**Type**: Feature
**Status**: Draft
**Created**: 2026-04-27

---

## Problem

The home page is a placeholder (`src/app/page.tsx` shows only a heading + bottom nav). It needs to be a proper dashboard showing the latest measurement summary, key metric cards with deltas, and a primary trend chart.

## Context

- Spec screen #2: Dashboard / Home — latest measurement summary, metric cards with delta vs previous and vs 30 days, primary chart (`spec.md:75`)
- Bottom nav has "Início" link pointing to `/` (already wired up)
- Recharts is installed, ready for use
- Must fetch measurements scoped to active profile (`GET /api/measurements?profileId=...`)
- Active profile info fetched from `GET /api/profiles/[activeId]` for name, demographics, and metric calculations
- Calculation functions from `docs/ai/brief/02-data-models.md` are pure client-callable functions
- Portuguese UI

## Proposal

Create the dashboard at `src/app/page.tsx` (replace current placeholder).

### Data Fetching

- Read `ACTIVE_PROFILE_ID` from cookie to get the active profile
- If no active profile: dashboard shows empty state "Nenhum perfil selecionado" with CTA to create or select a profile
- If active profile exists:
  - Fetch profile from `/api/profiles/[activeId]` for name, age, sex, defaultHeight
  - Fetch latest 3 measurements from `/api/measurements?profileId=[activeId]` (current, previous, ~30-days-ago reference)
- Loading state: skeleton cards while fetching
- Empty measurements state: if profile exists but no measurements, show CTA card "Registre sua primeira medição" with link to `/medir`

### Metric Cards

Display a grid of cards (2-column on mobile, 4-column on desktop):

| Card | Value | Delta vs Previous | Delta vs 30 Days |
|---|---|---|---|
| Peso (Weight) | xx.x kg | ±x.x kg | ±x.x kg |
| % Gordura (Body Fat %) | xx.x% | ±x.x pp | ±x.x pp |
| Massa Magra (Lean Mass) | xx.x kg | ±x.x kg | ±x.x kg |
| IMC (BMI) | xx.x | ±x.x | ±x.x |

- Delta indicators: green arrow down for weight/BF (improvement), colored based on direction
- If no previous or 30-day measurement, show "—" for delta

### Primary Chart

- Weight trend line chart (Recharts `<LineChart>` or `<AreaChart>`)
- Shows all measurements, X-axis = date, Y-axis = weight
- Clicking the chart navigates to `/graficos` (full charts page)
- Responsive: full width, fixed height

### Latest Measurement Summary

- Latest Measurement Summary


- Card showing date, weight, body fat %, and notes excerpt, with profile name heading (e.g., "Olá, João")
- Link to full detail: "Ver detalhes" → `/historico/[id]`

### Out of scope

- Customizable metric cards (user choosing which 4 metrics to show) — v2+
- Multiple chart types on dashboard (just weight trend in v1)
- Dashboard widgets beyond metric cards + weight chart

## Acceptance Criteria

- [ ] Dashboard shows "no profile" state when no active profile exists
- [ ] Dashboard shows profile name heading when active profile exists
- [ ] Dashboard shows latest measurement metric cards with computed values (scoped to active profile)
- [ ] Metric cards display deltas: absolute difference from previous measurement and from ~30 days ago
- [ ] Weight trend chart renders all measurement data points with dates (scoped to active profile)
- [ ] Clicking chart navigates to `/graficos`
- [ ] Empty measurements state shows CTA when profile exists but no measurements
- [ ] Loading state shows skeleton placeholders during fetch
- [ ] All text in Portuguese
- [ ] Responsive: cards stack on mobile, grid on desktop

## Risks & Trade-offs

- **Client-side calculation drift**: metrics are computed client-side using `src/lib/calculations.ts`. If the calculation module changes but the client has a stale cached version, displayed values may differ from what a fresh compute would show. Mitigation: calculations are pure functions, deployed with the app code — no drift possible.
- **30-day delta edge case**: if there's no measurement exactly 30 days ago, use the closest measurement within ±3 days. If none, show no delta.

## Open Questions

- Should metric card deltas use absolute or relative (% change) format? (Assumption: absolute — kg for weight/mass, percentage points for BF%, BMI points for BMI. This matches common fitness tracking UX.)
- Should the dashboard auto-refresh or require manual pull-to-refresh? (Assumption: fetch on page load only — no real-time needs for single-user app.)

## References

- `spec.md:75` — dashboard specification
- `spec.md:62-70` — list of calculations displayed as metrics
- `docs/ai/brief/02-data-models.md` — calculations module
- `docs/ai/brief/03-multi-profile-support.md` — active profile cookie, profile scoping
- `docs/ai/brief/05-api-routes.md` — API endpoints for data fetching
- `src/app/page.tsx:1` — current placeholder page to replace
- `src/components/bottom-nav.tsx:1` — nav with "Início" link
