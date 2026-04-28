# Plan: Multi-Profile Support

**Source**: `docs/ai/brief/03-multi-profile-support.md`
**Status**: Ready
**Created**: 2026-04-27

---

## Goal

Convert Profile from a single-document model to a named collection, add `profileId` foreign key to Measurement, and build UI infrastructure for creating/switching profiles — so multiple people can be tracked within one login session. Actual REST API routes are deferred to brief 05.

## Context snapshot

- Profile model enforces single-doc via `SINGLETON_ID` + `findOneAndUpsert()` at `src/models/profile.ts:1` — must become a plain collection with auto `_id`
- Measurement model has no `profileId` field — needs `profileId: ObjectId` + compound index at `src/models/measurement.ts:47`
- No API routes exist (`src/app/api/` missing) — brief 05 builds them; this plan builds models + UI infrastructure
- No auth yet (brief 04) — profile switcher will be accessible without login guard for now
- BottomNav exists at `src/components/bottom-nav.tsx:1` — profile switcher pill goes in this area
- Dashboard is placeholder at `src/app/page.tsx:1` — needs "no profile" and "active profile" states
- No state management exists — need React context + cookie util for active profile
- E2E test at `src/lib/e2e.test.ts:31` calls `findOneAndUpsert` — must refactor
- Prior plan `02-data-models` built the single-doc constraint this plan removes — authentic sequential execution

## Assumptions

- **Server actions, not REST API**: since brief 05 hasn't built API routes yet, profile CRUD in the UI uses Next.js server actions that call Mongoose models directly. When brief 05 is complete, the UI transitions to `fetch(/api/profiles)`.
- **Client-side cookie**: use `document.cookie` for `ACTIVE_PROFILE_ID` (no library). The `iron-session` package is for auth cookies only (brief 04).
- **Migration prompt**: existing data (measurements without profileId) will need a migration in a later brief. This plan does not auto-create a default profile — it removes the single-doc constraint and adds the field. Migration UX deferred to brief 07 (dashboard) per the open question.
- **defaultHeight auto-populate**: yes, from active profile — UI concern, no model change needed.
- **`/config` route in bottom nav**: brief 11 specifies `/configuracoes`. This plan updates the nav label to `Perfis` and changes the route to point to the future `/configuracoes` page. The actual settings page is built in brief 11.

## Execution

> Work through the steps in order. After completing a step, mark its checkbox, commit using the suggested message, then move to the next step. Do not skip ahead unless the step explicitly says it is optional.

- [x] **01** — Refactor Profile model to a plain collection → [`01-refactor-profile-model.md`](./01-refactor-profile-model.md)
- [x] **02** — Add profileId to Measurement model → [`02-add-profileid-to-measurement.md`](./02-add-profileid-to-measurement.md)
- [x] **03** — Create profile state management (context + cookie) → [`03-profile-state-management.md`](./03-profile-state-management.md)
- [x] **04** — Build profile switcher with modal → [`04-profile-switcher.md`](./04-profile-switcher.md)
- [x] **05** — Update dashboard and bottom nav → [`05-dashboard-and-bottom-nav.md`](./05-dashboard-and-bottom-nav.md)

## Done when

- [x] Every step above is checked off
- [x] All acceptance criteria from the source brief pass
- [x] Tests and lint/build are green
- [x] Profile model allows multiple documents (single-doc constraint removed)
- [x] Measurement model has `profileId` with compound index
- [x] Profile switcher renders in bottom nav area with active profile name
- [x] User can create, switch, and delete profiles from switcher modal
- [x] Active profile ID persists in cookie across page reloads
- [x] Dashboard shows appropriate states (no profile / active profile)
- [x] Switcher is hidden when zero profiles exist

## References

- `docs/ai/brief/03-multi-profile-support.md` — source brief
- `docs/ai/brief/02-data-models.md` — prior brief (built models we refactor)
- `docs/ai/brief/04-authentication.md` — next brief (auth, unchanged by this plan)
- `docs/ai/brief/05-api-routes.md` — implements REST API for profiles/measurements
- `docs/ai/brief/11-profile-settings.md` — settings page refactored for multi-profile
- `src/models/profile.ts` — current Profile model (refactored in step 01)
- `src/models/measurement.ts` — current Measurement model (extended in step 02)
- `src/models/profile.test.ts` — needs rewrite for multi-doc behavior
- `src/models/measurement.test.ts` — needs profileId assertions
- `src/lib/e2e.test.ts` — uses `findOneAndUpsert`, needs refactor
- `src/components/bottom-nav.tsx` — bottom nav wired in step 05
- `src/app/page.tsx` — dashboard states in step 05
- `src/lib/validation.ts` — Zod schemas (profile ok, measurement may need profileId)
