# API Routes (Measurement & Profile CRUD)

**Type**: Feature
**Status**: Draft
**Created**: 2026-04-27

---

## Problem

No API endpoints exist. The client needs REST endpoints to create, read, update, and delete measurements and profiles, with session-based auth checking on every request. Brief 03 established the multi-profile model — this brief implements the API contract it defined.

## Context

- Next.js API routes live under `src/app/api/` (directory does not exist yet)
- Mongoose models from `docs/ai/brief/02-data-models.md` as refactored by `docs/ai/brief/03-multi-profile-support.md`:
  - Profile is a collection (no single-doc constraint)
  - Measurement has `profileId: ObjectId` with `{ profileId: 1, measuredAt: -1 }` index
- Session helper from `docs/ai/brief/04-authentication.md` (`src/lib/session.ts`)
- Active profile ID stored in `ACTIVE_PROFILE_ID` cookie (set by client, read by API for validation)
- All endpoints return JSON; all require authenticated session
- Spec specifies CRUD on measurements, read/update on profile (`spec.md:74-81`)
- Portuguese system language — API error messages in pt-BR

## Proposal

### Auth Middleware

Create `src/lib/auth.ts`:
- `requireAuth(session)` — throws 401 if session missing or not authenticated
- Reusable across all API route handlers
- Additional helper `getActiveProfileId(request)` — reads `ACTIVE_PROFILE_ID` cookie, validates it exists and belongs to the session scope

### Measurement Endpoints

All measurement endpoints are scoped to a profile.

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/measurements` | List measurements for a profile. Required query param: `profileId`. Optional: `from`, `to` (date range), `limit`, `sort` (default: `measuredAt` desc). Returns 400 if `profileId` missing or profile not found. |
| `POST` | `/api/measurements` | Create measurement. Body must include `profileId`. Validates profile exists. Returns 400 if `profileId` missing or invalid. Returns 201 with created doc. |
| `GET` | `/api/measurements/[id]` | Get single measurement by ID. Returns 404 if not found. |
| `PUT` | `/api/measurements/[id]` | Update measurement. Validates body. Returns updated doc. |
| `DELETE` | `/api/measurements/[id]` | Delete measurement. Returns 204. |

### Profile Endpoints

Profiles are now a full collection.

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/profiles` | List all profiles. Returns array (empty array if none). |
| `POST` | `/api/profiles` | Create a new profile. Validates body (name, dateOfBirth, sex required; defaultHeight optional). Returns 201 with created doc. |
| `GET` | `/api/profiles/[id]` | Get a single profile by ID. Returns 200 with profile or 404. |
| `PUT` | `/api/profiles/[id]` | Update a profile. Validates body. Returns updated doc. |
| `DELETE` | `/api/profiles/[id]` | Delete a profile and cascade-delete all its measurements. Returns 204. Deleting the last profile is allowed. |

### Validation

- `POST /api/measurements` and `PUT /api/measurements/[id]`: validate measurement body structure (weight required, others optional per spec). `profileId` required on POST, validated as valid ObjectId pointing to existing profile.
- `POST /api/profiles` and `PUT /api/profiles/[id]`: validate name (required, min 2 chars), dateOfBirth (required, past date, age 1-120), sex (required, "M" or "F"), defaultHeight (optional, positive number).
- Reuse Zod schemas from models brief where possible.

### Error Handling

- All routes wrapped in try/catch with consistent JSON error format: `{ error: string }`
- 400 for validation errors and missing required params, 401 for unauthenticated, 404 for not found, 500 for server errors
- Error messages in pt-BR (e.g., "Perfil não encontrado", "Medicão não encontrada", "Sessão expirada", "ID do perfil é obrigatório")

### Out of scope

- Pagination metadata (total, pages) — simple `limit` + date-range filtering is enough for v1
- Bulk operations
- CSV/JSON export API (v2+)
- Soft delete — measurements and profiles are permanently deleted

## Acceptance Criteria

- [ ] `GET /api/measurements?profileId=...` returns measurements for that profile, newest first
- [ ] `GET /api/measurements?profileId=...&from=...&to=...` filters by date range
- [ ] `POST /api/measurements` creates a new measurement with valid data, returns 201
- [ ] `POST /api/measurements` returns 400 when `profileId` or weight is missing
- [ ] `POST /api/measurements` returns 400 when `profileId` does not match an existing profile
- [ ] `GET /api/measurements/[id]` returns single measurement or 404
- [ ] `GET /api/profiles` returns array of all profiles (empty array if none)
- [ ] `POST /api/profiles` creates a new profile with valid data, returns 201
- [ ] `GET /api/profiles/[id]` returns single profile or 404
- [ ] `PUT /api/profiles/[id]` updates profile, returns updated doc
- [ ] `DELETE /api/profiles/[id]` cascade-deletes profile and its measurements, returns 204
- [ ] All endpoints return 401 when called without valid session
- [ ] Error responses use Portuguese messages

## Risks & Trade-offs

- **No input sanitization beyond Zod**: Mongoose injection risk is low since Mongoose uses schema types, but unvalidated fields on PUT could allow extra properties. Mitigation: strict validation, strip unknown keys.
- **Cascade delete**: `DELETE /api/profiles/[id]` deletes all associated measurements. This is a single DB operation with `deleteMany({ profileId })` before deleting the profile. Atomicity is not guaranteed across two delete calls — if the server crashes between them, orphaned measurements remain. Mitigation: delete measurements first, then profile. Acceptable for single-user v1.

## Open Questions

- Should `GET /api/measurements` return computed metrics, or should the client call `computeAllMetrics` itself? (Assumption: client computes them — server returns raw data only, keeping the "source of truth" principle.)

## References

- `spec.md:90-121` — data model definitions
- `spec.md:58-61` — calculations are computed on-the-fly, not persisted
- `docs/ai/brief/02-data-models.md` — Mongoose models (Profile, Measurement)
- `docs/ai/brief/03-multi-profile-support.md` — API design contract this brief implements
- `docs/ai/brief/04-authentication.md` — session/auth prerequisite
