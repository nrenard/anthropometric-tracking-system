# Step 01 — Relax measurement model & validation for partial measurements

**Plan**: [`main.md`](./main.md)
**Depends on**: none

## Objective

Update the Zod validation schemas and Mongoose model so that only `weight` is required. The sub-objects `skinfolds`, `perimeters`, `diameters` and the `height` field become optional — allowing partial measurement records.

## Context

Current constraints in `src/lib/validation.ts:43-67` and `src/models/measurement.ts:47-59` require all measurement fields. The brief allows recording only weight. This step must be done first because all downstream code (hook, page, save) depends on the looser schema.

**Files to touch**:
- `src/lib/validation.ts` — Zod schemas
- `src/models/measurement.ts` — Mongoose schema + TypeScript interface
- `src/lib/validation.test.ts` — existing Zod validation tests
- `src/models/measurement.test.ts` — existing Mongoose model tests

## Approach

1. Read `src/lib/validation.test.ts` to understand existing test coverage for `measurementSchema`, `measurementInputSchema`, `measurementCreateSchema`
2. Write a failing test: a measurement with only `profileId` + `weight` should parse successfully with `measurementCreateSchema.safeParse()`
3. Confirm the test fails (validation rejects missing `height`, `skinfolds`, etc.)
4. Update Zod schemas:
   - `skinFoldsSchema` → wrap in `z.object(...).optional()` or make individual fields optional and the whole schema `.optional()` in parent. **Prefer making the entire sub-object optional** (e.g., `skinfolds: skinFoldsSchema.optional()`) so the shape stays consistent when present.
   - `perimetersSchema` → similarly `.optional()` in parent
   - `diametersSchema` → similarly `.optional()` in parent
   - `height` → `.optional()` in `measurementSchema`, `measurementInputSchema`, `measurementCreateSchema`
5. Update Mongoose model:
   - `skinfolds: { type: SkinfoldsSchema, required: false }`
   - `perimeters: { type: PerimetersSchema, required: false }`
   - `diameters: { type: DiametersSchema, required: false }`
   - `height: { type: Number, required: false, min: 0 }`
   - Update TypeScript interface `IMeasurement` to mark these fields optional
6. Run existing tests, update any that assert required sub-objects. Update mock/stub data in tests to match the new optional shape (e.g., `src/app/api/measurements/route.test.ts` may create measurement objects with all fields — these should still pass)
7. Confirm all tests green including the new partial-measurement test

## Acceptance

- [ ] `measurementCreateSchema.safeParse({ profileId, weight, measuredAt })` returns `success: true`
- [ ] Existing tests still pass after updates
- [ ] Mongoose model allows saving a document with only `profileId`, `weight`, `measuredAt`

## Verification

```bash
npm test -- src/lib/validation.test.ts src/models/measurement.test.ts src/app/api/measurements
```

## Commit

```
fix(models): allow partial measurements with only weight required
```

## Notes

- The `skinFoldsSchema`, `perimetersSchema`, `diametersSchema` themselves still enforce validation on _individual fields_ when the sub-object IS provided. Only the parent schemas gain `.optional()`.
- _Not_ making individual sub-field properties optional (e.g., `skinfolds.chest` still required if `skinfolds` is provided). This matches the brief: if a user enters skinfolds, they should enter all 7 — but they can skip the entire section.
