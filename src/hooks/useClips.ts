import { useEffect, useState } from 'react'
import type { ClipRecord } from '../lib/types'
import { listClips } from '../lib/db'
import { YOUTUBE_CLIPS } from '../data/youtubeClips'

// Static fallback if the DB is unreachable, so the theater never goes blank.
const FALLBACK: ClipRecord[] = YOUTUBE_CLIPS.map((c, i) => ({
  id: c.id,
  kind: c.kind,
  title: c.title,
  channel: c.channel,
  channelUrl: c.channelUrl,
  thumbnail: c.thumbnail,
  sort: i,
  enabled: true,
}))

let cache: ClipRecord[] | null = null

export function useClips(): ClipRecord[] {
  const [clips, setClips] = useState<ClipRecord[]>(cache ?? [])
  useEffect(() => {
    if (cache) return
    let active = true
    listClips()
      .then((c) => {
        const list = c.length ? c : FALLBACK
        cache = list
        if (active) setClips(list)
      })
      .catch(() => {
        cache = FALLBACK
        if (active) setClips(FALLBACK)
      })
    return () => { active = false }
  }, [])
  return clips
}

export function invalidateClips() {
  cache = null
}
