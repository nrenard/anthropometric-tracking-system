# Step 01 — Initialize Next.js Project

**Plan**: [`main.md`](./main.md)
**Depends on**: none

## Objective

A vanilla Next.js project bootstrapped with TypeScript and App Router, ready to `npm run dev`.

## Context

No project exists. `spec.md:10-12` mandates Next.js App Router + TypeScript + API Routes. We do **not** use Tailwind — Chakra UI handles styling (step 03). We do **not** use `src/` by default when prompted by `create-next-app` — we'll restructure to `src/` in step 05.

## Approach

1. Run `npx create-next-app@latest .` with these choices using `--yes` and flags:
   ```
   npx create-next-app@latest . \
     --typescript \
     --eslint \
     --app \
     --src-dir \
     --import-alias "@/*" \
     --no-tailwind \
     --use-npm
   ```
   > If `--no-tailwind` or `--yes` is not recognized, omit `--yes` and answer prompts interactively: TypeScript=Yes, ESLint=Yes, Tailwind=No, src/ directory=Yes, App Router=Yes, import alias=`@/*`.

2. Verify the project boots:
   ```bash
   npm run dev
   ```
   Visit `http://localhost:3000`. Confirm the default Next.js welcome page renders.

3. Pin the Next.js version in `package.json` — remove `^` or `~` prefix from `next`, `react`, `react-dom`.

4. Initialize git:
   ```bash
   git init
   ```

## Acceptance

- [ ] `npm run dev` starts without errors on `http://localhost:3000`
- [ ] `package.json` contains `next`, `react`, `react-dom` with pinned versions (no `^`/`~`)
- [ ] `tsconfig.json` exists with `@/*` path alias configured
- [ ] Git repository initialized (`git status` works)

## Verification

```bash
npm run dev
# Ctrl+C after confirming it starts
git status
```

## Commit

```
chore: init Next.js project with TypeScript and App Router
```

## Notes

- If `create-next-app` fails due to Node version, ensure Node 18+ is active (`node -v`).
- If a `src/` directory is not created despite `--src-dir`, do not restructure manually — the upcoming steps will create `src/` if needed, but `create-next-app` should handle it.
