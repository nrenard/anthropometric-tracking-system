# Step 02 — Profile CRUD endpoints

**Plan**: [`main.md`](./main.md)
**Depends on**: 01

## Objective

Create `src/app/api/profiles/route.ts` (list + create) and `src/app/api/profiles/[id]/route.ts` (get + update + delete with cascade) — five REST endpoints for profile CRUD, all gated by `requireAuth`.

## Context

- Profile model: `src/models/profile.ts` — `name`, `email`, `dateOfBirth`, `sex`, `defaultHeight` all required, timestamps auto
- Zod schema: `src/lib/validation.ts:3` — `profileSchema` with name (min 1), email (valid email), dateOfBirth (past), sex enum, defaultHeight (positive)
- Measurement model for cascade delete: `src/models/measurement.ts` — `Measurement.deleteMany({ profileId })`
- DB connect: `src/lib/mongodb.ts` — `dbConnect()`
- Auth: `src/lib/auth.ts` — `requireAuth(session)`, `getActiveProfileId(request)` (step 01)
- Session: `src/lib/session.ts` — `getSession()`
- Route handler pattern from `src/app/api/auth/login/route.ts`:
  - Export `POST` async function, parse body with `await request.json()`, return `Response.json(body, { status })`
  - Use `Response.json()` not `NextResponse.json()` (Next.js 16 App Router)
- Test pattern: mock `@/lib/session` with `vi.mock()`, mock `@/lib/auth` with `vi.mock()`, test each HTTP method
- Portuguese messages: `"Perfil não encontrado"`, `"Dados inválidos"`, `"Perfil criado com sucesso"`, `"Sessão expirada"`

## Approach

1. Write failing tests in `src/app/api/profiles/route.test.ts` and `src/app/api/profiles/[id]/route.test.ts` covering:
   - `GET /api/profiles` → 200 with array (empty or populated)
   - `POST /api/profiles` → 201 with created doc
   - `POST /api/profiles` with invalid body → 400
   - `GET /api/profiles/[id]` → 200 with profile
   - `GET /api/profiles/[id]` with invalid ObjectId → 400
   - `GET /api/profiles/[id]` with valid but non-existent id → 404
   - `PUT /api/profiles/[id]` → 200 with updated doc
   - `PUT /api/profiles/[id]` with invalid body → 400
   - `DELETE /api/profiles/[id]` → 204, verifies profile and its measurements are gone
   - All endpoints → 401 when unauthenticated
   - All endpoints use pt-BR error messages
2. Confirm tests fail (no route handlers yet)
3. Create `src/app/api/profiles/route.ts`:
   - `GET`: call `dbConnect()`, `getSession()`, `requireAuth(session)`, `Profile.find().sort({ createdAt: -1 }).lean()`, return array
   - `POST`: parse body, validate with `profileSchema` from `@/lib/validation`, `dbConnect()`, `getSession()`, `requireAuth()`, create `Profile`, return 201
   - On Zod validation failure return 400 with `{ error: "Dados inválidos" }`
4. Create `src/app/api/profiles/[id]/route.ts`:
   - `GET`: validate id is valid ObjectId (400 if not), find by id, 404 if null
   - `PUT`: validate id, parse body, validate with partial `profileSchema` (use `.partial()` for update), find and update, 404 if not found
   - `DELETE`: validate id, `Measurement.deleteMany({ profileId })` then `Profile.findByIdAndDelete(id)`, return 204 (empty body). Do NOT fail if 0 profiles deleted — deleted is deleted.
5. Confirm tests pass
6. Refactor: extract common patterns (auth check, error responses), strip unknown keys from request body

## Acceptance

- [ ] `GET /api/profiles` returns array of all profiles (empty array if none)
- [ ] `POST /api/profiles` creates profile with valid data, returns 201
- [ ] `POST /api/profiles` returns 400 on invalid body
- [ ] `GET /api/profiles/[id]` returns profile or 404
- [ ] `PUT /api/profiles/[id]` updates profile, returns updated doc
- [ ] `DELETE /api/profiles/[id]` cascade-deletes measurements and profile, returns 204
- [ ] All endpoints return 401 when session is unauthenticated
- [ ] Error messages in Portuguese
- [ ] Tests pass for both route files

## Verification

```bash
npm test -- src/app/api/profiles
```

## Commit

```
feat(api): add profile CRUD endpoints
```
