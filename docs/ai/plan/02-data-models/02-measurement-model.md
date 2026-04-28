# Step 02 — Measurement model with subdocument schemas

**Plan**: [`main.md`](./main.md)
**Depends on**: 01

## Objective

Create `src/models/measurement.ts` — a Mongoose schema and model for the `Measurement` collection with nested subdocument schemas for `skinfolds`, `perimeters`, and `diameters`.

## Context

- Profile model at `src/models/profile.ts` already exists (step 01 sets the pattern)
- Same Mongoose conventions: `Schema`, `model`, `InferSchemaType`, `field!: Type`
- The schema is the most complex in the app — subdocuments with L/R nesting in perimeters

### Schema fields (per `spec.md:98-121`)

**Top-level**:
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `measuredAt` | Date | yes | index descending |
| `notes` | String | no | |
| `weight` | Number | yes | kg, positive |
| `height` | Number | yes | cm, positive |

**`skinfolds` subdocument** (all required, mm, positive):
`chest`, `midaxillary`, `triceps`, `subscapular`, `abdominal`, `suprailiac`, `thigh`

**`perimeters` subdocument** (all cm, positive):
| Field | Required |
|-------|----------|
| `neck` | yes |
| `waist` | yes |
| `hip` | yes |
| `abdomen` | no |
| `chest` | no |
| `arm.left` | yes |
| `arm.right` | yes |
| `forearm.left` | yes |
| `forearm.right` | yes |
| `thigh.left` | yes |
| `thigh.right` | yes |
| `calf.left` | yes |
| `calf.right` | yes |

**`diameters` subdocument** (all cm, positive):
| Field | Required |
|-------|----------|
| `humerus` | yes |
| `femur` | yes |

- Timestamps enabled (`createdAt`, `updatedAt`)
- Index on `measuredAt` descending
- No unique constraints beyond `_id`

## Approach

1. Write a failing test in `src/models/measurement.test.ts` that creates a valid measurement with all subdocuments
2. Confirm the test fails
3. Create `src/models/measurement.ts` with:
   - `SkinfoldsSubdoc` schema (7 fields)
   - `ArmPerimetersSubdoc` schema (left, right)
   - `ForearmPerimetersSubdoc` schema (left, right)
   - `ThighPerimetersSubdoc` schema (left, right)
   - `CalfPerimetersSubdoc` schema (left, right)
   - `PerimetersSubdoc` schema (nesting the L/R subdocs)
   - `DiametersSubdoc` schema (2 fields)
   - `MeasurementSchema` (top-level with `measuredAt` index)
   - `Measurement` model
4. Confirm the basic save test passes
5. Add tests for: required field validation, positive number rejection, subdocument validation, index existence
6. Confirm all tests pass

## Acceptance

- [ ] `Measurement` model exists at `src/models/measurement.ts`
- [ ] All nested subdocument fields validate correctly (positive numbers, required fields enforced)
- [ ] `measuredAt` has a descending index
- [ ] Timestamps are automatically managed
- [ ] Test file at `src/models/measurement.test.ts` passes

## Verification

```bash
npm test -- src/models/measurement.test.ts
npm run lint
```

## Commit

```
feat(models): add Measurement Mongoose schema with subdocument schemas
```

## Notes

- Perimeters use nested L/R subdocuments for `arm`, `forearm`, `thigh`, `calf` — not a flat `{ armLeft, armRight }` structure. This mirrors the spec's nested object shape.
- The `arm` subdoc is reused? No — `arm`, `forearm`, `thigh`, `calf` each have `{ left, right }`. One reusable `LeftRightSubdoc` schema can serve all four. Create it once and reuse.
