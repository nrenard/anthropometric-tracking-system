# Consistency Audit — Anthropometric Tracking System

**Date**: 2026-05-02  
**Tests**: 39 files, 387 tests, all passing  
**Scope**: Schema/validation, API routes, hooks, UI, calculations, models

---

## 1. Critical — Interface Drift Between `calculations.ts` and Models

A `MeasurementInput` type exists both in `calculations.ts` (line 104) and in `validation.ts` (as Zod-inferred). The calculations interface is **stricter** than the model — it requires `skinfolds`, `perimeters`, and `diameters` to be present (non-optional), while the Mongoose model and Zod schemas mark them all as `optional`.

**Files affected**: `src/lib/calculations.ts:104-129` vs `src/models/measurement.ts:47-59`

**Impact**: UI code in `page.tsx:47-76` (dashboard) works around this by providing fallback values (`?? { chest: 0, ... }`). The compute page (`comparar/page.tsx:107-128`) returns `null` if any optional data is missing. The graphs page (`graficos/page.tsx:291-318`) does the same null-return pattern. Three different fallback strategies for the same problem.

**Risk**: If a new page is added that calls `computeAllMetrics` without applying the correct fallback, it will crash at runtime with `Cannot read property 'chest' of undefined`.

**Recommendation**: Either make the `MeasurementInput` in `calculations.ts` accept optional sub-objects (and return partial metrics), or create a single `toMeasurementInput` utility shared by all consumers.

---

## 2. High — Missing Perimeters Fields in Detail/Compare/Chart UI Types

The `DetailMeasurement` interface in `historico/[id]/page.tsx:43-70` and the `CompareMeasurement` interface in `comparar/page.tsx:30-57` both omit fields that exist in the Mongoose model:

| Field | In Model | In `DetailMeasurement` | In `CompareMeasurement` |
|-------|----------|----------------------|----------------------|
| `perimeters.neck` | yes | **MISSING** | **MISSING** |
| `perimeters.abdomen` | yes (optional) | **MISSING** | **MISSING** |
| `perimeters.chest` | yes (optional) | **MISSING** | **MISSING** |

**Impact**: If the API returns these fields (it will — the GET route returns the full document), TypeScript won't catch any attempt to read them, but the fields will silently exist at runtime. This is a type-safety gap, not a runtime bug.

**File**: `src/app/historico/[id]/page.tsx:59-66`, `src/app/comparar/page.tsx:46-53`

**Recommendation**: Include all fields in the interface or use a shared type from the model.

---

## 3. High — Sorting Order Mismatch: API Route vs Server Action

- `GET /api/profiles` uses `sort({ createdAt: -1 })` (**descending**, newest first) — `profiles/route.ts:15`
- `getProfiles()` server action uses `sort({ createdAt: 1 })` (**ascending**, oldest first) — `profile-actions.ts:53`

**Impact**: UI consuming server actions will see profiles in opposite order from UI consuming the API. This is a real behavioral inconsistency.

**Files**: `src/app/api/profiles/route.ts:15` vs `src/app/actions/profile-actions.ts:53`

---

## 4. High — Validation Schema vs Mongoose Schema: Number Range Gaps

| Field | Mongoose `min` | Zod |
|-------|---------------|-----|
| `weight` | `min: 0` | `.positive()` (>0) + `.max(700)` |
| `height` | `min: 0` | `.positive()` (>0) + `.max(300)` |
| `skinfold.*` | `min: 0` | `.positive()` (>0) + `.max(100)` |
| `diameter.*` | `min: 0` | `.positive()` (>0) |

**Impact**: A `weight` of `0` passes Mongoose validation but is rejected by Zod. Same for `height` and diameters. This is caught at the API layer (Zod validates before Mongoose saves), but direct model usage (e.g., in tests or server actions) would allow zero values through.

**Conflict**: The `e2e.test.ts` creates measurements via Mongoose directly and could bypass Zod validation.

**Files**: `src/models/measurement.ts:52` vs `src/lib/validation.ts:46-47`, etc.

---

## 5. Medium — Duplicated `toProfileInput` / `toMeasurementInput` Functions

The same pattern of converting API-flat objects to `calculations.ts` interfaces appears in 4 different files:

- `src/app/page.tsx:37-76` (dashboard)
- `src/app/historico/[id]/page.tsx:84-115` (detail)
- `src/app/comparar/page.tsx:97-128` (compare)
- `src/app/graficos/page.tsx:281-289` (charts)

These functions have slightly different behaviors (e.g., fallback heights, fallback zero-values vs null returns). Significant DRY violation with risk of divergence.

**Recommendation**: Extract a single `toMeasurementInput` utility to `src/lib/measurement-utils.ts`.

---

## 6. Medium — Inconsistent Auth Guard Patterns

Three different auth patterns exist:

| Pattern | Used In |
|---------|---------|
| Inline `const session = await getSession(); const unauthorized = requireAuth(session)` | `measurements/route.ts`, `measurements/[id]/route.ts` |
| Shared `ensureAuthenticated()` helper from `_helpers.ts` | `profiles/route.ts`, `profiles/[id]/route.ts` |
| Imported `authGuard()` local function | `measurements/[id]/route.ts:15-18` (yes, same file uses both patterns) |

**File**: `src/app/api/measurements/[id]/route.ts:15-18` defines `authGuard()` but also uses it only for 3 methods, while `measurements/route.ts` uses the inline pattern. Inconsistent within the same resource.

**Recommendation**: Pick one pattern and apply it everywhere.

---

## 7. Medium — Response Status Code Inconsistencies

