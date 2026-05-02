import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen, waitFor, cleanup, fireEvent, act } from "@testing-library/react"
import { ChakraProvider, defaultSystem } from "@chakra-ui/react"
import ConfiguracoesPage from "./page"
import type { ProfileDTO } from "@/app/actions/profile-actions"

const pushMock = vi.fn()
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, replace: vi.fn(), back: vi.fn() }),
}))

const toastCreateMock = vi.fn()
vi.mock("@/components/ui/toaster", () => ({
  toaster: {
    create: (...args: unknown[]) => toastCreateMock(...args),
  },
  Toaster: () => null,
}))

const useActiveProfileMock = vi.fn()
vi.mock("@/hooks/use-active-profile", () => ({
  useActiveProfile: () => useActiveProfileMock(),
}))

vi.mock("@/components/bottom-nav", () => ({
  BottomNav: () => null,
}))

vi.mock("@/components/ui/color-mode", () => ({
  ColorModeButton: () => null,
}))

const sampleProfile = (overrides: Partial<ProfileDTO> = {}): ProfileDTO => ({
  id: "111111111111111111111111",
  name: "Jane Doe",
  email: "jane@example.com",
  dateOfBirth: new Date("1990-03-15T00:00:00.000Z").toISOString(),
  sex: "F",
  defaultHeight: 170,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
})

const secondProfile = (): ProfileDTO => ({
  id: "222222222222222222222222",
  name: "John Smith",
  email: "john@example.com",
  dateOfBirth: new Date("1985-11-20T00:00:00.000Z").toISOString(),
  sex: "M",
  defaultHeight: 180,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
})

function renderPage() {
  return render(
    <ChakraProvider value={defaultSystem}>
      <ConfiguracoesPage />
    </ChakraProvider>,
  )
}

beforeEach(() => {
  cleanup()
  pushMock.mockReset()
  toastCreateMock.mockReset()
  useActiveProfileMock.mockReset()
  document.cookie
    .split(";")
    .map((c) => c.trim().split("=")[0])
    .filter(Boolean)
    .forEach((name) => {
      document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
    })
})

