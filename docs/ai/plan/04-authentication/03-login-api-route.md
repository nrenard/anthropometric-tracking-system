# Step 03 — Login API Route

**Plan**: [`main.md`](./main.md)
**Depends on**: 01 (needs `getSession` and env vars)

## Objective

Create `POST /api/auth/login` that verifies credentials against `AUTH_USER` / `AUTH_PASSWORD_HASH` with bcrypt, sets an iron-session on success, and returns 401 on failure.

## Context

- Endpoint: `src/app/api/auth/login/route.ts`
- Test file: `src/app/api/auth/login/route.test.ts` (colocated)
- `env.AUTH_USER` and `env.AUTH_PASSWORD_HASH` from `src/lib/env.ts:16`
- `getSession` from `src/lib/session.ts` (step 01)
- `bcrypt.compare` from `bcrypt`
- Request body: `{ email: string; password: string }` — JSON POST
- On success: set `session.isAuthenticated = true`, save, return `Response.json({ ok: true })` with 200
- On wrong email: return `Response.json({ error: "Credenciais inválidas" }, { status: 401 })`
- On wrong password: same 401 response (no differentiation to avoid user enumeration)
- Brief requirement: "Password hash is never exposed to client"

## Approach

1. Write failing test in `src/app/api/auth/login/route.test.ts`:
   - Mock `bcrypt.compare` to return `true`/`false` as needed
   - Test: correct credentials → 200 and session marked authenticated
   - Test: wrong email → 401
   - Test: wrong password → 401
   - Test: missing body fields → 401
   - Mock `getSession` (import from step 01) to verify `session.isAuthenticated` is set to `true`
   - Set `process.env.AUTH_USER` and `process.env.AUTH_PASSWORD_HASH` for test (already in setup.ts as defaults)
2. Confirm tests fail (`npm test -- src/app/api/auth/login/route.test.ts`)
3. Implement `src/app/api/auth/login/route.ts`:
   - `export async function POST(request: Request)`
   - Parse JSON body
   - Compare email against `env.AUTH_USER`
   - `bcrypt.compare(password, env.AUTH_PASSWORD_HASH)`
   - On match: `const session = await getSession()` → `session.isAuthenticated = true` → `await session.save()` → return 200
   - On mismatch: return 401
4. Confirm tests pass

## Acceptance

- [ ] `POST /api/auth/login` with correct credentials sets session and returns 200
- [ ] `POST /api/auth/login` with wrong email returns 401 with `"Credenciais inválidas"`
- [ ] `POST /api/auth/login` with wrong password returns 401 (same message, no user enumeration)
- [ ] `POST /api/auth/login` with missing/invalid body returns 401
- [ ] Password hash never appears in response body

## Verification

```
npm test -- src/app/api/auth/login/route.test.ts
```

## Commit

```
feat(auth): add POST /api/auth/login with bcrypt verification
```
