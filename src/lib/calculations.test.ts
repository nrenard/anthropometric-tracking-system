import { describe, it, expect } from "vitest"
import {
  bmi,
  bodyDensity,
  bodyFatPercent,
  fatMass,
  leanMass,
  boneMass,
  muscleMass,
  waistToHip,
  waistToHeight,
  bmr,
  sum7Skinfolds,
  correctedPerimeter,
  ageAtDate,
  computeAllMetrics,
} from "@/lib/calculations"

describe("bmi", () => {
  it("computes BMI correctly", () => {
    expect(bmi(70, 175)).toBeCloseTo(22.857, 2)
  })

  it("returns 0 for zero weight", () => {
    expect(bmi(0, 175)).toBe(0)
  })
})

describe("bodyDensity", () => {
  it("uses Jackson & Pollock 7-site formula for males", () => {
    const sum7 = 97
    const age = 30
    const expected = 1.112 - 0.00043499 * sum7 + 0.00000055 * sum7 ** 2 - 0.00028826 * age
    expect(bodyDensity("M", age, sum7)).toBeCloseTo(expected, 5)
  })

  it("uses Jackson & Pollock 7-site formula for females", () => {
    const sum7 = 97
    const age = 30
    const expected = 1.097 - 0.00046971 * sum7 + 0.00000056 * sum7 ** 2 - 0.00012828 * age
    expect(bodyDensity("F", age, sum7)).toBeCloseTo(expected, 5)
  })

  it("produces different results for M vs F with same inputs", () => {
    const maleResult = bodyDensity("M", 30, 100)
    const femaleResult = bodyDensity("F", 30, 100)
    expect(maleResult).not.toBe(femaleResult)
  })

  it("throws on unknown sex", () => {
    // @ts-expect-error invalid sex
    expect(() => bodyDensity("X", 30, 100)).toThrow()
  })
})

describe("bodyFatPercent", () => {
  it("computes using Siri equation", () => {
    const bd = 1.06633
    const expected = (495 / bd) - 450
    expect(bodyFatPercent(bd)).toBeCloseTo(expected, 3)
  })
})

describe("fatMass", () => {
  it("computes fat mass from weight and body fat %", () => {
    expect(fatMass(70, 14.21)).toBeCloseTo(9.947, 2)
  })
})

describe("leanMass", () => {
  it("computes lean mass from weight and fat mass", () => {
    expect(leanMass(70, 9.947)).toBeCloseTo(60.053, 2)
  })
})

describe("boneMass", () => {
  it("computes Matiegka bone mass estimate", () => {
    const humerus = 7.2
    const femur = 10.1
    const height = 175
    const o = (humerus + femur) / 2
    const expected = o ** 2 * height * 1.2
    expect(boneMass(humerus, femur, height)).toBeCloseTo(expected, 3)
  })
})

describe("muscleMass", () => {
  it("computes Matiegka muscle mass estimate with corrected perimeters", () => {
    const armL = 30.8
    const armR = 31.8
    const forearmL = 27
    const forearmR = 28
    const thighL = 53.6
    const thighR = 54.6
    const calfL = 37
    const calfR = 38
    const height = 175

    const sum = armL + armR + forearmL + forearmR + thighL + thighR + calfL + calfR
    const r = sum / (8 * Math.PI)
    const expected = r ** 2 * height * 6.5

    expect(muscleMass(armL, armR, forearmL, forearmR, thighL, thighR, calfL, calfR, height)).toBeCloseTo(expected, 3)
  })
})

describe("waistToHip", () => {
  it("computes waist-to-hip ratio", () => {
    expect(waistToHip(80, 100)).toBeCloseTo(0.8, 3)
  })
})

describe("waistToHeight", () => {
  it("computes waist-to-height ratio", () => {
    expect(waistToHeight(80, 175)).toBeCloseTo(0.457, 3)
  })
})

