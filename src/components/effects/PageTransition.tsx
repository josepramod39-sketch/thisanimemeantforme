import { motion, useReducedMotion, type Variants } from 'framer-motion'
import type { ReactNode } from 'react'
import styles from './PageTransition.module.css'

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

const variants: Variants = {
  initial: { opacity: 0, y: 18, filter: 'blur(8px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.45, ease: EASE } },
  exit: { opacity: 0, y: -14, filter: 'blur(6px)', transition: { duration: 0.28, ease: 'easeIn' } },
}

const reduced: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
}

/** Wraps a route so route changes fade/slide with an anime speed-line wipe. */
export default function PageTransition({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion()
  return (
    <motion.div variants={reduce ? reduced : variants} initial="initial" animate="animate" exit="exit">
      {!reduce && (
        <motion.div
          className={styles.wipe}
          initial={{ x: '-120%' }}
          animate={{ x: '120%' }}
          transition={{ duration: 0.6, ease: [0.7, 0, 0.3, 1] }}
        />
      )}
      {children}
    </motion.div>
  )
}
