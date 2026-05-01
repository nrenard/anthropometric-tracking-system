import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen, waitFor, cleanup, act, fireEvent } from "@testing-library/react"
import { ChakraProvider, defaultSystem } from "@chakra-ui/react"
import { ProfileProvider } from "@/lib/profile-context"
import type { ProfileDTO } from "@/app/actions/profile-actions"

const { toastCreateMock } = vi.hoisted(() => ({
  toastCreateMock: vi.fn(),
}))

vi.mock("@/components/ui/toaster", () => ({
  toaster: { create: toastCreateMock },
}))

import HistoricoPage from "./page"

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

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
}))

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

function renderHistorico() {
  return render(
    <ChakraProvider value={defaultSystem}>
      <ProfileProvider>
        <HistoricoPage />
      </ProfileProvider>
    </ChakraProvider>,
  )
}

beforeEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  toastCreateMock.mockReset()
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

describe("HistoricoPage", () => {
  it("shows the no-profile message and link when no active profile", async () => {
    document.cookie = `ACTIVE_PROFILE_ID=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
    actionsModule.__setProfiles([])

    renderHistorico()

    await waitFor(() => {
      expect(screen.getByText(/Selecione um perfil para ver o histórico/i)).toBeDefined()
    })
    const link = screen.getByRole("link", { name: /Gerenciar perfis/i }) as HTMLAnchorElement
    expect(link.getAttribute("href")).toBe("/configuracoes")
  })

  it("renders skeleton placeholders while measurements load", async () => {
    let resolveMeasurements: ((value: Response) => void) | undefined
    const measurementsPromise = new Promise<Response>((resolve) => {
      resolveMeasurements = resolve
    })
    const fetchMock = createFetchMock(({ url }) => {
      if (url.startsWith("/api/profiles/")) return jsonResponse(profileResponse)
      if (url.startsWith("/api/measurements")) return measurementsPromise
      return jsonResponse({})
    })
    vi.stubGlobal("fetch", fetchMock)

    renderHistorico()

    await waitFor(() => {
      expect(screen.getByTestId("historico-skeleton")).toBeDefined()
    })

    resolveMeasurements?.(jsonResponse([]))

    await waitFor(() => {
      expect(screen.queryByTestId("historico-skeleton")).toBeNull()
    })
  })

  it("renders an empty state with CTA to /medir when there are no measurements", async () => {
    const fetchMock = createFetchMock(({ url }) => {
      if (url.startsWith("/api/profiles/")) return jsonResponse(profileResponse)
      if (url.startsWith("/api/measurements")) return jsonResponse([])
      return jsonResponse({})
    })
    vi.stubGlobal("fetch", fetchMock)

    renderHistorico()

    await waitFor(() => {
      expect(screen.getByText(/Nenhuma medição registrada/i)).toBeDefined()
    })
    const link = screen.getByRole("link", { name: /Adicionar Medição/i }) as HTMLAnchorElement
    expect(link.getAttribute("href")).toBe("/medir")
  })

  it("renders an error message with a retry button when fetch fails", async () => {
    let attempt = 0
    const fetchMock = createFetchMock(({ url }) => {
      if (url.startsWith("/api/profiles/")) return jsonResponse(profileResponse)
      if (url.startsWith("/api/measurements")) {
        attempt += 1
        if (attempt === 1) {
          return jsonResponse({ error: "boom" }, { ok: false, status: 500 })
        }
        return jsonResponse([])
      }
      return jsonResponse({})
    })
    vi.stubGlobal("fetch", fetchMock)

    renderHistorico()

    await waitFor(() => {
      const alert = screen.getByRole("alert")
      expect(alert.textContent).toMatch(/Falha ao carregar histórico|Erro/i)
    })
    const retry = screen.getByRole("button", { name: /Tentar novamente/i })
    await act(async () => {
      retry.click()
    })

    await waitFor(() => {
      expect(screen.queryByRole("alert")).toBeNull()
    })
  })

  it("renders a list of measurements with formatted date, weight, BF% and BMI", async () => {
    const measurements = [
      fullMeasurement({
        _id: "m1",
        measuredAt: "2026-04-15T08:30:00.000Z",
        weight: 70,
      }),
      fullMeasurement({
        _id: "m2",
        measuredAt: "2026-04-01T07:15:00.000Z",
        weight: 71.4,
      }),
    ]
    const fetchMock = createFetchMock(({ url }) => {
      if (url.startsWith("/api/profiles/")) return jsonResponse(profileResponse)
      if (url.startsWith("/api/measurements")) return jsonResponse(measurements)
      return jsonResponse({})
    })
    vi.stubGlobal("fetch", fetchMock)

    renderHistorico()

    await waitFor(() => {
      expect(screen.getAllByTestId("history-item").length).toBe(2)
    })
    const items = screen.getAllByTestId("history-item")
    expect(items[0]!.textContent).toContain("70")
    expect(items[0]!.textContent).toMatch(/kg/i)
    // BMI 70 / 1.7^2 ~ 24.2
    expect(items[0]!.textContent).toMatch(/24[.,]\d/)
    // BF% should render as a number followed by %
    expect(items[0]!.textContent).toMatch(/\d+[.,]?\d*\s*%/)
    // Date formatted DD/MM/YYYY
    expect(items[0]!.textContent).toMatch(/15\/04\/2026/)
    expect(items[1]!.textContent).toMatch(/01\/04\/2026/)
  })

  it("shows an em dash for BF% when the measurement has no skinfolds", async () => {
    const skinfoldless: MeasurementResponse = {
      _id: "m1",
      profileId: PROFILE_ID,
      measuredAt: "2026-04-15T08:30:00.000Z",
      weight: 70,
      height: 170,
      createdAt: "2026-04-15T08:30:00.000Z",
      updatedAt: "2026-04-15T08:30:00.000Z",
    }
    const fetchMock = createFetchMock(({ url }) => {
      if (url.startsWith("/api/profiles/")) return jsonResponse(profileResponse)
      if (url.startsWith("/api/measurements")) return jsonResponse([skinfoldless])
      return jsonResponse({})
    })
    vi.stubGlobal("fetch", fetchMock)

    renderHistorico()

    await waitFor(() => {
      expect(screen.getAllByTestId("history-item").length).toBe(1)
    })
    const bfCell = screen.getByTestId("history-bodyfat")
    expect(bfCell.textContent).toContain("—")
  })

  it("renders the period filter chips and highlights '30 dias' as active by default", async () => {
    const fetchMock = createFetchMock(({ url }) => {
      if (url.startsWith("/api/profiles/")) return jsonResponse(profileResponse)
      if (url.startsWith("/api/measurements")) return jsonResponse([])
      return jsonResponse({})
    })
    vi.stubGlobal("fetch", fetchMock)

    renderHistorico()

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "7 dias" })).toBeDefined()
    })
    expect(screen.getByRole("button", { name: "30 dias" })).toBeDefined()
    expect(screen.getByRole("button", { name: "90 dias" })).toBeDefined()
    expect(screen.getByRole("button", { name: "6 meses" })).toBeDefined()
    expect(screen.getByRole("button", { name: "1 ano" })).toBeDefined()
    expect(screen.getByRole("button", { name: "Tudo" })).toBeDefined()

    const active = screen.getByRole("button", { name: "30 dias" })
    expect(active.getAttribute("data-active")).toBe("true")
  })

  it("refetches measurements with from/to query params when a period chip is clicked", async () => {
    const fetchMock = createFetchMock(({ url }) => {
      if (url.startsWith("/api/profiles/")) return jsonResponse(profileResponse)
      if (url.startsWith("/api/measurements")) return jsonResponse([])
      return jsonResponse({})
    })
    vi.stubGlobal("fetch", fetchMock)

    renderHistorico()

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled()
    })

    const sevenDays = screen.getByRole("button", { name: "7 dias" })
    await act(async () => {
      fireEvent.click(sevenDays)
    })

    await waitFor(() => {
      const measurementCalls = fetchMock.mock.calls
        .map((call) => String(call[0]))
        .filter((u) => u.startsWith("/api/measurements"))
      expect(measurementCalls.length).toBeGreaterThanOrEqual(2)
      const last = measurementCalls[measurementCalls.length - 1]!
      expect(last).toContain(`profileId=${PROFILE_ID}`)
      expect(last).toContain("sort=desc")
      expect(last).toContain("from=")
    })

    expect(sevenDays.getAttribute("data-active")).toBe("true")
  })

  it("omits from/to params when 'Tudo' is selected", async () => {
    const fetchMock = createFetchMock(({ url }) => {
      if (url.startsWith("/api/profiles/")) return jsonResponse(profileResponse)
      if (url.startsWith("/api/measurements")) return jsonResponse([])
      return jsonResponse({})
    })
    vi.stubGlobal("fetch", fetchMock)

    renderHistorico()

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Tudo" })).toBeDefined()
    })

    const tudo = screen.getByRole("button", { name: "Tudo" })
    await act(async () => {
      fireEvent.click(tudo)
    })

    await waitFor(() => {
      const measurementCalls = fetchMock.mock.calls
        .map((call) => String(call[0]))
        .filter((u) => u.startsWith("/api/measurements"))
      const last = measurementCalls[measurementCalls.length - 1]!
      expect(last).not.toContain("from=")
      expect(last).not.toContain("to=")
    })
  })

  it("renders a Comparar button linking to /comparar when a profile is active", async () => {
    const fetchMock = createFetchMock(({ url }) => {
      if (url.startsWith("/api/profiles/")) return jsonResponse(profileResponse)
      if (url.startsWith("/api/measurements")) return jsonResponse([])
      return jsonResponse({})
    })
    vi.stubGlobal("fetch", fetchMock)

    renderHistorico()

    await waitFor(() => {
      expect(screen.getByRole("link", { name: /Comparar/i })).toBeDefined()
    })
    const compareLink = screen.getByRole("link", { name: /Comparar/i }) as HTMLAnchorElement
    expect(compareLink.getAttribute("href")).toBe("/comparar")
  })

  it("does not render the Comparar button when there is no active profile", async () => {
    document.cookie = `ACTIVE_PROFILE_ID=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
    actionsModule.__setProfiles([])

    renderHistorico()

    await waitFor(() => {
      expect(screen.getByText(/Selecione um perfil para ver o histórico/i)).toBeDefined()
    })
    expect(screen.queryByRole("link", { name: /Comparar/i })).toBeNull()
  })

  it("renders the edit button as a link to /medir?edit=<id>", async () => {
    const measurements = [fullMeasurement({ _id: MEASUREMENT_ID })]
    const fetchMock = createFetchMock(({ url }) => {
      if (url.startsWith("/api/profiles/")) return jsonResponse(profileResponse)
      if (url.startsWith("/api/measurements")) return jsonResponse(measurements)
      return jsonResponse({})
    })
    vi.stubGlobal("fetch", fetchMock)

    renderHistorico()

    await waitFor(() => {
      expect(screen.getAllByTestId("history-item").length).toBe(1)
    })
    const editLink = screen.getByRole("link", { name: /Editar/i }) as HTMLAnchorElement
    expect(editLink.getAttribute("href")).toBe(`/medir?edit=${MEASUREMENT_ID}`)
  })

  it("renders a delete button next to each item", async () => {
    const measurements = [fullMeasurement({ _id: MEASUREMENT_ID })]
    const fetchMock = createFetchMock(({ url }) => {
      if (url.startsWith("/api/profiles/")) return jsonResponse(profileResponse)
      if (url.startsWith("/api/measurements")) return jsonResponse(measurements)
      return jsonResponse({})
    })
    vi.stubGlobal("fetch", fetchMock)

    renderHistorico()

    await waitFor(() => {
      expect(screen.getAllByTestId("history-item").length).toBe(1)
    })
    const deleteButton = screen.getByRole("button", { name: /Excluir/i })
    expect(deleteButton).toBeDefined()
  })

  it("shows the truncated notes preview", async () => {
    const measurements = [
      fullMeasurement({
        _id: MEASUREMENT_ID,
        notes: "Pré-treino, energia ótima, dormi 8h",
      }),
    ]
    const fetchMock = createFetchMock(({ url }) => {
      if (url.startsWith("/api/profiles/")) return jsonResponse(profileResponse)
      if (url.startsWith("/api/measurements")) return jsonResponse(measurements)
      return jsonResponse({})
    })
    vi.stubGlobal("fetch", fetchMock)

    renderHistorico()

    await waitFor(() => {
      expect(screen.getByText(/Pré-treino/i)).toBeDefined()
    })
  })

  describe("delete confirmation", () => {
    function renderWithMeasurement(
      measurement: MeasurementResponse = fullMeasurement(),
      deleteHandler?: (args: FetchHandlerArgs) => Response | Promise<Response>,
    ) {
      const fetchMock = createFetchMock((args) => {
        const { url, init } = args
        if (url.startsWith("/api/profiles/")) return jsonResponse(profileResponse)
        if (
          url.startsWith("/api/measurements/") &&
          init?.method === "DELETE"
        ) {
          if (deleteHandler) return deleteHandler(args)
          return { ok: true, status: 204, json: async () => ({}) } as unknown as Response
        }
        if (url.startsWith("/api/measurements")) return jsonResponse([measurement])
        return jsonResponse({})
      })
      vi.stubGlobal("fetch", fetchMock)
      renderHistorico()
      return fetchMock
    }

    it("opens a confirmation dialog showing the measurement date when delete is clicked", async () => {
      renderWithMeasurement(
        fullMeasurement({ _id: MEASUREMENT_ID, measuredAt: "2026-04-15T08:30:00.000Z" }),
      )

      await waitFor(() => {
        expect(screen.getAllByTestId("history-item").length).toBe(1)
      })

      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: /Excluir/i }))
      })

      const dialog = await screen.findByRole("alertdialog")
      expect(dialog.textContent).toContain("Tem certeza que deseja excluir esta medição?")
      expect(dialog.textContent).toMatch(/Medição de 15\/04\/2026/)
      const dialogButtons = Array.from(dialog.querySelectorAll("button"))
      expect(dialogButtons.some((b) => b.textContent?.trim() === "Excluir")).toBe(true)
      expect(dialogButtons.some((b) => b.textContent?.trim() === "Cancelar")).toBe(true)
    })

    it("cancels the dialog without calling the delete API when Cancelar is clicked", async () => {
      const fetchMock = renderWithMeasurement()

      await waitFor(() => {
        expect(screen.getAllByTestId("history-item").length).toBe(1)
      })

      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: /Excluir/i }))
      })

      await screen.findByRole("alertdialog")

      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: /Cancelar/i }))
      })

      await waitFor(() => {
        expect(screen.queryByRole("alertdialog")).toBeNull()
      })

      const deleteCalls = fetchMock.mock.calls.filter(
        ([, init]) => (init as RequestInit | undefined)?.method === "DELETE",
      )
      expect(deleteCalls.length).toBe(0)
      expect(toastCreateMock).not.toHaveBeenCalled()
    })

    it("removes the measurement and shows a success toast when delete returns 204", async () => {
      const fetchMock = renderWithMeasurement(
        fullMeasurement({ _id: MEASUREMENT_ID }),
      )

      await waitFor(() => {
        expect(screen.getAllByTestId("history-item").length).toBe(1)
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
        expect(screen.queryAllByTestId("history-item").length).toBe(0)
      })

      const deleteCalls = fetchMock.mock.calls.filter(
        ([, init]) => (init as RequestInit | undefined)?.method === "DELETE",
      )
      expect(deleteCalls.length).toBe(1)
      expect(String(deleteCalls[0]![0])).toBe(`/api/measurements/${MEASUREMENT_ID}`)

      expect(toastCreateMock).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Medição excluída", type: "success" }),
      )
      expect(screen.queryByRole("alertdialog")).toBeNull()
    })

    it("keeps the measurement and shows an error toast when delete fails", async () => {
      renderWithMeasurement(
        fullMeasurement({ _id: MEASUREMENT_ID }),
        () => jsonResponse({ error: "boom" }, { ok: false, status: 500 }),
      )

      await waitFor(() => {
        expect(screen.getAllByTestId("history-item").length).toBe(1)
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
        expect(toastCreateMock).toHaveBeenCalledWith(
          expect.objectContaining({ title: "Erro ao excluir medição", type: "error" }),
        )
      })

      expect(screen.getAllByTestId("history-item").length).toBe(1)
      expect(screen.queryByRole("alertdialog")).toBeNull()
    })
  })
})
