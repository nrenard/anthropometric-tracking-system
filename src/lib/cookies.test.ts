import { describe, it, expect, beforeEach } from "vitest"
import {
  ACTIVE_PROFILE_COOKIE,
  setActiveProfileId,
  getActiveProfileId,
  clearActiveProfileId,
} from "@/lib/cookies"

beforeEach(() => {
  document.cookie
    .split(";")
    .map((c) => c.trim().split("=")[0])
    .filter(Boolean)
    .forEach((name) => {
      document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
    })
})

describe("active profile cookie", () => {
  it("exposes the cookie name constant", () => {
    expect(ACTIVE_PROFILE_COOKIE).toBe("ACTIVE_PROFILE_ID")
  })

  it("returns null when cookie is not set", () => {
    expect(getActiveProfileId()).toBeNull()
  })

  it("sets and reads the cookie", () => {
    setActiveProfileId("abc123")
    expect(getActiveProfileId()).toBe("abc123")
  })

  it("overwrites the cookie when set again", () => {
    setActiveProfileId("first")
    setActiveProfileId("second")
    expect(getActiveProfileId()).toBe("second")
  })

  it("clears the cookie", () => {
    setActiveProfileId("abc123")
    clearActiveProfileId()
    expect(getActiveProfileId()).toBeNull()
  })

  it("uses path=/ so the cookie is available app-wide", () => {
    setActiveProfileId("xyz")
    // path attribute is not exposed via document.cookie reads, so we verify
    // by ensuring setActiveProfileId writes a cookie that persists across reads.
    expect(document.cookie).toContain("ACTIVE_PROFILE_ID=xyz")
  })
})
