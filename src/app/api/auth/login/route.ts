import bcrypt from "bcrypt"
import { env } from "@/lib/env"
import { getSession } from "@/lib/session"

const INVALID_CREDENTIALS = { error: "Credenciais inválidas" } as const

function unauthorized(): Response {
  return Response.json(INVALID_CREDENTIALS, { status: 401 })
}

export async function POST(request: Request): Promise<Response> {
  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return unauthorized()
  }

  if (!payload || typeof payload !== "object") {
    return unauthorized()
  }

  const { email, password } = payload as { email?: unknown; password?: unknown }
  if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
    return unauthorized()
  }

  if (email !== env.AUTH_USER) {
    return unauthorized()
  }

  const passwordMatches = await bcrypt.compare(password, env.AUTH_PASSWORD_HASH)
  if (!passwordMatches) {
    return unauthorized()
  }

  const session = await getSession()
  session.isAuthenticated = true
  await session.save()

  return Response.json({ ok: true }, { status: 200 })
}
