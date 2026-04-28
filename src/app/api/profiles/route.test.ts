import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest"
import { setupTestDb, teardownTestDb } from "@/test/db"
import Profile from "@/models/profile"

const sessionState: { isAuthenticated?: boolean } = { isAuthenticated: true }

vi.mock("@/lib/session", () => ({
  getSession: vi.fn(async () => ({
    get isAuthenticated(): boolean | undefined {
      return sessionState.isAuthenticated
    },
    set isAuthenticated(value: boolean | undefined) {
      sessionState.isAuthenticated = value
    },
    save: vi.fn(),
  })),
}))

import { GET, POST } from "./route"

const validProfile = {
  name: "Jane Doe",
  email: "jane@example.com",
  dateOfBirth: "1990-01-15",
  sex: "F" as const,
  defaultHeight: 170,
}

function buildRequest(body: unknown): Request {
  return new Request("http://localhost/api/profiles", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

beforeAll(async () => {
  await setupTestDb()
})

afterAll(async () => {
  await teardownTestDb()
})

beforeEach(async () => {
  await Profile.deleteMany({})
  sessionState.isAuthenticated = true
})

describe("GET /api/profiles", () => {
  it("returns 401 when unauthenticated", async () => {
    sessionState.isAuthenticated = false
    const response = await GET()
    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ error: "Sessão expirada" })
  })

  it("returns an empty array when no profiles exist", async () => {
    const response = await GET()
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual([])
  })

  it("returns profiles sorted by createdAt desc", async () => {
    const first = await new Profile(validProfile).save()
    await new Promise((r) => setTimeout(r, 10))
    const second = await new Profile({
      ...validProfile,
      name: "John Roe",
      email: "john@example.com",
      sex: "M",
    }).save()

    const response = await GET()
    expect(response.status).toBe(200)
    const body = (await response.json()) as Array<{ _id: string; name: string }>
    expect(body).toHaveLength(2)
    expect(body[0]._id).toBe(second._id.toString())
    expect(body[1]._id).toBe(first._id.toString())
  })
})

describe("POST /api/profiles", () => {
  it("returns 401 when unauthenticated", async () => {
    sessionState.isAuthenticated = false
    const response = await POST(buildRequest(validProfile))
    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ error: "Sessão expirada" })
  })

  it("creates a profile with valid body and returns 201", async () => {
    const response = await POST(buildRequest(validProfile))
    expect(response.status).toBe(201)
    const body = (await response.json()) as { _id: string; name: string; email: string }
    expect(body._id).toBeDefined()
    expect(body.name).toBe("Jane Doe")
    expect(body.email).toBe("jane@example.com")

    const count = await Profile.countDocuments()
    expect(count).toBe(1)
  })

  it("returns 400 with pt-BR error when body is invalid", async () => {
    const response = await POST(
      buildRequest({ ...validProfile, email: "not-an-email" }),
    )
    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: "Dados inválidos" })

    const count = await Profile.countDocuments()
    expect(count).toBe(0)
  })

  it("returns 400 when body is not valid JSON", async () => {
    const request = new Request("http://localhost/api/profiles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not-json",
    })
    const response = await POST(request)
    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: "Dados inválidos" })
  })

  it("strips unknown keys before persisting", async () => {
    const response = await POST(
      buildRequest({ ...validProfile, hacked: "yes", isAdmin: true }),
    )
    expect(response.status).toBe(201)
    const body = (await response.json()) as Record<string, unknown>
    expect(body.hacked).toBeUndefined()
    expect(body.isAdmin).toBeUndefined()
  })
})
