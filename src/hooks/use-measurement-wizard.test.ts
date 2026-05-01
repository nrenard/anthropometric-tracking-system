import { describe, it, expect } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useMeasurementWizard } from "./use-measurement-wizard"

describe("useMeasurementWizard", () => {
  it("initializes at step 1 with empty data", () => {
    const { result } = renderHook(() => useMeasurementWizard())
    expect(result.current.step).toBe(1)
    expect(result.current.data.weight).toBe("")
    expect(result.current.errors).toEqual({})
  })

  it("setField updates a top-level field value", () => {
    const { result } = renderHook(() => useMeasurementWizard())
    act(() => {
      result.current.setField("weight", "70.5")
    })
    expect(result.current.data.weight).toBe("70.5")
  })

  it("setField updates skinfold fields", () => {
    const { result } = renderHook(() => useMeasurementWizard())
    act(() => {
      result.current.setField("skinfolds.chest", "10")
    })
    expect(result.current.data["skinfolds.chest"]).toBe("10")
  })

  it("blocks next() from step 1 when weight is empty", () => {
    const { result } = renderHook(() => useMeasurementWizard())
    act(() => {
      result.current.next()
    })
    expect(result.current.step).toBe(1)
    expect(result.current.errors.weight).toBeDefined()
  })

  it("blocks next() from step 1 when weight is non-numeric", () => {
    const { result } = renderHook(() => useMeasurementWizard())
    act(() => {
      result.current.setField("weight", "abc")
      result.current.next()
    })
    expect(result.current.step).toBe(1)
    expect(result.current.errors.weight).toBeDefined()
  })

  it("blocks next() from step 1 when weight is not positive", () => {
    const { result } = renderHook(() => useMeasurementWizard())
    act(() => {
      result.current.setField("weight", "0")
      result.current.next()
    })
    expect(result.current.step).toBe(1)
    expect(result.current.errors.weight).toBeDefined()
  })

  it("advances to step 2 when weight is valid", () => {
    const { result } = renderHook(() => useMeasurementWizard())
    act(() => {
      result.current.setField("weight", "70")
      result.current.next()
    })
    expect(result.current.step).toBe(2)
    expect(result.current.errors.weight).toBeUndefined()
  })

  it("steps 2-4 advance without validation", () => {
    const { result } = renderHook(() => useMeasurementWizard())
    act(() => {
      result.current.setField("weight", "70")
      result.current.next()
    })
    expect(result.current.step).toBe(2)
    act(() => {
      result.current.next()
    })
    expect(result.current.step).toBe(3)
    act(() => {
      result.current.next()
    })
    expect(result.current.step).toBe(4)
    act(() => {
      result.current.next()
    })
    expect(result.current.step).toBe(5)
  })

  it("does not advance past step 5", () => {
    const { result } = renderHook(() => useMeasurementWizard())
    act(() => {
      result.current.setField("weight", "70")
      result.current.next()
      result.current.next()
      result.current.next()
      result.current.next()
      result.current.next()
    })
    expect(result.current.step).toBe(5)
  })

  it("prev() returns to previous step preserving data", () => {
    const { result } = renderHook(() => useMeasurementWizard())
    act(() => {
      result.current.setField("weight", "70")
      result.current.next()
      result.current.setField("skinfolds.chest", "12")
      result.current.next()
    })
    expect(result.current.step).toBe(3)
    act(() => {
      result.current.prev()
    })
    expect(result.current.step).toBe(2)
    expect(result.current.data["skinfolds.chest"]).toBe("12")
    expect(result.current.data.weight).toBe("70")
  })

  it("prev() does not go below step 1", () => {
    const { result } = renderHook(() => useMeasurementWizard())
    act(() => {
      result.current.prev()
    })
    expect(result.current.step).toBe(1)
  })

  it("goTo() jumps to any step that has been reached", () => {
    const { result } = renderHook(() => useMeasurementWizard())
    act(() => {
      result.current.setField("weight", "70")
      result.current.next()
      result.current.next()
      result.current.next()
    })
    expect(result.current.step).toBe(4)
    act(() => {
      result.current.goTo(2)
    })
    expect(result.current.step).toBe(2)
  })

  it("goTo() blocks jumping forward beyond reached steps", () => {
    const { result } = renderHook(() => useMeasurementWizard())
    act(() => {
      result.current.goTo(4)
    })
    expect(result.current.step).toBe(1)
  })

  it("getSavePayload parses string values into numbers", () => {
    const { result } = renderHook(() => useMeasurementWizard())
    act(() => {
      result.current.setField("weight", "70.5")
      result.current.setField("height", "180")
    })
    const payload = result.current.getSavePayload()
    expect(payload.weight).toBe(70.5)
    expect(payload.height).toBe(180)
  })

  it("getSavePayload omits empty optional fields", () => {
    const { result } = renderHook(() => useMeasurementWizard())
    act(() => {
      result.current.setField("weight", "70")
    })
    const payload = result.current.getSavePayload()
    expect(payload.weight).toBe(70)
    expect(payload.height).toBeUndefined()
    expect(payload.skinfolds).toBeUndefined()
    expect(payload.perimeters).toBeUndefined()
    expect(payload.diameters).toBeUndefined()
  })

  it("getSavePayload builds skinfolds sub-object when all 7 fields are filled", () => {
    const { result } = renderHook(() => useMeasurementWizard())
    act(() => {
      result.current.setField("weight", "70")
      result.current.setField("skinfolds.chest", "10")
      result.current.setField("skinfolds.midaxillary", "8")
      result.current.setField("skinfolds.triceps", "12")
      result.current.setField("skinfolds.subscapular", "15")
      result.current.setField("skinfolds.abdominal", "20")
      result.current.setField("skinfolds.suprailiac", "18")
      result.current.setField("skinfolds.thigh", "14")
    })
    const payload = result.current.getSavePayload()
    expect(payload.skinfolds).toEqual({
      chest: 10,
      midaxillary: 8,
      triceps: 12,
      subscapular: 15,
      abdominal: 20,
      suprailiac: 18,
      thigh: 14,
    })
  })

  it("getSavePayload omits skinfolds if any field is missing", () => {
    const { result } = renderHook(() => useMeasurementWizard())
    act(() => {
      result.current.setField("weight", "70")
      result.current.setField("skinfolds.chest", "10")
    })
    const payload = result.current.getSavePayload()
    expect(payload.skinfolds).toBeUndefined()
  })

  it("getSavePayload builds perimeters sub-object with L/R pairs", () => {
    const { result } = renderHook(() => useMeasurementWizard())
    act(() => {
      result.current.setField("weight", "70")
      result.current.setField("perimeters.neck", "38")
      result.current.setField("perimeters.waist", "80")
      result.current.setField("perimeters.hip", "95")
      result.current.setField("perimeters.arm.left", "32")
      result.current.setField("perimeters.arm.right", "33")
      result.current.setField("perimeters.forearm.left", "27")
      result.current.setField("perimeters.forearm.right", "28")
      result.current.setField("perimeters.thigh.left", "55")
      result.current.setField("perimeters.thigh.right", "56")
      result.current.setField("perimeters.calf.left", "37")
      result.current.setField("perimeters.calf.right", "38")
    })
    const payload = result.current.getSavePayload()
    expect(payload.perimeters).toEqual({
      neck: 38,
      waist: 80,
      hip: 95,
      arm: { left: 32, right: 33 },
      forearm: { left: 27, right: 28 },
      thigh: { left: 55, right: 56 },
      calf: { left: 37, right: 38 },
    })
  })

  it("getSavePayload builds diameters sub-object when both fields present", () => {
    const { result } = renderHook(() => useMeasurementWizard())
    act(() => {
      result.current.setField("weight", "70")
      result.current.setField("diameters.humerus", "7.2")
      result.current.setField("diameters.femur", "10.1")
    })
    const payload = result.current.getSavePayload()
    expect(payload.diameters).toEqual({ humerus: 7.2, femur: 10.1 })
  })

  it("getSavePayload includes notes when set", () => {
    const { result } = renderHook(() => useMeasurementWizard())
    act(() => {
      result.current.setField("weight", "70")
      result.current.setField("notes", "Fasted morning")
    })
    const payload = result.current.getSavePayload()
    expect(payload.notes).toBe("Fasted morning")
  })

  it("getSavePayload coerces measuredAt to a Date string when set", () => {
    const { result } = renderHook(() => useMeasurementWizard())
    act(() => {
      result.current.setField("weight", "70")
      result.current.setField("measuredAt", "2026-01-15")
    })
    const payload = result.current.getSavePayload()
    expect(payload.measuredAt).toBe("2026-01-15")
  })

  it("hasData is false when no fields are filled", () => {
    const { result } = renderHook(() => useMeasurementWizard())
    expect(result.current.hasData).toBe(false)
  })

  it("hasData is true once a field has a value", () => {
    const { result } = renderHook(() => useMeasurementWizard())
    act(() => {
      result.current.setField("weight", "70")
    })
    expect(result.current.hasData).toBe(true)
  })

  it("clears weight error after entering a valid value", () => {
    const { result } = renderHook(() => useMeasurementWizard())
    act(() => {
      result.current.next()
    })
    expect(result.current.errors.weight).toBeDefined()
    act(() => {
      result.current.setField("weight", "70")
      result.current.next()
    })
    expect(result.current.errors.weight).toBeUndefined()
    expect(result.current.step).toBe(2)
  })

  describe("edit mode", () => {
    const fullMeasurement = {
      _id: "aaaaaaaaaaaaaaaaaaaaaaaa",
      profileId: "111111111111111111111111",
      measuredAt: new Date("2026-02-10T08:00:00Z").toISOString(),
      notes: "Manhã em jejum",
      weight: 72.4,
      height: 178,
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
      diameters: { humerus: 7.2, femur: 10.1 },
    }

    it("isEditMode is false and editMeasurementId is null by default", () => {
      const { result } = renderHook(() => useMeasurementWizard())
      expect(result.current.isEditMode).toBe(false)
      expect(result.current.editMeasurementId).toBeNull()
    })

    it("initFromMeasurement populates all wizard data fields from a measurement", () => {
      const { result } = renderHook(() => useMeasurementWizard())
      act(() => {
        result.current.initFromMeasurement(fullMeasurement)
      })
      expect(result.current.data.weight).toBe("72.4")
      expect(result.current.data.height).toBe("178")
      expect(result.current.data.notes).toBe("Manhã em jejum")
      expect(result.current.data.measuredAt).toBe("2026-02-10")
      expect(result.current.data["skinfolds.chest"]).toBe("10")
      expect(result.current.data["skinfolds.thigh"]).toBe("14")
      expect(result.current.data["perimeters.neck"]).toBe("38")
      expect(result.current.data["perimeters.abdomen"]).toBe("82")
      expect(result.current.data["perimeters.arm.left"]).toBe("32")
      expect(result.current.data["perimeters.calf.right"]).toBe("38")
      expect(result.current.data["diameters.humerus"]).toBe("7.2")
      expect(result.current.data["diameters.femur"]).toBe("10.1")
    })

    it("initFromMeasurement leaves missing optional sections as empty strings", () => {
      const { result } = renderHook(() => useMeasurementWizard())
      act(() => {
        result.current.initFromMeasurement({
          _id: "aaaaaaaaaaaaaaaaaaaaaaaa",
          profileId: "111111111111111111111111",
          measuredAt: new Date("2026-02-10T08:00:00Z").toISOString(),
          weight: 70,
        })
      })
      expect(result.current.data.weight).toBe("70")
      expect(result.current.data.height).toBe("")
      expect(result.current.data.notes).toBe("")
      expect(result.current.data["skinfolds.chest"]).toBe("")
      expect(result.current.data["perimeters.neck"]).toBe("")
      expect(result.current.data["perimeters.abdomen"]).toBe("")
      expect(result.current.data["diameters.humerus"]).toBe("")
    })

    it("initFromMeasurement sets isEditMode to true and exposes editMeasurementId", () => {
      const { result } = renderHook(() => useMeasurementWizard())
      act(() => {
        result.current.initFromMeasurement(fullMeasurement)
      })
      expect(result.current.isEditMode).toBe(true)
      expect(result.current.editMeasurementId).toBe("aaaaaaaaaaaaaaaaaaaaaaaa")
    })

    it("initFromMeasurement marks all steps as reachable so user can navigate freely", () => {
      const { result } = renderHook(() => useMeasurementWizard())
      act(() => {
        result.current.initFromMeasurement(fullMeasurement)
      })
      act(() => {
        result.current.goTo(5)
      })
      expect(result.current.step).toBe(5)
    })

    it("reset() clears state back to defaults and exits edit mode", () => {
      const { result } = renderHook(() => useMeasurementWizard())
      act(() => {
        result.current.initFromMeasurement(fullMeasurement)
      })
      expect(result.current.isEditMode).toBe(true)
      act(() => {
        result.current.reset()
      })
      expect(result.current.isEditMode).toBe(false)
      expect(result.current.editMeasurementId).toBeNull()
      expect(result.current.data.weight).toBe("")
      expect(result.current.step).toBe(1)
    })
  })
})
