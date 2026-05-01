import { describe, it, expect, beforeEach, vi } from "vitest"
import {
  render,
  screen,
  waitFor,
  cleanup,
  act,
  fireEvent,
  within,
} from "@testing-library/react"
import { ChakraProvider, defaultSystem } from "@chakra-ui/react"
import { ProfileProvider } from "@/lib/profile-context"
import type { ProfileDTO } from "@/app/actions/profile-actions"

vi.mock("@/components/ui/toaster", () => ({
  toaster: { create: vi.fn() },
}))

import CompararPage from "./page"

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
    createProfile: vi.fn(),
    deleteProfile: vi.fn(),
    getProfile: vi.fn(async (id: string) =>
      profilesRef.current.find((p) => p.id === id) ?? null,
    ),
  }
})

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
}))

const actionsModule = (await import("@/app/actions/profile-actions")) as unknown as {
  __setProfiles: (next: ProfileDTO[]) => void
}

interface MeasurementResponse {
  _id: string
  profileId: string
  measuredAt: string
  notes?: string
  weight: number
  height?: number
  skinfolds?: {
    chest: number
    midaxillary: number
    triceps: number
    subscapular: number
    abdominal: number
    suprailiac: number
    thigh: number
  }
  perimeters?: {
    waist: number
    hip: number
    arm: { left: number; right: number }
    forearm: { left: number; right: number }
    thigh: { left: number; right: number }
    calf: { left: number; right: number }
  }
  diameters?: { humerus: number; femur: number }
  createdAt: string
  updatedAt: string
}

function fullMeasurement(overrides: Partial<MeasurementResponse> = {}): MeasurementResponse {
  const base: MeasurementResponse = {
    _id: "default",
    profileId: PROFILE_ID,
    measuredAt: "2026-04-15T08:30:00.000Z",
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
    diameters: { humerus: 6.5, femur: 9.2 },
    createdAt: "2026-04-15T08:30:00.000Z",
    updatedAt: "2026-04-15T08:30:00.000Z",
  }
  return { ...base, ...overrides }
}

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

interface FetchHandlerArgs {
  url: string
  init?: RequestInit
}

function createFetchMock(handler: (args: FetchHandlerArgs) => Response | Promise<Response>) {
  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.toString()
    return await handler({ url, init })
  })
}

function renderComparar() {
  return render(
    <ChakraProvider value={defaultSystem}>
      <ProfileProvider>
        <CompararPage />
      </ProfileProvider>
    </ChakraProvider>,
  )
}

beforeEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  document.cookie
    .split(";")
    .map((c) => c.trim().split("=")[0])
    .filter(Boolean)
    .forEach((name) => {
      document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
    })
  actionsModule.__setProfiles([sampleProfile()])
  document.cookie = `ACTIVE_PROFILE_ID=${PROFILE_ID}; path=/`
})

