# Step 03 — Appearance, about, and logout

**Plan**: [`main.md`](./main.md)
**Depends on**: 02

## Objective

Build Sections 3 and 4 of the settings page: theme toggle, app info display, and logout button. Write tests first, then implement.

## Context

- Theme toggle: reuse `<ColorModeButton />` from `src/components/ui/color-mode.tsx:51` — it already handles dark/light switching and persists via `next-themes`
- Label text: "Tema escuro" next to the toggle
- App info: static text — app name "Sistema de Acompanhamento Antropométrico" + version "1.0.0"
- Logout: "Sair" button — `POST /api/auth/logout` then `router.push("/login")` on success
- Logout API: `src/app/api/auth/logout/route.ts` — calls `session.destroy()`, returns 200
- Use `useRouter` from `next/navigation` for redirect after logout
- Chakra components: `Heading`, `Text`, `Button`, `Flex`, `Stack`, `Separator`

## Approach

1. **Write failing tests** for the three sub-sections:
   - Appearance section renders `<ColorModeButton />` and label "Tema escuro"
   - About section renders "Sistema de Acompanhamento Antropométrico" and "1.0.0"
   - Logout button renders with label "Sair"
   - Clicking logout calls `POST /api/auth/logout`
   - On logout success, redirects to `/login`
   - On logout error, shows error toast

2. **Confirm tests fail** — run `npx vitest run src/app/configuracoes/ -t "appearance|about|logout"`

3. **Implement the sections** in `src/app/configuracoes/page.tsx`:
   - Add "Aparência" section heading
   - Render `Flex` with label "Tema escuro" on the left and `<ColorModeButton />` on the right
   - Add `Separator` between sections
   - Add "Sobre" section heading
   - Render static text: "Sistema de Acompanhamento Antropométrico" (app name) and "Versão 1.0.0" (version)
   - Add "Sair" button at the bottom:
     - `onClick` handler: `fetch("/api/auth/logout", { method: "POST" })`
     - On success: `router.push("/login")`
     - On error: `toaster.create({ title: "Erro ao sair", type: "error" })`
   - Use `useRouter` from `next/navigation`
   - Style the logout button as a full-width secondary/destructive button

4. **Confirm tests pass** — run `npx vitest run src/app/configuracoes/`

5. **Refactor** — check spacing between sections; ensure sections are visually distinct

## Acceptance

- [ ] Theme toggle renders with Portuguese label "Tema escuro"
- [ ] Toggling theme works (light/dark switches immediately)
- [ ] App name and version render correctly
- [ ] "Sair" button is visible at the bottom
- [ ] Clicking "Sair" calls the logout API and redirects to `/login`
- [ ] Logout failure shows an error toast

## Verification

```bash
npx vitest run src/app/configuracoes/
```

## Commit

```
feat(configuracoes): add appearance, about sections and logout button
```

## Notes

- The `<ColorModeButton />` must be wrapped in `<ClientOnly>` (already handled in its definition at `src/components/ui/color-mode.tsx:67`) to avoid SSR hydration mismatches. The existing implementation handles this — no extra wrapper needed.
- For the logout test, mock `next/navigation`'s `useRouter` to assert `push("/login")` was called.
- The logout button style should visually distinguish it from save/submit buttons — consider `colorPalette="red"` or `variant="outline"`.
