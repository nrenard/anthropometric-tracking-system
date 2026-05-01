import { describe, it, expect, beforeEach, afterAll, vi } from "vitest"
import {
  render,
  screen,
  waitFor,
  cleanup,
  act,
  within,
} from "@testing-library/react"
import { ChakraProvider, defaultSystem } from "@chakra-ui/react"
import { ProfileProvider } from "@/lib/profile-context"
import type { ProfileDTO } from "@/app/actions/profile-actions"

vi.mock("recharts", () => {
  type ChildrenProps = { children?: React.ReactNode }
  type DataProps = { data?: Array<Record<string, unknown>> } & ChildrenProps

  return {
    ResponsiveContainer: ({ children }: ChildrenProps) => (
      <div data-testid="responsive-container">{children}</div>
    ),
    AreaChart: ({ data, children }: DataProps) => (
      <div data-testid="area-chart" data-points={JSON.stringify(data ?? [])}>
        {children}
        {(data ?? []).map((point, i) => (
          <span key={i} data-testid="chart-point">
            {String(point.date)}:{String(point.value)}
          </span>
        ))}
      </div>
    ),
    Area: () => <div data-testid="area" />,
    XAxis: () => <div data-testid="x-axis" />,
    YAxis: () => <div data-testid="y-axis" />,
    CartesianGrid: () => <div data-testid="cartesian-grid" />,
    Tooltip: () => <div data-testid="tooltip" />,
  }
})

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
}))

const PROFILE_ID = "111111111111111111111111"

const sampleProfile = (overrides: Partial<ProfileDTO> = {}): ProfileDTO => ({
  id: PROFILE_ID,
  name: "Jane Doe",
  email: "jane@example.com",
  dateOfBirth: new Date("1990-01-15").toISOString(),
  sex: "F",
  defaultHeight: 170,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
})

vi.mock("@/app/actions/profile-actions", () => {
  const profilesRef = { current: [] as ProfileDTO[] }
  return {
    __setProfiles: (next: ProfileDTO[]) => {
      profilesRef.current = next
    },
    getProfiles: vi.fn(async () => profilesRef.current),
  }
})

const actionsModule = (await import("@/app/actions/profile-actions")) as unknown as {
  __setProfiles: (next: ProfileDTO[]) => void
  getProfiles: ReturnType<typeof vi.fn>
}

import GraficosPage from "./page"

interface JsonResponseInit {
  ok?: boolean
  status?: number
}

function jsonResponse<T>(data: T, init: JsonResponseInit = {}): Response {
  const { ok = true, status = 200 } = init
  return {
    ok,
    status,
    json: async () => data,
  } as unknown as Response
}

function createFetchMock(handler: () => Response) {
  return vi.fn(async () => handler())
}

const METRICS_BY_LABEL: Record<string, string> = {
  Peso: "weight",
  "% Gordura Corporal": "bodyFatPercent",
  "Massa Magra": "leanMass",
  "Massa Gorda": "fatMass",
  IMC: "bmi",
  "Circunferência da Cintura": "waist",
  "Circunferência do Quadril": "hip",
  RCQ: "waistToHip",
  RCE: "waistToHeight",
  TMB: "bmr",
}

const PERIOD_LABELS = ["7 dias", "30 dias", "90 dias", "6 meses", "1 ano", "Tudo"]

function renderPage() {
  return render(
    <ChakraProvider value={defaultSystem}>
      <ProfileProvider>
        <GraficosPage />
      </ProfileProvider>
    </ChakraProvider>,
  )
}

let fetchSpy: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  cleanup()
  fetchSpy?.mockRestore()
  document.cookie
    .split(";")
    .map((c) => c.trim().split("=")[0])
    .filter(Boolean)
    .forEach((name) => {
      document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
    })
  actionsModule.__setProfiles([sampleProfile()])
  document.cookie = `ACTIVE_PROFILE_ID=${PROFILE_ID}; path=/`

  if (!globalThis.fetch) {
    ;(globalThis as Record<string, unknown>).fetch = vi.fn()
  }
  fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(
    createFetchMock(() => jsonResponse([])),
  )
})

afterAll(() => {
  fetchSpy?.mockRestore()
})

function makeMeasurement(date: string, weight: number) {
  return {
    _id: Math.random().toString(36).slice(2),
    profileId: PROFILE_ID,
    measuredAt: new Date(date + "T12:00:00Z").toISOString(),
    weight,
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
    diameters: { humerus: 6.5, femur: 9.2 },
  }
}

