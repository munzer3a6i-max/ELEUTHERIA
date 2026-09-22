import { useState } from 'react'
import { Paperclip, Pencil, Trash2, Plus } from 'lucide-react'
import { useAppStore, requestCost, formatMoney } from '../../../../store/useAppStore'
import { useTranslation } from '../../../../i18n/useTranslation'
import StatusUpdateModal from '../../../../components/StatusUpdateModal'
import type { RecruitmentRequest, StatusHistoryEntry } from '../../../../types'

export default function ExpensesTable({ request }: { request: RecruitmentRequest }) {
  const staff = useAppStore((s) => s.staff)
  const applicants = useAppStore((s) => s.applicants)
  const paymentSources = useAppStore((s) => s.paymentSources)
  const addStatusUpdate = useAppStore((s) => s.addStatusUpdate)
  const updateStatusUpdate = useAppStore((s) => s.updateStatusUpdate)
  const deleteStatusUpdate = useAppStore((s) => s.deleteStatusUpdate)
  const { t, tb, language } = useTranslation()
  const [statusModal, setStatusModal] = useState<'add' | StatusHistoryEntry | null>(null)

  const totalExpenses = requestCost(request)
  const currentLabel = request.statusHistory.length ? request.statusHistory[request.statusHistory.length - 1].status : null

  function handleDelete(id: string, label: string) {
    if (window.confirm(`${t('action_delete')} "${label}"?`)) deleteStatusUpdate(request.id, id)
  }

  return (
    <div className="rounded-panel border border-line bg-surface p-[13px]">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="panel-title">
          {language === 'ar' ? 'تفصيل المصروفات' : 'Expenses Breakdown'}
        </h2>
        <button
          type="button"
          onClick={() => setStatusModal('add')}
          className="flex items-center gap-1 rounded-control bg-accent px-3 py-1.5 text-[11px] font-bold text-accent-ink hover:bg-accent"
        >
          <Plus className="size-3" /> {language === 'ar' ? 'إضافة مصروف' : 'Add Expense'}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="data-table min-w-[640px]">
          <thead>
            <tr>
              <th className="w-8 px-2 pb-3.5 pt-2 text-[10.5px] font-bold text-ink-2">#</th>
              <th className="px-2 pb-3.5 pt-2 text-[10.5px] font-bold text-ink-2">{t('label_status')}</th>
              <th className="px-2 pb-3.5 pt-2 text-[10.5px] font-bold text-ink-2">{t('label_date')}</th>
              <th className="px-2 pb-3.5 pt-2 text-[10.5px] font-bold text-ink-2">{language === 'ar' ? 'مصدر الدفع' : 'Source'}</th>
              <th className="px-2 pb-3.5 pt-2 text-[10.5px] font-bold text-ink-2">{language === 'ar' ? 'الموظف' : 'Officer'}</th>
              <th className="px-2 pb-3.5 pt-2 text-end text-[10.5px] font-bold text-ink-2">{language === 'ar' ? 'المبلغ (USD)' : 'Amount (USD)'}</th>
              <th className="w-16 px-2 pb-3.5 pt-2 text-center text-[10.5px] font-bold text-ink-2">{t('label_action')}</th>
            </tr>
          </thead>
          <tbody>
            {request.statusHistory.map((row, i) => {
              const source = paymentSources.find((p) => p.id === row.paymentSourceId)
              const resp = staff.find((s) => s.id === row.responsibleEmployeeId)
              return (
                <tr key={row.id} className="border-b border-line last:border-b-0">
                  <td className="px-2 py-3.5 text-[10.5px] text-ink-3">{i + 1}</td>
                  <td className="px-2 py-3.5 text-[10.5px] text-ink">{row.status}</td>
                  <td className="px-2 py-3.5 text-[10.5px] text-ink-2">{row.date}</td>
                  <td className="px-2 py-3.5 text-[10.5px] text-ink-2">{source?.name ?? '-'}</td>
                  <td className="px-2 py-3.5 text-[10.5px] text-ink-2">{resp ? tb(resp.name) : '-'}</td>
                  <td className="px-2 py-3.5 text-end text-[10.5px] text-ink">{formatMoney(row.cost)}</td>
                  <td className="px-2 py-3.5">
                    <div className="flex items-center justify-center gap-3 text-ink-3">
                      {row.attachmentName && <Paperclip className="size-3" />}
                      <button type="button" onClick={() => setStatusModal(row)} className="hover:text-accent-text">
                        <Pencil className="size-3" />
                      </button>
                      <button type="button" onClick={() => handleDelete(row.id, row.status)} className="hover:text-neg">
                        <Trash2 className="size-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {request.statusHistory.length === 0 && (
              <tr>
                <td colSpan={7} className="px-2 py-6 text-center text-[11px] text-ink-3">
                  {language === 'ar' ? 'لا توجد مصروفات مسجلة بعد.' : 'No expenses recorded yet.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-2.5 flex items-center justify-between border-t border-line pt-2.5">
        <span className="panel-title text-neg">
          {language === 'ar' ? 'إجمالي المصروفات' : 'Total Expenses'}
        </span>
        <span className="text-sm font-bold tracking-[0.35px] text-neg">{formatMoney(totalExpenses)}</span>
      </div>

      {statusModal && (
        <StatusUpdateModal
          requestType={request.type}
          currentStatusLabel={currentLabel}
          agentId={applicants.find((a) => a.id === request.applicantId)?.agentId ?? null}
          initial={statusModal === 'add' ? undefined : statusModal}
          onClose={() => setStatusModal(null)}
          onSubmit={(entry) => {
            if (statusModal === 'add') {
              addStatusUpdate(request.id, entry)
            } else {
              updateStatusUpdate(request.id, statusModal.id, entry)
            }
            setStatusModal(null)
          }}
        />
      )}
    </div>
  )
}
