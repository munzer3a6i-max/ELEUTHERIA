import { useState } from 'react'
import { Paperclip, Pencil, Trash2, Plus } from 'lucide-react'
import { useAppStore, requestCost, formatMoney } from '../../../../store/useAppStore'
import { useTranslation } from '../../../../i18n/useTranslation'
import StatusUpdateModal from '../../../../components/StatusUpdateModal'
import type { RecruitmentRequest, StatusHistoryEntry } from '../../../../types'

export default function ExpensesTable({ request }: { request: RecruitmentRequest }) {
  const staff = useAppStore((s) => s.staff)
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
    <div className="rounded-lg border border-[var(--edge)] bg-[var(--surface)] p-[13px]">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-[0.3px] text-[var(--text-primary)]">
          {language === 'ar' ? 'تفصيل المصروفات' : 'Expenses Breakdown'}
        </h2>
        <button
          type="button"
          onClick={() => setStatusModal('add')}
          className="flex items-center gap-1 rounded bg-amber-600 px-3 py-1.5 text-[11px] font-bold text-slate-950 hover:bg-amber-500"
        >
          <Plus className="size-3" /> {language === 'ar' ? 'إضافة مصروف' : 'Add Expense'}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-start">
          <thead>
            <tr className="border-b border-[var(--edge-soft)]">
              <th className="w-8 px-2 pb-3.5 pt-2 text-[10.5px] font-bold text-[var(--text-secondary)]">#</th>
              <th className="px-2 pb-3.5 pt-2 text-[10.5px] font-bold text-[var(--text-secondary)]">{t('label_status')}</th>
              <th className="px-2 pb-3.5 pt-2 text-[10.5px] font-bold text-[var(--text-secondary)]">{t('label_date')}</th>
              <th className="px-2 pb-3.5 pt-2 text-[10.5px] font-bold text-[var(--text-secondary)]">{language === 'ar' ? 'مصدر الدفع' : 'Source'}</th>
              <th className="px-2 pb-3.5 pt-2 text-[10.5px] font-bold text-[var(--text-secondary)]">{language === 'ar' ? 'الموظف' : 'Officer'}</th>
              <th className="px-2 pb-3.5 pt-2 text-end text-[10.5px] font-bold text-[var(--text-secondary)]">{language === 'ar' ? 'المبلغ (USD)' : 'Amount (USD)'}</th>
              <th className="w-16 px-2 pb-3.5 pt-2 text-center text-[10.5px] font-bold text-[var(--text-secondary)]">{t('label_action')}</th>
            </tr>
          </thead>
          <tbody>
            {request.statusHistory.map((row, i) => {
              const source = paymentSources.find((p) => p.id === row.paymentSourceId)
              const resp = staff.find((s) => s.id === row.responsibleEmployeeId)
              return (
                <tr key={row.id} className="border-b border-[var(--edge-soft2)] last:border-b-0">
                  <td className="px-2 py-3.5 text-[10.5px] text-[var(--text-muted)]">{i + 1}</td>
                  <td className="px-2 py-3.5 text-[10.5px] text-[var(--text-primary)]">{row.status}</td>
                  <td className="px-2 py-3.5 text-[10.5px] text-[var(--text-secondary)]">{row.date}</td>
                  <td className="px-2 py-3.5 text-[10.5px] text-[var(--text-secondary)]">{source?.name ?? '—'}</td>
                  <td className="px-2 py-3.5 text-[10.5px] text-[var(--text-secondary)]">{resp ? tb(resp.name) : '—'}</td>
                  <td className="px-2 py-3.5 text-end text-[10.5px] text-[var(--text-primary)]">{formatMoney(row.cost)}</td>
                  <td className="px-2 py-3.5">
                    <div className="flex items-center justify-center gap-3 text-[var(--text-muted)]">
                      {row.attachmentName && <Paperclip className="size-3" />}
                      <button type="button" onClick={() => setStatusModal(row)} className="hover:text-amber-400">
                        <Pencil className="size-3" />
                      </button>
                      <button type="button" onClick={() => handleDelete(row.id, row.status)} className="hover:text-rose-400">
                        <Trash2 className="size-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {request.statusHistory.length === 0 && (
              <tr>
                <td colSpan={7} className="px-2 py-6 text-center text-[11px] text-[var(--text-muted)]">
                  {language === 'ar' ? 'لا توجد مصروفات مسجلة بعد.' : 'No expenses recorded yet.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-2.5 flex items-center justify-between border-t border-[var(--edge-soft)] pt-2.5">
        <span className="text-xs font-bold uppercase tracking-[0.3px] text-rose-500">
          {language === 'ar' ? 'إجمالي المصروفات' : 'Total Expenses'}
        </span>
        <span className="text-sm font-bold tracking-[0.35px] text-rose-500">{formatMoney(totalExpenses)}</span>
      </div>

      {statusModal && (
        <StatusUpdateModal
          requestType={request.type}
          currentStatusLabel={currentLabel}
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
