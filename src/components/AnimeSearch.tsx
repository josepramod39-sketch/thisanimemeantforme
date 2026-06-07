import { useEffect, useState } from 'react'
import type { AnimeRef } from '../lib/types'
import { searchAnime } from '../lib/anilist'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { hueFromString, initials } from '../lib/format'
import { SearchIcon } from './icons'
import styles from './AnimeSearch.module.css'

interface AnimeSearchProps {
  onSelect: (anime: AnimeRef) => void
}

export default function AnimeSearch({ onSelect }: AnimeSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<AnimeRef[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const debounced = useDebouncedValue(query, 320)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      const q = debounced.trim()
      if (q.length < 2) {
        setResults([])
        setLoading(false)
        return
      }
      setLoading(true)
      setError(null)
      try {
        const res = await searchAnime(q)
        if (!cancelled) setResults(res)
      } catch {
        if (!cancelled) setError('Could not reach AniList. Try again.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void run()
    return () => { cancelled = true }
  }, [debounced])

  return (
    <div className={styles.wrap}>
      <div className={styles.field}>
        <SearchIcon className={styles.searchIcon} />
        <input
          className={styles.input}
          placeholder="Search an anime…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
      </div>

      {loading && <p className={styles.hint}>Searching…</p>}
      {error && <p className={styles.error}>{error}</p>}
      {!loading && !error && debounced.trim().length >= 2 && results.length === 0 && (
        <p className={styles.hint}>No matches. Try another spelling.</p>
      )}

      <ul className={styles.list}>
        {results.map((a) => {
          const hue = hueFromString(a.title)
          return (
            <li key={a.anilistId}>
              <button className={styles.row} onClick={() => onSelect(a)}>
                {a.coverUrl ? (
                  <img className={styles.thumb} src={a.coverUrl} alt="" loading="lazy" />
                ) : (
                  <span className={styles.thumb} style={{ background: `hsl(${hue},65%,60%)` }}>
                    {initials(a.title)}
                  </span>
                )}
                <span className={styles.meta}>
                  <span className={styles.name}>{a.title}</span>
                  <span className={styles.sub}>{[a.studio, a.format].filter(Boolean).join(' · ') || 'Anime'}</span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
