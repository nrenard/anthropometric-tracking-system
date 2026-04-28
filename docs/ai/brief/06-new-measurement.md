# New Measurement Wizard

**Type**: Feature
**Status**: Draft
**Created**: 2026-04-27

---

## Problem

No way to record body measurements. The app needs a mobile-first multi-step wizard where the user enters weight, skinfolds, perimeters, diameters, and reviews before saving — per spec screen #3.

## Context

- Spec defines a 5-step wizard: basic info → skinfolds → perimeters → diameters → review & save (`spec.md:76`)
- All numeric inputs use `inputMode="decimal"` for mobile keyboards
- Each measurement field has precision rules: weight (1 decimal kg), skinfolds (1 decimal mm), perimeters/diameters (1 decimal cm)
- Free-text notes field on each record
- Must POST to `/api/measurements` with `profileId` in body (from active profile cookie — see `docs/ai/brief/03-multi-profile-support.md`)
- Active profile's `defaultHeight` pre-populates the height field. Fetched from `/api/profiles/[activeId]`.
- Bottom nav already has "Medir" link pointing to `/medir` (`src/components/bottom-nav.tsx`)

## Proposal

Create `src/app/medir/page.tsx` with a multi-step form.

### Step Structure

1. **Básico** — weight (kg, required), height (cm, optional — prefilled from profile.defaultHeight), measured date (defaults to today), notes (text field)
2. **Dobras Cutâneas** — 7 skinfold fields (chest, midaxillary, triceps, subscapular, abdominal, suprailiac, thigh). All in mm, 1 decimal. All optional — user may skip skinfolds.
3. **Perímetros** — neck, waist, hip, abdomen, chest, arm (L/R), forearm (L/R), thigh (L/R), calf (L/R). All in cm, 1 decimal. All optional.
4. **Diâmetros** — humerus biepicondylar, femur biepicondylar. All in cm, 1 decimal. All optional.
5. **Revisar** — read-only summary of all entered values grouped by section. "Salvar" button to POST.

### Navigation

- Step indicator (Chakra `<Steps>` or custom dots at top)
- "Voltar" / "Próximo" buttons at bottom
- Data persists across steps in React state (not persisted to server until final save)
- On final save: POST to API, show success toast, redirect to `/historico/[new-id]` or `/`

### Validation

- Weight is required, must be > 0
- All other fields optional (user can record partial measurements per spec — only weight is truly required for BMI)
- Height if provided must be > 0
- measuredAt if provided must not be in the future
- Numeric fields: positive numbers only, reasonable max ranges (e.g., weight < 500kg)

### Empty States

- If no active profile set, show banner "Selecione um perfil para registrar medições" with link to profile switcher. Form disabled until a profile is selected.
- If active profile has `defaultHeight`, pre-populate height field
- If active profile exists but has no `defaultHeight`, height field is blank

### Out of scope

- Editing an existing measurement through the wizard (separate brief or reuse wizard with pre-filled data)
- Auto-saving drafts
- Multiple skinfold readings with auto-averaging (v2+ per spec)

## Acceptance Criteria

- [ ] User can navigate through all 5 steps with back/next buttons
- [ ] Weight is the only required field; form can be submitted with only weight
- [ ] All numeric inputs show decimal keyboard on mobile (`inputMode="decimal"`)
- [ ] Fields accept values with 1 decimal place
- [ ] Notes field accepts free text
- [ ] Review step displays all entered values grouped by section (basic, skinfolds, perimeters, diameters)
- [ ] On save, POSTs to `/api/measurements` and redirects on success
- [ ] Validation errors show inline messages in Portuguese
- [ ] Step indicator highlights current step and shows progress

## Risks & Trade-offs

- **State loss on navigation**: if user hits browser back or accidentally navigates away, wizard state is lost. Mitigation: warn before leaving (beforeunload) if form has data.
- **Large form on mobile**: 7+ skinfold fields, 13+ perimeter fields, 2 diameter fields. The wizard step pattern keeps each screen manageable, but step 3 (perimeters) is the largest. Consider splitting perimeters into upper/lower body sub-steps if testing shows it's too long.

## Open Questions

- Should skinfold/perimeter/diameter fields show reference images of measurement sites? (Assumption: no for v1 — text labels only, images could be added later.)
- After save, redirect to measurement detail or back to dashboard? (Assumption: `/historico` list with success toast.)

## References

- `spec.md:39-56` — measurement fields and protocols
- `spec.md:76` — new measurement screen spec
- `spec.md:85-88` — mobile-first UX guidelines
- `docs/ai/brief/03-multi-profile-support.md` — active profile cookie, profileId scoping
- `docs/ai/brief/05-api-routes.md` — API endpoints this screen depends on
- `docs/ai/brief/02-data-models.md` — Measurement model structure
- `src/components/bottom-nav.tsx:1` — nav link to `/medir`
