import { Coins, Wallet, TrendingUp, TrendingDown, Users, Minus } from 'lucide-react'
import { formatMoney } from '../../store/useAppStore'
import { useTranslation } from '../../i18n/useTranslation'
import type { Financials } from '../../lib/financials'

function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return null
  return ((current - previous) / Math.abs(previous)) * 100
}

function Tile({
  icon,
  label,
  value,
  note,
  direction,
  gradient,
}: {
  icon: React.ReactNode
  label: string
  value: string
  note: string
  direction: 'up' | 'down' | 'flat'
  gradient: string
}) {
  const Arrow = direction === 'up' ? TrendingUp : direction === 'down' ? TrendingDown : Minus
  return (
    <div className={`flex items-center gap-3.5 rounded-lg bg-gradient-to-br p-4 text-white shadow-sm ${gradient}`}>
      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white/15">{icon}</span>
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-white/75">{label}</p>
        <p dir="ltr" className="truncate text-xl font-bold leading-tight rtl:text-end">
          {value}
        </p>
        <p className="mt-0.5 flex items-center gap-1 text-[10px] text-white/70">
          <Arrow className="size-3 shrink-0" aria-hidden="true" />
          {note}
        </p>
      </div>
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
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Tile
        icon={<Coins className="size-5" />}
        label={t('fin_total_income')}
        value={formatMoney(totalIncome, currency, 0)}
        note={income.text}
        direction={income.direction}
        gradient="from-[#12306f] to-[#1d4ed8]"
      />
      <Tile
        icon={<Wallet className="size-5" />}
        label={t('fin_total_expenses')}
        value={formatMoney(totalExpenses, currency, 0)}
        note={expenses.text}
        direction={expenses.direction}
        gradient="from-[#7f1d1d] to-[#be123c]"
      />
      <Tile
        icon={netProfit >= 0 ? <TrendingUp className="size-5" /> : <TrendingDown className="size-5" />}
        label={t('fin_net_profit')}
        value={formatMoney(netProfit, currency, 0)}
        note={profit.text}
        direction={profit.direction}
        gradient={netProfit >= 0 ? 'from-[#064e3b] to-[#047857]' : 'from-[#3f2d13] to-[#92400e]'}
      />
      <Tile
        icon={<Users className="size-5" />}
        label={t('fin_total_workers')}
        value={String(workers)}
        note={`${activeWorkers} ${t('fin_active_workers')}`}
        direction="flat"
        gradient="from-[#4c1d95] to-[#6d28d9]"
      />
    </div>
  )
}
