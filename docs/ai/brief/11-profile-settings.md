# Profile & Settings

**Type**: Feature
**Status**: Draft
**Created**: 2026-04-27

---

## Problem

No way to view or edit profiles, or manage multiple profiles. The app needs a settings screen to manage profiles (create, switch, delete) and edit the active profile's data — all of which affect body composition calculations — per spec screen #8 and brief 03's multi-profile support.

## Context

- Spec defines Profile / Settings screen: edit profile, theme toggle (`spec.md:81`)
- Multi-profile support added in `docs/ai/brief/03-multi-profile-support.md` — profiles are a collection, active profile tracked via `ACTIVE_PROFILE_ID` cookie
- API endpoints: `GET /api/profiles`, `POST /api/profiles`, `GET /api/profiles/[id]`, `PUT /api/profiles/[id]`, `DELETE /api/profiles/[id]` (from `docs/ai/brief/05-api-routes.md`)
- Theme toggle already implemented in `src/components/ui/color-mode.tsx`
- Bottom nav has "Config" link pointing to `/configuracoes`
- Profile fields drive calculations: sex (body density formula), dateOfBirth (age for BMR, body density), defaultHeight (BMI, WHtR)

## Proposal

Create `src/app/configuracoes/page.tsx`.

### Layout

**Section 1: Gerenciar Perfis** (profile management)
- List of all profiles (fetched from `GET /api/profiles`), each showing name, sex icon, date of birth
- Active profile highlighted with a checkmark or colored border
- "Novo Perfil" button — opens a creation modal/form (same fields as edit form: name, dateOfBirth, sex, defaultHeight)
- Each profile row has a menu/actions: "Selecionar" (set as active), "Editar" (opens edit form), "Excluir" (delete with confirmation)
- Delete shows confirmation dialog: "Tem certeza? Todos os registros de [name] serão perdidos."
- Deleting the last profile is allowed — clears active profile cookie, redirects to empty dashboard state
- Empty state when no profiles: "Nenhum perfil cadastrado" with "Criar Perfil" button

**Section 2: Editar Perfil Ativo** (edit active profile)
- Only shown when an active profile exists
- Nome (text input)
- E-mail (text input, readonly — sourced from `AUTH_USER` env var)
- Data de Nascimento (date picker)
- Sexo (M/F — radio buttons; labels: "Masculino" / "Feminino")
- Altura Padrão (numeric input, cm, 1 decimal, optional)
- "Salvar" button — PUT to `/api/profiles/[activeId]`

**Section 3: Aparência** (appearance)
- Theme toggle (reuse existing `<ColorModeButton>` from `src/components/ui/color-mode.tsx`)
- Label: "Tema escuro" with toggle switch

**Section 4: Sobre** (about — informational only)
- App name: "Sistema de Acompanhamento Antropométrico"
- Version number (read from `package.json` or hardcoded as "1.0.0")

### Behavior

- On mount: `GET /api/profiles` to load all profiles for the management list
- If active profile exists: `GET /api/profiles/[activeId]` to populate the edit form
- If no active profile: edit section hidden, only profile management list + create button visible
- Switching profiles: PATCH `ACTIVE_PROFILE_ID` cookie (client-side), refresh data
- Form validation:
  - Nome: required, min 2 chars
  - Data de Nascimento: required, must be in the past, user must be 1-120 years old
  - Sexo: required, must be "M" or "F"
  - Altura Padrão: optional, positive number if provided
- On save: PUT to `/api/profiles/[activeId]`, show success toast "Perfil salvo com sucesso"
- On create: POST to `/api/profiles`, show success toast, set as active, refresh list
- On delete: DELETE `/api/profiles/[id]`, remove from list, show toast. If deleted profile was active, clear cookie.
- On error: error toast with message

### Out of scope

- Changing email (auth user is fixed via env var)
- Password change
- Account deletion
- Data export (v2+)
- Measurement unit preferences (kg/lbs, cm/in) — v1 is metric only

## Acceptance Criteria

- [ ] Profile list shows all profiles with name, sex, and active indicator
- [ ] User can create a new profile via "Novo Perfil" button
- [ ] User can switch active profile by selecting from the list
- [ ] User can edit the active profile (name, dateOfBirth, sex, defaultHeight)
- [ ] User can delete any profile with confirmation dialog
- [ ] Deleting last profile is allowed; clears active profile cookie
- [ ] Edit form hidden when no active profile exists
- [ ] Save validates required fields (name, dateOfBirth, sex)
- [ ] Save sends PUT to `/api/profiles/[activeId]` with form data
- [ ] Create sends POST to `/api/profiles` with form data
- [ ] Success toast shown on successful save/create
- [ ] Validation errors shown inline in Portuguese
- [ ] Theme toggle works and persists preference
- [ ] Date of birth validation rejects future dates and unreasonable ages
- [ ] All text in Portuguese

## Risks & Trade-offs

- **Sex field changes affect historical metrics**: body fat % calculations use current profile sex — if the user changes sex in settings, all historical computed metrics reflect the new sex. This is acceptable since sex is biologically fixed for the user; a change would only happen if initially entered incorrectly.
- **Date of birth changes**: similar to sex — changes affect historical calculations. Since calculations are on-the-fly, old data stays correct relative to the corrected profile. This is the intended design (source of truth is raw measurements).

## Open Questions

- Should email be editable, or is it locked to `AUTH_USER` env var? (Assumption: locked — the auth user IS the user. The profile's email field is informational/display-only, sourced from env.)
- Should there be a "Sair" (logout) button on this screen? (Assumption: yes — common UX for settings pages. Add a logout button at the bottom that calls `/api/auth/logout`.)

## References

- `spec.md:81` — profile/settings screen specification
- `spec.md:26-33` — profile fields and their usage
- `docs/ai/brief/02-data-models.md` — Profile model schema
- `docs/ai/brief/03-multi-profile-support.md` — profile switcher, active profile cookie, multi-profile model
- `docs/ai/brief/04-authentication.md` — auth details (email from env)
- `docs/ai/brief/05-api-routes.md` — profile API endpoints (collection-based)
- `src/components/ui/color-mode.tsx` — existing theme toggle component
- `src/components/bottom-nav.tsx:1` — nav link to `/configuracoes`
