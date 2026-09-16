import { Link } from 'react-router-dom'
import { ArrowDownRight, ArrowUpRight, ClipboardList, Scale } from 'lucide-react'
import { formatMoney } from '../../store/useAppStore'
import { useTranslation } from '../../i18n/useTranslation'
import Card from './Card'
import type { Financials } from './useFinancials'

export default function FinancialSummary({ financials, currency }: { financials: Financials; currency: string }) {
  const { t, language } = useTranslation()
  const rows = [
    {
      id: 'income',
      label: t('fin_total_income'),
      value: financials.totalIncome,
      icon: <ArrowUpRight className="size-3.5" />,
      accent: 'text-emerald-400',
    },
    {
      id: 'expenses',
      label: t('fin_total_expenses'),
      value: financials.totalExpenses,
      icon: <ArrowDownRight className="size-3.5" />,
      accent: 'text-rose-400',
    },
    {
      id: 'net',
      label: t('fin_net_profit'),
      value: financials.netProfit,
      icon: <Scale className="size-3.5" />,
      accent: financials.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400',
    },
  ]

  return (
    <Card icon={<ClipboardList className="size-4" />} title={t('fin_financial_summary')}>
      <dl className="flex flex-col divide-y divide-[var(--edge-soft2)]">
        {rows.map((row) => (
          <div key={row.id} className="flex items-center justify-between gap-3 py-2.5 text-xs">
            <dt className="flex items-center gap-2 text-[var(--text-secondary)]">
              <span className={row.accent}>{row.icon}</span>
              {row.label}
            </dt>
            <dd dir="ltr" className={`font-bold tabular-nums ${row.accent}`}>
              {formatMoney(row.value, currency, 0)}
            </dd>
          </div>
        ))}
      </dl>

      <Link
        to="/reports"
        className="mt-3 flex items-center justify-center rounded bg-amber-600 py-2 text-[11px] font-bold text-slate-950 hover:bg-amber-500"
      >
        {t('fin_view_detailed_report')}
      </Link>

      <blockquote className="mt-3 border-s-2 border-amber-500/50 ps-3 text-[10px] italic leading-relaxed text-[var(--text-muted)]">
        {language === 'ar'
          ? 'النجاح ليس نهائيًا، والفشل ليس قاتلًا: الشجاعة للاستمرار هي ما يهم.'
          : 'Success is not final, failure is not fatal: it is the courage to continue that counts.'}
        <footer className="mt-1 not-italic">— Winston Churchill</footer>
      </blockquote>
    </Card>
  )
}
