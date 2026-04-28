# Step 04 — Dashboard Data Hook

**Plan**: [`main.md`](./main.md)
**Depends on**: 01

## Objective

Create a `useDashboardData` hook that orchestrates fetching the active profile and the latest 3 measurements, returning all computed state (profile, current/previous/thirtyDay measurements, loading, error, empty).

## Context

- Uses `useActiveProfile()` from `src/hooks/use-active-profile.ts:1` to get `activeProfileId`
- Fetches profile: `GET /api/profiles/[activeId]` → raw Mongoose lean object
- Fetches measurements: `GET /api/measurements?profileId=[activeId]&limit=3&sort=desc` → array of raw lean objects
- Return shape:
  ```ts
  {
    profile: IProfile | null
    currentMeasurement: IMeasurement | null
    previousMeasurement: IMeasurement | null
    thirtyDayMeasurement: IMeasurement | null
    isLoading: boolean
    error: string | null
    isEmpty: boolean  // profile exists but no measurements
    noProfile: boolean // no active profile set
  }
  ```
- 30-day reference selection logic (from error fixing): iterate over the 3 returned measurements, compute absolute day difference from `current.measuredAt - 30 days`, pick closest within ±3 days. Already planned in step 01's `findThirtyDayReference` — consolidate the logic here and have step 01 just receive the pre-computed 30-day measurement.
- `fetch` calls are client-side — works because this is a `"use client"` hook
- Should NOT fetch if `activeProfileId` is null (sets `noProfile: true`)

## Approach

1. Write failing test at `src/hooks/use-dashboard-data.test.ts`:
   - Mock `useActiveProfile` to return controlled `activeProfileId`
   - Mock `fetch` to return sample profile + 3 measurements
   - Test: all data loads → returns correct profile and measurements
   - Test: loading state → `isLoading: true` during fetch
   - Test: network error → `error` set
   - Test: no active profile → `noProfile: true`, no fetch calls
   - Test: profile exists, no measurements → `isEmpty: true`
   - Test: 30-day reference within ±3 days correctly identified
2. Confirm test fails.
3. Create `src/hooks/use-dashboard-data.ts`:
   - Call `useActiveProfile()` to get `activeProfileId`
   - Use `useState` for profile, measurements, loading, error
   - Use `useEffect` keyed on `activeProfileId`
   - `fetch` profile and measurements in parallel
   - Compute current/previous/thirtyDay from returned array
   - Derive `noProfile`, `isEmpty` booleans
4. Confirm tests pass.
5. Refactor: extract `findClosestMeasurement(date, measurements, toleranceDays)` as a pure utility (can go in `src/lib/calculations.ts` or a new `src/lib/date-utils.ts`).

## Acceptance

- [ ] Returns profile and 3 measurements when data loads successfully
- [ ] `isLoading: true` during initial fetch
- [ ] `error` set when fetch fails
- [ ] `noProfile: true` when active profile is null
- [ ] `isEmpty: true` when profile exists but measurements array is empty
- [ ] `thirtyDayMeasurement` is the closest measurement within ±3 days of current date minus 30 days
- [ ] `thirtyDayMeasurement` is null when no measurement falls within the window

## Verification

```
npm test -- src/hooks/use-dashboard-data.test.ts
```

## Commit

```
feat(dashboard): add useDashboardData hook for fetching profile and measurements
```

## Notes

- The hook uses standard `fetch` API (browser built-in). No need for axios or SWR — keep it simple.
- The 30-day finding algorithm must handle edge cases: exactly 1 or 2 measurements total, dates far apart, etc.
- Consider deduplication: the `findThirtyDayReference` logic from step 01 should be co-located here, then step 01 simply receives the resolved `thirtyDayMeasurement` as a prop. Update step 01's MetricCards props to accept the pre-computed measurements.
