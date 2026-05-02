import mongoose from "mongoose"
import { ensureAuthenticated } from "@/lib/auth"

export { ensureAuthenticated }

export function errorResponse(message: string, status: number): Response {
  return Response.json({ error: message }, { status })
}

export function notFoundResponse(resource: string): Response {
  return Response.json({ error: `${resource} não encontrado(a)` }, { status: 404 })
}

export async function parseJsonBody(request: Request): Promise<
  { ok: true; data: unknown } | { ok: false; response: Response }
> {
  try {
    const data = (await request.json()) as unknown
    return { ok: true, data }
  } catch {
    return { ok: false, response: errorResponse("Dados inválidos", 400) }
  }
}

export function invalidDataResponse(): Response {
  return errorResponse("Dados inválidos", 400)
}

export function profileNotFoundResponse(status: 400 | 404): Response {
  return Response.json({ error: "Perfil não encontrado" }, { status })
}

export function isValidProfileId(id: string): boolean {
  return mongoose.isValidObjectId(id)
}
