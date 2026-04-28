# Step 03 — Calculation functions

**Plan**: [`main.md`](./main.md)
**Depends on**: 01, 02 (types from Measurement/Profile may be used for `computeAllMetrics`)

## Objective

Create `src/lib/calculations.ts` with pure calculation functions for all body composition metrics defined in `spec.md:56-70`. Every function is pure — no DB access, no side effects, no Mongoose imports.

## Context

- File does not exist yet — create `src/lib/calculations.ts`
- All functions take primitive arguments (numbers, strings) except `computeAllMetrics` which takes full Measurement and Profile objects
- Formulas are well-documented anthropometric standards — use the constants below

### Functions & formulas

| # | Function | Formula |
|---|----------|---------|
| 1 | `bmi(weightKg, heightCm)` | `weightKg / (heightCm / 100)²` |
| 2 | `bodyDensity(sex, age, sum7Skinfolds)` | **Male**: `1.112 - 0.00043499 × sum7 + 0.00000055 × sum7² - 0.00028826 × age`<br>**Female**: `1.097 - 0.00046971 × sum7 + 0.00000056 × sum7² - 0.00012828 × age` |
| 3 | `bodyFatPercent(bodyDensity)` | `(495 / bodyDensity) - 450` (Siri equation) |
| 4 | `fatMass(weightKg, bfPercent)` | `weightKg × (bfPercent / 100)` |
| 5 | `leanMass(weightKg, fatMassKg)` | `weightKg - fatMassKg` |
| 6 | `boneMass(humerusCm, femurCm, heightCm)` | `o² × heightCm × 1.2` where `o = (humerusCm + femurCm) / 2` (Matiegka) |
| 7 | `muscleMass(correctedArmCm, correctedForearmCm, correctedThighCm, correctedCalfCm, heightCm)` | `r² × heightCm × 6.5` where `r = (sum of corrected perimeters) / (8 × π)` (Matiegka derivative) |
| 8 | `waistToHip(waistCm, hipCm)` | `waistCm / hipCm` |
| 9 | `waistToHeight(waistCm, heightCm)` | `waistCm / heightCm` |
| 10 | `bmr(sex, weightKg, heightCm, age)` | **Male**: `10 × weightKg + 6.25 × heightCm - 5 × age + 5`<br>**Female**: `10 × weightKg + 6.25 × heightCm - 5 × age - 161` (Mifflin-St Jeor) |
| 11 | `computeAllMetrics(measurement, profile)` | Aggregates all the above: sums skinfolds, extracts perimeters, computes age from `profile.dateOfBirth` at `measurement.measuredAt`, calls each function, returns a flat object with all derived values keyed by name |

### Helper functions

- `sum7Skinfolds(skinfolds)` — sums the 7 skinfold values for use in body density
- `correctedPerimeter(perimeterCm, skinfoldMm)` — `perimeterCm - (skinfoldMm / 10)` for muscle mass calculations
- `ageAtDate(dateOfBirth, measuredAt)` — age in years as integer (for body density and BMR)

### Sex parameter

- Accepts `"M"` | `"F"` as string
- Throw on unknown values (fail fast — don't default)

## Approach

1. Write failing tests in `src/lib/calculations.test.ts` for the simplest functions: `bmi`, `waistToHip`, `waistToHeight`
2. Confirm tests fail
3. Implement those three functions
4. Confirm tests pass
5. Write failing tests for `bodyDensity` (male + female produce different results), `bodyFatPercent`, `fatMass`, `leanMass`
6. Implement those four functions
7. Confirm tests pass
8. Write failing tests for `bmr` (male + female produce different results)
9. Implement `bmr`
10. Confirm tests pass
11. Write failing tests for `boneMass`, `muscleMass` with known reference inputs
12. Implement bone and muscle mass
13. Confirm tests pass
14. Write failing test for `computeAllMetrics` — pass in a full Measurement-like object and Profile-like object, assert the returned object has all expected keys and plausible values
15. Implement `computeAllMetrics` (including helpers for skinfold sum, perimeter correction, age calculation)
16. Confirm test passes
17. Run full test suite — all calculations tests green

### Test fixtures

- Use reference values from published anthropometric tables. For example:
  - BMI: 70 kg, 175 cm → 22.86
  - Body density: published J&P 7-site reference values
  - BMR: Mifflin-St Jeor has known outputs (70 kg, 175 cm, 30y male → 1691.25)
  - Verify male ≠ female for same inputs on sex-specific functions

## Acceptance

- [ ] All 11 functions exist in `src/lib/calculations.ts`
- [ ] Every function is pure — no Mongoose, no `dbConnect`, no side effects
- [ ] BMI, body density, body fat %, BMR match known reference values in tests
- [ ] Sex-specific functions (`bodyDensity`, `bmr`) produce different results for M vs F with identical raw inputs
- [ ] `computeAllMetrics` returns all derived values without throwing for valid inputs
- [ ] Test file at `src/lib/calculations.test.ts` passes all cases

## Verification

```bash
npm test -- src/lib/calculations.test.ts
npm run lint
```

## Commit

```
feat(lib): add body composition calculation functions
```

## Notes

- The J&P 7-site equation uses the **sum** of all 7 skinfolds, not individual values. The `bodyDensity` function takes the pre-computed sum as input.
- Matiegka bone/muscle mass are labeled as "anthropometric estimates" per spec — the constants (1.2, 6.5) follow published Matiegka references. Results should be logged with this caveat in the UI layer.
- `muscleMass` corrected perimeters: only arm and thigh are corrected (subtract skinfold/10). Forearm and calf have no skinfold measurement — pass raw perimeters.
