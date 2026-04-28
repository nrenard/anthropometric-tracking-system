import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest"
import mongoose from "mongoose"
import { setupTestDb, teardownTestDb } from "@/test/db"
import Measurement from "@/models/measurement"

beforeAll(async () => {
  await setupTestDb()
})

afterAll(async () => {
  await teardownTestDb()
})

beforeEach(async () => {
  await Measurement.deleteMany({})
})

const profileId = new mongoose.Types.ObjectId()

const validMeasurement = {
  profileId,
  measuredAt: new Date("2026-01-15T08:00:00Z"),
  weight: 70,
  height: 175,
  notes: "Fasted morning",
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
    abdomen: 82,
    chest: 100,
    arm: { left: 32, right: 33 },
    forearm: { left: 27, right: 28 },
    thigh: { left: 55, right: 56 },
    calf: { left: 37, right: 38 },
  },
  diameters: {
    humerus: 7.2,
    femur: 10.1,
  },
}

describe("Measurement model", () => {
  it("saves a valid measurement with all subdocuments", async () => {
    const measurement = new Measurement(validMeasurement)
    const saved = await measurement.save()

    expect(saved._id).toBeDefined()
    expect(saved.profileId.toString()).toBe(profileId.toString())
    expect(saved.weight).toBe(70)
    expect(saved.height).toBe(175)
    expect(saved.notes).toBe("Fasted morning")
    expect(saved.measuredAt).toBeInstanceOf(Date)
    expect(saved.createdAt).toBeInstanceOf(Date)
    expect(saved.updatedAt).toBeInstanceOf(Date)

    expect(saved.skinfolds?.chest).toBe(10)
    expect(saved.skinfolds?.abdominal).toBe(20)
    expect(saved.skinfolds?.thigh).toBe(14)

    expect(saved.perimeters?.neck).toBe(38)
    expect(saved.perimeters?.hip).toBe(95)
    expect(saved.perimeters?.arm.left).toBe(32)
    expect(saved.perimeters?.arm.right).toBe(33)
    expect(saved.perimeters?.forearm.left).toBe(27)
    expect(saved.perimeters?.calf.right).toBe(38)

    expect(saved.diameters?.humerus).toBe(7.2)
    expect(saved.diameters?.femur).toBe(10.1)
  })

  it("saves a partial measurement with only weight, profileId, measuredAt", async () => {
    const doc = new Measurement({
      profileId,
      measuredAt: new Date("2026-01-15T08:00:00Z"),
      weight: 70,
    })
    const saved = await doc.save()

    expect(saved._id).toBeDefined()
    expect(saved.weight).toBe(70)
    expect(saved.height).toBeUndefined()
    expect(saved.skinfolds).toBeUndefined()
    expect(saved.perimeters).toBeUndefined()
    expect(saved.diameters).toBeUndefined()
  })

  it("rejects missing required top-level fields", async () => {
    const attempt = async () => {
      const doc = new Measurement({ notes: "missing fields" })
      await doc.validate()
    }

    await expect(attempt()).rejects.toThrow()
  })

  it("rejects negative weight", async () => {
    const attempt = async () => {
      const doc = new Measurement({ ...validMeasurement, weight: -10 })
      await doc.validate()
    }

    await expect(attempt()).rejects.toThrow()
  })

  it("rejects missing required skinfold", async () => {
    const attempt = async () => {
      const doc = new Measurement({
        ...validMeasurement,
        skinfolds: { ...validMeasurement.skinfolds, triceps: undefined },
      })
      await doc.validate()
    }

    await expect(attempt()).rejects.toThrow()
  })

  it("rejects negative skinfold value", async () => {
    const attempt = async () => {
      const doc = new Measurement({
        ...validMeasurement,
        skinfolds: { ...validMeasurement.skinfolds, chest: -1 },
      })
      await doc.validate()
    }

    await expect(attempt()).rejects.toThrow()
  })

  it("rejects missing required perimeters", async () => {
    const attempt1 = async () => {
      const doc = new Measurement({
        ...validMeasurement,
        perimeters: { ...validMeasurement.perimeters, neck: undefined },
      })
      await doc.validate()
    }

    await expect(attempt1()).rejects.toThrow()

    const attempt2 = async () => {
      const doc = new Measurement({
        ...validMeasurement,
        perimeters: {
          ...validMeasurement.perimeters,
          arm: { ...validMeasurement.perimeters.arm, left: undefined },
        },
      })
      await doc.validate()
    }

    await expect(attempt2()).rejects.toThrow()
  })

  it("allows optional perimeter fields to be omitted", async () => {
    const withoutOptional = {
      ...validMeasurement,
      perimeters: {
        neck: 38,
        waist: 80,
        hip: 95,
        arm: { left: 32, right: 33 },
        forearm: { left: 27, right: 28 },
        thigh: { left: 55, right: 56 },
        calf: { left: 37, right: 38 },
      },
    }
    delete (withoutOptional.perimeters as Record<string, unknown>).abdomen
    delete (withoutOptional.perimeters as Record<string, unknown>).chest

    const doc = new Measurement(withoutOptional)
    const saved = await doc.save()

    expect(saved.perimeters?.abdomen).toBeUndefined()
    expect(saved.perimeters?.chest).toBeUndefined()
    expect(saved.perimeters?.neck).toBe(38)
  })

  it("rejects missing diameters", async () => {
    const attempt = async () => {
      const doc = new Measurement({
        ...validMeasurement,
        diameters: { humerus: 7.2 },
      })
      await doc.validate()
    }

    await expect(attempt()).rejects.toThrow()
  })

  it("saves multiple measurements", async () => {
    await new Measurement(validMeasurement).save()
    await new Measurement({
      ...validMeasurement,
      measuredAt: new Date("2026-02-15T08:00:00Z"),
      weight: 68,
    }).save()

    const count = await Measurement.countDocuments()
    expect(count).toBe(2)
  })

  it("rejects a measurement without profileId", async () => {
    const { profileId: _omit, ...withoutProfile } = validMeasurement
    void _omit

    const attempt = async () => {
      const doc = new Measurement(withoutProfile)
      await doc.validate()
    }

    await expect(attempt()).rejects.toThrow()
  })

  it("declares a compound index on { profileId, measuredAt }", () => {
    const indexes = Measurement.schema.indexes()
    const hasCompound = indexes.some(
      ([fields]) =>
        (fields as Record<string, number>).profileId === 1 &&
        (fields as Record<string, number>).measuredAt === -1,
    )
    expect(hasCompound).toBe(true)
  })
})
