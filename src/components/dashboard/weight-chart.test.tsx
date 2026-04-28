import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen, cleanup, act } from "@testing-library/react"
import { ChakraProvider, defaultSystem } from "@chakra-ui/react"
import { WeightChart } from "./weight-chart"
import type { MeasurementInput } from "@/lib/calculations"

const mockPush = vi.fn()

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}))

vi.mock("recharts", () => {
  type ChildrenProps = { children?: React.ReactNode }
  type DataProps = { data?: Array<Record<string, unknown>> } & ChildrenProps

  return {
    ResponsiveContainer: ({ children }: ChildrenProps) => (
      <div data-testid="responsive-container">{children}</div>
    ),
    LineChart: ({ data, children }: DataProps) => (
      <div data-testid="line-chart" data-points={JSON.stringify(data ?? [])}>
        {children}
        {(data ?? []).map((point) => (
          <span key={String(point.date)} data-testid="chart-point">
            {String(point.date)}:{String(point.weight)}
          </span>
        ))}
      </div>
    ),
    Line: () => <div data-testid="line" />,
    XAxis: () => <div data-testid="x-axis" />,
    YAxis: () => <div data-testid="y-axis" />,
    CartesianGrid: () => <div data-testid="cartesian-grid" />,
    Tooltip: () => <div data-testid="tooltip" />,
  }
})

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

function renderChart(measurements: MeasurementInput[]) {
  return render(
    <ChakraProvider value={defaultSystem}>
      <WeightChart measurements={measurements} />
    </ChakraProvider>,
  )
}

beforeEach(() => {
  cleanup()
  mockPush.mockClear()
})

describe("WeightChart", () => {
  it("renders chart structure with points when measurements are provided", () => {
    renderChart([
      buildMeasurement({ measuredAt: new Date(2026, 3, 1), weight: 70 }),
      buildMeasurement({ measuredAt: new Date(2026, 3, 8), weight: 69.5 }),
      buildMeasurement({ measuredAt: new Date(2026, 3, 15), weight: 69 }),
    ])

    expect(screen.getByTestId("line-chart")).toBeDefined()
    expect(screen.getByTestId("line")).toBeDefined()
    expect(screen.getAllByTestId("chart-point")).toHaveLength(3)
  })

  it("formats x-axis dates as DD/MM", () => {
    renderChart([
      buildMeasurement({ measuredAt: new Date(2026, 3, 1), weight: 70 }),
      buildMeasurement({ measuredAt: new Date(2026, 3, 15), weight: 69 }),
    ])

    const points = screen.getAllByTestId("chart-point").map((node) => node.textContent ?? "")
    expect(points.some((text) => text.startsWith("01/04"))).toBe(true)
    expect(points.some((text) => text.startsWith("15/04"))).toBe(true)
  })

  it("sorts measurements ascending by measuredAt before rendering", () => {
    renderChart([
      buildMeasurement({ measuredAt: new Date(2026, 3, 15), weight: 69 }),
      buildMeasurement({ measuredAt: new Date(2026, 3, 1), weight: 70 }),
      buildMeasurement({ measuredAt: new Date(2026, 3, 8), weight: 69.5 }),
    ])

    const chart = screen.getByTestId("line-chart")
    const data = JSON.parse(chart.getAttribute("data-points") ?? "[]") as Array<{
      date: string
      weight: number
    }>
    expect(data.map((point) => point.date)).toEqual(["01/04", "08/04", "15/04"])
    expect(data.map((point) => point.weight)).toEqual([70, 69.5, 69])
  })

  it("navigates to /graficos when the chart container is clicked", () => {
    renderChart([
      buildMeasurement({ measuredAt: new Date(2026, 3, 1), weight: 70 }),
      buildMeasurement({ measuredAt: new Date(2026, 3, 8), weight: 69 }),
    ])

    const container = screen.getByTestId("weight-chart-container")
    act(() => {
      container.click()
    })

    expect(mockPush).toHaveBeenCalledWith("/graficos")
  })

  it("renders empty state text when measurements array is empty", () => {
    renderChart([])

    expect(screen.getByText("Sem dados de peso")).toBeDefined()
    expect(screen.queryByTestId("line-chart")).toBeNull()
  })
})
