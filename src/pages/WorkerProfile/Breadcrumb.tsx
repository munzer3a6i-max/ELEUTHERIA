import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Breadcrumb({ workerName }: { workerName: string }) {
  return (
    <nav className="flex items-center gap-1.5 text-xs text-slate-400">
      <Link to="/workers" className="hover:text-slate-200">
        Workers
      </Link>
      <ChevronRight className="size-3" />
      <span className="text-slate-200">{workerName}</span>
    </nav>
  )
}
