import { Link } from 'react-router-dom'
import { ArrowDownRight, ArrowUpRight, ClipboardList, Scale } from 'lucide-react'
import { formatMoney } from '../../../store/useAppStore'
import { useTranslation } from '../../../i18n/useTranslation'
import Card from '../../../components/Card'
import type { Financials } from '../../../lib/financials'

export default function FinancialSummary({ financials, currency }: { financials: Financials; currency: string }) {
  const { t, language } = useTranslation()
  const rows = [
    {
      id: 'income',
      label: t('fin_total_income'),
      value: financials.totalIncome,
      icon: <ArrowUpRight className="size-3.5" />,
      accent: 'text-pos',
    },
    {
      id: 'expenses',
      label: t('fin_total_expenses'),
      value: financials.totalExpenses,
      icon: <ArrowDownRight className="size-3.5" />,
      accent: 'text-neg',
    },
    {
      id: 'net',
      label: t('fin_net_profit'),
      value: financials.netProfit,
      icon: <Scale className="size-3.5" />,
      accent: financials.netProfit >= 0 ? 'text-pos' : 'text-neg',
    },
  ]

  return (
    <Card icon={<ClipboardList className="size-4" />} title={t('fin_financial_summary')}>
      <dl className="flex flex-col divide-y divide-line">
        {rows.map((row) => (
          <div key={row.id} className="flex items-center justify-between gap-3 py-2.5 text-xs">
            <dt className="flex items-center gap-2 text-ink-2">
              <span className={row.accent}>{row.icon}</span>
              {row.label}
            </dt>
            <dd dir="ltr" className={`font-bold num ${row.accent}`}>
              {formatMoney(row.value, currency, 0)}
            </dd>
          </div>
        ))}
      </dl>

      <Link
        to="/accounting/reports"
        className="mt-3 flex items-center justify-center rounded-control bg-accent py-2 text-[11px] font-bold text-accent-ink hover:bg-accent"
      >
        {t('fin_view_detailed_report')}
      </Link>

      <blockquote className="mt-3 border-s-2 border-accent-line ps-3 text-[10px] italic leading-relaxed text-ink-3">
        {language === 'ar'
          ? 'النجاح ليس نهائيًا، والفشل ليس قاتلًا: الشجاعة للاستمرار هي ما يهم.'
          : 'Success is not final, failure is not fatal: it is the courage to continue that counts.'}
        <footer className="mt-1 not-italic">- Winston Churchill</footer>
      </blockquote>
    </Card>
  )
}
