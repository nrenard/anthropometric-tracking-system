import { runStartup } from "@/lib/startup"

declare global {
  var __startupRan: boolean | undefined
}

export async function StartupRunner() {
  if (!global.__startupRan) {
    global.__startupRan = true
    await runStartup()
  }
  return null
}
