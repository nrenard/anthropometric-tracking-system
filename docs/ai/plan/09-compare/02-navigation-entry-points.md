# Step 02 — Navigation Entry Points

**Plan**: [`main.md`](./main.md)
**Depends on**: 01

## Objective

Add a "Comparar" toolbar button to the history list page (`/historico`) and a "Comparar" link in the measurement detail page footer (`/historico/[id]`), so users can navigate to `/comparar` from both contexts.

## Context

- History list: `src/app/historico/page.tsx` — add a header button alongside the existing "Histórico" heading
- Measurement detail: `src/app/historico/[id]/page.tsx` — add a "Comparar" button in the action bar next to "Voltar", "Editar", "Excluir"
- Both pages already import `NextLink` from `next/link` and `Button` from `@chakra-ui/react`
- Follow the existing `Button asChild` + `NextLink` pattern for navigation links
- Both existing tests need updates to assert the new buttons render and have correct `href`

## Approach

### History list (`src/app/historico/page.tsx`)

1. **Update tests** in `src/app/historico/page.test.tsx`:
   - Add a test: "renders a Compare button linking to /comparar when a profile is active"
   - Assert the button exists and has `href="/comparar"`
   - Confirm the button is NOT rendered when there's no active profile (optional, nice-to-have)

2. **Confirm test fails** — `npx vitest run src/app/historico/page.test.tsx` (new test only)

3. **Add the button** in the header section of `HistoricoPage`:
   - Place a `Button asChild variant="outline" size="sm"` next to the "Histórico" heading (to the right, in a `Flex` with `justify="space-between"`)
   - Label: "Comparar"
   - Navigate to `/comparar` via `NextLink`
   - Only show when a profile is active and data is loaded (not during skeleton/error/empty states)

4. **Confirm test passes**

### Measurement detail (`src/app/historico/[id]/page.tsx`)

1. **Update tests** in `src/app/historico/[id]/page.test.tsx`:
   - Add a test: "renders a Compare button linking to /comparar when measurement is loaded"
   - Assert the button has `href="/comparar"`

2. **Confirm test fails**

3. **Add the button** in the detail page header action bar (the `Flex` with "Voltar", "Editar", "Excluir"):
   - Place a `Button asChild size="sm" variant="outline"` labeled "Comparar"
   - Navigate to `/comparar` via `NextLink`
   - Show only when `state.kind === "loaded"` (alongside Edit and Delete)

4. **Confirm test passes**

5. **Run full test suite** for both files:
   ```bash
   npx vitest run src/app/historico/page.test.tsx src/app/historico/\[id\]/page.test.tsx
   ```

## Acceptance

- [ ] History list shows "Comparar" button when profile active and data loaded
- [ ] History "Comparar" button navigates to `/comparar`
- [ ] Measurement detail shows "Comparar" button when loaded
- [ ] Detail "Comparar" button navigates to `/comparar`
- [ ] Existing tests still pass (no regressions)
- [ ] No "Comparar" link added to bottom nav

## Verification

```bash
npx vitest run src/app/historico/page.test.tsx src/app/historico/\[id\]/page.test.tsx
npx vitest run src/app/comparar/page.test.tsx
npx eslint src/app/historico/ src/app/comparar/
```

## Commit

```
feat(history): add compare navigation from history list and detail page
```

## Notes

- The detail page already has 4 buttons when loaded (Voltar, Editar, Excluir + the hidden delete confirm). Adding "Comparar" makes 5 total in the action area — use `Flex wrap="wrap"` if needed (the existing `Flex` already has `wrap="wrap"` on `src/app/historico/[id]/page.tsx:369`).
- The "Comparar" button on history list should appear even when there are 0 measurements (user might want to navigate there to see the "<2 measurements" guidance). Show it whenever `profile` is loaded (not nil).
