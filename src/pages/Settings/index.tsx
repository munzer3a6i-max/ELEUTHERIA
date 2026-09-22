import { useState } from 'react'
import { Building2, UserCog } from 'lucide-react'
import { useTranslation } from '../../i18n/useTranslation'
import PageHeader from '../../components/PageHeader'
import CompanyTab from './CompanyTab'
import UsersTab from './UsersTab'

type TabKey = 'company' | 'users'

export default function Settings() {
  const { t, language } = useTranslation()
  const [tab, setTab] = useState<TabKey>('users')

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'users', label: t('users_tab_users'), icon: <UserCog className="size-3.5" /> },
    { key: 'company', label: t('users_tab_company'), icon: <Building2 className="size-3.5" /> },
  ]

  return (
    <div className="flex flex-col gap-4 p-4">
      <PageHeader
        title={t('nav_settings')}
        subtitle={
          language === 'ar' ? 'المستخدمون وملف الشركة وتفضيلات النظام' : 'Users, company profile and system preferences'
        }
      />

      <div role="tablist" className="flex flex-wrap items-center gap-1 border-b border-line">
        {tabs.map((item) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={tab === item.key}
            onClick={() => setTab(item.key)}
            className={`-mb-px flex items-center gap-2 border-b-2 px-3 py-2 text-[12.5px] transition-colors ${
              tab === item.key
                ? 'border-accent font-semibold text-accent-text'
                : 'border-transparent text-ink-2 hover:text-ink'
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'users' ? <UsersTab /> : <CompanyTab />}
    </div>
  )
}
