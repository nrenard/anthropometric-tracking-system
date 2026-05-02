# Step 02 — Edit active profile form

**Plan**: [`main.md`](./main.md)
**Depends on**: 01

## Objective

Build Section 2 of the settings page: edit form for the active profile with field validation, inline Portuguese error messages, PUT to the API, and success/error toasts. Write tests first, then implement.

## Context

- Edit form is only visible when `activeProfile` is not null (from `useActiveProfile()`)
- Form fields: Nome, E-mail (readonly), Data de Nascimento, Sexo (M/F radio), Altura Padrão (optional)
- Validation rules:
  - Nome: required, min 2 characters
  - Data de Nascimento: required, must be in the past, user must be 1–120 years old
  - Sexo: required, must be "M" or "F"
  - Altura Padrão: optional, positive number if provided
- Error messages in Portuguese (inline, per field)
- Save: `PUT /api/profiles/[activeId]` with JSON body
- Success toast: "Perfil salvo com sucesso"
- The form should pre-populate with `activeProfile` values whenever the active profile changes
- Reuse `profileSchema` from `@/lib/validation.ts:3` for validation logic; wrap errors with Portuguese messages for display
- Date formatting: `activeProfile.dateOfBirth` is a date string — slice to `YYYY-MM-DD` for `<input type="date">` value

## Approach

1. **Write failing tests** for the edit form:
   - Edit form renders when `activeProfile` is not null, with fields pre-populated
   - Edit form is hidden when `activeProfile` is null
   - E-mail field is readonly (has `readOnly` attribute or `disabled` prop)
   - Submitting with invalid nome (empty or < 2 chars) shows inline Portuguese error
   - Submitting with future dateOfBirth shows inline error
   - Submitting with dateOfBirth yielding age > 120 shows inline error
   - Submitting with missing sex shows inline error
   - Valid submission sends `PUT /api/profiles/[activeId]` with correct body
   - On save success: toaster.create called with success message, refreshProfiles called
   - On save error: toaster.create called with error message
   - Form refills with updated profile data when `activeProfile` prop changes

2. **Confirm tests fail** — run `npx vitest run src/app/configuracoes/ -t "edit"`

3. **Implement the edit form** in `src/app/configuracoes/page.tsx`:
   - Add a section heading "Editar Perfil Ativo" (only visible when `activeProfile` exists)
   - Form fields using `useState` initialized from `activeProfile`:
     - Nome: `useState(activeProfile?.name ?? "")`
     - E-mail: display-only, value from `activeProfile?.email ?? ""`, readOnly
     - Data de Nascimento: `useState(activeProfile?.dateOfBirth?.slice(0,10) ?? "")`
     - Sexo: `useState<"M"|"F"|"">(activeProfile?.sex ?? "")`
     - Altura Padrão: `useState(activeProfile?.defaultHeight?.toString() ?? "")`
   - Use `useEffect` with `activeProfile` in deps to re-initialize form fields when active profile switches
   - Validation function `validateEditForm()` returning `Record<string, string>` (field → error message):
     - Nome: check empty → "Nome é obrigatório"; check length < 2 → "Nome deve ter pelo menos 2 caracteres"
     - Data de Nascimento: check empty → "Data de nascimento é obrigatória"; check future → "Data de nascimento deve estar no passado"; check age < 1 or > 120 → "Idade deve ser entre 1 e 120 anos"
     - Sexo: check empty → "Sexo é obrigatório"
     - Altura Padrão: if provided, check positive number → "Altura deve ser um número positivo"
   - On "Salvar" click: validate → if errors, set `errors` state and return; else `onSave` function calls `PUT /api/profiles/[activeId]` with JSON body
   - Use Chakra `Field` with `errorText` prop to render validation errors
   - Toast on success: `toaster.create({ title: "Perfil salvo com sucesso", type: "success" })` + `refreshProfiles()`
   - Toast on error: `toaster.create({ title: "Erro ao salvar perfil", type: "error" })`
   - Disable save button while saving; show `loading` on button

4. **Confirm tests pass** — run `npx vitest run src/app/configuracoes/ -t "edit"`

5. **Refactor** — align validation wording with other pages; extract the age calculation into a small helper

## Acceptance

- [ ] Edit form renders with pre-populated fields when active profile exists
- [ ] Edit form is hidden when no active profile is selected
- [ ] E-mail field is readonly
- [ ] Nome validation: required, min 2 chars, inline Portuguese message
- [ ] Data de Nascimento validation: required, not future, age 1–120, inline message
- [ ] Sexo validation: required, inline message
- [ ] Altura Padrão: optional but positive if provided
- [ ] Save sends `PUT /api/profiles/[activeId]` with correct JSON payload
- [ ] Success toast on save, error toast on failure
- [ ] Form re-populates when active profile changes

## Verification

```bash
npx vitest run src/app/configuracoes/
```

## Commit

```
feat(configuracoes): add edit active profile form with validation
```

## Notes

- Age calculation helper: `calculateAge(dateOfBirth: Date): number` — subtract birth year from current, adjust if birthday hasn't occurred this year.
- The edit form uses `PUT` which accepts partial updates (the API route uses `profileSchema.partial()` at `src/app/api/profiles/[id]/route.ts:35`).
- Body shape for PUT: `{ name, email, dateOfBirth, sex, defaultHeight }`. Include all fields even if unchanged — the API ignores undefined values from partial schema.
- Email is sent in the PUT body even though it's readonly (the server-side `profileSchema.partial()` will accept or ignore it).
