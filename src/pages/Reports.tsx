import { useMemo } from 'react'
import { useAppStore, computeWorkerTotals, formatCurrency } from '../store/useAppStore'
import PageHeader from '../components/PageHeader'
import type { WorkerStatus } from '../types'

const STATUSES: WorkerStatus[] = ['In Process', 'Deployed', 'On Hold', 'Cancelled']

export default function Reports() {
  const workers = useAppStore((s) => s.workers)

  const statusCounts = useMemo(() => {
    const counts = new Map<WorkerStatus, number>()
    for (const s of STATUSES) counts.set(s, 0)
    for (const w of workers) counts.set(w.status, (counts.get(w.status) ?? 0) + 1)
    return counts
  }, [workers])

  const byClient = useMemo(() => {
    const map = new Map<string, { count: number; income: number; expenses: number }>()
    for (const w of workers) {
      const totals = computeWorkerTotals(w)
      const entry = map.get(w.client) ?? { count: 0, income: 0, expenses: 0 }
      entry.count += 1
      entry.income += totals.totalIncome
      entry.expenses += totals.totalExpenses
      map.set(w.client, entry)
    }
    return Array.from(map.entries()).sort((a, b) => b[1].income - a[1].income)
  }, [workers])

  const grandTotal = workers.reduce(
    (acc, w) => {
      const t = computeWorkerTotals(w)
      acc.income += t.totalIncome
      acc.expenses += t.totalExpenses
      return acc
    },
    { income: 0, expenses: 0 },
  )

  return (
    <div className="flex flex-col gap-4 p-4">
      <PageHeader title="Reports" subtitle="Pipeline and financial performance overview" />

      <div className="grid grid-cols-4 gap-4">
        {STATUSES.map((s) => (
          <div key={s} className="rounded-lg border border-[#162650] bg-[#0a142f] p-4 text-center">
            <p className="text-2xl font-bold text-white">{statusCounts.get(s)}</p>
            <p className="text-[11px] text-slate-400">{s}</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-[#162650] bg-[#0a142f] p-4">
        <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.3px] text-slate-300">Performance by Client</h2>
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[#14234b] text-[10.5px] font-bold uppercase text-slate-400">
              <th className="py-2">Client</th>
              <th className="py-2 text-right">Workers</th>
              <th className="py-2 text-right">Income (SAR)</th>
              <th className="py-2 text-right">Expenses (SAR)</th>
              <th className="py-2 text-right">Net Profit (SAR)</th>
            </tr>
          </thead>
          <tbody>
            {byClient.map(([client, data]) => (
              <tr key={client} className="border-b border-[#122046] text-xs last:border-b-0">
                <td className="py-2.5 text-slate-200">{client}</td>
                <td className="py-2.5 text-right text-slate-400">{data.count}</td>
                <td className="py-2.5 text-right text-emerald-400">{formatCurrency(data.income)}</td>
                <td className="py-2.5 text-right text-rose-400">{formatCurrency(data.expenses)}</td>
                <td className="py-2.5 text-right font-medium text-amber-400">
                  {formatCurrency(data.income - data.expenses)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-[#14234b] text-xs font-bold">
              <td className="py-3 text-slate-300">Total</td>
              <td className="py-3 text-right text-slate-300">{workers.length}</td>
              <td className="py-3 text-right text-emerald-400">{formatCurrency(grandTotal.income)}</td>
              <td className="py-3 text-right text-rose-400">{formatCurrency(grandTotal.expenses)}</td>
              <td className="py-3 text-right text-amber-400">{formatCurrency(grandTotal.income - grandTotal.expenses)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
