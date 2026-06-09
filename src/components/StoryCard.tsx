import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { Story } from '../lib/types'
import { hueFromString, initials } from '../lib/format'
import LikeButton from './LikeButton'
import { CrunchyrollIcon, PlayIcon, UserIcon } from './icons'
import styles from './StoryCard.module.css'

interface StoryCardProps {
  story: Story
  onToggleLike: (id: string) => void
  onPlay?: (story: Story) => void
}

function Cover({ anime }: { story?: never; anime: Story['anime'] }) {
  const [broken, setBroken] = useState(false)
  if (anime.coverUrl && !broken) {
    return (
      <img
        className={styles.coverImg}
        src={anime.coverUrl}
        alt={anime.title}
        loading="lazy"
        onError={() => setBroken(true)}
      />
    )
  }
  const hue = hueFromString(anime.title)
  return (
    <div
      className={styles.coverFallback}
      style={{ background: `linear-gradient(135deg, hsl(${hue},70%,62%), hsl(${(hue + 40) % 360},75%,52%))` }}
      aria-label={anime.title}
    >
      <span className={styles.coverMono}>{initials(anime.title)}</span>
    </div>
  )
}

export default function StoryCard({ story, onToggleLike, onPlay }: StoryCardProps) {
  const { anime } = story
  const hasTrailer = Boolean(anime.trailer && onPlay)

  return (
    <motion.article
      className={styles.card}
      whileHover={{ y: -6 }}
      transition={{ type: 'spring', stiffness: 320, damping: 26 }}
    >
      <div className={styles.coverWrap}>
        <Cover anime={anime} />
        {hasTrailer && (
          <button className={styles.playBtn} onClick={() => onPlay!(story)} aria-label="Play trailer">
            <PlayIcon />
          </button>
        )}
      </div>

      <header className={styles.titleWrap}>
        <h3 className={styles.title}>{anime.title}</h3>
        <a
          className={styles.crunchyrollLink}
          href={`https://www.crunchyroll.com/search?q=${encodeURIComponent(anime.title)}`}
          target="_blank"
          rel="noreferrer"
          aria-label="Search on Crunchyroll"
          onClick={(e) => e.stopPropagation()}
        >
          <CrunchyrollIcon />
        </a>
      </header>

      <p className={styles.body}>"{story.body}"</p>

      <footer className={styles.meta}>
        <div className={styles.authorGroup}>
          <UserIcon className={styles.personIcon} />
          <Link to={`/u/${story.author}`} className={styles.author}>
            @{story.author}
          </Link>
          <span className={styles.dot}>•</span>
          <span className={styles.studio}>{anime.studio || anime.format || 'Anime'}</span>
        </div>
        <div className={styles.likeWrapper}>
          <LikeButton
            liked={story.likedByMe}
            count={story.likeCount}
            onToggle={() => onToggleLike(story.id)}
          />
        </div>
      </footer>
    </motion.article>
  )
}
