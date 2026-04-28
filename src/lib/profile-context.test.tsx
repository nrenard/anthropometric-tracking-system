import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen, waitFor, act, cleanup } from "@testing-library/react"
import { ProfileProvider } from "@/lib/profile-context"
import { useActiveProfile } from "@/hooks/use-active-profile"
import { setActiveProfileId, getActiveProfileId } from "@/lib/cookies"
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
      const created = {
        id: String(profilesRef.current.length + 1).padStart(24, "0"),
        name: data.name,
        email: data.email,
        dateOfBirth: data.dateOfBirth.toISOString(),
        sex: data.sex,
        defaultHeight: data.defaultHeight,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } satisfies ProfileDTO
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
}

function ConsumerProbe() {
  const { activeProfileId, profiles, activeProfile, isLoading } = useActiveProfile()
  return (
    <div>
      <div data-testid="loading">{isLoading ? "loading" : "ready"}</div>
      <div data-testid="active-id">{activeProfileId ?? "none"}</div>
      <div data-testid="active-name">{activeProfile?.name ?? "none"}</div>
      <div data-testid="count">{profiles.length}</div>
    </div>
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

describe("ProfileProvider + useActiveProfile", () => {
  it("loads profiles from server actions on mount", async () => {
    actionsModule.__setProfiles([sampleProfile()])
    render(
      <ProfileProvider>
        <ConsumerProbe />
      </ProfileProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId("loading").textContent).toBe("ready")
    })
    expect(screen.getByTestId("count").textContent).toBe("1")
  })

  it("reads ACTIVE_PROFILE_ID cookie on mount and resolves the active profile", async () => {
    const profile = sampleProfile()
    actionsModule.__setProfiles([profile])
    setActiveProfileId(profile.id)

    render(
      <ProfileProvider>
        <ConsumerProbe />
      </ProfileProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId("active-id").textContent).toBe(profile.id)
    })
    expect(screen.getByTestId("active-name").textContent).toBe("Jane Doe")
  })

  it("clears stale cookie when active profile no longer exists", async () => {
    setActiveProfileId("999999999999999999999999")
    actionsModule.__setProfiles([sampleProfile()])

    render(
      <ProfileProvider>
        <ConsumerProbe />
      </ProfileProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId("loading").textContent).toBe("ready")
    })
    expect(screen.getByTestId("active-id").textContent).toBe("none")
    expect(getActiveProfileId()).toBeNull()
  })

  it("setActiveProfileId on the context updates state and cookie", async () => {
    const profile = sampleProfile()
    actionsModule.__setProfiles([profile])

    function Switcher() {
      const { setActiveProfileId: setId, activeProfileId } = useActiveProfile()
      return (
        <button onClick={() => setId(profile.id)}>
          {activeProfileId ?? "none"}
        </button>
      )
    }

    render(
      <ProfileProvider>
        <Switcher />
      </ProfileProvider>,
    )

    const button = await screen.findByRole("button")
    await act(async () => {
      button.click()
    })

    await waitFor(() => {
      expect(getActiveProfileId()).toBe(profile.id)
    })
    expect(button.textContent).toBe(profile.id)
  })
})
