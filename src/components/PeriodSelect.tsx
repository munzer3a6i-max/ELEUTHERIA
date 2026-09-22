import { useState } from 'react'
import { CalendarDays, Check, ChevronDown } from 'lucide-react'
import { useTranslation } from '../i18n/useTranslation'
import type { TranslationKey } from '../i18n/translations'
import type { PeriodKey } from '../lib/financials'

const PERIODS: { key: PeriodKey; label: TranslationKey }[] = [
  { key: 'all', label: 'fin_period_all' },
  { key: 'month', label: 'fin_period_month' },
  { key: 'quarter', label: 'fin_period_quarter' },
  { key: 'year', label: 'fin_period_year' },
  { key: 'last12', label: 'fin_period_12m' },
]

export default function PeriodSelect({
  value,
  onChange,
  rangeLabel,
  compact = false,
}: {
  value: PeriodKey
  onChange: (period: PeriodKey) => void
  /** The resolved date window, shown on the button unless `compact` is set. */
  rangeLabel?: string
  /** Shows the preset's name instead of the window, for filter rows where space is tight. */
  compact?: boolean
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const selected = PERIODS.find((period) => period.key === value)
  const buttonLabel = compact || !rangeLabel ? t(selected?.label ?? 'fin_period_all') : rangeLabel

  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="btn btn-secondary">
        <CalendarDays className="size-3.5 text-accent-text" />
        <span className="num text-[12px] font-medium">{buttonLabel}</span>
        <ChevronDown className={`size-3.5 text-ink-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} role="presentation" />
          <ul className="absolute end-0 z-20 mt-1.5 w-52 overflow-hidden rounded-panel border border-line bg-surface py-1 shadow-pop">
            {PERIODS.map((period) => (
              <li key={period.key}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(period.key)
                    setOpen(false)
                  }}
                  className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-start text-[12px] hover:bg-raised ${
                    value === period.key ? 'font-semibold text-accent-text' : 'text-ink-2'
                  }`}
                >
                  {t(period.label)}
                  {value === period.key && <Check className="size-3.5" />}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
