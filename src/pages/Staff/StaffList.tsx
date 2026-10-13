import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Settings as SettingsIcon, UserCog } from 'lucide-react'
import { useAppStore, formatMoney, payrollTotal } from '../../store/useAppStore'
import { useTranslation } from '../../i18n/useTranslation'
import { useCurrentUser } from '../../lib/useCurrentUser'
import { ROLE_LABEL, ROLE_SUMMARY } from '../../lib/permissions'
import PageHeader from '../../components/PageHeader'
import Card from '../../components/Card'
import Modal from '../../components/Modal'
import StatusBadge from '../../components/StatusBadge'
import type { NewStaff } from '../../store/useAppStore'
import { BilingualField, Field, TextInput, PrimaryButton, SecondaryButton } from '../../components/form'

/**
 * The roster: who works here and how much of the caseload each one carries.
 * Accounts, roles and passwords are one thing and belong in one place, which
 * is Settings; this page links there rather than offering a second way to
 * change the same records.
 */
export default function StaffList() {
  const staff = useAppStore((s) => s.staff)
  const requests = useAppStore((s) => s.requests)
  const payroll = useAppStore((s) => s.payroll)
  const addStaff = useAppStore((s) => s.addStaff)
  const currency = useAppStore((s) => s.settings.currency)
  const { t, tb, language } = useTranslation()
  const { canView, canEdit } = useCurrentUser()
  const [addOpen, setAddOpen] = useState(false)

  const thisMonth = new Date().toISOString().slice(0, 7)

  return (
    <div className="flex flex-col gap-4 p-4">
      <PageHeader
        title={t('nav_staff')}
        subtitle={t('page_staff_subtitle')}
        actions={
          canView('system') && (
            <span className="flex flex-wrap items-center gap-2">
              <Link to="/settings" className="btn btn-secondary">
                <SettingsIcon className="size-3.5" /> {t('users_title')}
              </Link>
              {canEdit('system') && (
                <PrimaryButton onClick={() => setAddOpen(true)}>
                  <Plus className="size-3.5" /> {t('staff_add')}
                </PrimaryButton>
              )}
            </span>
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
              <th className="text-end">{t('staff_this_month')}</th>
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
                  <td dir="ltr" className="num text-end text-ink-2">
                    {(() => {
                      const entry = payroll.find((e) => e.staffId === member.id && e.month === thisMonth)
                      return entry ? formatMoney(payrollTotal(entry), currency, 0) : '-'
                    })()}
                  </td>
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

      {addOpen && (
        <AddStaffModal
          onClose={() => setAddOpen(false)}
          onSubmit={(data) => {
            void addStaff(data)
            setAddOpen(false)
          }}
        />
      )}
    </div>
  )
}

/**
 * Somebody joining the office. No username, no password, no role: this is the
 * roster, and a way into the dashboard is a separate decision made in
 * Settings, Users. What it does do is open their payroll row for this month,
 * because a person on the roster is a person to pay.
 */
function AddStaffModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void
  onSubmit: (data: NewStaff) => void
}) {
  const { t, language } = useTranslation()
  const [en, setEn] = useState('')
  const [ar, setAr] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [salary, setSalary] = useState('')
  const [problem, setProblem] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!en.trim()) {
      setProblem(language === 'ar' ? 'الاسم بالإنجليزية مطلوب.' : 'The English name is needed.')
      return
    }
    onSubmit({
      name: { en: en.trim(), ar: ar.trim() },
      phone: phone.trim(),
      email: email.trim(),
      role: 'none',
      username: '',
      password: '',
      monthlySalary: Number(salary) || 0,
    })
  }

  return (
    <Modal title={t('staff_add')} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <BilingualField
          labelEn={t('label_english_name')}
          labelAr={t('label_arabic_name')}
          valueEn={en}
          valueAr={ar}
          onChangeEn={setEn}
          onChangeAr={setAr}
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label={t('label_phone')}>
            <TextInput value={phone} onChange={(e) => setPhone(e.target.value)} />
          </Field>
          <Field label={t('label_email')}>
            <TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
        </div>
        <Field label={t('staff_salary')}>
          <TextInput type="number" min={0} step="0.01" value={salary} onChange={(e) => setSalary(e.target.value)} />
          <p className="mt-1 text-[10px] leading-relaxed text-ink-3">{t('staff_salary_hint')}</p>
        </Field>
        <p className="rounded-control border border-line bg-sunken p-2.5 text-[10.5px] leading-relaxed text-ink-3">
          {t('staff_no_signin_hint')}
        </p>
        {problem && <p className="mt-2 text-[11px] font-medium text-neg">{problem}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <SecondaryButton onClick={onClose}>{t('action_cancel')}</SecondaryButton>
          <PrimaryButton type="submit">{t('staff_add')}</PrimaryButton>
        </div>
      </form>
    </Modal>
  )
}
