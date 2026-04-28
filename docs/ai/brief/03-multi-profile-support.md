# Multi-Profile Support

**Type**: Feature
**Status**: Draft
**Created**: 2026-04-27

---

## Problem

A single-user app with one profile cannot serve households or trainers tracking multiple people. The app needs to support creating and switching between multiple profiles, each with its own name, demographics, and measurement history — while keeping authentication simple (env-based, single login).

## Context

- Brief 02 built a single-document Profile model with an upsert enforcement hook — this brief removes it
- Measurements currently have no `profileId` foreign key — every measurement must become scoped to a profile
- Auth (`docs/ai/brief/04-authentication.md`) stays single-user via env vars — no registration, no per-profile login
- BRIEF DEPENDENCY NOTE: this brief changes models and UI infrastructure. Brief 05 (API Routes) implements the actual collection-based `/api/profiles` and `profileId`-scoped measurement endpoints described below. Briefs 06–11 consume those endpoints and must pass `profileId`.
- `spec.md:124` puts multi-user in "Out of Scope (v1)" — this feature pulls it forward

## Proposal

### Data model changes

- **Profile model**: drop the single-document pre-save hook. Profiles become a plain collection. No constraint on profile count.
- **Measurement model**: add `profileId: ObjectId` field referencing `Profile._id`. Index `{ profileId: 1, measuredAt: -1 }`.

### API design (implementation deferred to brief 05)

The APIs described here define the contract. Brief 05 implements them as route handlers.

- **`GET /api/profiles`** — list all profiles
- **`POST /api/profiles`** — create a new profile
- **`GET /api/profiles/[id]`** — get one profile. Returns 404 if not found.
- **`PUT /api/profiles/[id]`** — update a profile
- **`DELETE /api/profiles/[id]`** — delete a profile and cascade-delete all its measurements. Deleting the last profile is allowed.
- **Measurement endpoints** — all routes require `profileId` as a query parameter (GET) or body field (POST). Server validates the profile exists.

### UI changes

- **Profile switcher**: pill/chip in the bottom navigation area showing the active profile name. Tapping opens a modal listing all profiles with options to switch, create new, or delete. Switcher is hidden when no profiles exist.
- **Profile creation**: first visit after login shows an empty dashboard with a CTA to create a profile. Creating a profile is optional — the user can browse the app without one, but measurements require a profile.
- **Dashboard**: shows "Nenhum perfil selecionado" when no active profile exists. When a profile is active, shows its name and scoped measurement data.
- **All measurement screens**: scoped to active profile via `profileId` query param. Disabled/banner state when no active profile.
- **Profile settings page** (`/configuracoes`): refactored in brief 11 to support multiple profiles (list, create, delete, edit active).

### Profile switching

- Active profile ID stored in a cookie (`ACTIVE_PROFILE_ID`) so it survives page reloads.
- Switching profiles resets any in-progress form state (new measurement wizard).
- Deleting the active profile clears the cookie. If no other profiles exist, dashboard shows the empty state. If other profiles exist, the first remaining becomes active.

### Out of scope

- Per-profile authentication or passwords
- Profile avatars or images
- Sharing measurements between profiles
- Profile import/export across instances
- Any registration or multi-user auth flow (still v2 — Supabase/Auth.js)

## Acceptance Criteria

- [ ] Profile model allows creating multiple documents (single-doc hook removed)
- [ ] Measurement model includes `profileId` field with index on `{ profileId, measuredAt }`
- [ ] Profile switcher renders in bottom nav area and lists all profiles
- [ ] User can create a new profile from the switcher modal
- [ ] User can switch active profile; UI reflects the active profile's data
- [ ] Active profile ID persists in cookie across page reloads
- [ ] Switching profiles resets in-progress wizard state
- [ ] Dashboard shows "no profile" state when no active profile exists
- [ ] Switcher is hidden when zero profiles exist (no clutter)
- [ ] Deleting last profile is allowed; clears cookie, shows empty dashboard
- [ ] Auth flow is unchanged — single env-var login still gates all access
- [ ] Existing single-document profile is migrated: pre-save hook removed via schema update, no data loss

## Risks & Trade-offs

- **Model refactor mid-sequence**: brief 02 built single-doc enforcement, this brief tears it down. Confirmed acceptable — authentic sequential execution.
- **Cascade delete is irreversible**: deleting a profile wipes all its measurements. Mitigation: confirmation dialog in UI ("Tem certeza? Todos os registros deste perfil serão perdidos.").
- **Active profile cookie staleness**: if a profile is deleted, the cookie references a non-existent ID. Mitigation: validate on every request, fall back to empty state if invalid.

## Open Questions

- Migration: auto-create a default profile for users upgrading from single-profile, or require manual creation? (Assumption: prompt on first post-migration visit — "Seus dados anteriores estão sem perfil. Deseja vinculá-los a um novo perfil?" with a "Criar Perfil" button.)
- Should `defaultHeight` from the active profile auto-populate the measurement form? (Assumption: yes — same behavior, scoped to active profile.)

## References

- `spec.md:19-24` — authentication (stays single-user)
- `spec.md:26-33` — profile fields
- `spec.md:124` — multi-user out of scope for v1
- `docs/ai/brief/02-data-models.md` — Profile model (single-document hook to remove)
- `docs/ai/brief/04-authentication.md` — auth (unchanged)
- `docs/ai/brief/05-api-routes.md` — implements the API design described here
- `docs/ai/brief/11-profile-settings.md` — settings page refactored for multi-profile
