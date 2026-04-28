# Plan: Project Scaffold & Foundation

**Source**: [`docs/ai/brief/01-project-scaffold.md`](../../brief/01-project-scaffold.md)
**Status**: Ready
**Created**: 2026-04-27

---

## Goal

A working Next.js application bootstrapped with TypeScript, App Router, Chakra UI (light/dark theme with system-preference toggle), MongoDB connection via Mongoose, and validated environment variables — ready for feature work in subsequent briefs.

## Context snapshot

- **Greenfield project**: no `package.json`, `src/`, or `.git/` exists at the repo root
- **Tech stack** defined in `spec.md:10-17`: Next.js App Router, Chakra UI, MongoDB/Mongoose, Recharts
- **Stack specifics** in `spec.md:19-24`: single-user auth via env-vars `AUTH_USER`, `AUTH_PASSWORD_HASH` (hashed with bcrypt); signed httpOnly cookie session
- **UX constraints** in `spec.md:85-88`: clean minimalist theme, light/dark modes, mobile-first, Portuguese (pt-BR) UI labels, Recharts charts, PWA support later
- **Commit convention** from personal `AGENTS.md`: `<type>(<scope>): <description>` (feat, fix, docs, refactor, test, chore); TDD by default; DRY/KISS; minimal comments
- **No prior plans** exist in `docs/ai/plan/` — this is the first

## Assumptions

- **Package manager**: npm (no lockfile to suggest otherwise)
- **Next.js version**: latest stable (15.x). Pinned via `--save-exact` or `"version"` without `^`/`~`.
- **Node.js**: user has Node 18+ installed
- **Chakra UI v3**: uses `@chakra-ui/react` v3 (latest major). If v2 is preferred, step 03 adapts.
- **Session library**: `iron-session` for signed cookies (used by auth brief #02, installed now for completeness)
- **Password hashing**: `bcrypt` (not argon2) — simpler setup, brief lists both as options
- **MongoDB**: connection string will point to Atlas. The app handles missing URI gracefully (log warning, skip connection).

## Execution

> Work through the steps in order. After completing a step, mark its checkbox, commit using the suggested message, then move to the next step. Do not skip ahead unless the step explicitly says it is optional.

- [x] **01** — Initialize Next.js project → [`01-init-nextjs.md`](./01-init-nextjs.md)
- [x] **02** — Install dependencies → [`02-install-dependencies.md`](./02-install-dependencies.md)
- [x] **03** — Configure Chakra UI theme → [`03-configure-theme.md`](./03-configure-theme.md)
- [x] **04** — Environment variables & database → [`04-environment-and-database.md`](./04-environment-and-database.md)
- [x] **05** — App layout shell → [`05-app-layout.md`](./05-app-layout.md)
- [x] **06** — End-to-end verification → [`06-verify.md`](./06-verify.md)

## Done when

- [x] Every step above is checked off
- [x] All acceptance criteria from the source brief pass
- [x] `npm run dev` starts the app on localhost
- [x] The app renders with Chakra UI theme applied
- [x] Dark/light mode toggle works and respects system preference
- [x] MongoDB connection succeeds on startup (or fails gracefully with a clear log)
- [x] Environment variables are validated on startup
- [x] Basic responsive layout renders on mobile and desktop viewports

## References

- `spec.md` — full project specification
- `docs/ai/brief/01-project-scaffold.md` — source brief
- `docs/ai/brief/02-data-models.md` — next brief (data models required for all features)
- `docs/ai/brief/04-authentication.md` — auth guard depends on this scaffold
