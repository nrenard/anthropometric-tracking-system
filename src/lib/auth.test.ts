import { describe, it, expect } from "vitest"
import type { SessionData } from "@/lib/session"
import { requireAuth, getActiveProfileId } from "./auth"

function buildRequest(cookieHeader?: string): Request {
  return new Request("http://localhost/api/test", {
    headers: cookieHeader ? { cookie: cookieHeader } : {},
  })
}

describe("requireAuth", () => {
  it("returns null when session is authenticated", () => {
    const session: SessionData = { isAuthenticated: true }
    expect(requireAuth(session)).toBeNull()
  })

  it("returns a 401 Response with pt-BR error when isAuthenticated is false", async () => {
    const session: SessionData = { isAuthenticated: false }
    const response = requireAuth(session)
    expect(response).toBeInstanceOf(Response)
    expect(response?.status).toBe(401)
    expect(await response?.json()).toEqual({ error: "Sessão expirada" })
  })

  it("returns a 401 Response when isAuthenticated is missing", async () => {
    const response = requireAuth({})
    expect(response).toBeInstanceOf(Response)
    expect(response?.status).toBe(401)
    expect(await response?.json()).toEqual({ error: "Sessão expirada" })
  })
})

describe("getActiveProfileId", () => {
  it("returns the profile ID when ACTIVE_PROFILE_ID cookie is set", () => {
    const request = buildRequest("ACTIVE_PROFILE_ID=abc123; other=value")
    const result = getActiveProfileId(request)
    expect(result).toEqual({ profileId: "abc123" })
  })

  it("returns a 400 Response when the cookie is missing", async () => {
    const request = buildRequest("other=value")
    const result = getActiveProfileId(request)
    expect("error" in result).toBe(true)
    if ("error" in result) {
      expect(result.error.status).toBe(400)
      expect(await result.error.json()).toEqual({
        error: "ID do perfil é obrigatório",
      })
    }
  })

  it("returns a 400 Response when the cookie value is empty", async () => {
    const request = buildRequest("ACTIVE_PROFILE_ID=; other=value")
    const result = getActiveProfileId(request)
    expect("error" in result).toBe(true)
    if ("error" in result) {
      expect(result.error.status).toBe(400)
      expect(await result.error.json()).toEqual({
        error: "ID do perfil é obrigatório",
      })
    }
  })
})
