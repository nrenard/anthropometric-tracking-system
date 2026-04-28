import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest"
import mongoose from "mongoose"
import { setupTestDb, teardownTestDb } from "@/test/db"
import Profile from "@/models/profile"
import Measurement from "@/models/measurement"

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

import { GET, PUT, DELETE } from "./route"

const validProfile = {
  name: "Jane Doe",
  email: "jane@example.com",
  dateOfBirth: new Date("1990-01-15"),
  sex: "F" as const,
  defaultHeight: 170,
}

function buildRequest(method: string, body?: unknown): Request {
  return new Request("http://localhost/api/profiles/test", {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

function buildContext(id: string) {
  return { params: Promise.resolve({ id }) }
}

beforeAll(async () => {
  await setupTestDb()
})

afterAll(async () => {
  await teardownTestDb()
})

beforeEach(async () => {
  await Profile.deleteMany({})
  await Measurement.deleteMany({})
  sessionState.isAuthenticated = true
})

describe("GET /api/profiles/[id]", () => {
  it("returns 401 when unauthenticated", async () => {
    sessionState.isAuthenticated = false
    const response = await GET(buildRequest("GET"), buildContext("any"))
    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ error: "Sessão expirada" })
  })

  it("returns 400 with pt-BR error when id is not a valid ObjectId", async () => {
    const response = await GET(buildRequest("GET"), buildContext("not-an-id"))
    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: "Perfil não encontrado" })
  })

  it("returns 404 when id is valid ObjectId but profile does not exist", async () => {
    const missingId = new mongoose.Types.ObjectId().toString()
    const response = await GET(buildRequest("GET"), buildContext(missingId))
    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({ error: "Perfil não encontrado" })
  })

  it("returns 200 with the profile when it exists", async () => {
    const saved = await new Profile(validProfile).save()
    const response = await GET(
      buildRequest("GET"),
      buildContext(saved._id.toString()),
    )
    expect(response.status).toBe(200)
    const body = (await response.json()) as { _id: string; name: string }
    expect(body._id).toBe(saved._id.toString())
    expect(body.name).toBe("Jane Doe")
  })
})

describe("PUT /api/profiles/[id]", () => {
  it("returns 401 when unauthenticated", async () => {
    sessionState.isAuthenticated = false
    const response = await PUT(
      buildRequest("PUT", { name: "New" }),
      buildContext("any"),
    )
    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ error: "Sessão expirada" })
  })

  it("returns 400 when id is not a valid ObjectId", async () => {
    const response = await PUT(
      buildRequest("PUT", { name: "New" }),
      buildContext("not-an-id"),
    )
    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: "Perfil não encontrado" })
  })

  it("returns 400 with pt-BR error when body is invalid", async () => {
    const saved = await new Profile(validProfile).save()
    const response = await PUT(
      buildRequest("PUT", { email: "not-an-email" }),
      buildContext(saved._id.toString()),
    )
    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: "Dados inválidos" })
  })

  it("returns 400 when body is not valid JSON", async () => {
    const saved = await new Profile(validProfile).save()
    const request = new Request("http://localhost/api/profiles/x", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: "not-json",
    })
    const response = await PUT(request, buildContext(saved._id.toString()))
    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: "Dados inválidos" })
  })

  it("returns 404 when valid id has no matching profile", async () => {
    const missingId = new mongoose.Types.ObjectId().toString()
    const response = await PUT(
      buildRequest("PUT", { name: "New" }),
      buildContext(missingId),
    )
    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({ error: "Perfil não encontrado" })
  })

  it("returns 200 with updated profile on partial update", async () => {
    const saved = await new Profile(validProfile).save()
    const response = await PUT(
      buildRequest("PUT", { name: "Janet Doe" }),
      buildContext(saved._id.toString()),
    )
    expect(response.status).toBe(200)
    const body = (await response.json()) as { _id: string; name: string; email: string }
    expect(body._id).toBe(saved._id.toString())
    expect(body.name).toBe("Janet Doe")
    expect(body.email).toBe("jane@example.com")
  })

  it("strips unknown keys before persisting", async () => {
    const saved = await new Profile(validProfile).save()
    const response = await PUT(
      buildRequest("PUT", { name: "Janet", isAdmin: true }),
      buildContext(saved._id.toString()),
    )
    expect(response.status).toBe(200)
    const body = (await response.json()) as Record<string, unknown>
    expect(body.isAdmin).toBeUndefined()
    expect(body.name).toBe("Janet")
  })
})

describe("DELETE /api/profiles/[id]", () => {
  it("returns 401 when unauthenticated", async () => {
    sessionState.isAuthenticated = false
    const response = await DELETE(buildRequest("DELETE"), buildContext("any"))
    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ error: "Sessão expirada" })
  })

  it("returns 400 when id is not a valid ObjectId", async () => {
    const response = await DELETE(buildRequest("DELETE"), buildContext("not-an-id"))
    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: "Perfil não encontrado" })
  })

  it("returns 204 with empty body and cascade-deletes measurements", async () => {
    const saved = await new Profile(validProfile).save()
    await Measurement.create({
      profileId: saved._id,
      measuredAt: new Date(),
      weight: 70,
      height: 175,
      skinfolds: {
        chest: 10,
        midaxillary: 8,
        triceps: 12,
        subscapular: 15,
        abdominal: 20,
        suprailiac: 18,
        thigh: 14,
      },
      perimeters: {
        neck: 38,
        waist: 80,
        hip: 95,
        arm: { left: 32, right: 33 },
        forearm: { left: 27, right: 28 },
        thigh: { left: 55, right: 56 },
        calf: { left: 37, right: 38 },
      },
      diameters: { humerus: 7.2, femur: 10.1 },
    })

    expect(await Measurement.countDocuments()).toBe(1)

    const response = await DELETE(
      buildRequest("DELETE"),
      buildContext(saved._id.toString()),
    )
    expect(response.status).toBe(204)
    expect(await response.text()).toBe("")

    expect(await Profile.countDocuments()).toBe(0)
    expect(await Measurement.countDocuments()).toBe(0)
  })

  it("returns 204 even when profile does not exist (idempotent)", async () => {
    const missingId = new mongoose.Types.ObjectId().toString()
    const response = await DELETE(
      buildRequest("DELETE"),
      buildContext(missingId),
    )
    expect(response.status).toBe(204)
    expect(await response.text()).toBe("")
  })
})