describe("GraficosPage - state rendering", () => {
  it("shows 'Selecione um perfil para ver os gráficos' when no active profile", async () => {
    document.cookie = `ACTIVE_PROFILE_ID=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
    actionsModule.__setProfiles([])

    renderPage()

    await waitFor(() => {
      expect(
        screen.getByText("Selecione um perfil para ver os gráficos"),
      ).toBeDefined()
    })
  })

  it("shows loading skeleton when profile is active and data is loading", async () => {
    renderPage()

    await waitFor(() => {
      expect(screen.getByTestId("charts-loading")).toBeDefined()
    })
  })

  it("shows 'Nenhum dado disponível' when no measurements in range", async () => {
    renderPage()

    await waitFor(() => {
      expect(
        screen.getByText("Nenhum dado disponível para o período selecionado"),
      ).toBeDefined()
    })
  })

  it("renders metric selector with all 10 metrics, defaults to Peso", async () => {
    renderPage()

    await waitFor(() => {
      expect(screen.getByRole("combobox", { name: "Métrica" })).toBeDefined()
    })

    const select = screen.getByRole("combobox", { name: "Métrica" })
    const options = within(select).getAllByRole("option") as HTMLOptionElement[]

    const labels = options.map((opt) => opt.textContent ?? "")
    for (const label of Object.keys(METRICS_BY_LABEL)) {
      expect(labels).toContain(label)
    }
    expect(options).toHaveLength(10)

    const selected = options.find((opt) => (opt as HTMLOptionElement).selected)
    expect(selected?.textContent).toBe("Peso")
  })

  it("renders period filter with all 6 options, defaults to Tudo", async () => {
    renderPage()

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "7 dias" })).toBeDefined()
    })

    for (const label of PERIOD_LABELS) {
      expect(screen.getByRole("button", { name: label })).toBeDefined()
    }
  })

  it("changing metric updates the selected metric", async () => {
    renderPage()

    await waitFor(() => {
      expect(screen.getByRole("combobox", { name: "Métrica" })).toBeDefined()
    })

    const select = screen.getByRole("combobox", { name: "Métrica" })
    await act(async () => {
      ;(within(select).getByRole("option", { name: "IMC" }) as HTMLOptionElement).selected = true
      select.dispatchEvent(new Event("change", { bubbles: true }))
      select.dispatchEvent(new Event("input", { bubbles: true }))
    })

    await waitFor(() => {
      const options = within(select).getAllByRole("option") as HTMLOptionElement[]
      const selected = options.find((opt) => opt.selected)
      expect(selected?.textContent).toBe("IMC")
    })
  })

  it("changing period updates the active period chip", async () => {
    renderPage()

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "30 dias" })).toBeDefined()
    })

    const periodButton = screen.getByRole("button", { name: "30 dias" })
    await act(async () => {
      periodButton.click()
    })
  })

  it("renders area chart with data points when measurements exist", async () => {
    const measurements = [
      makeMeasurement("2026-04-01", 70),
      makeMeasurement("2026-04-08", 69.5),
      makeMeasurement("2026-04-15", 69),
    ]

    fetchSpy.mockImplementation(
      createFetchMock(() => jsonResponse(measurements)),
    )

    renderPage()

    await waitFor(() => {
      expect(screen.getByTestId("chart-area")).toBeDefined()
    })

    expect(screen.getByTestId("area-chart")).toBeDefined()
    expect(screen.getByTestId("area")).toBeDefined()
    expect(screen.getAllByTestId("chart-point")).toHaveLength(3)
  })

  it("formats x-axis dates as DD/MM/YY", async () => {
    const measurements = [
      makeMeasurement("2026-04-01", 70),
      makeMeasurement("2026-04-15", 69),
    ]

    fetchSpy.mockImplementation(
      createFetchMock(() => jsonResponse(measurements)),
    )

    renderPage()

    await waitFor(() => {
      expect(screen.getByTestId("chart-area")).toBeDefined()
    })

    const points = screen.getAllByTestId("chart-point").map((node) => node.textContent ?? "")
    expect(points.some((text) => text.startsWith("01/04/26"))).toBe(true)
    expect(points.some((text) => text.startsWith("15/04/26"))).toBe(true)
  })

  it("shows solitary dot without area for single measurement", async () => {
    const measurements = [makeMeasurement("2026-04-01", 70)]

    fetchSpy.mockImplementation(
      createFetchMock(() => jsonResponse(measurements)),
    )

    renderPage()

    await waitFor(() => {
      expect(screen.getByTestId("chart-area")).toBeDefined()
    })

    expect(screen.getAllByTestId("chart-point")).toHaveLength(1)
  })

  it("shows error message when fetch fails", async () => {
    fetchSpy.mockImplementation(
      createFetchMock(() => jsonResponse({}, { ok: false, status: 500 })),
    )

    renderPage()

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeDefined()
    })
  })
})
