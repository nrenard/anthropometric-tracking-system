# Step 02 — Install Dependencies

**Plan**: [`main.md`](./main.md)
**Depends on**: 01

## Objective

Install all external libraries required by the spec and upcoming briefs. Pin versions.

## Context

Dependencies come from `spec.md:10-17` (Chakra UI, Recharts, Mongoose), `spec.md:19-24` (bcrypt, signed cookies), and utility needs (zod for env validation). The brief says "install all known deps from spec.md upfront" to avoid "missing dependencies discovered later."

## Approach

1. Install Chakra UI v3 and its required peer dependencies:
   ```bash
   npm install --save-exact @chakra-ui/react@^3 @emotion/react@^11 @emotion/styled@^11 framer-motion@^11
   ```
   > Chakra UI v3 is the current major. If the user prefers v2, use `@chakra-ui/react@^2` and check peer docs. Confirm version after install with `npm ls @chakra-ui/react`.

2. Install Recharts:
   ```bash
   npm install --save-exact recharts@^2
   ```

3. Install Mongoose:
   ```bash
   npm install --save-exact mongoose@^8
   ```

4. Install auth & validation libraries:
   ```bash
   npm install --save-exact bcrypt@^5 zod@^3 iron-session@^8
   ```

5. Install dev types:
   ```bash
   npm install --save-exact --save-dev @types/bcrypt@^5 @types/react@^18 @types/react-dom@^18
   ```
   > `@types/react` and `@types/react-dom` are usually included by `create-next-app`. Skip if already present.

6. Run `npm ls --depth=0` and confirm all packages listed below appear:
   - `next` (from step 01)
   - `react`, `react-dom` (from step 01)
   - `@chakra-ui/react`, `@emotion/react`, `@emotion/styled`, `framer-motion`
   - `recharts`
   - `mongoose`
   - `bcrypt`, `zod`, `iron-session`
   - `@types/bcrypt` (dev)

## Acceptance

- [ ] All packages install without errors
- [ ] `npm ls --depth=0` shows every dependency from the list above
- [ ] No version warnings or peer dependency conflicts
- [ ] `package-lock.json` is created and non-empty

## Verification

```bash
npm ls --depth=0
npm ls 2>&1 | grep -i "UNMET\|ERR\|MISSING" || echo "All dependencies resolved"
```

## Commit

```
chore: install project dependencies (chakra, recharts, mongoose, bcrypt, iron-session, zod)
```

## Notes

- Chakra UI v3 uses `@chakra-ui/react` as the single package (no separate `@chakra-ui/icons`). If theme setup in step 03 needs icons, they ship within `@chakra-ui/react`.
- `iron-session` v8 uses `@hattip/iron-session` under the hood; the `iron-session` wrapper is still the recommended API for Next.js.
