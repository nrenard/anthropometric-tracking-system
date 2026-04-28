# Step 04 — Zod validation schemas

**Plan**: [`main.md`](./main.md)
**Depends on**: 01, 02, 03

## Objective

Create Zod validation schemas for `Profile` and `Measurement` inputs, plus run end-to-end acceptance verification across all artifacts created in steps 01–03.

## Context

- Zod 3.25.76 installed — follow the `src/lib/env.ts` pattern: `z.object()` → `safeParse()` → aggregate errors
- Mongoose handles DB-level validation; Zod schemas are for runtime validation at API boundaries (e.g. route handlers)
- Schemas should validate the same fields as the models but with Zod's constraints (positive numbers, 1 decimal max where applicable, reasonable max ranges, sex enum, dateOfBirth past check)

### Zod schemas to create

Create `src/lib/validation.ts`:

- `profileSchema` — validates profile input fields: `name` (string, min 1), `email` (string, email), `dateOfBirth` (coerce to Date, refine: must be before today), `sex` (enum `"M"` | `"F"`), `defaultHeight` (positive number)
- `skinFoldsSchema` — 7 positive number fields, each ≤ 100 mm (reasonable max)
- `perimetersSchema` — nested L/R structure matching the Mongoose schema, positive numbers, ≤ 300 cm each
- `diametersSchema` — 2 positive number fields
- `measurementSchema` — top-level measurement input: `measuredAt` (Date, optional — defaults to now), `notes` (string, optional), `weight` (positive number, ≤ 700 kg), `height` (positive number, ≤ 300 cm), plus nested `skinfolds`, `perimeters`, `diameters`
- `measurementInputSchema` — same but `measuredAt` defaults to `new Date()` on missing
- Export inferred types: `ProfileInput`, `MeasurementInput`

### End-to-end acceptance verification

After validation schemas are written and tested:

1. Write an integration-style test that imports the Profile model, Measurement model, calculation functions, and Zod schemas
2. Verify that a valid Profile + Measurement round-trips: create profile → create measurement → compute all metrics → verify output shape and plausibility
3. Confirm no Mongoose imports exist in `src/lib/calculations.ts`
4. Run the full test suite and lint

## Approach

1. Write failing tests in `src/lib/validation.test.ts` for `profileSchema` — valid input passes, invalid input (missing name, invalid email, future date, wrong sex) fails
2. Confirm tests fail
3. Create `src/lib/validation.ts` with `profileSchema`
4. Confirm tests pass
5. Write failing tests for `measurementSchema` — valid nested input passes, invalid (negative weight, missing skinfold) fails
6. Implement `skinFoldsSchema`, `perimetersSchema`, `diametersSchema`, `measurementSchema`
7. Confirm tests pass
8. Write failing test for `measurementInputSchema` — verify `measuredAt` defaults to now when omitted
9. Implement `measurementInputSchema`
10. Confirm tests pass
11. Write end-to-end integration test: create Profile → create Measurement → call `computeAllMetrics` → assert all keys present and values are finite numbers
12. Run full test suite: `npm test`
13. Run lint: `npm run lint`

## Acceptance

- [ ] `profileSchema` validates and rejects correctly in tests
- [ ] `measurementSchema` validates nested subdocuments and rejects invalid data
- [ ] `measurementInputSchema` defaults `measuredAt` when omitted
- [ ] All inferred types (`ProfileInput`, `MeasurementInput`) are exported
- [ ] End-to-end integration test passes (models + calculations + validation together)
- [ ] `src/lib/calculations.ts` contains no Mongoose imports
- [ ] Full test suite and lint are green

## Verification

```bash
npm test -- src/lib/validation.test.ts
npm test
npm run lint
```

## Commit

```
feat(validation): add Zod schemas for Profile and Measurement input validation
```

## Notes

- The Zod schemas are **not** a replacement for Mongoose validation. They serve the API layer (route handlers) to validate incoming request bodies before passing data to Mongoose.
- Reasonable max ranges (700 kg weight, 300 cm height, 100 mm skinfolds, 300 cm perimeters) are intentional guards — adjust if real-world data exceeds them.
- `measurementInputSchema` differs from `measurementSchema` only in that `measuredAt` is optional with a default — this is for the create-measurement API where the client may omit the timestamp.
