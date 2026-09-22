import { useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { useTranslation } from '../i18n/useTranslation'
import Modal from './Modal'
import { BilingualField, Field, PrimaryButton, SecondaryButton, SelectInput, TextInput } from './form'
import type { LedgerStatus, OfficeExpense } from '../types'

const CATEGORIES = ['Rent', 'Utilities', 'Supplies', 'Accommodation', 'Logistics', 'Other']

export default function AddExpenseModal({
  onClose,
  expense = null,
}: {
  onClose: () => void
  /** Pass an existing expense to edit it in place instead of adding a new one. */
  expense?: OfficeExpense | null
}) {
  const addOfficeExpense = useAppStore((s) => s.addOfficeExpense)
  const updateOfficeExpense = useAppStore((s) => s.updateOfficeExpense)
  const { t, language } = useTranslation()
  const [form, setForm] = useState({
    en: expense?.item.en ?? '',
    ar: expense?.item.ar ?? '',
    category: expense?.category ?? CATEGORIES[0],
    amount: expense ? String(expense.amount) : '',
    date: expense?.date ?? new Date().toISOString().slice(0, 10),
    status: expense?.status ?? ('Paid' as LedgerStatus),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const amount = Number(form.amount)
    if (!form.en.trim() || !Number.isFinite(amount) || amount <= 0) return
    const payload = {
      item: { en: form.en.trim(), ar: form.ar.trim() || form.en.trim() },
      category: form.category,
      amount,
      date: form.date,
      status: form.status,
    }
    if (expense) updateOfficeExpense(expense.id, payload)
    else addOfficeExpense(payload)
    onClose()
  }

  return (
    <Modal title={expense ? t('acc_edit_expense') : t('fin_add_expense')} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <BilingualField
          labelEn={language === 'ar' ? 'البند (إنجليزي)' : 'Item (English)'}
          labelAr={language === 'ar' ? 'البند (عربي)' : 'Item (Arabic)'}
          valueEn={form.en}
          valueAr={form.ar}
          onChangeEn={(v) => setForm((f) => ({ ...f, en: v }))}
          onChangeAr={(v) => setForm((f) => ({ ...f, ar: v }))}
        />
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('fin_category')}>
            <SelectInput value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
              {[...new Set([...CATEGORIES, form.category])].map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label={t('label_amount')}>
            <TextInput
              type="number"
              min="0"
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              required
            />
          </Field>
          <Field label={t('label_date')}>
            <TextInput type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} required />
          </Field>
          <Field label={t('label_status')}>
            <SelectInput
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as LedgerStatus }))}
            >
              <option value="Paid">{language === 'ar' ? 'مدفوع' : 'Paid'}</option>
              <option value="Pending">{language === 'ar' ? 'قيد الانتظار' : 'Pending'}</option>
            </SelectInput>
          </Field>
        </div>
        <div className="mt-2 flex items-center justify-end gap-2">
          <SecondaryButton onClick={onClose}>{t('action_cancel')}</SecondaryButton>
          <PrimaryButton type="submit">{t('action_save')}</PrimaryButton>
        </div>
      </form>
    </Modal>
  )
}
