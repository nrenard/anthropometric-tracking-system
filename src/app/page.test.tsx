import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen, waitFor, cleanup } from "@testing-library/react"
import { ChakraProvider, defaultSystem } from "@chakra-ui/react"
import { ProfileProvider } from "@/lib/profile-context"
import HomePage from "./page"
import type { ProfileDTO } from "@/app/actions/profile-actions"
import type { DashboardData } from "@/hooks/use-dashboard-data"

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

const dashboardDataMock = vi.fn<() => DashboardData>()

vi.mock("@/hooks/use-dashboard-data", () => ({
  useDashboardData: () => dashboardDataMock(),
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock("recharts", () => {
  type ChildrenProps = { children?: React.ReactNode }
  return {
    ResponsiveContainer: ({ children }: ChildrenProps) => (
      <div data-testid="responsive-container">{children}</div>
    ),
    LineChart: ({ children }: ChildrenProps) => (
      <div data-testid="line-chart">{children}</div>
    ),
    CartesianGrid: () => null,
    Line: () => null,
    XAxis: () => null,
    YAxis: () => null,
    Tooltip: () => null,
  }
})

const actionsModule = (await import("@/app/actions/profile-actions")) as unknown as {
  __setProfiles: (next: ProfileDTO[]) => void
}

function defaultDashboardState(): DashboardData {
  const hasActive = document.cookie.includes("ACTIVE_PROFILE_ID=")
  return {
    profile: null,
    currentMeasurement: null,
    previousMeasurement: null,
    thirtyDayMeasurement: null,
    isLoading: hasActive,
    error: null,
    isEmpty: false,
    noProfile: !hasActive,
  }
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
  dashboardDataMock.mockReset()
  dashboardDataMock.mockImplementation(defaultDashboardState)
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

  it("renders skeleton placeholders while dashboard data is loading", async () => {
    const profile = sampleProfile()
    actionsModule.__setProfiles([profile])
    document.cookie = `ACTIVE_PROFILE_ID=${profile.id}; path=/`

    dashboardDataMock.mockReturnValue({
      profile: null,
      currentMeasurement: null,
      previousMeasurement: null,
      thirtyDayMeasurement: null,
      isLoading: true,
      error: null,
      isEmpty: false,
      noProfile: false,
    })

    renderHome()

    await waitFor(() => {
      expect(screen.getByTestId("dashboard-skeleton")).toBeDefined()
    })
  })

  it("renders empty-measurements CTA with link to /medir", async () => {
    const profile = sampleProfile()
    actionsModule.__setProfiles([profile])
    document.cookie = `ACTIVE_PROFILE_ID=${profile.id}; path=/`

    dashboardDataMock.mockReturnValue({
      profile: {
        _id: profile.id,
        name: profile.name,
        email: profile.email,
        dateOfBirth: profile.dateOfBirth,
        sex: profile.sex,
        defaultHeight: profile.defaultHeight,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
      },
      currentMeasurement: null,
      previousMeasurement: null,
      thirtyDayMeasurement: null,
      isLoading: false,
      error: null,
      isEmpty: true,
      noProfile: false,
    })

    renderHome()

    await waitFor(() => {
      expect(screen.getByText(/Registre sua primeira medição/i)).toBeDefined()
    })
    const link = screen.getByRole("link", { name: /Adicionar Medição/i }) as HTMLAnchorElement
    expect(link.getAttribute("href")).toBe("/medir")
  })

  it("renders dashboard sections when data is loaded", async () => {
    const profile = sampleProfile()
    actionsModule.__setProfiles([profile])
    document.cookie = `ACTIVE_PROFILE_ID=${profile.id}; path=/`

    const measuredAt = new Date("2026-04-01T12:00:00Z").toISOString()

    dashboardDataMock.mockReturnValue({
      profile: {
        _id: profile.id,
        name: profile.name,
        email: profile.email,
        dateOfBirth: profile.dateOfBirth,
        sex: profile.sex,
        defaultHeight: profile.defaultHeight,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
      },
      currentMeasurement: {
        _id: "m1",
        profileId: profile.id,
        measuredAt,
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
          neck: 38,
          waist: 75,
          hip: 95,
          arm: { left: 28, right: 28 },
          forearm: { left: 24, right: 24 },
          thigh: { left: 55, right: 55 },
          calf: { left: 36, right: 36 },
        },
        diameters: { humerus: 6.5, femur: 9.2 },
        createdAt: measuredAt,
        updatedAt: measuredAt,
      },
      previousMeasurement: null,
      thirtyDayMeasurement: null,
      isLoading: false,
      error: null,
      isEmpty: false,
      noProfile: false,
    })

    renderHome()

    await waitFor(() => {
      expect(screen.getByTestId("metric-card-weight")).toBeDefined()
    })
    expect(screen.getByTestId("metric-card-bodyfat")).toBeDefined()
    expect(screen.getByTestId("weight-chart-container")).toBeDefined()
    expect(screen.getByTestId("latest-weight")).toBeDefined()
  })

  it("renders an error alert with retry button when the hook reports an error", async () => {
    const profile = sampleProfile()
    actionsModule.__setProfiles([profile])
    document.cookie = `ACTIVE_PROFILE_ID=${profile.id}; path=/`

    dashboardDataMock.mockReturnValue({
      profile: null,
      currentMeasurement: null,
      previousMeasurement: null,
      thirtyDayMeasurement: null,
      isLoading: false,
      error: "Falha ao carregar dados",
      isEmpty: false,
      noProfile: false,
    })

    renderHome()

    await waitFor(() => {
      const alert = screen.getByRole("alert")
      expect(alert.textContent).toContain("Falha ao carregar dados")
    })
    expect(screen.getByRole("button", { name: /Tentar novamente/i })).toBeDefined()
  })
})
