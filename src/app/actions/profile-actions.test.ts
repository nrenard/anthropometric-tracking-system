import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest"
import { setupTestDb, teardownTestDb } from "@/test/db"
import Profile from "@/models/profile"
import Measurement from "@/models/measurement"
import {
  createProfile,
  getProfiles,
  getProfile,
  deleteProfile,
} from "@/app/actions/profile-actions"

beforeAll(async () => {
  await setupTestDb()
})

afterAll(async () => {
  await teardownTestDb()
})

beforeEach(async () => {
  await Profile.deleteMany({})
  await Measurement.deleteMany({})
})

const profileData = {
  name: "Jane Doe",
  email: "jane@example.com",
  dateOfBirth: new Date("1990-01-15"),
  sex: "F" as const,
  defaultHeight: 170,
}

describe("profile server actions", () => {
  it("createProfile inserts a new profile and returns a serialisable object with string id", async () => {
    const created = await createProfile(profileData)

    expect(created.id).toBeDefined()
    expect(typeof created.id).toBe("string")
    expect(created.name).toBe("Jane Doe")
    expect(created.email).toBe("jane@example.com")
    expect(created.sex).toBe("F")
    expect(created.defaultHeight).toBe(170)
  })

  it("getProfiles returns all profiles as plain objects with string ids", async () => {
    await createProfile(profileData)
    await createProfile({ ...profileData, name: "John Roe", email: "john@example.com", sex: "M" })

    const profiles = await getProfiles()
    expect(profiles).toHaveLength(2)
    expect(typeof profiles[0]!.id).toBe("string")
    expect(profiles.map((p) => p.name).sort()).toEqual(["Jane Doe", "John Roe"])
  })

  it("getProfile returns null for unknown id", async () => {
    const result = await getProfile("000000000000000000000000")
    expect(result).toBeNull()
  })

  it("getProfile returns the profile when it exists", async () => {
    const created = await createProfile(profileData)
    const found = await getProfile(created.id)
    expect(found).not.toBeNull()
    expect(found!.name).toBe("Jane Doe")
  })

  it("deleteProfile removes the profile and cascades measurement deletion", async () => {
    const created = await createProfile(profileData)

    await new Measurement({
      profileId: created.id,
      measuredAt: new Date("2026-01-15T08:00:00Z"),
      weight: 70,
      height: 175,
      skinfolds: {
        chest: 10, midaxillary: 8, triceps: 12, subscapular: 15,
        abdominal: 20, suprailiac: 18, thigh: 14,
      },
      perimeters: {
        neck: 38, waist: 80, hip: 95,
        arm: { left: 32, right: 33 },
        forearm: { left: 27, right: 28 },
        thigh: { left: 55, right: 56 },
        calf: { left: 37, right: 38 },
      },
      diameters: { humerus: 7.2, femur: 10.1 },
    }).save()

    expect(await Measurement.countDocuments({ profileId: created.id })).toBe(1)

    await deleteProfile(created.id)

    expect(await Profile.findById(created.id)).toBeNull()
    expect(await Measurement.countDocuments({ profileId: created.id })).toBe(0)
  })

  it("deleteProfile is a no-op when the profile does not exist", async () => {
    await expect(deleteProfile("000000000000000000000000")).resolves.toBeUndefined()
  })
})
