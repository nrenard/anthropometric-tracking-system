# Step 06 — Empty states & polish

**Plan**: [`main.md`](./main.md)
**Depends on**: 05

## Objective

Handle edge cases: no active profile selected, beforeunload warning, loading states, and final integration validation.

## Context

**No profile banner** per brief: "Selecione um perfil para registrar medições" with a link to the profile switcher. The form should be disabled until a profile is selected.

**BeforeUnload warning** per brief's risk mitigation: warn before leaving if the form has any filled data.

**Loading states**: the page should not flash content while the profile context is loading (`useActiveProfile().isLoading`).

## Approach

1. **Write tests for empty states** in `src/app/medir/page.test.tsx`:
   - When `activeProfileId` is `null`, a banner renders: "Selecione um perfil para registrar medições"
   - Banner includes a link/button to open the profile switcher
   - Form fields are disabled when no profile is selected
   - When `isLoading` is `true`, a loading skeleton or spinner shows
   - When profile is selected, form is enabled and banner is gone
2. **Confirm tests fail**.
3. **Implement empty state banner** in page.tsx:
   - Use `useActiveProfile()` to get `activeProfileId`, `isLoading`
   - Loading state: render `<Spinner />` or `Skeleton` while loading
   - No profile: render `<Box bg="yellow.50" p={4} borderRadius="md">` with message and a `<Button>` that triggers the profile switcher (or links to `/configuracoes`)
   - Disable form inputs and navigation buttons when no profile
   - Pass `disabled={!activeProfileId}` to all step components and buttons
4. **Implement beforeunload warning**:
   - Add a `useEffect` that registers `window.addEventListener("beforeunload", handler)` when `hasData` is true (hook should expose this or the page computes it: any field has a non-empty value)
   - Handler calls `event.preventDefault()` (legacy) and sets `event.returnValue = ""`
   - Cleanup removes listener on unmount
5. **Add `isSubmitting` state** from step 05: ensure save button also disables navigation buttons during submit.
6. **Confirm tests pass**.
7. **Run full test suite** to ensure no regressions:
   ```bash
   npm test
   ```
8. **Run lint and build**:
   ```bash
   npm run lint
   npm run build
   ```

## Acceptance

- [ ] Banner shows when no active profile is selected: "Selecione um perfil para registrar medições"
- [ ] Form fields and navigation are disabled without a profile
- [ ] Loading spinner/skeleton shows while profile context loads
- [ ] Banner and disabled state clear when a profile is selected
- [ ] `beforeunload` event fires warning when form has data
- [ ] `beforeunload` does not fire when form is empty
- [ ] All existing tests still pass (no regressions)
- [ ] `npm run lint` passes
- [ ] `npm run build` succeeds

## Verification

```bash
npm test -- src/app/medir/page.test.tsx
npm test
npm run lint
npm run build
```

## Commit

```
feat(wizard): add empty profile banner, loading state, and beforeunload warning
```

## Notes

- The `hasData` flag for beforeunload can be a derived check: `Object.values(data).some(v => v !== "" && v !== undefined)`. Expose this from the hook or compute in the page.
- If the profile switcher is a modal, prefer navigating to `/configuracoes` for simplicity (profile management page). Or use the existing `ProfileSwitcher` component directly.
- Test for beforeunload: mock `window.addEventListener` and assert the listener is registered/removed based on data state.
