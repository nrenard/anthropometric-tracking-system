# Charts & Trends

**Type**: Feature
**Status**: Draft
**Created**: 2026-04-27

---

## Problem

No chart views exist. Users need to visualize metric trends over time with configurable metric selection and period filters — per spec screen #7.

## Context

- Spec defines Charts screen: metric selector, period filters (7d/30d/90d/6m/1y/all), line/area chart (`spec.md:80`)
- Recharts is installed (v2.15+) — `<ResponsiveContainer>`, `<LineChart>`, `<AreaChart>`, `<XAxis>`, `<YAxis>`, `<Tooltip>`
- Data comes from `GET /api/measurements?profileId=[activeId]` with `from`/`to` date range params
- Profile fetched from `GET /api/profiles/[activeId]` for sex/age (needed for body fat %, BMR, etc.)
- Calculation functions from `docs/ai/brief/02-data-models.md`
- No bottom nav link — accessible from dashboard chart click-through or dedicated nav item (see Open Questions)

## Proposal

Create `src/app/graficos/page.tsx`.

### Layout

**Top bar**: metric selector + period filter side by side.

**Metric selector** (dropdown or horizontal scrollable chips):
- Peso (weight)
- % Gordura Corporal (body fat %)
- Massa Magra (lean mass)
- Massa Gorda (fat mass)
- IMC (BMI)
- Circunferência da Cintura (waist)
- Circunferência do Quadril (hip)
- RCQ — Relação Cintura-Quadril (waist-to-hip ratio)
- RCE — Relação Cintura-Estatura (waist-to-height ratio)
- TMB — Taxa Metabólica Basal (BMR)

**Period filter** (chips):
- 7 dias / 30 dias / 90 dias / 6 meses / 1 ano / Tudo

### Chart

- Recharts `<AreaChart>` with gradient fill (primary color with opacity)
- X-axis: date (formatted "DD/MM/YY")
- Y-axis: metric value with unit
- Tooltip on hover: date + value + unit
- `<ResponsiveContainer>` for full-width responsive rendering
- Data points as small dots on the line

### Data Processing

- Fetch all measurements in selected period for active profile from API (`?profileId=[activeId]&from=...&to=...`)
- Compute the selected metric for each measurement using `computeAllMetrics` (or direct formula for simple metrics)
- Only include data points where the metric is computable (e.g., body fat % only for measurements with skinfolds)
- Sort by date ascending for chart

### States

**Loading**: skeleton/chart placeholder while fetching
**Empty**: "Nenhum dado disponível para o período selecionado" when no measurements exist in range
**No profile**: "Selecione um perfil para ver os gráficos" when no active profile
**Single point**: if only one measurement, show a single dot with value (no line)

### Out of scope

- Multiple metrics overlaid on one chart
- Chart annotations (notes on data points)
- Custom date range picker (predefined periods only for v1)
- Export chart as image
- Goal lines/horizontal reference lines

## Acceptance Criteria

- [ ] Metric selector switches the chart to show the selected metric (scoped to active profile)
- [ ] Period filter chips fetch data for the selected date range
- [ ] Chart renders as a responsive area chart with date X-axis and value Y-axis
- [ ] Tooltip shows date + value + unit on hover
- [ ] Body fat % and other computed metrics display correctly (require profile + raw data)
- [ ] "No profile" state when no active profile
- [ ] Empty state when no data in selected period
- [ ] Single data point renders as a solitary dot
- [ ] Loading state while fetching
- [ ] All labels and messages in Portuguese

## Risks & Trade-offs

- **Computed metric performance**: each chart render computes metrics for all measurements in range. For a single user, even 5 years of weekly measurements is ~260 data points — trivial for pure JS calculations. No server-side pre-computation needed.
- **Chart color consistency**: each metric should have a distinct color for brand consistency. Define a color map; keep chart color consistent regardless of metric (or assign per-metric colors — see Open Questions).

## Open Questions

- Should the charts page be in the bottom nav? Currently 4 items: Início, Medir, Histórico, Config. (Assumption: add a 5th "Gráficos" item, or make it accessible from dashboard chart click + history sub-navigation. Leaning toward adding it as a 5th nav item since charts are core functionality.)
- Different chart color per metric, or one app-primary color for all? (Assumption: one primary blue/green color matching the theme — simpler, cleaner.)

## References

- `spec.md:80` — charts screen specification
- `spec.md:62-70` — list of all metrics that can be charted
- `docs/ai/brief/02-data-models.md` — calculations module
- `docs/ai/brief/03-multi-profile-support.md` — active profile cookie, profile scoping
- `docs/ai/brief/05-api-routes.md` — API endpoints
- `docs/ai/brief/07-dashboard.md` — dashboard chart (simpler version, click-through to this screen)
