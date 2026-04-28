import { describe, it, expect } from "vitest"
import { findClosestMeasurement } from "./date-utils"

interface Sample {
  id: string
  measuredAt: Date
}

function sample(id: string, iso: string): Sample {
  return { id, measuredAt: new Date(iso) }
}

describe("findClosestMeasurement", () => {
  it("returns null when no candidate is within the tolerance window", () => {
    const target = new Date("2026-03-02T00:00:00.000Z")
    const candidates = [
      sample("a", "2026-03-29T00:00:00.000Z"),
      sample("b", "2026-04-01T00:00:00.000Z"),
    ]
    expect(findClosestMeasurement(target, candidates, 3)).toBeNull()
  })

  it("returns the candidate with the smallest absolute date diff", () => {
    const target = new Date("2026-03-02T00:00:00.000Z")
    const candidates = [
      sample("far", "2026-03-04T00:00:00.000Z"),
      sample("close", "2026-03-02T12:00:00.000Z"),
      sample("outside", "2026-03-29T00:00:00.000Z"),
    ]
    const result = findClosestMeasurement(target, candidates, 3)
    expect(result?.id).toBe("close")
  })

  it("excludes the provided sentinel item from consideration", () => {
    const target = new Date("2026-03-02T00:00:00.000Z")
    const exact = sample("exact", "2026-03-02T00:00:00.000Z")
    const close = sample("close", "2026-03-03T00:00:00.000Z")
    const result = findClosestMeasurement(target, [exact, close], 3, exact)
    expect(result?.id).toBe("close")
  })

  it("treats the tolerance boundary inclusively", () => {
    const target = new Date("2026-03-02T00:00:00.000Z")
    const onBoundary = sample("edge", "2026-03-05T00:00:00.000Z")
    const result = findClosestMeasurement(target, [onBoundary], 3)
    expect(result?.id).toBe("edge")
  })
})
