import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useAppStore, invoiceTotalPaid, invoiceBalance, formatMoney } from '../../../../store/useAppStore'
import { useTranslation } from '../../../../i18n/useTranslation'
import Modal from '../../../../components/Modal'
import { Field, SelectInput, TextInput, PrimaryButton, SecondaryButton } from '../../../../components/form'
import AttachmentField, { AttachmentChip } from '../../../../components/AttachmentField'
import type { Attachment, Invoice } from '../../../../types'

export default function IncomeTable({ invoice, onCreateInvoice }: { invoice: Invoice | null; onCreateInvoice: () => void }) {
  const { t, language } = useTranslation()
  const [paymentOpen, setPaymentOpen] = useState(false)

  if (!invoice) {
    return (
      <div className="rounded-panel border border-line bg-surface p-[13px]">
        <h2 className="mb-2 text-[11px] font-semibold text-ink-3">
          {language === 'ar' ? 'الدخل من العميل' : 'Income From Client'}
        </h2>
        <p className="mb-3 text-[11px] text-ink-3">
          {language === 'ar' ? 'لا توجد فاتورة لهذا الطلب بعد.' : 'No invoice exists for this request yet.'}
        </p>
        <SecondaryButton onClick={onCreateInvoice}>{language === 'ar' ? 'إنشاء فاتورة' : 'Create Invoice'}</SecondaryButton>
      </div>
    )
  }

  const totalIncome = invoiceTotalPaid(invoice)

  return (
    <div className="rounded-panel border border-line bg-surface p-[13px]">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-[11px] font-semibold text-ink-3">
          {language === 'ar' ? 'الدخل من العميل' : 'Income From Client'}
        </h2>
        <button
          type="button"
          onClick={() => setPaymentOpen(true)}
          className="flex items-center gap-1 rounded-control bg-pos px-2.5 py-1 text-[10px] font-semibold text-page hover:opacity-90"
        >
          <Plus className="size-2.5" /> {language === 'ar' ? 'إضافة دفعة' : 'Add Payment'}
        </button>
      </div>

      <div className="mb-2 flex items-center justify-between text-[11px] text-ink-2">
        <span>
          {invoice.invoiceNumber} · {invoice.status}
        </span>
        <span>
          {formatMoney(totalIncome)} / {formatMoney(invoice.servicePrice)}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="data-table min-w-[400px]">
          <thead>
            <tr>
              <th className="px-2 pb-3.5 pt-2 text-[10.5px] font-semibold text-ink-2">#</th>
              <th className="px-2 pb-3.5 pt-2 text-[10.5px] font-semibold text-ink-2">{t('label_date')}</th>
              <th className="px-2 pb-3.5 pt-2 text-end text-[10.5px] font-semibold text-ink-2">{t('label_amount')} (USD)</th>
            </tr>
          </thead>
          <tbody>
            {invoice.payments.map((p, i) => (
              <tr key={p.id} className="border-t border-line first:border-t-0">
                <td className="px-2 py-3.5 text-[10.5px] text-ink-3">{i + 1}</td>
                <td className="px-2 py-3.5 text-[10.5px] text-ink-2">{p.date}</td>
                <td className="px-2 py-3.5 text-end text-[10.5px] text-ink">
                  <span className="inline-flex items-center gap-1.5">
                    {formatMoney(p.amount)}
                    <AttachmentChip attachment={p.attachment} />
                  </span>
                </td>
              </tr>
            ))}
            {invoice.payments.length === 0 && (
              <tr>
                <td colSpan={3} className="px-2 py-6 text-center text-[11px] text-ink-3">
                  {language === 'ar' ? 'لا توجد دفعات مسجلة بعد.' : 'No payments recorded yet.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-1 flex items-center justify-between border-t border-line pt-2.5">
        <span className="panel-title text-pos">
          {language === 'ar' ? 'إجمالي الدخل' : 'Total Income'}
        </span>
        <span className="text-sm font-bold tracking-[0.35px] text-pos">{formatMoney(totalIncome)}</span>
      </div>

      {paymentOpen && <LogPaymentModal invoiceId={invoice.id} onClose={() => setPaymentOpen(false)} />}
    </div>
  )
}

function LogPaymentModal({ invoiceId, onClose }: { invoiceId: string; onClose: () => void }) {
  const invoice = useAppStore((s) => s.invoices.find((i) => i.id === invoiceId))
  const allPaymentSources = useAppStore((s) => s.paymentSources)
  const paymentSources = allPaymentSources.filter((p) => p.scopes.includes('Invoices'))
  const addInvoicePayment = useAppStore((s) => s.addInvoicePayment)
  const { t, language } = useTranslation()
  const [amount, setAmount] = useState('')
  const [sourceId, setSourceId] = useState(paymentSources[0]?.id ?? '')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [attachment, setAttachment] = useState<Attachment | null>(null)

  if (!invoice) return null
  const balance = invoiceBalance(invoice)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!amount || !sourceId) return
    addInvoicePayment(invoiceId, { date, amount: Number(amount), sourceId, attachment })
    onClose()
  }

  return (
    <Modal title={language === 'ar' ? 'إضافة دفعة' : 'Add Payment'} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <p className="mb-3 text-[11px] text-ink-3">
          {language === 'ar' ? 'الرصيد المتبقي' : 'Remaining balance'}: {formatMoney(balance)}
        </p>
        <Field label={`${t('label_amount')} (USD)`}>
          <TextInput type="number" min={0} max={balance} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required autoFocus />
        </Field>
        <Field label={t('label_date')}>
          <TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </Field>
        <Field label={language === 'ar' ? 'مصدر الدفع' : 'Payment Source'}>
          <SelectInput value={sourceId} onChange={(e) => setSourceId(e.target.value)}>
            {paymentSources.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </SelectInput>
        </Field>
        <AttachmentField value={attachment} onChange={setAttachment} label={t('attach_receipt')} />
        <div className="mt-4 flex justify-end gap-2">
          <SecondaryButton onClick={onClose}>{t('action_cancel')}</SecondaryButton>
          <PrimaryButton type="submit">{language === 'ar' ? 'إضافة الدفعة' : 'Add Payment'}</PrimaryButton>
        </div>
      </form>
    </Modal>
  )
}
