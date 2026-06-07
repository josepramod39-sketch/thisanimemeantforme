import type { AnimeRef } from '../../lib/types'
import { trailerEmbedUrl } from '../../lib/video'
import Modal from '../Modal'
import styles from './TrailerModal.module.css'

interface TrailerModalProps {
  anime: AnimeRef | null
  onClose: () => void
}

export default function TrailerModal({ anime, onClose }: TrailerModalProps) {
  const url = anime?.trailer ? trailerEmbedUrl(anime.trailer) : null

  return (
    <Modal open={Boolean(anime && url)} onClose={onClose} wide label="Trailer">
      <div className={styles.head}>
        <h2 className={styles.title}>{anime?.title}</h2>
        <p className={styles.sub}>Official trailer · via AniList</p>
      </div>
      <div className={styles.frame}>
        {url && (
          <iframe
            src={url}
            title={`${anime?.title} trailer`}
            allow="autoplay; encrypted-media; fullscreen"
            allowFullScreen
          />
        )}
      </div>
    </Modal>
  )
}
