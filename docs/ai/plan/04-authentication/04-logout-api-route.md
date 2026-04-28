# Step 04 — Logout API Route

**Plan**: [`main.md`](./main.md)
**Depends on**: 01 (needs `getSession`)

## Objective

Create `POST /api/auth/logout` that destroys the iron-session and returns success.

## Context

- Endpoint: `src/app/api/auth/logout/route.ts`
- Test file: `src/app/api/auth/logout/route.test.ts` (colocated)
- `getSession` from `src/lib/session.ts` (step 01)
- `iron-session` v8: `session.destroy()` clears the session
- Brief: "Destroys iron-session cookie, redirects to `/login`"
- Note: Since this is an API route (not middleware), return a JSON success response. The client-side login page will handle the redirect after receiving success.

## Approach

1. Write failing test in `src/app/api/auth/logout/route.test.ts`:
   - Test: calling POST clears the session (`session.isAuthenticated` becomes `undefined` after `destroy`)
   - Test: returns 200 with success body
   - Mock `getSession` to return a session spy so we can assert `destroy()` was called
2. Confirm tests fail
3. Implement `src/app/api/auth/logout/route.ts`:
   - `export async function POST()`
   - `const session = await getSession()`
   - `session.destroy()`
   - Return `Response.json({ ok: true })` with 200
4. Confirm tests pass

## Acceptance

- [ ] `POST /api/auth/logout` destroys the session cookie
- [ ] Response is 200 with a success JSON body

## Verification

```
npm test -- src/app/api/auth/logout/route.test.ts
```

## Commit

```
feat(auth): add POST /api/auth/logout endpoint
```
