import { describe, it, expect, beforeEach, vi } from "vitest"

const sessionState: { isAuthenticated?: boolean; saved: number } = {
  isAuthenticated: undefined,
  saved: 0,
}

vi.mock("@/lib/session", () => ({
  getSession: vi.fn(async () => ({
    get isAuthenticated(): boolean | undefined {
      return sessionState.isAuthenticated
    },
    set isAuthenticated(value: boolean | undefined) {
      sessionState.isAuthenticated = value
    },
    save: vi.fn(async () => {
      sessionState.saved += 1
    }),
  })),
}))

vi.mock("bcrypt", () => ({
  default: {
    compare: vi.fn(async (plain: string) => plain === "correct-password"),
  },
}))

import { POST } from "./route"
import { env } from "@/lib/env"

const VALID_EMAIL = env.AUTH_USER
const STORED_HASH = env.AUTH_PASSWORD_HASH

function buildRequest(body: unknown): Request {
  return new Request("http://localhost/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  })
}

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    sessionState.isAuthenticated = undefined
    sessionState.saved = 0
  })

  it("returns 200 and marks the session authenticated for valid credentials", async () => {
    const response = await POST(
      buildRequest({ email: VALID_EMAIL, password: "correct-password" }),
    )

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body).toEqual({ ok: true })
    expect(sessionState.isAuthenticated).toBe(true)
    expect(sessionState.saved).toBe(1)
  })

  it("returns 401 when the email does not match", async () => {
    const response = await POST(
      buildRequest({ email: "wrong@test.com", password: "correct-password" }),
    )

    expect(response.status).toBe(401)
    const body = await response.json()
    expect(body).toEqual({ error: "Credenciais inválidas" })
    expect(sessionState.isAuthenticated).toBeUndefined()
    expect(sessionState.saved).toBe(0)
  })

  it("returns 401 when the password is wrong (no user enumeration)", async () => {
    const response = await POST(
      buildRequest({ email: VALID_EMAIL, password: "wrong-password" }),
    )

    expect(response.status).toBe(401)
    const body = await response.json()
    expect(body).toEqual({ error: "Credenciais inválidas" })
    expect(sessionState.isAuthenticated).toBeUndefined()
  })

  it("returns 401 when body fields are missing", async () => {
    const response = await POST(buildRequest({}))

    expect(response.status).toBe(401)
    const body = await response.json()
    expect(body).toEqual({ error: "Credenciais inválidas" })
  })

  it("returns 401 when body is not valid JSON", async () => {
    const response = await POST(buildRequest("not-json"))

    expect(response.status).toBe(401)
    const body = await response.json()
    expect(body).toEqual({ error: "Credenciais inválidas" })
  })

  it("never includes the password hash in the response body", async () => {
    const response = await POST(
      buildRequest({ email: VALID_EMAIL, password: "correct-password" }),
    )
    const text = await response.text()
    expect(text).not.toContain(STORED_HASH)
  })
})
