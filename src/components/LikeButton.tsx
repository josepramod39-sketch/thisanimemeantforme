import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { HeartIcon } from './icons'
import styles from './LikeButton.module.css'

interface LikeButtonProps {
  liked: boolean
  count: number
  onToggle: () => void
}

export default function LikeButton({ liked, count, onToggle }: LikeButtonProps) {
  const reduce = useReducedMotion()
  return (
    <button
      className={`${styles.like} ${liked ? styles.liked : ''}`}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onToggle()
      }}
      aria-pressed={liked}
      aria-label={liked ? 'Unlike' : 'Like'}
    >
      <span className={styles.heartWrap}>
        <motion.span
          key={liked ? 'on' : 'off'}
          initial={reduce ? false : { scale: 0.6 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 600, damping: 14 }}
          className={styles.heart}
        >
          <HeartIcon filled={liked} />
        </motion.span>
        <AnimatePresence>
          {liked && !reduce && (
            <motion.span
              className={styles.burst}
              initial={{ scale: 0, opacity: 0.7 }}
              animate={{ scale: 2.4, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          )}
        </AnimatePresence>
      </span>
      <span className={styles.count}>{count}</span>
    </button>
  )
}
