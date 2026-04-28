# Step 05 — Update dashboard and bottom nav

**Plan**: [`main.md`](./main.md)
**Depends on**: 04

## Objective

Update the dashboard page to show profile-aware states (no profile / active profile), wire the ProfileSwitcher into the bottom navigation area, and add a profile creation CTA for first-time users.

## Context

- Dashboard at `src/app/page.tsx:1` — currently a placeholder with heading + ColorModeButton + BottomNav
- BottomNav at `src/components/bottom-nav.tsx:1` — needs ProfileSwitcher integrated
- `ProfileProvider` from step 03 needs wrapping in `src/app/layout.tsx`
- Profile switcher from step 04 ready to use
- Brief spec: dashboard shows "Nenhum perfil selecionado" when no active profile, shows profile name + scoped data when active (brief line 43)
- Brief spec: first visit shows CTA to create profile, creating is optional (brief line 42)
- Brief spec: switcher hidden when zero profiles (already handled in step 04)
- Active profile cookie survives reloads (already handled in step 03)
- Profile creation CTA on empty dashboard navigates user to create a profile

## Approach

1. Write a failing test: dashboard renders "Nenhum perfil selecionado" when no active profile, renders profile name when active
2. Update `src/components/bottom-nav.tsx`: integrate `ProfileSwitcher` component (show above or within the nav bar)
3. Update `src/app/layout.tsx`: wrap children with `ProfileProvider`
4. Update `src/app/page.tsx` (dashboard):
   - Use `useActiveProfile()` to check active profile
   - No active profile state: show "Nenhum perfil selecionado" message + "Criar Perfil" CTA button
   - Active profile state: show profile name, placeholder for scoped data (to be filled by brief 07)
5. Update `src/app/page.test.tsx`: test both dashboard states
6. Confirm all tests pass
7. Run lint and dev build check

## Acceptance

- [ ] Dashboard shows "Nenhum perfil selecionado" when no active profile exists
- [ ] Dashboard shows "Criar Perfil" CTA when no profiles exist (first-time user)
- [ ] Dashboard shows active profile name when a profile is selected
- [ ] ProfileSwitcher pill renders in bottom nav area when profiles exist
- [ ] ProfileSwitcher hidden when zero profiles exist (inherited from step 04)
- [ ] Active profile ID survives page reload via cookie
- [ ] `ProfileProvider` wraps the app in layout
- [ ] All tests pass (dashboard, bottom nav, switcher, context)

## Verification

```bash
npm test
npm run lint
npm run dev  # smoke test: open browser, verify dashboard renders
```

## Commit

```
feat(ui): update dashboard with profile states and wire ProfileSwitcher to bottom nav
```

## Notes

- Dashboard measurement data (charts, recent measurements) is out of scope — brief 07 builds the full dashboard.
- "Criar Perfil" CTA on empty dashboard can trigger the same modal from step 04 or use a separate inline form. Use the modal approach (reuse `ProfileSwitcher`'s creation flow).
- The "optional to browse without profile" UX: CTA is a suggestion, not a blocker. The dashboard shows the empty state message as information, not an error.
