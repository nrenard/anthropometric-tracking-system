# Plan: Profile Settings Page

**Source**: `docs/ai/brief/11-profile-settings.md`
**Status**: Ready
**Created**: 2026-05-02

---

## Goal

Build `src/app/configuracoes/page.tsx` — a settings screen with four sections: profile list & management, edit active profile form with validation, theme toggle, and app info. All text in Portuguese.

## Context snapshot

- App Router — pages are `"use client"` components importing `<BottomNav />` explicitly (`src/components/bottom-nav.tsx:27-47`)
- Profiles REST API — 5 endpoints at `/api/profiles/` with `ensureAuthenticated()` guard (`src/app/api/profiles/route.ts:10`, `src/app/api/profiles/[id]/route.ts:15`)
- Active profile state — `useActiveProfile()` hook exposes `profiles`, `activeProfileId`, `activeProfile`, `setActiveProfileId`, `refreshProfiles` (`src/hooks/use-active-profile.ts`, `src/lib/profile-context.tsx:14-21`)
- Cookie utility — `setActiveProfileId()` writes `document.cookie` with 30-day max-age (`src/lib/cookies.ts:5`)
- Form pattern — raw `useState` per field + manual validation + Chakra UI; no form library (`src/components/profile-form.tsx:116`)
- Toast — Chakra `toaster.create({ title, type })` (`src/components/ui/toaster.tsx:12`)
- Theme toggle — `ColorModeButton` exists at `src/components/ui/color-mode.tsx:51`
- Auth — single-user via `AUTH_USER` env var; logout at `POST /api/auth/logout` (`src/app/api/auth/logout/route.ts:7`)
- Test framework — Vitest + Testing Library; page tests co-located (`*.test.tsx`); sessions mocked via `vi.mock("@/lib/session")`; toasts mocked via `vi.mock("@/components/ui/toaster")`
- Zod validation — `profileSchema` at `src/lib/validation.ts:3` validates profile fields server-side; can be reused client-side for form validation

## Assumptions

- Email field is locked (readonly) — sourced from profile data (populated server-side from `AUTH_USER` env var)
- Logout button added at page bottom — calls `POST /api/auth/logout` then redirects to `/login`
- Version number hardcoded as `"1.0.0"`
- Date picker uses native `<input type="date">` with Chakra `Input` styling
- "Editar" action on a profile row sets that profile as active (via `setActiveProfileId`), which then populates the Section 2 edit form
- Profile management UI lives directly in the page file; extraction into components deferred until duplication emerges

## Execution

> Work through the steps in order. After completing a step, mark its checkbox, commit using the suggested message, then move to the next step. Do not skip ahead unless the step explicitly says it is optional.

- [x] **01** — Profile list and management → [`01-profile-list-and-management.md`](./01-profile-list-and-management.md)
- [x] **02** — Edit active profile form → [`02-edit-active-profile-form.md`](./02-edit-active-profile-form.md)
- [x] **03** — Appearance, about, and logout → [`03-appearance-about-logout.md`](./03-appearance-about-logout.md)
- [x] **04** — Verify acceptance criteria → [`04-verify-acceptance-criteria.md`](./04-verify-acceptance-criteria.md)

## Done when

- [x] Every step above is checked off
- [x] All 15 acceptance criteria from the source brief pass
- [x] `npm test` full suite green (existing + new tests)
- [x] TypeScript compilation clean (`npx tsc --noEmit`)

## References

- `docs/ai/brief/11-profile-settings.md`
- `docs/ai/brief/03-multi-profile-support.md`
- `docs/ai/brief/05-api-routes.md`
- `src/hooks/use-active-profile.ts`
- `src/lib/cookies.ts`
- `src/lib/validation.ts`
- `src/components/ui/toaster.tsx`
- `src/components/ui/color-mode.tsx`
- `src/components/profile-form.tsx`
- `src/app/api/profiles/route.ts`
- `src/app/api/profiles/[id]/route.ts`
- `src/app/api/auth/logout/route.ts`
