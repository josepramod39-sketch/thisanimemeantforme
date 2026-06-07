import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { ensureAnonSession } from '../lib/supabase'
import { createProfile, getMyProfile, isUsernameTaken } from '../lib/db'

interface SessionState {
  userId: string | null
  username: string | null
  ready: boolean
  /** Create the caller's profile with this handle. Throws if taken/invalid. */
  claimUsername: (name: string) => Promise<void>
  checkUsername: (name: string) => Promise<boolean>
}

const SessionContext = createContext<SessionState | null>(null)

export function SessionProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null)
  const [username, setUsername] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const session = await ensureAnonSession()
      if (cancelled) return
      const uid = session?.user?.id ?? null
      setUserId(uid)
      if (uid) {
        try {
          const profile = await getMyProfile(uid)
          if (!cancelled && profile) setUsername(profile.username)
        } catch {
          /* profile load is best-effort */
        }
      }
      if (!cancelled) setReady(true)
    })()
    return () => { cancelled = true }
  }, [])

  const claimUsername = async (name: string) => {
    const handle = name.trim().toLowerCase()
    if (!/^[a-z0-9_]{3,20}$/.test(handle)) {
      throw new Error('3–20 chars: letters, numbers, underscores.')
    }
    if (!userId) throw new Error('No session yet — refresh and try again.')
    if (await isUsernameTaken(handle)) throw new Error('That handle is taken.')
    await createProfile(userId, handle)
    setUsername(handle)
  }

  const checkUsername = async (name: string) => {
    const handle = name.trim().toLowerCase()
    if (!/^[a-z0-9_]{3,20}$/.test(handle)) return false
    return !(await isUsernameTaken(handle))
  }

  return (
    <SessionContext.Provider value={{ userId, username, ready, claimUsername, checkUsername }}>
      {children}
    </SessionContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSession(): SessionState {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession must be used within SessionProvider')
  return ctx
}
