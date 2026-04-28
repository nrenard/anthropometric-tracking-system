export const ACTIVE_PROFILE_COOKIE = "ACTIVE_PROFILE_ID"

const THIRTY_DAYS_SECONDS = 60 * 60 * 24 * 30

export function setActiveProfileId(profileId: string): void {
  if (typeof document === "undefined") return
  document.cookie = `${ACTIVE_PROFILE_COOKIE}=${encodeURIComponent(profileId)}; path=/; max-age=${THIRTY_DAYS_SECONDS}; samesite=lax`
}

export function getActiveProfileId(): string | null {
  if (typeof document === "undefined") return null
  const cookies = document.cookie ? document.cookie.split("; ") : []
  for (const cookie of cookies) {
    const eq = cookie.indexOf("=")
    if (eq === -1) continue
    const name = cookie.slice(0, eq)
    if (name === ACTIVE_PROFILE_COOKIE) {
      const value = cookie.slice(eq + 1)
      return value ? decodeURIComponent(value) : null
    }
  }
  return null
}

export function clearActiveProfileId(): void {
  if (typeof document === "undefined") return
  document.cookie = `${ACTIVE_PROFILE_COOKIE}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
}
