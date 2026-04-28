import mongoose from "mongoose"
import { requireAuth } from "@/lib/auth"
import { getSession } from "@/lib/session"

export async function ensureAuthenticated(): Promise<Response | null> {
  const session = await getSession()
  return requireAuth(session)
}

export async function parseJsonBody(request: Request): Promise<
  { ok: true; data: unknown } | { ok: false; response: Response }
> {
  try {
    const data = (await request.json()) as unknown
    return { ok: true, data }
  } catch {
    return { ok: false, response: invalidDataResponse() }
  }
}

export function invalidDataResponse(): Response {
  return Response.json({ error: "Dados inválidos" }, { status: 400 })
}

export function profileNotFoundResponse(status: 400 | 404): Response {
  return Response.json({ error: "Perfil não encontrado" }, { status })
}

export function isValidProfileId(id: string): boolean {
  return mongoose.isValidObjectId(id)
}
