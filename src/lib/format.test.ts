import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { timeAgo, countdown, initials, hueFromString, clock, isHttpUrl } from './format'

// Freeze the clock so relative-time assertions are deterministic.
beforeAll(() => { vi.useFakeTimers(); vi.setSystemTime(new Date('2026-06-13T12:00:00Z')) })
afterAll(() => { vi.useRealTimers() })

describe('clock', () => {
  it('formats seconds as m:ss', () => {
    expect(clock(0)).toBe('0:00')
    expect(clock(7)).toBe('0:07')
    expect(clock(65)).toBe('1:05')
    expect(clock(600)).toBe('10:00')
  })
  it('handles invalid input', () => {
    expect(clock(-5)).toBe('0:00')
    expect(clock(NaN)).toBe('0:00')
    expect(clock(Infinity)).toBe('0:00')
  })
})

describe('timeAgo', () => {
  it('handles recent and old timestamps', () => {
    expect(timeAgo(new Date().toISOString())).toBe('just now')
    expect(timeAgo(new Date(Date.now() - 5 * 60_000).toISOString())).toBe('5m ago')
    expect(timeAgo(new Date(Date.now() - 3 * 3_600_000).toISOString())).toBe('3h ago')
    expect(timeAgo(new Date(Date.now() - 2 * 86_400_000).toISOString())).toBe('2d ago')
  })
  it('returns empty for garbage', () => {
    expect(timeAgo('nonsense')).toBe('')
  })
})

describe('countdown', () => {
  it('says aired for the past', () => {
    expect(countdown(Math.floor(Date.now() / 1000) - 60)).toBe('aired')
  })
  it('formats future gaps', () => {
    const now = Math.floor(Date.now() / 1000)
    expect(countdown(now + 90)).toBe('1m')
    expect(countdown(now + 2 * 3600 + 600)).toBe('2h 10m')
    expect(countdown(now + 86400 + 3600)).toBe('1d 1h')
  })
})

describe('initials', () => {
  it('takes first letters of first two words', () => {
    expect(initials('Attack on Titan')).toBe('AO')
    expect(initials('Bleach')).toBe('BL')
  })
  it('handles empty/symbol-only titles', () => {
    expect(initials('')).toBe('?')
  })
})

describe('hueFromString', () => {
  it('is deterministic and in range', () => {
    const h = hueFromString('animefor')
    expect(h).toBe(hueFromString('animefor'))
    expect(h).toBeGreaterThanOrEqual(0)
    expect(h).toBeLessThan(360)
  })
})

describe('isHttpUrl', () => {
  it('accepts http(s) and rejects everything else', () => {
    expect(isHttpUrl('https://youtube.com/@mappa')).toBe(true)
    expect(isHttpUrl('http://example.com')).toBe(true)
    expect(isHttpUrl('javascript:alert(1)')).toBe(false)
    expect(isHttpUrl('')).toBe(false)
    expect(isHttpUrl(null)).toBe(false)
    expect(isHttpUrl(undefined)).toBe(false)
  })
})
