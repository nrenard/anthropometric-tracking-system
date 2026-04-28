# Step 03 — Create profile state management (context + cookie)

**Plan**: [`main.md`](./main.md)
**Depends on**: 01

## Objective

Create a React context and hook for managing the active profile, backed by an `ACTIVE_PROFILE_ID` cookie that survives page reloads, plus server actions for profile CRUD (as a bridge until brief 05 builds the REST API).

## Context

- No existing state management in the app — pure local component state
- No cookie handling exists yet — use `document.cookie` (no library needed)
- Next.js App Router — server actions are server functions exported from `"use server"` files that client components can call directly
- Profile model at `src/models/profile.ts` (collection, post step 01)
- Chakra UI v3 available for UI components (used in steps 04-05)
- New files to create: context, hook, cookie util, server actions
- Cookie name: `ACTIVE_PROFILE_ID` per brief line 49
- Cookie must survive page reloads — use `path=/` and reasonable `max-age` (30 days)

## Approach

1. Create `src/lib/cookies.ts` — `setActiveProfileId(id: string)`, `getActiveProfileId(): string | null`, `clearActiveProfileId()` using `document.cookie`
2. Create `src/lib/cookies.test.ts` — test cookie set/get/clear (skip jsdom cookie scenarios if flaky; test the logic paths)
3. Create `src/app/actions/profile-actions.ts` (server actions): `createProfile(data)`, `getProfiles()`, `deleteProfile(id)`, `getProfile(id)` — call Mongoose models directly
4. Create `src/lib/profile-context.tsx` — `ProfileProvider` wrapping `useState` for `activeProfileId` + profiles list
5. Create `src/hooks/use-active-profile.ts` — hook that reads cookie on mount, validates profile exists in DB via server action, falls back to empty state if invalid
6. Create `src/lib/profile-context.test.tsx` — test provider provides context values, cookie read on mount, empty state fallback
7. Confirm all tests pass and lint is clean

## Acceptance

- [ ] `cookies.ts` exports `setActiveProfileId`, `getActiveProfileId`, `clearActiveProfileId`
- [ ] Cookie persists across page reloads (path `/`, 30-day max-age)
- [ ] `profile-actions.ts` exports server actions for CRUD on profiles
- [ ] `ProfileProvider` wraps app and provides `activeProfileId`, `profiles`, `setActiveProfileId`, `refreshProfiles`
- [ ] `useActiveProfile` hook reads cookie on mount, validates profile exists, falls back to `null` if stale
- [ ] Tests cover: cookie operations, context values, stale cookie fallback

## Verification

```bash
npm test -- src/lib/cookies.test.ts
npm test -- src/lib/profile-context.test.tsx
npm test
npm run lint
```

## Commit

```
feat(state): add profile context, active-profile cookie, and server actions for profile CRUD
```

## Notes

- Server actions are temporary — brief 05 replaces `profile-actions.ts` calls with `fetch(/api/profiles)`. Keep the action signatures similar to future REST API to ease migration.
- Do not wire the provider into `src/app/layout.tsx` yet — step 05 does that.
- Cookie is client-side only — not signed (profile ID is not a security boundary). Auth cookies (brief 04) use iron-session.
