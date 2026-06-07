import type { AnimeTrailer } from './types'

/** Build an embeddable player URL from an AniList trailer reference. */
export function trailerEmbedUrl(trailer: AnimeTrailer): string | null {
  if (!trailer?.id) return null
  if (trailer.site === 'youtube') {
    return `https://www.youtube-nocookie.com/embed/${trailer.id}?autoplay=1&rel=0`
  }
  if (trailer.site === 'dailymotion') {
    return `https://www.dailymotion.com/embed/video/${trailer.id}?autoplay=1`
  }
  return null
}

/** Privacy-friendly YouTube embed URL (used as a fallback / for the trailer modal). */
export function youtubeEmbedUrl(id: string): string {
  return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`
}

/** Public watch URL — for "Watch on YouTube" credit links. */
export function youtubeWatchUrl(id: string): string {
  return `https://www.youtube.com/watch?v=${id}`
}
