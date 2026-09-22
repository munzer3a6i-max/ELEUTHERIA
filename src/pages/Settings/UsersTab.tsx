import { useState } from 'react'
import { KeyRound, Pencil, Plus, Trash2, UserCog, UserMinus, UserPlus } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import { useTranslation } from '../../i18n/useTranslation'
import { useCurrentUser } from '../../lib/useCurrentUser'
import { DEFAULT_PASSWORD, passwordProblem, usernameProblem } from '../../lib/passwords'
import { ROLES, ROLE_LABEL, ROLE_SUMMARY } from '../../lib/permissions'
import Card from '../../components/Card'
import Modal from '../../components/Modal'
import StatusBadge from '../../components/StatusBadge'
import { BilingualField, Field, TextInput, SelectInput, PrimaryButton, SecondaryButton } from '../../components/form'
import type { StaffMember, StaffRole } from '../../types'

export default function UsersTab() {
  const staff = useAppStore((s) => s.staff)
  const updateStaff = useAppStore((s) => s.updateStaff)
  const toggleStaffActive = useAppStore((s) => s.toggleStaffActive)
  const deleteStaff = useAppStore((s) => s.deleteStaff)
  const resetStaffPassword = useAppStore((s) => s.resetStaffPassword)
  const { t, tb, language } = useTranslation()
  const { member: me } = useCurrentUser()

  const [editing, setEditing] = useState<StaffMember | 'new' | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  /** Turns a refusal from the store into something a person can act on. */
  function report(outcome: 'ok' | 'last-admin' | 'self' | 'username-taken'): boolean {
    if (outcome === 'ok') return true
    setNotice(
      outcome === 'last-admin'
        ? t('users_last_admin')
        : outcome === 'self'
          ? t('users_self')
          : t('users_username_taken'),
    )
    return false
  }

  function handleRole(member: StaffMember, role: StaffRole) {
    setNotice(null)
    // Giving away your own administrator role closes this page behind you, so
    // say so before it happens rather than after.
    if (member.id === me?.id && role !== 'admin' && !window.confirm(t('users_demote_self'))) return
    report(updateStaff(member.id, { role }))
  }

  function handleDelete(member: StaffMember) {
    setNotice(null)
    if (!window.confirm(`${t('users_delete_confirm')}\n\n${tb(member.name)} (${member.username})`)) return
    report(deleteStaff(member.id))
  }

  async function handleReset(member: StaffMember) {
    setNotice(null)
    if (!window.confirm(`${t('users_reset_password')}: ${tb(member.name)} → ${DEFAULT_PASSWORD}`)) return
    await resetStaffPassword(member.id, DEFAULT_PASSWORD)
    setNotice(`${t('users_reset_done')} ${DEFAULT_PASSWORD} — ${tb(member.name)}`)
  }

  return (
    <div className="flex flex-col gap-4">
      {notice && (
        <p className="rounded-control border border-accent-line bg-accent-soft px-3 py-2 text-[11.5px] text-accent-text">
          {notice}
        </p>
      )}

      <Card
        icon={<UserCog className="size-3.5" />}
        title={t('users_title')}
        subtitle={t('users_subtitle')}
        action={
          <button type="button" onClick={() => setEditing('new')} className="btn btn-primary h-7">
            <Plus className="size-3.5" /> {t('users_add')}
          </button>
        }
        bodyClassName="overflow-x-auto p-0"
      >
        <table className="data-table">
          <thead>
            <tr>
              <th>{t('label_name')}</th>
              <th>{t('auth_username')}</th>
              <th>{t('perm_role')}</th>
              <th>{t('auth_password')}</th>
              <th>{t('label_status')}</th>
              <th className="text-end">{t('label_action')}</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((member) => (
              <tr key={member.id}>
                <td>
                  <span className="block font-medium text-ink">
                    {tb(member.name)}
                    {member.id === me?.id && (
                      <span className="ms-2 text-[10.5px] font-normal text-ink-3">
                        ({language === 'ar' ? 'أنت' : 'you'})
                      </span>
                    )}
                  </span>
                  <span dir="ltr" className="block text-[10.5px] text-ink-3 rtl:text-end">{member.email}</span>
                </td>
                <td dir="ltr" className="num rtl:text-end">{member.username}</td>
                <td>
                  <select
                    value={member.role}
                    onChange={(e) => handleRole(member, e.target.value as StaffRole)}
                    aria-label={`${t('perm_role')}: ${tb(member.name)}`}
                    className="rounded-control border border-line bg-sunken px-2 py-1 text-[11px] text-ink focus:outline-none"
                  >
                    {ROLES.map((role) => (
                      <option key={role} value={role}>
                        {ROLE_LABEL[role][language]}
                      </option>
                    ))}
                  </select>
                  <span className="mt-0.5 block text-[10px] text-ink-3">{ROLE_SUMMARY[member.role][language]}</span>
                </td>
                <td>
                  {member.credentials?.temporary ? (
                    <span className="chip chip-warn">{t('auth_temporary')}</span>
                  ) : (
                    <span className="num text-[11px] text-ink-3">
                      {t('auth_last_changed')} {member.credentials?.updatedOn ?? '-'}
                    </span>
                  )}
                </td>
                <td>
                  <StatusBadge status={member.status === 'Active' ? t('label_active') : t('label_inactive')} tone={member.status === 'Active' ? 'pos' : 'neutral'} />
                </td>
                <td className="text-end">
                  <span className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      title={t('action_edit')}
                      aria-label={`${t('action_edit')}: ${member.username}`}
                      onClick={() => setEditing(member)}
                      className="text-ink-3 hover:text-accent-text"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      title={t('users_reset_password')}
                      aria-label={`${t('users_reset_password')}: ${member.username}`}
                      onClick={() => handleReset(member)}
                      className="text-ink-3 hover:text-accent-text"
                    >
                      <KeyRound className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      title={member.status === 'Active' ? t('users_suspend') : t('users_restore')}
                      aria-label={`${member.status === 'Active' ? t('users_suspend') : t('users_restore')}: ${member.username}`}
                      onClick={() => {
                        setNotice(null)
                        report(toggleStaffActive(member.id))
                      }}
                      className="text-ink-3 hover:text-warn"
                    >
                      {member.status === 'Active' ? <UserMinus className="size-3.5" /> : <UserPlus className="size-3.5" />}
                    </button>
                    <button
                      type="button"
                      title={t('action_delete')}
                      aria-label={`${t('action_delete')}: ${member.username}`}
                      onClick={() => handleDelete(member)}
                      className="text-ink-3 hover:text-neg"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card title={t('perm_role')} subtitle={t('users_subtitle')}>
        <dl className="flex flex-col gap-2.5">
          {ROLES.map((role) => (
            <div key={role} className="flex items-baseline gap-3 text-[12px]">
              <dt className="w-32 shrink-0 font-semibold text-ink">{ROLE_LABEL[role][language]}</dt>
              <dd className="text-ink-2">{ROLE_SUMMARY[role][language]}</dd>
            </div>
          ))}
        </dl>
      </Card>

      {editing && (
        <UserModal
          member={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onProblem={setNotice}
        />
      )}
    </div>
  )
}

function UserModal({
  member,
  onClose,
  onProblem,
}: {
  member: StaffMember | null
  onClose: () => void
  onProblem: (message: string) => void
}) {
  const staff = useAppStore((s) => s.staff)
  const addStaff = useAppStore((s) => s.addStaff)
  const updateStaff = useAppStore((s) => s.updateStaff)
  const { t, language } = useTranslation()

  const [nameEn, setNameEn] = useState(member?.name.en ?? '')
  const [nameAr, setNameAr] = useState(member?.name.ar ?? '')
  const [username, setUsername] = useState(member?.username ?? '')
  const [password, setPassword] = useState(DEFAULT_PASSWORD)
  const [role, setRole] = useState<StaffRole>(member?.role ?? 'data_entry')
  const [email, setEmail] = useState(member?.email ?? '')
  const [phone, setPhone] = useState(member?.phone ?? '')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const taken = staff.filter((m) => m.id !== member?.id).map((m) => m.username)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    if (!nameEn.trim()) return

    const badName = usernameProblem(username, taken, language)
    if (badName) {
      setError(badName)
      return
    }

    if (member) {
      const outcome = updateStaff(member.id, {
        name: { en: nameEn.trim(), ar: nameAr.trim() },
        username,
        email: email.trim(),
        phone: phone.trim(),
        role,
      })
      if (outcome !== 'ok') {
        onProblem(outcome === 'last-admin' ? t('users_last_admin') : t('users_username_taken'))
        return
      }
      onClose()
      return
    }

    const badPassword = passwordProblem(password, language)
    if (badPassword) {
      setError(badPassword)
      return
    }

    setBusy(true)
    const outcome = await addStaff({
      name: { en: nameEn.trim(), ar: nameAr.trim() },
      username,
      password,
      role,
      email: email.trim(),
      phone: phone.trim(),
    })
    setBusy(false)
    if (outcome !== 'ok') {
      setError(t('users_username_taken'))
      return
    }
    onClose()
  }

  return (
    <Modal title={member ? t('users_edit') : t('users_add')} onClose={onClose} width="max-w-lg">
      <form onSubmit={handleSubmit}>
        <BilingualField
          labelEn={t('label_english_name')}
          labelAr={t('label_arabic_name')}
          valueEn={nameEn}
          valueAr={nameAr}
          onChangeEn={setNameEn}
          onChangeAr={setNameAr}
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label={t('auth_username')}>
            <TextInput
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="off"
              spellCheck={false}
              required
            />
          </Field>
          {member ? (
            <Field label={t('auth_password')} hint={t('users_password_hint')}>
              <TextInput value="•••••" disabled className="opacity-60" />
            </Field>
          ) : (
            <Field label={t('users_starting_password')} hint={t('users_password_hint')}>
              <TextInput value={password} onChange={(e) => setPassword(e.target.value)} required />
            </Field>
          )}
        </div>
        <Field label={t('perm_role')}>
          <SelectInput value={role} onChange={(e) => setRole(e.target.value as StaffRole)}>
            {ROLES.map((option) => (
              <option key={option} value={option}>
                {ROLE_LABEL[option][language]} — {ROLE_SUMMARY[option][language]}
              </option>
            ))}
          </SelectInput>
        </Field>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label={t('label_email')}>
            <TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label={t('label_phone')}>
            <TextInput value={phone} onChange={(e) => setPhone(e.target.value)} />
          </Field>
        </div>

        {error && <p className="mb-3 text-[11.5px] font-medium text-neg">{error}</p>}

        <div className="mt-4 flex justify-end gap-2">
          <SecondaryButton onClick={onClose}>{t('action_cancel')}</SecondaryButton>
          <PrimaryButton type="submit" disabled={busy}>
            {member ? t('action_save') : t('users_add')}
          </PrimaryButton>
        </div>
      </form>
    </Modal>
  )
}
