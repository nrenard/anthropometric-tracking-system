import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen, waitFor, cleanup, act, fireEvent } from "@testing-library/react"
import { ChakraProvider, defaultSystem } from "@chakra-ui/react"
import { ProfileProvider } from "@/lib/profile-context"
import MedirPage from "./page"
import type { ProfileDTO } from "@/app/actions/profile-actions"

const pushMock = vi.fn()
const searchParamsRef = { current: new URLSearchParams() }
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, replace: vi.fn(), back: vi.fn() }),
  useSearchParams: () => searchParamsRef.current,
}))

const sampleProfile = (overrides: Partial<ProfileDTO> = {}): ProfileDTO => ({
  id: "111111111111111111111111",
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

function renderPage() {
  return render(
    <ChakraProvider value={defaultSystem}>
      <ProfileProvider>
        <MedirPage />
      </ProfileProvider>
    </ChakraProvider>,
  )
}

beforeEach(() => {
  cleanup()
  pushMock.mockReset()
  searchParamsRef.current = new URLSearchParams()
  document.cookie
    .split(";")
    .map((c) => c.trim().split("=")[0])
    .filter(Boolean)
    .forEach((name) => {
      document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
    })
  actionsModule.__setProfiles([sampleProfile()])
  document.cookie = `ACTIVE_PROFILE_ID=111111111111111111111111; path=/`
})

describe("MedirPage shell", () => {
  it("renders the step indicator with all 5 step labels", async () => {
    renderPage()
    await waitFor(() => {
      expect(screen.getByText("Básico")).toBeDefined()
    })
    expect(screen.getByText("Dobras")).toBeDefined()
    expect(screen.getByText("Perímetros")).toBeDefined()
    expect(screen.getByText("Diâmetros")).toBeDefined()
    expect(screen.getByText("Revisar")).toBeDefined()
  })

  it("renders Voltar and Próximo buttons", async () => {
    renderPage()
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Voltar/i })).toBeDefined()
    })
    expect(screen.getByRole("button", { name: /Próximo/i })).toBeDefined()
  })

  it("disables Voltar on step 1", async () => {
    renderPage()
    const back = await screen.findByRole("button", { name: /Voltar/i })
    expect((back as HTMLButtonElement).disabled).toBe(true)
  })

  it("Próximo on step 1 without weight shows validation error and stays on step 1", async () => {
    renderPage()
    const nextButton = await screen.findByRole("button", { name: /Próximo/i })
    await act(async () => {
      nextButton.click()
    })
    expect(screen.getByText(/Peso é obrigatório/i)).toBeDefined()
  })

  it("pre-fills height from the active profile defaultHeight", async () => {
    renderPage()
    await waitFor(() => {
      const height = screen.getByLabelText(/Altura/i) as HTMLInputElement
      expect(height.value).toBe("170")
    })
  })

  it("clicking Próximo with valid weight advances to step 2 (Dobras)", async () => {
    renderPage()
    const weight = await screen.findByLabelText(/Peso/i)
    await act(async () => {
      fireEvent.change(weight, { target: { value: "70" } })
    })
    const nextButton = screen.getByRole("button", { name: /Próximo/i })
    await act(async () => {
      nextButton.click()
    })
    await waitFor(() => {
      expect(screen.getByText(/Peitoral/i)).toBeDefined()
    })
  })

  it("review step shows entered values and Salvar button", async () => {
    renderPage()
    const weight = await screen.findByLabelText(/Peso/i)
    await act(async () => {
      fireEvent.change(weight, { target: { value: "70" } })
    })
    const nextButton = screen.getByRole("button", { name: /Próximo/i })
    await act(async () => {
      nextButton.click()
    })

    const skinfoldFields = [
      /Peitoral/i, /Axilar média/i, /Tríceps/i, /Subescapular/i,
      /Abdominal/i, /Suprailíaca/i, /Coxa/i,
    ]
    for (const label of skinfoldFields) {
      const field = screen.getByLabelText(label)
      await act(async () => {
        fireEvent.change(field, { target: { value: "10" } })
      })
    }
    await act(async () => {
      nextButton.click()
    })

    const perimeterSingle = [/Pescoço/i, /Cintura/i, /Quadril/i]
    for (const label of perimeterSingle) {
      const field = screen.getByLabelText(label)
      await act(async () => {
        fireEvent.change(field, { target: { value: "30" } })
      })
    }
    const pairKeys = [/Braço esq/, /Braço dir/, /Antebraço esq/, /Antebraço dir/, /Coxa esq/, /Coxa dir/, /Panturrilha esq/, /Panturrilha dir/]
    for (const label of pairKeys) {
      const [field] = screen.getAllByLabelText(label)
      await act(async () => {
        fireEvent.change(field!, { target: { value: "30" } })
      })
    }
    await act(async () => {
      nextButton.click()
    })

    for (const label of [/Úmero/i, /Fêmur/i]) {
      const field = screen.getByLabelText(label)
      await act(async () => {
        fireEvent.change(field, { target: { value: "10" } })
      })
    }
    await act(async () => {
      nextButton.click()
    })

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Salvar/i })).toBeDefined()
    })
    expect(screen.getByText(/70 kg/i)).toBeDefined()
  })

  it("Salvar posts to /api/measurements and redirects on success", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ _id: "abc" }), { status: 201 }),
    )
    vi.stubGlobal("fetch", fetchMock)

    try {
      renderPage()
      const weight = await screen.findByLabelText(/Peso/i)
      await act(async () => {
        fireEvent.change(weight, { target: { value: "70" } })
      })
      const nextButton = screen.getByRole("button", { name: /Próximo/i })
      await act(async () => {
        nextButton.click()
      })

      const skinfoldFields = [
        /Peitoral/i, /Axilar média/i, /Tríceps/i, /Subescapular/i,
        /Abdominal/i, /Suprailíaca/i, /Coxa/i,
      ]
      for (const label of skinfoldFields) {
        const field = screen.getByLabelText(label)
        await act(async () => {
          fireEvent.change(field, { target: { value: "10" } })
        })
      }
      await act(async () => {
        nextButton.click()
      })

      const perimeterFields = [
        /Pescoço/i, /Cintura/i, /Quadril/i,
      ]
      for (const label of perimeterFields) {
        const field = screen.getByLabelText(label)
        await act(async () => {
          fireEvent.change(field, { target: { value: "30" } })
        })
      }

      const pairLabels = [/Braço esq/, /Braço dir/, /Antebraço esq/, /Antebraço dir/, /Coxa esq/, /Coxa dir/, /Panturrilha esq/, /Panturrilha dir/]
      for (const label of pairLabels) {
        const [field] = screen.getAllByLabelText(label)
        await act(async () => {
          fireEvent.change(field!, { target: { value: "30" } })
        })
      }
      await act(async () => {
        nextButton.click()
      })

      for (const label of [/Úmero/i, /Fêmur/i]) {
        const field = screen.getByLabelText(label)
        await act(async () => {
          fireEvent.change(field, { target: { value: "10" } })
        })
      }
      await act(async () => {
        nextButton.click()
      })

      const save = await screen.findByRole("button", { name: /Salvar/i })
      await act(async () => {
        save.click()
      })

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalled()
      })
      const call = fetchMock.mock.calls[0]! as unknown as [string, RequestInit]
      const [url, init] = call
      expect(url).toBe("/api/measurements")
      const body = JSON.parse(init.body as string) as {
        weight: number
        profileId: string
      }
      expect(body.weight).toBe(70)
      expect(body.profileId).toBe("111111111111111111111111")

      await waitFor(() => {
        expect(pushMock).toHaveBeenCalledWith("/historico")
      })
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it("shows the no-profile banner and disables form when no active profile", async () => {
    document.cookie
      .split(";")
      .map((c) => c.trim().split("=")[0])
      .filter(Boolean)
      .forEach((name) => {
        document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
      })
    renderPage()
    await waitFor(() => {
      expect(
        screen.getByText(/Selecione um perfil para registrar medições/i),
      ).toBeDefined()
    })
  })

  it("registers a beforeunload listener once form has data", async () => {
    const addSpy = vi.spyOn(window, "addEventListener")
    const removeSpy = vi.spyOn(window, "removeEventListener")
    try {
      renderPage()
      const weight = await screen.findByLabelText(/Peso/i)
      await act(async () => {
        fireEvent.change(weight, { target: { value: "70" } })
      })
      const beforeunloadAdded = addSpy.mock.calls.some(
        ([eventName]) => eventName === "beforeunload",
      )
      expect(beforeunloadAdded).toBe(true)
    } finally {
      addSpy.mockRestore()
      removeSpy.mockRestore()
    }
  })

  it("shows error toast on save failure", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ error: "Dados inválidos" }), { status: 400 }),
    )
    vi.stubGlobal("fetch", fetchMock)

    try {
      renderPage()
      const weight = await screen.findByLabelText(/Peso/i)
      await act(async () => {
        fireEvent.change(weight, { target: { value: "70" } })
      })
      const nextButton = screen.getByRole("button", { name: /Próximo/i })
      await act(async () => {
        nextButton.click()
      })

      const skinfoldFields = [
        /Peitoral/i, /Axilar média/i, /Tríceps/i, /Subescapular/i,
        /Abdominal/i, /Suprailíaca/i, /Coxa/i,
      ]
      for (const label of skinfoldFields) {
        const field = screen.getByLabelText(label)
        await act(async () => {
          fireEvent.change(field, { target: { value: "10" } })
        })
      }
      await act(async () => {
        nextButton.click()
      })

      const perimeterFields = [
        /Pescoço/i, /Cintura/i, /Quadril/i,
      ]
      for (const label of perimeterFields) {
        const field = screen.getByLabelText(label)
        await act(async () => {
          fireEvent.change(field, { target: { value: "30" } })
        })
      }

      const pairLabels = [/Braço esq/, /Braço dir/, /Antebraço esq/, /Antebraço dir/, /Coxa esq/, /Coxa dir/, /Panturrilha esq/, /Panturrilha dir/]
      for (const label of pairLabels) {
        const [field] = screen.getAllByLabelText(label)
        await act(async () => {
          fireEvent.change(field!, { target: { value: "30" } })
        })
      }
      await act(async () => {
        nextButton.click()
      })

      for (const label of [/Úmero/i, /Fêmur/i]) {
        const field = screen.getByLabelText(label)
        await act(async () => {
          fireEvent.change(field, { target: { value: "10" } })
        })
      }
      await act(async () => {
        nextButton.click()
      })

      const save = await screen.findByRole("button", { name: /Salvar/i })
      await act(async () => {
        save.click()
      })

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalled()
      })
      expect(pushMock).not.toHaveBeenCalled()
    } finally {
      vi.unstubAllGlobals()
    }
  })
})