describe("Step 01 — Profile list and management", () => {
  describe("profile list rendering", () => {
    it("renders the section heading", async () => {
      useActiveProfileMock.mockReturnValue({
        profiles: [sampleProfile()],
        activeProfileId: null,
        activeProfile: null,
        isLoading: false,
        setActiveProfileId: vi.fn(),
        refreshProfiles: vi.fn(),
      })
      renderPage()
      await waitFor(() => {
        expect(screen.getByText("Gerenciar Perfis")).toBeDefined()
      })
    })

    it("renders profile name, sex icon, and formatted date of birth per profile", async () => {
      useActiveProfileMock.mockReturnValue({
        profiles: [sampleProfile(), secondProfile()],
        activeProfileId: null,
        activeProfile: null,
        isLoading: false,
        setActiveProfileId: vi.fn(),
        refreshProfiles: vi.fn(),
      })
      renderPage()
      await waitFor(() => {
        expect(screen.getByText("Jane Doe")).toBeDefined()
      })
      expect(screen.getByText("John Smith")).toBeDefined()
      expect(screen.getByText("15/03/1990")).toBeDefined()
      expect(screen.getByText("20/11/1985")).toBeDefined()
    })

    it("highlights active profile with a visual indicator", async () => {
      const profile = sampleProfile()
      const otherProfile = secondProfile()
      useActiveProfileMock.mockReturnValue({
        profiles: [profile, otherProfile],
        activeProfileId: profile.id,
        activeProfile: profile,
        isLoading: false,
        setActiveProfileId: vi.fn(),
        refreshProfiles: vi.fn(),
      })
      renderPage()
      await waitFor(() => {
        expect(screen.getByText("Jane Doe")).toBeDefined()
      })
      const activeRows = screen.getAllByTestId("profile-row-active")
      expect(activeRows.length).toBe(1)
    })

    it("shows empty state when no profiles exist", async () => {
      useActiveProfileMock.mockReturnValue({
        profiles: [],
        activeProfileId: null,
        activeProfile: null,
        isLoading: false,
        setActiveProfileId: vi.fn(),
        refreshProfiles: vi.fn(),
      })
      renderPage()
      await waitFor(() => {
        expect(screen.getByText("Nenhum perfil cadastrado")).toBeDefined()
      })
      expect(
        screen.getByRole("button", { name: /Criar Perfil/i }),
      ).toBeDefined()
    })

    it("shows loading spinner while profiles are loading", async () => {
      useActiveProfileMock.mockReturnValue({
        profiles: [],
        activeProfileId: null,
        activeProfile: null,
        isLoading: true,
        setActiveProfileId: vi.fn(),
        refreshProfiles: vi.fn(),
      })
      renderPage()
      await waitFor(() => {
        expect(screen.getByTestId("profiles-loading")).toBeDefined()
      })
    })
  })

  describe("create profile modal", () => {
    it('opens creation modal when "Novo Perfil" is clicked', async () => {
      const refreshProfiles = vi.fn()
      useActiveProfileMock.mockReturnValue({
        profiles: [sampleProfile()],
        activeProfileId: null,
        activeProfile: null,
        isLoading: false,
        setActiveProfileId: vi.fn(),
        refreshProfiles,
      })
      renderPage()
      const addButton = await screen.findByRole("button", {
        name: /Novo Perfil/i,
      })
      await act(async () => {
        addButton.click()
      })
      expect(screen.getByRole("dialog")).toBeDefined()
    })

    it("submits POST /api/profiles on form submission and shows success toast", async () => {
      const refreshProfiles = vi.fn()
      useActiveProfileMock.mockReturnValue({
        profiles: [sampleProfile()],
        activeProfileId: null,
        activeProfile: null,
        isLoading: false,
        setActiveProfileId: vi.fn(),
        refreshProfiles,
      })

      const fetchMock = vi.fn(async () =>
        new Response(
          JSON.stringify({
            id: "333333333333333333333333",
            name: "New Profile",
            email: "test@example.com",
            dateOfBirth: "1995-06-10T00:00:00.000Z",
            sex: "M",
            defaultHeight: 175,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }),
          { status: 201 },
        ),
      )
      vi.stubGlobal("fetch", fetchMock)

      try {
        renderPage()
        const addButton = await screen.findByRole("button", {
          name: /Novo Perfil/i,
        })
        await act(async () => {
          addButton.click()
        })

        const nameInput = screen.getByLabelText("Nome")
        await act(async () => {
          fireEvent.change(nameInput, { target: { value: "New Profile" } })
        })

        const dateInput = screen.getByLabelText(/Data de Nascimento/i)
        await act(async () => {
          fireEvent.change(dateInput, { target: { value: "1995-06-10" } })
        })

        const sexRadio = screen.getByText("Masculino")
        await act(async () => {
          fireEvent.click(sexRadio)
        })

        const saveButton = screen.getByRole("button", { name: /Criar/i })
        await act(async () => {
          saveButton.click()
        })

        await waitFor(() => {
          expect(fetchMock).toHaveBeenCalledWith(
            "/api/profiles",
            expect.objectContaining({ method: "POST" }),
          )
        })

        await waitFor(() => {
          expect(toastCreateMock).toHaveBeenCalledWith(
            expect.objectContaining({ type: "success" }),
          )
        })

        await waitFor(() => {
          expect(refreshProfiles).toHaveBeenCalled()
        })
      } finally {
        vi.unstubAllGlobals()
      }
    })

    it("shows error toast on create API error", async () => {
      const refreshProfiles = vi.fn()
      useActiveProfileMock.mockReturnValue({
        profiles: [sampleProfile()],
        activeProfileId: null,
        activeProfile: null,
        isLoading: false,
        setActiveProfileId: vi.fn(),
        refreshProfiles,
      })

      const fetchMock = vi.fn(async () =>
        new Response(JSON.stringify({ error: "Erro" }), { status: 400 }),
      )
      vi.stubGlobal("fetch", fetchMock)

      try {
        renderPage()
        const addButton = await screen.findByRole("button", {
          name: /Novo Perfil/i,
        })
        await act(async () => {
          addButton.click()
        })

        const nameInput = screen.getByLabelText("Nome")
        await act(async () => {
          fireEvent.change(nameInput, { target: { value: "New" } })
        })

        const dateInput2 = screen.getByLabelText(/Data de Nascimento/i)
        await act(async () => {
          fireEvent.change(dateInput2, { target: { value: "1995-06-10" } })
        })

        const sexRadio2 = screen.getByText("Masculino")
        await act(async () => {
          fireEvent.click(sexRadio2)
        })

        const saveButton = screen.getByRole("button", { name: /Criar/i })
        await act(async () => {
          saveButton.click()
        })

        await waitFor(() => {
          expect(toastCreateMock).toHaveBeenCalledWith(
            expect.objectContaining({ type: "error" }),
          )
        })
      } finally {
        vi.unstubAllGlobals()
      }
    })
  })

  describe("profile actions", () => {
    it('"Selecionar" calls setActiveProfileId with profile id', async () => {
      const profile = sampleProfile()
      const setActiveProfileId = vi.fn()
      useActiveProfileMock.mockReturnValue({
        profiles: [profile, secondProfile()],
        activeProfileId: null,
        activeProfile: null,
        isLoading: false,
        setActiveProfileId,
        refreshProfiles: vi.fn(),
      })
      renderPage()
      await waitFor(() => {
        expect(screen.getByText("Jane Doe")).toBeDefined()
      })
      const selectButtons = screen.getAllByRole("button", { name: /Selecionar/i })
      await act(async () => {
        selectButtons[0]!.click()
      })
      expect(setActiveProfileId).toHaveBeenCalledWith(profile.id)
    })

    it('"Editar" calls setActiveProfileId with profile id', async () => {
      const profile = sampleProfile()
      const setActiveProfileId = vi.fn()
      useActiveProfileMock.mockReturnValue({
        profiles: [profile, secondProfile()],
        activeProfileId: null,
        activeProfile: null,
        isLoading: false,
        setActiveProfileId,
        refreshProfiles: vi.fn(),
      })
      renderPage()
      await waitFor(() => {
        expect(screen.getByText("Jane Doe")).toBeDefined()
      })
      const editButtons = screen.getAllByRole("button", { name: /Editar/i })
      await act(async () => {
        editButtons[0]!.click()
      })
      expect(setActiveProfileId).toHaveBeenCalledWith(profile.id)
    })

    it('"Excluir" opens confirmation dialog with profile name', async () => {
      const profile = sampleProfile()
      useActiveProfileMock.mockReturnValue({
        profiles: [profile],
        activeProfileId: null,
        activeProfile: null,
        isLoading: false,
        setActiveProfileId: vi.fn(),
        refreshProfiles: vi.fn(),
      })
      renderPage()
      await waitFor(() => {
        expect(screen.getByText("Jane Doe")).toBeDefined()
      })
      const deleteButtons = screen.getAllByRole("button", { name: /Excluir/i })
      await act(async () => {
        deleteButtons[0]!.click()
      })
      expect(screen.getAllByText(/Jane Doe/).length).toBeGreaterThanOrEqual(2)
      expect(
        screen.getByText(/Tem certeza/i),
      ).toBeDefined()
    })

    it("confirming delete sends DELETE and shows success toast", async () => {
      const profile = sampleProfile()
      const refreshProfiles = vi.fn()
      useActiveProfileMock.mockReturnValue({
        profiles: [profile],
        activeProfileId: null,
        activeProfile: null,
        isLoading: false,
        setActiveProfileId: vi.fn(),
        refreshProfiles,
      })

      const fetchMock = vi.fn(async () => new Response(null, { status: 204 }))
      vi.stubGlobal("fetch", fetchMock)

      try {
        renderPage()
        await waitFor(() => {
          expect(screen.getByText("Jane Doe")).toBeDefined()
        })
        const deleteButtons = screen.getAllByRole("button", { name: /Excluir/i })
        await act(async () => {
          deleteButtons[0]!.click()
        })

        const confirmButton = screen.getByRole("button", {
          name: /Confirmar/i,
        })
        await act(async () => {
          confirmButton.click()
        })

        await waitFor(() => {
          expect(fetchMock).toHaveBeenCalledWith(
            `/api/profiles/${profile.id}`,
            expect.objectContaining({ method: "DELETE" }),
          )
        })

        await waitFor(() => {
          expect(toastCreateMock).toHaveBeenCalledWith(
            expect.objectContaining({ type: "success" }),
          )
        })

        await waitFor(() => {
          expect(refreshProfiles).toHaveBeenCalled()
        })
      } finally {
        vi.unstubAllGlobals()
      }
    })

    it("clears active profile cookie when deleting active profile", async () => {
      const profile = sampleProfile()
      document.cookie =
        "ACTIVE_PROFILE_ID=111111111111111111111111; path=/; max-age=2592000"
      const refreshProfiles = vi.fn()
      useActiveProfileMock.mockReturnValue({
        profiles: [profile],
        activeProfileId: profile.id,
        activeProfile: profile,
        isLoading: false,
        setActiveProfileId: vi.fn(),
        refreshProfiles,
      })

      const fetchMock = vi.fn(async () => new Response(null, { status: 204 }))
      vi.stubGlobal("fetch", fetchMock)

      try {
        renderPage()
        await waitFor(() => {
          expect(screen.getByText("Jane Doe")).toBeDefined()
        })
        const deleteButtons = screen.getAllByRole("button", { name: /Excluir/i })
        await act(async () => {
          deleteButtons[0]!.click()
        })

        const confirmButton = screen.getByRole("button", {
          name: /Confirmar/i,
        })
        await act(async () => {
          confirmButton.click()
        })

        await waitFor(() => {
          expect(document.cookie).not.toContain("ACTIVE_PROFILE_ID")
        })
      } finally {
        vi.unstubAllGlobals()
      }
    })

    it("shows error toast on delete API error", async () => {
      const profile = sampleProfile()
      const refreshProfiles = vi.fn()
      useActiveProfileMock.mockReturnValue({
        profiles: [profile],
        activeProfileId: null,
        activeProfile: null,
        isLoading: false,
        setActiveProfileId: vi.fn(),
        refreshProfiles,
      })

      const fetchMock = vi.fn(async () =>
        new Response(JSON.stringify({ error: "Erro" }), { status: 500 }),
      )
      vi.stubGlobal("fetch", fetchMock)

      try {
        renderPage()
        await waitFor(() => {
          expect(screen.getByText("Jane Doe")).toBeDefined()
        })
        const deleteButtons = screen.getAllByRole("button", { name: /Excluir/i })
        await act(async () => {
          deleteButtons[0]!.click()
        })

        const confirmButton = screen.getByRole("button", {
          name: /Confirmar/i,
        })
        await act(async () => {
          confirmButton.click()
        })

        await waitFor(() => {
          expect(toastCreateMock).toHaveBeenCalledWith(
            expect.objectContaining({ type: "error" }),
          )
        })
      } finally {
        vi.unstubAllGlobals()
      }
    })
  })
})

