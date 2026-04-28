# Compare Measurements

**Type**: Feature
**Status**: Draft
**Created**: 2026-04-27

---

## Problem

No way to compare two measurements side by side. Users need to see absolute and percentage deltas across all metrics to understand progress between any two points in time — per spec screen #6.

## Context

- Spec defines Compare screen: pick two measurements, show absolute and % deltas across all metrics (`spec.md:79`)
- API supports `GET /api/measurements?profileId=[activeId]` (list for pickers) and `GET /api/measurements/[id]` (fetch two selected)
- Profile fetched from `GET /api/profiles/[activeId]` for sex/age (needed for body fat % and BMR)
- Calculation functions from `docs/ai/brief/02-data-models.md`
- No bottom nav link for Compare — accessible from history or detail screen (per spec, not listed in bottom nav)

## Proposal

Create `src/app/comparar/page.tsx`.

### Layout

**Top**: two measurement pickers side by side (or stacked on narrow mobile):
- Each is a dropdown/select or a modal picker showing measurement list (date + weight)
- Labeled "Medição A" and "Medição B"
- Default: latest two measurements auto-selected if available

**Below pickers**: comparison table with the following grouped sections:

1. **Básico** — weight, height
2. **Dobras Cutâneas** — 7 skinfold sites
3. **Perímetros** — all perimeters (L/R shown separately)
4. **Diâmetros** — humerus, femur
5. **Métricas Calculadas** — BMI, body density, body fat %, fat mass, lean mass, bone mass, muscle mass, WHR, WHtR, BMR

### Table Format

| Campo | Medição A | Medição B | Δ Absoluto | Δ % |
|---|---|---|---|---|
| Peso | 80.5 kg | 79.0 kg | -1.5 kg | -1.9% |
| ... | ... | ... | ... | ... |

### Delta Display

- **Absolute delta**: `B - A` (negative = decrease)
- **Percentage delta**: `((B - A) / A) * 100`
- Color coding: green for "improvement" direction (weight down, lean mass up), red for opposite
- Metrics that exist in only one measurement show "—" for delta

### Computing Metrics

- Fetch profile from `/api/profiles/[activeId]` for sex/age (needed for body fat % and BMR)
- Call `computeAllMetrics` for both measurements
- Compare computed values, not raw

### Empty / Incomplete States

- If fewer than 2 measurements exist for active profile: show message "Registre pelo menos duas medições para comparar" with CTA to `/medir`
- If no active profile: show "Selecione um perfil para comparar medições"
- If only one measurement selected: disable the compare table, show prompt to select second

### Out of scope

- Comparing more than 2 measurements at once
- Visual diff (colored cells in table)
- Exporting comparison
- Selecting which metrics to show/hide

## Acceptance Criteria

- [ ] Two measurement pickers allow selecting any two measurements from active profile's history
- [ ] Default selection: latest two measurements auto-selected
- [ ] "No profile" state shown when no active profile
- [ ] Comparison table shows all raw fields and computed metrics
- [ ] Each row shows absolute delta and percentage delta
- [ ] Metrics missing from one measurement show "—" for delta
- [ ] Color coding indicates direction of change (green = improved, red = worsened)
- [ ] If fewer than 2 measurements exist, user sees guidance message
- [ ] All text in Portuguese

## Risks & Trade-offs

- **Comparison depends on profile**: body fat % and BMR need sex/age from profile. If profile is missing, those computed metrics show "—" in both columns. This is acceptable but should be clear to the user.
- **Metric interpretation**: "improvement" direction is subjective — weight loss might be positive for one user and negative for another. Color coding is a heuristic (lower weight/BF = green) — the user interprets context. Avoid labeling as "better/worse."

## Open Questions

- Should the compare screen be accessible from bottom nav, or only from history and detail? (Assumption: accessible from history list via a "Comparar" action/mode, plus a link from the detail page footer. Not in bottom nav to keep it at 4 items.)
- Period filters on the measurement pickers? (Assumption: no — pickers show all measurements, sorted by date. The list is unlikely to be unwieldy for single-user use.)

## References

- `spec.md:79` — compare screen specification
- `docs/ai/brief/02-data-models.md` — calculations module
- `docs/ai/brief/03-multi-profile-support.md` — active profile cookie, profile scoping
- `docs/ai/brief/05-api-routes.md` — API endpoints
- `docs/ai/brief/08-history-and-detail.md` — history list (picker source, navigation origin)
