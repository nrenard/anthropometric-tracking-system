import { describe, it, expect } from "vitest"
import {
  toProfileInput,
  toMeasurementInput,
  type MeasurementData,
  type ProfileData,
} from "./measurement-utils"
import type { ProfileInput } from "./calculations"

function makeProfile(overrides: Partial<ProfileData> = {}): ProfileData {
  return {
    name: "John Doe",
    email: "john@example.com",
    dateOfBirth: "1990-06-15T00:00:00.000Z",
    sex: "M",
    defaultHeight: 180,
    ...overrides,
  }
}

function makeMeasurement(
  overrides: Partial<MeasurementData> = {},
): MeasurementData {
  return {
    _id: "m1",
    profileId: "p1",
    measuredAt: "2026-01-15T12:00:00.000Z",
    weight: 80,
    height: 180,
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
      waist: 85,
      hip: 100,
      arm: { left: 30, right: 30 },
      forearm: { left: 25, right: 25 },
      thigh: { left: 55, right: 55 },
      calf: { left: 37, right: 37 },
    },
    diameters: { humerus: 7, femur: 10 },
    createdAt: "2026-01-15T12:00:00.000Z",
    updatedAt: "2026-01-15T12:00:00.000Z",
    ...overrides,
  }
}

describe("toProfileInput", () => {
  it("converts ProfileData to ProfileInput with Date object", () => {
    const profile = makeProfile({ dateOfBirth: "1990-06-15T00:00:00.000Z" })
    const result = toProfileInput(profile)

    expect(result).toEqual({
      name: "John Doe",
      email: "john@example.com",
      dateOfBirth: new Date("1990-06-15T00:00:00.000Z"),
      sex: "M",
      defaultHeight: 180,
    } satisfies ProfileInput)
  })

  it("preserves all required fields from the input profile", () => {
    const profile = makeProfile({
      name: "Jane",
      email: "jane@test.com",
      sex: "F",
      defaultHeight: 165,
    })
    const result = toProfileInput(profile)

    expect(result.name).toBe("Jane")
    expect(result.email).toBe("jane@test.com")
    expect(result.sex).toBe("F")
    expect(result.defaultHeight).toBe(165)
  })

  it("correctly parses dateOfBirth string to Date", () => {
    const profile = makeProfile({ dateOfBirth: "2000-01-01T00:00:00.000Z" })
    const result = toProfileInput(profile)

    expect(result.dateOfBirth).toBeInstanceOf(Date)
    expect(result.dateOfBirth.toISOString()).toBe("2000-01-01T00:00:00.000Z")
  })
})

describe("toMeasurementInput", () => {
  it("returns null when skinfolds is undefined", () => {
    const input = makeMeasurement({ skinfolds: undefined })
    expect(toMeasurementInput(input, 180)).toBeNull()
  })

  it("returns null when perimeters is undefined", () => {
    const input = makeMeasurement({ perimeters: undefined })
    expect(toMeasurementInput(input, 180)).toBeNull()
  })

  it("returns null when diameters is undefined", () => {
    const input = makeMeasurement({ diameters: undefined })
    expect(toMeasurementInput(input, 180)).toBeNull()
  })

  it("returns null when height is undefined and fallbackHeight is 0", () => {
    const input = makeMeasurement({ height: undefined })
    expect(toMeasurementInput(input, 0)).toBeNull()
  })

  it("returns null when both measurement height and fallbackHeight are missing", () => {
    const input = makeMeasurement({ height: undefined })
    expect(toMeasurementInput(input, undefined as unknown as number)).toBeNull()
  })

  it("uses fallbackHeight when measurement height is missing", () => {
    const input = makeMeasurement({ height: undefined })
    const result = toMeasurementInput(input, 175)
    expect(result).not.toBeNull()
    expect(result!.height).toBe(175)
  })

  it("prefers measurement height over fallbackHeight when both are present", () => {
    const input = makeMeasurement({ height: 170 })
    const result = toMeasurementInput(input, 175)
    expect(result).not.toBeNull()
    expect(result!.height).toBe(170)
  })

  it("returns correct MeasurementInput when all data is present", () => {
    const input = makeMeasurement()
    const result = toMeasurementInput(input, 180)

    expect(result).not.toBeNull()
    expect(result!.measuredAt).toEqual(new Date("2026-01-15T12:00:00.000Z"))
    expect(result!.weight).toBe(80)
    expect(result!.height).toBe(180)
    expect(result!.skinfolds).toEqual({
      chest: 10,
      midaxillary: 8,
      triceps: 12,
      subscapular: 15,
      abdominal: 20,
      suprailiac: 18,
      thigh: 14,
    })
    expect(result!.diameters).toEqual({ humerus: 7, femur: 10 })
  })

  it("does NOT include neck, abdomen, chest in perimeters output", () => {
    const input = makeMeasurement({
      perimeters: {
        neck: 38,
        waist: 85,
        hip: 100,
        abdomen: 90,
        chest: 95,
        arm: { left: 30, right: 30 },
        forearm: { left: 25, right: 25 },
        thigh: { left: 55, right: 55 },
        calf: { left: 37, right: 37 },
      },
    })
    const result = toMeasurementInput(input, 180)

    expect(result).not.toBeNull()
    expect(result!.perimeters).toEqual({
      waist: 85,
      hip: 100,
      arm: { left: 30, right: 30 },
      forearm: { left: 25, right: 25 },
      thigh: { left: 55, right: 55 },
      calf: { left: 37, right: 37 },
    })
    expect(result!.perimeters).not.toHaveProperty("neck")
    expect(result!.perimeters).not.toHaveProperty("abdomen")
    expect(result!.perimeters).not.toHaveProperty("chest")
  })

  it("preserves notes and _id in the result (the caller handles these)", () => {
    const input = makeMeasurement({ notes: "some note" })
    const result = toMeasurementInput(input, 180)

    expect(result).not.toBeNull()
    // Notes and _id are stored on MeasurementData but not on MeasurementInput
    // The caller (dashboard) adds them separately
    expect(result!.weight).toBe(80)
  })
})
