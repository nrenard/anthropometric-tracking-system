# Step 01 — Metric Cards Component

**Plan**: [`main.md`](./main.md)
**Depends on**: none

## Objective

Create a `<MetricCards>` component that displays weight, body fat %, lean mass, and BMI — each with current value and two deltas (vs previous measurement, vs ~30 days ago).

## Context

- Calculations: `computeAllMetrics` from `src/lib/calculations.ts:152` returns `AllMetrics` (bmi, bodyFatPercent, fatMass, leanMass, etc.)
- `MeasurementInput` and `ProfileInput` interfaces at `src/lib/calculations.ts:104-137` define the shapes expected by calculation functions
- Cards layout: 2 columns mobile, 4 columns desktop. Use Chakra `SimpleGrid` with `columns={{ base: 2, md: 4 }}`
- Each card: metric name in Portuguese, value with unit, delta row for "vs Anterior" and "vs 30 dias"
- Delta direction colors: green (`green.500`) for improvement, red (`red.500`) for regression, `fg.muted` for neutral/zero
  - Weight ↓ = improvement (green), ↑ = regression (red)
  - BF% ↓ = improvement (green), ↑ = regression (red)
  - Lean mass ↓ = regression (red), ↑ = improvement (green)
  - BMI ↓ = improvement (green), ↑ = regression (red)
- Delta format: `±X.X kg`, `±X.X pp`, `±X.X` (BMI). Show "—" when no delta data
- New component directory: `src/components/dashboard/`
- No Tailwind; use Chakra style props only

## Approach

1. Write failing test at `src/components/dashboard/metric-cards.test.tsx` — render with sample profile + 3 measurements, assert 4 cards with correct labels, values, and deltas. Also test empty state (no measurements → "—" deltas) and partial data (current only, no previous/30day).
2. Confirm test fails.
3. Create `src/components/dashboard/metric-cards.tsx`:
   - Props: `{ profile: ProfileInput; measurements: MeasurementInput[] }`
   - Sort measurements by date descending
   - Compute `current` metrics from latest measurement
   - Compute `previous` metrics if ≥2 measurements
   - Find 30-day reference (closest to `current.measuredAt - 30 days`, within ±3 days)
   - Compute `thirtyDay` metrics if reference found
   - Render `SimpleGrid` with 4 `<MetricCard>` sub-components
4. Confirm tests pass.
5. Refactor — extract `<MetricCard>` internal component, extract `findThirtyDayReference` helper.

## Acceptance

- [ ] Renders 4 cards: "Peso", "% Gordura", "Massa Magra", "IMC"
- [ ] Each card shows current computed value with correct unit
- [ ] Delta "vs Anterior" shows absolute difference when previous exists, "—" otherwise
- [ ] Delta "vs 30 dias" shows absolute difference when reference exists, "—" otherwise
- [ ] Green arrows for improvements, red for regressions
- [ ] Empty state when `measurements` array is empty (all deltas "—")
- [ ] Responsive: 2 columns on mobile, 4 on desktop

## Verification

```
npm test -- src/components/dashboard/metric-cards.test.tsx
```

## Commit

```
feat(dashboard): add MetricCards component with delta calculations
```

## Notes

- The `findThirtyDayReference` algorithm: iterate measurements, compute `abs(days between measuredAt and current.measuredAt - 30 days)`, pick the one with smallest difference ≤ 3 days.
- Calculation functions are pure and synchronous — no async needed in this component.
