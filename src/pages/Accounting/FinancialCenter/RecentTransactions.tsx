import { Link } from 'react-router-dom'
import { ArrowDownRight, ArrowUpRight, History } from 'lucide-react'
import { formatMoney } from '../../../store/useAppStore'
import { useTranslation } from '../../../i18n/useTranslation'
import Card from '../../../components/Card'
import type { Transaction } from '../../../lib/financials'

export default function RecentTransactions({
  transactions,
  currency,
}: {
  transactions: Transaction[]
  currency: string
}) {
  const { t, language } = useTranslation()
  const shortDate = (value: string) =>
    new Date(value).toLocaleDateString(language === 'ar' ? 'ar' : 'en-GB', { day: '2-digit', month: 'short' })

  return (
    <Card
      icon={<History className="size-4" />}
      title={t('fin_recent_transactions')}
      action={
        <Link to="/accounting/reports" className="text-[11px] text-accent-text hover:text-accent">
          {t('fin_view_all')}
        </Link>
      }
      bodyClassName="p-2"
    >
      <ul className="flex flex-col divide-y divide-line">
        {transactions.slice(0, 6).map((tx) => (
          <li key={tx.id} className="flex items-center gap-2.5 px-2 py-2.5">
            <span
              className={`flex size-7 shrink-0 items-center justify-center rounded-pill ${
                tx.kind === 'income' ? 'bg-pos-soft text-pos' : 'bg-neg-soft text-neg'
              }`}
            >
              {tx.kind === 'income' ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[11px] font-medium text-ink">{tx.title}</span>
              <span className="block truncate text-[10px] text-ink-3">{tx.detail}</span>
            </span>
            <span className="shrink-0 text-end">
              <span
                dir="ltr"
                className={`block text-[11px] font-bold num ${
                  tx.kind === 'income' ? 'text-pos' : 'text-neg'
                }`}
              >
                {tx.kind === 'income' ? '+' : '−'} {formatMoney(tx.amount, currency, 0)}
              </span>
              <span className="block text-[10px] num text-ink-3">{shortDate(tx.date)}</span>
            </span>
          </li>
        ))}
        {transactions.length === 0 && (
          <li className="px-2 py-8 text-center text-xs text-ink-3">{t('fin_no_data')}</li>
        )}
      </ul>
    </Card>
  )
}
