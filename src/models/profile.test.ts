import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest"
import { setupTestDb, teardownTestDb } from "@/test/db"
import Profile from "@/models/profile"

beforeAll(async () => {
  await setupTestDb()
})

afterAll(async () => {
  await teardownTestDb()
})

beforeEach(async () => {
  await Profile.deleteMany({})
})

const validProfile = {
  name: "Jane Doe",
  email: "jane@example.com",
  dateOfBirth: new Date("1990-01-15"),
  sex: "F" as const,
  defaultHeight: 170,
}

describe("Profile model", () => {
  it("saves a valid profile via new Profile().save()", async () => {
    const saved = await new Profile(validProfile).save()

    expect(saved._id).toBeDefined()
    expect(saved.name).toBe("Jane Doe")
    expect(saved.email).toBe("jane@example.com")
    expect(saved.sex).toBe("F")
    expect(saved.defaultHeight).toBe(170)
    expect(saved.dateOfBirth).toBeInstanceOf(Date)
    expect(saved.createdAt).toBeInstanceOf(Date)
    expect(saved.updatedAt).toBeInstanceOf(Date)
  })

  it("allows multiple profiles with unique _id values", async () => {
    const first = await new Profile(validProfile).save()
    const second = await new Profile({
      ...validProfile,
      name: "John Roe",
      email: "john@example.com",
      sex: "M",
    }).save()

    expect(first._id.toString()).not.toBe(second._id.toString())

    const count = await Profile.countDocuments()
    expect(count).toBe(2)
  })

  it("does not expose findOneAndUpsert or SINGLETON_ID", async () => {
    expect(
      (Profile as unknown as { findOneAndUpsert?: unknown }).findOneAndUpsert,
    ).toBeUndefined()

    const mod = await import("@/models/profile")
    expect((mod as Record<string, unknown>).SINGLETON_ID).toBeUndefined()
  })

  it("rejects missing required fields", async () => {
    const attempt = async () => {
      const doc = new Profile({ name: "Test" })
      await doc.validate()
    }

    await expect(attempt()).rejects.toThrow()
  })

  it("rejects invalid sex value", async () => {
    const attempt = async () => {
      const doc = new Profile({ ...validProfile, sex: "X" })
      await doc.validate()
    }

    await expect(attempt()).rejects.toThrow()
  })

  it("rejects negative defaultHeight", async () => {
    const attempt = async () => {
      const doc = new Profile({ ...validProfile, defaultHeight: -5 })
      await doc.validate()
    }

    await expect(attempt()).rejects.toThrow()
  })
})
