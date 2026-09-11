import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAppStore, formatCurrency } from '../../store/useAppStore'
import PageHeader from '../../components/PageHeader'

export default function ExpensesPage() {
  const workers = useAppStore((s) => s.workers)
  const [categoryFilter, setCategoryFilter] = useState('All')

  const allRows = useMemo(() => {
    return workers
      .flatMap((w) => w.expenses.map((e) => ({ ...e, workerId: w.id, workerName: w.name })))
      .sort((a, b) => (a.date < b.date ? 1 : -1))
  }, [workers])

  const categories = useMemo(() => ['All', ...Array.from(new Set(allRows.map((r) => r.category)))], [allRows])
  const rows = categoryFilter === 'All' ? allRows : allRows.filter((r) => r.category === categoryFilter)
  const total = rows.reduce((sum, r) => sum + r.amount, 0)

  return (
    <div className="flex flex-col gap-4 p-4">
      <PageHeader title="Expenses" subtitle="All recruitment costs across every worker" />

      <div className="flex items-center gap-1">
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategoryFilter(c)}
            className={`rounded px-2.5 py-1.5 text-[11px] ${
              categoryFilter === c ? 'bg-[#192b59] text-amber-400' : 'text-slate-400 hover:bg-[#101c3d] hover:text-slate-200'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-lg border border-[#162650] bg-[#0a142f]">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[#14234b] text-[10.5px] font-bold uppercase text-slate-400">
              <th className="px-4 py-3">Worker</th>
              <th className="px-4 py-3">Stage / Description</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Paid</th>
              <th className="px-4 py-3 text-right">Amount (SAR)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-[#122046] text-xs last:border-b-0">
                <td className="px-4 py-3">
                  <Link to={`/workers/${r.workerId}`} className="text-slate-200 hover:text-amber-300">
                    {r.workerName}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-300">{r.stage}</td>
                <td className="px-4 py-3 text-slate-400">{r.category}</td>
                <td className="px-4 py-3 text-slate-400">{r.date}</td>
                <td className="px-4 py-3">
                  <span className={r.paid ? 'text-emerald-400' : 'text-slate-500'}>{r.paid ? 'Paid' : 'Unpaid'}</span>
                </td>
                <td className="px-4 py-3 text-right font-medium text-rose-400">{formatCurrency(r.amount)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-xs text-slate-500">
                  No expenses recorded yet.
                </td>
              </tr>
            )}
          </tbody>
          {rows.length > 0 && (
            <tfoot>
              <tr className="border-t border-[#14234b]">
                <td colSpan={5} className="px-4 py-3 text-right text-xs font-bold uppercase text-rose-500">
                  Total Expenses
                </td>
                <td className="px-4 py-3 text-right text-sm font-bold text-rose-500">{formatCurrency(total)} SAR</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  )
}
