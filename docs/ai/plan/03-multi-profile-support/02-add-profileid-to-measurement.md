# Step 02 — Add profileId to Measurement model

**Plan**: [`main.md`](./main.md)
**Depends on**: 01

## Objective

Add a `profileId` foreign key field to the Measurement schema with a compound index `{ profileId: 1, measuredAt: -1 }` so measurements can be scoped to a specific profile.

## Context

- Current schema at `src/models/measurement.ts:47` — top-level fields: `measuredAt`, `notes`, `weight`, `height`, `skinfolds`, `perimeters`, `diameters`. No `profileId`.
- Profile model exists at `src/models/profile.ts` after step 01 (plain collection)
- Tests at `src/models/measurement.test.ts:1` — no profileId in test data or assertions
- Zod validation at `src/lib/validation.ts:53` — `measurementInputSchema` has no `profileId`; add it as optional here (becomes required in brief 05 when API validates it)
- Existing `measuredAt` index at line 49 (`index: -1`) becomes the second field of the new compound index
- `profileId` should reference `Profile` via `Schema.Types.ObjectId` and `ref: "Profile"`

## Approach

1. Write a failing test: measurement without `profileId` should fail validation, with `profileId` should save
2. Confirm the test fails (no profileId field yet)
3. Add `profileId` field to `measurementSchema`: `{ type: Schema.Types.ObjectId, ref: "Profile", required: true }`
4. Replace existing `measuredAt` index with compound index: `measurementSchema.index({ profileId: 1, measuredAt: -1 })`
5. Add `profileId` to `IMeasurement` interface
6. Confirm measurement tests pass
7. Optionally add `profileId` to `measurementInputSchema` in `src/lib/validation.ts` (as `.optional()` for now — becomes required in brief 05)
8. Run all tests and lint

## Acceptance

- [ ] `profileId` field exists on Measurement schema, required, referencing `Profile`
- [ ] Compound index `{ profileId: 1, measuredAt: -1 }` created (drop old single `measuredAt` index)
- [ ] `IMeasurement` interface includes `profileId: Types.ObjectId`
- [ ] Saving a measurement without `profileId` throws validation error
- [ ] Saving a measurement with a valid `profileId` succeeds
- [ ] All existing measurement tests pass with updated test data (include `profileId`)
- [ ] All prior tests still pass (profile, e2e)

## Verification

```bash
npm test -- src/models/measurement.test.ts
npm test -- src/models/profile.test.ts
npm test -- src/lib/e2e.test.ts
npm run lint
```

## Commit

```
feat(models): add profileId foreign key to Measurement with compound index
```

## Notes

- The old `{ measuredAt: -1 }` index at line 49 of measurement.ts gets removed and replaced by the compound index
- `measurementInputSchema` profileId stays optional for now — brief 05 makes it required at the API boundary
- E2E test at `src/lib/e2e.test.ts` needs a profile ObjectId in measurement data
