import { Link, NavLink } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useUI } from '../context/ui'
import { useSettings } from '../context/settings'
import { CalendarIcon, PlusIcon } from './icons'
import styles from './Layout.module.css'

export default function Layout({ children }: { children: ReactNode }) {
  const { openAddStory } = useUI()
  const { settings } = useSettings()
  const brand = settings.brandTitle

  return (
    <>
      <header className={styles.bar}>
        <div className={`container ${styles.inner}`}>
          <Link to="/" className={styles.brand} aria-label={`${brand} home`}>
            {brand === 'animefor'
              ? <>anime<span className={styles.brandAccent}>for</span></>
              : brand}
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
          <span>{brand} — {settings.heroPrompt}</span>
          <span className={styles.footMeta}>
            Anime data by AniList · clips via YouTube
          </span>
        </div>
      </footer>
    </>
  )
}