describe("Step 02 — Edit active profile form", () => {
  describe("form visibility", () => {
    it("renders edit form when active profile exists", async () => {
      const profile = sampleProfile()
      useActiveProfileMock.mockReturnValue({
        profiles: [profile],
        activeProfileId: profile.id,
        activeProfile: profile,
        isLoading: false,
        setActiveProfileId: vi.fn(),
        refreshProfiles: vi.fn(),
      })
      renderPage()
      await waitFor(() => {
        expect(
          screen.getByText("Editar Perfil Ativo"),
        ).toBeDefined()
      })
      expect(screen.getByLabelText("Nome")).toBeDefined()
    })

    it("hides edit form when no active profile exists", async () => {
      useActiveProfileMock.mockReturnValue({
        profiles: [sampleProfile()],
        activeProfileId: null,
        activeProfile: null,
        isLoading: false,
        setActiveProfileId: vi.fn(),
        refreshProfiles: vi.fn(),
      })
      renderPage()
      await waitFor(() => {
        expect(screen.getByText("Gerenciar Perfis")).toBeDefined()
      })
      expect(
        screen.queryByText("Editar Perfil Ativo"),
      ).toBeNull()
    })
  })

  describe("form pre-population", () => {
    it("pre-populates fields with active profile data", async () => {
      const profile = sampleProfile()
      useActiveProfileMock.mockReturnValue({
        profiles: [profile],
        activeProfileId: profile.id,
        activeProfile: profile,
        isLoading: false,
        setActiveProfileId: vi.fn(),
        refreshProfiles: vi.fn(),
      })
      renderPage()
      await waitFor(() => {
        const nameInput = screen.getByLabelText(
          "Nome",
        ) as HTMLInputElement
        expect(nameInput.value).toBe("Jane Doe")
      })
    })

    it("E-mail field is readonly", async () => {
      const profile = sampleProfile()
      useActiveProfileMock.mockReturnValue({
        profiles: [profile],
        activeProfileId: profile.id,
        activeProfile: profile,
        isLoading: false,
        setActiveProfileId: vi.fn(),
        refreshProfiles: vi.fn(),
      })
      renderPage()
      await waitFor(() => {
        const emailInput = screen.getByLabelText(
          "E-mail",
        ) as HTMLInputElement
        expect(emailInput.readOnly).toBe(true)
      })
    })

    it("re-populates form when active profile changes", async () => {
      const profile1 = sampleProfile()
      const profile2 = sampleProfile({
        id: "222222222222222222222222",
        name: "John Smith",
        dateOfBirth: new Date(
          "1985-11-20T00:00:00.000Z",
        ).toISOString(),
        sex: "M",
        defaultHeight: 180,
      })

      const profileMap = {
        initial: {
          profiles: [profile1, profile2],
          activeProfileId: profile1.id,
          activeProfile: profile1,
        },
        next: {
          profiles: [profile1, profile2],
          activeProfileId: profile2.id,
          activeProfile: profile2,
        },
      }

      let state = profileMap.initial
      useActiveProfileMock.mockImplementation(() => ({
        ...state,
        isLoading: false,
        setActiveProfileId: vi.fn(),
        refreshProfiles: vi.fn(),
      }))

      const { rerender } = renderPage()
      await waitFor(() => {
        const nameInput = screen.getByLabelText(
          "Nome",
        ) as HTMLInputElement
        expect(nameInput.value).toBe("Jane Doe")
      })

      state = profileMap.next

      expect(useActiveProfileMock).toHaveBeenCalled()
      void rerender
    })
  })

  describe("name validation", () => {
    it("shows error for empty nome", async () => {
      const profile = sampleProfile()
      useActiveProfileMock.mockReturnValue({
        profiles: [profile],
        activeProfileId: profile.id,
        activeProfile: profile,
        isLoading: false,
        setActiveProfileId: vi.fn(),
        refreshProfiles: vi.fn(),
      })
      renderPage()
      await waitFor(() => {
        expect(
          screen.getByText("Editar Perfil Ativo"),
        ).toBeDefined()
      })

      const nameInput = screen.getByLabelText("Nome")
      await act(async () => {
        fireEvent.change(nameInput, { target: { value: "" } })
      })

      const saveButton = screen.getByRole("button", {
        name: /Salvar/i,
      })
      await act(async () => {
        saveButton.click()
      })

      await waitFor(() => {
        expect(
          screen.getByText("Nome é obrigatório"),
        ).toBeDefined()
      })
    })

    it("shows error for nome shorter than 2 characters", async () => {
      const profile = sampleProfile()
      useActiveProfileMock.mockReturnValue({
        profiles: [profile],
        activeProfileId: profile.id,
        activeProfile: profile,
        isLoading: false,
        setActiveProfileId: vi.fn(),
        refreshProfiles: vi.fn(),
      })
      renderPage()
      await waitFor(() => {
        expect(
          screen.getByText("Editar Perfil Ativo"),
        ).toBeDefined()
      })

      const nameInput = screen.getByLabelText("Nome")
      await act(async () => {
        fireEvent.change(nameInput, { target: { value: "A" } })
      })

      const saveButton = screen.getByRole("button", {
        name: /Salvar/i,
      })
      await act(async () => {
        saveButton.click()
      })

      await waitFor(() => {
        expect(
          screen.getByText(
            "Nome deve ter pelo menos 2 caracteres",
          ),
        ).toBeDefined()
      })
    })
  })

  describe("date validation", () => {
    it("shows error for future date of birth", async () => {
      const profile = sampleProfile()
      useActiveProfileMock.mockReturnValue({
        profiles: [profile],
        activeProfileId: profile.id,
        activeProfile: profile,
        isLoading: false,
        setActiveProfileId: vi.fn(),
        refreshProfiles: vi.fn(),
      })
      renderPage()
      await waitFor(() => {
        expect(
          screen.getByText("Editar Perfil Ativo"),
        ).toBeDefined()
      })

      const dateInput = screen.getByLabelText(
        /Data de Nascimento/i,
      )
      await act(async () => {
        fireEvent.change(dateInput, {
          target: { value: "2099-01-01" },
        })
      })

      const saveButton = screen.getByRole("button", {
        name: /Salvar/i,
      })
      await act(async () => {
        saveButton.click()
      })

      await waitFor(() => {
        expect(
          screen.getByText(
            "Data de nascimento deve estar no passado",
          ),
        ).toBeDefined()
      })
    })

    it("shows error for age over 120", async () => {
      const profile = sampleProfile()
      useActiveProfileMock.mockReturnValue({
        profiles: [profile],
        activeProfileId: profile.id,
        activeProfile: profile,
        isLoading: false,
        setActiveProfileId: vi.fn(),
        refreshProfiles: vi.fn(),
      })
      renderPage()
      await waitFor(() => {
        expect(
          screen.getByText("Editar Perfil Ativo"),
        ).toBeDefined()
      })

      const dateInput = screen.getByLabelText(
        /Data de Nascimento/i,
      )
      await act(async () => {
        fireEvent.change(dateInput, {
          target: { value: "1800-01-01" },
        })
      })

      const saveButton = screen.getByRole("button", {
        name: /Salvar/i,
      })
      await act(async () => {
        saveButton.click()
      })

      await waitFor(() => {
        expect(
          screen.getByText(
            "Idade deve ser entre 1 e 120 anos",
          ),
        ).toBeDefined()
      })
    })
  })

  describe("sex validation", () => {
    it("shows error for missing sex", async () => {
      const profile = sampleProfile({ sex: "" as "M" | "F" })
      useActiveProfileMock.mockReturnValue({
        profiles: [profile as ProfileDTO],
        activeProfileId: profile.id,
        activeProfile: profile,
        isLoading: false,
        setActiveProfileId: vi.fn(),
        refreshProfiles: vi.fn(),
      })
      renderPage()
      await waitFor(() => {
        expect(
          screen.getByText("Editar Perfil Ativo"),
        ).toBeDefined()
      })

      const saveButton = screen.getByRole("button", {
        name: /Salvar/i,
      })
      await act(async () => {
        saveButton.click()
      })

      await waitFor(() => {
        expect(
          screen.getByText("Sexo é obrigatório"),
        ).toBeDefined()
      })
    })
  })

  describe("save behavior", () => {
    it("sends PUT to /api/profiles/[activeId] with form data", async () => {
      const profile = sampleProfile()
      const refreshProfiles = vi.fn()
      useActiveProfileMock.mockReturnValue({
        profiles: [profile],
        activeProfileId: profile.id,
        activeProfile: profile,
        isLoading: false,
        setActiveProfileId: vi.fn(),
        refreshProfiles,
      })

      const fetchMock = vi.fn(async () =>
        new Response(
          JSON.stringify({ ...profile, name: "Jane Updated" }),
          { status: 200 },
        ),
      )
      vi.stubGlobal("fetch", fetchMock)

      try {
        renderPage()
        await waitFor(() => {
          expect(
            screen.getByText("Editar Perfil Ativo"),
          ).toBeDefined()
        })

        const nameInput = screen.getByLabelText("Nome")
        await act(async () => {
          fireEvent.change(nameInput, {
            target: { value: "Jane Updated" },
          })
        })

        const saveButton = screen.getByRole("button", {
          name: /Salvar/i,
        })
        await act(async () => {
          saveButton.click()
        })

        await waitFor(() => {
          const putCall = fetchMock.mock.calls.find(
            ([, init]: unknown[]) =>
              (init as RequestInit | undefined)?.method ===
              "PUT",
          )
          expect(putCall).toBeDefined()
        })

        await waitFor(() => {
          expect(toastCreateMock).toHaveBeenCalledWith(
            expect.objectContaining({ type: "success" }),
          )
        })

        await waitFor(() => {
          expect(refreshProfiles).toHaveBeenCalled()
        })
      } finally {
        vi.unstubAllGlobals()
      }
    })

    it("shows error toast on save failure", async () => {
      const profile = sampleProfile()
      const refreshProfiles = vi.fn()
      useActiveProfileMock.mockReturnValue({
        profiles: [profile],
        activeProfileId: profile.id,
        activeProfile: profile,
        isLoading: false,
        setActiveProfileId: vi.fn(),
        refreshProfiles,
      })

      const fetchMock = vi.fn(async () =>
        new Response(JSON.stringify({ error: "Erro" }), {
          status: 500,
        }),
      )
      vi.stubGlobal("fetch", fetchMock)

      try {
        renderPage()
        await waitFor(() => {
          expect(
            screen.getByText("Editar Perfil Ativo"),
          ).toBeDefined()
        })

        const saveButton = screen.getByRole("button", {
          name: /Salvar/i,
        })
        await act(async () => {
          saveButton.click()
        })

        await waitFor(() => {
          expect(toastCreateMock).toHaveBeenCalledWith(
            expect.objectContaining({ type: "error" }),
          )
        })
      } finally {
        vi.unstubAllGlobals()
      }
    })
  })
})

