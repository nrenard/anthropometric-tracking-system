import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"

const useActiveProfileMock = vi.fn()

vi.mock("@/hooks/use-active-profile", () => ({
  useActiveProfile: () => useActiveProfileMock(),
}))

import { useDashboardData } from "./use-dashboard-data"

const PROFILE_ID = "111111111111111111111111"

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
  weight: number
  height?: number
  createdAt: string
  updatedAt: string
}

const sampleProfile: ProfileResponse = {
  _id: PROFILE_ID,
  name: "Jane Doe",
  email: "jane@example.com",
  dateOfBirth: "1990-01-15T00:00:00.000Z",
  sex: "F",
  defaultHeight: 170,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
}

function buildMeasurement(
  id: string,
  measuredAt: string,
  weight = 70,
): MeasurementResponse {
  return {
    _id: id,
    profileId: PROFILE_ID,
    measuredAt,
    weight,
    height: 170,
    createdAt: measuredAt,
    updatedAt: measuredAt,
  }
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

function mockFetchSequence(...responses: Response[]): ReturnType<typeof vi.fn> {
  const fetchMock = vi.fn()
  for (const res of responses) {
    fetchMock.mockResolvedValueOnce(res)
  }
  return fetchMock
}

beforeEach(() => {
  useActiveProfileMock.mockReset()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("useDashboardData", () => {
  it("returns noProfile=true and does not fetch when no active profile id", async () => {
    useActiveProfileMock.mockReturnValue({ activeProfileId: null })
    const fetchMock = vi.fn()
    vi.stubGlobal("fetch", fetchMock)

    const { result } = renderHook(() => useDashboardData())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.noProfile).toBe(true)
    expect(result.current.profile).toBeNull()
    expect(result.current.currentMeasurement).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("loads profile and measurements when active profile id is present", async () => {
    useActiveProfileMock.mockReturnValue({ activeProfileId: PROFILE_ID })
    const measurements = [
      buildMeasurement("m1", "2026-04-01T00:00:00.000Z", 70),
      buildMeasurement("m2", "2026-03-25T00:00:00.000Z", 71),
      buildMeasurement("m3", "2026-03-02T00:00:00.000Z", 72),
    ]
    vi.stubGlobal(
      "fetch",
      mockFetchSequence(jsonResponse(sampleProfile), jsonResponse(measurements)),
    )

    const { result } = renderHook(() => useDashboardData())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBeNull()
    expect(result.current.noProfile).toBe(false)
    expect(result.current.isEmpty).toBe(false)
    expect(result.current.profile?._id).toBe(PROFILE_ID)
    expect(result.current.currentMeasurement?._id).toBe("m1")
    expect(result.current.previousMeasurement?._id).toBe("m2")
    expect(result.current.thirtyDayMeasurement?._id).toBe("m3")
  })

  it("starts in a loading state before fetch resolves", async () => {
    useActiveProfileMock.mockReturnValue({ activeProfileId: PROFILE_ID })
    let resolveProfile: ((value: Response) => void) | undefined
    const profilePromise = new Promise<Response>((resolve) => {
      resolveProfile = resolve
    })
    const fetchMock = vi
      .fn()
      .mockReturnValueOnce(profilePromise)
      .mockResolvedValueOnce(jsonResponse([]))
    vi.stubGlobal("fetch", fetchMock)

    const { result } = renderHook(() => useDashboardData())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(true)
    })

    resolveProfile?.(jsonResponse(sampleProfile))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })
  })

  it("sets error when fetch rejects", async () => {
    useActiveProfileMock.mockReturnValue({ activeProfileId: PROFILE_ID })
    const fetchMock = vi.fn().mockRejectedValue(new Error("network down"))
    vi.stubGlobal("fetch", fetchMock)

    const { result } = renderHook(() => useDashboardData())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).not.toBeNull()
    expect(result.current.profile).toBeNull()
  })

  it("sets error when response is not OK", async () => {
    useActiveProfileMock.mockReturnValue({ activeProfileId: PROFILE_ID })
    vi.stubGlobal(
      "fetch",
      mockFetchSequence(
        jsonResponse({ error: "boom" }, { ok: false, status: 500 }),
        jsonResponse([]),
      ),
    )

    const { result } = renderHook(() => useDashboardData())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).not.toBeNull()
  })

  it("flags isEmpty when profile loads but measurements are empty", async () => {
    useActiveProfileMock.mockReturnValue({ activeProfileId: PROFILE_ID })
    vi.stubGlobal(
      "fetch",
      mockFetchSequence(jsonResponse(sampleProfile), jsonResponse([])),
    )

    const { result } = renderHook(() => useDashboardData())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.isEmpty).toBe(true)
    expect(result.current.profile?._id).toBe(PROFILE_ID)
    expect(result.current.currentMeasurement).toBeNull()
    expect(result.current.previousMeasurement).toBeNull()
    expect(result.current.thirtyDayMeasurement).toBeNull()
  })

  it("returns null thirtyDayMeasurement when no candidate within ±3 days of -30d", async () => {
    useActiveProfileMock.mockReturnValue({ activeProfileId: PROFILE_ID })
    const measurements = [
      buildMeasurement("m1", "2026-04-01T00:00:00.000Z"),
      buildMeasurement("m2", "2026-03-29T00:00:00.000Z"),
      buildMeasurement("m3", "2026-03-25T00:00:00.000Z"),
    ]
    vi.stubGlobal(
      "fetch",
      mockFetchSequence(jsonResponse(sampleProfile), jsonResponse(measurements)),
    )

    const { result } = renderHook(() => useDashboardData())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.thirtyDayMeasurement).toBeNull()
  })

  it("picks the closest candidate when two are within the ±3 day window", async () => {
    useActiveProfileMock.mockReturnValue({ activeProfileId: PROFILE_ID })
    const measurements = [
      buildMeasurement("m1", "2026-04-01T00:00:00.000Z"),
      buildMeasurement("m2", "2026-03-04T00:00:00.000Z"),
      buildMeasurement("m3", "2026-03-02T00:00:00.000Z"),
    ]
    vi.stubGlobal(
      "fetch",
      mockFetchSequence(jsonResponse(sampleProfile), jsonResponse(measurements)),
    )

    const { result } = renderHook(() => useDashboardData())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.thirtyDayMeasurement?._id).toBe("m3")
  })

  it("requests the measurements endpoint with profileId, limit and desc sort", async () => {
    useActiveProfileMock.mockReturnValue({ activeProfileId: PROFILE_ID })
    const fetchMock = mockFetchSequence(
      jsonResponse(sampleProfile),
      jsonResponse([]),
    )
    vi.stubGlobal("fetch", fetchMock)

    renderHook(() => useDashboardData())

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2)
    })

    const urls = fetchMock.mock.calls.map((call) => String(call[0]))
    expect(urls.some((u) => u === `/api/profiles/${PROFILE_ID}`)).toBe(true)
    const measurementsUrl = urls.find((u) => u.startsWith("/api/measurements"))
    expect(measurementsUrl).toBeDefined()
    expect(measurementsUrl).toContain(`profileId=${PROFILE_ID}`)
    expect(measurementsUrl).toContain("limit=3")
    expect(measurementsUrl).toContain("sort=desc")
  })
})
