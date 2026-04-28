# Plan: API Routes (Measurement & Profile CRUD)

**Source**: `docs/ai/brief/05-api-routes.md`
**Status**: Ready
**Created**: 2026-04-27

---

## Goal

Build REST endpoints under `src/app/api/` for profiles and measurements CRUD, gated by session auth. All endpoints return JSON with pt-BR error messages. When done, the client can replace server-action calls with `fetch()` to these routes.

## Context snapshot

- **Next.js 16 App Router** — route handlers are files exporting HTTP-method functions in `src/app/api/<segment>/route.ts`:1
- **Mongoose models** ready — `src/models/profile.ts:1` (name, email, dateOfBirth, sex, defaultHeight) and `src/models/measurement.ts:1` (profileId, measuredAt, notes, weight, height, skinfolds, perimeters, diameters, timestamps)
- **Zod schemas** exist — `src/lib/validation.ts:1` exports `profileSchema`, `measurementSchema`, `measurementInputSchema`; `profileId` is optional in `measurementInputSchema` (server-action use); API POST will extend to require it
- **Session/auth** working — `src/lib/session.ts:26` exports `getSession()`, `src/middleware.ts:1` protects all non-public routes, `src/lib/env.ts:1` validates env vars at startup
- **Test infra** — Vitest + jsdom + mongodb-memory-server, co-located `.test.ts` files, `src/test/db.ts` exports `setupTestDb`/`teardownTestDb`
- **No existing API routes** beyond `POST /api/auth/login` and `POST /api/auth/logout`; `src/app/actions/profile-actions.ts:1` has temporary server-action wrappers to be replaced

## Assumptions

- **API requires `email` and `defaultHeight` on profile**: The brief lists name/dateOfBirth/sex as required and defaultHeight as optional, but the Profile model (`src/models/profile.ts:5-9`) requires both `email` and `defaultHeight`. The API follows the model as source of truth. If the UI should omit these, a separate model change would be needed (out of scope here).
- **Measurement fields match model requirements**: The brief says "weight required, others optional per spec" but the model (`src/models/measurement.ts:47-59`) requires weight, height, skinfolds (all 7), perimeters (neck/waist/hip + arm/forearm/thigh/calf left/right), and diameters (humerus/femur). The API validates what the model requires.
- **`GET /api/measurements` returns raw data**: The server returns measurement documents as stored. Computed metrics (BMI, body fat %, etc.) are calculated client-side via `src/lib/calculations.ts`.
- **`measurementInputSchema` will gain a `profileIdRequired` variant** for the POST route; the existing optional variant stays for server-action backward compatibility until those are removed.

## Execution

> Work through the steps in order. After completing a step, mark its checkbox, commit using the suggested message, then move to the next step. Do not skip ahead unless the step explicitly says it is optional.

- [ ] **01** — Auth helpers (`requireAuth`, `getActiveProfileId`) → [`01-auth-helpers.md`](./01-auth-helpers.md)
- [ ] **02** — Profile CRUD endpoints → [`02-profile-crud.md`](./02-profile-crud.md)
- [ ] **03** — Measurement CRUD endpoints → [`03-measurement-crud.md`](./03-measurement-crud.md)

## Done when

- [ ] Every step above is checked off
- [ ] All acceptance criteria from the source brief pass
- [ ] `npm test` is green
- [ ] `npm run lint` is green

## References

- `docs/ai/brief/05-api-routes.md` — source brief
- `docs/ai/brief/03-multi-profile-support.md` — API design contract
- `docs/ai/brief/04-authentication.md` — session/auth prerequisite
- `docs/ai/brief/02-data-models.md` — Mongoose models
- `src/models/profile.ts` — Profile model
- `src/models/measurement.ts` — Measurement model
- `src/lib/validation.ts` — Zod schemas
- `src/lib/session.ts` — session helper
- `src/lib/mongodb.ts` — DB connection helper
- `src/app/api/auth/login/route.ts` — existing route handler pattern
