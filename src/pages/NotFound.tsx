import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="container" style={{ padding: '96px 24px', textAlign: 'center' }}>
      <h1 style={{ fontSize: '3rem' }}>404</h1>
      <p style={{ color: 'var(--text-muted)', margin: '12px 0 24px' }}>
        This page wandered off to another world.
      </p>
      <Link to="/" style={{ color: 'var(--magenta)', fontWeight: 600 }}>← Back to the wall</Link>
    </div>
  )
}
