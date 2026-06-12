// Small formatting helpers shared across the UI.

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

/** "3 days ago", "just now" — compact relative time from an ISO string. */
export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ''
  const secs = Math.max(0, Math.floor((Date.now() - then) / 1000))
  if (secs < 60) return 'just now'
  const mins = Math.floor(secs / 60)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  const weeks = Math.floor(days / 7)
  if (weeks < 5) return `${weeks}w ago`
  const d = new Date(then)
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`
}

/** Countdown like "2d 4h" / "3h 12m" / "8m" until a unix-seconds timestamp. */
export function countdown(airingAtSecs: number): string {
  const diff = airingAtSecs * 1000 - Date.now()
  if (diff <= 0) return 'aired'
  const mins = Math.floor(diff / 60000)
  const days = Math.floor(mins / 1440)
  const hrs = Math.floor((mins % 1440) / 60)
  const m = mins % 60
  if (days > 0) return `${days}d ${hrs}h`
  if (hrs > 0) return `${hrs}h ${m}m`
  return `${m}m`
}

export function dayLabel(date: Date): { weekday: string; date: string } {
  const weekday = date.toLocaleDateString(undefined, { weekday: 'short' })
  return { weekday, date: `${MONTHS[date.getMonth()]} ${date.getDate()}` }
}

/** Deterministic 0–360 hue from a string, for fallback gradients. */
export function hueFromString(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360
  return h
}

export function initials(title: string): string {
  const words = title.replace(/[^\p{L}\p{N} ]/gu, '').trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return '?'
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[1][0]).toUpperCase()
}

/** mm:ss clock from seconds (video scrubber/labels). */
export function clock(t: number): string {
  if (!Number.isFinite(t) || t < 0) return '0:00'
  const m = Math.floor(t / 60)
  const s = Math.floor(t % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

/** True only for http(s) URLs — guards user/admin-entered links rendered into href. */
export function isHttpUrl(u: string | null | undefined): boolean {
  return !!u && /^https?:\/\//i.test(u)
}