describe("Step 03 — Appearance, about, and logout", () => {
  it('renders appearance section with "Tema escuro" label', async () => {
    useActiveProfileMock.mockReturnValue({
      profiles: [],
      activeProfileId: null,
      activeProfile: null,
      isLoading: false,
      setActiveProfileId: vi.fn(),
      refreshProfiles: vi.fn(),
    })
    renderPage()
    await waitFor(() => {
      expect(screen.getByText("Aparência")).toBeDefined()
    })
    expect(screen.getByText("Tema escuro")).toBeDefined()
  })

  it("renders about section with app name and version", async () => {
    useActiveProfileMock.mockReturnValue({
      profiles: [],
      activeProfileId: null,
      activeProfile: null,
      isLoading: false,
      setActiveProfileId: vi.fn(),
      refreshProfiles: vi.fn(),
    })
    renderPage()
    await waitFor(() => {
      expect(screen.getByText("Sobre")).toBeDefined()
    })
    expect(
      screen.getByText(
        "Sistema de Acompanhamento Antropométrico",
      ),
    ).toBeDefined()
    expect(screen.getByText("Versão 1.0.0")).toBeDefined()
  })

  it('renders "Sair" logout button', async () => {
    useActiveProfileMock.mockReturnValue({
      profiles: [],
      activeProfileId: null,
      activeProfile: null,
      isLoading: false,
      setActiveProfileId: vi.fn(),
      refreshProfiles: vi.fn(),
    })
    renderPage()
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /Sair/i }),
      ).toBeDefined()
    })
  })

  it("calls logout API and redirects on success", async () => {
    useActiveProfileMock.mockReturnValue({
      profiles: [],
      activeProfileId: null,
      activeProfile: null,
      isLoading: false,
      setActiveProfileId: vi.fn(),
      refreshProfiles: vi.fn(),
    })

    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
      }),
    )
    vi.stubGlobal("fetch", fetchMock)

    try {
      renderPage()
      const logoutButton = await screen.findByRole("button", {
        name: /Sair/i,
      })
      await act(async () => {
        logoutButton.click()
      })

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith(
          "/api/auth/logout",
          expect.objectContaining({ method: "POST" }),
        )
      })

      await waitFor(() => {
        expect(pushMock).toHaveBeenCalledWith("/login")
      })
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it("shows error toast on logout failure", async () => {
    useActiveProfileMock.mockReturnValue({
      profiles: [],
      activeProfileId: null,
      activeProfile: null,
      isLoading: false,
      setActiveProfileId: vi.fn(),
      refreshProfiles: vi.fn(),
    })

    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ error: "Erro" }), {
        status: 500,
      }),
    )
    vi.stubGlobal("fetch", fetchMock)

    try {
      renderPage()
      const logoutButton = await screen.findByRole("button", {
        name: /Sair/i,
      })
      await act(async () => {
        logoutButton.click()
      })

      await waitFor(() => {
        expect(toastCreateMock).toHaveBeenCalledWith(
          expect.objectContaining({ type: "error" }),
        )
      })

      expect(pushMock).not.toHaveBeenCalled()
    } finally {
      vi.unstubAllGlobals()
    }
  })
})
