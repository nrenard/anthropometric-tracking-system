# Step 01 — Compare Page

**Plan**: [`main.md`](./main.md)
**Depends on**: none

## Objective

Create `/comparar` page with two measurement pickers, a grouped comparison table showing absolute + percentage deltas, and full state coverage (no profile, <2 measurements, only one selected). Achieve TDD green.

## Context

- New page: `src/app/comparar/page.tsx` + `src/app/comparar/page.test.tsx`
- Follow patterns from `src/app/historico/page.tsx`: `"use client"`, `useActiveProfile()`, `useEffect` + `fetch`, `pb={32}` for bottom nav, `BottomNav` component at bottom
- Use `activeProfile` from context (type `ProfileDTO`) directly — no separate profile fetch
- Fetch measurement list via `GET /api/measurements?profileId=${activeProfileId}&sort=desc` — returns full docs with skinfolds/perimeters/diameters
- Convert `ProfileDTO` → `ProfileInput` and measurement response → `MeasurementInput` using same patterns as `src/app/historico/page.tsx:112-159`
- `computeAllMetrics` requires complete `MeasurementInput` (skinfolds + perimeters + diameters + height). If a measurement lacks any field, compute what's possible and mark computed metrics as `null` where inputs are missing.
- Chakra UI: `NativeSelect` for pickers, `Table` for comparison, `Stack`/`Box`/`Flex`/`Heading` for layout
- Color tokens from Chakra: `fg.success` for green, `fg.error` for red

### Interface types (page-local, match API response shape)

Use the same `HistoryMeasurement` interface from `src/app/historico/page.tsx:42-69` and `HistoryProfile` from `:31-40`.

### Picker component

Each picker is a `NativeSelect`:
- Options: all measurements sorted by date desc
- Display: `formatDateTime(measuredAt)` + ` — weight.toFixed(1) kg`
- Default: picker A = latest, picker B = second latest (auto-selected if ≥2 measurements exist)
- Selection changes trigger recomparison

### Comparison table

Grouped `<Table>` with sections matching the brief:
1. **Básico**: weight (kg), height (cm)
2. **Dobras Cutâneas**: chest, midaxillary, triceps, subscapular, abdominal, suprailiac, thigh (all mm)
3. **Perímetros**: waist, hip, arm (L/R), forearm (L/R), thigh (L/R), calf (L/R) (all cm)
4. **Diâmetros**: humerus, femur (cm)
5. **Métricas Calculadas**: IMC (bmi), Densidade Corporal (bodyDensity), % Gordura (bodyFatPercent), Massa Gorda (fatMass), Massa Magra (leanMass), Massa Óssea (boneMass), Massa Muscular (muscleMass), RCQ (waistToHip), RCE (waistToHeight), TMB (bmr)

Each table row:
- **Campo** column: metric label in Portuguese
- **Medição A**: value for measurement A, formatted
- **Medição B**: value for measurement B, formatted
- **Δ Absoluto**: `B - A`, formatted
- **Δ %**: `((B - A) / A) * 100`, formatted as percentage (show "—" if A is 0 or missing)

### Delta calculation

```typescript
function absDelta(a: number, b: number): number {
  return b - a
}

function pctDelta(a: number, b: number): number | null {
  if (a === 0) return null
  return ((b - a) / a) * 100
}
```

If either A or B value is missing (undefined/null), both deltas show "—".

### Color coding

Apply to **Δ Absoluto** and **Δ %** cells only:

```typescript
type DeltaDirection = "improve" | "worsen" | "neutral"

function getDirection(field: string, delta: number): DeltaDirection {
  // Lower is better: weight, skinfolds, perimeters, bodyFatPercent, fatMass, WHR, WHtR
  // Higher is better: leanMass, boneMass, muscleMass, BMR
  // Neutral: height, bmi, bodyDensity
  
  const lowerBetter = new Set([
    "weight", "bmi", "bodyFatPercent", "fatMass", "waistToHip", "waistToHeight",
    "chest", "midaxillary", "triceps", "subscapular", "abdominal", "suprailiac", "thigh",
    "waist", "hip",
  ])
  const higherBetter = new Set(["leanMass", "boneMass", "muscleMass", "bmr"])
  
  if (lowerBetter.has(field) && delta < 0) return "improve"
  if (higherBetter.has(field) && delta > 0) return "improve"
  if (lowerBetter.has(field) && delta > 0) return "worsen"
  if (higherBetter.has(field) && delta < 0) return "worsen"
  return "neutral"
}
```

Green (`fg.success` / `colorPalette="green"`) for improve, red (`fg.error` / `colorPalette="red"`) for worsen.

### State matrix

| State | Condition | Render |
|-------|-----------|--------|
| No profile | `!activeProfileId` | "Selecione um perfil para comparar medições" + link to /configuracoes |
| Loading | `activeProfileId` but no data yet | Skeleton placeholders |
| <2 measurements | measurements.length < 2 | "Registre pelo menos duas medições para comparar" + CTA to /medir |
| One picked | only one measurement selected | Disabled table, prompt to select second |
| Ready | two selected | Full comparison table |
| Error | fetch fails | Error message + retry button |

## Approach

1. **Write failing test suite** in `src/app/comparar/page.test.tsx` covering all states above plus:
   - Auto-select defaults to latest two
   - Changing picker updates table
   - Absolute delta renders correctly
   - Percentage delta renders correctly
   - Delta "—" for missing values
   - Green color for improvement direction
   - Red color for worsening direction
   - Computed metrics present in the table
   - Portuguese labels throughout

2. **Confirm tests fail** — `npx vitest run src/app/comparar/page.test.tsx`

3. **Implement the page** in `src/app/comparar/page.tsx`:
   - Data fetching (profile from context, measurements from API)
   - Picker logic (default auto-select, onChange handlers)
   - Comparison table with grouped sections
   - Delta calculation + color coding
   - All empty/incomplete/error states

4. **Confirm tests pass** — `npx vitest run src/app/comparar/page.test.tsx`

5. **Refactor** — extract helper functions if needed, ensure DRY with existing patterns

## Acceptance

- [ ] Two pickers allow selecting any measurement from active profile
- [ ] Default: latest two auto-selected when ≥2 measurements exist
- [ ] "No profile" state renders correctly with link
- [ ] "<2 measurements" state renders with CTA to /medir
- [ ] Single-selection state shows disabled table + prompt
- [ ] Comparison table covers all 5 grouped sections with Portuguese labels
- [ ] Each row shows Medição A, Medição B, Δ Absoluto, Δ %
- [ ] Missing values show "—" in all affected columns
- [ ] Color coding (green/red) on delta cells for directional improvement/worsening
- [ ] No console errors or warnings during normal operation

## Verification

```bash
npx vitest run src/app/comparar/page.test.tsx
npx eslint src/app/comparar/
npx next build --webpack 2>&1 | grep -i error || echo "Build OK"
```

## Commit

```
feat(compare): add compare page with pickers, deltas, and color coding
```

## Notes

- The `AllMetrics` and raw measurement interfaces are already defined in `calculations.ts`. Reuse, don't redefine.
- Metrics requiring `computeAllMetrics` need full measurement inputs (skinfolds + perimeters + diameters + height). If a measurement lacks any of these, show "—" for all computed metrics rather than partial computation.
- Follow the same `ProfileInput` / `MeasurementInput` conversion helpers from history page (`toProfileInput`, `toMeasurementInput`).
