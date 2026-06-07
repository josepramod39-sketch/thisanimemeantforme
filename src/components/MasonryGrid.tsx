import { motion, useReducedMotion } from 'framer-motion'
import type { Story } from '../lib/types'
import StoryCard from './StoryCard'
import styles from './MasonryGrid.module.css'

interface MasonryGridProps {
  stories: Story[]
  onToggleLike: (id: string) => void
  onPlay?: (story: Story) => void
}

export default function MasonryGrid({ stories, onToggleLike, onPlay }: MasonryGridProps) {
  const reduce = useReducedMotion()
  return (
    <div className={styles.grid}>
      {stories.map((story, i) => (
        <motion.div
          key={story.id}
          className={styles.item}
          initial={reduce ? false : { opacity: 0, y: 26, filter: 'blur(6px)' }}
          whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          viewport={{ once: true, margin: '0px 0px -8% 0px' }}
          transition={{ duration: 0.5, delay: Math.min(i, 8) * 0.04, ease: [0.22, 1, 0.36, 1] }}
        >
          <StoryCard story={story} onToggleLike={onToggleLike} onPlay={onPlay} />
        </motion.div>
      ))}
    </div>
  )
}
