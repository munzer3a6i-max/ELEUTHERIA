import { useState } from 'react'
import { Plus, Trash2, UserCog } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import { useTranslation } from '../../i18n/useTranslation'
import PageHeader from '../../components/PageHeader'
import Modal from '../../components/Modal'
import { BilingualField, Field, TextInput, SelectInput, PrimaryButton, SecondaryButton } from '../../components/form'
import type { StaffMember, StaffRole } from '../../types'

export default function StaffList() {
  const staff = useAppStore((s) => s.staff)
  const requests = useAppStore((s) => s.requests)
  const addStaff = useAppStore((s) => s.addStaff)
  const updateStaffRole = useAppStore((s) => s.updateStaffRole)
  const toggleStaffActive = useAppStore((s) => s.toggleStaffActive)
  const deleteStaff = useAppStore((s) => s.deleteStaff)
  const { t, tb, language } = useTranslation()
  const [addOpen, setAddOpen] = useState(false)

  function handleDelete(id: string, name: string) {
    if (window.confirm(`${t('action_delete')} ${name}?`)) deleteStaff(id)
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <PageHeader
        title={t('nav_staff')}
        subtitle={t('page_staff_subtitle')}
        actions={
          <PrimaryButton onClick={() => setAddOpen(true)} className="flex items-center gap-1.5">
            <Plus className="size-3.5" /> {language === 'ar' ? 'إضافة موظف' : 'Add Staff'}
          </PrimaryButton>
        }
      />

      <div className="overflow-x-auto rounded-panel border border-line bg-surface">
        <table className="data-table">
          <thead>
            <tr>
              <th className="px-4 py-3">{t('label_name')}</th>
              <th className="px-4 py-3">{language === 'ar' ? 'الدور' : 'Role'}</th>
              <th className="px-4 py-3">{t('label_email')}</th>
              <th className="px-4 py-3">{language === 'ar' ? 'الطلبات المعالجة' : 'Requests Handled'}</th>
              <th className="px-4 py-3">{t('label_status')}</th>
              <th className="sticky end-0 bg-surface px-4 py-3 text-end">{t('label_action')}</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((m) => {
              const handled = requests.filter((r) => r.responsibleEmployeeId === m.id).length
              return (
                <tr key={m.id} className="text-xs">
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2.5 text-ink">
                      <span className="flex size-7 items-center justify-center rounded-pill bg-raised">
                        <UserCog className="size-3.5 text-ink-3" />
                      </span>
                      {tb(m.name)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={m.role}
                      onChange={(e) => updateStaffRole(m.id, e.target.value as StaffRole)}
                      className="rounded-control border border-line bg-sunken px-2 py-1 text-[10.5px] text-ink focus:outline-none"
                    >
                      <option value="admin">{language === 'ar' ? 'مسؤول' : 'Admin'}</option>
                      <option value="user">{language === 'ar' ? 'مستخدم' : 'User'}</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-ink-2">{m.email}</td>
                  <td className="px-4 py-3 text-ink-2">{handled}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => toggleStaffActive(m.id)}
                      className={`rounded-control px-2 py-0.5 text-[10px] font-bold ${
                        m.status === 'Active' ? 'bg-pos-soft text-pos' : 'bg-raised text-ink-3'
                      }`}
                    >
                      {m.status === 'Active' ? t('label_active') : t('label_inactive')}
                    </button>
                  </td>
                  <td className="sticky end-0 bg-surface px-4 py-3 text-end">
                    <button type="button" onClick={() => handleDelete(m.id, m.name.en)} className="text-ink-3 hover:text-neg">
                      <Trash2 className="size-3.5" />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {addOpen && (
        <AddStaffModal
          onClose={() => setAddOpen(false)}
          onSubmit={(data) => {
            addStaff(data)
            setAddOpen(false)
          }}
        />
      )}
    </div>
  )
}

function AddStaffModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void
  onSubmit: (data: Omit<StaffMember, 'id' | 'status'>) => void
}) {
  const { t, language } = useTranslation()
  const [nameEn, setNameEn] = useState('')
  const [nameAr, setNameAr] = useState('')
  const [role, setRole] = useState<StaffRole>('user')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nameEn.trim() || !email.trim()) return
    onSubmit({ name: { en: nameEn.trim(), ar: nameAr.trim() }, role, email: email.trim(), phone: phone.trim() })
  }

  return (
    <Modal title={language === 'ar' ? 'إضافة موظف' : 'Add Staff'} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <BilingualField
          labelEn={t('label_english_name')}
          labelAr={t('label_arabic_name')}
          valueEn={nameEn}
          valueAr={nameAr}
          onChangeEn={setNameEn}
          onChangeAr={setNameAr}
          required
        />
        <Field label={language === 'ar' ? 'الدور' : 'Role'}>
          <SelectInput value={role} onChange={(e) => setRole(e.target.value as StaffRole)}>
            <option value="admin">{language === 'ar' ? 'مسؤول (وصول كامل)' : 'Admin (full access)'}</option>
            <option value="user">{language === 'ar' ? 'مستخدم (إدخال بيانات)' : 'User (data entry)'}</option>
          </SelectInput>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('label_email')}>
            <TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </Field>
          <Field label={t('label_phone')}>
            <TextInput value={phone} onChange={(e) => setPhone(e.target.value)} />
          </Field>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <SecondaryButton onClick={onClose}>{t('action_cancel')}</SecondaryButton>
          <PrimaryButton type="submit">{language === 'ar' ? 'إضافة موظف' : 'Add Staff'}</PrimaryButton>
        </div>
      </form>
    </Modal>
  )
}
