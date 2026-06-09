import { useRef, useState } from 'react'
import type { AnimeRef } from '../lib/types'
import { useStories } from '../context/stories'
import { useUI } from '../context/ui'
import { useMoods } from '../hooks/useMoods'
import Hero from '../components/Hero'
import MasonryGrid from '../components/MasonryGrid'
import PillButton from '../components/PillButton'
import ClipTheater from '../components/video/ClipTheater'
import TrailerModal from '../components/video/TrailerModal'
import styles from './FeedPage.module.css'

export default function FeedPage() {
  const { stories, loading, error, reload, toggleLike } = useStories()
  const { openAddStory } = useUI()
  const moods = useMoods()
  const feedRef = useRef<HTMLDivElement>(null)
  const [trailer, setTrailer] = useState<AnimeRef | null>(null)
  const [activeMood, setActiveMood] = useState<string | null>(null)

  const scrollToFeed = () => feedRef.current?.scrollIntoView({ behavior: 'smooth' })

  const visible = activeMood ? stories.filter((s) => s.mood === activeMood) : stories

  return (
    <>
      <Hero count={stories.length} onExplore={scrollToFeed} />

      <ClipTheater />

      <div className="container" ref={feedRef}>
        <div className={styles.feedHead}>
          <h2 className={styles.feedTitle}>
            when you're feeling...{' '}
            <span className={styles.feelingAccent}>
              {activeMood
                ? (moods.find((m) => m.slug === activeMood)?.label ?? '').toLowerCase()
                : ''}
            </span>
          </h2>
        </div>

        {moods.length > 0 && (
          <div className={styles.moodFilter}>
            <button
              className={`${styles.moodChip} ${activeMood === null ? styles.moodOn : ''}`}
              onClick={() => setActiveMood(null)}
            >
              All
            </button>
            {moods.map((m) => (
              <button
                key={m.slug}
                className={`${styles.moodChip} ${activeMood === m.slug ? styles.moodOn : ''}`}
                onClick={() => setActiveMood(m.slug)}
              >
                {m.label}
              </button>
            ))}
          </div>
        )}

        {loading && (
          <div className={styles.skeletonGrid}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className={styles.skeleton} style={{ height: 120 + (i % 4) * 46 }} />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className={styles.state}>
            <p>{error}</p>
            <PillButton variant="outline" onClick={reload}>Try again</PillButton>
          </div>
        )}

        {!loading && !error && stories.length === 0 && (
          <div className={styles.state}>
            <h3 className={styles.emptyTitle}>The wall is quiet… for now.</h3>
            <p>Be the first to share what an anime meant to you.</p>
            <PillButton onClick={openAddStory}>Add your story</PillButton>
          </div>
        )}

        {!loading && !error && stories.length > 0 && visible.length === 0 && (
          <div className={styles.state}>
            <p>No stories tagged this feeling yet.</p>
            <PillButton onClick={openAddStory}>Add the first one</PillButton>
          </div>
        )}

        {!loading && !error && visible.length > 0 && (
          <MasonryGrid stories={visible} onToggleLike={toggleLike} onPlay={(s) => setTrailer(s.anime)} />
        )}
      </div>

      <TrailerModal anime={trailer} onClose={() => setTrailer(null)} />
    </>
  )
}
