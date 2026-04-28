const MS_PER_DAY = 24 * 60 * 60 * 1000

export interface DatedItem {
  measuredAt: Date
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
