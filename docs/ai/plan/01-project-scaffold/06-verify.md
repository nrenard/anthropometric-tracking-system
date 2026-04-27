# Step 06 — End-to-End Verification

**Plan**: [`main.md`](./main.md)
**Depends on**: 05

## Objective

Confirm all 6 acceptance criteria from the source brief pass, that the project builds cleanly, and that linting passes. Write a minimal smoke test.

## Context

The brief lists these acceptance criteria:

1. `npm run dev` starts the app on localhost
2. The app renders with Chakra UI theme applied
3. Dark/light mode toggle works and respects system preference
4. MongoDB connection succeeds on startup (or fails gracefully with a clear log)
5. Environment variables are validated on startup
6. Basic responsive layout renders on mobile and desktop viewports

We also need to ensure the project builds for production (`npm run build`) without errors.

## Approach

1. **Fill `.env.local` with valid credentials** — ask the user to provide their MongoDB Atlas URI and desired auth credentials, or use dummy values for the build test:
   ```
   AUTH_USER=admin@test.com
   AUTH_PASSWORD_HASH=$2b$10$placeholderhash1234567890abcdef1234567890abcdef1234567890ab
   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/anthropometric-tracking?retryWrites=true&w=majority
   ```
   > With a fake URI, the MongoDB connection will fail gracefully (criterion 4B). To test criterion 4A (success), use a real Atlas URI.

2. Run `npm run dev` and verify:
   - [ ] Terminal shows Next.js starting on `localhost:3000`
   - [ ] Terminal shows `[startup]` logs (env validation, MongoDB connection attempt)
   - [ ] If `MONGODB_URI` is fake: terminal shows `[startup] MongoDB connection failed:` — this is a **pass** (graceful failure)

3. Open `http://localhost:3000` in a browser and verify:
   - [ ] Page renders with Chakra UI default styling (not raw HTML)
   - [ ] Heading "Anthropometric Tracking" visible
   - [ ] Bottom nav visible at mobile width (<768px)
   - [ ] Click the theme toggle (sun/moon button) → page switches between light and dark

4. Run `npm run build` to confirm production build succeeds:
   ```bash
   npm run build
   ```
   - [ ] Build completes without errors

5. Write a minimal smoke test. Since no test framework is configured yet, install vitest + @testing-library/react:
   ```bash
   npm install --save-exact --save-dev vitest@^2 @testing-library/react@^16 @testing-library/jest-dom@^6 jsdom@^25
   ```
   Create `vitest.config.ts`:
   ```ts
   import { defineConfig } from "vitest/config"
   import path from "path"

   export default defineConfig({
     test: {
       environment: "jsdom",
       setupFiles: ["./src/test/setup.ts"],
     },
     resolve: {
       alias: {
         "@": path.resolve(__dirname, "./src"),
       },
     },
   })
   ```
   Create `src/test/setup.ts`:
   ```ts
   import "@testing-library/jest-dom/vitest"
   ```
   Create `src/app/page.test.tsx`:
   ```tsx
   import { describe, it, expect } from "vitest"
   import { render, screen } from "@testing-library/react"
   import HomePage from "./page"

   describe("HomePage", () => {
     it("renders the app heading", () => {
       render(<HomePage />)
       expect(screen.getByRole("heading", { name: /anthropometric tracking/i })).toBeDefined()
     })
   })
   ```
   Add to `package.json`:
   ```json
   "scripts": {
     "test": "vitest run",
     "test:watch": "vitest"
   }
   ```
   Run the test:
   ```bash
   npm test
   ```

6. Run `npm run lint` (Next.js includes ESLint by default) to confirm no lint errors.

## Acceptance

- [ ] `npm run dev` starts without errors, startup logs appear
- [ ] App renders with Chakra UI theme in browser
- [ ] Theme toggle switches light ↔ dark
- [ ] MongoDB connects or fails with a clear `[startup]` log message
- [ ] Environment variables are validated (empty `AUTH_USER` would crash on dev start with a Zod error)
- [ ] Bottom nav visible on mobile, hidden on desktop
- [ ] `npm run build` completes without errors
- [ ] `npm test` passes (smoke test)
- [ ] `npm run lint` passes

## Verification

```bash
# Terminal 1
npm run dev

# Terminal 2 (after confirming dev starts)
npm run build
npm test
npm run lint
```

## Commit

```
test: add vitest smoke test, verify all scaffold acceptance criteria
```

## Notes

- If the user does not have a MongoDB Atlas URI yet, use a fake one and confirm graceful failure. The real connection test happens when the URI is provided.
- The `vitest` + `@testing-library/react` setup is minimal. It proves the pattern works. More comprehensive tests come with feature briefs.
- If `npm run build` reveals issues with Chakra UI imports (common with v3 migration), fix them before marking this step complete.
