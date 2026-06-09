import { Link, NavLink } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useUI } from '../context/ui'
import { useSettings } from '../context/settings'
import { CalendarIcon, PlusIcon, LogoIcon } from './icons'
import styles from './Layout.module.css'

/** Render any brand title in the serif wordmark with a magenta accent. */
function BrandMark({ title }: { title: string }) {
  const t = title.trim()
  // "…for" → accent the trailing "for" (the default animefor look).
  if (t.length > 3 && t.toLowerCase().endsWith('for')) {
    return <>{t.slice(0, -3)}<span className={styles.brandAccent}>{t.slice(-3)}</span></>
  }
  // Multiple words → accent the last word.
  const words = t.split(/\s+/)
  if (words.length > 1) {
    const last = words.pop() as string
    return <>{words.join(' ')}{' '}<span className={styles.brandAccent}>{last}</span></>
  }
  // Single word → vibrant magenta wordmark (not dull).
  return <span className={styles.brandSolo}>{t}</span>
}

export default function Layout({ children }: { children: ReactNode }) {
  const { openAddStory } = useUI()
  const { settings } = useSettings()
  const brand = settings.brandTitle

  return (
    <>
      <header className={styles.bar}>
        <div className={`container ${styles.inner}`}>
          <Link to="/" className={styles.brand} aria-label={`${brand} home`}>
            <LogoIcon className={styles.brandLogo} />
            <BrandMark title={brand} />
          </Link>

          <nav className={styles.nav}>
            <NavLink to="/" end className={({ isActive }) => isActive ? styles.active : styles.link}>
              Stories
            </NavLink>
            <NavLink to="/calendar" className={({ isActive }) => isActive ? styles.active : styles.link}>
              <CalendarIcon className={styles.navIcon} /> Calendar
            </NavLink>
            <button className={styles.addBtn} onClick={openAddStory}>
              <PlusIcon className={styles.addIcon} /> Add
            </button>
          </nav>
        </div>
      </header>

      <main className={styles.main}>{children}</main>

      <footer className={styles.footer}>
        <div className="container">
          <span>
            Inspired by{' '}
            <a href="https://www.watchsomethingwonderful.com/" target="_blank" rel="noopener noreferrer" className={styles.footLink}>
              Watch Something Wonderful
            </a>{' '}
            &amp;{' '}
            <a href="https://www.thissongmeant.me/" target="_blank" rel="noopener noreferrer" className={styles.footLink}>
              ThisSongMeant
            </a>
          </span>
          <span className={styles.footMeta}>
            Thanks to{' '}
            <a href="https://x.com/akhil_bvs?s=20" target="_blank" rel="noopener noreferrer" className={styles.footLink}>
              @akhil_bvs
            </a>{' '}
            for helping · Anime data by AniList · Clips via YouTube
          </span>
        </div>
      </footer>
    </>
  )
}
