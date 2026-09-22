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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label={language === 'ar' ? 'عدد الفواتير' : 'Total Invoices'} value={String(filtered.length)} />
        <StatCard label={language === 'ar' ? 'إجمالي المبلغ' : 'Total Billed'} value={formatMoney(totalBilled)} />
        <StatCard label={language === 'ar' ? 'إجمالي المدفوع' : 'Total Paid'} value={formatMoney(totalPaid)} accent="text-pos" />
      </div>

      <div className="flex flex-wrap items-center gap-1">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatusFilter(s)}
            className={`rounded-control px-2.5 py-1.5 text-[11px] ${
              statusFilter === s ? 'bg-accent-soft text-accent-text' : 'text-ink-2 hover:bg-raised'
            }`}
          >
            {s === 'All' ? t('label_all') : s}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-panel border border-line bg-surface">
        <table className="data-table">
          <thead>
            <tr>
              <th className="px-4 py-3">{language === 'ar' ? 'رقم الفاتورة' : 'Invoice #'}</th>
              <th className="px-4 py-3">{language === 'ar' ? 'المتقدم' : 'Applicant'}</th>
              <th className="px-4 py-3">{language === 'ar' ? 'صاحب العمل' : 'Employer'}</th>
              <th className="px-4 py-3">{language === 'ar' ? 'مكتب الاستقدام' : 'Agency'}</th>
              <th className="px-4 py-3 text-end">{language === 'ar' ? 'السعر' : 'Price'}</th>
              <th className="px-4 py-3 text-end">{language === 'ar' ? 'المدفوع' : 'Paid'}</th>
              <th className="px-4 py-3 text-end">{language === 'ar' ? 'الرصيد' : 'Balance'}</th>
              <th className="px-4 py-3">{t('label_status')}</th>
              <th className="sticky end-0 bg-surface px-4 py-3 text-end">{t('label_action')}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((inv) => {
              const request = requests.find((r) => r.id === inv.recruitmentRequestId)
              const applicant = applicants.find((a) => a.id === request?.applicantId)
              const employer = employers.find((e) => e.id === inv.employerId)
              const agency = agencies.find((a) => a.id === inv.recruitmentAgencyId)
              return (
                <tr key={inv.id} className="text-xs">
                  <td className="px-4 py-3 num text-ink">{inv.invoiceNumber}</td>
                  <td className="px-4 py-3">
                    {applicant ? (
                      <Link to={`/applicants/${applicant.id}`} className="text-ink hover:text-accent-text">
                        {applicant.englishName}
                      </Link>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink-2">{employer ? tb({ en: employer.englishName, ar: employer.arabicName }) : '-'}</td>
                  <td className="px-4 py-3 text-ink-2">{agency ? tb({ en: agency.englishName, ar: agency.arabicName }) : '-'}</td>
                  <td className="px-4 py-3 text-end text-ink">{formatMoney(inv.servicePrice)}</td>
                  <td className="px-4 py-3 text-end text-pos">{formatMoney(invoiceTotalPaid(inv))}</td>
                  <td className="px-4 py-3 text-end text-neg">{formatMoney(invoiceBalance(inv))}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={inv.status} />
                  </td>
                  <td className="sticky end-0 flex items-center justify-end gap-3 bg-surface px-4 py-3">
                    {inv.status !== 'Completed' && (
                      <button type="button" onClick={() => setPaymentModal(inv.id)} className="text-[10px] font-bold text-accent-text hover:text-accent">
                        {language === 'ar' ? 'تسجيل دفعة' : 'Log Payment'}
                      </button>
                    )}
                    <button type="button" onClick={() => handleDelete(inv.id, inv.invoiceNumber)} className="text-ink-3 hover:text-neg">
                      <Trash2 className="size-3.5" />
                    </button>
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-xs text-ink-3">
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
    <div className="rounded-panel border border-line bg-surface p-4">
      <p className="text-[11px] text-ink-3">{label}</p>
      <p className={`mt-1 text-xl font-bold ${accent ?? 'text-ink'}`}>{value}</p>
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
        <p className="mb-3 text-[11px] text-ink-3">
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
