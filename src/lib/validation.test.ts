import { describe, it, expect } from "vitest"
import {
  profileSchema,
  skinFoldsSchema,
  perimetersSchema,
  diametersSchema,
  measurementSchema,
  measurementInputSchema,
  measurementCreateSchema,
} from "@/lib/validation"

describe("profileSchema", () => {
  it("accepts valid profile input", () => {
    const result = profileSchema.safeParse({
      name: "Jane Doe",
      email: "jane@example.com",
      dateOfBirth: new Date("1990-01-15"),
      sex: "F",
      defaultHeight: 170,
    })

    expect(result.success).toBe(true)
  })

  it("rejects missing name", () => {
    const result = profileSchema.safeParse({
      email: "jane@example.com",
      dateOfBirth: new Date("1990-01-15"),
      sex: "F",
      defaultHeight: 170,
    })

    expect(result.success).toBe(false)
  })

  it("rejects invalid email", () => {
    const result = profileSchema.safeParse({
      name: "Jane Doe",
      email: "not-an-email",
      dateOfBirth: new Date("1990-01-15"),
      sex: "F",
      defaultHeight: 170,
    })

    expect(result.success).toBe(false)
  })

  it("rejects future dateOfBirth", () => {
    const future = new Date()
    future.setFullYear(future.getFullYear() + 1)

    const result = profileSchema.safeParse({
      name: "Jane Doe",
      email: "jane@example.com",
      dateOfBirth: future,
      sex: "F",
      defaultHeight: 170,
    })

    expect(result.success).toBe(false)
  })

  it("rejects invalid sex", () => {
    const result = profileSchema.safeParse({
      name: "Jane Doe",
      email: "jane@example.com",
      dateOfBirth: new Date("1990-01-15"),
      sex: "X",
      defaultHeight: 170,
    })

    expect(result.success).toBe(false)
  })

  it("rejects negative defaultHeight", () => {
    const result = profileSchema.safeParse({
      name: "Jane Doe",
      email: "jane@example.com",
      dateOfBirth: new Date("1990-01-15"),
      sex: "F",
      defaultHeight: -5,
    })

    expect(result.success).toBe(false)
  })

  it("coerces date string to Date", () => {
    const result = profileSchema.safeParse({
      name: "Jane Doe",
      email: "jane@example.com",
      dateOfBirth: "1990-01-15",
      sex: "F",
      defaultHeight: 170,
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.dateOfBirth).toBeInstanceOf(Date)
    }
  })
})

describe("skinFoldsSchema", () => {
  it("accepts valid skinfold values", () => {
    const result = skinFoldsSchema.safeParse({
      chest: 10,
      midaxillary: 8,
      triceps: 12,
      subscapular: 15,
      abdominal: 20,
      suprailiac: 18,
      thigh: 14,
    })

    expect(result.success).toBe(true)
  })

  it("rejects negative values", () => {
    const result = skinFoldsSchema.safeParse({
      chest: -1,
      midaxillary: 8,
      triceps: 12,
      subscapular: 15,
      abdominal: 20,
      suprailiac: 18,
      thigh: 14,
    })

    expect(result.success).toBe(false)
  })

  it("rejects missing fields", () => {
    const result = skinFoldsSchema.safeParse({
      chest: 10,
      triceps: 12,
    })

    expect(result.success).toBe(false)
  })
})

describe("perimetersSchema", () => {
  it("accepts valid perimeter values", () => {
    const result = perimetersSchema.safeParse({
      neck: 38,
      waist: 80,
      hip: 95,
      arm: { left: 32, right: 33 },
      forearm: { left: 27, right: 28 },
      thigh: { left: 55, right: 56 },
      calf: { left: 37, right: 38 },
    })

    expect(result.success).toBe(true)
  })

  it("accepts optional abdomen and chest", () => {
    const result = perimetersSchema.safeParse({
      neck: 38,
      waist: 80,
      hip: 95,
      abdomen: 82,
      chest: 100,
      arm: { left: 32, right: 33 },
      forearm: { left: 27, right: 28 },
      thigh: { left: 55, right: 56 },
      calf: { left: 37, right: 38 },
    })

    expect(result.success).toBe(true)
  })

  it("rejects missing L/R perimeters", () => {
    const result = perimetersSchema.safeParse({
      neck: 38,
      waist: 80,
      hip: 95,
      arm: { left: 32 },
      forearm: { left: 27, right: 28 },
      thigh: { left: 55, right: 56 },
      calf: { left: 37, right: 38 },
    })

    expect(result.success).toBe(false)
  })

  it("rejects negative values", () => {
    const result = perimetersSchema.safeParse({
      neck: -1,
      waist: 80,
      hip: 95,
      arm: { left: 32, right: 33 },
      forearm: { left: 27, right: 28 },
      thigh: { left: 55, right: 56 },
      calf: { left: 37, right: 38 },
    })

    expect(result.success).toBe(false)
  })
})

