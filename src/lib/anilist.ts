// AniList GraphQL client. Public API, no key required.
// Docs: https://docs.anilist.co/  — endpoint is CORS-open for browser use.
import type { AnimeRef, AiringEntry } from './types'

const ENDPOINT = 'https://graphql.anilist.co'

interface MediaNode {
  id: number
  title: { romaji?: string; english?: string | null }
  coverImage: { medium?: string; large?: string; color?: string | null }
  format?: string | null
  studios?: { nodes: { name: string }[] }
  trailer?: { id: string; site: string; thumbnail?: string | null } | null
}

const cache = new Map<string, unknown>()

async function gql<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const key = query + JSON.stringify(variables)
  if (cache.has(key)) return cache.get(key) as T

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ query, variables }),
  })
  if (!res.ok) {
    throw new Error(`AniList ${res.status}: ${res.statusText}`)
  }
  const json = await res.json()
  if (json.errors) {
    throw new Error(json.errors[0]?.message ?? 'AniList query failed')
  }
  cache.set(key, json.data)
  return json.data as T
}

function toAnimeRef(m: MediaNode): AnimeRef {
  return {
    anilistId: m.id,
    title: m.title.english || m.title.romaji || 'Untitled',
    coverUrl: m.coverImage.large || m.coverImage.medium,
    coverColor: m.coverImage.color ?? null,
    format: m.format ?? null,
    studio: m.studios?.nodes?.[0]?.name ?? null,
    trailer: m.trailer
      ? { id: m.trailer.id, site: m.trailer.site, thumbnail: m.trailer.thumbnail ?? null }
      : null,
  }
}

const SEARCH_QUERY = `
query ($search: String) {
  Page(perPage: 8) {
    media(search: $search, type: ANIME, sort: SEARCH_MATCH, isAdult: false) {
      id
      title { romaji english }
      coverImage { medium large color }
      format
      studios(isMain: true) { nodes { name } }
      trailer { id site thumbnail }
    }
  }
}`

export async function searchAnime(search: string): Promise<AnimeRef[]> {
  const q = search.trim()
  if (q.length < 2) return []
  const data = await gql<{ Page: { media: MediaNode[] } }>(SEARCH_QUERY, { search: q })
  return data.Page.media.map(toAnimeRef)
}

const SCHEDULE_QUERY = `
query ($from: Int, $to: Int, $page: Int) {
  Page(perPage: 50, page: $page) {
    pageInfo { hasNextPage }
    airingSchedules(airingAt_greater: $from, airingAt_lesser: $to, sort: TIME) {
      id
      episode
      airingAt
      media {
        id
        title { romaji english }
        coverImage { medium large color }
        format
        studios(isMain: true) { nodes { name } }
        trailer { id site thumbnail }
        isAdult
      }
    }
  }
}`

export async function upcomingSchedule(fromSecs: number, toSecs: number): Promise<AiringEntry[]> {
  const entries: AiringEntry[] = []
  // AniList paginates at 50; pull up to 3 pages (~150 entries) for a week view.
  for (let page = 1; page <= 3; page++) {
    const data = await gql<{
      Page: { pageInfo: { hasNextPage: boolean }; airingSchedules: Array<{ id: number; episode: number; airingAt: number; media: MediaNode & { isAdult?: boolean } }> }
    }>(SCHEDULE_QUERY, { from: fromSecs, to: toSecs, page })
    for (const s of data.Page.airingSchedules) {
      if (s.media?.isAdult) continue
      entries.push({ id: s.id, episode: s.episode, airingAt: s.airingAt, anime: toAnimeRef(s.media) })
    }
    if (!data.Page.pageInfo.hasNextPage) break
  }
  return entries
}
