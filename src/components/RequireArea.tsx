import { Link, useLocation } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { useCurrentUser } from '../lib/useCurrentUser'
import { areaForPath, ROLE_LABEL } from '../lib/permissions'
import { useTranslation } from '../i18n/useTranslation'

/**
 * Stands in front of every page. A role that cannot see this area is told so
 * plainly, rather than being bounced somewhere else with no explanation.
 */
export default function RequireArea({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation()
  const { role, canView } = useCurrentUser()
  const { t, language } = useTranslation()
  const area = areaForPath(pathname)

  if (canView(area)) return <>{children}</>

  return (
    <div className="flex flex-col items-center gap-3 p-16 text-center">
      <span className="flex size-10 items-center justify-center rounded-pill bg-raised text-ink-3">
        <Lock className="size-4.5" />
      </span>
      <h1 className="text-[15px] font-semibold text-ink">{t('perm_no_access')}</h1>
      <p className="max-w-sm text-[12.5px] leading-relaxed text-ink-3">
        {language === 'ar'
          ? `هذه الصفحة خارج صلاحيات دور ${ROLE_LABEL[role].ar}. تحدث إلى المسؤول إذا كنت بحاجة إليها.`
          : `This page is outside what a ${ROLE_LABEL[role].en} account may open. Ask an administrator if you need it.`}
      </p>
      <Link to="/" className="btn btn-secondary">
        {t('nav_dashboard')}
      </Link>
    </div>
  )
}
