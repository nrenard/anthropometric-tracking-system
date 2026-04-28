# Authentication (Login + Session)

**Type**: Feature
**Status**: Draft
**Created**: 2026-04-27

---

## Problem

No login flow exists. The app needs single-user authentication per spec: credentials stored in env vars, bcrypt password verification, and an httpOnly signed session cookie to protect all routes.

## Context

- Auth model defined in `spec.md:19-24`: single-user, no registration, env-based credentials
- `AUTH_USER` and `AUTH_PASSWORD_HASH` validated at startup by `src/lib/env.ts:1`
- `bcrypt` (v5.1.1) and `iron-session` (v8.0.4) already installed but not wired up
- No middleware, no login page, no session helpers exist yet
- Multi-profile support (brief 03) is in place — profiles are a collection with an active profile cookie. Auth is orthogonal: one login gates all profiles.
- Bottom nav links assume user is logged in — routes must be protected
- After login, user lands on dashboard. If no profile exists yet, dashboard shows an empty state with a CTA to create one (no forced profile creation).

## Proposal

### Login Page

Create `src/app/login/page.tsx`:
- Email + password form (Chakra UI inputs, pt-BR labels: "E-mail", "Senha")
- Form validates non-empty fields client-side
- POST to `/api/auth/login`
- On success: redirect to `/` (dashboard)
- On failure: error toast "Credenciais inválidas"
- No registration link/screen (out of scope v1)

### API Route

Create `src/app/api/auth/login/route.ts` (POST):
- Reads `AUTH_USER` and `AUTH_PASSWORD_HASH` from env
- Compares email against `AUTH_USER`
- Uses `bcrypt.compare` to check password against hash
- On match: creates iron-session with `{ isAuthenticated: true }`, sets httpOnly cookie
- On mismatch: returns 401

Create `src/app/api/auth/logout/route.ts` (POST):
- Destroys iron-session cookie
- Redirects to `/login`

### Session Helper

Create `src/lib/session.ts`:
- Configure iron-session with secret from env (or generated at build time)
- Export `getSession()` and `withSession()` helpers
- Session shape: `{ isAuthenticated: boolean }`

### Route Protection

Create `src/middleware.ts`:
- Check for session cookie on all routes except `/login` and `/api/auth/**`
- Unauthenticated requests redirect to `/login`
- Authenticated requests to `/login` redirect to `/`

### Out of scope

- Multi-user auth with registration flow (v2+ — Supabase/Auth.js per spec)
- OAuth / social login
- Rate limiting on login attempts (v1 is single-user, local)
- Password reset / forgot password

## Acceptance Criteria

- [ ] Unauthenticated user visiting any page is redirected to `/login`
- [ ] Login with correct env credentials redirects to `/` and sets session
- [ ] Login with wrong credentials shows error toast, stays on login page
- [ ] Session persists across page navigations (iron-session cookie)
- [ ] Logout clears session and redirects to `/login`
- [ ] Authenticated user visiting `/login` is redirected to `/`
- [ ] Password hash is never exposed to client (bcrypt compare on server only)
- [ ] Empty email/password shows client-side validation error

## Risks & Trade-offs

- **Session secret management**: iron-session needs a secret. Use env var `SESSION_SECRET` with auto-generation fallback in dev. In production, must be set explicitly.
- **No CSRF**: iron-session cookies are httpOnly and signed, but API routes should still validate session on every request (no implicit trust of cookie presence).

## Open Questions

- Should there be a "remember me" / persistent session option? (Assumption: no — session lasts until browser close or logout, simple for v1.)

## References

- `spec.md:19-24` — authentication specification
- `src/lib/env.ts:1` — env validation (AUTH_USER, AUTH_PASSWORD_HASH already validated)
- `src/components/bottom-nav.tsx:1` — nav links to protected routes
- `docs/ai/brief/01-project-scaffold.md` — prior completed brief
- `docs/ai/brief/02-data-models.md` — prerequisite
- `docs/ai/brief/03-multi-profile-support.md` — profiles are a collection, auth is orthogonal
