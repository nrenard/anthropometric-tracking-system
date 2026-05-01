import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen, waitFor, cleanup, act, fireEvent } from "@testing-library/react"
import { ChakraProvider, defaultSystem } from "@chakra-ui/react"
import { ProfileProvider } from "@/lib/profile-context"
import type { ProfileDTO } from "@/app/actions/profile-actions"

const { toastCreateMock, pushMock, paramsRef } = vi.hoisted(() => ({
  toastCreateMock: vi.fn(),
  pushMock: vi.fn(),
  paramsRef: { current: { id: "" } as { id: string } },
}))

vi.mock("@/components/ui/toaster", () => ({
  toaster: { create: toastCreateMock },
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, replace: vi.fn(), back: vi.fn() }),
  useParams: () => paramsRef.current,
}))

import MeasurementDetailPage from "./page"

const PROFILE_ID = "111111111111111111111111"
const MEASUREMENT_ID = "aaaaaaaaaaaaaaaaaaaaaaaa"

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

const actionsModule = (await import("@/app/actions/profile-actions")) as unknown as {
  __setProfiles: (next: ProfileDTO[]) => void
}

interface ProfileResponse {
  _id: string
  name: string
  email: string
  dateOfBirth: string
  sex: "M" | "F"
  defaultHeight: number
  createdAt: string
  updatedAt: string
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

const profileResponse: ProfileResponse = {
  _id: PROFILE_ID,
  name: "Jane Doe",
  email: "jane@example.com",
  dateOfBirth: "1990-01-15T00:00:00.000Z",
  sex: "F",
  defaultHeight: 170,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
}

function fullMeasurement(overrides: Partial<MeasurementResponse> = {}): MeasurementResponse {
  const base: MeasurementResponse = {
    _id: MEASUREMENT_ID,
    profileId: PROFILE_ID,
    measuredAt: "2026-04-15T08:30:00.000Z",
    notes: "Manhã em jejum",
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

function renderDetail() {
  return render(
    <ChakraProvider value={defaultSystem}>
      <ProfileProvider>
        <MeasurementDetailPage />
      </ProfileProvider>
    </ChakraProvider>,
  )
}

beforeEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  toastCreateMock.mockReset()
  pushMock.mockReset()
  paramsRef.current = { id: MEASUREMENT_ID }
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

function setupFullFetch(measurement: MeasurementResponse = fullMeasurement()) {
  const fetchMock = createFetchMock(({ url, init }) => {
    if (url.startsWith("/api/profiles/")) return jsonResponse(profileResponse)
    if (url.startsWith(`/api/measurements/${measurement._id}`) && (!init || init.method === undefined || init.method === "GET")) {
      return jsonResponse(measurement)
    }
    if (url.startsWith("/api/measurements/") && init?.method === "DELETE") {
      return { ok: true, status: 204, json: async () => ({}) } as unknown as Response
    }
    return jsonResponse({})
  })
  vi.stubGlobal("fetch", fetchMock)
  return fetchMock
}

describe("MeasurementDetailPage", () => {
  it("shows the no-profile message when no active profile", async () => {
    document.cookie = `ACTIVE_PROFILE_ID=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
    actionsModule.__setProfiles([])

    renderDetail()

    await waitFor(() => {
      expect(screen.getByText(/Selecione um perfil para ver o histórico/i)).toBeDefined()
    })
  })

  it("renders skeleton placeholders while data is loading", async () => {
    let resolveMeasurement: ((value: Response) => void) | undefined
    const measurementPromise = new Promise<Response>((resolve) => {
      resolveMeasurement = resolve
    })
    const fetchMock = createFetchMock(({ url }) => {
      if (url.startsWith("/api/profiles/")) return jsonResponse(profileResponse)
      if (url.startsWith(`/api/measurements/${MEASUREMENT_ID}`)) return measurementPromise
      return jsonResponse({})
    })
    vi.stubGlobal("fetch", fetchMock)

    renderDetail()

    await waitFor(() => {
      expect(screen.getByTestId("detail-skeleton")).toBeDefined()
    })

    resolveMeasurement?.(jsonResponse(fullMeasurement()))

    await waitFor(() => {
      expect(screen.queryByTestId("detail-skeleton")).toBeNull()
    })
  })

  it("renders 'Medição não encontrada' when the measurement returns 404", async () => {
    const fetchMock = createFetchMock(({ url }) => {
      if (url.startsWith("/api/profiles/")) return jsonResponse(profileResponse)
      if (url.startsWith(`/api/measurements/${MEASUREMENT_ID}`)) {
        return jsonResponse({ error: "not found" }, { ok: false, status: 404 })
      }
      return jsonResponse({})
    })
    vi.stubGlobal("fetch", fetchMock)

    renderDetail()

    await waitFor(() => {
      expect(screen.getByText(/Medição não encontrada/i)).toBeDefined()
    })
    const back = screen.getByRole("link", { name: /Voltar/i }) as HTMLAnchorElement
    expect(back.getAttribute("href")).toBe("/historico")
  })

  it("renders all 5 sections when the measurement loads", async () => {
    setupFullFetch()

    renderDetail()

    await waitFor(() => {
      expect(screen.getByTestId("detail-section-basic")).toBeDefined()
    })
    expect(screen.getByTestId("detail-section-skinfolds")).toBeDefined()
    expect(screen.getByTestId("detail-section-perimeters")).toBeDefined()
    expect(screen.getByTestId("detail-section-diameters")).toBeDefined()
    expect(screen.getByTestId("detail-section-metrics")).toBeDefined()
  })

  it("displays raw values formatted with the right decimals and units", async () => {
    setupFullFetch(
      fullMeasurement({
        weight: 70.4,
        height: 170,
        skinfolds: {
          chest: 10.2,
          midaxillary: 8.1,
          triceps: 12,
          subscapular: 15,
          abdominal: 20,
          suprailiac: 18,
          thigh: 14,
        },
      }),
    )

    renderDetail()

    const basic = await screen.findByTestId("detail-section-basic")
    expect(basic.textContent).toMatch(/70[.,]4\s*kg/)
    expect(basic.textContent).toMatch(/170[.,]0\s*cm/)
    expect(basic.textContent).toMatch(/15\/04\/2026/)
    expect(basic.textContent).toContain("Manhã em jejum")

    const skinfolds = screen.getByTestId("detail-section-skinfolds")
    expect(skinfolds.textContent).toMatch(/Tríceps/)
    expect(skinfolds.textContent).toMatch(/Subescapular/)
    expect(skinfolds.textContent).toMatch(/Suprailíaca/)
    expect(skinfolds.textContent).toMatch(/Abdominal/)
    expect(skinfolds.textContent).toMatch(/Coxa/)
    expect(skinfolds.textContent).toMatch(/Peito/)
    expect(skinfolds.textContent).toMatch(/Axilar/)
    expect(skinfolds.textContent).toMatch(/10[.,]2\s*mm/)

    const perimeters = screen.getByTestId("detail-section-perimeters")
    expect(perimeters.textContent).toMatch(/Cintura/)
    expect(perimeters.textContent).toMatch(/Quadril/)
    expect(perimeters.textContent).toMatch(/Braço/)
    expect(perimeters.textContent).toMatch(/Antebraço/)
    expect(perimeters.textContent).toMatch(/Coxa/)
    expect(perimeters.textContent).toMatch(/Panturrilha/)
    expect(perimeters.textContent).toMatch(/28[.,]0/)

    const diameters = screen.getByTestId("detail-section-diameters")
    expect(diameters.textContent).toMatch(/Úmero/)
    expect(diameters.textContent).toMatch(/Fêmur/)
    expect(diameters.textContent).toMatch(/6[.,]5\s*cm/)
    expect(diameters.textContent).toMatch(/9[.,]2\s*cm/)
  })

  it("displays computeAllMetrics results in the metrics section", async () => {
    setupFullFetch()

    renderDetail()

    const metrics = await screen.findByTestId("detail-section-metrics")
    expect(metrics.textContent).toMatch(/IMC/)
    expect(metrics.textContent).toMatch(/Densidade Corporal/)
    expect(metrics.textContent).toMatch(/% Gordura/)
    expect(metrics.textContent).toMatch(/Massa Gorda/)
    expect(metrics.textContent).toMatch(/Massa Magra/)
    expect(metrics.textContent).toMatch(/Massa Óssea/)
    expect(metrics.textContent).toMatch(/Massa Muscular/)
    expect(metrics.textContent).toMatch(/RCQ/)
    expect(metrics.textContent).toMatch(/RCE/)
    expect(metrics.textContent).toMatch(/TMB/)
    // BMI 70/(1.7^2) = 24.22 (2 decimals)
    expect(metrics.textContent).toMatch(/24[.,]\d{2}\s*kg\/m²/)
    // BMR is integer (0 decimals)
    expect(metrics.textContent).toMatch(/\d+\s*kcal\/dia/)
  })

  it("shows '—' for null/missing raw values and non-computable metrics", async () => {
    const partialMeasurement: MeasurementResponse = {
      _id: MEASUREMENT_ID,
      profileId: PROFILE_ID,
      measuredAt: "2026-04-15T08:30:00.000Z",
      weight: 70,
      createdAt: "2026-04-15T08:30:00.000Z",
      updatedAt: "2026-04-15T08:30:00.000Z",
    }
    setupFullFetch(partialMeasurement)

    renderDetail()

    const basic = await screen.findByTestId("detail-section-basic")
    expect(basic.textContent).toContain("—")
    const skinfolds = screen.getByTestId("detail-section-skinfolds")
    expect(skinfolds.textContent).toContain("—")
    const perimeters = screen.getByTestId("detail-section-perimeters")
    expect(perimeters.textContent).toContain("—")
    const diameters = screen.getByTestId("detail-section-diameters")
    expect(diameters.textContent).toContain("—")
    const metrics = screen.getByTestId("detail-section-metrics")
    // BF% can't be computed without skinfolds → —
    expect(metrics.textContent).toContain("—")
  })

  it("renders the edit button as a link to /medir?edit=<id>", async () => {
    setupFullFetch()

    renderDetail()

    await waitFor(() => {
      expect(screen.getByRole("link", { name: /Editar/i })).toBeDefined()
    })
    const editLink = screen.getByRole("link", { name: /Editar/i }) as HTMLAnchorElement
    expect(editLink.getAttribute("href")).toBe(`/medir?edit=${MEASUREMENT_ID}`)
  })

  it("renders a Comparar button linking to /comparar when measurement is loaded", async () => {
    setupFullFetch()

    renderDetail()

    await waitFor(() => {
      expect(screen.getByRole("link", { name: /Comparar/i })).toBeDefined()
    })
    const compareLink = screen.getByRole("link", { name: /Comparar/i }) as HTMLAnchorElement
    expect(compareLink.getAttribute("href")).toBe("/comparar")
  })

  it("renders a back link to /historico", async () => {
    setupFullFetch()

    renderDetail()

    await waitFor(() => {
      expect(screen.getByTestId("detail-section-basic")).toBeDefined()
    })
    const back = screen.getByRole("link", { name: /Voltar/i }) as HTMLAnchorElement
    expect(back.getAttribute("href")).toBe("/historico")
  })

  it("opens a confirmation dialog when delete is clicked", async () => {
    setupFullFetch(
      fullMeasurement({ measuredAt: "2026-04-15T08:30:00.000Z" }),
    )

    renderDetail()

    await waitFor(() => {
      expect(screen.getByTestId("detail-section-basic")).toBeDefined()
    })

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Excluir/i }))
    })

    const dialog = await screen.findByRole("alertdialog")
    expect(dialog.textContent).toContain("Tem certeza que deseja excluir esta medição?")
    expect(dialog.textContent).toMatch(/Medição de 15\/04\/2026/)
  })

  it("navigates to /historico after a successful delete", async () => {
    const fetchMock = setupFullFetch()

    renderDetail()

    await waitFor(() => {
      expect(screen.getByTestId("detail-section-basic")).toBeDefined()
    })

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Excluir/i }))
    })
    await screen.findByRole("alertdialog")

    const dialog = screen.getByRole("alertdialog")
    const confirm = Array.from(dialog.querySelectorAll("button")).find(
      (btn) => btn.textContent?.trim() === "Excluir",
    ) as HTMLButtonElement
    await act(async () => {
      fireEvent.click(confirm)
    })

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/historico")
    })

    const deleteCalls = fetchMock.mock.calls.filter(
      ([, init]) => (init as RequestInit | undefined)?.method === "DELETE",
    )
    expect(deleteCalls.length).toBe(1)
    expect(String(deleteCalls[0]![0])).toBe(`/api/measurements/${MEASUREMENT_ID}`)
    expect(toastCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Medição excluída", type: "success" }),
    )
  })
})
