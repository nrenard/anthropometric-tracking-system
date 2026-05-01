const MS_PER_DAY = 24 * 60 * 60 * 1000

export interface DatedItem {
  measuredAt: Date
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso)
  const dd = String(d.getDate()).padStart(2, "0")
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const yyyy = d.getFullYear()
  const hh = String(d.getHours()).padStart(2, "0")
  const min = String(d.getMinutes()).padStart(2, "0")
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`
}

export function subDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() - days)
  return result
}

export function subMonths(date: Date, months: number): Date {
  const result = new Date(date)
  result.setMonth(result.getMonth() - months)
  return result
}

export function subYears(date: Date, years: number): Date {
  const result = new Date(date)
  result.setFullYear(result.getFullYear() - years)
  return result
}

export function findClosestMeasurement<T extends DatedItem>(
  target: Date,
  candidates: readonly T[],
  toleranceDays: number,
  exclude?: T,
): T | null {
  const targetMs = target.getTime()
  let best: { item: T; diffDays: number } | null = null

  for (const candidate of candidates) {
    if (exclude && candidate === exclude) continue
    const diffDays = Math.abs(candidate.measuredAt.getTime() - targetMs) / MS_PER_DAY
    if (diffDays > toleranceDays) continue
    if (!best || diffDays < best.diffDays) {
      best = { item: candidate, diffDays }
    }
  }

  return best?.item ?? null
}
