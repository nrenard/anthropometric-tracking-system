import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest"
import mongoose from "mongoose"

const sessionState: { isAuthenticated?: boolean } = { isAuthenticated: true }

vi.mock("@/lib/session", () => ({
  getSession: vi.fn(async () => ({
    get isAuthenticated(): boolean | undefined {
      return sessionState.isAuthenticated
    },
    set isAuthenticated(value: boolean | undefined) {
      sessionState.isAuthenticated = value
    },
  })),
}))

vi.mock("@/lib/mongodb", () => ({
  default: vi.fn(async () => undefined),
}))

import { setupTestDb, teardownTestDb } from "@/test/db"
import Profile from "@/models/profile"
import Measurement from "@/models/measurement"
import { GET, POST } from "./route"

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

const skinfolds = {
  chest: 10,
  midaxillary: 8,
  triceps: 12,
  subscapular: 15,
  abdominal: 20,
  suprailiac: 18,
  thigh: 14,
}

const perimeters = {
  neck: 38,
  waist: 80,
  hip: 95,
  arm: { left: 32, right: 33 },
  forearm: { left: 27, right: 28 },
  thigh: { left: 55, right: 56 },
  calf: { left: 37, right: 38 },
}

const diameters = { humerus: 7.2, femur: 10.1 }

async function createProfile() {
  const profile = await Profile.create({
    name: "Jane Doe",
    email: "jane@example.com",
    dateOfBirth: new Date("1990-01-15"),
    sex: "F",
    defaultHeight: 170,
  })
  return profile.id as string
}

async function seedMeasurement(profileId: string, measuredAt: Date, weight = 70) {
  return Measurement.create({
    profileId,
    measuredAt,
    weight,
    height: 175,
    skinfolds,
    perimeters,
    diameters,
  })
}

function buildGet(query: Record<string, string> = {}): Request {
  const url = new URL("http://localhost/api/measurements")
  for (const [key, value] of Object.entries(query)) {
    url.searchParams.set(key, value)
  }
  return new Request(url.toString())
}

function buildPost(body: unknown): Request {
  return new Request("http://localhost/api/measurements", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

describe("GET /api/measurements", () => {
  it("returns 401 when unauthenticated", async () => {
    sessionState.isAuthenticated = false
    const profileId = await createProfile()
    const response = await GET(buildGet({ profileId }))
    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ error: "Sessão expirada" })
  })

  it("returns 400 when profileId query param is missing", async () => {
    const response = await GET(buildGet())
    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: "ID do perfil é obrigatório" })
  })

  it("returns measurements for a profile, newest first by default", async () => {
    const profileId = await createProfile()
    await seedMeasurement(profileId, new Date("2026-01-15T08:00:00Z"), 70)
    await seedMeasurement(profileId, new Date("2026-02-15T08:00:00Z"), 68)
    await seedMeasurement(profileId, new Date("2026-03-15T08:00:00Z"), 66)

    const response = await GET(buildGet({ profileId }))
    expect(response.status).toBe(200)
    const body = (await response.json()) as Array<{ weight: number }>
    expect(body).toHaveLength(3)
    expect(body.map((m) => m.weight)).toEqual([66, 68, 70])
  })

  it("filters by from and to date range", async () => {
    const profileId = await createProfile()
    await seedMeasurement(profileId, new Date("2026-01-15T08:00:00Z"), 70)
    await seedMeasurement(profileId, new Date("2026-02-15T08:00:00Z"), 68)
    await seedMeasurement(profileId, new Date("2026-03-15T08:00:00Z"), 66)

    const response = await GET(
      buildGet({
        profileId,
        from: "2026-02-01T00:00:00Z",
        to: "2026-02-28T23:59:59Z",
      }),
    )
    expect(response.status).toBe(200)
    const body = (await response.json()) as Array<{ weight: number }>
    expect(body).toHaveLength(1)
    expect(body[0]!.weight).toBe(68)
  })

  it("respects limit and ascending sort", async () => {
    const profileId = await createProfile()
    await seedMeasurement(profileId, new Date("2026-01-15T08:00:00Z"), 70)
    await seedMeasurement(profileId, new Date("2026-02-15T08:00:00Z"), 68)
    await seedMeasurement(profileId, new Date("2026-03-15T08:00:00Z"), 66)

    const response = await GET(buildGet({ profileId, sort: "asc", limit: "2" }))
    expect(response.status).toBe(200)
    const body = (await response.json()) as Array<{ weight: number }>
    expect(body).toHaveLength(2)
    expect(body.map((m) => m.weight)).toEqual([70, 68])
  })

  it("returns an empty array for a non-existent profileId", async () => {
    const response = await GET(
      buildGet({ profileId: new mongoose.Types.ObjectId().toString() }),
    )
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual([])
  })
})

describe("POST /api/measurements", () => {
  function validBody(profileId: string) {
    return {
      profileId,
      measuredAt: new Date("2026-01-15T08:00:00Z").toISOString(),
      weight: 70,
      height: 175,
      skinfolds,
      perimeters,
      diameters,
    }
  }

  it("returns 401 when unauthenticated", async () => {
    sessionState.isAuthenticated = false
    const profileId = await createProfile()
    const response = await POST(buildPost(validBody(profileId)))
    expect(response.status).toBe(401)
  })

  it("creates a measurement and returns 201", async () => {
    const profileId = await createProfile()
    const response = await POST(buildPost(validBody(profileId)))
    expect(response.status).toBe(201)
    const body = (await response.json()) as { _id: string; weight: number }
    expect(body._id).toBeDefined()
    expect(body.weight).toBe(70)

    expect(await Measurement.countDocuments({ profileId })).toBe(1)
  })

  it("returns 400 when profileId is missing", async () => {
    const profileId = await createProfile()
    const body = validBody(profileId) as Record<string, unknown>
    delete body.profileId
    const response = await POST(buildPost(body))
    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: "Dados inválidos" })
  })

  it("returns 400 when weight is missing", async () => {
    const profileId = await createProfile()
    const body = validBody(profileId) as Record<string, unknown>
    delete body.weight
    const response = await POST(buildPost(body))
    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: "Dados inválidos" })
  })

  it("returns 400 when profileId does not match an existing profile", async () => {
    const ghostId = new mongoose.Types.ObjectId().toString()
    const response = await POST(buildPost(validBody(ghostId)))
    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: "Perfil não encontrado" })
  })
})
