# Step 05 — Implement review step & save

**Plan**: [`main.md`](./main.md)
**Depends on**: 04

## Objective

Implement step 5 (Review): a read-only summary of all entered values grouped by section. Add the "Salvar" button that POSTs to `/api/measurements`, shows a success toast, and redirects to `/historico`.

## Context

The `useMeasurementWizard` hook already has `getSavePayload()` which parses the string form data into the shape expected by `POST /api/measurements`. The page already has a "Salvar" button placeholder on step 5 (from step 03).

**POST endpoint**: `POST /api/measurements` accepts `measurementCreateSchema` body with `profileId`, `measuredAt`, `weight`, and optional sub-objects. Returns `201 { ... }` on success or `400 { error: "..." }` / `401 { error: "..." }`.

**Toast pattern**: `toaster.create({ title: "Medição salva com sucesso", type: "success" })` follows the existing error toast pattern in `src/app/login/page.tsx:40-43`.

**Redirect**: `router.push("/historico")` after successful save.

## Approach

1. **Create review step component**: `src/components/measurement-step-review.tsx`:
   - Receives parsed data (not strings — already converted by the hook)
   - Groups fields by section: Básico → Skinfolds → Perimeters → Diameters
   - Only shows sections that have at least one filled value
   - Empty sections: show "Nenhum valor informado" in muted text
   - Each field-value pair: `<Flex justify="space-between"><Text>{label}</Text><Text fontWeight="medium">{value} {unit}</Text></Flex>`
   - Unit suffixes: kg (weight), cm (height/perimeters/diameters), mm (skinfolds)
2. **Write tests for review component**:
   - Renders sections that have data
   - Hides sections with no data
   - Displays "Nenhum valor informado" for empty sections
   - Shows correct units per field type
   - Date formatted as `DD/MM/YYYY`
3. **Confirm tests fail**.
4. **Implement review component**.
5. **Wire step 5 in page.tsx**: replace the placeholder with `<MeasurementStepReview data={savedPayload} />`
6. **Implement save flow in page.tsx**:
   - "Salvar" button calls `handleSave` which:
     a. Sets `isSaving` state to `true`
     b. Gets payload from `getSavePayload()` + injects `profileId` from `useActiveProfile().activeProfileId`
     c. `fetch("/api/measurements", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })`
     d. On success (response.ok): toast success, redirect to `/historico`
     e. On error (400): parse response, show error in toast
     f. On network error: show generic error toast
     g. Sets `isSaving` back to `false`
7. **Update page tests** for step 5:
   - Review step shows entered data
   - "Salvar" button triggers POST and redirects on success (mock `fetch`)
   - Error response shows toast
8. **Confirm all tests green**.

## Acceptance

- [ ] Step 5 displays all entered values grouped by section
- [ ] Sections with no data show "Nenhum valor informado"
- [ ] Values show correct units (kg, cm, mm)
- [ ] "Salvar" button POSTs to `/api/measurements` with correct payload including `profileId`
- [ ] On success: toast "Medição salva com sucesso", redirect to `/historico`
- [ ] On error: toast with error message from API
- [ ] Save button shows loading state while submitting

## Verification

```bash
npm test -- src/components/measurement-step-review.test.tsx src/app/medir/page.test.tsx
```

## Commit

```
feat(wizard): implement review step and save to API
```
