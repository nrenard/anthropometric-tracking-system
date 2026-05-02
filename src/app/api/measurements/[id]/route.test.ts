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
import { GET, PUT, DELETE } from "./route"

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

async function seedMeasurement(profileId: string) {
  return Measurement.create({
    profileId,
    measuredAt: new Date("2026-01-15T08:00:00Z"),
    weight: 70,
    height: 175,
    skinfolds,
    perimeters,
    diameters,
  })
}

function buildRequest(method: string, body?: unknown): Request {
  return new Request("http://localhost/api/measurements/test", {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
}

function context(id: string) {
  return { params: Promise.resolve({ id }) }
}

describe("GET /api/measurements/[id]", () => {
  it("returns 401 when unauthenticated", async () => {
    sessionState.isAuthenticated = false
    const response = await GET(buildRequest("GET"), context("anything"))
    expect(response.status).toBe(401)
  })

  it("returns the measurement when found", async () => {
    const profileId = await createProfile()
    const measurement = await seedMeasurement(profileId)
    const response = await GET(buildRequest("GET"), context(measurement.id))
    expect(response.status).toBe(200)
    const body = (await response.json()) as { _id: string; weight: number }
    expect(body._id).toBe(measurement.id)
    expect(body.weight).toBe(70)
  })

  it("returns 400 for an invalid ObjectId", async () => {
    const response = await GET(buildRequest("GET"), context("not-an-id"))
    expect(response.status).toBe(400)
  })

  it("returns 404 for a valid but unknown id", async () => {
    const response = await GET(
      buildRequest("GET"),
      context(new mongoose.Types.ObjectId().toString()),
    )
    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({ error: "Medição não encontrado(a)" })
  })
})

describe("PUT /api/measurements/[id]", () => {
  it("returns 401 when unauthenticated", async () => {
    sessionState.isAuthenticated = false
    const response = await PUT(
      buildRequest("PUT", { weight: 71 }),
      context(new mongoose.Types.ObjectId().toString()),
    )
    expect(response.status).toBe(401)
  })

  it("updates the measurement and returns 200", async () => {
    const profileId = await createProfile()
    const measurement = await seedMeasurement(profileId)

    const response = await PUT(
      buildRequest("PUT", { weight: 71, notes: "after gym" }),
      context(measurement.id),
    )
    expect(response.status).toBe(200)
    const body = (await response.json()) as { weight: number; notes: string }
    expect(body.weight).toBe(71)
    expect(body.notes).toBe("after gym")

    const reloaded = await Measurement.findById(measurement.id)
    expect(reloaded!.weight).toBe(71)
  })

  it("ignores profileId in the body", async () => {
    const profileId = await createProfile()
    const measurement = await seedMeasurement(profileId)
    const newProfileId = new mongoose.Types.ObjectId().toString()

    const response = await PUT(
      buildRequest("PUT", { weight: 71, profileId: newProfileId }),
      context(measurement.id),
    )
    expect(response.status).toBe(200)

    const reloaded = await Measurement.findById(measurement.id)
    expect(reloaded!.profileId.toString()).toBe(profileId)
  })

  it("returns 400 with invalid body", async () => {
    const profileId = await createProfile()
    const measurement = await seedMeasurement(profileId)

    const response = await PUT(
      buildRequest("PUT", { weight: -1 }),
      context(measurement.id),
    )
    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: "Dados inválidos" })
  })

  it("returns 400 for an invalid ObjectId", async () => {
    const response = await PUT(buildRequest("PUT", { weight: 71 }), context("nope"))
    expect(response.status).toBe(400)
  })

  it("returns 404 when the measurement does not exist", async () => {
    const response = await PUT(
      buildRequest("PUT", { weight: 71 }),
      context(new mongoose.Types.ObjectId().toString()),
    )
    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({ error: "Medição não encontrado(a)" })
  })
})

describe("DELETE /api/measurements/[id]", () => {
  it("returns 401 when unauthenticated", async () => {
    sessionState.isAuthenticated = false
    const response = await DELETE(
      buildRequest("DELETE"),
      context(new mongoose.Types.ObjectId().toString()),
    )
    expect(response.status).toBe(401)
  })

  it("deletes the measurement and returns 204", async () => {
    const profileId = await createProfile()
    const measurement = await seedMeasurement(profileId)

    const response = await DELETE(buildRequest("DELETE"), context(measurement.id))
    expect(response.status).toBe(204)
    expect(await Measurement.findById(measurement.id)).toBeNull()
  })

  it("returns 204 even when the measurement does not exist", async () => {
    const response = await DELETE(
      buildRequest("DELETE"),
      context(new mongoose.Types.ObjectId().toString()),
    )
    expect(response.status).toBe(204)
  })

  it("returns 400 for an invalid ObjectId", async () => {
    const response = await DELETE(buildRequest("DELETE"), context("nope"))
    expect(response.status).toBe(400)
  })
})
