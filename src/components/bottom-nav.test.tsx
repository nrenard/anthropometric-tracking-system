import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen, waitFor, cleanup } from "@testing-library/react"
import { ChakraProvider, defaultSystem } from "@chakra-ui/react"
import { ProfileProvider } from "@/lib/profile-context"
import { BottomNav } from "./bottom-nav"
import type { ProfileDTO } from "@/app/actions/profile-actions"

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

function renderWithProviders() {
  return render(
    <ChakraProvider value={defaultSystem}>
      <ProfileProvider>
        <BottomNav />
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
  actionsModule.getProfiles.mockClear()
})

describe("BottomNav", () => {
  it("renders all 5 nav links", async () => {
    renderWithProviders()

    await waitFor(() => {
      const links = screen.getAllByRole("link")
      expect(links).toHaveLength(5)
    })

    const labels = screen.getAllByRole("link").map((link) => link.textContent)
    expect(labels).toContain("Início")
    expect(labels).toContain("Medir")
    expect(labels).toContain("Histórico")
    expect(labels).toContain("Perfis")
    expect(labels).toContain("Gráficos")
  })

  it("renders Gráficos link with href /graficos", async () => {
    renderWithProviders()

    await waitFor(() => {
      expect(screen.getByText("Gráficos")).toBeDefined()
    })

    const graficosLink = screen.getByText("Gráficos").closest("a")
    expect(graficosLink).toBeTruthy()
    expect(graficosLink!.getAttribute("href")).toBe("/graficos")
  })
})
