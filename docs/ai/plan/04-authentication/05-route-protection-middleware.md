# Step 05 — Route Protection Middleware

**Plan**: [`main.md`](./main.md)
**Depends on**: 01 (needs session helper)

## Objective

Create `src/middleware.ts` that redirects unauthenticated users to `/login` and authenticated users away from `/login`.

## Context

- Middleware runs on every request in Next.js App Router
- `getIronSession` works in middleware by passing request/response cookie stores
- Brief: "Check for session cookie on all routes except `/login` and `/api/auth/**`"
- Brief: "Unauthenticated requests redirect to `/login`"
- Brief: "Authenticated requests to `/login` redirect to `/`"
- Use `SESSION_COOKIE_NAME` and `sessionOptions` from `src/lib/session.ts` (step 01)
- Export a `config.matcher` to avoid running middleware on static assets (`/_next/static`, `/_next/image`, `/favicon.ico`)
- Test file: `src/middleware.test.ts`

## Approach

1. Write failing test in `src/middleware.test.ts`:
   - Import the `middleware` function and `config` from `src/middleware.ts`
   - Test: unauthenticated request to `/` → 307 redirect to `/login`
   - Test: unauthenticated request to `/medir` → 307 redirect to `/login`
   - Test: unauthenticated request to `/login` → no redirect (let through)
   - Test: authenticated request to `/login` → 307 redirect to `/`
   - Test: unauthenticated request to `/api/auth/login` → no redirect (let through)
   - Test: config.matcher excludes `/_next/static`, `/_next/image`, `/favicon.ico`
   - For each test, construct a `NextRequest` and pass to `middleware()`, asserting the response status and `Location` header
2. Confirm tests fail
3. Implement `src/middleware.ts`:
   - `getIronSession(request, response, sessionOptions)` to read session
   - Logic as described in brief
   - `config.matcher` to skip static files
4. Confirm tests pass
5. Do a manual smoke test:
   - Start `npm run dev`, visit `http://localhost:3000/` → should redirect to `/login`
   - Visit `http://localhost:3000/login` → should show login page (no redirect loop)

## Acceptance

- [ ] Unauthenticated request to any page (except `/login`) redirects to `/login`
- [ ] Unauthenticated request to `/api/auth/**` is NOT redirected
- [ ] Authenticated request to `/login` redirects to `/`
- [ ] Static assets (`_next/static`, etc.) are not intercepted by middleware

## Verification

```
npm test -- src/middleware.test.ts
```

## Commit

```
feat(auth): add route protection middleware
```

## Notes

- The matcher config must include `/login` so authenticated users get redirected away, but the middleware logic exempts unauthenticated `/login` visits
- Edge case: if session exists but `isAuthenticated` is `false`/missing, treat as unauthenticated
