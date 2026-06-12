import { describe, it, expect, beforeAll, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useYouTubePlayer } from './useYouTubePlayer'

// --- Stub the YouTube IFrame API before the hook's loadApi() runs ---------
const created: FakePlayer[] = []

class FakePlayer {
  destroyed = false
  videoId: string
  loadVideoById = vi.fn((id: string) => { this.videoId = id })
  playVideo = vi.fn()
  pauseVideo = vi.fn()
  seekTo = vi.fn()
  mute = vi.fn()
  unMute = vi.fn()
  isMuted = () => true
  getCurrentTime = () => 0
  getDuration = () => 120
  destroy = vi.fn(() => { this.destroyed = true })

  constructor(_el: HTMLElement, opts: { videoId: string; events: { onReady: (e: { target: FakePlayer }) => void } }) {
    this.videoId = opts.videoId
    created.push(this)
    // YouTube fires onReady asynchronously.
    setTimeout(() => opts.events.onReady({ target: this }), 0)
  }
}

beforeAll(() => {
  // Minimal stub of the YT namespace (constructor param narrower than the real type).
  window.YT = {
    Player: FakePlayer,
    PlayerState: { ENDED: 0, PLAYING: 1, PAUSED: 2 },
  } as unknown as typeof window.YT
})

describe('useYouTubePlayer', () => {
  it('creates one player, becomes ready, and destroys it on unmount', async () => {
    const before = created.length
    const { result, unmount } = renderHook(() => useYouTubePlayer('first-video1'))

    await waitFor(() => expect(result.current.ready).toBe(true))
    expect(created.length).toBe(before + 1)
    expect(created[created.length - 1].videoId).toBe('first-video1')
    expect(result.current.duration).toBe(120)

    const instance = created[created.length - 1]
    unmount()
    expect(instance.destroy).toHaveBeenCalled()
  })

  it('load() switches video and resets current/duration', async () => {
    const { result, unmount } = renderHook(() => useYouTubePlayer('first-video1'))
    await waitFor(() => expect(result.current.ready).toBe(true))

    act(() => result.current.load('second-vid02'))
    const instance = created[created.length - 1]
    expect(instance.loadVideoById).toHaveBeenCalledWith('second-vid02')
    expect(result.current.current).toBe(0)
    expect(result.current.duration).toBe(0) // stale length cleared until poll repopulates
    unmount()
  })
})
