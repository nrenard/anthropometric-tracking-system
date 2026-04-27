# Step 05 — App Layout Shell

**Plan**: [`main.md`](./main.md)
**Depends on**: 04

## Objective

A root layout wiring together the ThemeProvider, startup hook, and a responsive bottom-navigation shell. The app renders with the theme applied on both mobile and desktop.

## Context

`spec.md:87` says "mobile-first: wizard-style forms, large tap targets, decimal numeric keyboards, bottom navigation on mobile." The layout must be responsive: bottom nav on mobile, likely side nav or top nav on desktop (v1 can be simple).

The `spec.md:74-81` lists 8 screens. None are built yet (out of scope), so we create placeholder pages with Portuguese labels. The bottom nav links to the screens that will be built first: Dashboard, New Measurement, History, Settings.

## Approach

1. Create `src/app/layout.tsx` — the root layout:
   ```tsx
   import type { Metadata } from "next"
   import { ThemeProvider } from "@/theme/provider"
   import { StartupRunner } from "@/components/startup-runner"

   export const metadata: Metadata = {
     title: "Anthropometric Tracking",
     description: "Acompanhamento de medidas corporais",
   }

   export default function RootLayout({ children }: { children: React.ReactNode }) {
     return (
       <html lang="pt-BR" suppressHydrationWarning>
         <body>
           <ThemeProvider>
             <StartupRunner />
             {children}
           </ThemeProvider>
         </body>
       </html>
     )
   }
   ```

2. Create `src/components/startup-runner.tsx` — calls the startup hook:
   ```tsx
   "use client"

   import { useEffect } from "react"

   export function StartupRunner() {
     useEffect(() => {
       import("@/lib/startup").then(({ runStartup }) => runStartup())
     }, [])
     return null
   }
   ```

3. Create `src/components/bottom-nav.tsx` — mobile bottom navigation:
   ```tsx
   "use client"

   import { Box, Flex } from "@chakra-ui/react"
   import Link from "next/link"

   const NAV_ITEMS = [
     { href: "/", label: "Início" },
     { href: "/medir", label: "Medir" },
     { href: "/historico", label: "Histórico" },
     { href: "/config", label: "Config" },
   ]

   export function BottomNav() {
     return (
       <Box as="nav" display={{ base: "flex", md: "none" }} position="fixed" bottom={0} left={0} right={0} bg="bg" borderTopWidth={1} zIndex={10}>
         <Flex justify="space-around" w="full" p={2}>
           {NAV_ITEMS.map((item) => (
             <Link key={item.href} href={item.href}>
               {item.label}
             </Link>
           ))}
         </Flex>
       </Box>
     )
   }
   ```

4. Update `src/app/page.tsx` — the home/dashboard placeholder:
   ```tsx
   import { Box, Heading, Text } from "@chakra-ui/react"
   import { ColorModeToggle } from "@/theme/color-mode-toggle"
   import { BottomNav } from "@/components/bottom-nav"

   export default function HomePage() {
     return (
       <Box p={4} pb={16}>
         <ColorModeToggle />
         <Heading as="h1">Anthropometric Tracking</Heading>
         <Text>Acompanhamento de medidas corporais</Text>
         <BottomNav />
       </Box>
     )
   }
   ```

5. Verify the directory structure matches:
   ```
   src/
     app/
       layout.tsx
       page.tsx
     components/
       startup-runner.tsx
       bottom-nav.tsx
     lib/
       env.ts
       mongodb.ts
       startup.ts
     theme/
       index.ts
       provider.tsx
       color-mode-toggle.tsx
   ```

## Acceptance

- [ ] `src/app/layout.tsx` wraps children in `ThemeProvider` and `StartupRunner`
- [ ] `src/app/page.tsx` renders heading, theme toggle, and bottom nav
- [ ] `src/components/bottom-nav.tsx` shows 4 nav items with Portuguese labels
- [ ] Bottom nav is visible on mobile viewport, hidden on desktop (md breakpoint)
- [ ] TypeScript compiles: `npx tsc --noEmit`

## Verification

```bash
npx tsc --noEmit
npm run dev
# Visit http://localhost:3000
# Confirm: page renders with Chakra styling, theme toggle works, bottom nav visible
# Resize browser to mobile width (<768px) → bottom nav visible
# Resize to desktop width → bottom nav hidden
```

## Commit

```
feat(layout): add root layout with theme provider, startup hook, and bottom navigation
```

## Notes

- The bottom nav uses plain text links — no icons or active-state styling yet. That's a polish task, not scaffolding.
- Page routes for `/medir`, `/historico`, `/config` don't exist yet — the links will 404. This is expected; those pages come in later briefs.
- `suppressHydrationWarning` on `<html>` prevents a React warning from `ColorModeScript` / color mode flash. Chakra v3 may handle this differently; remove if unneeded.
