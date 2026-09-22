import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Check, PlaneLanding, Plus, Trash2, TriangleAlert, Undo2, Wallet } from 'lucide-react'
import { useAppStore, formatMoney } from '../../store/useAppStore'
import { useTranslation } from '../../i18n/useTranslation'
import { GUARANTEE_MONTHS, monthsBetween } from '../../data/businessRules'
import { backoutTotal } from '../../lib/derivedBilling'
import PageHeader from '../../components/PageHeader'
import StatStrip from '../../components/StatStrip'
import StatusBadge from '../../components/StatusBadge'
import Card from '../../components/Card'
import Modal from '../../components/Modal'
import AttachmentField, { AttachmentChip } from '../../components/AttachmentField'
import {
  BilingualField,
  Field,
  TextInput,
  TextArea,
  SelectInput,
  PrimaryButton,
  SecondaryButton,
} from '../../components/form'
import type { Attachment, Backout, BackoutLiability } from '../../types'

const CATEGORIES = ['Travel', 'Accommodation', 'Government', 'Medical', 'Other']

export default function BackoutsPage() {
  const backouts = useAppStore((s) => s.backouts)
  const applicants = useAppStore((s) => s.applicants)
  const requests = useAppStore((s) => s.requests)
  const currency = useAppStore((s) => s.settings.currency)
  const updateBackout = useAppStore((s) => s.updateBackout)
  const deleteBackoutCost = useAppStore((s) => s.deleteBackoutCost)
  const setBackoutCostStatus = useAppStore((s) => s.setBackoutCostStatus)
  const { t, tb, language } = useTranslation()

  const [searchParams, setSearchParams] = useSearchParams()
  const [billFor, setBillFor] = useState<Backout | null>(null)
  const workerParam = searchParams.get('worker')

  const rows = useMemo(
    () =>
      backouts.map((backout) => ({
        backout,
        applicant: applicants.find((a) => a.id === backout.applicantId) ?? null,
        months: backout.deployedOn ? monthsBetween(backout.deployedOn, backout.returnedOn) : null,
        total: backoutTotal(backout),
        unpaid: backoutTotal(backout, 'Pending'),
      })),
    [backouts, applicants],
  )

  const selected =
    rows.find((r) => r.backout.id === workerParam || r.applicant?.id === workerParam) ?? rows[0] ?? null

  function select(backoutId: string) {
    setSearchParams(backoutId ? { worker: backoutId } : {}, { replace: true })
  }
  const ourCost = rows
    .filter((r) => r.backout.liability === 'Company')
    .reduce((sum, r) => sum + r.total, 0)
  const unpaid = rows.reduce((sum, r) => sum + r.unpaid, 0)

  /** "1 month", "6 months", or nothing at all when she never travelled. */
  function served(months: number | null): string {
    if (months === null) return t('backout_never_deployed')
    return `${months} ${months === 1 ? t('backout_month') : t('backout_months')}`
  }

  function liabilityLabel(liability: BackoutLiability): string {
    if (liability === 'Company') return t('backout_liability_company')
    if (liability === 'Employer') return t('backout_liability_employer')
    return t('backout_liability_agency')
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <PageHeader title={t('backout_title')} subtitle={t('backout_subtitle')} />

      <StatStrip
        stats={[
          {
            label: t('backout_title'),
            value: String(backouts.length),
            note: t('backout_opened_from_log'),
            icon: <PlaneLanding className="size-4" />,
          },
          {
            label: t('backout_liability_company'),
            value: String(rows.filter((r) => r.backout.liability === 'Company').length),
            note: `${language === 'ar' ? 'خلال' : 'within'} ${served(GUARANTEE_MONTHS)}`,
            tone: 'warn',
            icon: <TriangleAlert className="size-4" />,
          },
          {
            label: t('backout_costs'),
            value: formatMoney(ourCost, currency, 0),
            tone: 'neg',
            icon: <Wallet className="size-4" />,
          },
          {
            label: t('acc_pending'),
            value: formatMoney(unpaid, currency, 0),
            tone: unpaid > 0 ? 'warn' : undefined,
            icon: <Wallet className="size-4" />,
          },
        ]}
      />

      <Card title={t('backout_title')} subtitle={t('backout_subtitle')} bodyClassName="overflow-x-auto p-0">
        <table className="data-table">
          <thead>
            <tr>
              <th>{t('backout_worker')}</th>
              <th>{t('backout_deployed_on')}</th>
              <th>{t('backout_returned_on')}</th>
              <th className="text-end">{t('backout_served')}</th>
              <th>{t('backout_liability')}</th>
              <th className="text-end">{t('backout_costs')}</th>
              <th className="text-end">{t('acc_pending')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.backout.id}
                onClick={() => select(row.backout.id)}
                className={`cursor-pointer ${row.backout.id === selected?.backout.id ? 'bg-accent-soft/40' : ''}`}
              >
                <td>
                  {row.applicant ? (
                    <Link
                      to={`/applicants/${row.applicant.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="font-medium text-ink hover:text-accent-text"
                    >
                      {language === 'ar' ? row.applicant.arabicName || row.applicant.englishName : row.applicant.englishName}
                    </Link>
                  ) : (
                    '-'
                  )}
                  <span className="block text-[10.5px] text-ink-3">{row.applicant?.profession}</span>
                </td>
                <td className="num whitespace-nowrap">{row.backout.deployedOn ?? '-'}</td>
                <td className="num whitespace-nowrap">{row.backout.returnedOn}</td>
                <td className="num whitespace-nowrap text-end text-ink">{served(row.months)}</td>
                <td>
                  <StatusBadge
                    status={liabilityLabel(row.backout.liability)}
                    tone={row.backout.liability === 'Company' ? 'neg' : 'neutral'}
                  />
                </td>
                <td dir="ltr" className="num whitespace-nowrap text-end text-ink">
                  {formatMoney(row.total, currency, 0)}
                </td>
                <td dir="ltr" className={`num whitespace-nowrap text-end ${row.unpaid > 0 ? 'text-warn' : 'text-ink-3'}`}>
                  {formatMoney(row.unpaid, currency, 0)}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-ink-3">
                  {t('backout_auto_note')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      {selected && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <Card
              title={t('backout_bills')}
              subtitle={`${formatMoney(selected.total, currency)} · ${formatMoney(selected.unpaid, currency)} ${t('acc_pending').toLowerCase()}`}
              action={
                <button type="button" onClick={() => setBillFor(selected.backout)} className="btn btn-secondary h-7">
                  <Plus className="size-3.5" /> {t('backout_add_bill')}
                </button>
              }
              bodyClassName="overflow-x-auto p-0"
            >
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t('fin_item')}</th>
                    <th>{t('fin_category')}</th>
                    <th>{t('label_date')}</th>
                    <th className="text-end">{t('label_amount')}</th>
                    <th>{t('label_status')}</th>
                    <th>{t('attach_column')}</th>
                    <th className="text-end">{t('label_action')}</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.backout.costs.map((cost) => (
                    <tr key={cost.id}>
                      <td className="text-ink">{tb(cost.label)}</td>
                      <td>{cost.category}</td>
                      <td className="num whitespace-nowrap">{cost.date}</td>
                      <td dir="ltr" className="num whitespace-nowrap text-end text-ink">
                        {formatMoney(cost.amount, currency)}
                      </td>
                      <td>
                        <StatusBadge status={cost.status} />
                      </td>
                      <td>
                        {cost.attachment ? (
                          <AttachmentChip attachment={cost.attachment} />
                        ) : (
                          <span className="chip chip-warn">{t('attach_missing')}</span>
                        )}
                      </td>
                      <td className="text-end">
                        <span className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setBackoutCostStatus(
                                selected.backout.id,
                                cost.id,
                                cost.status === 'Paid' ? 'Pending' : 'Paid',
                              )
                            }
                            className="btn btn-ghost h-7"
                          >
                            {cost.status === 'Paid' ? <Undo2 className="size-3.5" /> : <Check className="size-3.5" />}
                            {cost.status === 'Paid' ? t('agent_mark_pending') : t('agent_mark_paid')}
                          </button>
                          <button
                            type="button"
                            aria-label={t('action_delete')}
                            onClick={() => deleteBackoutCost(selected.backout.id, cost.id)}
                            className="text-ink-3 hover:text-neg"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </span>
                      </td>
                    </tr>
                  ))}
                  {selected.backout.costs.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-ink-3">
                        {t('acc_no_rows')}
                      </td>
                    </tr>
                  )}
                </tbody>
                {selected.backout.costs.length > 0 && (
                  <tfoot>
                    <tr>
                      <td colSpan={3}>{t('fin_total_expenses')}</td>
                      <td dir="ltr" className="num text-end">
                        {formatMoney(selected.total, currency)}
                      </td>
                      <td colSpan={3} />
                    </tr>
                  </tfoot>
                )}
              </table>
            </Card>
          </div>

          <div className="grid content-start gap-4 lg:col-span-5">
            <Card
              title={
                selected.applicant
                  ? language === 'ar'
                    ? selected.applicant.arabicName || selected.applicant.englishName
                    : selected.applicant.englishName
                  : t('backout_worker')
              }
              subtitle={`${served(selected.months)} · ${liabilityLabel(selected.backout.liability)}`}
              action={
                <Link
                  to={`/recruitments/${selected.backout.requestId}`}
                  className="text-[11px] text-accent-text hover:text-accent"
                >
                  {t('fin_view_details')}
                </Link>
              }
            >
              <p
                className={`rounded-control border p-2.5 text-[11.5px] leading-relaxed ${
                  selected.backout.liability === 'Company'
                    ? 'border-neg/35 bg-neg-soft text-neg'
                    : 'border-line bg-sunken text-ink-3'
                }`}
              >
                {selected.months === null
                  ? t('backout_before_deployment')
                  : selected.months < GUARANTEE_MONTHS
                    ? t('backout_within_guarantee')
                    : t('backout_outside_guarantee')}
              </p>

              <Field label={t('backout_liability')}>
                <SelectInput
                  value={selected.backout.liability}
                  onChange={(e) =>
                    updateBackout(selected.backout.id, { liability: e.target.value as BackoutLiability })
                  }
                >
                  <option value="Company">{t('backout_liability_company')}</option>
                  <option value="Employer">{t('backout_liability_employer')}</option>
                  <option value="Agency">{t('backout_liability_agency')}</option>
                </SelectInput>
              </Field>
              <Field label={t('backout_reason')}>
                <TextArea
                  rows={3}
                  value={selected.backout.reason}
                  onChange={(e) => updateBackout(selected.backout.id, { reason: e.target.value })}
                  placeholder={language === 'ar' ? 'سبب التراجع' : 'Why she asked to return'}
                />
              </Field>
              <Field label={language === 'ar' ? 'ملاحظات' : 'Notes'}>
                <TextArea
                  rows={2}
                  value={selected.backout.notes}
                  onChange={(e) => updateBackout(selected.backout.id, { notes: e.target.value })}
                />
              </Field>
              <p className="text-[10.5px] leading-relaxed text-ink-3">
                {requests.find((r) => r.id === selected.backout.requestId)?.mosanedNumber}
              </p>
            </Card>
          </div>
        </div>
      )}

      {billFor && <BillModal backout={billFor} onClose={() => setBillFor(null)} />}
    </div>
  )
}

function BillModal({ backout, onClose }: { backout: Backout; onClose: () => void }) {
  const addBackoutCost = useAppStore((s) => s.addBackoutCost)
  const paymentSources = useAppStore((s) => s.paymentSources)
  const { t, language } = useTranslation()

  const [labelEn, setLabelEn] = useState('')
  const [labelAr, setLabelAr] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0])
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [status, setStatus] = useState<'Pending' | 'Paid'>('Pending')
  const [sourceId, setSourceId] = useState('')
  const [attachment, setAttachment] = useState<Attachment | null>(null)

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!labelEn.trim() || !Number(amount)) return
    addBackoutCost(backout.id, {
      label: { en: labelEn.trim(), ar: labelAr.trim() },
      category,
      amount: Number(amount),
      date,
      status,
      paymentSourceId: status === 'Paid' ? sourceId || null : null,
      attachment,
    })
    onClose()
  }

  return (
    <Modal title={t('backout_add_bill')} onClose={onClose} width="max-w-lg">
      <form onSubmit={handleSubmit}>
        <BilingualField
          labelEn={`${t('fin_item')} (EN)`}
          labelAr={`${t('fin_item')} (AR)`}
          valueEn={labelEn}
          valueAr={labelAr}
          onChangeEn={setLabelEn}
          onChangeAr={setLabelAr}
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label={t('fin_category')}>
            <SelectInput value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </SelectInput>
          </Field>
          <Field label={t('label_amount')}>
            <TextInput
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </Field>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label={t('label_date')}>
            <TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label={t('label_status')}>
            <SelectInput value={status} onChange={(e) => setStatus(e.target.value as 'Pending' | 'Paid')}>
              <option value="Pending">{t('acc_pending')}</option>
              <option value="Paid">{t('acc_paid')}</option>
            </SelectInput>
          </Field>
        </div>
        {status === 'Paid' && (
          <Field label={language === 'ar' ? 'مصدر الدفع' : 'Paid from'}>
            <SelectInput value={sourceId} onChange={(e) => setSourceId(e.target.value)}>
              <option value="">-</option>
              {paymentSources.map((source) => (
                <option key={source.id} value={source.id}>
                  {source.name}
                </option>
              ))}
            </SelectInput>
          </Field>
        )}
        <AttachmentField value={attachment} onChange={setAttachment} />
        <div className="mt-4 flex justify-end gap-2">
          <SecondaryButton onClick={onClose}>{t('action_cancel')}</SecondaryButton>
          <PrimaryButton type="submit">{t('backout_add_bill')}</PrimaryButton>
        </div>
      </form>
    </Modal>
  )
}
