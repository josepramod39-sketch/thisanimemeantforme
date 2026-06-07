import { useEffect, useState } from 'react'
import { useSession } from '../context/session'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import Avatar from './Avatar'
import Modal from './Modal'
import PillButton from './PillButton'
import styles from './UsernamePrompt.module.css'

interface UsernamePromptProps {
  open: boolean
  onClose: () => void
  onClaimed: (name: string) => void
}

type Status = 'idle' | 'checking' | 'ok' | 'taken' | 'invalid'

export default function UsernamePrompt({ open, onClose, onClaimed }: UsernamePromptProps) {
  const { claimUsername, checkUsername } = useSession()
  const [name, setName] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const debounced = useDebouncedValue(name, 350)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      const handle = debounced.trim().toLowerCase()
      if (handle.length === 0) { setStatus('idle'); return }
      if (!/^[a-z0-9_]{3,20}$/.test(handle)) { setStatus('invalid'); return }
      setStatus('checking')
      try {
        const ok = await checkUsername(handle)
        if (!cancelled) setStatus(ok ? 'ok' : 'taken')
      } catch {
        if (!cancelled) setStatus('idle')
      }
    }
    void run()
    return () => { cancelled = true }
  }, [debounced, checkUsername])

  const handle = name.trim().toLowerCase()

  const submit = async () => {
    if (status !== 'ok') return
    setSubmitting(true)
    setError(null)
    try {
      await claimUsername(handle)
      onClaimed(handle)
      setName('')
      setStatus('idle')
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not claim that handle.')
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} label="Pick a handle">
      <div className={styles.wrap}>
        <Avatar seed={handle || 'animefor'} size={64} />
        <h2 className={styles.title}>Pick your handle</h2>
        <p className={styles.lead}>This is how your stories are signed. No email, no password.</p>

        <div className={`${styles.field} ${styles[status]}`}>
          <span className={styles.at}>@</span>
          <input
            className={styles.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="yourhandle"
            maxLength={20}
            autoFocus
            onKeyDown={(e) => { if (e.key === 'Enter') submit() }}
          />
        </div>

        <p className={styles.status}>
          {status === 'invalid' && '3–20 chars: lowercase letters, numbers, underscores.'}
          {status === 'checking' && 'Checking…'}
          {status === 'ok' && `@${handle} is available ✓`}
          {status === 'taken' && 'That handle is taken — try another.'}
          {status === 'idle' && ' '}
        </p>

        {error && <p className={styles.error}>{error}</p>}

        <PillButton onClick={submit} disabled={status !== 'ok' || submitting}>
          {submitting ? 'Claiming…' : 'Claim & post'}
        </PillButton>
      </div>
    </Modal>
  )
}
