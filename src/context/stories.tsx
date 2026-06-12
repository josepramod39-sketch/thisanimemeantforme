import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import type { Story } from '../lib/types'
import type { StoryDraft } from '../components/AddStoryModal'
import { fetchStories, insertStory, setLike } from '../lib/db'
import { applyLikeToggle, restoreStory } from '../lib/likes'
import { useSession } from './session'

interface StoriesState {
  stories: Story[]
  loading: boolean
  error: string | null
  reload: () => void
  addStory: (draft: StoryDraft, author: string) => Promise<Story>
  toggleLike: (id: string) => void
}

const StoriesContext = createContext<StoriesState | null>(null)

export function StoriesProvider({ children }: { children: ReactNode }) {
  const { userId } = useSession()
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setStories(await fetchStories())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load stories.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const data = await fetchStories()
        if (active) { setStories(data); setLoading(false) }
      } catch (e) {
        if (active) { setError(e instanceof Error ? e.message : 'Failed to load stories.'); setLoading(false) }
      }
    })()
    return () => { active = false }
  }, [])

  const addStory: StoriesState['addStory'] = async (draft, author) => {
    if (!userId) throw new Error('No session yet — please refresh.')
    const created = await insertStory(draft, userId)
    const story: Story = { ...created, author }
    setStories((prev) => [story, ...prev])
    return story
  }

  const toggleLike = (id: string) => {
    if (!userId) return
    let liked = false
    let snapshot: Story | undefined
    setStories((prev) => {
      snapshot = prev.find((s) => s.id === id) // exact pre-change state
      const res = applyLikeToggle(prev, id)
      liked = res.liked
      return res.stories
    })
    if (!snapshot) return
    const snap = snapshot
    // Persist; on failure, restore the exact snapshot (no arithmetic drift on rapid taps).
    setLike(id, userId, liked).catch(() => {
      setStories((prev) => restoreStory(prev, snap))
    })
  }

  return (
    <StoriesContext.Provider value={{ stories, loading, error, reload, addStory, toggleLike }}>
      {children}
    </StoriesContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useStories(): StoriesState {
  const ctx = useContext(StoriesContext)
  if (!ctx) throw new Error('useStories must be used within StoriesProvider')
  return ctx
}
