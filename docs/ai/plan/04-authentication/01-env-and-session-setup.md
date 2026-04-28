# Step 01 — Env & Session Setup

**Plan**: [`main.md`](./main.md)
**Depends on**: none

## Objective

Add `SESSION_SECRET` to env validation and env files, then create the `iron-session` helper so downstream steps can import `getSession` from `@/lib/session`.

## Context

- `src/lib/env.ts:3-7` validates `AUTH_USER`, `AUTH_PASSWORD_HASH`, `MONGODB_URI` with Zod — add a 4th field
- `.env.example:1-3` and `.env.local:1-3` both lack `SESSION_SECRET`
- `src/test/setup.ts:3-5` sets default env values for tests — add a default `SESSION_SECRET` for the test env
- `iron-session` v8.0.4: import `getIronSession` and `SessionOptions` from `iron-session`
- Session shape from brief: `{ isAuthenticated: boolean }`
- Brief risk note: "Use env var `SESSION_SECRET` with auto-generation fallback in dev"

## Approach

1. Add `SESSION_SECRET` to the Zod schema in `src/lib/env.ts` (min 1 char) with a dev-friendly message
2. Add `SESSION_SECRET=<generate with openssl rand -base64 32>` to `.env.example`
3. Add `SESSION_SECRET=dev-secret-do-not-use-in-prod` to `.env.local` (dev convenience)
4. Add `process.env.SESSION_SECRET ??= "test-session-secret"` to `src/test/setup.ts`
5. Create `src/lib/session.ts`:
   - Define a `SessionData` interface: `{ isAuthenticated: boolean }`
   - Export a `SESSION_COOKIE_NAME` constant (e.g. `"anthropometric-session"`)
   - Export `sessionOptions` config with:
     - `password`: `process.env.SESSION_SECRET || crypto.randomBytes(32).toString("base64")` (dev fallback)
     - `cookieName`: `SESSION_COOKIE_NAME`
     - `cookieOptions`: `{ httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/", maxAge: undefined }` (session cookie, no maxAge)
   - Export `getSession()` async helper wrapping `getIronSession<SessionData>(await cookies(), sessionOptions)` — callable from server components and API routes

## Acceptance

- [ ] `SESSION_SECRET` is validated at startup (missing value throws on `npm run dev`)
- [ ] `.env.example` shows `SESSION_SECRET` with generation hint
- [ ] Tests run with the default `SESSION_SECRET` from `src/test/setup.ts`
- [ ] `src/lib/session.ts` exports `getSession`, `SessionData`, `sessionOptions`, `SESSION_COOKIE_NAME`

## Verification

```
npm test
node -e "require('./src/lib/env.ts')" 2>&1 | grep -q SESSION_SECRET || echo "(will throw — expected until .env.local is updated)"
```

## Commit

```
feat(auth): add SESSION_SECRET env var and iron-session helper
```
