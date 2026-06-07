import { useState, lazy, Suspense } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { UIProvider, useUI } from './context/ui'
import { SessionProvider, useSession } from './context/session'
import { StoriesProvider, useStories } from './context/stories'
import Layout from './components/Layout'
import AddStoryModal, { type StoryDraft } from './components/AddStoryModal'
import UsernamePrompt from './components/UsernamePrompt'
import SakuraPetals from './components/effects/SakuraPetals'
import PageTransition from './components/effects/PageTransition'
import FeedPage from './pages/FeedPage'
import NotFound from './pages/NotFound'

// Heavier routes are split out of the initial bundle.
const CalendarPage = lazy(() => import('./pages/CalendarPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))

function AppShell() {
  const { addStoryOpen, closeAddStory } = useUI()
  const { username } = useSession()
  const { addStory } = useStories()
  const location = useLocation()
  const [pendingDraft, setPendingDraft] = useState<StoryDraft | null>(null)
  const [usernameOpen, setUsernameOpen] = useState(false)

  // Post directly when we already have a handle; otherwise stash the draft,
  // collect a handle, and finish the post once it's claimed.
  const handleSubmit = async (draft: StoryDraft) => {
    if (username) {
      await addStory(draft, username)
      return
    }
    setPendingDraft(draft)
    setUsernameOpen(true)
  }

  const handleClaimed = async (name: string) => {
    if (pendingDraft) {
      await addStory(pendingDraft, name)
      setPendingDraft(null)
    }
  }

  return (
    <Layout>
      <SakuraPetals />
      <AnimatePresence mode="wait">
        <PageTransition key={location.pathname}>
          <Suspense fallback={<div style={{ minHeight: '60vh' }} />}>
            <Routes location={location}>
              <Route path="/" element={<FeedPage />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/u/:username" element={<ProfilePage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </PageTransition>
      </AnimatePresence>

      <AddStoryModal open={addStoryOpen} onClose={closeAddStory} onSubmit={handleSubmit} />
      <UsernamePrompt
        open={usernameOpen}
        onClose={() => setUsernameOpen(false)}
        onClaimed={handleClaimed}
      />
    </Layout>
  )
}

export default function App() {
  return (
    <UIProvider>
      <SessionProvider>
        <StoriesProvider>
          <AppShell />
        </StoriesProvider>
      </SessionProvider>
    </UIProvider>
  )
}
