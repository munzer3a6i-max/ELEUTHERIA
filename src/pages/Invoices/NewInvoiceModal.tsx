/*
  Issuing an invoice for a recruitment request.

  The office bills a client for one placement, so the request is the first
  thing chosen and everything else follows from it: the worker, the client and
  the agency she came through are the request's, not somebody's to retype.

  Payment is part of the same breath, because an invoice is usually written up
  after the money has moved. Three shapes cover what the office actually does:
  nothing received yet, paid in one go, or split in two -- half now and half
  when the visa comes through. A payment that has not happened yet is not
  recorded as one; it is simply left unticked, and the invoice sits at Partial
  Payment until somebody logs it.

  The status is worked out from what is recorded rather than chosen, so an
  invoice cannot say Completed with nothing against it.
*/

import { useMemo, useState } from 'react'
import { useAppStore, formatMoney } from '../../store/useAppStore'
import { useTranslation } from '../../i18n/useTranslation'
import Modal from '../../components/Modal'
import StatusBadge from '../../components/StatusBadge'
import AttachmentField from '../../components/AttachmentField'
import { Field, SelectInput, TextInput, PrimaryButton, SecondaryButton } from '../../components/form'
import type { Attachment, InvoiceStatus } from '../../types'

type Shape = 'none' | 'full' | 'split'

interface Instalment {
  amount: string
  date: string
  sourceId: string
  attachment: Attachment | null
  received: boolean
}

const today = () => new Date().toISOString().slice(0, 10)