describe("diametersSchema", () => {
  it("accepts valid diameter values", () => {
    const result = diametersSchema.safeParse({
      humerus: 7.2,
      femur: 10.1,
    })

    expect(result.success).toBe(true)
  })

  it("rejects missing fields", () => {
    const result = diametersSchema.safeParse({
      humerus: 7.2,
    })

    expect(result.success).toBe(false)
  })
})

describe("measurementSchema", () => {
  const validInput = {
    measuredAt: new Date("2026-01-15T08:00:00Z"),
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
    diameters: {
      humerus: 7.2,
      femur: 10.1,
    },
  }

  it("accepts valid measurement", () => {
    const result = measurementSchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })

  it("accepts optional notes", () => {
    const result = measurementSchema.safeParse({ ...validInput, notes: "Fasted" })
    expect(result.success).toBe(true)
  })

  it("rejects negative weight", () => {
    const result = measurementSchema.safeParse({ ...validInput, weight: -10 })
    expect(result.success).toBe(false)
  })

  it("rejects weight over 700", () => {
    const result = measurementSchema.safeParse({ ...validInput, weight: 701 })
    expect(result.success).toBe(false)
  })

  it("accepts missing skinfolds (optional sub-object)", () => {
    const result = measurementSchema.safeParse(
      Object.fromEntries(Object.entries(validInput).filter(([k]) => k !== "skinfolds"))
    )
    expect(result.success).toBe(true)
  })

  it("accepts a measurement with only weight and measuredAt", () => {
    const result = measurementSchema.safeParse({
      measuredAt: new Date("2026-01-15T08:00:00Z"),
      weight: 70,
    })
    expect(result.success).toBe(true)
  })

  it("rejects invalid subdocument", () => {
    const result = measurementSchema.safeParse({
      ...validInput,
      diameters: { humerus: 7.2 },
    })
    expect(result.success).toBe(false)
  })
})

describe("measurementInputSchema", () => {
  const validInput = {
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
    diameters: {
      humerus: 7.2,
      femur: 10.1,
    },
  }

  it("accepts valid measurement without measuredAt", () => {
    const result = measurementInputSchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })

  it("defaults measuredAt to current timestamp when omitted", () => {
    const before = new Date()
    const result = measurementInputSchema.safeParse(validInput)
    const after = new Date()

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.measuredAt).toBeInstanceOf(Date)
      expect(result.data.measuredAt.getTime()).toBeGreaterThanOrEqual(before.getTime())
      expect(result.data.measuredAt.getTime()).toBeLessThanOrEqual(after.getTime())
    }
  })

  it("uses provided measuredAt when given", () => {
    const date = new Date("2026-01-15T08:00:00Z")
    const result = measurementInputSchema.safeParse({ ...validInput, measuredAt: date })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.measuredAt).toEqual(date)
    }
  })

  it("accepts a partial measurement with only weight", () => {
    const result = measurementInputSchema.safeParse({ weight: 70 })
    expect(result.success).toBe(true)
  })

  it("accepts skinfolds without perimeters or diameters", () => {
    const result = measurementInputSchema.safeParse({
      weight: 70,
      skinfolds: validInput.skinfolds,
    })
    expect(result.success).toBe(true)
  })
})

describe("measurementCreateSchema", () => {
  it("accepts a measurement with only profileId, weight, and measuredAt", () => {
    const result = measurementCreateSchema.safeParse({
      profileId: "111111111111111111111111",
      weight: 70,
      measuredAt: new Date("2026-01-15T08:00:00Z"),
    })
    expect(result.success).toBe(true)
  })

  it("accepts a measurement with only profileId and weight (measuredAt defaults)", () => {
    const result = measurementCreateSchema.safeParse({
      profileId: "111111111111111111111111",
      weight: 70,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.measuredAt).toBeInstanceOf(Date)
    }
  })

  it("rejects when weight is missing", () => {
    const result = measurementCreateSchema.safeParse({
      profileId: "111111111111111111111111",
    })
    expect(result.success).toBe(false)
  })

  it("rejects when profileId is missing", () => {
    const result = measurementCreateSchema.safeParse({
      weight: 70,
    })
    expect(result.success).toBe(false)
  })

  it("still validates skinfolds shape when provided", () => {
    const result = measurementCreateSchema.safeParse({
      profileId: "111111111111111111111111",
      weight: 70,
      skinfolds: { chest: 10 },
    })
    expect(result.success).toBe(false)
  })
})
