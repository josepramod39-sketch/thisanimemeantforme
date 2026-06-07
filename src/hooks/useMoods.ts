import { useEffect, useState } from 'react'
import type { Mood } from '../lib/types'
import { listMoods } from '../lib/db'

// Moods rarely change; cache them across the session.
let cache: Mood[] | null = null

export function useMoods(): Mood[] {
  const [moods, setMoods] = useState<Mood[]>(cache ?? [])
  useEffect(() => {
    if (cache) return
    let active = true
    listMoods()
      .then((m) => {
        cache = m
        if (active) setMoods(m)
      })
      .catch(() => {})
    return () => { active = false }
  }, [])
  return moods
}

/** Clear the cache so a fresh list is fetched (after admin edits). */
export function invalidateMoods() {
  cache = null
}
