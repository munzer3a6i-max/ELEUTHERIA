import { useState } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { useTranslation } from '../../i18n/useTranslation'
import Modal from '../../components/Modal'
import { Field, PrimaryButton, SecondaryButton, SelectInput, TextInput } from '../../components/form'
import type { LedgerStatus, PayrollEntry } from '../../types'

export default function PayrollEntryModal({
  entry,
  month,
  onClose,
}: {
  entry: PayrollEntry | null
  month: string
  onClose: () => void
}) {
  const staff = useAppStore((s) => s.staff)
  const addPayrollEntry = useAppStore((s) => s.addPayrollEntry)
  const updatePayrollEntry = useAppStore((s) => s.updatePayrollEntry)
  const { t, tb, language } = useTranslation()

  const [form, setForm] = useState({
    staffId: entry?.staffId ?? staff[0]?.id ?? '',
    month: entry?.month ?? month,
    basicSalary: String(entry?.basicSalary ?? ''),
    overtime: String(entry?.overtime ?? '0'),
    allowances: String(entry?.allowances ?? '0'),
    status: entry?.status ?? ('Pending' as LedgerStatus),
  })

  const number = (value: string) => {
    const parsed = Number(value)
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0
  }
  const total = number(form.basicSalary) + number(form.overtime) + number(form.allowances)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.staffId || !/^\d{4}-\d{2}$/.test(form.month) || number(form.basicSalary) <= 0) return
    const payload = {
      staffId: form.staffId,
      month: form.month,
      basicSalary: number(form.basicSalary),
      overtime: number(form.overtime),
      allowances: number(form.allowances),
      status: form.status,
    }
    if (entry) updatePayrollEntry(entry.id, payload)
    else addPayrollEntry(payload)
    onClose()
  }

  return (
    <Modal title={entry ? t('acc_edit_entry') : t('acc_new_entry')} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('acc_employee')}>
            <SelectInput value={form.staffId} onChange={(e) => setForm((f) => ({ ...f, staffId: e.target.value }))}>
              {staff.map((member) => (
                <option key={member.id} value={member.id}>
                  {tb(member.name)}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label={t('acc_month')}>
            <TextInput type="month" value={form.month} onChange={(e) => setForm((f) => ({ ...f, month: e.target.value }))} required />
          </Field>
          <Field label={t('fin_basic_salary')}>
            <TextInput
              type="number"
              min="0"
              step="1"
              value={form.basicSalary}
              onChange={(e) => setForm((f) => ({ ...f, basicSalary: e.target.value }))}
              required
            />
          </Field>
          <Field label={t('fin_overtime')}>
            <TextInput
              type="number"
              min="0"
              step="1"
              value={form.overtime}
              onChange={(e) => setForm((f) => ({ ...f, overtime: e.target.value }))}
            />
          </Field>
          <Field label={t('fin_allowances')}>
            <TextInput
              type="number"
              min="0"
              step="1"
              value={form.allowances}
              onChange={(e) => setForm((f) => ({ ...f, allowances: e.target.value }))}
            />
          </Field>
          <Field label={t('label_status')}>
            <SelectInput
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as LedgerStatus }))}
            >
              <option value="Pending">{language === 'ar' ? 'قيد الانتظار' : 'Pending'}</option>
              <option value="Paid">{language === 'ar' ? 'مدفوع' : 'Paid'}</option>
            </SelectInput>
          </Field>
        </div>

        <p className="mb-3 flex items-center justify-between rounded-control border border-line bg-sunken px-3 py-2 text-xs">
          <span className="text-ink-2">{t('acc_net_pay')}</span>
          <span dir="ltr" className="font-bold num text-ink">
            {total.toLocaleString('en-US')}
          </span>
        </p>

        <div className="flex items-center justify-end gap-2">
          <SecondaryButton onClick={onClose}>{t('action_cancel')}</SecondaryButton>
          <PrimaryButton type="submit">{t('action_save')}</PrimaryButton>
        </div>
      </form>
    </Modal>
  )
}
