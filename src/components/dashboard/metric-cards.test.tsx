import { describe, it, expect, beforeEach } from "vitest"
import { render, screen, cleanup, within } from "@testing-library/react"
import { ChakraProvider, defaultSystem } from "@chakra-ui/react"
import { MetricCards } from "./metric-cards"
import type { MeasurementInput, ProfileInput } from "@/lib/calculations"

const profile: ProfileInput = {
  name: "Jane Doe",
  email: "jane@example.com",
  dateOfBirth: new Date("1990-01-15"),
  sex: "F",
  defaultHeight: 170,
}

function buildMeasurement(overrides: Partial<MeasurementInput> = {}): MeasurementInput {
  return {
    measuredAt: new Date("2026-04-01"),
    weight: 70,
    height: 170,
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
      waist: 75,
      hip: 95,
      arm: { left: 28, right: 28 },
      forearm: { left: 24, right: 24 },
      thigh: { left: 55, right: 55 },
      calf: { left: 36, right: 36 },
    },
    diameters: {
      humerus: 6.5,
      femur: 9.2,
    },
    ...overrides,
  }
}

function renderCards(measurements: MeasurementInput[]) {
  return render(
    <ChakraProvider value={defaultSystem}>
      <MetricCards profile={profile} measurements={measurements} />
    </ChakraProvider>,
  )
}

beforeEach(() => cleanup())

