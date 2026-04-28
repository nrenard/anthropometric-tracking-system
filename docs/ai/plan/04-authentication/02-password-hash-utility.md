# Step 02 — Password Hash Utility

**Plan**: [`main.md`](./main.md)
**Depends on**: none (can run in parallel with step 01)

## Objective

Create `scripts/hash-password.ts` so a proper bcrypt hash can be generated for `AUTH_PASSWORD_HASH` in `.env.local` and `.env.example`.

## Context

- `.env.example:2` references `scripts/hash-password.ts` but the file does not exist
- `.env.local:2` contains a placeholder hash (`placeholderhash1234567890abcdef1234567890abcdef`) — not a valid bcrypt hash
- `bcrypt` v5.1.1 is installed — `package.json:22`
- The script is a CLI utility, not part of the app — no test required

## Approach

1. Create `scripts/hash-password.ts`
2. Read the password from `process.argv[2]` (first CLI argument)
3. If no argument, print usage: `Usage: npx tsx scripts/hash-password.ts <password>` and exit
4. Generate salt with `bcrypt.genSalt(12)` then hash with `bcrypt.hash(password, salt)`
5. Log the resulting hash to stdout
6. After running, copy the hash into `.env.local` as `AUTH_PASSWORD_HASH`

## Acceptance

- [ ] `npx tsx scripts/hash-password.ts mypassword` outputs a valid bcrypt hash string (starts with `$2b$`)
- [ ] `npx tsx scripts/hash-password.ts` without arguments prints usage message
- [ ] The hash from step 1 can be used in `.env.local` to authenticate via `bcrypt.compare`

## Verification

```
npx tsx scripts/hash-password.ts test123
# Should output a string like: $2b$12$...
```

## Commit

```
feat(auth): add password hash generation script
```

## Notes

- After this step, update `.env.local` with the generated hash for the desired password (e.g. `npx tsx scripts/hash-password.ts admin123` → paste hash into `.env.local`)
- The bcrypt salt rounds (12) balances security and speed for a single-user local app
