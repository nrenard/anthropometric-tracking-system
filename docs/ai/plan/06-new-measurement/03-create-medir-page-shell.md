# Step 03 — Create Medir page with step navigation

**Plan**: [`main.md`](./main.md)
**Depends on**: 02

## Objective

Create `src/app/medir/page.tsx` as a `"use client"` page that renders the wizard shell: a step indicator (Chakra `Steps`) at the top, the current step content area, and Back/Next navigation buttons at the bottom. The step indicator must highlight the current step and show progress.

## Context

The page should follow the existing page pattern: `"use client"` + Chakra imports + `useRouter` + `BottomNav` at the bottom (`src/app/login/page.tsx:1-95`, `src/app/page.tsx`).

The Chakra UI v3 `Steps` component provides `<Steps.Root>`, `<Steps.Item>`, `<Steps.Trigger>`, `<Steps.Indicator>`, `<Steps.Title>`, `<Steps.Separator>`, `<Steps.CompletedContent>`. The implementing agent should verify the exact API against the installed `@chakra-ui/react` version.

**Step labels** (Portuguese per spec):
| Step | Label |
|------|-------|
| 1 | Básico |
| 2 | Dobras |
| 3 | Perímetros |
| 4 | Diâmetros |
| 5 | Revisar |

**Navigation**: "Voltar" (previous) and "Próximo" (next) buttons. On step 5, "Próximo" becomes "Salvar" (save button — wired in step 05).

## Approach

1. **Write a failing test** in `src/app/medir/page.test.tsx`:
   - Renders wrapped in `<ChakraProvider>` + `<ProfileProvider>` (follow `src/app/page.test.tsx` pattern)
   - Asserts step indicator is present
   - Asserts "Voltar" and "Próximo" buttons render
   - Asserts step 1 content area exists
2. **Confirm test fails** (404 or missing module).
3. **Create the page**:
   - Import `useMeasurementWizard` from the hook
   - Render Chakra `Steps` with 5 items; highlight current step
   - Render a placeholder for each step's content (switch on `step`)
   - Render Back/Next buttons using existing patterns (`<Button>` from Chakra)
   - Import `<BottomNav />`
   - Back button disabled on step 1; uses `prev()`
   - Next button calls `next()`; on step 5 label is "Salvar" and calls save (placeholder for step 05)
4. **Confirm tests pass** for rendering and navigation.

## Acceptance

- [ ] Page renders with 5-step indicator at top
- [ ] Step indicator highlights current step
- [ ] "Voltar" disabled on step 1
- [ ] Clicking "Próximo" advances to next step (visible in step indicator)
- [ ] Clicking "Voltar" returns to previous step
- [ ] On step 5, next button shows "Salvar"

## Verification

```bash
npm test -- src/app/medir/page.test.tsx
```

## Commit

```
feat(medir): add measurement wizard page shell with step navigation
```
