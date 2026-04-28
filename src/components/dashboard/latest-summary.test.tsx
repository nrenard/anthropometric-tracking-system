import { describe, it, expect, beforeEach } from "vitest"
import { render, screen, cleanup } from "@testing-library/react"
import { ChakraProvider, defaultSystem } from "@chakra-ui/react"
import { LatestMeasurementSummary } from "./latest-summary"
import type { MeasurementInput, ProfileInput } from "@/lib/calculations"

const profile: ProfileInput = {
  name: "João",
  email: "joao@example.com",
  dateOfBirth: new Date("1990-01-15"),
  sex: "M",
  defaultHeight: 175,
}

function buildMeasurement(
  overrides: Partial<MeasurementInput> & { _id?: string; id?: string; notes?: string } = {},
): MeasurementInput & { _id?: string; id?: string; notes?: string } {
  return {
    measuredAt: new Date("2026-04-01T12:00:00Z"),
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
    _id: "abc123",
    ...overrides,
  }
}

function renderSummary(
  measurement?: (MeasurementInput & { _id?: string; id?: string; notes?: string }) | undefined,
  profileOverride?: ProfileInput,
) {
  return render(
    <ChakraProvider value={defaultSystem}>
      <LatestMeasurementSummary
        profile={profileOverride ?? profile}
        measurement={measurement}
      />
    </ChakraProvider>,
  )
}

beforeEach(() => cleanup())

describe("LatestMeasurementSummary", () => {
  it("renders greeting with profile name", () => {
    renderSummary(buildMeasurement())

    expect(screen.getByText("Olá, João")).toBeDefined()
  })

  it("renders the measurement date in DD/MM/YYYY format", () => {
    renderSummary(buildMeasurement({ measuredAt: new Date("2026-04-01T12:00:00Z") }))

    const expected = new Date("2026-04-01T12:00:00Z").toLocaleDateString("pt-BR")
    expect(screen.getByText(new RegExp(expected))).toBeDefined()
  })

  it("renders weight with kg unit", () => {
    renderSummary(buildMeasurement({ weight: 70 }))

    expect(screen.getByText(/70\.0\s*kg/)).toBeDefined()
  })

  it("renders body fat percent with % unit", () => {
    renderSummary(buildMeasurement())

    expect(screen.getByTestId("latest-bodyfat").textContent).toMatch(/\d+\.\d+\s*%/)
  })

  it("renders notes truncated to 80 characters with ellipsis", () => {
    const longNotes = "a".repeat(120)
    renderSummary(buildMeasurement({ notes: longNotes }))

    const truncated = "a".repeat(80) + "…"
    expect(screen.getByText(truncated)).toBeDefined()
  })

  it("renders notes as-is when 80 characters or fewer", () => {
    const shortNotes = "Treino pesado"
    renderSummary(buildMeasurement({ notes: shortNotes }))

    expect(screen.getByText(shortNotes)).toBeDefined()
  })

  it('"Ver detalhes" link points to /historico/[measurement._id]', () => {
    renderSummary(buildMeasurement({ _id: "meas-42" }))

    const link = screen.getByRole("link", { name: /Ver detalhes/i })
    expect(link.getAttribute("href")).toBe("/historico/meas-42")
  })

  it('"Ver detalhes" link falls back to id when _id is absent', () => {
    const measurement = buildMeasurement()
    delete measurement._id
    measurement.id = "fallback-id"
    renderSummary(measurement)

    const link = screen.getByRole("link", { name: /Ver detalhes/i })
    expect(link.getAttribute("href")).toBe("/historico/fallback-id")
  })

  it("renders empty state when measurement is undefined", () => {
    renderSummary(undefined)

    expect(screen.getByText("Nenhuma medição")).toBeDefined()
    expect(screen.queryByRole("link", { name: /Ver detalhes/i })).toBeNull()
  })

  it("still renders greeting when measurement is undefined", () => {
    renderSummary(undefined)

    expect(screen.getByText("Olá, João")).toBeDefined()
  })
})
