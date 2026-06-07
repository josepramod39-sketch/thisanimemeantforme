import { createContext, useContext, useState, type ReactNode } from 'react'

interface UIState {
  addStoryOpen: boolean
  openAddStory: () => void
  closeAddStory: () => void
}

const UIContext = createContext<UIState | null>(null)

export function UIProvider({ children }: { children: ReactNode }) {
  const [addStoryOpen, setAddStoryOpen] = useState(false)
  return (
    <UIContext.Provider
      value={{
        addStoryOpen,
        openAddStory: () => setAddStoryOpen(true),
        closeAddStory: () => setAddStoryOpen(false),
      }}
    >
      {children}
    </UIContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useUI(): UIState {
  const ctx = useContext(UIContext)
  if (!ctx) throw new Error('useUI must be used within UIProvider')
  return ctx
}
