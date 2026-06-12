import { describe, it, expect } from 'vitest'
import { extractYouTubeId, youtubeEmbedUrl, youtubeWatchUrl, trailerEmbedUrl } from './video'

describe('extractYouTubeId', () => {
  it('accepts a bare 11-char id', () => {
    expect(extractYouTubeId('v4yLeNt-kCU')).toBe('v4yLeNt-kCU')
  })
  it('parses watch URLs', () => {
    expect(extractYouTubeId('https://www.youtube.com/watch?v=v4yLeNt-kCU')).toBe('v4yLeNt-kCU')
    expect(extractYouTubeId('https://www.youtube.com/watch?v=v4yLeNt-kCU&t=42s')).toBe('v4yLeNt-kCU')
  })
  it('parses embed, youtu.be and shorts URLs', () => {
    expect(extractYouTubeId('https://www.youtube.com/embed/v4yLeNt-kCU')).toBe('v4yLeNt-kCU')
    expect(extractYouTubeId('https://youtu.be/v4yLeNt-kCU')).toBe('v4yLeNt-kCU')
    expect(extractYouTubeId('https://www.youtube.com/shorts/v4yLeNt-kCU')).toBe('v4yLeNt-kCU')
  })
  it('trims whitespace', () => {
    expect(extractYouTubeId('  v4yLeNt-kCU  ')).toBe('v4yLeNt-kCU')
  })
  it('rejects invalid input', () => {
    expect(extractYouTubeId('')).toBeNull()
    expect(extractYouTubeId('not a url')).toBeNull()
    expect(extractYouTubeId('https://example.com/watch?v=short')).toBeNull()
  })
})

describe('url builders', () => {
  it('builds embed + watch urls', () => {
    expect(youtubeEmbedUrl('abc12345678')).toContain('youtube-nocookie.com/embed/abc12345678')
    expect(youtubeWatchUrl('abc12345678')).toBe('https://www.youtube.com/watch?v=abc12345678')
  })
  it('builds trailer embeds per site and rejects unknown sites', () => {
    expect(trailerEmbedUrl({ id: 'x1', site: 'youtube' })).toContain('youtube-nocookie.com/embed/x1')
    expect(trailerEmbedUrl({ id: 'x2', site: 'dailymotion' })).toContain('dailymotion.com/embed/video/x2')
    expect(trailerEmbedUrl({ id: 'x3', site: 'vimeo' })).toBeNull()
  })
})
