# Step 01 — Auth helpers (`requireAuth`, `getActiveProfileId`)

**Plan**: [`main.md`](./main.md)
**Depends on**: none

## Objective

Create `src/lib/auth.ts` with two exported functions: `requireAuth()` to gate endpoints on an authenticated session, and `getActiveProfileId()` to extract and validate the `ACTIVE_PROFILE_ID` cookie from a request.

## Context

- `src/lib/session.ts:26` exports `getSession()` returning `{ isAuthenticated?: boolean }`
- `src/app/api/auth/login/route.ts:37-39` shows the pattern: `const session = await getSession(); session.isAuthenticated = true; await session.save()`
- Cookie name `ACTIVE_PROFILE_ID` is set client-side via `src/lib/cookies.ts:1`
- The middleware (`src/middleware.ts`) already redirects unauthenticated users, but API routes should still enforce auth defensively since middleware can be bypassed
- Tests co-locate with source: `src/lib/auth.test.ts`
- Use `vi.mock("@/lib/session")` in tests to mock `getSession`
- Portuguese error messages: `"Sessão expirada"`, `"ID do perfil é obrigatório"`, `"Perfil não encontrado"`

## Approach

1. Write failing tests in `src/lib/auth.test.ts`:
   - `requireAuth` returns session when `isAuthenticated` is true
   - `requireAuth` throws with status 401 and pt-BR message when session missing or `isAuthenticated` is false
   - `getActiveProfileId` returns profile ID when cookie exists and is a non-empty string
   - `getActiveProfileId` throws with status 400 when cookie is missing
   - `getActiveProfileId` throws with status 400 when cookie is empty string
2. Confirm tests fail (no module yet)
3. Create `src/lib/auth.ts`:
   - `requireAuth(session: SessionData): asserts session is { isAuthenticated: true }` — throws `Response`-like error with `{ error: "Sessão expirada" }` and status 401
   - `getActiveProfileId(request: Request): string` — reads `ACTIVE_PROFILE_ID` cookie from request headers, throws `{ error: "ID do perfil é obrigatório" }` with status 400 if missing/empty, returns the value
4. Confirm tests pass
5. Refactor: ensure error shape is consistent (always `{ error: string }`)

## Acceptance

- [ ] `src/lib/auth.ts` exports `requireAuth` and `getActiveProfileId`
- [ ] `requireAuth` rejects unauthenticated sessions with 401 and Portuguese message
- [ ] `getActiveProfileId` extracts cookie from `Request` headers, rejects missing/empty with 400
- [ ] Tests pass: `npm test -- src/lib/auth.test.ts`

## Verification

```bash
npm test -- src/lib/auth.test.ts
```

## Commit

```
feat(auth): add requireAuth and getActiveProfileId helpers
```
