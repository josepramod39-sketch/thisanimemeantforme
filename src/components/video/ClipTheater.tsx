import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import type { ClipRecord } from '../../lib/types'
import { youtubeWatchUrl } from '../../lib/video'
import { useClips } from '../../hooks/useClips'
import { useYouTubePlayer } from '../../hooks/useYouTubePlayer'
import PillButton from '../PillButton'
import {
  PlayIcon, PauseIcon, SkipBackIcon, SkipFwdIcon,
  VolumeIcon, MuteIcon, FullscreenIcon, ExternalIcon,
} from '../icons'
import styles from './ClipTheater.module.css'

const randomIndex = (len: number, exclude = -1) => {
  if (len <= 1) return 0
  let i = exclude
  while (i === exclude) i = Math.floor(Math.random() * len)
  return i
}

function fmt(t: number): string {
  if (!Number.isFinite(t) || t < 0) return '0:00'
  const m = Math.floor(t / 60)
  const s = Math.floor(t % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function ClipTheater() {
  const clips = useClips()
  // Mount the player only once clips are available (avoids an empty video id).
  if (clips.length === 0) return null
  return <Theater clips={clips} />
}

function Theater({ clips }: { clips: ClipRecord[] }) {
  const reduce = useReducedMotion()
  const [index, setIndex] = useState(() => randomIndex(clips.length))
  const [flashKey, setFlashKey] = useState(0)
  const screenRef = useRef<HTMLDivElement | null>(null)
  const trackRef = useRef<HTMLDivElement | null>(null)
  const draggingRef = useRef(false)

  const clip = clips[index] ?? clips[0]
  const nextRef = useRef<() => void>(() => {})

  const player = useYouTubePlayer(clip.id, {
    onEnded: () => nextRef.current(),
    onError: () => nextRef.current(),
  })
  const { containerRef, ready, playing, current, duration, muted, toggle, seek, skip, toggleMute, load } = player

  const next = useCallback(() => {
    setIndex((cur) => {
      const n = randomIndex(clips.length, cur)
      load(clips[n].id)
      return n
    })
    setFlashKey((k) => k + 1)
  }, [load, clips])
  useEffect(() => { nextRef.current = next }, [next])

  const seekFromEvent = (clientX: number) => {
    const el = trackRef.current
    if (!el || !duration) return
    const rect = el.getBoundingClientRect()
    const frac = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
    seek(frac * duration)
  }

  const toggleFullscreen = () => {
    const el = screenRef.current
    if (!el) return
    if (document.fullscreenElement) document.exitFullscreen()
    else el.requestFullscreen?.()
  }

  const progress = duration ? (current / duration) * 100 : 0
  const channelHref = clip.channelUrl ?? youtubeWatchUrl(clip.id)

  return (
    <section className={styles.theater}>
      <div className="container">
        <div className={styles.stage}>
          <div className={styles.antennas} aria-hidden="true">
            <div className={styles.antennaLeft} />
            <div className={styles.antennaRight} />
            <div className={styles.antennaBase} />
          </div>

          <div className={styles.tv}>
            <div className={styles.bezelTop}>
              <span className={styles.lamp} />
              <span className={styles.kind}>{clip.kind === 'amv' ? 'AMV' : 'Official'}</span>
              <a className={styles.handle} href={channelHref} target="_blank" rel="noreferrer">
                {clip.channel} · YouTube <ExternalIcon />
              </a>
            </div>

            <div className={styles.screen} ref={screenRef} onClick={toggle}>
              {/* YouTube IFrame Player mounts here */}
              <div className={styles.player} ref={containerRef} />
              {!ready && <div className={styles.loading}><span className={styles.spinner} /></div>}
              {!reduce && <span className={styles.scanlines} aria-hidden="true" />}
              <span className={styles.glare} aria-hidden="true" />
              <AnimatePresence>
                {!reduce && (
                  <motion.span
                    key={flashKey}
                    className={styles.flash}
                    initial={{ opacity: 0.85 }}
                    animate={{ opacity: 0 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    aria-hidden="true"
                  />
                )}
              </AnimatePresence>
            </div>

            {/* Functional vintage control bar */}
            <div className={styles.controls}>
              <span className={styles.time}>{fmt(current)}</span>
              <button className={styles.ctrl} onClick={() => skip(-10)} aria-label="Back 10 seconds">
                <SkipBackIcon />
              </button>
              <button className={`${styles.ctrl} ${styles.play}`} onClick={toggle} aria-label={playing ? 'Pause' : 'Play'}>
                {playing ? <PauseIcon /> : <PlayIcon />}
              </button>
              <button className={styles.ctrl} onClick={() => skip(10)} aria-label="Forward 10 seconds">
                <SkipFwdIcon />
              </button>
              <div
                className={styles.track}
                ref={trackRef}
                role="slider"
                aria-label="Seek"
                aria-valuemin={0}
                aria-valuemax={Math.round(duration)}
                aria-valuenow={Math.round(current)}
                tabIndex={0}
                onPointerDown={(e) => {
                  draggingRef.current = true
                  ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
                  seekFromEvent(e.clientX)
                }}
                onPointerMove={(e) => { if (draggingRef.current) seekFromEvent(e.clientX) }}
                onPointerUp={() => { draggingRef.current = false }}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowLeft') skip(-5)
                  if (e.key === 'ArrowRight') skip(5)
                }}
              >
                <span className={styles.fill} style={{ width: `${progress}%` }} />
                <span className={styles.knob} style={{ left: `${progress}%` }} />
              </div>
              <span className={styles.time}>{fmt(duration)}</span>
              <button className={styles.ctrl} onClick={toggleMute} aria-label={muted ? 'Unmute' : 'Mute'}>
                {muted ? <MuteIcon /> : <VolumeIcon />}
              </button>
              <button className={styles.ctrl} onClick={toggleFullscreen} aria-label="Fullscreen">
                <FullscreenIcon />
              </button>
            </div>
          </div>

          <p className={styles.caption}>{clip.title}</p>
          <p className={styles.credit}>
            by <a href={channelHref} target="_blank" rel="noreferrer">{clip.channel}</a>
            {' · '}
            <a href={youtubeWatchUrl(clip.id)} target="_blank" rel="noreferrer">Watch on YouTube</a>
          </p>
        </div>

        <div className={styles.actions}>
          <PillButton onClick={next}>Next ✦</PillButton>
        </div>
      </div>
    </section>
  )
}
