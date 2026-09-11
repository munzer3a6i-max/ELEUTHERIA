import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Plus, Pencil, Trash2, Paperclip, Receipt } from 'lucide-react'
import { useAppStore, currentStatus, requestCost, formatMoney } from '../../store/useAppStore'
import { useTranslation } from '../../i18n/useTranslation'
import StatusUpdateModal from '../../components/StatusUpdateModal'
import { TextArea, SecondaryButton } from '../../components/form'
import type { StatusHistoryEntry } from '../../types'

export default function RequestDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const request = useAppStore((s) => s.requests.find((r) => r.id === id))
  const { language } = useTranslation()

  if (!request) {
    return (
      <div className="flex flex-col items-center gap-3 p-10 text-center">
        <p className="text-sm text-[var(--text-primary)]">{language === 'ar' ? 'الطلب غير موجود.' : 'Request not found.'}</p>
        <Link to="/recruitments" className="text-xs text-amber-400 hover:text-amber-300">
          {language === 'ar' ? 'العودة إلى الطلبات' : 'Back to Recruitments'}
        </Link>
      </div>
    )
  }

  return <RequestDetailContent key={request.id} requestId={request.id} onDeleted={() => navigate('/recruitments')} />
}

function RequestDetailContent({ requestId, onDeleted }: { requestId: string; onDeleted: () => void }) {
  const request = useAppStore((s) => s.requests.find((r) => r.id === requestId))
  const applicants = useAppStore((s) => s.applicants)
  const employers = useAppStore((s) => s.employers)
  const agencies = useAppStore((s) => s.agencies)
  const staff = useAppStore((s) => s.staff)
  const paymentSources = useAppStore((s) => s.paymentSources)
  const invoices = useAppStore((s) => s.invoices)
  const addInvoice = useAppStore((s) => s.addInvoice)
  const deleteRequest = useAppStore((s) => s.deleteRequest)
  const updateRequest = useAppStore((s) => s.updateRequest)
  const addStatusUpdate = useAppStore((s) => s.addStatusUpdate)
  const updateStatusUpdate = useAppStore((s) => s.updateStatusUpdate)
  const deleteStatusUpdate = useAppStore((s) => s.deleteStatusUpdate)
  const { t, tb, language } = useTranslation()
  const [statusModal, setStatusModal] = useState<'add' | StatusHistoryEntry | null>(null)

  if (!request) {
    onDeleted()
    return null
  }

  const applicant = applicants.find((a) => a.id === request.applicantId)
  const employer = employers.find((e) => e.id === request.employerId)
  const agency = agencies.find((a) => a.id === request.recruitmentAgencyId)
  const officer = staff.find((s) => s.id === request.responsibleEmployeeId)
  const invoice = invoices.find((i) => i.recruitmentRequestId === requestId)
  const status = currentStatus(request)
  const totalCost = requestCost(request)

  function handleDelete() {
    if (window.confirm(t('action_delete') + '?')) deleteRequest(requestId)
  }

  function handleDeleteEntry(entryId: string) {
    if (window.confirm(t('action_delete') + '?')) deleteStatusUpdate(requestId, entryId)
  }

  const recruitmentAgencyId = request.recruitmentAgencyId

  function handleCreateInvoice() {
    if (!employer) return
    addInvoice({
      recruitmentRequestId: requestId,
      employerId: employer.id,
      recruitmentAgencyId,
      servicePrice: totalCost || 500,
    })
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <nav className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
          <Link to="/recruitments" className="hover:text-[var(--text-primary)]">
            {t('nav_recruitments')}
          </Link>
          <span>/</span>
          <span className="text-[var(--text-primary)]">{applicant?.englishName ?? request.id}</span>
        </nav>
        <button type="button" onClick={handleDelete} className="rounded border border-rose-900 bg-rose-950/60 px-3 py-1.5 text-[11px] text-rose-400 hover:border-rose-700">
          {t('action_delete')}
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <SummaryCard label={language === 'ar' ? 'المتقدم' : 'Applicant'} value={applicant ? (language === 'ar' ? applicant.arabicName || applicant.englishName : applicant.englishName) : '—'} to={applicant ? `/applicants/${applicant.id}` : undefined} />
        <SummaryCard label={language === 'ar' ? 'صاحب العمل' : 'Employer'} value={employer ? tb({ en: employer.englishName, ar: employer.arabicName }) : '—'} />
        <SummaryCard label={language === 'ar' ? 'مكتب الاستقدام' : 'Agency'} value={agency ? tb({ en: agency.englishName, ar: agency.arabicName }) : '—'} />
        <SummaryCard label={language === 'ar' ? 'الموظف المسؤول' : 'Officer'} value={officer ? tb(officer.name) : '—'} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 flex flex-col gap-4">
          <div className="rounded-lg border border-[var(--edge)] bg-[var(--surface)] p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-[0.3px] text-[var(--text-primary)]">
                  {language === 'ar' ? 'سجل الحالة' : 'Status History'}
                </h2>
                <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
                  {request.type === 'Domestic' ? t('type_domestic') : t('type_profession')} · {status ?? (language === 'ar' ? 'لم يبدأ' : 'Not started')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStatusModal('add')}
                className="flex items-center gap-1.5 rounded bg-amber-600 px-3 py-1.5 text-[11px] font-bold text-slate-950 hover:bg-amber-500"
              >
                <Plus className="size-3.5" /> {language === 'ar' ? 'إضافة تحديث حالة' : 'Add New Status Update'}
              </button>
            </div>

            <div className="flex flex-col divide-y divide-[var(--edge-soft2)]">
              {request.statusHistory.map((h) => {
                const source = paymentSources.find((p) => p.id === h.paymentSourceId)
                const resp = staff.find((s) => s.id === h.responsibleEmployeeId)
                return (
                  <div key={h.id} className="flex items-start justify-between gap-3 py-3 text-xs">
                    <div>
                      <p className="font-medium text-[var(--text-primary)]">{h.status}</p>
                      <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">
                        {h.date} · {resp ? tb(resp.name) : '—'} · {source?.name ?? '—'}
                      </p>
                      {h.notes && <p className="mt-1 text-[var(--text-secondary)]">{h.notes}</p>}
                      {h.attachmentName && (
                        <span className="mt-1 flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
                          <Paperclip className="size-3" /> {h.attachmentName}
                        </span>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="font-bold text-amber-400">{formatMoney(h.cost)}</span>
                      <button type="button" onClick={() => setStatusModal(h)} className="text-[var(--text-muted)] hover:text-amber-400">
                        <Pencil className="size-3.5" />
                      </button>
                      <button type="button" onClick={() => handleDeleteEntry(h.id)} className="text-[var(--text-muted)] hover:text-rose-400">
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })}
              {request.statusHistory.length === 0 && (
                <p className="py-6 text-center text-[11px] text-[var(--text-muted)]">
                  {language === 'ar' ? 'لم يتم تسجيل أي تحديثات بعد.' : 'No status updates logged yet.'}
                </p>
              )}
            </div>

            <div className="mt-2 flex items-center justify-between border-t border-[var(--edge-soft)] pt-2.5">
              <span className="text-xs font-bold uppercase text-[var(--text-secondary)]">
                {language === 'ar' ? 'إجمالي التكلفة' : 'Total Cost'}
              </span>
              <span className="text-sm font-bold text-amber-400">{formatMoney(totalCost)}</span>
            </div>
          </div>

          <div className="rounded-lg border border-[var(--edge)] bg-[var(--surface)] p-4">
            <h2 className="mb-2 text-xs font-bold uppercase tracking-[0.3px] text-[var(--text-primary)]">
              {language === 'ar' ? 'ملاحظات' : 'Notes'}
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <TextArea
                value={request.notes.en}
                onChange={(e) => updateRequest(requestId, { notes: { ...request.notes, en: e.target.value } })}
                rows={3}
                placeholder="Notes (English)"
              />
              <TextArea
                dir="rtl"
                value={request.notes.ar}
                onChange={(e) => updateRequest(requestId, { notes: { ...request.notes, ar: e.target.value } })}
                rows={3}
                placeholder="ملاحظات (عربي)"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-lg border border-[var(--edge)] bg-[var(--surface)] p-4">
            <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.3px] text-[var(--text-primary)]">
              {language === 'ar' ? 'تفاصيل الطلب' : 'Request Details'}
            </h2>
            <div className="flex flex-col gap-2 text-[11px]">
              <DetailRow label={language === 'ar' ? 'مدة العقد' : 'Contract Duration'} value={`${request.contractDurationMonths} ${language === 'ar' ? 'شهر' : 'months'}`} />
              <DetailRow label="Mosaned #" value={request.mosanedNumber || '—'} />
              <DetailRow label={language === 'ar' ? 'تاريخ الإنشاء' : 'Created'} value={request.createdOn} />
              <DetailRow label={language === 'ar' ? 'آخر تحديث' : 'Last Updated'} value={request.updatedOn} />
            </div>
          </div>

          <div className="rounded-lg border border-[var(--edge)] bg-[var(--surface)] p-4">
            <h2 className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.3px] text-[var(--text-primary)]">
              <Receipt className="size-3.5" /> {t('nav_invoices')}
            </h2>
            {invoice ? (
              <Link to="/invoices" className="block text-xs text-amber-400 hover:text-amber-300">
                {invoice.invoiceNumber} — {formatMoney(invoice.servicePrice)} ({invoice.status})
              </Link>
            ) : (
              <div>
                <p className="mb-2 text-[11px] text-[var(--text-muted)]">
                  {language === 'ar' ? 'لا توجد فاتورة لهذا الطلب بعد.' : 'No invoice for this request yet.'}
                </p>
                <SecondaryButton onClick={handleCreateInvoice} className="w-full">
                  {language === 'ar' ? 'إنشاء فاتورة' : 'Create Invoice'}
                </SecondaryButton>
              </div>
            )}
          </div>
        </div>
      </div>

      {statusModal && (
        <StatusUpdateModal
          requestType={request.type}
          currentStatusLabel={status}
          initial={statusModal === 'add' ? undefined : statusModal}
          onClose={() => setStatusModal(null)}
          onSubmit={(entry) => {
            if (statusModal === 'add') {
              addStatusUpdate(requestId, entry)
            } else {
              updateStatusUpdate(requestId, statusModal.id, entry)
            }
            setStatusModal(null)
          }}
        />
      )}
    </div>
  )
}

function SummaryCard({ label, value, to }: { label: string; value: string; to?: string }) {
  const content = (
    <div className="rounded-lg border border-[var(--edge)] bg-[var(--surface)] p-3.5">
      <p className="text-[10px] uppercase text-[var(--text-muted)]">{label}</p>
      <p className="mt-1 truncate text-sm font-bold text-[var(--text-primary)]">{value}</p>
    </div>
  )
  return to ? <Link to={to}>{content}</Link> : content
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[var(--text-muted)]">{label}</span>
      <span className="text-[var(--text-primary)]">{value}</span>
    </div>
  )
}
