import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import type { SiteSettings } from '../lib/types'
import { getSettings } from '../lib/db'

const DEFAULTS: SiteSettings = {
  brandTitle: 'animefor',
  heroKicker: 'a quiet wall for loud feelings',
  heroPrompt: 'What did this anime help you escape?',
}

interface SettingsState {
  settings: SiteSettings
  reload: () => Promise<void>
}

const SettingsContext = createContext<SettingsState | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULTS)

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const s = await getSettings()
        if (active) setSettings(s)
      } catch {
        /* keep defaults */
      }
    })()
    return () => { active = false }
  }, [])

  // Keep the document title in sync with the brand.
  useEffect(() => {
    document.title = `${settings.brandTitle} — ${settings.heroPrompt}`
  }, [settings])

  const reload = useCallback(async () => {
    try {
      setSettings(await getSettings())
    } catch {
      /* keep current */
    }
  }, [])

  return (
    <SettingsContext.Provider value={{ settings, reload }}>
      {children}
    </SettingsContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSettings(): SettingsState {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider')
  return ctx
}
