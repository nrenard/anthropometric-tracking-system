# Plan: Authentication (Login + Session)

**Source**: `docs/ai/brief/04-authentication.md`
**Status**: Ready
**Created**: 2026-04-27

---

## Goal

Add single-user login with bcrypt password verification and iron-session httpOnly cookies. All app routes are protected behind a login page at `/login`; unauthenticated users are redirected there.

## Context snapshot

- Auth primitives (`bcrypt`, `iron-session`) installed but unused — `package.json:22-23`
- `AUTH_USER` and `AUTH_PASSWORD_HASH` validated at startup — `src/lib/env.ts:4-5`
- No `SESSION_SECRET` env var yet — missing from `.env.example`, `.env.local`, and `src/lib/env.ts`
- No middleware, no login page, no session helper, no API routes exist
- Profiles are a collection with active-profile cookie (`cookies.ts:1:1`) — auth is orthogonal, one login gates all profiles
- Root layout wraps children in `Provider → StartupRunner → ProfileProvider` — `src/app/layout.tsx:15-17`
- Test framework is Vitest + jsdom + @testing-library/react — `vitest.config.ts:5-6`, test setup at `src/test/setup.ts:1:3`
- Tests colocate alongside sources (`*.test.ts`, `*.test.tsx`); env defaults set in `src/test/setup.ts:3-5`

## Assumptions

- Session secret auto-generates in dev when `SESSION_SECRET` is unset (per brief risk note)
- No "remember me" — session lasts until browser close or logout
- Production will require an explicit `SESSION_SECRET` env var

## Execution

> Work through the steps in order. After completing a step, mark its checkbox, commit using the suggested message, then move to the next step. Do not skip ahead unless the step explicitly says it is optional.

- [x] **01** — Env & Session Setup → [`01-env-and-session-setup.md`](./01-env-and-session-setup.md)
- [x] **02** — Password Hash Utility → [`02-password-hash-utility.md`](./02-password-hash-utility.md)
- [ ] **03** — Login API Route → [`03-login-api-route.md`](./03-login-api-route.md)
- [ ] **04** — Logout API Route → [`04-logout-api-route.md`](./04-logout-api-route.md)
- [ ] **05** — Route Protection Middleware → [`05-route-protection-middleware.md`](./05-route-protection-middleware.md)
- [ ] **06** — Login Page → [`06-login-page.md`](./06-login-page.md)

## Done when

- [ ] Every step above is checked off
- [ ] All acceptance criteria from the source brief pass
- [ ] `npm test` is green
- [ ] `npm run lint` is green
- [ ] `npm run build` succeeds

## References

- `docs/ai/brief/04-authentication.md` — source brief
- `docs/ai/plan/03-multi-profile-support/main.md` — prior completed plan (profiles, bottom nav)
- `src/lib/env.ts` — env validation to extend
- `src/lib/cookies.ts` — existing cookie pattern
- `src/app/layout.tsx` — root layout
- `spec.md:19-24` — authentication specification