describe("MedirPage edit mode", () => {
  const editMeasurementId = "aaaaaaaaaaaaaaaaaaaaaaaa"
  const measurementDoc = {
    _id: editMeasurementId,
    profileId: "111111111111111111111111",
    measuredAt: new Date("2026-02-10T08:00:00Z").toISOString(),
    notes: "Manhã em jejum",
    weight: 72.4,
    height: 178,
  }

  function mockGetMeasurement(doc: unknown, status = 200) {
    return vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString()
      if (url === `/api/measurements/${editMeasurementId}`) {
        return new Response(JSON.stringify(doc), { status })
      }
      return new Response("{}", { status: 200 })
    })
  }

  it("renders the edit title when edit query param is present", async () => {
    searchParamsRef.current = new URLSearchParams(`edit=${editMeasurementId}`)
    const fetchMock = mockGetMeasurement(measurementDoc)
    vi.stubGlobal("fetch", fetchMock)
    try {
      renderPage()
      await waitFor(() => {
        expect(screen.getByText(/Editar Medição/i)).toBeDefined()
      })
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it("fetches measurement and pre-populates fields from the edit query param", async () => {
    searchParamsRef.current = new URLSearchParams(`edit=${editMeasurementId}`)
    const fetchMock = mockGetMeasurement(measurementDoc)
    vi.stubGlobal("fetch", fetchMock)
    try {
      renderPage()
      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith(`/api/measurements/${editMeasurementId}`)
      })
      await waitFor(() => {
        const weight = screen.getByLabelText(/Peso/i) as HTMLInputElement
        expect(weight.value).toBe("72.4")
      })
      const height = screen.getByLabelText(/Altura/i) as HTMLInputElement
      expect(height.value).toBe("178")
      const notes = screen.getByLabelText(/Observa/i) as HTMLTextAreaElement
      expect(notes.value).toBe("Manhã em jejum")
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it("submits PUT to /api/measurements/[id] in edit mode", async () => {
    searchParamsRef.current = new URLSearchParams(`edit=${editMeasurementId}`)
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.toString()
      if (url === `/api/measurements/${editMeasurementId}` && (!init || !init.method || init.method === "GET")) {
        return new Response(JSON.stringify(measurementDoc), { status: 200 })
      }
      if (url === `/api/measurements/${editMeasurementId}` && init?.method === "PUT") {
        return new Response(JSON.stringify({ ...measurementDoc }), { status: 200 })
      }
      return new Response("{}", { status: 200 })
    })
    vi.stubGlobal("fetch", fetchMock)
    try {
      renderPage()
      await waitFor(() => {
        const weight = screen.getByLabelText(/Peso/i) as HTMLInputElement
        expect(weight.value).toBe("72.4")
      })
      const nextButton = screen.getByRole("button", { name: /Próximo/i })
      await act(async () => {
        nextButton.click()
      })

      const skinfoldFields = [
        /Peitoral/i, /Axilar média/i, /Tríceps/i, /Subescapular/i,
        /Abdominal/i, /Suprailíaca/i, /Coxa/i,
      ]
      for (const label of skinfoldFields) {
        const field = screen.getByLabelText(label)
        await act(async () => {
          fireEvent.change(field, { target: { value: "10" } })
        })
      }
      await act(async () => {
        nextButton.click()
      })

      const perimeterFields = [
        /Pescoço/i, /Cintura/i, /Quadril/i,
      ]
      for (const label of perimeterFields) {
        const field = screen.getByLabelText(label)
        await act(async () => {
          fireEvent.change(field, { target: { value: "30" } })
        })
      }

      const pairLabels = [/Braço esq/, /Braço dir/, /Antebraço esq/, /Antebraço dir/, /Coxa esq/, /Coxa dir/, /Panturrilha esq/, /Panturrilha dir/]
      for (const label of pairLabels) {
        const [field] = screen.getAllByLabelText(label)
        await act(async () => {
          fireEvent.change(field!, { target: { value: "30" } })
        })
      }
      await act(async () => {
        nextButton.click()
      })

      for (const label of [/Úmero/i, /Fêmur/i]) {
        const field = screen.getByLabelText(label)
        await act(async () => {
          fireEvent.change(field, { target: { value: "10" } })
        })
      }
      await act(async () => {
        nextButton.click()
      })

      const save = await screen.findByRole("button", { name: /Salvar/i })
      await act(async () => {
        save.click()
      })

      await waitFor(() => {
        const putCall = fetchMock.mock.calls.find(
          ([, init]) => (init as RequestInit | undefined)?.method === "PUT",
        )
        expect(putCall).toBeDefined()
      })
      const putCall = fetchMock.mock.calls.find(
        ([, init]) => (init as RequestInit | undefined)?.method === "PUT",
      )!
      expect(putCall[0]).toBe(`/api/measurements/${editMeasurementId}`)
      const body = JSON.parse((putCall[1] as RequestInit).body as string) as {
        weight: number
        profileId?: string
      }
      expect(body.weight).toBe(72.4)
      expect(body.profileId).toBeUndefined()

      await waitFor(() => {
        expect(pushMock).toHaveBeenCalled()
      })
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it("falls back to create mode when measurement is not found", async () => {
    searchParamsRef.current = new URLSearchParams(`edit=bbbbbbbbbbbbbbbbbbbbbbbb`)
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ error: "Medição não encontrada" }), { status: 404 }),
    )
    vi.stubGlobal("fetch", fetchMock)
    try {
      renderPage()
      await waitFor(() => {
        expect(screen.getByText(/Nova medição/i)).toBeDefined()
      })
      const weight = screen.getByLabelText(/Peso/i) as HTMLInputElement
      expect(weight.value).toBe("")
    } finally {
      vi.unstubAllGlobals()
    }
  })
})
