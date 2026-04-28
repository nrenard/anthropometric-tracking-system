# Step 06 — Login Page

**Plan**: [`main.md`](./main.md)
**Depends on**: 03 (POST /api/auth/login), 05 (middleware)

## Objective

Create `src/app/login/page.tsx` — a Chakra UI form with pt-BR labels that posts to `/api/auth/login`, shows an error toast on failure, and redirects to `/` on success.

## Context

- Page: `src/app/login/page.tsx`
- Test file: `src/app/login/page.test.tsx` (colocated)
- Brief spec:
  - Email + password fields, pt-BR labels: "E-mail", "Senha"
  - Client-side validation: non-empty fields
  - POST to `/api/auth/login` with `{ email, password }`
  - On success: redirect to `/` (dashboard)
  - On failure: error toast "Credenciais inválidas"
  - No registration link
- Chakra UI components used in existing pages: `Box`, `Button`, `Flex`, `Heading`, `Stack`, `Text`, `Input` — `src/app/page.tsx:1:1`
- `useRouter` from `next/navigation` for redirect
- Chakra `toaster` from `@/components/ui/toaster` for error toasts
- Login page is outside the `ProfileProvider` wrapping? **Yes** — the login page should NOT require a profile. The middleware protects it, but no profile context is needed on this page. The root layout wraps everything in `ProfileProvider` — the login page will render inside it, but since there's no active profile, it will show the empty state. Keep it as-is; the ProfileProvider handles the "no profile" state gracefully.

## Approach

1. Write failing test in `src/app/login/page.test.tsx`:
   - Render `<LoginPage />` wrapped in `<ChakraProvider value={defaultSystem}>`
   - Test: renders "E-mail" and "Senha" labels
   - Test: renders a submit button with pt-BR text
   - Test: empty form submission shows validation error (fields marked required)
   - Test: failed login shows error toast "Credenciais inválidas" — mock `fetch` to return 401
   - Test: successful login calls `router.push("/")` — mock `fetch` to return 200, mock `useRouter`
   - Follow test patterns from `src/app/page.test.tsx:1:91` (describe, it, expect, render, screen, vi.mock)
2. Confirm tests fail
3. Implement `src/app/login/page.tsx`:
   - `"use client"` directive
   - State: `email`, `password`, `isLoading`, `error`
   - `handleSubmit`: prevent default, validate non-empty, `fetch("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) })`, on ok → `router.push("/")`, on 401 → toast "Credenciais inválidas"
   - Form layout: centered card (`Box` with maxW, mx auto, mt 20), heading "Entrar", email input, password input, submit button
   - Use Chakra `createToaster` / `toaster.create` for toast (pattern from `@/components/ui/toaster.tsx`)
   - Respect existing Chakra UI patterns and theme
4. Confirm tests pass

## Acceptance

- [ ] Page renders email and password fields with pt-BR labels
- [ ] Submit with empty fields shows client-side validation
- [ ] Correct credentials → redirect to `/`
- [ ] Wrong credentials → error toast "Credenciais inválidas", stays on page
- [ ] No registration link or multi-user elements present

## Verification

```
npm test -- src/app/login/page.test.tsx
npm run lint
npm run build
```

## Commit

```
feat(auth): add login page with Chakra UI form
```

## Notes

- The login page renders inside `ProfileProvider` (from root layout). This is fine — `ProfileProvider` handles the case where no profiles exist and no active profile is set. The page does not consume profile data.
- After step 05 (middleware), visiting `/login` while authenticated redirects to `/`. Test this manually after both steps are done.
