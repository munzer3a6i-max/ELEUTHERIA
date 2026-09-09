import { ChevronRight } from 'lucide-react'

export default function Breadcrumb() {
  return (
    <nav className="flex items-center gap-1.5 text-xs text-slate-400">
      <a href="#" className="hover:text-slate-200">
        Workers
      </a>
      <ChevronRight className="size-3" />
      <span className="text-slate-200">Worker Profile</span>
    </nav>
  )
}