export default function NewInvoiceModal({
  onClose,
  agencyId = null,
}: {
  onClose: () => void
  /** Opened from an agency's own page, so that agency's requests come first. */
  agencyId?: string | null
}) {
  const requests = useAppStore((s) => s.requests)
  const applicants = useAppStore((s) => s.applicants)
  const employers = useAppStore((s) => s.employers)
  const agencies = useAppStore((s) => s.agencies)
  const invoices = useAppStore((s) => s.invoices)
  const allSources = useAppStore((s) => s.paymentSources)
  const addInvoice = useAppStore((s) => s.addInvoice)
  const addInvoicePayment = useAppStore((s) => s.addInvoicePayment)
  const { t, tb, language } = useTranslation()

  const sources = allSources.filter((p) => p.scopes.includes('Invoices'))
  const ar = language === 'ar'

  const [query, setQuery] = useState('')
  const [requestId, setRequestId] = useState('')
  const [price, setPrice] = useState('')
  const [issuedOn, setIssuedOn] = useState(today())
  const [shape, setShape] = useState<Shape>('none')
  const [first, setFirst] = useState<Instalment>({ amount: '', date: today(), sourceId: sources[0]?.id ?? '', attachment: null, received: true })
  const [second, setSecond] = useState<Instalment>({ amount: '', date: today(), sourceId: sources[0]?.id ?? '', attachment: null, received: false })
  const [error, setError] = useState<string | null>(null)

  /** What each request looks like in the list, and what searching reads. */
  const choices = useMemo(() => {
    const billed = new Set(invoices.map((i) => i.recruitmentRequestId))
    return requests
      .map((request) => {
        const applicant = applicants.find((a) => a.id === request.applicantId)
        const employer = employers.find((e) => e.id === request.employerId)
        const agency = agencies.find((a) => a.id === request.recruitmentAgencyId)
        return {
          id: request.id,
          agencyId: request.recruitmentAgencyId,
          billed: billed.has(request.id),
          label: [
            request.mosanedNumber || request.id.slice(0, 8),
            applicant ? (ar ? applicant.arabicName || applicant.englishName : applicant.englishName) : '-',
            employer ? tb({ en: employer.englishName, ar: employer.arabicName }) : '-',
            agency ? tb({ en: agency.englishName, ar: agency.arabicName }) : '',
          ]
            .filter(Boolean)
            .join(' · '),
        }
      })
      .filter((choice) => !choice.billed)
      .filter((choice) => choice.label.toLowerCase().includes(query.trim().toLowerCase()))
      .sort((a, b) => (agencyId ? Number(b.agencyId === agencyId) - Number(a.agencyId === agencyId) : 0))
  }, [requests, applicants, employers, agencies, invoices, query, agencyId, ar, tb])

  const request = requests.find((r) => r.id === requestId) ?? null
  const employer = employers.find((e) => e.id === request?.employerId) ?? null
  const agency = agencies.find((a) => a.id === request?.recruitmentAgencyId) ?? null

  const amount = Number(price) || 0
  const firstAmount = Number(first.amount) || 0
  // The second half is whatever the first one left, so the two always add up.
  const secondAmount = shape === 'split' ? Math.max(0, amount - firstAmount) : 0

  const received =
    shape === 'none'
      ? 0
      : shape === 'full'
        ? amount
        : (first.received ? firstAmount : 0) + (second.received ? secondAmount : 0)
  const status: InvoiceStatus = received >= amount && amount > 0 ? 'Completed' : received > 0 ? 'Partial Payment' : 'Issued'

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)

    if (!request) return setError(ar ? 'اختر طلب استقدام.' : 'Choose a recruitment request.')
    if (!(amount > 0)) return setError(ar ? 'أدخل سعر الخدمة.' : 'Enter the service price.')
    if (shape !== 'none' && sources.length === 0) {
      return setError(ar ? 'لا توجد مصادر دفع. أضف واحدًا من الإضافات.' : 'There are no payment sources. Add one under Addons.')
    }
    if (shape === 'split' && !(firstAmount > 0 && firstAmount < amount)) {
      return setError(ar ? 'يجب أن تكون الدفعة الأولى أقل من إجمالي السعر.' : 'The first instalment has to be less than the total.')
    }

    const id = addInvoice({
      recruitmentRequestId: request.id,
      employerId: request.employerId,
      recruitmentAgencyId: request.recruitmentAgencyId,
      servicePrice: amount,
      issuedOn,
    })

    if (shape === 'full') {
      addInvoicePayment(id, { date: first.date, amount, sourceId: first.sourceId, attachment: first.attachment })
    }
    if (shape === 'split') {
      if (first.received) {
        addInvoicePayment(id, { date: first.date, amount: firstAmount, sourceId: first.sourceId, attachment: first.attachment })
      }
      if (second.received) {
        addInvoicePayment(id, { date: second.date, amount: secondAmount, sourceId: second.sourceId, attachment: second.attachment })
      }
    }

    onClose()
  }

  return (
    <Modal title={ar ? 'فاتورة جديدة' : 'New Invoice'} onClose={onClose} width="max-w-2xl">
      <form onSubmit={handleSubmit}>
        <Field label={ar ? 'طلب الاستقدام' : 'Recruitment request'} hint={ar ? 'ابحث برقم الطلب أو اسم العاملة أو العميل' : 'Search by request number, worker or client'}>
          <TextInput value={query} onChange={(e) => setQuery(e.target.value)} placeholder={ar ? 'بحث…' : 'Search…'} />
          <SelectInput value={requestId} onChange={(e) => setRequestId(e.target.value)} className="mt-2" required>
            <option value="">{ar ? 'اختر طلبًا' : 'Choose a request'}</option>
            {choices.map((choice) => (
              <option key={choice.id} value={choice.id}>
                {choice.label}
              </option>
            ))}
          </SelectInput>
          {choices.length === 0 && (
            <p className="mt-1 text-[10.5px] text-ink-3">
              {ar ? 'كل الطلبات المطابقة لها فواتير بالفعل.' : 'Every matching request already has an invoice.'}
            </p>
          )}
        </Field>

        {request && (
          <div className="mb-3 grid grid-cols-1 gap-2 rounded-control border border-line bg-sunken px-3 py-2 text-[11px] sm:grid-cols-2">
            <p className="text-ink-3">
              {ar ? 'صاحب العمل' : 'Client'}:{' '}
              <span className="text-ink">{employer ? tb({ en: employer.englishName, ar: employer.arabicName }) : '-'}</span>
            </p>
            <p className="text-ink-3">
              {ar ? 'مكتب الاستقدام' : 'Agency'}:{' '}
              <span className="text-ink">{agency ? tb({ en: agency.englishName, ar: agency.arabicName }) : '-'}</span>
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label={`${ar ? 'سعر الخدمة' : 'Service price'} (USD)`}>
            <TextInput type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required />
          </Field>
          <Field label={ar ? 'تاريخ الإصدار' : 'Issued on'}>
            <TextInput type="date" value={issuedOn} onChange={(e) => setIssuedOn(e.target.value)} required />
          </Field>
        </div>

        <Field label={ar ? 'الدفع' : 'Payment'}>
          <div className="flex flex-wrap gap-1.5">
            {(['none', 'full', 'split'] as Shape[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setShape(option)}
                className={`rounded-control px-3 py-1.5 text-[11px] ${
                  shape === option ? 'bg-accent-soft text-accent-text' : 'border border-line text-ink-2 hover:bg-raised'
                }`}
              >
                {option === 'none'
                  ? ar ? 'لم يُدفع بعد' : 'Nothing received yet'
                  : option === 'full'
                    ? ar ? 'مدفوعة بالكامل' : 'Paid in full'
                    : ar ? 'مقسّمة على دفعتين' : 'Split into two'}
              </button>
            ))}
          </div>
        </Field>

        {shape === 'full' && (
          <InstalmentFields
            title={ar ? 'الدفعة' : 'The payment'}
            amountLabel={formatMoney(amount)}
            value={first}
            onChange={setFirst}
            sources={sources}
            lockReceived
          />
        )}

        {shape === 'split' && (
          <>
            <InstalmentFields
              title={ar ? 'الدفعة الأولى' : 'First instalment'}
              value={first}
              onChange={setFirst}
              sources={sources}
              editableAmount
              total={amount}
            />
            <InstalmentFields
              title={ar ? 'الدفعة الثانية' : 'Second instalment'}
              amountLabel={formatMoney(secondAmount)}
              value={second}
              onChange={setSecond}
              sources={sources}
            />
          </>
        )}

        <div className="mt-3 flex items-center justify-between rounded-control border border-line bg-sunken px-3 py-2 text-[11px]">
          <span className="text-ink-3">{t('label_status')}</span>
          <span className="flex items-center gap-2">
            <span className="num text-ink">
              {formatMoney(received)} / {formatMoney(amount)}
            </span>
            <StatusBadge status={status} />
          </span>
        </div>

        {error && <p className="mt-2 text-[11.5px] font-medium text-neg">{error}</p>}

        <div className="mt-4 flex justify-end gap-2">
          <SecondaryButton onClick={onClose}>{t('action_cancel')}</SecondaryButton>
          <PrimaryButton type="submit">{ar ? 'إنشاء الفاتورة' : 'Create invoice'}</PrimaryButton>
        </div>
      </form>
    </Modal>
  )
}

