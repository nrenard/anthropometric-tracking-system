import { describe, it, expect, beforeEach, vi } from "vitest"

const sessionState = {
  isAuthenticated: undefined as boolean | undefined,
  destroyed: 0,
}

vi.mock("@/lib/session", () => ({
  getSession: vi.fn(async () => ({
    get isAuthenticated(): boolean | undefined {
      return sessionState.isAuthenticated
    },
    set isAuthenticated(value: boolean | undefined) {
      sessionState.isAuthenticated = value
    },
    destroy: vi.fn(() => {
      sessionState.isAuthenticated = undefined
      sessionState.destroyed += 1
    }),
  })),
}))

import { POST } from "./route"

describe("POST /api/auth/logout", () => {
  beforeEach(() => {
    sessionState.isAuthenticated = true
    sessionState.destroyed = 0
  })

  it("destroys the session and returns 200 with success body", async () => {
    const response = await POST()

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body).toEqual({ ok: true })
    expect(sessionState.destroyed).toBe(1)
    expect(sessionState.isAuthenticated).toBeUndefined()
  })
})
