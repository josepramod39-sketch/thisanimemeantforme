import { useState } from 'react'
import { ShareIcon } from './icons'
import styles from './ShareButton.module.css'

export default function ShareButton({ url }: { url?: string }) {
  const [copied, setCopied] = useState(false)

  const share = async () => {
    const link = url ?? window.location.href
    try {
      if (navigator.share) {
        await navigator.share({ url: link })
        return
      }
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      /* user dismissed the share sheet — no-op */
    }
  }

  return (
    <button className={styles.share} onClick={share} aria-label="Share profile">
      <ShareIcon />
      <span className={styles.label}>{copied ? 'Copied!' : 'Share'}</span>
    </button>
  )
}
