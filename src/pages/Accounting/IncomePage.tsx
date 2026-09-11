import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAppStore, formatCurrency } from '../../store/useAppStore'
import PageHeader from '../../components/PageHeader'

export default function IncomePage() {
  const workers = useAppStore((s) => s.workers)

  const rows = useMemo(() => {
    return workers
      .flatMap((w) => w.incomePayments.map((p) => ({ ...p, workerId: w.id, workerName: w.name })))
      .sort((a, b) => (a.date < b.date ? 1 : -1))
  }, [workers])

  const total = rows.reduce((sum, r) => sum + r.amount, 0)

  return (
    <div className="flex flex-col gap-4 p-4">
      <PageHeader title="Income" subtitle="All client payments received across every worker" />

      <div className="overflow-hidden rounded-lg border border-[#162650] bg-[#0a142f]">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[#14234b] text-[10.5px] font-bold uppercase text-slate-400">
              <th className="px-4 py-3">Worker</th>
              <th className="px-4 py-3">Payment Name</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Type</th>
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
                <td className="px-4 py-3 text-slate-300">{r.name}</td>
                <td className="px-4 py-3 text-slate-400">{r.date}</td>
                <td className="px-4 py-3 text-slate-400">{r.type}</td>
                <td className="px-4 py-3 text-right font-medium text-emerald-400">{formatCurrency(r.amount)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-xs text-slate-500">
                  No income recorded yet.
                </td>
              </tr>
            )}
          </tbody>
          {rows.length > 0 && (
            <tfoot>
              <tr className="border-t border-[#14234b]">
                <td colSpan={4} className="px-4 py-3 text-right text-xs font-bold uppercase text-emerald-400">
                  Total Income
                </td>
                <td className="px-4 py-3 text-right text-sm font-bold text-emerald-400">
                  {formatCurrency(total)} SAR
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  )
}
