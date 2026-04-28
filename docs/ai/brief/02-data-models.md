# Data Models & Calculations

**Type**: Feature
**Status**: Draft
**Created**: 2026-04-27

---

## Problem

No Mongoose schemas exist yet. The app needs `Profile` and `Measurement` collections as defined in `spec.md`, plus on-the-fly calculation functions for body composition metrics that must never be persisted (computed on read only).

## Context

- MongoDB connection is live via `src/lib/mongodb.ts:1` (cached global singleton)
- Spec defines two collections: `profile` (single document) and `measurements` (`spec.md:90-121`)
- All derived values (BMI, body fat %, etc.) are computed on read, not stored — source of truth is raw measurements (`spec.md:58-61`)
- Sex-specific equations for body density (Jackson & Pollock 7-site) and BMR (Mifflin-St Jeor)
- Built with strict TypeScript; Mongoose v8.23.1 installed

## Proposal

### Mongoose Models

Create `src/models/profile.ts` and `src/models/measurement.ts`:

- **Profile**: single-document model. Fields: `name`, `email`, `dateOfBirth`, `sex` (`M`/`F`), `defaultHeight`. Pre-save hook that ensures only one document exists (upsert pattern).
- **Measurement**: full record per `spec.md:98-121`. Subdocument schemas for `skinfolds` (7 fields), `perimeters` (nested `arm`/`forearm`/`thigh` with L/R), `diameters` (2 fields). Timestamps enabled. Index on `measuredAt` descending.

### Calculation Functions

Create `src/lib/calculations.ts` with pure functions (no side effects, no DB access):

| Function | Input | Output |
|---|---|---|
| `bmi(weightKg, heightCm)` | weight, height | number |
| `bodyDensity(sex, age, skinfolds)` | sex, age, 7 skinfold values | number (J&P 7-site, sex-specific equation) |
| `bodyFatPercent(bodyDensity)` | density | number (Siri equation) |
| `fatMass(weight, bfPercent)` | weight, bf% | number (kg) |
| `leanMass(weight, fatMass)` | weight, fat mass | number (kg) |
| `boneMass(humerusCm, femurCm, heightCm)` | bone diameters, height | number (Matiegka) |
| `muscleMass(...)` | perimeters, height, skinfolds | number (Matiegka derivative) |
| `waistToHip(waist, hip)` | waist, hip cm | number |
| `waistToHeight(waist, height)` | waist, height cm | number |
| `bmr(sex, weight, height, age)` | weight kg, height cm, age | number (Mifflin-St Jeor) |
| `computeAllMetrics(measurement, profile)` | full measurement + profile | object with all derived values |

### Validation

- Zod schemas reused from `src/lib/env.ts` pattern for runtime validation
- Measurement fields: positive numbers, 1 decimal max, reasonable max ranges
- Sex enum, dateOfBirth must be in the past

### Out of scope

- Additional body fat protocols (Faulkner, Petroski, Guedes, 3-site J&P) — v2+
- Multiple skinfold readings with auto-averaging — v2+
- DEXA-derived bone density (Matiegka is labeled as "anthropometric estimate" per spec)

## Acceptance Criteria

- [ ] `Profile` model enforces single-document constraint (upsert, never creates second document)
- [ ] `Measurement` model validates all nested subdocuments and required fields
- [ ] `computeAllMetrics` returns all derived values without throwing for valid inputs
- [ ] BMI, body density, body fat %, BMR match known reference values against test fixtures
- [ ] Sex-specific equations produce different results for same raw inputs (M vs F)
- [ ] Calculation functions are pure — no imports from Mongoose or `src/lib/mongodb`

## Risks & Trade-offs

- **Wrong formula constants**: low risk — J&P 7-site and Siri equations are well-documented. Manual verification against published reference tables.
- **Single-document enforcement**: Mongoose unique indexes don't work perfectly for "ensure only one." Use pre-save hook with `findOneAndUpdate + upsert` to guarantee at most one profile document.

## Open Questions

- Should `defaultHeight` from profile auto-populate the measurement form? (Assumption: yes, as convenience — user can override per measurement.)

## References

- `spec.md:56-70` — full list of calculations
- `spec.md:90-121` — data model definitions
- `spec.md:44-46` — Jackson & Pollock 7-site skinfold protocol
- `src/lib/mongodb.ts:1` — existing MongoDB connection helper
- `src/lib/env.ts:1` — Zod validation pattern to follow
- `docs/ai/brief/01-project-scaffold.md` — prior completed brief
