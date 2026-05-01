# Step 01 — Wizard Edit Mode

**Plan**: [`main.md`](./main.md)
**Depends on**: none

## Objective

Extend the measurement wizard at `/medir` to accept an optional `edit` query param. When present, fetch the existing measurement, pre-populate all wizard fields, and submit as `PUT` instead of `POST`.

## Context

- Wizard page: `src/app/medir/page.tsx:1` — uses `useMeasurementWizard()` hook, renders 5 step components
- Wizard hook: `src/hooks/use-measurement-wizard.ts:1` — discriminated union state machine, flat `WizardData` field map, `setField()`, `next()`, `prev()`
- Step components render at `src/components/measurement-step-*.tsx` — each accepts `data: WizardData` and `setField(field, value)`
- API: `PUT /api/measurements/[id]` exists at `src/app/api/measurements/[id]/route.ts:38` (uses `measurementUpdateSchema`)
- API: `GET /api/measurements/[id]` exists at `src/app/api/measurements/[id]/route.ts:24`
- The wizard currently only supports create mode — always POSTs to `/api/measurements` (`src/app/medir/page.tsx:77`)
- Measurements in DB store values as `number` (not string) — the wizard stores everything as `string`; conversion happens at submit
- Step 1 (basic) has a `selectedProfileId` field — on edit, this must stay locked to the measurement's existing profile

## Approach

### 1. Write failing test

In `src/hooks/use-measurement-wizard.test.ts`:
- Test: `initWithMeasurement(measurement)` pre-populates all wizard data fields from a measurement object
- Test: `isEditMode` flag is `true` after initialization with a measurement
- Test: submit uses `PUT /api/measurements/[id]` when in edit mode

In `src/app/medir/page.test.tsx`:
- Test: page reads `edit` query param from `useSearchParams()`
- Test: page fetches measurement when `edit` param is present
- Test: page shows "Editando medição" title in edit mode
- Test: page calls `PUT` when submitting in edit mode

### 2. Extend `useMeasurementWizard` hook

Add to `src/hooks/use-measurement-wizard.ts`:
- New function `initFromMeasurement(measurement)`: maps measurement fields to `WizardData` strings (numbers → strings, dates → ISO strings, null/undefined → `""`)
- New return value `isEditMode: boolean` (true when initialized with measurement)
- New return value `editMeasurementId: string | null`
- Expose `reset()` to clear state back to defaults

### 3. Update `src/app/medir/page.tsx`

- Read `searchParams.edit` (Next.js 16 uses `await searchParams` in page component or `useSearchParams()` in client component — since it's `"use client"`, use `useSearchParams()`)
- On mount with `edit` param: fetch `GET /api/measurements/[id]`, call `initFromMeasurement(data)`
- Change submit logic: if `isEditMode`, `PUT /api/measurements/[editMeasurementId]` with `measurementUpdateSchema` payload; else `POST /api/measurements`
- After successful edit: show success toast, navigate to `/historico/[id]` or `/historico`
- Title/heading changes: "Nova Medição" vs "Editar Medição"
- Lock `selectedProfileId` during edit — use the measurement's `profileId`, disallow changing

### 4. Update step components if needed

- Step components (`measurement-step-basic.tsx`, etc.) only need changes if they assume create-only logic. Check each for hardcoded create assumptions (e.g., default values that should come from measurement).
- Step 1 (basic): the profile dropdown should be disabled/hidden in edit mode — profile can't change.

### 5. Confirm green & refactor

- Run `npm test -- src/hooks/use-measurement-wizard.test.ts src/app/medir/page.test.tsx`
- Confirm tests pass
- Refactor: ensure field mapping logic is a pure function (testable in isolation)

## Acceptance

- [ ] Visiting `/medir?edit=<validId>` opens the wizard with all fields pre-populated from the measurement
- [ ] Profile dropdown is locked (or hidden) in edit mode
- [ ] Submitting in edit mode sends `PUT /api/measurements/[id]`
- [ ] After successful edit, user sees success toast and is redirected
- [ ] Visiting `/medir?edit=<invalidId>` shows error toast and falls back to create mode
- [ ] Visiting `/medir` without `edit` still works in create mode (no regression)
- [ ] All existing wizard tests still pass

## Verification

```bash
npm test -- src/hooks/use-measurement-wizard.test.ts src/app/medir/page.test.tsx src/components/measurement-step-basic.test.tsx src/components/measurement-step-skinfolds.test.tsx src/components/measurement-step-perimeters.test.tsx src/components/measurement-step-diameters.test.tsx src/components/measurement-step-review.test.tsx
npm run lint
```

## Commit

```
feat(medir): add edit mode to measurement wizard via query param
```
