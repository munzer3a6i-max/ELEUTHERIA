import { useState } from 'react'
import { useAppStore, formatMoney, invoiceBalance } from '../store/useAppStore'
import { useTranslation } from '../i18n/useTranslation'
import Modal from './Modal'
import { Field, PrimaryButton, SecondaryButton, SelectInput, TextInput } from './form'

export default function AddIncomeModal({ onClose, currency }: { onClose: () => void; currency: string }) {
  const invoices = useAppStore((s) => s.invoices)
  const employers = useAppStore((s) => s.employers)
  const paymentSources = useAppStore((s) => s.paymentSources)
  const addInvoicePayment = useAppStore((s) => s.addInvoicePayment)
  const { t, tb, language } = useTranslation()

  const open = invoices.filter((invoice) => invoiceBalance(invoice) > 0)
  const sources = paymentSources.filter((source) => source.scopes.includes('Invoices'))
  const [form, setForm] = useState({
    invoiceId: open[0]?.id ?? '',
    amount: open[0] ? String(invoiceBalance(open[0])) : '',
    date: new Date().toISOString().slice(0, 10),
    sourceId: sources[0]?.id ?? '',
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const amount = Number(form.amount)
    if (!form.invoiceId || !Number.isFinite(amount) || amount <= 0) return
    addInvoicePayment(form.invoiceId, { date: form.date, amount, sourceId: form.sourceId })
    onClose()
  }

  return (
    <Modal title={t('fin_add_income')} onClose={onClose}>
      {open.length === 0 ? (
        <div>
          <p className="mb-4 text-xs text-ink-3">
            {language === 'ar' ? 'لا توجد فواتير مستحقة حاليًا.' : 'Every invoice is settled - nothing to collect.'}
          </p>
          <SecondaryButton onClick={onClose}>{t('action_cancel')}</SecondaryButton>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <Field label={t('nav_invoices')}>
            <SelectInput
              value={form.invoiceId}
              onChange={(e) => {
                const invoice = open.find((i) => i.id === e.target.value)
                setForm((f) => ({
                  ...f,
                  invoiceId: e.target.value,
                  amount: invoice ? String(invoiceBalance(invoice)) : f.amount,
                }))
              }}
            >
              {open.map((invoice) => {
                const employer = employers.find((emp) => emp.id === invoice.employerId)
                const name = employer ? tb({ en: employer.englishName, ar: employer.arabicName }) : ''
                return (
                  <option key={invoice.id} value={invoice.id}>
                    {invoice.invoiceNumber} · {name} · {formatMoney(invoiceBalance(invoice), currency)}
                  </option>
                )
              })}
            </SelectInput>
          </Field>
          <div className="grid grid-cols-2 gap-3">
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
          </div>
          <Field label={language === 'ar' ? 'مصدر الدفع' : 'Payment Source'}>
            <SelectInput value={form.sourceId} onChange={(e) => setForm((f) => ({ ...f, sourceId: e.target.value }))}>
              {sources.map((source) => (
                <option key={source.id} value={source.id}>
                  {source.name}
                </option>
              ))}
            </SelectInput>
          </Field>
          <div className="mt-2 flex items-center justify-end gap-2">
            <SecondaryButton onClick={onClose}>{t('action_cancel')}</SecondaryButton>
            <PrimaryButton type="submit">{t('action_save')}</PrimaryButton>
          </div>
        </form>
      )}
    </Modal>
  )
}
