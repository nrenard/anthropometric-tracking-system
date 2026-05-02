import type { SessionData } from "@/lib/session"
import { getSession } from "@/lib/session"
import { ACTIVE_PROFILE_COOKIE } from "@/lib/cookies"

export function requireAuth(session: SessionData): Response | null {
  if (session.isAuthenticated) return null
  return Response.json({ error: "Sessão expirada" }, { status: 401 })
}

export async function ensureAuthenticated(): Promise<Response | null> {
  const session = await getSession()
  return requireAuth(session)
}

export type ActiveProfileResult = { profileId: string } | { error: Response }

export function getActiveProfileId(request: Request): ActiveProfileResult {
  const profileId = readCookie(request, ACTIVE_PROFILE_COOKIE)
  if (!profileId) {
    return {
      error: Response.json(
        { error: "ID do perfil é obrigatório" },
        { status: 400 },
      ),
    }
  }
  return { profileId }
}

function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get("cookie")
  if (!header) return null
  for (const part of header.split(";")) {
    const trimmed = part.trim()
    const eq = trimmed.indexOf("=")
    if (eq === -1) continue
    if (trimmed.slice(0, eq) !== name) continue
    const value = trimmed.slice(eq + 1)
    return value ? decodeURIComponent(value) : null
  }
  return null
}
