import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Plus, Pencil, Trash2, Receipt } from 'lucide-react'
import { useAppStore, currentStatus, requestCost, formatMoney } from '../../store/useAppStore'
import { useTranslation } from '../../i18n/useTranslation'
import { useCurrentUser } from '../../lib/useCurrentUser'
import StatusUpdateModal from '../../components/StatusUpdateModal'
import { AttachmentChip } from '../../components/AttachmentField'
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
        <p className="text-sm text-ink">{language === 'ar' ? 'الطلب غير موجود.' : 'Request not found.'}</p>
        <Link to="/recruitments" className="text-xs text-accent-text hover:text-accent">
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
  const { canEdit } = useCurrentUser()
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
        <nav className="flex items-center gap-1.5 text-xs text-ink-2">
          <Link to="/recruitments" className="hover:text-ink">
            {t('nav_recruitments')}
          </Link>
          <span>/</span>
          <span className="text-ink">{applicant?.englishName ?? request.id}</span>
        </nav>
        <button type="button" onClick={handleDelete} className="rounded-control border border-neg/40 bg-neg-soft px-3 py-1.5 text-[11px] text-neg hover:border-neg">
          {t('action_delete')}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <SummaryCard label={language === 'ar' ? 'المتقدم' : 'Applicant'} value={applicant ? (language === 'ar' ? applicant.arabicName || applicant.englishName : applicant.englishName) : '-'} to={applicant ? `/applicants/${applicant.id}` : undefined} />
        <SummaryCard label={language === 'ar' ? 'صاحب العمل' : 'Employer'} value={employer ? tb({ en: employer.englishName, ar: employer.arabicName }) : '-'} />
        <SummaryCard label={language === 'ar' ? 'مكتب الاستقدام' : 'Agency'} value={agency ? tb({ en: agency.englishName, ar: agency.arabicName }) : '-'} />
        <SummaryCard label={language === 'ar' ? 'الموظف المسؤول' : 'Officer'} value={officer ? tb(officer.name) : '-'} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="rounded-panel border border-line bg-surface p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="panel-title">
                  {language === 'ar' ? 'سجل الحالة' : 'Status History'}
                </h2>
                <p className="mt-0.5 text-[11px] text-ink-3">
                  {request.type === 'Domestic' ? t('type_domestic') : t('type_profession')} · {status ?? (language === 'ar' ? 'لم يبدأ' : 'Not started')}
                </p>
              </div>
              <button
                type="button"
                hidden={!canEdit('operations')}
                onClick={() => setStatusModal('add')}
                className="flex items-center gap-1.5 rounded-control bg-accent px-3 py-1.5 text-[11px] font-bold text-accent-ink hover:bg-accent"
              >
                <Plus className="size-3.5" /> {language === 'ar' ? 'إضافة تحديث حالة' : 'Add New Status Update'}
              </button>
            </div>

            <div className="flex flex-col divide-y divide-line">
              {request.statusHistory.map((h) => {
                const source = paymentSources.find((p) => p.id === h.paymentSourceId)
                const resp = staff.find((s) => s.id === h.responsibleEmployeeId)
                return (
                  <div key={h.id} className="flex items-start justify-between gap-3 py-3 text-xs">
                    <div>
                      <p className="font-medium text-ink">{h.status}</p>
                      <p className="mt-0.5 text-[10px] text-ink-3">
                        {h.date} · {resp ? tb(resp.name) : '-'} · {source?.name ?? '-'}
                      </p>
                      {h.notes && <p className="mt-1 text-ink-2">{h.notes}</p>}
                      {h.attachment && (
                        <span className="mt-1 flex items-center gap-1 text-[10px] text-ink-3">
                          <AttachmentChip attachment={h.attachment} /> {h.attachment.name}
                        </span>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="font-bold text-accent-text">{formatMoney(h.cost)}</span>
                      {canEdit('operations') && (
                        <>
                          <button type="button" onClick={() => setStatusModal(h)} className="text-ink-3 hover:text-accent-text">
                            <Pencil className="size-3.5" />
                          </button>
                          <button type="button" onClick={() => handleDeleteEntry(h.id)} className="text-ink-3 hover:text-neg">
                            <Trash2 className="size-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
              {request.statusHistory.length === 0 && (
                <p className="py-6 text-center text-[11px] text-ink-3">
                  {language === 'ar' ? 'لم يتم تسجيل أي تحديثات بعد.' : 'No status updates logged yet.'}
                </p>
              )}
            </div>

            <div className="mt-2 flex items-center justify-between border-t border-line pt-2.5">
              <span className="text-[12px] font-semibold text-ink-2">
                {language === 'ar' ? 'إجمالي التكلفة' : 'Total Cost'}
              </span>
              <span className="text-sm font-bold text-accent-text">{formatMoney(totalCost)}</span>
            </div>
          </div>

          <div className="rounded-panel border border-line bg-surface p-4">
            <h2 className="mb-2 panel-title">
              {language === 'ar' ? 'ملاحظات' : 'Notes'}
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
          <div className="rounded-panel border border-line bg-surface p-4">
            <h2 className="mb-3 panel-title">
              {language === 'ar' ? 'تفاصيل الطلب' : 'Request Details'}
            </h2>
            <div className="flex flex-col gap-2 text-[11px]">
              <DetailRow label={language === 'ar' ? 'مدة العقد' : 'Contract Duration'} value={`${request.contractDurationMonths} ${language === 'ar' ? 'شهر' : 'months'}`} />
              <DetailRow label="Mosaned #" value={request.mosanedNumber || '-'} />
              <DetailRow label={language === 'ar' ? 'تاريخ الإنشاء' : 'Created'} value={request.createdOn} />
              <DetailRow label={language === 'ar' ? 'آخر تحديث' : 'Last Updated'} value={request.updatedOn} />
            </div>
          </div>

          <div className="rounded-panel border border-line bg-surface p-4">
            <h2 className="mb-3 flex items-center gap-1.5 panel-title">
              <Receipt className="size-3.5" /> {t('nav_invoices')}
            </h2>
            {invoice ? (
              <Link to="/invoices" className="block text-xs text-accent-text hover:text-accent">
                {invoice.invoiceNumber} - {formatMoney(invoice.servicePrice)} ({invoice.status})
              </Link>
            ) : (
              <div>
                <p className="mb-2 text-[11px] text-ink-3">
                  {language === 'ar' ? 'لا توجد فاتورة لهذا الطلب بعد.' : 'No invoice for this request yet.'}
                </p>
                {canEdit('finance') && (
                  <SecondaryButton onClick={handleCreateInvoice} className="w-full">
                    {language === 'ar' ? 'إنشاء فاتورة' : 'Create Invoice'}
                  </SecondaryButton>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {statusModal && (
        <StatusUpdateModal
          requestType={request.type}
          currentStatusLabel={status}
          agentId={applicant?.agentId ?? null}
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
    <div className="rounded-panel border border-line bg-surface p-3.5">
      <p className="text-[10.5px] text-ink-3">{label}</p>
      <p className="mt-1 truncate text-sm font-bold text-ink">{value}</p>
    </div>
  )
  return to ? <Link to={to}>{content}</Link> : content
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-3">{label}</span>
      <span className="text-ink">{value}</span>
    </div>
  )
}
