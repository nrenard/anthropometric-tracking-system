# Step 04 — Environment Variables & Database Connection

**Plan**: [`main.md`](./main.md)
**Depends on**: 03

## Objective

Environment variables validated with a Zod schema on startup. MongoDB connection via Mongoose that connects gracefully on `npm run dev` and logs clearly on failure.

## Context

`spec.md:19-24` defines `AUTH_USER` and `AUTH_PASSWORD_HASH` as single-user credentials. The brief adds `MONGODB_URI`. We validate all three on process startup so misconfiguration crashes early with a clear message.

Mongoose connection pattern: a singleton module in `src/lib/mongodb.ts` that caches the connection promise. This is the standard Next.js + Mongoose pattern (don't reconnect on every API call).

## Approach

1. Create `.env.local` with placeholder values:
   ```
   AUTH_USER=
   AUTH_PASSWORD_HASH=
   MONGODB_URI=
   ```
   > Values are empty. The validation will fail until the user fills them in — this is intentional.

2. Create `.env.example` with the same keys and descriptions:
   ```
   AUTH_USER=admin@example.com
   AUTH_PASSWORD_HASH=<bcrypt hash — generate with scripts/hash-password.ts>
   MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/anthropometric-tracking
   ```

3. Create `src/lib/env.ts` — Zod schema + validation:
   ```ts
   import { z } from "zod"

   const envSchema = z.object({
     AUTH_USER: z.string().min(1, "AUTH_USER is required"),
     AUTH_PASSWORD_HASH: z.string().min(1, "AUTH_PASSWORD_HASH is required"),
     MONGODB_URI: z.string().url("MONGODB_URI must be a valid URL"),
   })

   export const env = envSchema.parse(process.env)
   ```

4. Create `src/lib/mongodb.ts` — Mongoose singleton connection:
   ```ts
   import mongoose from "mongoose"
   import { env } from "./env"

   const MONGODB_URI: string = env.MONGODB_URI

   interface MongooseCache {
     conn: typeof mongoose | null
     promise: Promise<typeof mongoose> | null
   }

   declare global {
     var mongooseCache: MongooseCache | undefined
   }

   const cached: MongooseCache = global.mongooseCache ?? { conn: null, promise: null }
   global.mongooseCache = cached

   async function dbConnect(): Promise<typeof mongoose> {
     if (cached.conn) return cached.conn

     if (!cached.promise) {
       cached.promise = mongoose.connect(MONGODB_URI).then((m) => m)
     }

     cached.conn = await cached.promise
     return cached.conn
   }

   export default dbConnect
   ```

5. Create a startup hook at `src/lib/startup.ts` that validates env vars and attempts the DB connection, logging results:
   ```ts
   import { env } from "./env"
   import dbConnect from "./mongodb"

   export async function runStartup(): Promise<void> {
     console.log("[startup] Validating environment...")
     console.log(`[startup] AUTH_USER set: ${!!env.AUTH_USER}`)
     console.log(`[startup] AUTH_PASSWORD_HASH set: ${!!env.AUTH_PASSWORD_HASH}`)
     console.log(`[startup] MONGODB_URI set: ${env.MONGODB_URI.replace(/\/\/.*@/, "//<credentials>@")}`)

     try {
       await dbConnect()
       console.log("[startup] MongoDB connected successfully")
     } catch (error) {
       console.error("[startup] MongoDB connection failed:", (error as Error).message)
       console.warn("[startup] App will continue without database. Features requiring data will fail.")
     }
   }
   ```

6. Verify that running `node -e "require('./src/lib/env')"` fails with a clear error when `.env.local` is empty (we'll fix that in step 05 when the Next.js dev server auto-loads it).

## Acceptance

- [ ] `src/lib/env.ts` validates `AUTH_USER`, `AUTH_PASSWORD_HASH`, `MONGODB_URI` with Zod
- [ ] `src/lib/mongodb.ts` exports a `dbConnect` function using the singleton pattern
- [ ] `src/lib/startup.ts` logs validation status and connection outcome
- [ ] `.env.local` and `.env.example` exist with the three required keys
- [ ] TypeScript compiles: `npx tsc --noEmit`

## Verification

```bash
npx tsc --noEmit
# After filling .env.local with valid values (MongoDB Atlas URI required):
# The real test is in step 06 when npm run dev calls runStartup()
```

## Commit

```
feat(lib): add env validation, MongoDB connection, and startup hook
```

## Notes

- The `MONGODB_URI` redaction in logs is basic — it hides credentials in `mongodb+srv://user:pass@host` but won't handle all URI formats. Good enough for v1.
- `global.mongooseCache` uses the Node.js global object to survive Next.js hot-reload in dev mode (prevents multiple connection pools).
- The startup hook is not yet called from anywhere — that's wired into the root layout in step 05.
