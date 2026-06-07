import { useState } from 'react'
import { motion } from 'framer-motion'
import type { AiringEntry } from '../../lib/types'
import { countdown, hueFromString, initials } from '../../lib/format'
import { PlayIcon } from '../icons'
import styles from './AiringCard.module.css'

interface AiringCardProps {
  entry: AiringEntry
  onPlay: (entry: AiringEntry) => void
}

export default function AiringCard({ entry, onPlay }: AiringCardProps) {
  const { anime, episode, airingAt } = entry
  const [broken, setBroken] = useState(false)
  const hue = hueFromString(anime.title)
  const hasTrailer = Boolean(anime.trailer)

  return (
    <motion.div className={styles.card} whileHover={{ y: -4 }}>
      <div className={styles.art}>
        {anime.coverUrl && !broken ? (
          <img src={anime.coverUrl} alt={anime.title} loading="lazy" onError={() => setBroken(true)} />
        ) : (
          <div className={styles.fallback} style={{ background: `hsl(${hue},65%,58%)` }}>
            {initials(anime.title)}
          </div>
        )}
        {hasTrailer && (
          <button className={styles.play} onClick={() => onPlay(entry)} aria-label="Play trailer">
            <PlayIcon />
          </button>
        )}
        <span className={styles.countdown}>{countdown(airingAt)}</span>
      </div>
      <div className={styles.meta}>
        <p className={styles.title}>{anime.title}</p>
        <p className={styles.ep}>EP {episode}</p>
      </div>
    </motion.div>
  )
}
