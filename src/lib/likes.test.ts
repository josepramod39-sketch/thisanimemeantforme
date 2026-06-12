import { describe, it, expect } from 'vitest'
import { applyLikeToggle, restoreStory } from './likes'
import type { Story } from './types'

const story = (id: string, likeCount = 0, likedByMe = false): Story => ({
  id,
  anime: { anilistId: 1, title: 'Test Anime' },
  body: 'body',
  author: 'jax',
  likeCount,
  likedByMe,
  createdAt: new Date().toISOString(),
})

describe('applyLikeToggle', () => {
  it('likes an unliked story', () => {
    const { stories, liked } = applyLikeToggle([story('a', 3, false)], 'a')
    expect(liked).toBe(true)
    expect(stories[0].likeCount).toBe(4)
    expect(stories[0].likedByMe).toBe(true)
  })

  it('unlikes a liked story', () => {
    const { stories, liked } = applyLikeToggle([story('a', 4, true)], 'a')
    expect(liked).toBe(false)
    expect(stories[0].likeCount).toBe(3)
    expect(stories[0].likedByMe).toBe(false)
  })

  it('leaves other stories untouched', () => {
    const input = [story('a', 1), story('b', 9, true)]
    const { stories } = applyLikeToggle(input, 'a')
    expect(stories[1]).toBe(input[1])
  })

  it('double-toggle returns to the original state (no drift)', () => {
    const start = [story('a', 7, false)]
    const once = applyLikeToggle(start, 'a').stories
    const twice = applyLikeToggle(once, 'a').stories
    expect(twice[0].likeCount).toBe(7)
    expect(twice[0].likedByMe).toBe(false)
  })
})

describe('restoreStory (optimistic rollback)', () => {
  it('restores the exact snapshot even after later changes', () => {
    const snapshot = story('a', 7, false)
    // Optimistic toggle, then a second toggle landed before the first failed.
    let list = applyLikeToggle([snapshot], 'a').stories
    list = applyLikeToggle(list, 'a').stories
    const rolledBack = restoreStory(list, snapshot)
    expect(rolledBack[0].likeCount).toBe(7)
    expect(rolledBack[0].likedByMe).toBe(false)
  })
})
