# Step 03 — Measurement CRUD endpoints

**Plan**: [`main.md`](./main.md)
**Depends on**: 01, 02

## Objective

Create `src/app/api/measurements/route.ts` (list + create) and `src/app/api/measurements/[id]/route.ts` (get + update + delete) — five REST endpoints for measurement CRUD, scoped to a profile, gated by `requireAuth`.

## Context

- Measurement model: `src/models/measurement.ts` — `profileId`, `measuredAt`, `notes`, `weight`, `height`, `skinfolds` (7 sub-fields), `perimeters` (11 sub-fields with dual left/right), `diameters` (2 sub-fields), timestamps
- Index: `{ profileId: 1, measuredAt: -1 }` — queries are fast
- Zod schemas: `src/lib/validation.ts:43-62` — `measurementSchema` and `measurementInputSchema`. **Note**: `measurementInputSchema` has `profileId: z.string().min(1).optional()` — for POST we need it required. Add a `measurementCreateSchema` in validation.ts that makes `profileId` required, or validate it inline in the route.
- Validation for PUT: use `measurementSchema.partial()` since all fields are optional on update (except we exclude `profileId` from the body — it's set at creation only)
- `GET /api/measurements` query params: `profileId` (required), `from`, `to` (ISO date strings), `limit` (number, default none), `sort` (`asc` or `desc`, default `desc`)
- Date range: `measuredAt: { $gte: from, $lte: to }` on the query
- Portuguese messages: `"Medição não encontrada"`, `"ID do perfil é obrigatório"`, `"Perfil não encontrado"`, `"ID da medição é obrigatório"`

## Approach

1. Write failing tests in `src/app/api/measurements/route.test.ts` and `src/app/api/measurements/[id]/route.test.ts`:
   - `GET /api/measurements?profileId=...` → 200 with array, newest first
   - `GET /api/measurements?profileId=...&from=...&to=...` → 200 with filtered range
   - `GET /api/measurements?profileId=...&limit=2&sort=asc` → 200 with oldest 2
   - `GET /api/measurements` without `profileId` → 400
   - `GET /api/measurements?profileId=nonexistent` → empty array (not error — profile may have no measurements; profile existence validated at creation)
   - `POST /api/measurements` with valid body → 201
   - `POST /api/measurements` without `profileId` → 400
   - `POST /api/measurements` without weight → 400
   - `POST /api/measurements` with non-existent `profileId` → 400
   - `GET /api/measurements/[id]` → 200 with measurement
   - `GET /api/measurements/[id]` with invalid ObjectId → 400
   - `GET /api/measurements/[id]` with valid but non-existent id → 404
   - `PUT /api/measurements/[id]` → 200 with updated doc
   - `PUT /api/measurements/[id]` with invalid body → 400
   - `DELETE /api/measurements/[id]` → 204
   - All endpoints → 401 when unauthenticated
2. Confirm tests fail
3. Add `measurementCreateSchema` to `src/lib/validation.ts`: same as `measurementInputSchema` but `profileId` is `z.string().min(1)` (required)
4. Create `src/app/api/measurements/route.ts`:
   - `GET`: parse search params, require `profileId`, build query with optional `from`/`to`/`limit`/`sort`, `Measurement.find(query).sort(...).lean()`, return array
   - `POST`: parse body, require auth, validate with `measurementCreateSchema`, verify profile exists (`Profile.findById(profileId)`), if not → 400, create measurement, return 201
5. Create `src/app/api/measurements/[id]/route.ts`:
   - `GET`: validate id is valid ObjectId, find by id, 404 if null
   - `PUT`: validate id, parse body, validate with `measurementSchema.partial()` (exclude `profileId` from allowed updates — strip it from body), find and update, 404 if not found
   - `DELETE`: validate id, `Measurement.findByIdAndDelete(id)`, return 204 regardless of whether doc existed
6. Confirm tests pass
7. Refactor: extract common patterns (auth check, profile-existence check), ensure unknown keys are stripped from body

## Acceptance

- [ ] `GET /api/measurements?profileId=...` returns measurements for that profile, newest first
- [ ] `GET /api/measurements?profileId=...&from=...&to=...` filters by date range
- [ ] `POST /api/measurements` creates measurement with valid data, returns 201
- [ ] `POST /api/measurements` returns 400 when `profileId` or weight is missing
- [ ] `POST /api/measurements` returns 400 when `profileId` does not match an existing profile
- [ ] `GET /api/measurements/[id]` returns single measurement or 404
- [ ] `PUT /api/measurements/[id]` updates measurement with partial body
- [ ] `DELETE /api/measurements/[id]` deletes and returns 204
- [ ] All endpoints return 401 without valid session
- [ ] Error messages in Portuguese
- [ ] Tests pass for both route files

## Verification

```bash
npm test -- src/app/api/measurements
```

## Commit

```
feat(api): add measurement CRUD endpoints
```

## Notes

- `measurementInputSchema` in `validation.ts` keeps `profileId` optional — existing server-action code in `profile-actions.ts` relies on this. The new `measurementCreateSchema` is API-specific.
- Race condition on cascade delete (profile → measurements) was accepted as acceptable risk in the brief. Measurement delete comes first to minimize orphans.