describe("CompararPage", () => {
  it("shows the no-profile message and link when no active profile", async () => {
    document.cookie = `ACTIVE_PROFILE_ID=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
    actionsModule.__setProfiles([])

    renderComparar()

    await waitFor(() => {
      expect(screen.getByText(/Selecione um perfil para comparar medições/i)).toBeDefined()
    })
    const link = screen.getByRole("link", { name: /Gerenciar perfis/i }) as HTMLAnchorElement
    expect(link.getAttribute("href")).toBe("/configuracoes")
  })

  it("shows the <2 measurements message with a CTA to /medir", async () => {
    const measurements = [fullMeasurement({ _id: "m1" })]
    const fetchMock = createFetchMock(({ url }) => {
      if (url.startsWith("/api/measurements")) return jsonResponse(measurements)
      return jsonResponse({})
    })
    vi.stubGlobal("fetch", fetchMock)

    renderComparar()

    await waitFor(() => {
      expect(
        screen.getByText(/Registre pelo menos duas medições para comparar/i),
      ).toBeDefined()
    })
    const link = screen.getByRole("link", { name: /Adicionar Medição/i }) as HTMLAnchorElement
    expect(link.getAttribute("href")).toBe("/medir")
  })

  it("renders an error message with a retry button when fetch fails", async () => {
    let attempt = 0
    const fetchMock = createFetchMock(({ url }) => {
      if (url.startsWith("/api/measurements")) {
        attempt += 1
        if (attempt === 1) {
          return jsonResponse({ error: "boom" }, { ok: false, status: 500 })
        }
        return jsonResponse([
          fullMeasurement({ _id: "m1", measuredAt: "2026-04-15T08:30:00.000Z" }),
          fullMeasurement({ _id: "m2", measuredAt: "2026-04-01T07:15:00.000Z" }),
        ])
      }
      return jsonResponse({})
    })
    vi.stubGlobal("fetch", fetchMock)

    renderComparar()

    await waitFor(() => {
      const alert = screen.getByRole("alert")
      expect(alert.textContent).toMatch(/Falha ao carregar medições/i)
    })
    const retry = screen.getByRole("button", { name: /Tentar novamente/i })
    await act(async () => {
      retry.click()
    })

    await waitFor(() => {
      expect(screen.queryByRole("alert")).toBeNull()
    })
  })

  it("auto-selects the latest two measurements as A and B by default", async () => {
    const measurements = [
      fullMeasurement({
        _id: "m1",
        measuredAt: "2026-04-15T08:30:00.000Z",
        weight: 70,
      }),
      fullMeasurement({
        _id: "m2",
        measuredAt: "2026-04-01T07:15:00.000Z",
        weight: 71.5,
      }),
      fullMeasurement({
        _id: "m3",
        measuredAt: "2026-03-01T07:15:00.000Z",
        weight: 73.0,
      }),
    ]
    const fetchMock = createFetchMock(({ url }) => {
      if (url.startsWith("/api/measurements")) return jsonResponse(measurements)
      return jsonResponse({})
    })
    vi.stubGlobal("fetch", fetchMock)

    renderComparar()

    await waitFor(() => {
      expect(screen.getByLabelText(/Medição A/i)).toBeDefined()
    })

    const pickerA = screen.getByLabelText(/Medição A/i) as HTMLSelectElement
    const pickerB = screen.getByLabelText(/Medição B/i) as HTMLSelectElement
    expect(pickerA.value).toBe("m1")
    expect(pickerB.value).toBe("m2")
  })

  it("renders Portuguese group headings and Δ columns", async () => {
    const measurements = [
      fullMeasurement({ _id: "m1", measuredAt: "2026-04-15T08:30:00.000Z", weight: 70 }),
      fullMeasurement({ _id: "m2", measuredAt: "2026-04-01T07:15:00.000Z", weight: 71.5 }),
    ]
    const fetchMock = createFetchMock(({ url }) => {
      if (url.startsWith("/api/measurements")) return jsonResponse(measurements)
      return jsonResponse({})
    })
    vi.stubGlobal("fetch", fetchMock)

    renderComparar()

    await waitFor(() => {
      expect(screen.getByText("Básico")).toBeDefined()
    })
    expect(screen.getByText("Dobras Cutâneas")).toBeDefined()
    expect(screen.getByText("Perímetros")).toBeDefined()
    expect(screen.getByText("Diâmetros")).toBeDefined()
    expect(screen.getByText("Métricas Calculadas")).toBeDefined()

    expect(screen.getAllByText("Campo").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Δ Absoluto").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Δ %").length).toBeGreaterThan(0)
    // Pickers expose A/B labels
    expect(screen.getByLabelText(/Medição A/i)).toBeDefined()
    expect(screen.getByLabelText(/Medição B/i)).toBeDefined()
  })

  it("renders Portuguese row labels for raw fields and computed metrics", async () => {
    const measurements = [
      fullMeasurement({ _id: "m1", measuredAt: "2026-04-15T08:30:00.000Z", weight: 70 }),
      fullMeasurement({ _id: "m2", measuredAt: "2026-04-01T07:15:00.000Z", weight: 71.5 }),
    ]
    const fetchMock = createFetchMock(({ url }) => {
      if (url.startsWith("/api/measurements")) return jsonResponse(measurements)
      return jsonResponse({})
    })
    vi.stubGlobal("fetch", fetchMock)

    renderComparar()

    await waitFor(() => {
      expect(screen.getByText("Peso")).toBeDefined()
    })
    expect(screen.getByText("Altura")).toBeDefined()
    expect(screen.getByText("IMC")).toBeDefined()
    expect(screen.getByText("Densidade Corporal")).toBeDefined()
    expect(screen.getByText("% Gordura")).toBeDefined()
    expect(screen.getByText("Massa Gorda")).toBeDefined()
    expect(screen.getByText("Massa Magra")).toBeDefined()
    expect(screen.getByText("Massa Óssea")).toBeDefined()
    expect(screen.getByText("Massa Muscular")).toBeDefined()
    expect(screen.getByText("RCQ")).toBeDefined()
    expect(screen.getByText("RCE")).toBeDefined()
    expect(screen.getByText("TMB")).toBeDefined()
  })

  it("renders absolute and percentage deltas for weight (B - A and (B-A)/A * 100)", async () => {
    const measurements = [
      fullMeasurement({ _id: "m1", measuredAt: "2026-04-15T08:30:00.000Z", weight: 70 }),
      fullMeasurement({ _id: "m2", measuredAt: "2026-04-01T07:15:00.000Z", weight: 80 }),
    ]
    const fetchMock = createFetchMock(({ url }) => {
      if (url.startsWith("/api/measurements")) return jsonResponse(measurements)
      return jsonResponse({})
    })
    vi.stubGlobal("fetch", fetchMock)

    renderComparar()

    await waitFor(() => {
      expect(screen.getByTestId("compare-row-weight")).toBeDefined()
    })

    const row = screen.getByTestId("compare-row-weight")
    // A = 70, B = 80, abs = 10, pct = (10/70)*100 ≈ 14.29
    expect(row.textContent).toMatch(/70/)
    expect(row.textContent).toMatch(/80/)
    expect(row.textContent).toMatch(/10/)
    expect(row.textContent).toMatch(/14[.,]\d/)
  })

  it("colors the weight delta red when weight increases (worsen)", async () => {
    const measurements = [
      fullMeasurement({ _id: "m1", measuredAt: "2026-04-15T08:30:00.000Z", weight: 70 }),
      fullMeasurement({ _id: "m2", measuredAt: "2026-04-01T07:15:00.000Z", weight: 80 }),
    ]
    const fetchMock = createFetchMock(({ url }) => {
      if (url.startsWith("/api/measurements")) return jsonResponse(measurements)
      return jsonResponse({})
    })
    vi.stubGlobal("fetch", fetchMock)

    renderComparar()

    await waitFor(() => {
      expect(screen.getByTestId("compare-row-weight")).toBeDefined()
    })
    const row = screen.getByTestId("compare-row-weight")
    const absCell = within(row).getByTestId("compare-delta-abs-weight")
    expect(absCell.getAttribute("data-direction")).toBe("worsen")
  })

  it("colors the weight delta green when weight decreases (improve)", async () => {
    const measurements = [
      fullMeasurement({ _id: "m1", measuredAt: "2026-04-15T08:30:00.000Z", weight: 70 }),
      fullMeasurement({ _id: "m2", measuredAt: "2026-04-01T07:15:00.000Z", weight: 60 }),
    ]
    const fetchMock = createFetchMock(({ url }) => {
      if (url.startsWith("/api/measurements")) return jsonResponse(measurements)
      return jsonResponse({})
    })
    vi.stubGlobal("fetch", fetchMock)

    renderComparar()

    await waitFor(() => {
      expect(screen.getByTestId("compare-row-weight")).toBeDefined()
    })
    const row = screen.getByTestId("compare-row-weight")
    // A = 70 (latest), B = 60 (older), B - A = -10 → improve
    const absCell = within(row).getByTestId("compare-delta-abs-weight")
    expect(absCell.getAttribute("data-direction")).toBe("improve")
  })

  it("shows em dash for delta when one value is missing (e.g. height absent)", async () => {
    const measurements = [
      fullMeasurement({
        _id: "m1",
        measuredAt: "2026-04-15T08:30:00.000Z",
        height: undefined,
      }),
      fullMeasurement({
        _id: "m2",
        measuredAt: "2026-04-01T07:15:00.000Z",
        height: 170,
      }),
    ]
    const fetchMock = createFetchMock(({ url }) => {
      if (url.startsWith("/api/measurements")) return jsonResponse(measurements)
      return jsonResponse({})
    })
    vi.stubGlobal("fetch", fetchMock)

    renderComparar()

    await waitFor(() => {
      expect(screen.getByTestId("compare-row-height")).toBeDefined()
    })

    const row = screen.getByTestId("compare-row-height")
    const absCell = within(row).getByTestId("compare-delta-abs-height")
    const pctCell = within(row).getByTestId("compare-delta-pct-height")
    expect(absCell.textContent).toContain("—")
    expect(pctCell.textContent).toContain("—")
  })

  it("changing picker B updates the comparison table", async () => {
    const measurements = [
      fullMeasurement({ _id: "m1", measuredAt: "2026-04-15T08:30:00.000Z", weight: 70 }),
      fullMeasurement({ _id: "m2", measuredAt: "2026-04-01T07:15:00.000Z", weight: 80 }),
      fullMeasurement({ _id: "m3", measuredAt: "2026-03-01T07:15:00.000Z", weight: 90 }),
    ]
    const fetchMock = createFetchMock(({ url }) => {
      if (url.startsWith("/api/measurements")) return jsonResponse(measurements)
      return jsonResponse({})
    })
    vi.stubGlobal("fetch", fetchMock)

    renderComparar()

    await waitFor(() => {
      expect(screen.getByTestId("compare-row-weight")).toBeDefined()
    })

    const pickerB = screen.getByLabelText(/Medição B/i) as HTMLSelectElement
    await act(async () => {
      fireEvent.change(pickerB, { target: { value: "m3" } })
    })

    await waitFor(() => {
      const row = screen.getByTestId("compare-row-weight")
      // A = 70, B = 90, abs = 20
      expect(row.textContent).toMatch(/90/)
      expect(row.textContent).toMatch(/20/)
    })
  })

  it("shows em dash for all computed metrics when a measurement lacks skinfolds", async () => {
    const partial: MeasurementResponse = {
      _id: "m1",
      profileId: PROFILE_ID,
      measuredAt: "2026-04-15T08:30:00.000Z",
      weight: 70,
      height: 170,
      createdAt: "2026-04-15T08:30:00.000Z",
      updatedAt: "2026-04-15T08:30:00.000Z",
    }
    const measurements = [
      partial,
      fullMeasurement({ _id: "m2", measuredAt: "2026-04-01T07:15:00.000Z" }),
    ]
    const fetchMock = createFetchMock(({ url }) => {
      if (url.startsWith("/api/measurements")) return jsonResponse(measurements)
      return jsonResponse({})
    })
    vi.stubGlobal("fetch", fetchMock)

    renderComparar()

    await waitFor(() => {
      expect(screen.getByTestId("compare-row-bodyFatPercent")).toBeDefined()
    })

    const row = screen.getByTestId("compare-row-bodyFatPercent")
    const absCell = within(row).getByTestId("compare-delta-abs-bodyFatPercent")
    expect(absCell.textContent).toContain("—")
  })
})
