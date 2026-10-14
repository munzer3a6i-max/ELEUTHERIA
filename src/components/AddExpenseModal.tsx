/*
  Adding an expense, which is two different jobs wearing one hat.

  Most expenses are one thing that cost one amount. The office's own bills and
  the accommodation's are not: a month is electricity and water and internet
  and whatever else, arriving together and filed together. Typing them as four
  separate expenses means choosing the category four times and attaching the
  same bill four times, and it is the kind of chore people stop doing.

  So choosing one of those two categories turns the amount into four, and
  saving writes a row for each one somebody filled in. The ledger still holds
  one row per thing bought -- which is what the totals and the category chart
  read -- while the office fills the form once.
*/

import { useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { useTranslation } from '../i18n/useTranslation'
import Modal from './Modal'
import { BilingualField, Field, PrimaryButton, SecondaryButton, SelectInput, TextInput } from './form'
import AttachmentField from './AttachmentField'
import type { Attachment, Bilingual, LedgerStatus, OfficeExpense } from '../types'

/** The three that arrive by name, in the order the bills turn up. */
const UTILITIES = [
  { key: 'electricity', en: 'Electricity', ar: 'الكهرباء' },
  { key: 'water', en: 'Water', ar: 'الماء' },
  { key: 'internet', en: 'Internet', ar: 'الإنترنت' },
] as const

/**
 * Which categories are a bill of several things rather than one.
 *
 * Matched by name rather than by id, because the office may rename them or add
 * its own: a category called "Office expenses" or "Accommodation expenses" in
 * either language gets the breakdown, and everything else gets one amount.
 */
function takesUtilities(category: string): boolean {
  return /office|accommodation|مكتب|سكن/i.test(category)
}

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
  const categories = useAppStore((s) => s.expenseCategories)
  const { t, tb, language } = useTranslation()
  const ar = language === 'ar'
  // What the office has filed under before, whether or not the list still
  // holds it: an expense should not quietly change category because somebody
  // tidied the list afterwards.
  const named = categories.map((c) => tb(c.name))
  const choices = [...new Set([...named, ...(expense ? [expense.category] : [])])]
  const [form, setForm] = useState({
    en: expense?.item.en ?? '',
    ar: expense?.item.ar ?? '',
    category: expense?.category ?? '',
    amount: expense ? String(expense.amount) : '',
    date: expense?.date ?? new Date().toISOString().slice(0, 10),
    status: expense?.status ?? ('Paid' as LedgerStatus),
  })
  // One box per utility, and one more for whatever else was on the bill.
  const [bill, setBill] = useState({ electricity: '', water: '', internet: '', other: '', otherFor: '' })
  const [attachment, setAttachment] = useState<Attachment | null>(expense?.attachment ?? null)
  const [problem, setProblem] = useState<string | null>(null)

  // An existing row is one thing; editing it never splits it into four.
  const breakdown = !expense && takesUtilities(form.category)

  function money(value: string): number {
    const amount = Number(value)
    return Number.isFinite(amount) && amount > 0 ? amount : 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setProblem(null)
    if (!form.category) return

    const shared = { category: form.category, date: form.date, status: form.status, attachment }

    if (breakdown) {
      const lines: { item: Bilingual; amount: number }[] = UTILITIES.map((utility) => ({
        item: { en: utility.en, ar: utility.ar },
        amount: money(bill[utility.key]),
      }))
      const other = money(bill.other)
      if (other > 0) {
        const said = bill.otherFor.trim()
        lines.push({ item: { en: said || 'Other', ar: said || 'أخرى' }, amount: other })
      }
      const filled = lines.filter((line) => line.amount > 0)
      if (filled.length === 0) {
        setProblem(ar ? 'اكتب مبلغًا واحدًا على الأقل.' : 'Put an amount against at least one of these.')
        return
      }
      for (const line of filled) addOfficeExpense({ ...shared, ...line })
      onClose()
      return
    }

    const amount = money(form.amount)
    if (!form.en.trim() || amount === 0) return
    const payload = { ...shared, item: { en: form.en.trim(), ar: form.ar.trim() || form.en.trim() }, amount }
    if (expense) updateOfficeExpense(expense.id, payload)
    else addOfficeExpense(payload)
    onClose()
  }

  return (
    <Modal title={expense ? t('acc_edit_expense') : t('fin_add_expense')} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <Field label={t('fin_category')}>
          <SelectInput
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            required
          >
            <option value="" disabled>
              {ar ? 'اختر بندًا' : 'Choose a category'}
            </option>
            {choices.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </SelectInput>
        </Field>

        {breakdown ? (
          <>
            <p className="mb-2 text-[10.5px] leading-relaxed text-ink-3">
              {ar
                ? 'اكتب ما يخص هذا الشهر. كل مبلغ يُسجَّل بندًا مستقلًا تحت هذا التصنيف، والفاتورة المرفقة تخصّها جميعًا.'
                : 'Fill in what this month came to. Each amount is filed as its own line under this category, and the attached bill belongs to all of them.'}
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {UTILITIES.map((utility) => (
                <Field key={utility.key} label={ar ? utility.ar : utility.en}>
                  <TextInput
                    type="number"
                    min="0"
                    step="0.01"
                    value={bill[utility.key]}
                    onChange={(e) => setBill((b) => ({ ...b, [utility.key]: e.target.value }))}
                  />
                </Field>
              ))}
              <Field label={ar ? 'أخرى' : 'Other'}>
                <TextInput
                  type="number"
                  min="0"
                  step="0.01"
                  value={bill.other}
                  onChange={(e) => setBill((b) => ({ ...b, other: e.target.value }))}
                />
              </Field>
              <div className="sm:col-span-2">
                <Field
                  label={ar ? 'الأخرى — ما هي؟' : 'Other — what for?'}
                  hint={ar ? 'يظهر اسمًا للبند' : 'Becomes the name of that line'}
                >
                  <TextInput
                    value={bill.otherFor}
                    onChange={(e) => setBill((b) => ({ ...b, otherFor: e.target.value }))}
                  />
                </Field>
              </div>
            </div>
          </>
        ) : (
          <>
            <BilingualField
              labelEn={ar ? 'البند (إنجليزي)' : 'Item (English)'}
              labelAr={ar ? 'البند (عربي)' : 'Item (Arabic)'}
              valueEn={form.en}
              valueAr={form.ar}
              onChangeEn={(v) => setForm((f) => ({ ...f, en: v }))}
              onChangeAr={(v) => setForm((f) => ({ ...f, ar: v }))}
            />
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
          </>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label={t('label_date')}>
            <TextInput type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} required />
          </Field>
          <Field label={t('label_status')}>
            <SelectInput
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as LedgerStatus }))}
            >
              <option value="Paid">{ar ? 'مدفوع' : 'Paid'}</option>
              <option value="Pending">{ar ? 'قيد الانتظار' : 'Pending'}</option>
            </SelectInput>
          </Field>
        </div>

        <AttachmentField value={attachment} onChange={setAttachment} />
        {problem && <p className="mt-1 text-[11px] font-medium text-neg">{problem}</p>}
        <div className="mt-2 flex items-center justify-end gap-2">
          <SecondaryButton onClick={onClose}>{t('action_cancel')}</SecondaryButton>
          <PrimaryButton type="submit">{t('action_save')}</PrimaryButton>
        </div>
      </form>
    </Modal>
  )
}
