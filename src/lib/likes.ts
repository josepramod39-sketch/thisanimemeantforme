import type { Story } from './types'

/**
 * Pure: toggle a story's like within the list.
 * Returns the new list and whether the target is now liked.
 */
export function applyLikeToggle(stories: Story[], id: string): { stories: Story[]; liked: boolean } {
  let liked = false
  const next = stories.map((s) => {
    if (s.id !== id) return s
    liked = !s.likedByMe
    return { ...s, likedByMe: liked, likeCount: s.likeCount + (liked ? 1 : -1) }
  })
  return { stories: next, liked }
}

/** Pure: restore one story to an exact prior snapshot (optimistic rollback). */
export function restoreStory(stories: Story[], snapshot: Story): Story[] {
  return stories.map((s) => (s.id === snapshot.id ? snapshot : s))
}
