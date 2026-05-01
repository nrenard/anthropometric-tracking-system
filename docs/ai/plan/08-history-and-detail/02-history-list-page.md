# Step 02 — History List Page

**Plan**: [`main.md`](./main.md)
**Depends on**: 01 (edit button navigates to wizard edit mode)

## Objective

Build the history list page at `/historico` showing all measurements for the active profile in descending date order, with period filter chips and edit/delete action buttons per item.

## Context

- Page file: `src/app/historico/page.tsx` (does not exist — create it)
- Test file: `src/app/historico/page.test.tsx` (does not exist — create it)
- API: `GET /api/measurements?profileId=<id>&from=<ISO>&to=<ISO>&sort=desc` (`src/app/api/measurements/route.ts:14`)
- Active profile via `useActiveProfile()` from `src/hooks/use-active-profile.ts:1` — returns `{ activeProfileId, activeProfile }` or throws if no provider
- Period filter mapping:
  - "7 dias" → `from = subDays(now, 7)`
  - "30 dias" → `from = subDays(now, 30)`
  - "90 dias" → `from = subDays(now, 90)`
  - "6 meses" → `from = subMonths(now, 6)`
  - "1 ano" → `from = subYears(now, 1)`
  - "Tudo" → no `from`/`to`
- Date formatting: "DD/MM/YYYY HH:mm" — check if `src/lib/date-utils.ts` has a formatter; if not, build a simple one
- Pattern: follow `src/hooks/use-dashboard-data.ts` for `fetch()` with `useState` + `useEffect` + cancellation pattern
- Edit button navigates to `/medir?edit=<id>` (depends on Step 01)
- Delete button shows placeholder `onClick` — wired in Step 03
- `computeAllMetrics` from `src/lib/calculations.ts:152` — call on each measurement to get BMI and BF% for list display; needs profile (fetch separately)

## Approach

### 1. Write failing test

Create `src/app/historico/page.test.tsx`:
- Mock `useActiveProfile` to return a profile
- Mock `fetch` to return measurement array
- Test: renders list of measurements sorted by date
- Test: each item shows formatted date, weight, BF%, BMI
- Test: period filter chips render and highlight active filter
- Test: selecting a filter chip refetches with correct `from`/`to`
- Test: empty state shows "Nenhuma medição registrada" with CTA link
- Test: no-profile state shows "Selecione um perfil para ver o histórico"
- Test: edit button links to `/medir?edit=<id>`
- Test: loading state shows skeleton
- Test: error state shows error message with retry

### 2. Build the page

Create `src/app/historico/page.tsx` (`"use client"`):

**Data fetching:**
- Use `useActiveProfile()` to get `activeProfileId` and `activeProfile`
- Use `useState` + `useEffect` with cancellation flag to fetch measurements and profile
- Filter state: `activeFilter` from period options enum
- Build URL: `/api/measurements?profileId=${activeProfileId}&sort=desc&from=...&to=...`

**State machine:**
- `loading` → show skeleton list (3-4 `Skeleton` items)
- `noProfile` → "Selecione um perfil para ver o histórico" with link to `/configuracoes`
- `error` → error message with retry button
- `empty` → "Nenhuma medição registrada" with `<Button asChild>` wrapping `<Link href="/medir">`
- `loaded` → render filter bar + measurement list

**Period filter chips:**
- Horizontal scrollable row of `Badge`/`Button` components (use Chakra `Button` with `variant="surface"` or `variant="solid"` for active)
- Options: `PERIOD_FILTERS = ["7 dias", "30 dias", "90 dias", "6 meses", "1 ano", "Tudo"]`
- Active filter gets `colorPalette="blue"` variant

**Measurement list items:**
- Map over measurements array
- Each item: `Flex`/`Stack` with:
  - Date: formatted "DD/MM/YYYY HH:mm" (left-aligned)
  - Weight: bold, in kg
  - BF%: if skinfolds exist (call `computeAllMetrics`), else "—"
  - BMI: from `computeAllMetrics` or direct `bmi()` call
  - Notes preview: `Text lineClamp={1}` truncated
  - Action buttons: edit (`<a href="/medir?edit=${id}">`), delete (with onClick stub — wired in Step 03)

### 3. Add date formatting utility if missing

Check `src/lib/date-utils.ts`. If no `formatDate` exists, add:
```typescript
export function formatDateTime(iso: string): string {
  const d = new Date(iso)
  const dd = String(d.getDate()).padStart(2, "0")
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const yyyy = d.getFullYear()
  const hh = String(d.getHours()).padStart(2, "0")
  const min = String(d.getMinutes()).padStart(2, "0")
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`
}
```

### 4. Confirm green & refactor

- Run tests, confirm all pass
- Run `npm run lint`
- Verify manually: navigate to `/historico`, see measurements in list
- Refactor: extract `useHistoryData` hook if the fetch logic is substantial

## Acceptance

- [ ] History list shows all measurements for active profile, newest first
- [ ] Each item shows formatted date, weight, BF%, BMI, notes preview
- [ ] Period filter chips filter by date range (verify API call with correct `from`/`to`)
- [ ] Active filter chip is visually highlighted
- [ ] Empty state with CTA to `/medir` when no measurements
- [ ] No-profile state when no active profile
- [ ] Loading skeleton during fetch
- [ ] Error state with retry button
- [ ] Edit button links to `/medir?edit=<id>`
- [ ] Delete button exists (functionality tested in Step 03)

## Verification

```bash
npm test -- src/app/historico/page.test.tsx
npm run lint
```

## Commit

```
feat(historico): add history list page with period filters
```
