# Step 01 — Profile list and management

**Plan**: [`main.md`](./main.md)
**Depends on**: none

## Objective

Build Section 1 of the settings page: profile list display, "Novo Perfil" creation modal, per-profile actions (select/edit/delete with confirmation), empty state, and success/error toasts. Write tests first, then implement.

## Context

- Page file: `src/app/configuracoes/page.tsx` (to be created)
- Test file: `src/app/configuracoes/page.test.tsx` (to be created)
- Data source: `useActiveProfile()` hook provides `profiles`, `activeProfileId`, `setActiveProfileId`, `refreshProfiles`
- API calls: raw `fetch()` to `/api/profiles` and `/api/profiles/[id]` — matches pattern in `src/app/graficos/page.tsx`
- Toast: `import { toaster } from "@/components/ui/toaster"` → `toaster.create({ title: "…", type: "success"|"error" })`
- Icons: `react-icons/lu` — use `LuVenus` (♀), `LuMars` (♂) for sex display
- Chakra components: `Box`, `Flex`, `Heading`, `Text`, `Button`, `Badge`, `IconButton`, `Stack`, `Separator`, `Dialog` (modal), `Input`, `Field`, `RadioGroup`, `Radio`, `Spinner`, `Center`
- Bottom nav: import and render `<BottomNav />` at page bottom
- Portuguese labels: profile rows show name, sex icon, date of birth (formatted `DD/MM/AAAA`); active row has green left border or checkmark; menu items: "Selecionar", "Editar", "Excluir"

## Approach

1. **Write failing tests** for `page.test.tsx` covering:
   - Renders profile list with name, sex icon, and date of birth per profile
   - Active profile highlighted with a visual indicator (colored border or checkmark badge)
   - Shows empty state ("Nenhum perfil cadastrado" + "Criar Perfil" button) when `profiles` is empty
   - "Novo Perfil" button opens a creation modal with form fields (name, dateOfBirth, sex, defaultHeight)
   - Filling the creation form and submitting calls `POST /api/profiles`, shows success toast, and calls `refreshProfiles`
   - "Selecionar" on a profile row calls `setActiveProfileId(id)`
   - "Editar" on a profile row calls `setActiveProfileId(id)` (switches active profile, populates Section 2 form built in step 02)
   - "Excluir" shows a confirmation dialog with the profile name
   - Confirming delete calls `DELETE /api/profiles/[id]`, shows success toast, calls `refreshProfiles`
   - Deleting the active profile clears the active profile cookie (calls `clearActiveProfileId`)
   - API errors show error toast

2. **Confirm tests fail** — run `npx vitest run src/app/configuracoes/page.test.tsx`

3. **Implement the page** in `src/app/configuracoes/page.tsx`:
   - Add `"use client"` directive
   - Import `useActiveProfile` from `@/hooks/use-active-profile`
   - Fetch profiles on mount (already handled by the hook)
   - Render loading spinner while `isLoading` is true
   - Render empty state when `profiles` is empty and not loading
   - Map `profiles` to list items: name, sex icon (`LuVenus` for "F", `LuMars` for "M"), formatted date of birth
   - Highlight active profile: check `profile._id === activeProfileId`, add green border/checkmark
   - Per-row actions: "Selecionar" → `setActiveProfileId(id)`, "Editar" → `setActiveProfileId(id)`, "Excluir" → open confirmation dialog
   - "Novo Perfil" button → opens Chakra `Dialog` (modal) with form fields:
     - Nome (text input, required)
     - Data de Nascimento (date input)
     - Sexo (radio: "Masculino" / "Feminino")
     - Altura Padrão (number input, optional)
   - On create submit: validate fields (name required, dateOfBirth required, sex required), `POST /api/profiles` with JSON body, on success call `toaster.create`, `refreshProfiles()`, close modal; on error show error toast
   - Delete confirmation dialog: render profile name in the prompt, confirm button calls `DELETE /api/profiles/[id]`, on success calls `refreshProfiles()`, clears cookie if `id === activeProfileId`, shows toast
   - Wrap form state in `useState` per field (matches existing pattern in `src/components/profile-form.tsx`)
   - Use `useRef` for `AbortController` to avoid state updates after unmount (pattern from `src/app/graficos/page.tsx`)

4. **Confirm tests pass** — run `npx vitest run src/app/configuracoes/page.test.tsx`

5. **Refactor** — extract repeated toast/error handling into helper functions inside the component; ensure no duplication

## Acceptance

- [ ] Profile list renders all profiles with name, sex icon, and formatted date of birth
- [ ] Active profile has a distinct visual indicator (green border or checkmark)
- [ ] Empty state shown when no profiles exist
- [ ] "Novo Perfil" modal opens, validates required fields, submits POST, shows success toast
- [ ] "Selecionar" calls `setActiveProfileId` with the correct ID
- [ ] "Editar" calls `setActiveProfileId` with the correct ID
- [ ] "Excluir" shows confirmation dialog with profile name
- [ ] Confirm delete sends DELETE request, shows toast, and removes profile from list
- [ ] Deleting active profile clears the ACTIVE_PROFILE_ID cookie
- [ ] Network errors surface as error toasts

## Verification

```bash
npx vitest run src/app/configuracoes/page.test.tsx
```

## Commit

```
feat(configuracoes): add profile list and management section
```

## Notes

- The "Editar" action sets the clicked profile as active, which will cause the Section 2 edit form (built in step 02) to populate with that profile's data.
- Use `abortControllerRef` pattern from `src/app/graficos/page.tsx:14-26` to cancel in-flight requests on unmount.
- Date formatting: use `toLocaleDateString("pt-BR")` for readable display.
- Mock `useActiveProfile` in tests by mocking `@/hooks/use-active-profile` to return a controlled state object.
- Mock `fetch` globally in tests; mock `toaster` from `@/components/ui/toaster`.
