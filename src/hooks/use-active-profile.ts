"use client"

import { useContext } from "react"
import { ProfileContext, type ProfileContextValue } from "@/lib/profile-context"

export function useActiveProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext)
  if (!ctx) {
    throw new Error("useActiveProfile must be used within a ProfileProvider")
  }
  return ctx
}
