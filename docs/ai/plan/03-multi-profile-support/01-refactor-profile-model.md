# Step 01 — Refactor Profile model to a plain collection

**Plan**: [`main.md`](./main.md)
**Depends on**: none

## Objective

Remove the single-document constraint from the Profile model. Profiles become a normal Mongoose collection — multiple documents allowed, auto-generated `_id` values, no static `findOneAndUpsert`.

## Context

- Current model at `src/models/profile.ts:1` — has `SINGLETON_ID` constant, `findOneAndUpsert()` static method, and model interface `ProfileModel` with that method typed
- Current tests at `src/models/profile.test.ts:1` — assume single-doc constraint; every test uses `findOneAndUpsert`
- E2E test at `src/lib/e2e.test.ts:31` — calls `Profile.findOneAndUpsert`
- `export const SINGLETON_ID` is imported by other code — must be removed cleanly
- Schema fields (`name`, `email`, `dateOfBirth`, `sex`, `defaultHeight`, timestamps) stay the same
- The re-exports (`import Profile from "@/models/profile"`) must still work after refactor

## Approach

1. Rewrite tests in `src/models/profile.test.ts`: replace single-doc enforcement test with "allows multiple profiles" test, use `new Profile(data).save()` instead of `findOneAndUpsert`
2. Confirm new tests fail (model still enforces single doc)
3. Remove `SINGLETON_ID` constant, `findOneAndUpsert` static method, and `ProfileModel` interface from `src/models/profile.ts`
4. Confirm profile tests pass with new multi-doc behavior
5. Update `src/lib/e2e.test.ts` to create Profile via `new Profile(data).save()` instead of `findOneAndUpsert`
6. Confirm e2e + profile + measurement tests all pass
7. Run lint

## Acceptance

- [ ] `Profile` model is a plain collection — no `SINGLETON_ID`, no `findOneAndUpsert`, no `ProfileModel` interface
- [ ] `new Profile(data).save()` works and produces unique `_id` per document
- [ ] Multiple profiles can coexist in the collection
- [ ] All existing field validations still pass (required fields, sex enum, min height)
- [ ] Timestamps still auto-managed
- [ ] `src/models/profile.test.ts` passes with new multi-doc tests
- [ ] `src/lib/e2e.test.ts` passes without `findOneAndUpsert`

## Verification

```bash
npm test -- src/models/profile.test.ts
npm test -- src/models/measurement.test.ts
npm test -- src/lib/e2e.test.ts
npm run lint
```

## Commit

```
refactor(models): remove single-document enforcement from Profile, make it a plain collection
```

## Notes

- After this refactor, existing measurement data has no `profileId` — addressed in step 02
- `SINGLETON_ID` is only imported in `src/models/profile.test.ts` and `src/lib/e2e.test.ts` — no other consumers
