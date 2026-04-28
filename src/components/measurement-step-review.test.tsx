import { describe, it, expect, beforeEach } from "vitest"
import { render, screen, cleanup } from "@testing-library/react"
import { ChakraProvider, defaultSystem } from "@chakra-ui/react"
import { MeasurementStepReview } from "./measurement-step-review"
import type { WizardSavePayload } from "@/hooks/use-measurement-wizard"

beforeEach(() => cleanup())

function renderReview(payload: WizardSavePayload) {
  return render(
    <ChakraProvider value={defaultSystem}>
      <MeasurementStepReview payload={payload} />
    </ChakraProvider>,
  )
}

describe("MeasurementStepReview", () => {
  it("renders weight with kg unit", () => {
    renderReview({ weight: 70 })
    expect(screen.getByText(/70/)).toBeDefined()
    expect(screen.getByText(/kg/i)).toBeDefined()
  })

  it("renders height with cm unit when present", () => {
    renderReview({ weight: 70, height: 175 })
    expect(screen.getByText(/175/)).toBeDefined()
  })

  it("formats measuredAt as DD/MM/YYYY when present", () => {
    renderReview({ weight: 70, measuredAt: "2026-01-15" })
    expect(screen.getByText(/15\/01\/2026/)).toBeDefined()
  })

  it("renders Skinfolds section when skinfolds are filled", () => {
    renderReview({
      weight: 70,
      skinfolds: {
        chest: 10,
        midaxillary: 8,
        triceps: 12,
        subscapular: 15,
        abdominal: 20,
        suprailiac: 18,
        thigh: 14,
      },
    })
    expect(screen.getByText(/Dobras/i)).toBeDefined()
    expect(screen.getByText(/Peitoral/i)).toBeDefined()
  })

  it("hides Skinfolds section when no skinfolds were entered", () => {
    renderReview({ weight: 70 })
    expect(screen.queryByText(/Peitoral/i)).toBeNull()
  })

  it("renders empty-state for sections with no data", () => {
    renderReview({ weight: 70 })
    expect(screen.getAllByText(/Nenhum valor informado/i).length).toBeGreaterThan(0)
  })

  it("renders perimeters with L/R sub-objects", () => {
    renderReview({
      weight: 70,
      perimeters: {
        neck: 38,
        waist: 80,
        hip: 95,
        arm: { left: 32, right: 33 },
        forearm: { left: 27, right: 28 },
        thigh: { left: 55, right: 56 },
        calf: { left: 37, right: 38 },
      },
    })
    expect(screen.getByText(/Perímetros/i)).toBeDefined()
    expect(screen.getByText(/Pescoço/i)).toBeDefined()
    expect(screen.getByText(/^Braço/i)).toBeDefined()
    expect(screen.getByText(/32 \/ 33 cm/)).toBeDefined()
  })

  it("renders diameters with cm unit", () => {
    renderReview({ weight: 70, diameters: { humerus: 7.2, femur: 10.1 } })
    expect(screen.getByText(/Úmero/i)).toBeDefined()
    expect(screen.getByText(/Fêmur/i)).toBeDefined()
  })

  it("renders notes when present", () => {
    renderReview({ weight: 70, notes: "Fasted morning" })
    expect(screen.getByText(/Fasted morning/)).toBeDefined()
  })
})
