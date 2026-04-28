"use client"

import { useEffect, useState } from "react"
import { useActiveProfile } from "@/hooks/use-active-profile"
import { findClosestMeasurement } from "@/lib/date-utils"

export interface DashboardProfile {
  _id: string
  name: string
  email: string
  dateOfBirth: string
  sex: "M" | "F"
  defaultHeight: number
  createdAt: string
  updatedAt: string
}

export interface DashboardMeasurement {
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
    neck: number
    waist: number
    hip: number
    abdomen?: number
    chest?: number
    arm: { left: number; right: number }
    forearm: { left: number; right: number }
    thigh: { left: number; right: number }
    calf: { left: number; right: number }
  }
  diameters?: { humerus: number; femur: number }
  createdAt: string
  updatedAt: string
}

interface DatedMeasurement {
  measurement: DashboardMeasurement
  measuredAt: Date
}

export interface DashboardData {
  profile: DashboardProfile | null
  currentMeasurement: DashboardMeasurement | null
  previousMeasurement: DashboardMeasurement | null
  thirtyDayMeasurement: DashboardMeasurement | null
  isLoading: boolean
  error: string | null
  isEmpty: boolean
  noProfile: boolean
}

const MS_PER_DAY = 24 * 60 * 60 * 1000
const THIRTY_DAY_TOLERANCE_DAYS = 3

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`)
  }
  return (await response.json()) as T
}

function resolveThirtyDayMeasurement(
  current: DatedMeasurement,
  candidates: readonly DatedMeasurement[],
): DashboardMeasurement | null {
  const target = new Date(current.measuredAt.getTime() - 30 * MS_PER_DAY)
  const match = findClosestMeasurement(
    target,
    candidates,
    THIRTY_DAY_TOLERANCE_DAYS,
    current,
  )
  return match?.measurement ?? null
}

interface FetchResult {
  profileId: string
  profile: DashboardProfile | null
  measurements: DashboardMeasurement[]
  error: string | null
}

export function useDashboardData(): DashboardData {
  const { activeProfileId } = useActiveProfile()
  const [result, setResult] = useState<FetchResult | null>(null)

  useEffect(() => {
    if (!activeProfileId) return

    let cancelled = false
    ;(async () => {
      try {
        const measurementsUrl = `/api/measurements?profileId=${encodeURIComponent(
          activeProfileId,
        )}&limit=3&sort=desc`
        const [profileData, measurementsData] = await Promise.all([
          fetchJson<DashboardProfile>(`/api/profiles/${activeProfileId}`),
          fetchJson<DashboardMeasurement[]>(measurementsUrl),
        ])
        if (cancelled) return
        setResult({
          profileId: activeProfileId,
          profile: profileData,
          measurements: measurementsData,
          error: null,
        })
      } catch (err) {
        if (cancelled) return
        const message =
          err instanceof Error ? err.message : "Erro ao carregar dashboard"
        setResult({
          profileId: activeProfileId,
          profile: null,
          measurements: [],
          error: message,
        })
      }
    })()

    return () => {
      cancelled = true
    }
  }, [activeProfileId])

  const noProfile = !activeProfileId
  const resultMatchesActive = result?.profileId === activeProfileId
  const profile = resultMatchesActive ? result?.profile ?? null : null
  const measurements = resultMatchesActive ? result?.measurements ?? [] : []
  const error = resultMatchesActive ? result?.error ?? null : null
  const isLoading = !noProfile && !resultMatchesActive
  const isEmpty = !noProfile && profile !== null && measurements.length === 0

  const dated: DatedMeasurement[] = measurements.map((measurement) => ({
    measurement,
    measuredAt: new Date(measurement.measuredAt),
  }))

  const currentDated = dated[0] ?? null
  const previousDated = dated[1] ?? null
  const thirtyDayMeasurement = currentDated
    ? resolveThirtyDayMeasurement(currentDated, dated)
    : null

  return {
    profile,
    currentMeasurement: currentDated?.measurement ?? null,
    previousMeasurement: previousDated?.measurement ?? null,
    thirtyDayMeasurement,
    isLoading,
    error,
    isEmpty,
    noProfile,
  }
}
