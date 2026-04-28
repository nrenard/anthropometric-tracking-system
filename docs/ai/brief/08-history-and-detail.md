# History List & Measurement Detail

**Type**: Feature
**Status**: Draft
**Created**: 2026-04-27

---

## Problem

No way to browse past measurements or view a single measurement in detail. Spec screens #4 (History) and #5 (Measurement Detail) need a chronological list with filters, edit/delete actions, and a full detail view with raw + computed metrics.

## Context

- Spec defines History as chronological list with period filters, edit/delete (`spec.md:77`)
- Spec defines Detail as all raw values + computed metrics on one screen (`spec.md:78`)
- Both screens are tightly coupled — detail is a click-through from history
- Measurements scoped to active profile: `GET /api/measurements?profileId=[activeId]` with `from`/`to` query params
- Profile fetched from `GET /api/profiles/[activeId]` for sex, age, defaultHeight (needed for computed metrics)
- Bottom nav has "Histórico" link pointing to `/historico`
- Calculation functions from `docs/ai/brief/02-data-models.md`

## Proposal

### History List (`src/app/historico/page.tsx`)

**Layout**: chronological list (newest first) of measurement summaries.

**Each list item shows**:
- Date (formatted: "DD/MM/YYYY HH:mm")
- Weight (bold)
- Body fat % (if skinfolds recorded)
- BMI
- Notes preview (truncated to 1 line)
- Action buttons: edit (pencil icon), delete (trash icon)

**Period filters**: chip/tab bar at top — "7 dias", "30 dias", "90 dias", "6 meses", "1 ano", "Tudo"
- Filters map to `from`/`to` query params on API call
- Active filter highlighted

**Empty state**: "Nenhuma medição registrada" with CTA to `/medir`

**Delete**: confirmation dialog (Chakra `<AlertDialog>`) — "Tem certeza que deseja excluir esta medição?" — on confirm, DELETE to API, remove from list, show toast.

**Edit**: navigates to edit page (see Open Questions below).

### Measurement Detail (`src/app/historico/[id]/page.tsx`)

**Sections**, each as a card/chunk:

1. **Básico** — weight, height, measured date, notes
2. **Dobras Cutâneas** — 7 skinfold values in a grid
3. **Perímetros** — all perimeters, L/R values side by side where applicable
4. **Diâmetros** — humerus, femur
5. **Métricas Calculadas** — BMI, body density, body fat %, fat mass, lean mass, bone mass (Matiegka), muscle mass, waist-to-hip, waist-to-height, BMR

**Actions**: edit button, delete button (with confirmation), back link to history list.

**Loading/404/No Profile**: skeleton loading, "Medição não encontrada" for invalid IDs. If no active profile, show "Selecione um perfil para ver o histórico".

### Computed Metrics Display

- Call `computeAllMetrics(measurement, profile)` on the client
- Fetch profile from `/api/profiles/[activeId]` for sex, age, defaultHeight
- Show "—" for metrics that can't be computed (e.g., body fat % if no skinfolds)

### Out of scope

- Inline editing on the detail page — editing goes through an edit page or reuses the wizard
- Comparison view on detail (that's `docs/ai/brief/09-compare.md`)
- Export/print measurement

## Acceptance Criteria

- [ ] History list shows all measurements for active profile in descending date order
- [ ] History shows "no profile" state when no active profile
- [ ] Period filter chips filter the list by date range
- [ ] Each list item shows date, weight, BF%, BMI, notes preview
- [ ] Delete shows confirmation dialog and removes measurement on confirm
- [ ] Detail page displays all raw values grouped by section
- [ ] Detail page computes and displays all metrics from spec
- [ ] Metrics show "—" when required input is missing (e.g., no skinfolds → no BF%)
- [ ] Empty state shows CTA when no measurements match filter
- [ ] 404 state for invalid measurement IDs
- [ ] All text in Portuguese

## Risks & Trade-offs

- **Metrics require profile**: body fat % depends on age and sex from profile. If profile doesn't exist, metrics using sex/age show "—". This is acceptable — the user should complete profile first.
- **Performance with many measurements**: single-user app, unlikely to have thousands of records within a year. Pagination not needed for v1, but period filters keep lists manageable.

## Open Questions

- How should "edit" work? (1) Reuse the measurement wizard with pre-populated fields, or (2) a simpler single-page edit form? (Assumption: reuse wizard — consistent UX, less code. This means the wizard from `docs/ai/brief/06-new-measurement.md` should accept an optional `editMeasurementId` prop or query param.)
- Should the detail page show a mini weight trend sparkline to give context for this measurement? (Assumption: no for v1 — full charts on `/graficos`.)

## References

- `spec.md:77-78` — history and detail screen specs
- `spec.md:39-70` — all measurement fields and calculations
- `docs/ai/brief/02-data-models.md` — calculations module
- `docs/ai/brief/03-multi-profile-support.md` — active profile cookie, profile scoping
- `docs/ai/brief/05-api-routes.md` — API endpoints
- `docs/ai/brief/06-new-measurement.md` — wizard (may be reused for editing)
- `src/components/bottom-nav.tsx:1` — nav link to `/historico`
