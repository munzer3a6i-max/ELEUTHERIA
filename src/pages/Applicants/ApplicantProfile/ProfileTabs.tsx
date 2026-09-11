import { User, ListChecks, FileText, History } from 'lucide-react'
import { useTranslation } from '../../../i18n/useTranslation'

export type ProfileTabKey = 'info' | 'stages' | 'financial' | 'documents' | 'notes'

export default function ProfileTabs({
  active,
  onChange,
}: {
  active: ProfileTabKey
  onChange: (key: ProfileTabKey) => void
}) {
  const { language } = useTranslation()

  const tabs: { key: ProfileTabKey; label: string; icon: typeof User | null }[] = [
    { key: 'info', label: language === 'ar' ? 'معلومات المتقدم' : 'Applicant Information', icon: User },
    { key: 'stages', label: language === 'ar' ? 'مراحل الاستقدام' : 'Recruitment Stages', icon: ListChecks },
    { key: 'financial', label: language === 'ar' ? 'المركز المالي' : 'Financial Center', icon: null },
    { key: 'documents', label: language === 'ar' ? 'المستندات' : 'Documents', icon: FileText },
    { key: 'notes', label: language === 'ar' ? 'ملاحظات وسجل' : 'Notes & History', icon: History },
  ]

  return (
    <div className="flex items-center gap-1 border-b border-[var(--edge-soft)] pt-1">
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
                ? 'border-b-2 border-amber-500 bg-[var(--active)]/50 font-bold text-amber-500'
                : 'border-b-2 border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {isActive && tab.key === 'financial' ? (
              <span className="flex size-4 items-center justify-center rounded-full bg-amber-500/20 text-[10px] font-bold text-amber-500">
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
