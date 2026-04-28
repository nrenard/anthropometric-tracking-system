# Step 02 — Weight Trend Chart

**Plan**: [`main.md`](./main.md)
**Depends on**: 01

## Objective

Create a `<WeightChart>` component that renders a Recharts `LineChart` of weight over time, navigates to `/graficos` on click, and handles empty state.

## Context

- Recharts 2.15.4 is installed but not yet imported anywhere in `src/`
- Import pattern: `import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"`
- Chart must be wrapped in a Chakra `Box` for layout, not Tailwind
- X-axis: `measuredAt` dates, formatted as `DD/MM` (use `toLocaleDateString("pt-BR")` or a formatter function)
- Y-axis: `weight` in kg
- Responsive: `ResponsiveContainer width="100%"`, fixed `height={300}` or similar
- Click: wrap in a clickable element that calls `router.push("/graficos")` — use `useRouter` from `next/navigation`
- Portuguese label: Y-axis "Peso (kg)", X-axis "Data"
- Empty state: show a text "Sem dados de peso" when no measurements
- Component location: `src/components/dashboard/weight-chart.tsx`

## Approach

1. Write failing test at `src/components/dashboard/weight-chart.test.tsx`:
   - Wrap in `ChakraProvider` + `MemoryRouter` (or mock `next/navigation`)
   - Render with 3+ sample measurements, assert chart renders (check for SVG elements or Recharts container)
   - Assert click navigates to `/graficos`
   - Test empty state: no measurements shows "Sem dados de peso"
2. Confirm test fails.
3. Create `src/components/dashboard/weight-chart.tsx`:
   - Props: `{ measurements: MeasurementInput[] }`
   - Sort ascending by `measuredAt` for chart
   - Map to `{ date: string, weight: number }` for Recharts data
   - Render `ResponsiveContainer` > `LineChart` > `CartesianGrid`, `XAxis`, `YAxis`, `Tooltip`, `Line`
   - Wrap in `Box onClick` that pushes to `/graficos`
   - Empty state: render placeholder `Text` instead of chart
4. Confirm tests pass.
5. Refactor: extract date formatter, extract chart colors from theme tokens.

## Acceptance

- [ ] Renders a line chart with weight data points when measurements provided
- [ ] X-axis labels show dates in DD/MM format
- [ ] Y-axis shows weight in kg
- [ ] Clicking chart navigates to `/graficos`
- [ ] Full width, fixed height, responsive
- [ ] Empty state renders "Sem dados de peso" text

## Verification

```
npm test -- src/components/dashboard/weight-chart.test.tsx
```

## Commit

```
feat(dashboard): add WeightChart component with Recharts
```

## Notes

- Recharts test strategy: since Recharts renders SVG, tests can check for SVG elements. Use `screen.getByText` for date labels and weight values. Mock `next/navigation`'s `useRouter` to assert navigation.
- Chart library alternative was considered but Recharts is already in `package.json` — use it.
