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
    <div className="-mx-4 flex items-center gap-1 overflow-x-auto border-b border-line px-4 pt-1 sm:mx-0 sm:px-0">
      {tabs.map((tab) => {
        const isActive = tab.key === active
        const Icon = tab.icon
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={`flex shrink-0 items-center gap-1.5 rounded-t px-3 pb-2.5 pt-2 text-[11px] whitespace-nowrap transition-colors ${
              isActive
                ? 'border-b-2 border-accent-line bg-accent-soft/50 font-bold text-accent-text'
                : 'border-b-2 border-transparent text-ink-2 hover:text-ink'
            }`}
          >
            {isActive && tab.key === 'financial' ? (
              <span className="flex size-4 items-center justify-center rounded-pill bg-accent/20 text-[10px] font-bold text-accent-text">
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
