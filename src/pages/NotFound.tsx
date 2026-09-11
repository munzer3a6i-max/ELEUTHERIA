import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 p-16 text-center">
      <p className="text-2xl font-bold text-slate-200">404</p>
      <p className="text-sm text-slate-400">This page doesn't exist.</p>
      <Link to="/" className="text-xs text-amber-400 hover:text-amber-300">
        Back to Dashboard
      </Link>
    </div>
  )
}
