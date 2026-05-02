# Step 04 — Verify acceptance criteria

**Plan**: [`main.md`](./main.md)
**Depends on**: 03

## Objective

Run the full test suite, manually verify all 15 acceptance criteria from the brief, and ensure TypeScript and lint pass.

## Context

- The page should now be fully functional with all four sections implemented
- All tests from steps 01–03 should pass
- No existing tests should be broken by the new page
- The brief lists 15 acceptance criteria that must all be satisfied

## Approach

1. **Run full test suite**:
   ```bash
   npm test
   ```
   Verify all 17+ test files pass (no regressions from existing tests).

2. **Run TypeScript check**:
   ```bash
   npx tsc --noEmit
   ```
   Fix any type errors.

3. **Run linter** (if configured):
   ```bash
   npm run lint
   ```
   Fix any lint violations.

4. **Manual verification checklist** — start the dev server and navigate to `/configuracoes`:
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

5. **Fix any issues** found during manual verification.

## Acceptance

- [ ] `npm test` passes with no failures
- [ ] `npx tsc --noEmit` passes with no errors
- [ ] All 15 acceptance criteria verified manually
- [ ] No regressions in existing functionality

## Verification

```bash
npm test && npx tsc --noEmit
```

## Commit

```
chore(configuracoes): verify acceptance criteria and finalize
```

## Notes

- If any existing test breaks, investigate and fix. The new page should not affect other pages or API routes.
- For manual verification, ensure you have at least 2 profiles in the database (create them via the app if needed).
- Common gotchas:
  - `activeProfile.dateOfBirth` might be a `Date` object from Mongoose, not a string — ensure form handles both.
  - The cookie utility `clearActiveProfileId` is client-side only (`document.cookie`); ensure it's called when deleting the active profile.
  - Confirm that switching profiles via "Selecionar" updates the `activeProfile` state and the edit form re-populates.
  - Verify the page respects auth middleware — unauthenticated access should redirect to `/login`.
