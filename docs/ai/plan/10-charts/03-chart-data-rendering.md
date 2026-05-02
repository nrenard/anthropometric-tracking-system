# Step 03 — Data fetching & AreaChart rendering

**Plan**: [`main.md`](./main.md)
**Depends on**: 02

## Objective

Implement data fetching, metric computation, and the Recharts `<AreaChart>` with gradient fill, custom tooltip, and data point dots. Wire the chart to respond to metric and period selections from step 02.

## Context

- Page file: `src/app/graficos/page.tsx` — add chart to existing page shell
- Test file: `src/app/graficos/page.test.tsx` — extend existing test suite
- `computeAllMetrics()` at `src/lib/calculations.ts:152` — needs `MeasurementInput` + `ProfileInput`
- `activeProfile` from `useActiveProfile()` gives full profile (sex, dateOfBirth) for computations
- `subDays`, `subMonths`, `subYears` from `src/lib/date-utils.ts:17-33` for period-to-date conversions
- Recharts components needed: `AreaChart`, `Area`, `ResponsiveContainer`, `XAxis`, `YAxis`, `Tooltip`, `CartesianGrid`, `defs`, `linearGradient`
- Single chart color: `#3182ce` (Chakra blue.500)
- Date format on X-axis: `DD/MM/YY` (e.g., "15/04/26")
- Recharts mock pattern: all chart components rendered as simple `<div>` testids in tests (see `weight-chart.test.tsx`)

### Metric accessor mapping

| Metric key | Accessor (`m` = measurement, `c` = `computeAllMetrics` result) |
|---|---|
| `weight` | `m.weight` |
| `bodyFatPercent` | `c.bodyFatPercent` — skip if no skinfolds |
| `leanMass` | `c.leanMass` — skip if no skinfolds |
| `fatMass` | `c.fatMass` — skip if no skinfolds |
| `bmi` | `c.bmi` — needs weight + height |
| `waist` | `m.perimeters?.waist` — skip if missing |
| `hip` | `m.perimeters?.hip` — skip if missing |
| `waistToHip` | `c.waistToHip` — needs waist + hip |
| `waistToHeight` | `c.waistToHeight` — needs waist + height |
| `bmr` | `c.bmr` — needs sex, weight, height, dateOfBirth |

Skip any data point where the required fields are missing (`undefined`/`null`).

## Approach

1. Write failing chart tests in `page.test.tsx`:
   - Mock `fetch` to return measurement data (3+ measurements with measuredAt, weight, height, skinfolds, perimeters)
   - **Chart renders**: verify area chart container with `data-testid` and data points
   - **Data points**: verify correct number of data point elements based on mock data
   - **Tooltip**: simulate hover → verify tooltip shows date + value + unit
   - **Single data point**: mock 1 measurement → verify solitary dot (no line paths)
   - **Metric switch**: change metric → verify fetch called with new params, chart re-renders
   - **Period switch**: change period → verify fetch called with different `from` param
   - **Body fat skip**: mock data where one measurement lacks skinfolds → verify it's excluded from bodyFatPercent chart
2. Confirm tests fail
3. Add functional data fetching in page state:
   - `useEffect` on `[activeProfileId, selectedPeriod]` — fetch `GET /api/measurements?profileId=...&from=...&to=...&sort=asc`
   - `from` derived from `selectedPeriod` using `subDays`/`subMonths`/`subYears`; `null` for "Tudo"
   - `to` = `new Date().toISOString()` (or omit for "up to now")
   - Handle fetch errors: show error message in Portuguese
4. Add metric computation logic:
   - `getMetricValue(measurement, profile)` function: switch on `selectedMetric` key, compute or extract value
   - Use `computeAllMetrics` once per measurement (not per metric) for efficiency when using computed metrics
   - Return `{ date: string, value: number }` pairs, sorted ascending
   - Filter out points where metric is not computable
5. Add AreaChart rendering in the chart-area placeholder:
   ```tsx
   <ResponsiveContainer width="100%" height={400}>
     <AreaChart data={chartData}>
       <defs>
         <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
           <stop offset="5%" stopColor="#3182ce" stopOpacity={0.8} />
           <stop offset="95%" stopColor="#3182ce" stopOpacity={0.1} />
         </linearGradient>
       </defs>
       <CartesianGrid strokeDasharray="3 3" />
       <XAxis dataKey="date" />
       <YAxis />
       <Tooltip content={<CustomTooltip />} />
       <Area
         type="monotone"
         dataKey="value"
         stroke="#3182ce"
         fill="url(#chartGradient)"
         dot={{ r: 3 }}
         activeDot={{ r: 5 }}
       />
     </AreaChart>
   </ResponsiveContainer>
   ```
   - `date` key: formatted as `DD/MM/YY`
   - `YAxis` label: metric unit from the definitions table
   - `CustomTooltip`: shows date (DD/MM/YYYY) + value (2 decimal places) + unit
   - Single point: render dot only, no line (`dot` present, data length === 1)
6. Confirm all tests pass + `npm run lint`

## Acceptance

- [ ] Chart renders responsive area chart with gradient fill
- [ ] X-axis shows dates in "DD/MM/YY" format
- [ ] Y-axis shows metric value with correct unit label
- [ ] Tooltip displays date, value (2 decimal places), and unit on hover
- [ ] Changing metric selector updates chart to new metric
- [ ] Changing period filter re-fetches data for new date range
- [ ] Body fat % / computed metrics skip measurements without required fields
- [ ] Single measurement renders solitary dot (no area fill)
- [ ] Error state: shows error message in Portuguese on fetch failure
- [ ] All tests pass + lint green

## Verification

```
npm test -- src/app/graficos/page.test.tsx
npm run lint
```

## Commit

```
feat(charts): implement data fetching and AreaChart rendering
```

## Notes

- `computeAllMetrics` is called once per measurement during data processing; cache the profile-derived values if needed (but ~260 data points is trivial)
- For "Tudo" period, omit `from` query param entirely (API defaults to no lower bound)
- Recharts `activeDot` provides the hover indicator; `dot` renders all data points as small circles
- If date formatting for X-axis causes crowding, `<XAxis>` supports `tickFormatter` to limit labels
