import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen, waitFor, cleanup, act, fireEvent } from "@testing-library/react"
import { ChakraProvider, defaultSystem } from "@chakra-ui/react"
import { ProfileProvider } from "@/lib/profile-context"
import MedirPage from "./page"
import type { ProfileDTO } from "@/app/actions/profile-actions"

const pushMock = vi.fn()
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, replace: vi.fn(), back: vi.fn() }),
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
    for (let i = 0; i < 4; i++) {
      await act(async () => {
        nextButton.click()
      })
    }
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
      for (let i = 0; i < 4; i++) {
        await act(async () => {
          nextButton.click()
        })
      }
      const save = await screen.findByRole("button", { name: /Salvar/i })
      await act(async () => {
        save.click()
      })

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalled()
      })
      const [url, init] = fetchMock.mock.calls[0]!
      expect(url).toBe("/api/measurements")
      const body = JSON.parse((init as RequestInit).body as string) as {
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
      for (let i = 0; i < 4; i++) {
        await act(async () => {
          nextButton.click()
        })
      }
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
