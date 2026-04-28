import { describe, it, expect, beforeEach, vi } from "vitest"
import { NextRequest } from "next/server"

const sessionState: { isAuthenticated?: boolean } = { isAuthenticated: undefined }

vi.mock("iron-session", () => ({
  getIronSession: vi.fn(async () => ({
    get isAuthenticated() {
      return sessionState.isAuthenticated
    },
    set isAuthenticated(value: boolean | undefined) {
      sessionState.isAuthenticated = value
    },
  })),
}))

import { middleware, config } from "./middleware"

function buildRequest(pathname: string): NextRequest {
  return new NextRequest(new URL(`http://localhost${pathname}`))
}

describe("auth middleware", () => {
  beforeEach(() => {
    sessionState.isAuthenticated = undefined
  })

  it("redirects unauthenticated requests to '/' to /login", async () => {
    const response = await middleware(buildRequest("/"))

    expect(response.status).toBe(307)
    const location = response.headers.get("location")
    expect(location).toBeTruthy()
    expect(new URL(location!).pathname).toBe("/login")
  })

  it("redirects unauthenticated requests to nested pages to /login", async () => {
    const response = await middleware(buildRequest("/medir"))

    expect(response.status).toBe(307)
    const location = response.headers.get("location")
    expect(new URL(location!).pathname).toBe("/login")
  })

  it("lets unauthenticated requests through for /login", async () => {
    const response = await middleware(buildRequest("/login"))

    expect(response.headers.get("location")).toBeNull()
    expect(response.status).toBeLessThan(300)
  })

  it("lets unauthenticated requests through for /api/auth/login", async () => {
    const response = await middleware(buildRequest("/api/auth/login"))

    expect(response.headers.get("location")).toBeNull()
    expect(response.status).toBeLessThan(300)
  })

  it("lets unauthenticated requests through for /api/auth/logout", async () => {
    const response = await middleware(buildRequest("/api/auth/logout"))

    expect(response.headers.get("location")).toBeNull()
    expect(response.status).toBeLessThan(300)
  })

  it("redirects authenticated requests to /login back to /", async () => {
    sessionState.isAuthenticated = true
    const response = await middleware(buildRequest("/login"))

    expect(response.status).toBe(307)
    const location = response.headers.get("location")
    expect(new URL(location!).pathname).toBe("/")
  })

  it("lets authenticated requests through for protected routes", async () => {
    sessionState.isAuthenticated = true
    const response = await middleware(buildRequest("/"))

    expect(response.headers.get("location")).toBeNull()
    expect(response.status).toBeLessThan(300)
  })

  it("treats a session without isAuthenticated as unauthenticated", async () => {
    sessionState.isAuthenticated = undefined
    const response = await middleware(buildRequest("/"))

    expect(response.status).toBe(307)
    expect(new URL(response.headers.get("location")!).pathname).toBe("/login")
  })

  it("excludes static assets from the matcher", () => {
    const matcherSource = JSON.stringify(config.matcher)
    expect(matcherSource).toMatch(/_next/)
    expect(matcherSource).toMatch(/static/)
    expect(matcherSource).toMatch(/favicon/)
  })
})
