# Step 01 — Add Gráficos nav item

**Plan**: [`main.md`](./main.md)
**Depends on**: none

## Objective

Add "Gráficos" link to the bottom navigation so users can reach the charts page from any screen.

## Context

- `src/components/bottom-nav.tsx:7-12` — `NAV_ITEMS` array with 4 entries
- Dashboard weight-chart already navigates to `/graficos` on click (`weight-chart.tsx:64`), but no bottom nav link exists
- Nav component renders `ProfileSwitcher` above link items — needs `ProfileProvider` in tests
- Test pattern: wrap in `<ChakraProvider>` + `<ProfileProvider>`, mock `@/app/actions/profile-actions` (see `profile-switcher.test.tsx:20-48`)

## Approach

1. Write `src/components/bottom-nav.test.tsx` — verify 5 nav links exist, verify "Gráficos" link with `href="/graficos"`
2. Run `npm test -- src/components/bottom-nav.test.tsx` — confirm it fails (only 4 items)
3. Add `{ href: "/graficos", label: "Gráficos" }` to `NAV_ITEMS` array
4. Run test again — confirm green

## Acceptance

- [ ] Bottom nav renders 5 link items (was 4)
- [ ] "Gráficos" link exists with `href="/graficos"`
- [ ] Test passes: `npm test -- src/components/bottom-nav.test.tsx`

## Verification

```
npm test -- src/components/bottom-nav.test.tsx
```

## Commit

```
feat(nav): add Gráficos link to bottom navigation
```
