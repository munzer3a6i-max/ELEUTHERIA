import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 p-16 text-center">
      <p className="text-2xl font-bold text-ink">404</p>
      <p className="text-sm text-ink-2">This page doesn't exist.</p>
      <Link to="/" className="text-xs text-accent-text hover:text-accent">
        Back to Dashboard
      </Link>
    </div>
  )
}
