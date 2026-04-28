import { describe, it, expect } from "vitest"
import {
  SESSION_COOKIE_NAME,
  sessionOptions,
  getSession,
  type SessionData,
} from "./session"

describe("session module", () => {
  it("exports SESSION_COOKIE_NAME constant", () => {
    expect(typeof SESSION_COOKIE_NAME).toBe("string")
    expect(SESSION_COOKIE_NAME.length).toBeGreaterThan(0)
  })

  it("exports sessionOptions with the configured cookie name", () => {
    expect(sessionOptions.cookieName).toBe(SESSION_COOKIE_NAME)
  })

  it("uses a non-empty password from env", () => {
    expect(typeof sessionOptions.password).toBe("string")
    expect((sessionOptions.password as string).length).toBeGreaterThan(0)
  })

  it("uses a session cookie (no maxAge) and httpOnly + sameSite lax", () => {
    expect(sessionOptions.cookieOptions?.httpOnly).toBe(true)
    expect(sessionOptions.cookieOptions?.sameSite).toBe("lax")
    expect(sessionOptions.cookieOptions?.path).toBe("/")
    expect(sessionOptions.cookieOptions?.maxAge).toBeUndefined()
  })

  it("exports getSession as an async function", () => {
    expect(typeof getSession).toBe("function")
  })

  it("permits SessionData typing with isAuthenticated boolean", () => {
    const sample: SessionData = { isAuthenticated: true }
    expect(sample.isAuthenticated).toBe(true)
  })
})
