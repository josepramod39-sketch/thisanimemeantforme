import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { ensureAnonSession, supabase, ADMIN_EMAILS } from '../lib/supabase'
import { createProfile, getMyProfile, isUsernameTaken } from '../lib/db'

interface SessionState {
  userId: string | null
  username: string | null
  email: string | null
  isAdmin: boolean
  ready: boolean
  /** Create the caller's profile with this handle. Throws if taken/invalid. */
  claimUsername: (name: string) => Promise<void>
  checkUsername: (name: string) => Promise<boolean>
  /** Send a magic-link sign-in email (for admin access). */
  signInWithEmail: (email: string) => Promise<void>
  signOut: () => Promise<void>
}

const SessionContext = createContext<SessionState | null>(null)

export function SessionProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null)
  const [username, setUsername] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const uid = session?.user?.id ?? null
      setUserId(uid)
      setEmail(session?.user?.email ?? null)
      if (uid) {
        getMyProfile(uid)
          .then((p) => setUsername(p?.username ?? null))
          .catch(() => {})
      } else {
        setUsername(null)
      }
    })

    ;(async () => {
      // Guarantee a session for anonymous visitors; keeps an existing
      // (e.g. magic-link admin) session untouched.
      await ensureAnonSession()
      if (!cancelled) setReady(true)
    })()

    return () => {
      cancelled = true
      sub.subscription.unsubscribe()
    }
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

  const signInWithEmail = async (addr: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email: addr.trim(),
      options: { emailRedirectTo: `${window.location.origin}/admin` },
    })
    if (error) throw new Error(error.message)
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    await ensureAnonSession()
  }

  const isAdmin = ADMIN_EMAILS.includes((email ?? '').toLowerCase())

  return (
    <SessionContext.Provider
      value={{ userId, username, email, isAdmin, ready, claimUsername, checkUsername, signInWithEmail, signOut }}
    >
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
