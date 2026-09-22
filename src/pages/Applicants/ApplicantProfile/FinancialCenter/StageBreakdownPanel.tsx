import { requestCost, invoiceTotalPaid, formatMoney } from '../../../../store/useAppStore'
import { useTranslation } from '../../../../i18n/useTranslation'
import type { Invoice, RecruitmentRequest } from '../../../../types'

const PALETTE = ['#38bdf8', '#3b82f6', '#10b981', '#fbbf24', '#fb923c', '#2dd4bf', '#818cf8', '#f43f5e', '#d97706', '#a3e635']

function groupByStatus(request: RecruitmentRequest) {
  const totals = new Map<string, number>()
  for (const h of request.statusHistory) {
    totals.set(h.status, (totals.get(h.status) ?? 0) + h.cost)
  }
  return Array.from(totals.entries())
    .map(([label, amount], i) => ({ label, amount, color: PALETTE[i % PALETTE.length] }))
    .sort((a, b) => b.amount - a.amount)
}

function DonutChart({ slices, total }: { slices: ReturnType<typeof groupByStatus>; total: number }) {
  const size = 112
  const strokeWidth = 14
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius

  if (total === 0) {
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--surface-hover)" strokeWidth={strokeWidth} />
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
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--surface-hover)" strokeWidth={strokeWidth} />
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

export default function StageBreakdownPanel({ request, invoice }: { request: RecruitmentRequest; invoice: Invoice | null }) {
  const { language } = useTranslation()
  const totalExpenses = requestCost(request)
  const totalIncome = invoice ? invoiceTotalPaid(invoice) : 0
  const netProfit = totalIncome - totalExpenses
  const profitMargin = totalIncome === 0 ? 0 : (netProfit / totalIncome) * 100
  const slices = groupByStatus(request)

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-panel border border-line bg-surface p-[13px]">
        <h2 className="border-b border-line pb-1.5 text-[11px] font-semibold text-ink-3">
          {language === 'ar' ? 'الحساب الإجمالي' : 'Total Calculation'}
        </h2>
        <div className="flex flex-col gap-1.5 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-ink-2">{language === 'ar' ? 'إجمالي المصروفات' : 'Total Expenses'}</span>
            <span className="text-[11px] font-bold text-neg">{formatMoney(totalExpenses)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-ink-2">{language === 'ar' ? 'إجمالي الدخل' : 'Total Income'}</span>
            <span className="text-[11px] font-bold text-pos">{formatMoney(totalIncome)}</span>
          </div>
          <div className="flex items-center justify-between border-t border-line pt-1.5">
            <span className="text-[11px] font-bold text-accent-text">{language === 'ar' ? 'صافي الربح' : 'Net Profit'}</span>
            <span className="text-[11px] font-bold text-accent-text">{formatMoney(netProfit)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-ink-2">{language === 'ar' ? 'هامش الربح' : 'Profit Margin'}</span>
            <span className="text-[11px] font-bold text-info">{profitMargin.toFixed(2)}%</span>
          </div>
        </div>
      </div>

      <div className="rounded-panel border border-line bg-surface p-[13px]">
        <h2 className="border-b border-line pb-1.5 text-[12px] font-semibold text-ink">
          {language === 'ar' ? 'المصروفات حسب المرحلة' : 'Expenses by Stage'}
        </h2>

        <div className="flex items-center justify-center py-4">
          <DonutChart slices={slices} total={totalExpenses} />
        </div>

        <div className="flex flex-col gap-1 pb-2">
          {slices.map((slice) => (
            <div key={slice.label} className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-pill" style={{ backgroundColor: slice.color }} />
                <span className="text-[10px] text-ink">{slice.label}</span>
              </span>
              <span className="text-[10px] text-ink-2">{formatMoney(slice.amount)}</span>
            </div>
          ))}
          {slices.length === 0 && (
            <p className="text-[10px] text-ink-3">{language === 'ar' ? 'لا توجد مصروفات بعد.' : 'No expenses yet.'}</p>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-line pt-2">
          <span className="text-[11px] font-bold text-ink-2">{language === 'ar' ? 'الإجمالي' : 'Total'}</span>
          <span className="text-[11px] font-bold text-accent-text">{formatMoney(totalExpenses)}</span>
        </div>
      </div>
    </div>
  )
}
