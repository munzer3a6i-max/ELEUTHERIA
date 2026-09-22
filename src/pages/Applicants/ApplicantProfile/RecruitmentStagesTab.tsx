import { useState } from 'react'
import { Plus, Pencil, Trash2, Paperclip } from 'lucide-react'
import { useAppStore, formatMoney } from '../../../store/useAppStore'
import { useTranslation } from '../../../i18n/useTranslation'
import StatusUpdateModal from '../../../components/StatusUpdateModal'
import StageStepper from './StageStepper'
import type { RecruitmentRequest, StatusHistoryEntry } from '../../../types'

export default function RecruitmentStagesTab({
  activeRequest,
}: {
  activeRequest: RecruitmentRequest | null
}) {
  const staff = useAppStore((s) => s.staff)
  const paymentSources = useAppStore((s) => s.paymentSources)
  const addStatusUpdate = useAppStore((s) => s.addStatusUpdate)
  const updateStatusUpdate = useAppStore((s) => s.updateStatusUpdate)
  const deleteStatusUpdate = useAppStore((s) => s.deleteStatusUpdate)
  const { t, tb, language } = useTranslation()
  const [statusModal, setStatusModal] = useState<'add' | StatusHistoryEntry | null>(null)

  if (!activeRequest) {
    return (
      <div className="rounded-panel border border-line bg-surface p-8 text-center">
        <p className="mb-1 text-sm text-ink">
          {language === 'ar' ? 'لا يوجد طلب استقدام مرتبط بهذا المتقدم بعد.' : 'This applicant has no recruitment request yet.'}
        </p>
        <p className="text-xs text-ink-3">
          {language === 'ar' ? 'أنشئ طلبًا من صفحة الاستقدامات لبدء تتبع المراحل.' : 'Create one from the Recruitments page to start tracking stages.'}
        </p>
      </div>
    )
  }

  const currentLabel = activeRequest.statusHistory.length
    ? activeRequest.statusHistory[activeRequest.statusHistory.length - 1].status
    : null

  function handleDelete(entryId: string) {
    if (activeRequest && window.confirm(t('action_delete') + '?')) deleteStatusUpdate(activeRequest.id, entryId)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      <div className="lg:col-span-5">
        <StageStepper requestType={activeRequest.type} request={activeRequest} onEditStages={() => setStatusModal('add')} compact={false} />
      </div>

      <div className="lg:col-span-7 rounded-panel border border-line bg-surface p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="panel-title">
            {language === 'ar' ? 'سجل التحديثات' : 'Update Log'}
          </h2>
          <button
            type="button"
            onClick={() => setStatusModal('add')}
            className="flex items-center gap-1.5 rounded-control bg-accent px-3 py-1.5 text-[11px] font-bold text-accent-ink hover:bg-accent"
          >
            <Plus className="size-3.5" /> {language === 'ar' ? 'إضافة تحديث حالة' : 'Add New Status Update'}
          </button>
        </div>

        <div className="flex flex-col divide-y divide-line">
          {activeRequest.statusHistory.map((h) => {
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
                  {h.attachmentName && (
                    <span className="mt-1 flex items-center gap-1 text-[10px] text-ink-3">
                      <Paperclip className="size-3" /> {h.attachmentName}
                    </span>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="font-bold text-accent-text">{formatMoney(h.cost)}</span>
                  <button type="button" onClick={() => setStatusModal(h)} className="text-ink-3 hover:text-accent-text">
                    <Pencil className="size-3.5" />
                  </button>
                  <button type="button" onClick={() => handleDelete(h.id)} className="text-ink-3 hover:text-neg">
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
          {activeRequest.statusHistory.length === 0 && (
            <p className="py-6 text-center text-[11px] text-ink-3">
              {language === 'ar' ? 'لم يتم تسجيل أي تحديثات بعد.' : 'No status updates logged yet.'}
            </p>
          )}
        </div>
      </div>

      {statusModal && (
        <StatusUpdateModal
          requestType={activeRequest.type}
          currentStatusLabel={currentLabel}
          initial={statusModal === 'add' ? undefined : statusModal}
          onClose={() => setStatusModal(null)}
          onSubmit={(entry) => {
            if (statusModal === 'add') {
              addStatusUpdate(activeRequest.id, entry)
            } else {
              updateStatusUpdate(activeRequest.id, statusModal.id, entry)
            }
            setStatusModal(null)
          }}
        />
      )}
    </div>
  )
}