describe("bmr", () => {
  it("uses Mifflin-St Jeor for males", () => {
    const expected = 10 * 70 + 6.25 * 175 - 5 * 30 + 5
    expect(bmr("M", 70, 175, 30)).toBe(expected)
  })

  it("uses Mifflin-St Jeor for females", () => {
    const expected = 10 * 70 + 6.25 * 175 - 5 * 30 - 161
    expect(bmr("F", 70, 175, 30)).toBe(expected)
  })

  it("produces different results for M vs F with same inputs", () => {
    const maleResult = bmr("M", 70, 175, 30)
    const femaleResult = bmr("F", 70, 175, 30)
    expect(maleResult).not.toBe(femaleResult)
  })

  it("throws on unknown sex", () => {
    // @ts-expect-error invalid sex
    expect(() => bmr("X", 70, 175, 30)).toThrow()
  })
})

describe("sum7Skinfolds", () => {
  it("sums all 7 skinfold values", () => {
    const sf = {
      chest: 10,
      midaxillary: 8,
      triceps: 12,
      subscapular: 15,
      abdominal: 20,
      suprailiac: 18,
      thigh: 14,
    }
    expect(sum7Skinfolds(sf)).toBe(97)
  })
})

describe("correctedPerimeter", () => {
  it("subtracts skinfold / 10 from perimeter", () => {
    expect(correctedPerimeter(32, 12)).toBe(30.8)
  })
})

describe("ageAtDate", () => {
  it("computes integer age at a given date", () => {
    const dob = new Date("1990-06-15")
    const at = new Date("2026-01-15")
    expect(ageAtDate(dob, at)).toBe(35)
  })

  it("computes age when birthday has not yet occurred in the year", () => {
    const dob = new Date("1990-12-15")
    const at = new Date("2026-01-15")
    expect(ageAtDate(dob, at)).toBe(35)
  })
})

describe("computeAllMetrics", () => {
  it("returns all derived values for valid measurement and profile", () => {
    const profile = {
      name: "Jane",
      email: "jane@test.com",
      dateOfBirth: new Date("1990-06-15"),
      sex: "F" as const,
      defaultHeight: 170,
    }

    const measurement = {
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

    const result = computeAllMetrics(measurement, profile)

    expect(result.bmi).toBeCloseTo(22.857, 2)
    expect(result.bodyFatPercent).toBeGreaterThan(0)
    expect(result.bodyFatPercent).toBeLessThan(50)
    expect(result.fatMass).toBeCloseTo(result.leanMass + result.fatMass - result.leanMass, 0)
    expect(result.leanMass).toBeGreaterThan(0)
    expect(result.boneMass).toBeGreaterThan(0)
    expect(result.muscleMass).toBeGreaterThan(0)
    expect(result.waistToHip).toBeCloseTo(0.842, 2)
    expect(result.waistToHeight).toBeCloseTo(0.457, 2)
    expect(result.bmr).toBeGreaterThan(1000)
    expect(result.bodyDensity).toBeGreaterThan(1.0)
    expect(result.bodyDensity).toBeLessThan(1.1)
    expect(result.fatMass).toBeGreaterThan(0)

    expect(typeof result.bmi).toBe("number")
    expect(typeof result.bodyDensity).toBe("number")
    expect(typeof result.bodyFatPercent).toBe("number")
    expect(typeof result.fatMass).toBe("number")
    expect(typeof result.leanMass).toBe("number")
    expect(typeof result.boneMass).toBe("number")
    expect(typeof result.muscleMass).toBe("number")
    expect(typeof result.waistToHip).toBe("number")
    expect(typeof result.waistToHeight).toBe("number")
    expect(typeof result.bmr).toBe("number")
  })

  it("fat mass + lean mass equals weight", () => {
    const profile = {
      name: "Jane",
      email: "jane@test.com",
      dateOfBirth: new Date("1990-06-15"),
      sex: "F" as const,
      defaultHeight: 170,
    }

    const measurement = {
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

    const result = computeAllMetrics(measurement, profile)
    expect(result.fatMass + result.leanMass).toBeCloseTo(70, 1)
  })
})