### Invalid ObjectId handling:
| Route | Invalid ObjectId → Status |
|-------|--------------------------|
| `GET /api/measurements` | `200` (returns `[]`) |
| `GET /api/measurements/[id]` | `400` |
| `PUT|DELETE /api/measurements/[id]` | `400` |
| `GET|PUT|DELETE /api/profiles/[id]` | `400` |

- `GET /api/measurements` returning `200` for an invalid `profileId` is **correct** (empty result is valid), but inconsistent with the `[id]` routes returning `400` for invalid IDs.

### Error response shapes:
| Route | Error body |
|-------|-----------|
| Login | `{ error: "..." }` |
| Measurements | `{ error: "..." }` or `[]` |
| Profiles | `{ error: "..." }` |
| All success responses | Vary: `{ ok: true }`, raw document, `created.toObject()`, `.lean()` result |

The `lean()` vs `toObject()` distinction means IDs are sometimes plain objects and sometimes ObjectId instances (though this is likely serialized consistently by `Response.json`).

---

## 8. Medium — `ProfileDTO` Interface Used Across Multiple Files but Not Co-located

`ProfileDTO` is defined in `profile-actions.ts` (server-only code) but imported by:
- `comparar/page.tsx:25` (client component)
- `graficos/page.tsx:22` (client component)

**Risk**: The `"use server"` directive in `profile-actions.ts` could cause issues if tree-shaking or bundling changes. The type import pattern `import type { ProfileDTO }` is correct and safe, but it's an unusual dependency direction (client importing types from a server action file).

**Files**: `src/app/actions/profile-actions.ts:9-18`, `src/app/comparar/page.tsx:25`, `src/app/graficos/page.tsx:22`

---

## 9. Medium — Dead / Suspicious Code

### `void PERIMETER_OPTIONAL_FIELDS` (use-measurement-wizard.ts:379)
```ts
void PERIMETER_OPTIONAL_FIELDS
```
This `void` expression does nothing. The `PERIMETER_OPTIONAL_FIELDS` array is computed and discarded. It's likely leftover from a refactor where the optional fields were used to gate the perimeters block, but now the code uses `parsePositive` inline (lines 373-376).

**File**: `src/hooks/use-measurement-wizard.ts:379`

### `validateStep` on step 1
The `validateStep` function in `use-measurement-wizard.ts:272-291` only validates step 1 (weight). Steps 2-5 have no validation — the `next()` call succeeds even if all skinfold fields are empty. The wizard allows saving a measurement with only weight.

**File**: `src/hooks/use-measurement-wizard.ts:272-291`

---

## 10. Medium — No `profileId` Validation on GET Single Measurement

`GET /api/measurements/[id]` (`route.ts:24-35`) does not verify that the measurement belongs to the active profile. Any authenticated user can view any measurement by ID, even from other profiles.

**Same issue applies to**: `PUT /api/measurements/[id]` and `DELETE /api/measurements/[id]`

**Impact**: Cross-profile data access. If the user has profile A active, they can still manipulate profile B's measurements by knowing the ID. Not a security issue in single-user context but a data integrity issue for multi-user or correct profile scoping.

**File**: `src/app/api/measurements/[id]/route.ts:24-81`

---

## 11. Low — Metric Card Tests Depend on `green.500`/`red.500` Tokens

`metric-cards.test.tsx` checks for `green.500` and `red.500` color values directly. If the Chakra theme tokens change, these tests break. Better to use `fg.success`/`fg.error` semantic tokens or `data-direction` attributes.

**File**: `src/components/dashboard/metric-cards.test.tsx`

---

## 12. Low — Graph Page: Waist/Hip Direct Field Access Without Fallback

In `graficos/page.tsx:291-318`, the `extractMetricValue` function returns `null` if `measurement.height` is missing even when the selected metric is `waist` or `hip` (which don't need height). However, the `switch` handles `waist`/`hip` before the null check, so this is actually correct. But the fallthrough to `default` would require height unnecessarily.

**File**: `src/app/graficos/page.tsx:291-318`

---

## 13. Low — Mongoose `min: 0` but No `max` on Models

The Mongoose schemas for `weight`, `height`, `skinfolds.*`, and `diameters.*` have `min: 0` but **no `max` constraint**, while Zod has `max(700)` for weight and `max(300)` for height. The API layer catches these via Zod before saving, but direct model usage bypasses max checks.

**Files**: `src/models/measurement.ts:52-56`

---

## 14. Low — `useDashboardData` Hook Has Unused `errors` Checks

Looking at `page.tsx:74-97`, the `MetricCards` and `WeightChart` components receive `MeasurementInput[]` that uses fallback zero values for skinfolds, perimeters, and diameters. The calculated metrics will produce bogus values (BMI 0, BF% from sum of 0 skinfolds, etc.) if the measurement lacks those fields.

**File**: `src/app/page.tsx:47-76`

---

## Summary

| Severity | Count | Category |
|----------|-------|----------|
| Critical | 1 | Interface drift (calculations.ts vs models) |
| High | 3 | Missing fields in UI types, sort order mismatch, valid range gaps |
| Medium | 6 | Duplicated converters, inconsistent auth patterns, response shapes, DTO co-location, dead code, cross-profile access |
| Low | 4 | Hardcoded tokens, unnecessary null guards, missing model max constraints, fake-zero fallbacks |

### Top 3 Actions

1. **Unify `toMeasurementInput`/`toProfileInput` converters** — extract to a shared utility to eliminate 4 copies (DRY), align fallback strategies, and fix the critical interface drift.
2. **Add `profileId` ownership validation** to measurement-by-ID routes to prevent cross-profile data manipulation.
3. **Normalize auth guard pattern** — use the `_helpers.ts` shared helpers across all routes, or inline consistently.
