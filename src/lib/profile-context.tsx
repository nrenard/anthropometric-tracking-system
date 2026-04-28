"use client"

import { createContext, useCallback, useEffect, useMemo, useState } from "react"
import {
  getProfiles,
  type ProfileDTO,
} from "@/app/actions/profile-actions"
import {
  getActiveProfileId as readCookie,
  setActiveProfileId as writeCookie,
  clearActiveProfileId as clearCookie,
} from "@/lib/cookies"

export interface ProfileContextValue {
  profiles: ProfileDTO[]
  activeProfileId: string | null
  activeProfile: ProfileDTO | null
  isLoading: boolean
  setActiveProfileId: (id: string | null) => void
  refreshProfiles: () => Promise<void>
}

export const ProfileContext = createContext<ProfileContextValue | null>(null)

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profiles, setProfiles] = useState<ProfileDTO[]>([])
  const [activeProfileId, setActiveProfileIdState] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshProfiles = useCallback(async () => {
    const next = await getProfiles()
    setProfiles(next)
    return next
  }, [])

  const setActiveProfileId = useCallback((id: string | null) => {
    if (id) {
      writeCookie(id)
    } else {
      clearCookie()
    }
    setActiveProfileIdState(id)
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const next = await refreshProfiles()
        if (cancelled) return
        const cookieId = readCookie()
        if (cookieId && next.some((p) => p.id === cookieId)) {
          setActiveProfileIdState(cookieId)
        } else if (cookieId) {
          clearCookie()
          setActiveProfileIdState(null)
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [refreshProfiles])

  const activeProfile = useMemo(
    () => profiles.find((p) => p.id === activeProfileId) ?? null,
    [profiles, activeProfileId],
  )

  const value = useMemo<ProfileContextValue>(
    () => ({
      profiles,
      activeProfileId,
      activeProfile,
      isLoading,
      setActiveProfileId,
      refreshProfiles: async () => {
        await refreshProfiles()
      },
    }),
    [profiles, activeProfileId, activeProfile, isLoading, setActiveProfileId, refreshProfiles],
  )

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  )
}
