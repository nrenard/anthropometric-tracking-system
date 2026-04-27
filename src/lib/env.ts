import { z } from "zod"

const envSchema = z.object({
  AUTH_USER: z.string().min(1, "AUTH_USER is required"),
  AUTH_PASSWORD_HASH: z.string().min(1, "AUTH_PASSWORD_HASH is required"),
  MONGODB_URI: z.string().url("MONGODB_URI must be a valid URL"),
})

const result = envSchema.safeParse(process.env)

if (!result.success) {
  const messages = result.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n")
  throw new Error(`Environment validation failed:\n${messages}`)
}

export const env = result.data
