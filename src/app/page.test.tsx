import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen, waitFor, cleanup } from "@testing-library/react"
import { ChakraProvider, defaultSystem } from "@chakra-ui/react"
import { ProfileProvider } from "@/lib/profile-context"
import HomePage from "./page"
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

function renderHome() {
  return render(
    <ChakraProvider value={defaultSystem}>
      <ProfileProvider>
        <HomePage />
      </ProfileProvider>
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
})

describe("HomePage", () => {
  it("shows the empty state and create CTA when no profiles exist", async () => {
    renderHome()

    await waitFor(() => {
      expect(screen.getByText(/Nenhum perfil selecionado/i)).toBeDefined()
    })
    expect(screen.getByRole("button", { name: /Criar Perfil/i })).toBeDefined()
  })

  it("shows 'Nenhum perfil selecionado' when profiles exist but none active", async () => {
    actionsModule.__setProfiles([sampleProfile()])
    renderHome()

    await waitFor(() => {
      expect(screen.getByText(/Nenhum perfil selecionado/i)).toBeDefined()
    })
  })

  it("shows the active profile name when a profile is selected", async () => {
    const profile = sampleProfile()
    actionsModule.__setProfiles([profile])
    document.cookie = `ACTIVE_PROFILE_ID=${profile.id}; path=/`

    renderHome()

    await waitFor(() => {
      expect(screen.getByTestId("active-profile-name").textContent).toContain("Jane Doe")
    })
  })
})
