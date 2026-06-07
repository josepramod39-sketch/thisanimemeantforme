import { useEffect, useState } from 'react'
import type { AiringEntry } from '../lib/types'
import { upcomingSchedule } from '../lib/anilist'

export interface CalendarDay {
  date: Date
  key: string
  entries: AiringEntry[]
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

/** Fetches the next `days` of AniList airing schedule, grouped by local day. */
export function useAiringCalendar(days = 7) {
  const [calendar, setCalendar] = useState<CalendarDay[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      const now = Math.floor(Date.now() / 1000)
      const to = now + days * 86400

      // Pre-build empty buckets for each day so the grid is stable.
      const buckets: CalendarDay[] = []
      const start = new Date()
      start.setHours(0, 0, 0, 0)
      for (let i = 0; i < days; i++) {
        const d = new Date(start)
        d.setDate(start.getDate() + i)
        buckets.push({ date: d, key: dayKey(d), entries: [] })
      }
      const byKey = new Map(buckets.map((b) => [b.key, b]))

      setLoading(true)
      setError(null)
      try {
        const entries = await upcomingSchedule(now, to)
        if (cancelled) return
        for (const e of entries) {
          const d = new Date(e.airingAt * 1000)
          const bucket = byKey.get(dayKey(d))
          if (bucket) bucket.entries.push(e)
        }
        setCalendar(buckets)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load schedule.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void run()
    return () => { cancelled = true }
  }, [days])

  return { calendar, loading, error }
}
