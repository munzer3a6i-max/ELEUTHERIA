import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import { useAppStore, invoiceTotalPaid, invoiceBalance, formatMoney } from '../../store/useAppStore'
import { useTranslation } from '../../i18n/useTranslation'
import PageHeader from '../../components/PageHeader'
import StatusBadge from '../../components/StatusBadge'
import Modal from '../../components/Modal'
import { Field, SelectInput, TextInput, PrimaryButton, SecondaryButton } from '../../components/form'
import type { InvoiceStatus } from '../../types'

const STATUS_FILTERS: (InvoiceStatus | 'All')[] = ['All', 'Issued', 'Partial Payment', 'Completed']

export default function InvoicesList() {
  const invoices = useAppStore((s) => s.invoices)
  const requests = useAppStore((s) => s.requests)
  const applicants = useAppStore((s) => s.applicants)
  const employers = useAppStore((s) => s.employers)
  const agencies = useAppStore((s) => s.agencies)
  const deleteInvoice = useAppStore((s) => s.deleteInvoice)
  const { t, tb, language } = useTranslation()

  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'All'>('All')
  const [paymentModal, setPaymentModal] = useState<string | null>(null)

  const filtered = statusFilter === 'All' ? invoices : invoices.filter((i) => i.status === statusFilter)
  const totalBilled = filtered.reduce((sum, i) => sum + i.servicePrice, 0)
  const totalPaid = filtered.reduce((sum, i) => sum + invoiceTotalPaid(i), 0)

  function handleDelete(id: string, number: string) {
    if (window.confirm(`${t('action_delete')} ${number}?`)) deleteInvoice(id)
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <PageHeader title={t('nav_invoices')} subtitle={t('page_invoices_subtitle')} />

      <div className="grid grid-cols-3 gap-4">
        <StatCard label={language === 'ar' ? 'عدد الفواتير' : 'Total Invoices'} value={String(filtered.length)} />
        <StatCard label={language === 'ar' ? 'إجمالي المبلغ' : 'Total Billed'} value={formatMoney(totalBilled)} />
        <StatCard label={language === 'ar' ? 'إجمالي المدفوع' : 'Total Paid'} value={formatMoney(totalPaid)} accent="text-emerald-400" />
      </div>

      <div className="flex items-center gap-1">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatusFilter(s)}
            className={`rounded px-2.5 py-1.5 text-[11px] ${
              statusFilter === s ? 'bg-[var(--active)] text-amber-500' : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
            }`}
          >
            {s === 'All' ? t('label_all') : s}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border border-[var(--edge)] bg-[var(--surface)]">
        <table className="w-full text-start">
          <thead>
            <tr className="border-b border-[var(--edge-soft)] text-[10.5px] font-bold uppercase text-[var(--text-secondary)]">
              <th className="px-4 py-3">{language === 'ar' ? 'رقم الفاتورة' : 'Invoice #'}</th>
              <th className="px-4 py-3">{language === 'ar' ? 'المتقدم' : 'Applicant'}</th>
              <th className="px-4 py-3">{language === 'ar' ? 'صاحب العمل' : 'Employer'}</th>
              <th className="px-4 py-3">{language === 'ar' ? 'مكتب الاستقدام' : 'Agency'}</th>
              <th className="px-4 py-3 text-end">{language === 'ar' ? 'السعر' : 'Price'}</th>
              <th className="px-4 py-3 text-end">{language === 'ar' ? 'المدفوع' : 'Paid'}</th>
              <th className="px-4 py-3 text-end">{language === 'ar' ? 'الرصيد' : 'Balance'}</th>
              <th className="px-4 py-3">{t('label_status')}</th>
              <th className="sticky end-0 bg-[var(--surface)] px-4 py-3 text-end">{t('label_action')}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((inv) => {
              const request = requests.find((r) => r.id === inv.recruitmentRequestId)
              const applicant = applicants.find((a) => a.id === request?.applicantId)
              const employer = employers.find((e) => e.id === inv.employerId)
              const agency = agencies.find((a) => a.id === inv.recruitmentAgencyId)
              return (
                <tr key={inv.id} className="border-b border-[var(--edge-soft2)] text-xs last:border-b-0 hover:bg-[var(--surface-hover)]">
                  <td className="px-4 py-3 font-mono text-[var(--text-primary)]">{inv.invoiceNumber}</td>
                  <td className="px-4 py-3">
                    {applicant ? (
                      <Link to={`/applicants/${applicant.id}`} className="text-[var(--text-primary)] hover:text-amber-400">
                        {applicant.englishName}
                      </Link>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">{employer ? tb({ en: employer.englishName, ar: employer.arabicName }) : '—'}</td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">{agency ? tb({ en: agency.englishName, ar: agency.arabicName }) : '—'}</td>
                  <td className="px-4 py-3 text-end text-[var(--text-primary)]">{formatMoney(inv.servicePrice)}</td>
                  <td className="px-4 py-3 text-end text-emerald-400">{formatMoney(invoiceTotalPaid(inv))}</td>
                  <td className="px-4 py-3 text-end text-rose-400">{formatMoney(invoiceBalance(inv))}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={inv.status} />
                  </td>
                  <td className="sticky end-0 flex items-center justify-end gap-3 bg-[var(--surface)] px-4 py-3">
                    {inv.status !== 'Completed' && (
                      <button type="button" onClick={() => setPaymentModal(inv.id)} className="text-[10px] font-bold text-amber-400 hover:text-amber-300">
                        {language === 'ar' ? 'تسجيل دفعة' : 'Log Payment'}
                      </button>
                    )}
                    <button type="button" onClick={() => handleDelete(inv.id, inv.invoiceNumber)} className="text-[var(--text-muted)] hover:text-rose-400">
                      <Trash2 className="size-3.5" />
                    </button>
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-xs text-[var(--text-muted)]">
                  {language === 'ar' ? 'لا توجد فواتير' : 'No invoices yet.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {paymentModal && <LogPaymentModal invoiceId={paymentModal} onClose={() => setPaymentModal(null)} />}
    </div>
  )
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-lg border border-[var(--edge)] bg-[var(--surface)] p-4">
      <p className="text-[11px] text-[var(--text-muted)]">{label}</p>
      <p className={`mt-1 text-xl font-bold ${accent ?? 'text-[var(--text-primary)]'}`}>{value}</p>
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

  if (!invoice) return null
  const balance = invoiceBalance(invoice)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!amount || !sourceId) return
    addInvoicePayment(invoiceId, { date, amount: Number(amount), sourceId })
    onClose()
  }

  return (
    <Modal title={language === 'ar' ? 'تسجيل دفعة' : 'Log Payment'} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <p className="mb-3 text-[11px] text-[var(--text-muted)]">
          {language === 'ar' ? 'الرصيد المتبقي' : 'Remaining balance'}: {formatMoney(balance)}
        </p>
        <Field label={`${language === 'ar' ? 'المبلغ' : 'Amount'} (USD)`}>
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
        <div className="mt-4 flex justify-end gap-2">
          <SecondaryButton onClick={onClose}>{t('action_cancel')}</SecondaryButton>
          <PrimaryButton type="submit">{language === 'ar' ? 'تسجيل الدفعة' : 'Log Payment'}</PrimaryButton>
        </div>
      </form>
    </Modal>
  )
}
