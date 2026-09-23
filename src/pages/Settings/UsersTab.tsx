import { useState } from 'react'
import { KeyRound, Link2, Pencil, Plus, Trash2, UserCog, UserMinus, UserPlus } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import { useTranslation } from '../../i18n/useTranslation'
import { useCurrentUser } from '../../lib/useCurrentUser'
import { DEFAULT_PASSWORD, passwordProblem, usernameProblem } from '../../lib/passwords'
import { ROLES, ROLE_LABEL, ROLE_SUMMARY } from '../../lib/permissions'
import { isSupabaseConfigured } from '../../lib/supabase'
import { createAccount, linkAccounts } from '../../data/accounts'
import Card from '../../components/Card'
import Confirm from '../../components/Confirm'
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
  const [removing, setRemoving] = useState<StaffMember | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [linking, setLinking] = useState(false)

  // Connected, a staff row with no account is somebody who will be turned away
  // at the sign-in screen with a message about the database. Worth saying here,
  // where it can be fixed, rather than only there.
  const unlinked = isSupabaseConfigured ? staff.filter((m) => !m.userId) : []

  async function handleLink() {
    setNotice(null)
    setLinking(true)
    const result = await linkAccounts()
    setLinking(false)
    if (result.error) {
      setNotice(result.error)
      return
    }
    const parts = []
    if (result.linked > 0) parts.push(`${t('users_linked')}: ${result.linked}`)
    if (result.unlinked.length > 0) parts.push(`${t('users_still_unlinked')} ${result.unlinked.join(', ')}`)
    setNotice(parts.length > 0 ? parts.join(' — ') : t('users_none_to_link'))
  }

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

  function handleDelete() {
    if (!removing) return
    setNotice(null)
    const outcome = deleteStaff(removing.id)
    setRemoving(null)
    report(outcome)
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
          <span className="flex items-center gap-2">
            {unlinked.length > 0 && (
              <button
                type="button"
                onClick={handleLink}
                disabled={linking}
                title={t('users_link_explain')}
                className="btn btn-secondary h-7"
              >
                <Link2 className="size-3.5" /> {t('users_link_accounts')}
              </button>
            )}
            <button type="button" onClick={() => setEditing('new')} className="btn btn-primary h-7">
              <Plus className="size-3.5" /> {t('users_add')}
            </button>
          </span>
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
                  {isSupabaseConfigured && !member.userId ? (
                    <span className="chip chip-warn" title={t('users_link_explain')}>
                      {t('users_no_account')}
                    </span>
                  ) : member.credentials?.temporary ? (
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
                      onClick={() => {
                        setNotice(null)
                        setRemoving(member)
                      }}
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
          onNotice={setNotice}
        />
      )}

      {removing && (
        <Confirm
          title={t('users_delete_title')}
          message={`${t('users_delete_confirm')}${isSupabaseConfigured ? ` ${t('users_delete_note')}` : ''}`}
          detail={`${tb(removing.name)} — ${removing.username}${removing.email ? ` · ${removing.email}` : ''}`}
          confirmLabel={t('action_delete')}
          tone="danger"
          onConfirm={handleDelete}
          onClose={() => setRemoving(null)}
        />
      )}
    </div>
  )
}

function UserModal({
  member,
  onClose,
  onNotice,
}: {
  member: StaffMember | null
  onClose: () => void
  onNotice: (message: string) => void
}) {
  const staff = useAppStore((s) => s.staff)
  const addStaff = useAppStore((s) => s.addStaff)
  const updateStaff = useAppStore((s) => s.updateStaff)
  const { t, language } = useTranslation()
  const connected = isSupabaseConfigured

  const [nameEn, setNameEn] = useState(member?.name.en ?? '')
  const [nameAr, setNameAr] = useState(member?.name.ar ?? '')
  const [username, setUsername] = useState(member?.username ?? '')
  const [password, setPassword] = useState(DEFAULT_PASSWORD)
  const [role, setRole] = useState<StaffRole>(member?.role ?? 'data_entry')
  const [email, setEmail] = useState(member?.email ?? '')
  const [phone, setPhone] = useState(member?.phone ?? '')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  // Set once everything checks out, which is what the confirmation asks about.
  const [confirming, setConfirming] = useState(false)

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
        onNotice(outcome === 'last-admin' ? t('users_last_admin') : t('users_username_taken'))
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

    // Connected, the address is not a detail on a card: it is the thing they
    // type to get in, and Supabase Auth has nothing to make an account from
    // without it.
    if (connected && !email.trim()) {
      setError(t('users_email_required'))
      return
    }

    setConfirming(true)
  }

  /** Everything is checked and the administrator has said yes. */
  async function create() {
    setError(null)
    setBusy(true)

    let userId: string | null = null
    let note = t('users_created')

    if (connected) {
      const account = await createAccount(email, password)
      if (account.outcome === 'email-taken') return refuse(t('users_email_taken'))
      if (account.outcome === 'signups-disabled') return refuse(t('users_signups_disabled'))
      if (account.outcome === 'invalid-email') return refuse(t('users_email_invalid'))
      if (account.outcome === 'weak-password') return refuse(t('users_password_weak'))
      if (account.outcome === 'unreachable') {
        return refuse(`${t('users_unreachable')}${account.detail ? ` (${account.detail})` : ''}`)
      }
      if (account.outcome === 'needs-confirmation') note = t('users_needs_confirmation')
      userId = account.userId
    }

    const outcome = await addStaff({
      name: { en: nameEn.trim(), ar: nameAr.trim() },
      username,
      password,
      role,
      email: email.trim(),
      phone: phone.trim(),
      userId,
    })
    setBusy(false)
    // Anything other than a taken username is the role refusing the action, not
    // the name being in use; saying so saves somebody renaming for no reason.
    if (outcome === 'username-taken') return refuse(t('users_username_taken'))
    if (outcome !== 'ok') return refuse(t('users_refused'))

    onNotice(`${note} — ${nameEn.trim()}`)
    onClose()
  }

  function refuse(message: string) {
    setBusy(false)
    setConfirming(false)
    setError(message)
  }

  if (confirming) {
    return (
      <Confirm
        title={t('users_add_confirm_title')}
        message={connected ? t('users_add_confirm') : t('users_add_confirm_local')}
        detail={[
          nameEn.trim(),
          connected ? email.trim() : username,
          ROLE_LABEL[role][language],
        ]
          .filter(Boolean)
          .join(' · ')}
        confirmLabel={t('users_add')}
        busy={busy}
        onConfirm={create}
        onClose={() => setConfirming(false)}
      />
    )
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
          <Field
            label={t('label_email')}
            hint={connected ? (member ? t('users_email_edit_note') : t('users_signs_in_with_email')) : undefined}
          >
            <TextInput
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required={connected && !member}
            />
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
