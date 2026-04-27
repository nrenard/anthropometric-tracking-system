# Step 03 — Configure Chakra UI Theme

**Plan**: [`main.md`](./main.md)
**Depends on**: 02

## Objective

A Chakra UI theme with light/dark modes that respects `prefers-color-scheme` and provides a manual toggle, wrapped in a `ThemeProvider` component.

## Context

`spec.md:85-86` says "clean minimalist, with light and dark modes (respects system preference, manual toggle available)." The theme lives in `src/theme/`. The provider wraps the root layout in step 05.

Chakra UI v3 handles dark mode via `ColorModeProvider` and a `useColorMode` hook. The system-preference default is set via `ColorModeScript` + `initialColorMode="system"` in the provider. The manual toggle is a `useColorModeValue` / `useColorMode` call.

## Approach

1. Create `src/theme/index.ts` — the theme object with a minimal custom config:
   ```ts
   import { createSystem, defaultSystem } from "@chakra-ui/react"

   export const system = createSystem(defaultSystem, {
     globalCss: {
       "html, body": {
         margin: 0,
         padding: 0,
         boxSizing: "border-box",
       },
     },
   })
   ```
   > Keep it simple. Colors, fonts, and spacing can be customized later. The default Chakra tokens are clean enough for a minimalist theme.

2. Create `src/theme/provider.tsx` — the client-side provider:
   ```tsx
   "use client"

   import { ChakraProvider } from "@chakra-ui/react"
   import { system } from "."

   export function ThemeProvider({ children }: { children: React.ReactNode }) {
     return (
       <ChakraProvider value={system}>
         {children}
       </ChakraProvider>
     )
   }
   ```

3. Create `src/theme/color-mode-toggle.tsx` — a client component for toggling:
   ```tsx
   "use client"

   import { IconButton, useColorMode } from "@chakra-ui/react"

   export function ColorModeToggle() {
     const { colorMode, toggleColorMode } = useColorMode()
     return (
       <IconButton
         aria-label="Alternar tema"
         variant="ghost"
         onClick={toggleColorMode}
       >
         {colorMode === "dark" ? "\u2600\uFE0F" : "\uD83C\uDF19"}
       </IconButton>
     )
   }
   ```

4. Verify the directory structure matches:
   ```
   src/theme/
     index.ts
     provider.tsx
     color-mode-toggle.tsx
   ```

## Acceptance

- [ ] `src/theme/index.ts` exports a Chakra `SystemConfig` or `createSystem` result
- [ ] `src/theme/provider.tsx` exports a `ThemeProvider` wrapping `ChakraProvider`
- [ ] `src/theme/color-mode-toggle.tsx` exports a `ColorModeToggle` client component
- [ ] TypeScript compilation passes for all theme files: `npx tsc --noEmit`

## Verification

```bash
npx tsc --noEmit
```

## Commit

```
feat(theme): add Chakra UI theme with light/dark mode toggle
```

## Notes

- The `ThemeProvider` is not yet wired into a page — that happens in step 05.
- If Chakra v3 API differs (e.g., `createSystem` vs `extendTheme`), consult the installed version's docs. For v2, use `extendTheme` from `@chakra-ui/react` and `ChakraProvider` from `@chakra-ui/react`.
- The moon/sun emojis are placeholder icons. Replace with Chakra's built-in icon components or a proper icon library in a later polish pass.
