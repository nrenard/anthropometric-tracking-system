# Step 03 — Latest Measurement Summary

**Plan**: [`main.md`](./main.md)
**Depends on**: 01

## Objective

Create a `<LatestMeasurementSummary>` component showing a greeting with the profile name, the latest measurement date/weight/BF%/notes excerpt, and a link to the full measurement detail.

## Context

- Greeting format: "Olá, [profileName]"
- Latest measurement display: date (DD/MM/YYYY), weight (xx.x kg), body fat % (xx.x%), notes excerpt (first 80 characters)
- "Ver detalhes" link → `/historico/[measurementId]` (use `_id` or `id` from the measurement object)
- Uses `computeAllMetrics` from `src/lib/calculations.ts:152` for BF%
- Styling: Chakra `Box` card with border, shadow, rounded corners — follow existing card patterns in codebase (e.g., profile-form dialog style)
- Component location: `src/components/dashboard/latest-summary.tsx`
- No props needed if step 04/05 will pass data — design props as `{ profile: ProfileInput; measurement: MeasurementInput }`

## Approach

1. Write failing test at `src/components/dashboard/latest-summary.test.tsx`:
   - Render with sample profile + measurement
   - Assert "Olá, João" heading
   - Assert date, weight, BF%, notes excerpt visible
   - Assert "Ver detalhes" link has correct href
   - Test null measurement → empty state (e.g., "Nenhuma medição")
2. Confirm test fails.
3. Create `src/components/dashboard/latest-summary.tsx`:
   - Props: `{ profile?: ProfileInput; measurement?: MeasurementInput }`
   - Compute BF% via `computeAllMetrics(measurement, profile)`
   - Format date with `toLocaleDateString("pt-BR")`
   - Truncate notes to 80 chars with `…` if longer
   - Render greeting `Heading`, detail list/stack, `Link` to `/historico/[id]`
4. Confirm tests pass.
5. Refactor: extract date formatter, extract notes truncation helper.

## Acceptance

- [ ] Shows "Olá, [profile.name]" greeting heading
- [ ] Displays measurement date in DD/MM/YYYY format
- [ ] Displays weight with "kg" unit
- [ ] Displays body fat % with "%" unit
- [ ] Displays notes excerpt truncated at 80 characters
- [ ] "Ver detalhes" link points to `/historico/[measurement._id]`
- [ ] Empty state renders when measurement is undefined

## Verification

```
npm test -- src/components/dashboard/latest-summary.test.tsx
```

## Commit

```
feat(dashboard): add LatestMeasurementSummary component
```
