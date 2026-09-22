import { Link } from 'react-router-dom'
import { Settings as SettingsIcon, UserCog } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import { useTranslation } from '../../i18n/useTranslation'
import { useCurrentUser } from '../../lib/useCurrentUser'
import { ROLE_LABEL, ROLE_SUMMARY } from '../../lib/permissions'
import PageHeader from '../../components/PageHeader'
import Card from '../../components/Card'
import StatusBadge from '../../components/StatusBadge'

/**
 * The roster: who works here and how much of the caseload each one carries.
 * Accounts, roles and passwords are one thing and belong in one place, which
 * is Settings; this page links there rather than offering a second way to
 * change the same records.
 */
export default function StaffList() {
  const staff = useAppStore((s) => s.staff)
  const requests = useAppStore((s) => s.requests)
  const { t, tb, language } = useTranslation()
  const { canView } = useCurrentUser()

  return (
    <div className="flex flex-col gap-4 p-4">
      <PageHeader
        title={t('nav_staff')}
        subtitle={t('page_staff_subtitle')}
        actions={
          canView('system') && (
            <Link to="/settings" className="btn btn-secondary">
              <SettingsIcon className="size-3.5" /> {t('users_title')}
            </Link>
          )
        }
      />

      <Card bodyClassName="overflow-x-auto p-0">
        <table className="data-table">
          <thead>
            <tr>
              <th>{t('label_name')}</th>
              <th>{t('perm_role')}</th>
              <th>{t('label_email')}</th>
              <th className="text-end">{language === 'ar' ? 'الطلبات المعالجة' : 'Requests Handled'}</th>
              <th>{t('label_status')}</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((member) => {
              const handled = requests.filter((r) => r.responsibleEmployeeId === member.id).length
              return (
                <tr key={member.id}>
                  <td>
                    <span className="flex items-center gap-2.5">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-pill bg-raised">
                        <UserCog className="size-3.5 text-ink-3" />
                      </span>
                      <span className="min-w-0">
                        <span className="block font-medium text-ink">{tb(member.name)}</span>
                        <span dir="ltr" className="num block text-[10.5px] text-ink-3 rtl:text-end">
                          {member.username}
                        </span>
                      </span>
                    </span>
                  </td>
                  <td>
                    <span className="block text-ink">{ROLE_LABEL[member.role][language]}</span>
                    <span className="block text-[10px] text-ink-3">{ROLE_SUMMARY[member.role][language]}</span>
                  </td>
                  <td dir="ltr" className="rtl:text-end">{member.email}</td>
                  <td className="num text-end text-ink">{handled}</td>
                  <td>
                    <StatusBadge
                      status={member.status === 'Active' ? t('label_active') : t('label_inactive')}
                      tone={member.status === 'Active' ? 'pos' : 'neutral'}
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Card>

      {canView('system') && (
        <p className="text-[11.5px] text-ink-3">
          {t('users_manage_here')}{' '}
          <Link to="/settings" className="text-accent-text hover:text-accent">
            {t('nav_settings')}
          </Link>
        </p>
      )}
    </div>
  )
}
