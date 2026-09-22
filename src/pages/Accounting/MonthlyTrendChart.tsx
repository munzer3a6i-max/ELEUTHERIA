import { useState } from 'react'
import { formatMoney } from '../../store/useAppStore'
import { useTranslation } from '../../i18n/useTranslation'
import { monthLabel } from '../../lib/financials'

export interface MonthPoint {
  month: string
  income: number
  expenses: number
}

/**
 * Grouped columns, two series. Values live in the tooltip rather than on every
 * bar, and the legend carries identity so colour is never the only channel.
 */
export default function MonthlyTrendChart({ points, currency }: { points: MonthPoint[]; currency: string }) {
  const { t, language } = useTranslation()
  const [active, setActive] = useState<string | null>(null)

  // Round the top of the scale up to a readable step so no bar overshoots the
  // highest gridline and the axis labels stay whole.
  const peak = Math.max(1, ...points.flatMap((p) => [p.income, p.expenses]))
  const magnitude = 10 ** Math.floor(Math.log10(peak))
  const scale = Math.ceil(peak / magnitude) * magnitude
  const gridLines = [1, 0.75, 0.5, 0.25]
  const activePoint = points.find((p) => p.month === active) ?? null
  const series = [
    { key: 'income' as const, label: t('fin_income'), color: 'var(--series-1)' },
    { key: 'expenses' as const, label: t('fin_expenses'), color: 'var(--series-2)' },
  ]

  if (points.length === 0) {
    return <p className="py-12 text-center text-xs text-ink-3">{t('fin_no_data')}</p>
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1">
        {series.map((s) => (
          <span key={s.key} className="flex items-center gap-1.5 text-[11px] text-ink-2">
            <span className="size-2 rounded-pill" style={{ backgroundColor: s.color }} />
            {s.label}
          </span>
        ))}
        {activePoint && (
          <span className="ms-auto flex items-center gap-3 text-[11px]">
            <span className="font-bold text-ink">{monthLabel(activePoint.month, language)}</span>
            {series.map((s) => (
              <span key={s.key} className="flex items-center gap-1.5 text-ink-2">
                <span className="size-1.5 rounded-pill" style={{ backgroundColor: s.color }} />
                <span dir="ltr" className="num text-ink">
                  {formatMoney(activePoint[s.key], currency, 0)}
                </span>
              </span>
            ))}
            <span className="flex items-center gap-1.5 text-ink-2">
              {t('fin_net_profit')}
              <span
                dir="ltr"
                className={`font-bold num ${
                  activePoint.income - activePoint.expenses >= 0 ? 'text-pos' : 'text-neg'
                }`}
              >
                {formatMoney(activePoint.income - activePoint.expenses, currency, 0)}
              </span>
            </span>
          </span>
        )}
      </div>

      <div className="relative flex h-44 items-end gap-1 border-b border-line-strong ps-10">
        {gridLines.map((step) => (
          <span key={step} className="pointer-events-none absolute inset-x-0 flex items-center" style={{ bottom: `${step * 100}%` }}>
            <span dir="ltr" className="w-10 shrink-0 pe-1 text-end text-[9px] num text-ink-3">
              {Math.round(scale * step).toLocaleString('en-US')}
            </span>
            <span className="h-px flex-1 bg-[var(--edge-soft)]" />
          </span>
        ))}

        {points.map((point) => (
          <div
            key={point.month}
            onMouseEnter={() => setActive(point.month)}
            onMouseLeave={() => setActive(null)}
            className={`relative flex h-full flex-1 items-end justify-center gap-[2px] rounded-t px-0.5 ${
              active === point.month ? 'bg-raised' : ''
            }`}
          >
            {series.map((s) => (
              <span
                key={s.key}
                className="w-full max-w-[14px] rounded-t-[4px] transition-opacity"
                style={{
                  height: `${Math.max((point[s.key] / scale) * 100, point[s.key] > 0 ? 1.5 : 0)}%`,
                  backgroundColor: s.color,
                  opacity: active && active !== point.month ? 0.65 : 1,
                }}
                title={`${monthLabel(point.month, language)} · ${s.label}: ${formatMoney(point[s.key], currency, 0)}`}
              />
            ))}

          </div>
        ))}
      </div>

      <div className="flex gap-1 ps-10">
        {points.map((point) => (
          <span
            key={point.month}
            className={`flex-1 truncate pt-1.5 text-center text-[9px] ${
              active === point.month ? 'text-ink' : 'text-ink-3'
            }`}
          >
            {monthLabel(point.month, language, false)}
          </span>
        ))}
      </div>
    </div>
  )
}
