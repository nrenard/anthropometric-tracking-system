import crypto from "crypto"
import { cookies } from "next/headers"
import { getIronSession, type SessionOptions } from "iron-session"

export interface SessionData {
  isAuthenticated?: boolean
}

export const SESSION_COOKIE_NAME = "anthropometric-session"

const sessionPassword =
  process.env.SESSION_SECRET || crypto.randomBytes(32).toString("base64")

export const sessionOptions: SessionOptions = {
  password: sessionPassword,
  cookieName: SESSION_COOKIE_NAME,
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: undefined,
  },
}

export async function getSession() {
  return getIronSession<SessionData>(await cookies(), sessionOptions)
}
