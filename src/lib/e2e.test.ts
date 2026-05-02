import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest"
import { setupTestDb, teardownTestDb } from "@/test/db"
import Profile from "@/models/profile"
import Measurement from "@/models/measurement"
import { computeAllMetrics } from "@/lib/calculations"
import { profileSchema, measurementInputSchema } from "@/lib/validation"

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

describe("E2E: models + calculations + validation", () => {
  it("round-trips profile, measurement, and calculations", async () => {
    const profileData = {
      name: "Jane Doe",
      email: "jane@example.com",
      dateOfBirth: new Date("1990-06-15"),
      sex: "F" as const,
      defaultHeight: 170,
    }

    const profile = await new Profile(profileData).save()

    const measurementData = {
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

    const savedMeasurement = await new Measurement({
      ...measurementData,
      profileId: profile._id,
      measuredAt: new Date("2026-01-15T08:00:00Z"),
    }).save()

    const metrics = computeAllMetrics(
      {
        measuredAt: savedMeasurement.measuredAt,
        weight: savedMeasurement.weight,
        height: savedMeasurement.height!,
        skinfolds: savedMeasurement.skinfolds!,
        perimeters: savedMeasurement.perimeters!,
        diameters: savedMeasurement.diameters!,
      },
      {
        name: profile.name,
        email: profile.email,
        dateOfBirth: profile.dateOfBirth,
        sex: profile.sex,
        defaultHeight: profile.defaultHeight,
      },
    )

    expect(metrics.bmi).toBeGreaterThan(0)
    expect(metrics.bodyDensity).toBeGreaterThan(1.0)
    expect(metrics.bodyDensity).toBeLessThan(1.1)
    expect(metrics.bodyFatPercent).toBeGreaterThan(0)
    expect(metrics.bodyFatPercent).toBeLessThan(50)
    expect(metrics.fatMass).toBeGreaterThan(0)
    expect(metrics.leanMass).toBeGreaterThan(0)
    expect(Math.abs(metrics.fatMass + metrics.leanMass - 70)).toBeLessThan(0.01)
    expect(metrics.boneMass).toBeGreaterThan(0)
    expect(metrics.muscleMass).toBeGreaterThan(0)
    expect(metrics.waistToHip).toBeGreaterThan(0)
    expect(metrics.waistToHeight).toBeGreaterThan(0)
    expect(metrics.bmr).toBeGreaterThan(1000)

    expect(Object.keys(metrics).sort()).toEqual([
      "bmi", "bodyDensity", "bodyFatPercent", "fatMass", "leanMass",
      "boneMass", "muscleMass", "waistToHip", "waistToHeight", "bmr",
    ].sort())
  })

  it("Zod schemas validate model-compatible data", () => {
    const profileResult = profileSchema.safeParse({
      name: "John",
      email: "john@test.com",
      dateOfBirth: new Date("1985-03-20"),
      sex: "M",
      defaultHeight: 180,
    })
    expect(profileResult.success).toBe(true)

    const measurementResult = measurementInputSchema.safeParse({
      measuredAt: new Date("2026-01-15T08:00:00Z"),
      weight: 80,
      height: 180,
      skinfolds: {
        chest: 12, midaxillary: 10, triceps: 14, subscapular: 16,
        abdominal: 22, suprailiac: 20, thigh: 15,
      },
      perimeters: {
        neck: 40, waist: 85, hip: 100,
        arm: { left: 34, right: 35 },
        forearm: { left: 28, right: 29 },
        thigh: { left: 56, right: 57 },
        calf: { left: 38, right: 39 },
      },
      diameters: { humerus: 7.5, femur: 10.3 },
    })
    expect(measurementResult.success).toBe(true)
  })

  it("calculations.ts has no Mongoose imports", async () => {
    const fs = await import("fs")
    const calcSource = fs.readFileSync("src/lib/calculations.ts", "utf-8")
    expect(calcSource).not.toContain("mongoose")
    expect(calcSource).not.toContain("dbConnect")
  })
})
