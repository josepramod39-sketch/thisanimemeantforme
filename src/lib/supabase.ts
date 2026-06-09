import { createClient, type Session } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!url || !key) {
  // Surfaced early in dev rather than as a cryptic network error later.
  console.warn('[animefor] Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY in .env.local')
}

/** The accounts granted admin powers (also enforced server-side via RLS). */
export const ADMIN_EMAILS = ['josepramod39@gmail.com', 'krishnaprateek428@gmail.com']

export const supabase = createClient(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true, // parse magic-link tokens on /admin
  },
})

/**
 * Guarantees a session exists. Uses Supabase anonymous auth so users can post
 * and like without a login wall; the session persists per-device in storage.
 * Requires "Allow anonymous sign-ins" to be enabled in the project's Auth settings.
 */
export async function ensureAnonSession(): Promise<Session | null> {
  const { data: existing } = await supabase.auth.getSession()
  if (existing.session) return existing.session
  const { data, error } = await supabase.auth.signInAnonymously()
  if (error) {
    console.error('[animefor] Anonymous sign-in failed:', error.message)
    return null
  }
  return data.session
}
