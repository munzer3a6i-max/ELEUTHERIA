import { useState } from 'react'
import { KeyRound, ShieldCheck, TriangleAlert } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { useTranslation } from '../i18n/useTranslation'
import { useCurrentUser } from '../lib/useCurrentUser'
import { passwordProblem } from '../lib/passwords'
import { ROLE_LABEL, ROLE_SUMMARY } from '../lib/permissions'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'
import { Field, TextInput, PrimaryButton } from '../components/form'

/**
 * The one page every role can reach: who you are signed in as, and the place
 * to change your own password.
 */
export default function Account() {
  const changeOwnPassword = useAppStore((s) => s.changeOwnPassword)
  const { member, role } = useCurrentUser()
  const { t, tb, language } = useTranslation()

  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setDone(false)

    if (next !== confirm) {
      setError(t('auth_password_mismatch'))
      return
    }
    const problem = passwordProblem(next, language)
    if (problem) {
      setError(problem)
      return
    }

    setBusy(true)
    const outcome = await changeOwnPassword(current, next)
    setBusy(false)
    if (outcome !== 'ok') {
      setError(t('auth_password_wrong'))
      return
    }
    setCurrent('')
    setNext('')
    setConfirm('')
    setDone(true)
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <PageHeader
        title={t('auth_my_account')}
        subtitle={member ? `${tb(member.name)} · ${member.username}` : undefined}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Card icon={<KeyRound className="size-3.5" />} title={t('auth_change_password')}>
            {member?.credentials?.temporary && (
              <p className="mb-3 rounded-control border border-warn/35 bg-warn-soft p-2.5 text-[11.5px] leading-relaxed text-warn">
                {t('auth_temporary_note')}
              </p>
            )}
            <form onSubmit={handleSubmit}>
              <Field label={t('auth_current_password')}>
                <TextInput
                  type="password"
                  value={current}
                  onChange={(e) => setCurrent(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </Field>
              <Field label={t('auth_new_password')}>
                <TextInput
                  type="password"
                  value={next}
                  onChange={(e) => setNext(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </Field>
              <Field label={t('auth_confirm_password')}>
                <TextInput
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </Field>

              {error && (
                <p className="mb-3 flex items-start gap-1.5 text-[11.5px] font-medium text-neg">
                  <TriangleAlert className="mt-px size-3.5 shrink-0" /> {error}
                </p>
              )}
              {done && (
                <p className="mb-3 flex items-start gap-1.5 text-[11.5px] font-medium text-pos">
                  <ShieldCheck className="mt-px size-3.5 shrink-0" /> {t('auth_password_changed')}
                </p>
              )}

              <PrimaryButton type="submit" disabled={busy}>
                {t('auth_change_password')}
              </PrimaryButton>
            </form>
          </Card>
        </div>

        <div className="lg:col-span-7">
          <Card title={t('perm_role')} subtitle={ROLE_LABEL[role][language]}>
            <p className="text-[12.5px] leading-relaxed text-ink-2">{ROLE_SUMMARY[role][language]}</p>
            <dl className="mt-3 flex flex-col gap-2 text-[12px]">
              <div className="flex items-center justify-between gap-3 border-t border-line pt-2">
                <dt className="text-ink-3">{t('auth_username')}</dt>
                <dd dir="ltr" className="num text-ink">{member?.username ?? '-'}</dd>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-line pt-2">
                <dt className="text-ink-3">{t('label_email')}</dt>
                <dd dir="ltr" className="text-ink">{member?.email ?? '-'}</dd>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-line pt-2">
                <dt className="text-ink-3">{t('auth_last_changed')}</dt>
                <dd className="num text-ink">
                  {member?.credentials?.temporary ? t('auth_temporary') : (member?.credentials?.updatedOn ?? '-')}
                </dd>
              </div>
            </dl>
          </Card>
        </div>
      </div>
    </div>
  )
}
