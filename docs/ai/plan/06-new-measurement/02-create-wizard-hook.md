# Step 02 — Create useMeasurementWizard hook

**Plan**: [`main.md`](./main.md)
**Depends on**: 01

## Objective

Build `src/hooks/use-measurement-wizard.ts` — a custom hook that manages the 5-step wizard state: form data, current step, step navigation, per-step validation, and a final `save()` action.

## Context

Follow the discriminated union pattern from `ProfileSwitcher` (`src/components/profile-switcher.tsx:12-17`). The hook should be a pure state machine — no JSX, no API calls (save is deferred to the page). The hook is independently testable with `renderHook` from `@testing-library/react`.

**Wizard steps**:
```
1 → básico (weight*, height?, measuredAt?, notes?)
2 → skinfolds (7 optional fields in mm)
3 → perimeters (13+ fields in cm)
4 → diameters (2 fields in cm)
5 → review (read-only summary)
```

Step values held as strings (native HTML input behavior); numbers are parsed on validation/submit.

**Schema to follow**: After step 01, `measurementCreateSchema` accepts partial measurements. The hook validates against a refined schema per step.

## Approach

1. **Write a failing test** in `src/hooks/use-measurement-wizard.test.ts`. Use `renderHook` + `act`. Test minimal case: hook initializes at step 1 with empty form data.
2. **Confirm it fails** (import missing).
3. **Create the hook file** `src/hooks/use-measurement-wizard.ts`:
   - `export type WizardStep = 1 | 2 | 3 | 4 | 5`
   - Form data type: flat object with all measurement fields as `string | undefined`
   - State: `{ step, data, errors }`
   - Functions: `setField(field, value)`, `goTo(step)`, `next()`, `prev()`, `getSavePayload()`
   - `next()`: validates current step. If valid, advance. If not, set per-field errors.
   - `prev()`: go back (no validation).
   - `goTo(step)`: jump to any completed/past step directly.
   - `getSavePayload()`: parse strings to numbers, build the object for `POST /api/measurements`.
4. **Write tests for full hook behavior**:
   - `next()` from step 1 without weight → stays at step 1 with error
   - `next()` from step 1 with weight → advances to step 2
   - `next()` through steps 2-4 → no validation (all optional)
   - `next()` from step 4 → advances to step 5 (review)
   - `prev()` from step 2 → returns to step 1, data preserved
   - `goTo(3)` → jumps to step 3 (only if step ≤ current max reached)
   - `setField("weight", "70.5")` → updates weight in form data
   - `setField("height", "")` → clears height
   - `getSavePayload()` with weight="70" → returns `{ weight: 70, ... }` with numbers parsed
   - `getSavePayload()` after filling skinfolds → returns skinfolds sub-object with parsed numbers
   - Setting `measuredAt` to a date string → stored and passed through
   - `notes` field accepts free text
5. **Confirm all tests green**.

## Acceptance

- [ ] Hook initializes at step 1 with empty data
- [ ] `next()` blocked when weight is empty on step 1
- [ ] `next()` allowed when weight has a value
- [ ] `prev()` navigates backward preserving data
- [ ] Optional steps (2-4) pass through without validation
- [ ] `getSavePayload()` parses string values into numbers
- [ ] All hook tests pass

## Verification

```bash
npm test -- src/hooks/use-measurement-wizard.test.ts
```

## Commit

```
feat(wizard): add useMeasurementWizard hook for multi-step measurement form
```
