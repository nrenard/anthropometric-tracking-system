import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen, waitFor, cleanup, act } from "@testing-library/react"
import { ChakraProvider, defaultSystem } from "@chakra-ui/react"
import { ProfileProvider } from "@/lib/profile-context"
import { ProfileSwitcher } from "@/components/profile-switcher"
import type { ProfileDTO } from "@/app/actions/profile-actions"

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
    createProfile: vi.fn(async (data) => {
      const created: ProfileDTO = {
        id: String(profilesRef.current.length + 9).padStart(24, "0"),
        name: data.name,
        email: data.email,
        dateOfBirth: data.dateOfBirth.toISOString(),
        sex: data.sex,
        defaultHeight: data.defaultHeight,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      profilesRef.current = [...profilesRef.current, created]
      return created
    }),
    deleteProfile: vi.fn(async (id: string) => {
      profilesRef.current = profilesRef.current.filter((p) => p.id !== id)
    }),
    getProfile: vi.fn(async (id: string) =>
      profilesRef.current.find((p) => p.id === id) ?? null,
    ),
  }
})

const actionsModule = (await import("@/app/actions/profile-actions")) as unknown as {
  __setProfiles: (next: ProfileDTO[]) => void
  deleteProfile: ReturnType<typeof vi.fn>
  createProfile: ReturnType<typeof vi.fn>
}

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <ChakraProvider value={defaultSystem}>
      <ProfileProvider>{ui}</ProfileProvider>
    </ChakraProvider>,
  )
}

beforeEach(() => {
  cleanup()
  document.cookie
    .split(";")
    .map((c) => c.trim().split("=")[0])
    .filter(Boolean)
    .forEach((name) => {
      document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
    })
  actionsModule.__setProfiles([])
  actionsModule.deleteProfile.mockClear()
  actionsModule.createProfile.mockClear()
})

describe("ProfileSwitcher", () => {
  it("renders nothing when there are zero profiles", async () => {
    const { container } = renderWithProviders(<ProfileSwitcher />)
    await waitFor(() => {
      expect(screen.queryByTestId("profile-switcher-pill")).toBeNull()
    })
    expect(container.querySelector("[data-testid='profile-switcher-pill']")).toBeNull()
  })

  it("shows the active profile name on the pill", async () => {
    const profile = sampleProfile()
    actionsModule.__setProfiles([profile])

    document.cookie = `ACTIVE_PROFILE_ID=${profile.id}; path=/`

    renderWithProviders(<ProfileSwitcher />)

    await waitFor(() => {
      expect(screen.getByTestId("profile-switcher-pill").textContent).toContain("Jane Doe")
    })
  })

  it("shows 'Selecionar perfil' when profiles exist but none is active", async () => {
    actionsModule.__setProfiles([sampleProfile()])

    renderWithProviders(<ProfileSwitcher />)

    await waitFor(() => {
      expect(screen.getByTestId("profile-switcher-pill").textContent).toContain("Selecionar perfil")
    })
  })

  it("opens the picker when the pill is clicked and lists every profile", async () => {
    actionsModule.__setProfiles([
      sampleProfile(),
      sampleProfile({ id: "222222222222222222222222", name: "John Roe", email: "john@example.com", sex: "M" }),
    ])

    renderWithProviders(<ProfileSwitcher />)

    const pill = await screen.findByTestId("profile-switcher-pill")
    await act(async () => {
      pill.click()
    })

    expect(screen.getByText("Jane Doe")).toBeDefined()
    expect(screen.getByText("John Roe")).toBeDefined()
    expect(screen.getByRole("button", { name: /Criar Perfil/i })).toBeDefined()
  })

  it("clicking a profile row sets it as active", async () => {
    const a = sampleProfile()
    const b = sampleProfile({ id: "222222222222222222222222", name: "John Roe", email: "john@example.com", sex: "M" })
    actionsModule.__setProfiles([a, b])

    renderWithProviders(<ProfileSwitcher />)

    const pill = await screen.findByTestId("profile-switcher-pill")
    await act(async () => {
      pill.click()
    })

    const selectButton = screen.getByRole("button", { name: /Selecionar John Roe/i })
    await act(async () => {
      selectButton.click()
    })

    await waitFor(() => {
      expect(screen.getByTestId("profile-switcher-pill").textContent).toContain("John Roe")
    })
  })

  it("delete asks for confirmation, then removes the profile on confirm", async () => {
    const a = sampleProfile()
    actionsModule.__setProfiles([a])

    renderWithProviders(<ProfileSwitcher />)

    const pill = await screen.findByTestId("profile-switcher-pill")
    await act(async () => {
      pill.click()
    })

    const deleteButton = screen.getByRole("button", { name: /Excluir Jane Doe/i })
    await act(async () => {
      deleteButton.click()
    })

    expect(screen.getByText(/Tem certeza\?/i)).toBeDefined()

    const confirm = screen.getByRole("button", { name: /^Confirmar$/i })
    await act(async () => {
      confirm.click()
    })

    await waitFor(() => {
      expect(actionsModule.deleteProfile).toHaveBeenCalledWith(a.id)
    })
  })
})
