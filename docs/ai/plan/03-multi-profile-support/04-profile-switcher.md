# Step 04 — Build profile switcher with modal

**Plan**: [`main.md`](./main.md)
**Depends on**: 03

## Objective

Build a `ProfileSwitcher` component: a pill/chip in the bottom navigation area showing the active profile name. Tapping it opens a modal listing all profiles with options to switch, create, or delete.

## Context

- `useActiveProfile` hook from step 03 provides `activeProfileId`, `profiles`, `setActiveProfileId`, `refreshProfiles`
- Cookie utility from step 03 handles persistence
- Server actions from step 03 provide CRUD
- BottomNav at `src/components/bottom-nav.tsx:1` — switcher pill goes inside or alongside it
- Chakra UI v3: use `Button`, `Popover`/`Dialog`, `Flex`, `Text`, `Icon`
- Labels in pt-BR per spec: "Perfis", "Criar Perfil", "Excluir", "Nenhum perfil"
- Delete confirmation: "Tem certeza? Todos os registros deste perfil serão perdidos." (brief line 79)
- Switcher hidden when zero profiles exist (brief line 41)

## Approach

1. Write a failing component test: `ProfileSwitcher` renders nothing when profiles empty, renders pill with active name when profiles exist
2. Create `src/components/profile-switcher.tsx` (client component):
   - Uses `useActiveProfile()` to get state
   - Pill/button showing active profile name (or "Selecionar perfil" if none active)
   - On click, opens a dialog/panel listing all profiles
   - Each profile row: name, select button, delete button (with confirmation)
   - "Criar Perfil" button at bottom of list
3. Create `src/components/profile-switcher.test.tsx`: test empty state, list state, switch action, delete with confirmation, create button presence
4. Mock or wrap with ProfileProvider in tests
5. Confirm tests pass
6. Run lint

## Acceptance

- [ ] Switcher pill renders active profile name when a profile is active
- [ ] Switcher pill shows "Selecionar perfil" when profiles exist but none active
- [ ] Switcher is completely hidden when `profiles.length === 0`
- [ ] Tapping pill opens modal/list showing all profiles
- [ ] Switching profiles calls `setActiveProfileId` and sets cookie
- [ ] Deleting a profile shows confirmation dialog; on confirm, deletes and refreshes list
- [ ] Deleting active profile clears cookie and falls back to empty state (or next profile if any remain)
- [ ] "Criar Perfil" button opens creation form (or navigates to creation — step 05 wires the CTA)
- [ ] Component tests pass

## Verification

```bash
npm test -- src/components/profile-switcher.test.tsx
npm run lint
```

## Commit

```
feat(ui): add ProfileSwitcher component with list, switch, create, and delete actions
```

## Notes

- The creation form can be inline in the modal or a separate `CreateProfileModal` component. Prefer inline for simplicity — the brief doesn't mandate a separate page/modal.
- Delete cascades to measurements — the server action must call `Measurement.deleteMany({ profileId })` before deleting the profile.
- The `deleteProfile` server action from step 03 should implement cascade delete.
