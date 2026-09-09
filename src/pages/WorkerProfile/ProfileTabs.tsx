import { User, ListChecks, FileText, History } from 'lucide-react'

const tabs = [
  { key: 'info', label: 'Worker Information', icon: User },
  { key: 'stages', label: 'Recruitment Stages', icon: ListChecks },
  { key: 'financial', label: 'Financial Center', icon: null },
  { key: 'documents', label: 'Documents', icon: FileText },
  { key: 'notes', label: 'Notes & History', icon: History },
] as const

export default function ProfileTabs({
  active,
  onChange,
}: {
  active: string
  onChange: (key: string) => void
}) {
  return (
    <div className="flex items-center gap-1 border-b border-[#18274d] pt-1">
      {tabs.map((tab) => {
        const isActive = tab.key === active
        const Icon = tab.icon
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={`flex items-center gap-1.5 rounded-t px-3 pb-2.5 pt-2 text-[11px] transition-colors ${
              isActive
                ? 'border-b-2 border-amber-500 bg-[#0d1738]/50 text-amber-400 font-bold'
                : 'border-b-2 border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {isActive && tab.key === 'financial' ? (
              <span className="flex size-4 items-center justify-center rounded-full bg-amber-500/20 text-[10px] font-bold text-amber-400">
                $
              </span>
            ) : (
              Icon && <Icon className="size-3.5" />
            )}
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
