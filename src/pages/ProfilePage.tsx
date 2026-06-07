import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { Story } from '../lib/types'
import { fetchStoriesByAuthor, getProfileByUsername, setLike } from '../lib/db'
import { useSession } from '../context/session'
import { useUI } from '../context/ui'
import Avatar from '../components/Avatar'
import BackButton from '../components/BackButton'
import ShareButton from '../components/ShareButton'
import MasonryGrid from '../components/MasonryGrid'
import PillButton from '../components/PillButton'
import TrailerModal from '../components/video/TrailerModal'
import styles from './ProfilePage.module.css'

export default function ProfilePage() {
  const { username = '' } = useParams()
  const { userId, username: myHandle } = useSession()
  const { openAddStory } = useUI()
  const [stories, setStories] = useState<Story[]>([])
  const [exists, setExists] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [trailer, setTrailer] = useState<Story | null>(null)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      setLoading(true)
      try {
        const [rows, profile] = await Promise.all([
          fetchStoriesByAuthor(username),
          getProfileByUsername(username),
        ])
        if (cancelled) return
        setStories(rows)
        setExists(Boolean(profile))
      } catch {
        if (!cancelled) setExists(false)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void run()
    return () => { cancelled = true }
  }, [username])

  const toggleLike = (id: string) => {
    if (!userId) return
    let nextLiked = false
    setStories((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s
        nextLiked = !s.likedByMe
        return { ...s, likedByMe: nextLiked, likeCount: s.likeCount + (nextLiked ? 1 : -1) }
      }),
    )
    setLike(id, userId, nextLiked).catch(() => {
      setStories((prev) =>
        prev.map((s) =>
          s.id === id
            ? { ...s, likedByMe: !nextLiked, likeCount: s.likeCount + (nextLiked ? -1 : 1) }
            : s,
        ),
      )
    })
  }

  const isMe = myHandle === username

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <BackButton />
      </div>

      {!loading && exists === false ? (
        <div className={styles.notFound}>
          <h1>@{username}</h1>
          <p>No one here by that handle… yet.</p>
        </div>
      ) : (
        <>
          <motion.div
            className={styles.profile}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <Avatar seed={username} size={92} />
            <div className={styles.nameRow}>
              <h1 className={styles.name}>{username}</h1>
              <ShareButton />
            </div>
            <p className={styles.count}>
              {stories.length} {stories.length === 1 ? 'story' : 'stories'} shared
            </p>
            {isMe && <PillButton onClick={openAddStory}>Add your story</PillButton>}
          </motion.div>

          <div className="container">
            {!loading && stories.length === 0 ? (
              <p className={styles.empty}>No stories shared yet.</p>
            ) : (
              <MasonryGrid stories={stories} onToggleLike={toggleLike} onPlay={setTrailer} />
            )}
          </div>
        </>
      )}

      <TrailerModal anime={trailer?.anime ?? null} onClose={() => setTrailer(null)} />
    </div>
  )
}
