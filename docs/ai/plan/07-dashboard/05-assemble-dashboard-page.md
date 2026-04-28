# Step 05 — Assemble Dashboard Page

**Plan**: [`main.md`](./main.md)
**Depends on**: 01, 02, 03, 04

## Objective

Replace the placeholder `src/app/page.tsx` with a full dashboard that composes the hook and all components, covering all five states: loading skeleton, no-profile empty, no-measurements empty, dashboard data loaded, and error.

## Context

- Current page at `src/app/page.tsx:1` — already has `"use client"`, imports Chakra components, uses `useActiveProfile`, renders bottom nav. Preserve existing test structure where possible, extend it.
- Existing tests at `src/app/page.test.tsx:1` — test 3 states (loading, active profile, no profile). These must still pass.
- New states to handle:
  1. **Loading**: show `<Skeleton>` / `<SkeletonText>` placeholders for cards and chart (not just "Carregando…" text)
  2. **No profile**: same as current — "Nenhum perfil selecionado" + "Criar Perfil" CTA (already tested)
  3. **Empty measurements**: profile selected but 0 measurements → "Registre sua primeira medição" + link to `/medir`
  4. **Dashboard loaded**: render `<LatestMeasurementSummary>` + `<MetricCards>` + `<WeightChart>`
  5. **Error**: show error message with retry option
- Import path for dashboard components: `@/components/dashboard/metric-cards`, `@/components/dashboard/weight-chart`, `@/components/dashboard/latest-summary`
- Import path for hook: `@/hooks/use-dashboard-data`
- Keep `ProfileForm` inline dialog for "Criar Perfil" CTA (already working)
- Keep color mode button and bottom nav (already rendered)

## Approach

1. Update tests at `src/app/page.test.tsx`:
   - Add test: loading state shows skeleton elements (not just "Carregando…")
   - Add test: empty measurements shows CTA "Registre sua primeira medição" with link to `/medir`
   - Add test: dashboard data loaded shows metric cards, chart, and summary
   - Add test: error state shows error message
   - Mock `useDashboardData` hook (or mock `fetch`) to control states
   - Ensure existing 3 tests still pass
2. Confirm new tests fail.
3. Rewrite `src/app/page.tsx`:
   - Import `useDashboardData` and all 3 dashboard components
   - Call `useDashboardData()` to get state
   - Render switch on state:
     - `noProfile` → existing no-profile UI (keep as-is)
     - `isLoading` → `<SkeletonText noOfLines={6} />` for summary, `<Skeleton height="300px" />` for chart, `<SkeletonText />` grids for cards
     - `isEmpty` → `<VStack>` with message + `<Button as={Link} href="/medir">`
     - `error` → `<Text color="red.500" role="alert">` + retry button
     - data → `<LatestMeasurementSummary>` + `<MetricCards>` + `<WeightChart>`
   - Keep `<ColorModeButton>`, `<ProfileForm>`, `<BottomNav>` unchanged
4. Confirm all tests pass.
5. Run `npm run lint` and `npx tsc --noEmit`, fix any issues.

## Acceptance

- [ ] Dashboard shows "no profile" state when no active profile exists (existing test still passes)
- [ ] Dashboard shows profile name heading when active profile exists
- [ ] Dashboard shows latest measurement metric cards with computed values (scoped to active profile)
- [ ] Metric cards display deltas: absolute differences from previous and ~30 days ago
- [ ] Weight trend chart renders all measurement data points with dates (scoped to active profile)
- [ ] Clicking chart navigates to `/graficos`
- [ ] Empty measurements state shows CTA when profile exists but no measurements
- [ ] Loading state shows skeleton placeholders during fetch
- [ ] Error state shows error message with retry option
- [ ] All text in Portuguese
- [ ] Responsive: cards stack on mobile, grid on desktop
- [ ] Existing page tests still pass (no-profile, loading, profile-name)

## Verification

```
npm test -- src/app/page.test.tsx && npm test -- src/components/dashboard/ && npm test -- src/hooks/use-dashboard-data.test.ts && npm run lint
```

## Commit

```
feat(dashboard): assemble full dashboard page with metrics, chart, and summary
```
