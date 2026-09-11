import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAppStore, formatCurrency } from '../../store/useAppStore'
import PageHeader from '../../components/PageHeader'

interface LedgerRow {
  id: string
  workerId: string
  workerName: string
  label: string
  date: string
  amount: number
  kind: 'Income' | 'Expense'
}

export default function PaymentsPage() {
  const workers = useAppStore((s) => s.workers)

  const rows = useMemo<LedgerRow[]>(() => {
    const combined: LedgerRow[] = []
    for (const w of workers) {
      for (const p of w.incomePayments) {
        combined.push({ id: p.id, workerId: w.id, workerName: w.name, label: p.name, date: p.date, amount: p.amount, kind: 'Income' })
      }
      for (const e of w.expenses) {
        combined.push({ id: e.id, workerId: w.id, workerName: w.name, label: e.stage, date: e.date, amount: e.amount, kind: 'Expense' })
      }
    }
    return combined.sort((a, b) => (a.date < b.date ? 1 : -1))
  }, [workers])

  return (
    <div className="flex flex-col gap-4 p-4">
      <PageHeader title="Payments" subtitle="Combined transaction ledger — income and expenses, most recent first" />

      <div className="overflow-hidden rounded-lg border border-[#162650] bg-[#0a142f]">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[#14234b] text-[10.5px] font-bold uppercase text-slate-400">
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Worker</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3 text-right">Amount (SAR)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={`${r.kind}-${r.id}`} className="border-b border-[#122046] text-xs last:border-b-0">
                <td className="px-4 py-3 text-slate-400">{r.date}</td>
                <td className="px-4 py-3">
                  <Link to={`/workers/${r.workerId}`} className="text-slate-200 hover:text-amber-300">
                    {r.workerName}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-300">{r.label}</td>
                <td className="px-4 py-3">
                  <span className={r.kind === 'Income' ? 'text-emerald-400' : 'text-rose-400'}>{r.kind}</span>
                </td>
                <td className={`px-4 py-3 text-right font-medium ${r.kind === 'Income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {r.kind === 'Income' ? '+' : '−'} {formatCurrency(r.amount)}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-xs text-slate-500">
                  No transactions recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