describe("MetricCards", () => {
  it("renders four cards with Portuguese labels", () => {
    renderCards([buildMeasurement()])

    expect(screen.getByTestId("metric-card-weight")).toBeDefined()
    expect(screen.getByTestId("metric-card-bodyfat")).toBeDefined()
    expect(screen.getByTestId("metric-card-leanmass")).toBeDefined()
    expect(screen.getByTestId("metric-card-bmi")).toBeDefined()

    expect(screen.getByText("Peso")).toBeDefined()
    expect(screen.getByText("% Gordura")).toBeDefined()
    expect(screen.getByText("Massa Magra")).toBeDefined()
    expect(screen.getByText("IMC")).toBeDefined()
  })

  it("shows current values with correct units", () => {
    renderCards([buildMeasurement({ weight: 70, height: 170 })])

    const weightCard = screen.getByTestId("metric-card-weight")
    expect(within(weightCard).getByTestId("metric-value").textContent).toContain("70.0 kg")

    const bmiCard = screen.getByTestId("metric-card-bmi")
    expect(within(bmiCard).getByTestId("metric-value").textContent).toMatch(/^\d+\.\d+$/)

    const bfCard = screen.getByTestId("metric-card-bodyfat")
    expect(within(bfCard).getByTestId("metric-value").textContent).toContain("%")

    const leanCard = screen.getByTestId("metric-card-leanmass")
    expect(within(leanCard).getByTestId("metric-value").textContent).toContain("kg")
  })

  it("renders em dash for both deltas when only one measurement exists", () => {
    renderCards([buildMeasurement()])

    const weightCard = screen.getByTestId("metric-card-weight")
    expect(within(weightCard).getByTestId("delta-previous").textContent).toContain("—")
    expect(within(weightCard).getByTestId("delta-thirty-days").textContent).toContain("—")
  })

  it("renders em dash everywhere when measurements array is empty", () => {
    renderCards([])

    expect(screen.getByTestId("metric-card-weight")).toBeDefined()
    const weightCard = screen.getByTestId("metric-card-weight")
    expect(within(weightCard).getByTestId("metric-value").textContent).toContain("—")
    expect(within(weightCard).getByTestId("delta-previous").textContent).toContain("—")
    expect(within(weightCard).getByTestId("delta-thirty-days").textContent).toContain("—")
  })

  it("computes delta vs previous measurement when two measurements exist", () => {
    const previous = buildMeasurement({
      measuredAt: new Date("2026-03-25"),
      weight: 72,
    })
    const current = buildMeasurement({
      measuredAt: new Date("2026-04-01"),
      weight: 70,
    })

    renderCards([previous, current])

    const weightCard = screen.getByTestId("metric-card-weight")
    const deltaText = within(weightCard).getByTestId("delta-previous").textContent ?? ""
    expect(deltaText).toMatch(/2\.0\s*kg/)
    expect(deltaText).toMatch(/[-−]/)
  })

  it("uses green color for weight loss (improvement)", () => {
    const previous = buildMeasurement({
      measuredAt: new Date("2026-03-25"),
      weight: 72,
    })
    const current = buildMeasurement({
      measuredAt: new Date("2026-04-01"),
      weight: 70,
    })

    renderCards([previous, current])

    const weightCard = screen.getByTestId("metric-card-weight")
    const delta = within(weightCard).getByTestId("delta-previous")
    expect(delta.getAttribute("data-direction")).toBe("improvement")
  })

  it("uses red color for weight gain (regression)", () => {
    const previous = buildMeasurement({
      measuredAt: new Date("2026-03-25"),
      weight: 68,
    })
    const current = buildMeasurement({
      measuredAt: new Date("2026-04-01"),
      weight: 70,
    })

    renderCards([previous, current])

    const weightCard = screen.getByTestId("metric-card-weight")
    const delta = within(weightCard).getByTestId("delta-previous")
    expect(delta.getAttribute("data-direction")).toBe("regression")
  })

  it("uses neutral direction when delta is zero", () => {
    const previous = buildMeasurement({
      measuredAt: new Date("2026-03-25"),
      weight: 70,
    })
    const current = buildMeasurement({
      measuredAt: new Date("2026-04-01"),
      weight: 70,
    })

    renderCards([previous, current])

    const weightCard = screen.getByTestId("metric-card-weight")
    const delta = within(weightCard).getByTestId("delta-previous")
    expect(delta.getAttribute("data-direction")).toBe("neutral")
  })

  it("treats lean mass increase as improvement", () => {
    const previous = buildMeasurement({
      measuredAt: new Date("2026-03-25"),
      weight: 70,
      skinfolds: {
        chest: 20,
        midaxillary: 18,
        triceps: 22,
        subscapular: 25,
        abdominal: 30,
        suprailiac: 28,
        thigh: 24,
      },
    })
    const current = buildMeasurement({
      measuredAt: new Date("2026-04-01"),
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

    renderCards([previous, current])

    const leanCard = screen.getByTestId("metric-card-leanmass")
    const delta = within(leanCard).getByTestId("delta-previous")
    expect(delta.getAttribute("data-direction")).toBe("improvement")
  })

  it("finds 30-day reference within tolerance and computes delta", () => {
    const thirtyDay = buildMeasurement({
      measuredAt: new Date("2026-03-02"),
      weight: 75,
    })
    const previous = buildMeasurement({
      measuredAt: new Date("2026-03-25"),
      weight: 72,
    })
    const current = buildMeasurement({
      measuredAt: new Date("2026-04-01"),
      weight: 70,
    })

    renderCards([thirtyDay, previous, current])

    const weightCard = screen.getByTestId("metric-card-weight")
    const deltaText = within(weightCard).getByTestId("delta-thirty-days").textContent ?? ""
    expect(deltaText).toMatch(/5\.0\s*kg/)
    expect(deltaText).toMatch(/[-−]/)
  })

  it("renders em dash for 30-day delta when no measurement is within tolerance", () => {
    const tooOld = buildMeasurement({
      measuredAt: new Date("2026-01-01"),
      weight: 80,
    })
    const current = buildMeasurement({
      measuredAt: new Date("2026-04-01"),
      weight: 70,
    })

    renderCards([tooOld, current])

    const weightCard = screen.getByTestId("metric-card-weight")
    expect(within(weightCard).getByTestId("delta-thirty-days").textContent).toContain("—")
  })

  it("sorts measurements by measuredAt descending internally", () => {
    const a = buildMeasurement({
      measuredAt: new Date("2026-04-01"),
      weight: 70,
    })
    const b = buildMeasurement({
      measuredAt: new Date("2026-03-25"),
      weight: 72,
    })

    renderCards([a, b])

    const weightCard = screen.getByTestId("metric-card-weight")
    expect(within(weightCard).getByTestId("metric-value").textContent).toContain("70.0 kg")
  })

  it("formats body fat delta in percentage points (pp)", () => {
    const previous = buildMeasurement({
      measuredAt: new Date("2026-03-25"),
      skinfolds: {
        chest: 20,
        midaxillary: 18,
        triceps: 22,
        subscapular: 25,
        abdominal: 30,
        suprailiac: 28,
        thigh: 24,
      },
    })
    const current = buildMeasurement({
      measuredAt: new Date("2026-04-01"),
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

    renderCards([previous, current])

    const bfCard = screen.getByTestId("metric-card-bodyfat")
    expect(within(bfCard).getByTestId("delta-previous").textContent).toContain("pp")
  })

  it("formats BMI delta without unit", () => {
    const previous = buildMeasurement({
      measuredAt: new Date("2026-03-25"),
      weight: 75,
    })
    const current = buildMeasurement({
      measuredAt: new Date("2026-04-01"),
      weight: 70,
    })

    renderCards([previous, current])

    const bmiCard = screen.getByTestId("metric-card-bmi")
    const text = within(bmiCard).getByTestId("delta-previous").textContent ?? ""
    expect(text).not.toContain("kg")
    expect(text).not.toContain("pp")
    expect(text).toMatch(/\d+\.\d+/)
  })
})
