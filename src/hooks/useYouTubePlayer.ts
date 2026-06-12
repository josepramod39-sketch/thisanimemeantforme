import { useCallback, useEffect, useRef, useState } from 'react'

// --- Minimal YouTube IFrame API typings ---------------------------------
interface YTPlayer {
  playVideo(): void
  pauseVideo(): void
  seekTo(seconds: number, allowSeekAhead: boolean): void
  mute(): void
  unMute(): void
  isMuted(): boolean
  loadVideoById(id: string): void
  getCurrentTime(): number
  getDuration(): number
  destroy(): void
}
interface YTNamespace {
  Player: new (el: HTMLElement, opts: unknown) => YTPlayer
  PlayerState: { ENDED: number; PLAYING: number; PAUSED: number }
}
declare global {
  interface Window {
    YT?: YTNamespace
    onYouTubeIframeAPIReady?: () => void
  }
}

let apiPromise: Promise<YTNamespace> | null = null
function loadApi(): Promise<YTNamespace> {
  if (apiPromise) return apiPromise
  apiPromise = new Promise((resolve) => {
    if (window.YT?.Player) return resolve(window.YT)
    const prev = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      prev?.()
      if (window.YT) resolve(window.YT)
    }
    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    document.head.appendChild(tag)
  })
  return apiPromise
}

interface Options {
  onEnded?: () => void
  onError?: () => void
}

export interface YouTubeController {
  containerRef: React.RefObject<HTMLDivElement | null>
  ready: boolean
  playing: boolean
  current: number
  duration: number
  muted: boolean
  toggle: () => void
  seek: (seconds: number) => void
  skip: (delta: number) => void
  toggleMute: () => void
  load: (id: string) => void
}

/**
 * Drives a YouTube video via the IFrame Player API so our own UI (the retro
 * control bar) can play/pause/seek/mute it. StrictMode-safe.
 */
export function useYouTubePlayer(initialId: string, opts: Options = {}): YouTubeController {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const playerRef = useRef<YTPlayer | null>(null)
  const optsRef = useRef(opts)
  useEffect(() => { optsRef.current = opts })

  const [ready, setReady] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)
  const [muted, setMuted] = useState(true)

  useEffect(() => {
    let cancelled = false
    let player: YTPlayer | null = null
    const container = containerRef.current
    const host = document.createElement('div')
    container?.appendChild(host)

    loadApi().then((YT) => {
      if (cancelled) return
      player = new YT.Player(host, {
        videoId: initialId,
        playerVars: {
          autoplay: 1, mute: 1, controls: 0, rel: 0, modestbranding: 1,
          playsinline: 1, iv_load_policy: 3, origin: window.location.origin,
        },
        events: {
          onReady: (e: { target: YTPlayer }) => {
            if (cancelled) return
            setReady(true)
            setDuration(e.target.getDuration())
            setMuted(e.target.isMuted())
          },
          onStateChange: (e: { data: number; target: YTPlayer }) => {
            setPlaying(e.data === YT.PlayerState.PLAYING)
            if (e.data === YT.PlayerState.ENDED) optsRef.current.onEnded?.()
          },
          onError: () => optsRef.current.onError?.(),
        },
      })
      playerRef.current = player
    })

    return () => {
      cancelled = true
      // Destroy the instance this effect created; only clear the shared ref
      // if it still points at our player (StrictMode remount-safe).
      player?.destroy()
      if (playerRef.current === player) playerRef.current = null
      if (container) container.innerHTML = ''
      setReady(false)
    }
    // initialId intentionally only seeds the first load; later changes go via load().
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Poll playback position while a player exists.
  useEffect(() => {
    if (!ready) return
    const id = window.setInterval(() => {
      const p = playerRef.current
      if (!p) return
      setCurrent(p.getCurrentTime())
      const d = p.getDuration()
      if (d) setDuration(d)
    }, 250)
    return () => window.clearInterval(id)
  }, [ready])

  const toggle = useCallback(() => {
    const p = playerRef.current
    if (!p) return
    if (playing) p.pauseVideo()
    else p.playVideo()
  }, [playing])

  const seek = useCallback((seconds: number) => {
    playerRef.current?.seekTo(seconds, true)
    setCurrent(seconds)
  }, [])

  const skip = useCallback((delta: number) => {
    const p = playerRef.current
    if (!p) return
    p.seekTo(Math.max(0, p.getCurrentTime() + delta), true)
  }, [])

  const toggleMute = useCallback(() => {
    const p = playerRef.current
    if (!p) return
    if (p.isMuted()) { p.unMute(); setMuted(false) }
    else { p.mute(); setMuted(true) }
  }, [])

  const load = useCallback((id: string) => {
    playerRef.current?.loadVideoById(id)
    // Reset so the scrubber/label don't briefly show the previous clip's length;
    // the poll repopulates duration once getDuration() > 0 for the new video.
    setCurrent(0)
    setDuration(0)
  }, [])

  return { containerRef, ready, playing, current, duration, muted, toggle, seek, skip, toggleMute, load }
}
