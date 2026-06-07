import { motion, useReducedMotion } from 'framer-motion'
import styles from './SakuraPetals.module.css'

const COUNT = 16

interface Petal {
  left: number
  size: number
  delay: number
  duration: number
  sway: number
  hue: number
  rotate: number
}

// Generated once at module load (keeps render pure).
const PETALS: Petal[] = Array.from({ length: COUNT }, () => ({
  left: Math.random() * 100,
  size: 10 + Math.random() * 14,
  delay: -Math.random() * 18,
  duration: 12 + Math.random() * 12,
  sway: 30 + Math.random() * 70,
  hue: 330 + Math.random() * 25,
  rotate: Math.random() * 360,
}))

/** Ambient drifting sakura petals behind the content. Off under reduced-motion. */
export default function SakuraPetals() {
  const reduce = useReducedMotion()
  const petals = PETALS

  if (reduce) return null

  return (
    <div className={styles.layer} aria-hidden="true">
      {petals.map((p, i) => (
        <motion.span
          key={i}
          className={styles.petal}
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 0.72,
            background: `hsl(${p.hue}, 85%, ${72 + (i % 3) * 4}%)`,
          }}
          initial={{ y: '-12vh', x: 0, rotate: p.rotate, opacity: 0 }}
          animate={{
            y: '112vh',
            x: [0, p.sway, -p.sway * 0.6, p.sway * 0.3, 0],
            rotate: p.rotate + 360,
            opacity: [0, 0.85, 0.85, 0.6, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'linear',
            times: [0, 0.1, 0.5, 0.85, 1],
          }}
        />
      ))}
    </div>
  )
}
