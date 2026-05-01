# Step 04 — Measurement Detail Page

**Plan**: [`main.md`](./main.md)
**Depends on**: 02 (history list), 03 (delete pattern to reuse)

## Objective

Build the measurement detail page at `/historico/[id]` showing all raw values organized by section, plus computed metrics. Include edit/delete actions, loading skeleton, 404, and no-profile states.

## Context

- Page file: `src/app/historico/[id]/page.tsx` (does not exist — create it)
- Test file: `src/app/historico/[id]/page.test.tsx` (does not exist — create it)
- API: `GET /api/measurements/[id]` (`src/app/api/measurements/[id]/route.ts:24`)
- API: `GET /api/profiles/[activeId]` for sex, age, defaultHeight needed by `computeAllMetrics`
- `computeAllMetrics(measurement, profile)` from `src/lib/calculations.ts:152` — returns `AllMetrics` with all computed values
- Active profile: `useActiveProfile()` from `src/hooks/use-active-profile.ts:1`
- Delete pattern: reuse confirmation dialog from Step 03 (inline or extracted component)
- Loading: Chakra `Skeleton`, `SkeletonText`
- Page params: Next.js App Router `params.id` (use `useParams()` in client component)
- Fields to display (from `MeasurementInput` interface in `src/lib/calculations.ts:104-129` and `spec.md:39-70`):
  - **Básico**: weight (kg), height (cm), measuredAt (date), notes
  - **Dobras Cutâneas**: tríceps, subescapular, suprailíaca, abdominal, coxa, peito, axilar (all in mm)
  - **Perímetros**: waist, hip, arm (L/R), forearm (L/R), thigh (L/R), calf (L/R) (all in cm)
  - **Diâmetros**: humerus, femur (cm)
  - **Métricas Calculadas** (from `AllMetrics`): BMI, body density, BF%, fat mass, lean mass, bone mass, muscle mass, waist-to-hip, waist-to-height, BMR
- Format numbers: 1 decimal place for cm/mm, 1 decimal for kg, 2 decimals for BMI and BF%, no decimals for BMR
- Show "—" for missing/null values and for metrics that can't be computed (e.g., BF% without skinfolds)

## Approach

### 1. Write failing test

Create `src/app/historico/[id]/page.test.tsx`:
- Mock `useParams` to return `{ id: "valid-id" }`
- Mock `useActiveProfile` to return profile
- Mock `fetch` for measurements and profiles
- Test: renders all 5 sections (Básico, Dobras, Perímetros, Diâmetros, Métricas)
- Test: displays raw values correctly formatted
- Test: calls `computeAllMetrics` and displays results
- Test: shows "—" for null/missing values
- Test: shows "—" for metrics that can't be computed (e.g., BF% when no skinfolds)
- Test: skeleton loading state while fetching
- Test: "Medição não encontrada" for 404
- Test: "Selecione um perfil para ver o histórico" when no active profile
- Test: edit button links to `/medir?edit=<id>`
- Test: delete button opens confirmation dialog
- Test: back link navigates to `/historico`

### 2. Build the page

Create `src/app/historico/[id]/page.tsx` (`"use client"`):

**Data fetching:**
- `useParams()` to get `id`
- `useActiveProfile()` to get `activeProfileId` and `activeProfile`
- Fetch measurement: `GET /api/measurements/[id]`, handle 404
- Fetch profile: `GET /api/profiles/[activeProfileId]`
- Both fetches in parallel via `Promise.all` (or sequential — measurement needed first to verify it exists)
- Cancel in-flight requests on unmount via cancellation flag

**State:**
- `loading` → skeleton layout with placeholder cards
- `noProfile` → "Selecione um perfil para ver o histórico"
- `notFound` → "Medição não encontrada" with back link
- `error` → error message with retry + back link
- `loaded` → render all sections

**Layout:**
- Stack of cards/sections, vertically scrollable
- Header: "Detalhes da Medição" title + edit/delete buttons + back button
- Each section as a Chakra `Box` with `borderWidth={1}`, `borderRadius="md"`, `p={4}`

**Section 1 — Básico:**
- Weight, height, measured date (formatted DD/MM/YYYY HH:mm), notes
- Simple key-value rows: `<Flex justify="space-between"><Text>Peso</Text><Text fontWeight="bold">XX,X kg</Text></Flex>`

**Section 2 — Dobras Cutâneas:**
- 7 skinfold values in a 2-column grid (`SimpleGrid columns={2}`)
- Show "—" for nulls
- Label each: "Tríceps", "Subescapular", "Suprailíaca", "Abdominal", "Coxa", "Peito", "Axilar"

**Section 3 — Perímetros:**
- L/R pairs side by side for arm, forearm, thigh, calf
- Waist and hip on their own row
- Format: "Braço: E XX,X cm | D XX,X cm"

**Section 4 — Diâmetros:**
- Humerus, femur

**Section 5 — Métricas Calculadas:**
- Call `computeAllMetrics(measurement, profile)` 
- Display each metric with label and formatted value
- Show "—" when a metric is `null`/`undefined` or `NaN`
- Labels (Portuguese): IMC, Densidade Corporal, % Gordura, Massa Gorda, Massa Magra, Massa Óssea, Massa Muscular, RCQ (waist/hip), RCE (waist/height), TMB
- Units: kg for mass, kg/m² for BMI, g/ml for density, % for BF%, cm for ratios, kcal/day for BMR

**Actions:**
- Edit button: `<Link href={/medir?edit=${id}}>` (rendered as Chakra `Button`)
- Delete button: same confirmation dialog pattern from Step 03
- After successful delete from detail: navigate to `/historico` via `useRouter().push("/historico")`
- Back link: Chakra `Button` or `<Link>` to `/historico`

### 3. Confirm green & refactor

- Run tests, confirm all pass
- Run `npm run lint`
- Refactor: if delete dialog is duplicated between history and detail, extract a shared `DeleteMeasurementDialog` component to `src/components/delete-measurement-dialog.tsx`
- Test the extracted component separately

### 4. Manual verification

- Navigate to `/historico`, click a measurement → detail page loads
- Verify all sections render with correct values
- Verify computed metrics match manual calculation
- Test 404: navigate to `/historico/nonexistent-id`
- Test no-profile: clear cookie, reload

## Acceptance

- [ ] Detail page displays all raw values grouped in 4 sections (Básico, Dobras, Perímetros, Diâmetros)
- [ ] Section 5 (Métricas Calculadas) shows all computed metrics from `computeAllMetrics`
- [ ] Null/missing raw values show "—"
- [ ] Metrics that can't be computed (due to missing inputs) show "—"
- [ ] Loading state shows skeleton
- [ ] Invalid measurement ID shows "Medição não encontrada"
- [ ] No active profile shows "Selecione um perfil para ver o histórico"
- [ ] Edit button navigates to `/medir?edit=<id>`
- [ ] Delete button opens confirmation dialog (reuses pattern from Step 03)
- [ ] After successful delete, navigates to `/historico`
- [ ] Back link returns to `/historico`
- [ ] All text in Portuguese

## Verification

```bash
npm test -- src/app/historico/[id]/page.test.tsx
npm run lint
```

## Commit

```
feat(historico): add measurement detail page with computed metrics
```
