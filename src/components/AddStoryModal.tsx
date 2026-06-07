import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { AnimeRef } from '../lib/types'
import { hueFromString, initials } from '../lib/format'
import Modal from './Modal'
import AnimeSearch from './AnimeSearch'
import PillButton from './PillButton'
import styles from './AddStoryModal.module.css'

export interface StoryDraft {
  anime: AnimeRef
  body: string
}

interface AddStoryModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (draft: StoryDraft) => Promise<void> | void
}

const MAX = 600

export default function AddStoryModal({ open, onClose, onSubmit }: AddStoryModalProps) {
  const [anime, setAnime] = useState<AnimeRef | null>(null)
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reset = () => {
    setAnime(null)
    setBody('')
    setSubmitting(false)
    setError(null)
  }

  const close = () => {
    reset()
    onClose()
  }

  const submit = async () => {
    if (!anime || body.trim().length === 0) return
    setSubmitting(true)
    setError(null)
    try {
      await onSubmit({ anime, body: body.trim() })
      reset()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Try again.')
      setSubmitting(false)
    }
  }

  const hue = anime ? hueFromString(anime.title) : 0

  return (
    <Modal open={open} onClose={close} label="Add your anime story">
      <div className={styles.head}>
        <h2 className={styles.title}>
          {anime ? 'What did it mean to you?' : 'Add your story'}
        </h2>
        <p className={styles.lead}>
          {anime ? 'A sentence or a paragraph — whatever it deserves.' : 'Pick the anime that left a mark.'}
        </p>
      </div>

      <AnimatePresence mode="wait">
        {!anime ? (
          <motion.div key="search" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <AnimeSearch onSelect={setAnime} />
          </motion.div>
        ) : (
          <motion.div
            key="write"
            className={styles.write}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
          >
            <div className={styles.chip}>
              {anime.coverUrl ? (
                <img className={styles.chipArt} src={anime.coverUrl} alt="" />
              ) : (
                <span className={styles.chipArt} style={{ background: `hsl(${hue},65%,60%)` }}>
                  {initials(anime.title)}
                </span>
              )}
              <div className={styles.chipMeta}>
                <span className={styles.chipName}>{anime.title}</span>
                <span className={styles.chipSub}>{[anime.studio, anime.format].filter(Boolean).join(' · ') || 'Anime'}</span>
              </div>
              <button className={styles.change} onClick={() => setAnime(null)}>Change</button>
            </div>

            <textarea
              className={styles.textarea}
              placeholder="It found me at the right time…"
              value={body}
              maxLength={MAX}
              onChange={(e) => setBody(e.target.value)}
              autoFocus
            />
            <div className={styles.footer}>
              <span className={styles.count}>{body.length}/{MAX}</span>
              <PillButton onClick={submit} disabled={body.trim().length === 0 || submitting}>
                {submitting ? 'Posting…' : 'Post story'}
              </PillButton>
            </div>
            {error && <p className={styles.error}>{error}</p>}
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  )
}
