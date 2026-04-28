# Step 01 — Profile model with single-document enforcement

**Plan**: [`main.md`](./main.md)
**Depends on**: none

## Objective

Create `src/models/profile.ts` — a Mongoose schema and model for the `Profile` collection that enforces at most one document via upsert on save.

## Context

- `src/models/` directory must be created
- Mongoose 8.23.1 — use `Schema`, `model`, `InferSchemaType`, `Document`
- `strictPropertyInitialization` is on — declare fields with `!: Type`
- DB connection at `src/lib/mongodb.ts` — the model registers against the same `mongoose` instance
- Existing test setup: vitest + `@/` alias; test files go next to the module (e.g. `src/models/profile.test.ts`)

### Schema fields (per `spec.md:90-99`)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `name` | String | yes | |
| `email` | String | yes | |
| `dateOfBirth` | Date | yes | must be in past |
| `sex` | String enum `M`/`F` | yes | |
| `defaultHeight` | Number | yes | in cm, positive |

- Timestamps: `{ createdAt, updatedAt }` enabled
- Pre-save hook: ensure only one document exists

### Single-document enforcement strategy

Per the brief's risk section: use a pre-save hook that calls `this.constructor.findOneAndUpdate` with `upsert: true`, setting the `_id` to a known constant (e.g. `SINGLETON_ID`) so at most one document ever exists. The hook redirects the save to an upsert of a single document.

Alternative simpler approach: the pre-`validate` or pre-`save` hook checks if a document already exists; if so, throw a validation error telling callers to use `findOneAndUpdate` with `upsert: true` instead. Statically export `SINGLETON_ID` and a static method `findOneAndUpsert()` to facilitate this.

Use the **static method** approach — it's cleaner, more explicit, and easier to test.

## Approach

1. Create `src/models/` directory
2. Write a failing test in `src/models/profile.test.ts` that verifies saving a profile works
3. Confirm the test fails (no model yet)
4. Create `src/models/profile.ts` with the schema, model, single-document enforcement, and static `findOneAndUpsert` method
5. Confirm the test passes
6. Add test for single-document enforcement: saving a second profile creates only one document
7. Add a barrel export or index if needed (defer to convention)

## Acceptance

- [ ] `Profile` model exists at `src/models/profile.ts`
- [ ] Schema validates all required fields and rejects invalid data
- [ ] Single-document constraint: at most one profile document exists after any sequence of saves
- [ ] Timestamps (`createdAt`, `updatedAt`) are automatically managed
- [ ] Test file at `src/models/profile.test.ts` passes

## Verification

```bash
npm test -- src/models/profile.test.ts
npm run lint
```

## Commit

```
feat(models): add Profile Mongoose schema with single-document enforcement
```

## Notes

- The static method `findOneAndUpsert` should be the only way to create/update a profile — direct `new Profile(...).save()` should throw if a document already exists
- Export `SINGLETON_ID` as a named constant so other modules can reference the profile document ID
