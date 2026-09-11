import { useState } from 'react'
import { Check, Paperclip, Pencil, Trash2, Plus, LayoutGrid } from 'lucide-react'
import { useAppStore, computeWorkerTotals, formatCurrency } from '../../../store/useAppStore'
import type { ExpenseRow, Worker } from '../../../types'
import ExpenseFormModal from './ExpenseFormModal'

const headers = [
  { label: '#', className: 'w-8' },
  { label: 'Stage / Description', className: 'w-32' },
  { label: 'Date', className: 'w-24' },
  { label: 'Category', className: 'w-32' },
  { label: 'Reference / To', className: 'w-28' },
  { label: 'Amount (SAR)', className: 'w-20 text-right' },
  { label: 'Paid', className: 'w-12 text-center' },
  { label: 'Receipt / Attachment', className: 'w-44' },
  { label: 'Action', className: 'w-16 text-center' },
]

export default function ExpensesTable({ worker }: { worker: Worker }) {
  const addExpense = useAppStore((s) => s.addExpense)
  const updateExpense = useAppStore((s) => s.updateExpense)
  const deleteExpense = useAppStore((s) => s.deleteExpense)
  const toggleExpensePaid = useAppStore((s) => s.toggleExpensePaid)

  const [modalMode, setModalMode] = useState<'add' | 'quick-add' | ExpenseRow | null>(null)
  const { totalExpenses } = computeWorkerTotals(worker)
  const currentStage = worker.stages.find((s) => s.status === 'current')?.label ?? ''

  function handleDelete(id: string, label: string) {
    if (window.confirm(`Delete expense "${label}"?`)) {
      deleteExpense(worker.id, id)
    }
  }

  return (
    <div className="rounded-lg border border-[#162650] bg-[#0a142f] p-[13px]">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-[0.3px] text-slate-200">Expenses Breakdown</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setModalMode('add')}
            className="flex items-center gap-1 rounded bg-amber-600 px-3 py-1.5 text-[11px] font-bold text-slate-950 hover:bg-amber-500"
          >
            <Plus className="size-3" /> Add Expense
          </button>
          <button
            type="button"
            onClick={() => setModalMode('quick-add')}
            className="flex items-center gap-1 rounded border border-[#23386d] bg-[#101c3d] px-3 py-1.5 text-[11px] text-slate-300 hover:border-amber-500/40"
          >
            <LayoutGrid className="size-3" /> Quick Add by Stage
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-left">
          <thead>
            <tr className="border-b border-[#14234b]">
              {headers.map((h) => (
                <th
                  key={h.label}
                  className={`px-2 pb-3.5 pt-2 text-[10.5px] font-bold text-slate-400 ${h.className ?? ''}`}
                >
                  {h.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {worker.expenses.map((row, i) => (
              <tr key={row.id} className="border-b border-[#122046] last:border-b-0">
                <td className="px-2 py-3.5 text-[10.5px] text-slate-400">{i + 1}</td>
                <td className="px-2 py-3.5 text-[10.5px] text-slate-200">{row.stage}</td>
                <td className="px-2 py-3.5 text-[10.5px] text-slate-400">{row.date}</td>
                <td className="px-2 py-3.5 text-[10.5px] text-slate-400">{row.category}</td>
                <td className="px-2 py-3.5 text-[10.5px] text-slate-400">{row.reference}</td>
                <td className="px-2 py-3.5 text-right text-[10.5px] text-slate-200">
                  {formatCurrency(row.amount)}
                </td>
                <td className="px-2 py-3.5 text-center">
                  <button
                    type="button"
                    onClick={() => toggleExpensePaid(worker.id, row.id)}
                    title={row.paid ? 'Mark as unpaid' : 'Mark as paid'}
                    className={`mx-auto flex size-4 items-center justify-center rounded border ${
                      row.paid ? 'border-emerald-500 bg-emerald-950/60' : 'border-slate-600'
                    }`}
                  >
                    {row.paid && <Check className="size-3 text-emerald-400" strokeWidth={2.5} />}
                  </button>
                </td>
                <td className="px-2 py-3.5">
                  <span className="flex items-center gap-1 text-[10.5px] text-slate-400 hover:text-slate-200">
                    <Paperclip className="size-3" /> {row.receiptName}
                  </span>
                </td>
                <td className="px-2 py-3.5">
                  <div className="flex items-center justify-center gap-3 text-slate-400">
                    <button type="button" onClick={() => setModalMode(row)} className="hover:text-amber-400">
                      <Pencil className="size-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(row.id, row.stage)}
                      className="hover:text-rose-400"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {worker.expenses.length === 0 && (
              <tr>
                <td colSpan={9} className="px-2 py-6 text-center text-[11px] text-slate-500">
                  No expenses recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-2.5 flex items-center justify-between border-t border-[#14234b] pt-2.5">
        <span className="text-xs font-bold uppercase tracking-[0.3px] text-rose-500">Total Expenses</span>
        <span className="text-sm font-bold tracking-[0.35px] text-rose-500">
          {formatCurrency(totalExpenses)} <span className="text-xs">SAR</span>
        </span>
      </div>

      {(modalMode === 'add' || modalMode === 'quick-add') && (
        <ExpenseFormModal
          title={modalMode === 'quick-add' ? `Add Expense — ${currentStage || 'Current Stage'}` : 'Add Expense'}
          initial={modalMode === 'quick-add' ? { stage: currentStage } : undefined}
          onClose={() => setModalMode(null)}
          onSubmit={(data) => {
            addExpense(worker.id, data)
            setModalMode(null)
          }}
        />
      )}
      {modalMode && modalMode !== 'add' && modalMode !== 'quick-add' && (
        <ExpenseFormModal
          title="Edit Expense"
          initial={modalMode}
          onClose={() => setModalMode(null)}
          onSubmit={(data) => {
            updateExpense(worker.id, modalMode.id, data)
            setModalMode(null)
          }}
        />
      )}
    </div>
  )
}
