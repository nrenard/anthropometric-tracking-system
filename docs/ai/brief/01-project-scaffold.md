# Project Scaffold & Foundation

**Type**: Feature
**Status**: Draft
**Created**: 2026-04-27

---

## Problem

No project exists yet. Before any feature can be built, a working Next.js application with the full dependency stack, theme infrastructure, database connection, and environment configuration must be in place.

## Context

`spec.md` defines the tech stack: Next.js (App Router) + Chakra UI for the frontend, Next.js API Routes for the backend, MongoDB via Mongoose for persistence, and Recharts for charting. The UI is mobile-first with a clean minimalist theme supporting light and dark modes (respects system preference, with manual toggle). Portuguese (pt-BR) is the UI language; all code is in English.

- `spec.md:10-17` — defines the stack
- `spec.md:85-88` — defines UX & design constraints

## Proposal

Initialize a Next.js project with TypeScript and the App Router. Install all dependencies specified in the spec: Chakra UI, Recharts, Mongoose, bcrypt/argon2, and any other needed libraries. Configure Chakra UI with a light/dark theme that respects `prefers-color-scheme` and provides a manual toggle. Set up MongoDB connection via Mongoose with connection string from environment variables. Define the environment variable schema (AUTH_USER, AUTH_PASSWORD_HASH, MONGODB_URI). Create the basic app layout with bottom navigation for mobile and a root-level theme provider.

Scaffold the following directory structure:

```
src/
  app/           # App Router pages & layouts
  lib/           # Utilities, DB connection, auth helpers
  models/        # Mongoose models
  components/    # Shared UI components
  hooks/         # Custom React hooks
  theme/         # Chakra theme configuration
```

### Out of scope

- Any feature screens or business logic
- Data models (Mongoose schemas)
- Authentication middleware (just the session utility skeleton)
- PWA/offline support (may be its own brief)

## Acceptance Criteria

- [x] `npm run dev` starts the app on localhost
- [x] The app renders with Chakra UI theme applied
- [x] Dark/light mode toggle works and respects system preference
- [x] MongoDB connection succeeds on startup (or fails gracefully with a clear log)
- [x] Environment variables are validated on startup
- [x] Basic responsive layout renders on mobile and desktop viewports

## Risks & Trade-offs

- **Missing dependencies discovered later**: Mitigation — install all known deps from `spec.md` upfront (chakra, recharts, mongoose, bcrypt, etc.)
- **Next.js version drift**: Mitigation — pin exact versions in `package.json`
- **Vercel vs. local env parity**: Mitigation — use `.env.local` with same shape as production env vars

## Open Questions

- None — `spec.md` is unambiguous on stack and configuration.

## References

- `spec.md` — full project specification
- `docs/ai/brief/02-data-models.md` — next brief in sequence (data models)
- `docs/ai/brief/03-multi-profile-support.md` — depends on data models
- `docs/ai/brief/04-authentication.md` — auth guard depends on this scaffold