function InstalmentFields({
  title,
  value,
  onChange,
  sources,
  amountLabel,
  editableAmount = false,
  lockReceived = false,
  total,
}: {
  title: string
  value: Instalment
  onChange: (next: Instalment) => void
  sources: { id: string; name: string }[]
  amountLabel?: string
  editableAmount?: boolean
  lockReceived?: boolean
  total?: number
}) {
  const { t, language } = useTranslation()
  const ar = language === 'ar'
  const set = (patch: Partial<Instalment>) => onChange({ ...value, ...patch })
  const on = lockReceived || value.received

  return (
    <div className="mb-3 rounded-control border border-line p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[11.5px] font-semibold text-ink">{title}</p>
        {!lockReceived && (
          <label className="flex items-center gap-1.5 text-[11px] text-ink-2">
            <input type="checkbox" checked={value.received} onChange={(e) => set({ received: e.target.checked })} />
            {ar ? 'وصلت' : 'Received'}
          </label>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label={`${ar ? 'المبلغ' : 'Amount'} (USD)`}>
          {editableAmount ? (
            <TextInput
              type="number"
              min="0"
              max={total}
              step="0.01"
              value={value.amount}
              onChange={(e) => set({ amount: e.target.value })}
            />
          ) : (
            <TextInput value={amountLabel ?? ''} disabled className="opacity-70" />
          )}
        </Field>
        <Field label={t('label_date')}>
          <TextInput type="date" value={value.date} onChange={(e) => set({ date: e.target.value })} disabled={!on} />
        </Field>
      </div>

      <Field label={ar ? 'مصدر الدفع' : 'Payment source'}>
        <SelectInput value={value.sourceId} onChange={(e) => set({ sourceId: e.target.value })} disabled={!on}>
          {sources.map((source) => (
            <option key={source.id} value={source.id}>
              {source.name}
            </option>
          ))}
        </SelectInput>
      </Field>

      {on && <AttachmentField value={value.attachment} onChange={(attachment) => set({ attachment })} label={t('attach_invoice')} />}
    </div>
  )
}
