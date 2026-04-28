# Step 04 — Implement input step forms

**Plan**: [`main.md`](./main.md)
**Depends on**: 03

## Objective

Replace step content placeholders with real form fields for steps 1-4. Each step renders its numeric inputs with `inputMode="decimal"`, inline validation errors in Portuguese, and labels matching the brief's field names.

## Context

The hook from step 02 already stores field values as strings and validates per step. The page from step 03 already switches step content and has navigation. This step fills in the content for steps 1-4 only (step 5 = review is step 05).

**Field reference from brief**:
- Step 1: `weight` (kg, required, >0, <500), `height` (cm, optional, >0, pre-filled from `activeProfile?.defaultHeight`), `measuredAt` (date, defaults today), `notes` (free text)
- Step 2: `skinfolds.chest`, `.midaxillary`, `.triceps`, `.subscapular`, `.abdominal`, `.suprailiac`, `.thigh` (mm, optional, 1 decimal)
- Step 3: `perimeters.neck`, `.waist`, `.hip`, `.abdomen`, `.chest`, `.arm.left`, `.arm.right`, `.forearm.left`, `.forearm.right`, `.thigh.left`, `.thigh.right`, `.calf.left`, `.calf.right` (cm, optional, 1 decimal)
- Step 4: `diameters.humerus`, `.femur` (cm, optional, 1 decimal)

**Error message convention**: `"Peso é obrigatório"`, `"Peso deve ser maior que 0"`, etc. Follow the concise, Portuguese pattern.

## Approach

1. **Extract step form components** — create `src/components/measurement-step-basic.tsx`, `src/components/measurement-step-skinfolds.tsx`, `src/components/measurement-step-perimeters.tsx`, `src/components/measurement-step-diameters.tsx`. Each receives `{ data, errors, onChange }` props from the hook. This keeps the page component clean and each step independently testable.
2. **Write tests for each step component** (or a combined test file). Test that:
   - All expected fields render with `inputMode="decimal"` on numeric inputs
   - Fields display their current value from `data`
   - Changing a field calls `onChange(field, value)`
   - Validation errors display in red below the offending field
   - Step 1 height field pre-fills when `activeProfile?.defaultHeight` is set
3. **Confirm tests fail**.
4. **Implement components**:
   - Use Chakra `Input` with `inputMode="decimal"` for numeric fields
   - Use Chakra `Input` with `type="date"` for `measuredAt`
   - Use Chakra `Input` as textarea or `<textarea>` for `notes`
   - Each field wrapped in `<Stack gap={1}>` with `<label>` (pattern from login page)
   - Error text: `<Text color="red.500" role="alert">` (pattern from login page)
   - Step layout: `<Stack gap={4}>` for the field list
   - For L/R paired fields (arm, forearm, thigh, calf): render side-by-side in a `<Flex gap={2}>` with labels "Esquerdo"/"Direito"
5. **Wire components into page.tsx** — replace step content placeholders with the corresponding component, passing `data`, `errors`, and `setField` from the hook.
6. **Pre-fill height**: In the page (or basic step component), read `activeProfile?.defaultHeight` via `useActiveProfile()` and call `setField("height", String(defaultHeight))` on mount (only if height is not already set by user).
7. **Confirm tests pass**.

## Acceptance

- [ ] Step 1 renders weight, height, measuredAt, notes fields
- [ ] Weight field is marked required; validation error shows if empty on next
- [ ] Height pre-fills from `activeProfile?.defaultHeight`
- [ ] Step 2 renders all 7 skinfold fields with `inputMode="decimal"`
- [ ] Step 3 renders all perimeter fields (L/R pairs side-by-side)
- [ ] Step 4 renders humerus and femur fields
- [ ] All numeric inputs use `inputMode="decimal"`
- [ ] Validation errors display inline in red

## Verification

```bash
npm test -- src/components/measurement-step-basic.test.tsx src/components/measurement-step-skinfolds.test.tsx src/components/measurement-step-perimeters.test.tsx src/components/measurement-step-diameters.test.tsx src/app/medir/page.test.tsx
```

## Commit

```
feat(wizard): implement measurement input step forms (básico, skinfolds, perimeters, diameters)
```

## Notes

- The `<Field>` component from Chakra v3 (with `Field.Label`, `Field.Input`, `Field.ErrorText`) may be a better pattern than raw `<label>` + `<Input>`. Check availability in the installed version. If available, prefer `<Field>` over manual `<label>`.
- `measuredAt` uses `<input type="date">` (native). Chakra `Input` with `type="date"` works for this.
- Left/Right label abbreviations: use "Esq." / "Dir." if full words overflow on mobile.
