# Step 02 — Charts page shell with metric selector & period filter

**Plan**: [`main.md`](./main.md)
**Depends on**: 01

## Objective

Create the charts page at `/graficos` with a metric selector dropdown, period filter chips, and all UI states (no profile, loading, empty). The chart itself is deferred to step 03.

## Context

- Page file: `src/app/graficos/page.tsx` (new)
- Test file: `src/app/graficos/page.test.tsx` (co-located, new)
- Follows state patterns from `src/app/comparar/page.tsx` and `src/app/historico/page.tsx`
- Uses `useActiveProfile()` for profile context; wraps in ProfileProvider + ChakraProvider in tests
- Mock Recharts in tests following `weight-chart.test.tsx` pattern (simple `div` testids)
- Next.js App Router: creating `src/app/graficos/page.tsx` auto-registers the route
- Auth middleware already protects `/graficos` (`src/middleware.ts:5-25`)

### Metric definitions

| Label | Key | Unit |
|---|---|---|
| Peso | `weight` | kg |
| % Gordura Corporal | `bodyFatPercent` | % |
| Massa Magra | `leanMass` | kg |
| Massa Gorda | `fatMass` | kg |
| IMC | `bmi` | kg/m² |
| Circunferência da Cintura | `waist` | cm |
| Circunferência do Quadril | `hip` | cm |
| RCQ | `waistToHip` | — |
| RCE | `waistToHeight` | — |
| TMB | `bmr` | kcal/dia |

### Period definitions

| Label | from calculation |
|---|---|
| 7 dias | `subDays(now, 7)` |
| 30 dias | `subDays(now, 30)` |
| 90 dias | `subDays(now, 90)` |
| 6 meses | `subMonths(now, 6)` |
| 1 ano | `subYears(now, 1)` |
| Tudo | no `from` param |

## Approach

1. Write failing test file `src/app/graficos/page.test.tsx` with cases:
   - **No profile**: renders "Selecione um perfil para ver os gráficos"
   - **Loading**: renders skeleton placeholder (check `data-testid="charts-loading"`)
   - **Empty**: renders "Nenhum dado disponível para o período selecionado"
   - **Metric selector**: renders `<NativeSelect>` with all 10 metric options; defaults to "Peso"
   - **Period filter**: renders 6 period chips/buttons; defaults to "Tudo"
   - **Metric selection change**: clicking a different metric updates the displayed selection
   - **Period selection change**: clicking a different period updates the displayed selection
2. Confirm all tests fail (`npm test -- src/app/graficos/page.test.tsx`)
3. Create `src/app/graficos/page.tsx`:
   - `"use client"` directive
   - Imports: `useActiveProfile`, Chakra components, `BottomNav`, metric/period definitions
   - States: `selectedMetric` (default: `"weight"`), `selectedPeriod` (default: `"Tudo"`)
   - **No profile**: when `!activeProfileId && !isLoading` → show message
   - **Loading**: `<Skeleton>` blocks or `<Spinner>` with `data-testid="charts-loading"`
   - **Empty**: when `measurements.length === 0` → show message
   - **Header row**: metric `<NativeSelect>` + period `<Button>` group (horizontal `<Flex>`)
   - **Chart area**: placeholder `<Box>` with `data-testid="chart-area"` (replaced in step 03)
   - `<BottomNav />` at bottom
4. Confirm all tests pass
5. Run `npm run lint` to verify no lint errors

## Acceptance

- [ ] Page renders at `/graficos` route
- [ ] "Selecione um perfil para ver os gráficos" shown when no active profile
- [ ] Skeleton placeholder shown while loading
- [ ] "Nenhum dado disponível para o período selecionado" shown when no measurements in range
- [ ] Metric selector renders all 10 metrics; defaults to "Peso"
- [ ] Period filter renders all 6 options; defaults to "Tudo"
- [ ] Selecting a different metric updates the selector value
- [ ] Selecting a different period updates the active chip
- [ ] All tests pass + lint green

## Verification

```
npm test -- src/app/graficos/page.test.tsx
npm run lint
```

## Commit

```
feat(charts): create charts page shell with metric selector and period filter
```

## Notes

- Data fetching is wired but its result is just stored in state; chart rendering comes in step 03
- Keep the page component as a single file for now; extract sub-components only if it grows unwieldy
- Period chips should use Chakra's `colorPalette` prop for active state styling
