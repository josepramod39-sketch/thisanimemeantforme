import { hueFromString } from '../lib/format'

interface AvatarProps {
  seed: string
  size?: number
}

/**
 * Default two-tone avatar in the spec's style: warm circle backdrop with a
 * bold magenta smiling face. The backdrop hue drifts slightly per seed so
 * users feel distinct while staying on-brand.
 */
export default function Avatar({ seed, size = 44 }: AvatarProps) {
  const hue = hueFromString(seed)
  const bg = `hsl(${(hue % 50) + 38}, 95%, 62%)` // warm yellow/orange band
  const face = '#e5337e'
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role="img"
      aria-label={`${seed} avatar`} style={{ borderRadius: '50%', display: 'block', boxShadow: 'var(--shadow-card)' }}>
      <rect width="100" height="100" fill={bg} />
      <g fill={face}>
        <circle cx="36" cy="42" r="7" />
        <circle cx="64" cy="42" r="7" />
        <path d="M30 60 Q50 80 70 60" stroke={face} strokeWidth="7"
          strokeLinecap="round" fill="none" />
      </g>
    </svg>
  )
}
