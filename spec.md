# Project Brief — Anthropometric Tracking System

## Overview

A personal web/mobile application for recording body measurements (weight, height, skinfolds via caliper, perimeters, bone diameters) and tracking body composition evolution over time through history, comparisons, and charts. Single-user, mobile-first.

**System UI language:** Portuguese (pt-BR).
**Codebase language:** English (variables, comments, commits).

## Tech Stack

- **Frontend:** Next.js (App Router) + Chakra UI
- **Backend:** Next.js API Routes
- **Database:** MongoDB (e.g. MongoDB Atlas)
- **ODM:** Mongoose
- **Hosting:** Vercel
- **Approach:** Mobile-first, desktop as secondary

## Authentication (v1)

- Single-user credentials stored in environment variables (`AUTH_USER`, `AUTH_PASSWORD_HASH`)
- Password hashed with bcrypt/argon2 — never plain text
- Session via signed httpOnly cookie
- No registration screen

## User Profile

Editable via settings screen:

- Name
- Date of birth (required — used by body fat formulas)
- Sex (M/F — required, protocol equations differ)
- Default height (overridable per measurement)

## Measurement Record

Each record stores date/time + free-text notes field (e.g. "fasted morning", "post-workout").

### Basic

- Weight (kg, 1 decimal)
- Height (cm, optional re-measurement)

### Skinfolds — Jackson & Pollock 7-site protocol (mm, 1 decimal, single reading)

Chest, midaxillary, triceps, subscapular, abdominal, suprailiac, thigh.

> Chosen for being the most widespread protocol in literature and practice, validated for both sexes with the same collection set, well-documented in learning materials, and offering acceptable error margin with consistent technique.

### Perimeters (cm, 1 decimal, both sides where applicable)

Neck, waist, hip, abdomen, chest, contracted arm (L/R), forearm (L/R), medial thigh (L/R), calf (L/R).

### Bone diameters (cm, 1 decimal)

Humerus biepicondylar, femur biepicondylar — used for bone mass estimation.

## Calculations (computed on-the-fly, not persisted)

Raw measurements are the only source of truth. Derived values are recalculated on read so protocols can evolve without data loss.

- **BMI** — weight / height²
- **Body density** — Jackson & Pollock 7-site equation (sex-specific)
- **Body fat %** — Siri equation, from density
- **Fat mass / lean mass** (kg)
- **Estimated bone mass** — Matiegka (labeled as _anthropometric estimate_, not "bone density" — true BMD requires DEXA)
- **Estimated muscle mass / residual mass** — Matiegka derivatives
- **Waist-to-hip ratio**
- **Waist-to-height ratio**
- **BMR** — Mifflin-St Jeor

## Screens

1. **Login** — email + password
2. **Dashboard / Home** — latest measurement summary, key metric cards with delta vs previous and vs 30 days, primary chart
3. **New Measurement** — multi-step wizard (basic → skinfolds → perimeters → diameters → review & save), numeric inputs with `inputMode="decimal"`
4. **History** — chronological list with edit/delete, period filters
5. **Measurement Detail** — all raw values + computed metrics
6. **Compare** — pick two measurements, show absolute and % deltas across all metrics
7. **Charts** — metric selector (weight, body fat %, lean mass, waist, etc.) with period filters (7d / 30d / 90d / 6m / 1y / all)
8. **Profile / Settings** — edit profile, theme toggle

## UX & Design

- **Theme:** clean minimalist, with light and dark modes (respects system preference, manual toggle available)
- **Charts library:** Recharts (responsive, plays well with Chakra)
- **Mobile-first:** wizard-style forms, large tap targets, decimal numeric keyboards, bottom navigation on mobile
- **PWA:** installable, basic offline support for recording measurements (sync when back online)

## Data Model (MongoDB collections)

**`profile`** (single document)

```
{ name, email, dateOfBirth, sex, defaultHeight, createdAt, updatedAt }
```

**`measurements`**

```
{
  _id,
  measuredAt: Date,
  notes: String,
  weight: Number,
  height: Number,
  skinfolds: {
    chest, midaxillary, triceps, subscapular,
    abdominal, suprailiac, thigh
  },
  perimeters: {
    neck, waist, hip, abdomen, chest,
    arm: { left, right },
    forearm: { left, right },
    thigh: { left, right },
    calf: { left, right }
  },
  diameters: { humerus, femur },
  createdAt, updatedAt
}
```

## Out of Scope (v1)

- Multi-user support and registration flow
- Goals and alerts
- Progress photos
- CSV/JSON export
- Native mobile app (PWA covers mobile use)

## Future Considerations (v2+)

- Multi-user with proper auth (Supabase/Auth.js)
- Progress photos via cloud storage
- Goals, alerts, and reminders
- Data export and import
- Additional body fat protocols (Faulkner, Petroski, Guedes, 3-site J&P)
- Multiple readings per skinfold with auto-averaging

---
