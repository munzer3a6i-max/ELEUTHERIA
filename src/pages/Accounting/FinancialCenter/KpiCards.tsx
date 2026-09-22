import { ArrowDownRight, ArrowUpRight, Coins, Minus, Users, Wallet } from 'lucide-react'
import { formatMoney } from '../../../store/useAppStore'
import { useTranslation } from '../../../i18n/useTranslation'
import type { Financials } from '../../../lib/financials'

function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return null
  return ((current - previous) / Math.abs(previous)) * 100
}

/**
 * Figures carry their own weight: a neutral surface, the number in mono, and
 * colour reserved for direction. The period's headline result gets the accent
 * rail so the eye lands on one tile, not four competing ones.
 */
function Tile({
  icon,
  label,
  value,
  note,
  direction,
  valueTone,
  lead = false,
}: {
  icon: React.ReactNode
  label: string
  value: string
  note: string
  direction: 'up' | 'down' | 'flat'
  valueTone?: string
  lead?: boolean
}) {
  const Arrow = direction === 'up' ? ArrowUpRight : direction === 'down' ? ArrowDownRight : Minus
  const noteTone = direction === 'up' ? 'text-pos' : direction === 'down' ? 'text-neg' : 'text-ink-3'
  return (
    <div className={`panel relative overflow-hidden px-4 py-3.5 ${lead ? 'border-accent-line' : ''}`}>
      {lead && <span aria-hidden="true" className="absolute inset-y-0 start-0 w-[3px] bg-accent" />}
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-medium text-ink-3">{label}</p>
        <span className="shrink-0 text-ink-3">{icon}</span>
      </div>
      <p dir="ltr" className={`num mt-2 truncate text-[26px] font-medium leading-none rtl:text-end ${valueTone ?? 'text-ink'}`}>
        {value}
      </p>
      <p className={`mt-2 flex items-center gap-1 text-[11px] ${noteTone}`}>
        <Arrow className="size-3 shrink-0" aria-hidden="true" />
        <span className="truncate">{note}</span>
      </p>
    </div>
  )
}

export default function KpiCards({
  financials,
  currency,
  workers,
  activeWorkers,
}: {
  financials: Financials
  currency: string
  workers: number
  activeWorkers: number
}) {
  const { t } = useTranslation()
  const { previous, totalIncome, totalExpenses, netProfit } = financials

  function note(current: number, before: number | undefined): { text: string; direction: 'up' | 'down' | 'flat' } {
    if (before === undefined) return { text: t('fin_no_comparison'), direction: 'flat' }
    const change = percentChange(current, before)
    if (change === null) return { text: t('fin_no_comparison'), direction: 'flat' }
    const direction = change > 0 ? 'up' : change < 0 ? 'down' : 'flat'
    return { text: `${Math.abs(change).toFixed(0)}% ${t('fin_vs_previous')}`, direction }
  }

  const income = note(totalIncome, previous?.income)
  const expenses = note(totalExpenses, previous?.expenses)
  const profit = note(netProfit, previous?.net)

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Tile
        icon={<Coins className="size-4" />}
        label={t('fin_total_income')}
        value={formatMoney(totalIncome, currency, 0)}
        note={income.text}
        direction={income.direction}
        valueTone="text-pos"
      />
      <Tile
        icon={<Wallet className="size-4" />}
        label={t('fin_total_expenses')}
        value={formatMoney(totalExpenses, currency, 0)}
        note={expenses.text}
        direction={expenses.direction === 'up' ? 'down' : expenses.direction === 'down' ? 'up' : 'flat'}
        valueTone="text-neg"
      />
      <Tile
        lead
        icon={<ArrowUpRight className="size-4" />}
        label={t('fin_net_profit')}
        value={formatMoney(netProfit, currency, 0)}
        note={profit.text}
        direction={profit.direction}
        valueTone={netProfit >= 0 ? 'text-ink' : 'text-neg'}
      />
      <Tile
        icon={<Users className="size-4" />}
        label={t('fin_total_workers')}
        value={String(workers)}
        note={`${activeWorkers} ${t('fin_active_workers')}`}
        direction="flat"
      />
    </div>
  )
}
