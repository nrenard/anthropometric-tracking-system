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
