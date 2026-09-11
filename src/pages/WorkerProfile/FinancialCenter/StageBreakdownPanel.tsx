import { computeWorkerTotals, formatCurrency } from '../../../store/useAppStore'
import type { Worker } from '../../../types'

const PALETTE = ['#38bdf8', '#3b82f6', '#10b981', '#fbbf24', '#fb923c', '#2dd4bf', '#818cf8', '#f43f5e', '#d97706', '#a3e635']

function groupByCategory(worker: Worker) {
  const totals = new Map<string, number>()
  for (const e of worker.expenses) {
    const key = e.category || 'Others'
    totals.set(key, (totals.get(key) ?? 0) + e.amount)
  }
  return Array.from(totals.entries())
    .map(([label, amount], i) => ({ label, amount, color: PALETTE[i % PALETTE.length] }))
    .sort((a, b) => b.amount - a.amount)
}

function DonutChart({ slices, total }: { slices: ReturnType<typeof groupByCategory>; total: number }) {
  const size = 112
  const strokeWidth = 14
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius

  if (total === 0) {
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#0f1c3f" strokeWidth={strokeWidth} />
      </svg>
    )
  }

  const withOffsets = slices.reduce<Array<(typeof slices)[number] & { fraction: number; offsetFraction: number }>>(
    (acc, slice) => {
      const fraction = slice.amount / total
      const offsetFraction = acc.length === 0 ? 0 : acc[acc.length - 1].offsetFraction + acc[acc.length - 1].fraction
      acc.push({ ...slice, fraction, offsetFraction })
      return acc
    },
    [],
  )

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#0f1c3f" strokeWidth={strokeWidth} />
      {withOffsets.map((slice) => {
        const dash = slice.fraction * circumference
        const gap = circumference - dash
        const offset = -slice.offsetFraction * circumference
        return (
          <circle
            key={slice.label}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={slice.color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={offset}
          />
        )
      })}
    </svg>
  )
}

export default function StageBreakdownPanel({ worker }: { worker: Worker }) {
  const { totalExpenses, totalIncome, netProfit, profitMargin } = computeWorkerTotals(worker)
  const slices = groupByCategory(worker)

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-[#162650] bg-[#0a142f] p-[13px]">
        <h2 className="border-b border-[#14234b] pb-1.5 text-[11px] font-bold uppercase tracking-[0.55px] text-slate-300">
          Total Calculation
        </h2>
        <div className="flex flex-col gap-1.5 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400">Total Expenses</span>
            <span className="text-[11px] font-bold text-rose-500">
              {formatCurrency(totalExpenses)} <span className="text-[9px]">SAR</span>
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400">Total Income</span>
            <span className="text-[11px] font-bold text-emerald-400">
              {formatCurrency(totalIncome)} <span className="text-[9px]">SAR</span>
            </span>
          </div>
          <div className="flex items-center justify-between border-t border-[#13224b] pt-1.5">
            <span className="text-[11px] font-bold text-amber-400">Net Profit</span>
            <span className="text-[11px] font-bold text-amber-400">
              {formatCurrency(netProfit)} <span className="text-[9px]">SAR</span>
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400">Profit Margin</span>
            <span className="text-[11px] font-bold text-sky-400">{profitMargin.toFixed(2)}%</span>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-[#162650] bg-[#0a142f] p-[13px]">
        <h2 className="border-b border-[#14234b] pb-1.5 text-[11px] font-bold uppercase leading-4 tracking-[0.55px] text-slate-300">
          Expenses by Category
          <br />
          (Summary)
        </h2>

        <div className="flex items-center justify-center py-4">
          <DonutChart slices={slices} total={totalExpenses} />
        </div>

        <div className="flex flex-col gap-1 pb-2">
          {slices.map((slice) => (
            <div key={slice.label} className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full" style={{ backgroundColor: slice.color }} />
                <span className="text-[10px] text-slate-300">{slice.label}</span>
              </span>
              <span className="text-[10px] text-slate-300">{formatCurrency(slice.amount)}</span>
            </div>
          ))}
          {slices.length === 0 && <p className="text-[10px] text-slate-500">No expenses yet.</p>}
        </div>

        <div className="flex items-center justify-between border-t border-[#14234b] pt-2">
          <span className="text-[11px] font-bold text-slate-400">Total</span>
          <span className="text-[11px] font-bold text-amber-400">
            {formatCurrency(totalExpenses)} <span className="text-[9px]">SAR</span>
          </span>
        </div>
      </div>
    </div>
  )
}
