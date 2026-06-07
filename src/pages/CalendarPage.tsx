import { useState } from 'react'
import { motion } from 'framer-motion'
import type { AiringEntry, AnimeRef } from '../lib/types'
import { useAiringCalendar } from '../hooks/useAiringCalendar'
import CalendarDayColumn from '../components/calendar/CalendarDayColumn'
import TrailerModal from '../components/video/TrailerModal'
import PillButton from '../components/PillButton'
import styles from './CalendarPage.module.css'

export default function CalendarPage() {
  const { calendar, loading, error } = useAiringCalendar(7)
  const [trailer, setTrailer] = useState<AnimeRef | null>(null)

  const onPlay = (entry: AiringEntry) => setTrailer(entry.anime)

  return (
    <div className={styles.page}>
      <div className="container">
        <motion.header
          className={styles.head}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className={styles.kicker}>✦ the week ahead ✦</p>
          <h1 className={styles.title}>Upcoming anime</h1>
          <p className={styles.sub}>Episodes airing over the next 7 days · powered by AniList</p>
        </motion.header>

        {loading && (
          <div className={styles.grid}>
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className={styles.skelCol}>
                <div className={styles.skelHead} />
                {Array.from({ length: 3 }).map((__, j) => (
                  <div key={j} className={styles.skelCard} />
                ))}
              </div>
            ))}
          </div>
        )}

        {!loading && error && (
          <div className={styles.state}>
            <p>{error}</p>
            <PillButton variant="outline" onClick={() => location.reload()}>Reload</PillButton>
          </div>
        )}

        {!loading && !error && (
          <div className={styles.grid}>
            {calendar.map((day, i) => (
              <CalendarDayColumn key={day.key} day={day} index={i} onPlay={onPlay} />
            ))}
          </div>
        )}
      </div>

      <TrailerModal anime={trailer} onClose={() => setTrailer(null)} />
    </div>
  )
}
