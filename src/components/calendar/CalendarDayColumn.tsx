import { motion } from 'framer-motion'
import type { CalendarDay } from '../../hooks/useAiringCalendar'
import type { AiringEntry } from '../../lib/types'
import { dayLabel } from '../../lib/format'
import AiringCard from './AiringCard'
import styles from './CalendarDayColumn.module.css'

interface Props {
  day: CalendarDay
  index: number
  onPlay: (entry: AiringEntry) => void
}

export default function CalendarDayColumn({ day, index, onPlay }: Props) {
  const { weekday, date } = dayLabel(day.date)
  const isToday = index === 0

  return (
    <motion.section
      className={styles.col}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45, delay: Math.min(index, 6) * 0.05, ease: [0.22, 1, 0.36, 1] }}
    >
      <header className={`${styles.head} ${isToday ? styles.today : ''}`}>
        <span className={styles.weekday}>{isToday ? 'Today' : weekday}</span>
        <span className={styles.date}>{date}</span>
      </header>
      <div className={styles.cards}>
        {day.entries.length === 0 ? (
          <p className={styles.none}>—</p>
        ) : (
          day.entries.map((e) => <AiringCard key={e.id} entry={e} onPlay={onPlay} />)
        )}
      </div>
    </motion.section>
  )
}
