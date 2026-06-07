import { motion, useReducedMotion, useScroll, useTransform, type Variants } from 'framer-motion'
import { useUI } from '../context/ui'
import { useSettings } from '../context/settings'
import PillButton from './PillButton'
import { SearchIcon, ChevronDownIcon } from './icons'
import styles from './Hero.module.css'

interface HeroProps {
  count: number
  onExplore: () => void
}

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
}
const item: Variants = {
  hidden: { opacity: 0, y: 24, filter: 'blur(8px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.7, ease: EASE } },
}

export default function Hero({ count, onExplore }: HeroProps) {
  const { openAddStory } = useUI()
  const { settings } = useSettings()
  const reduce = useReducedMotion()
  const { scrollY } = useScroll()
  const y = useTransform(scrollY, [0, 400], [0, reduce ? 0 : 80])
  const opacity = useTransform(scrollY, [0, 320], [1, reduce ? 1 : 0.25])

  return (
    <motion.section className={styles.hero} style={{ y, opacity }}>
      <motion.div
        className={styles.center}
        variants={container}
        initial="hidden"
        animate="show"
      >
        <motion.p className={styles.kicker} variants={item}>
          ✦ {settings.heroKicker} ✦
        </motion.p>
        <motion.h1 className={styles.title} variants={item}>
          {settings.heroPrompt}
        </motion.h1>
        <motion.p className={styles.sub} variants={item}>
          {count.toLocaleString()} {count === 1 ? 'story' : 'stories'} and counting
        </motion.p>
        <motion.div className={styles.actions} variants={item}>
          <PillButton onClick={openAddStory}>Add your story</PillButton>
          <PillButton variant="outline" icon={<SearchIcon />} onClick={onExplore}>
            Explore stories
          </PillButton>
        </motion.div>
      </motion.div>

      <motion.button
        className={styles.scrollCue}
        onClick={() => window.scrollBy({ top: window.innerHeight * 0.9, behavior: 'smooth' })}
        aria-label="Scroll down"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9, duration: 0.6 }}
      >
        <motion.span
          animate={reduce ? {} : { y: [0, 7, 0] }}
          transition={reduce ? {} : { duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ChevronDownIcon />
        </motion.span>
      </motion.button>
    </motion.section>
  )
}
