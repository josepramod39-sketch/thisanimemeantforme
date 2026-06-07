import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { Story } from '../lib/types'
import { hueFromString, initials } from '../lib/format'
import LikeButton from './LikeButton'
import { ExternalIcon, PlayIcon } from './icons'
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
        className={styles.cover}
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
      className={styles.cover}
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
      <header className={styles.head}>
        <div className={styles.coverWrap}>
          <Cover anime={anime} />
          {hasTrailer && (
            <button className={styles.playBtn} onClick={() => onPlay!(story)} aria-label="Play trailer">
              <PlayIcon />
            </button>
          )}
        </div>
        <div className={styles.track}>
          <h3 className={styles.song}>{anime.title}</h3>
          <p className={styles.artist}>{anime.studio || anime.format || 'Anime'}</p>
        </div>
        <a
          className={styles.ext}
          href={`https://anilist.co/anime/${anime.anilistId}`}
          target="_blank"
          rel="noreferrer"
          aria-label="View on AniList"
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalIcon />
        </a>
      </header>

      <p className={styles.body}>{story.body}</p>

      <footer className={styles.foot}>
        <Link to={`/u/${story.author}`} className={styles.author}>
          — {story.author}
        </Link>
        <LikeButton
          liked={story.likedByMe}
          count={story.likeCount}
          onToggle={() => onToggleLike(story.id)}
        />
      </footer>
    </motion.article>
  )
}
