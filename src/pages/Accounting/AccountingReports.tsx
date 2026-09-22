import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BarChart3, FileText, Printer, TrendingUp } from 'lucide-react'
import { useAppStore, formatMoney, invoiceBalance } from '../../store/useAppStore'
import { useTranslation } from '../../i18n/useTranslation'
import PageHeader from '../../components/PageHeader'
import PeriodSelect from '../../components/PeriodSelect'
import StatStrip from '../../components/StatStrip'
import Card from '../../components/Card'
import { expenseBuckets, formatRange, monthKey, useFinancials } from '../../lib/financials'
import type { PeriodKey } from '../../lib/financials'
import MonthlyTrendChart from './MonthlyTrendChart'
import type { MonthPoint } from './MonthlyTrendChart'

const SERIES = ['var(--series-1)', 'var(--series-2)', 'var(--series-3)', 'var(--series-4)', 'var(--series-5)']

function StatementRow({
  label,
  value,
  share,
  emphasis = false,
  indent = false,
  accent,
}: {
  label: string
  value: string
  share?: string
  emphasis?: boolean
  indent?: boolean
  accent?: string
}) {
  return (
    <div
      className={`flex items-baseline justify-between gap-3 border-b border-line py-2.5 last:border-b-0 ${
        emphasis ? 'text-sm font-bold' : 'text-xs'
      }`}
    >
      <span className={`${indent ? 'ps-4' : ''} ${emphasis ? 'text-ink' : 'text-ink-2'}`}>
        {label}
      </span>
      <span className="flex items-baseline gap-3">
        {share && <span className="w-10 text-end text-[10px] num text-ink-3">{share}</span>}
        <span dir="ltr" className={`w-28 text-end num ${accent ?? 'text-ink'}`}>
          {value}
        </span>
      </span>
    </div>
  )
}

export default function AccountingReports() {
  const invoices = useAppStore((s) => s.invoices)
  const currency = useAppStore((s) => s.settings.currency)
  const settings = useAppStore((s) => s.settings)
  const { t, tb, language } = useTranslation()

  const [period, setPeriod] = useState<PeriodKey>('all')
  const financials = useFinancials(period)

  const buckets = useMemo(() => expenseBuckets(financials.transactions), [financials.transactions])
  const revenue = financials.totalIncome
  // Direct cost of putting a worker in a job: the pipeline fees, the agent who
  // introduced her, and bringing her home again if she backs out.
  const placementCost = buckets.recruitment + buckets.agent + buckets.backout
  const grossProfit = revenue - placementCost
  const operating = buckets.payroll + buckets.office
  const net = financials.netProfit
  const receivables = invoices.reduce((sum, invoice) => sum + invoiceBalance(invoice), 0)

  const share = (value: number) => (revenue > 0 ? `${Math.round((value / revenue) * 100)}%` : '-')

  const monthly = useMemo<MonthPoint[]>(() => {
    const map = new Map<string, MonthPoint>()
    for (const tx of financials.transactions) {
      const key = monthKey(tx.date)
      const point = map.get(key) ?? { month: key, income: 0, expenses: 0 }
      if (tx.kind === 'income') point.income += tx.amount
      else point.expenses += tx.amount
      map.set(key, point)
    }
    return [...map.values()].sort((a, b) => a.month.localeCompare(b.month)).slice(-12)
  }, [financials.transactions])

  const breakdown = [
    { label: t('acc_recruitment_costs'), value: buckets.recruitment, color: SERIES[0] },
    { label: t('acc_salaries'), value: buckets.payroll, color: SERIES[1] },
    { label: t('acc_office_running'), value: buckets.office, color: SERIES[2] },
    { label: t('agent_commissions'), value: buckets.agent, color: SERIES[3] },
    { label: t('backout_costs'), value: buckets.backout, color: SERIES[4] },
  ].filter((row) => row.value > 0)

  const agencyRows = useMemo(
    () =>
      financials.agencyAccounts
        .map((account) => ({
          id: account.agency.id,
          name: tb({ en: account.agency.englishName, ar: account.agency.arabicName }),
          workers: account.workers,
          income: account.income,
          cost: account.totalPaid,
          result: account.income - account.totalPaid,
        }))
        .sort((a, b) => b.result - a.result),
    [financials.agencyAccounts, tb],
  )

  return (
    <div className="flex flex-col gap-4 p-4">
      <PageHeader
        title={t('acc_reports_title')}
        subtitle={t('acc_reports_subtitle')}
        actions={
          <>
            <PeriodSelect
              value={period}
              onChange={setPeriod}
              rangeLabel={formatRange(financials.range, financials.transactions, language)}
            />
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1.5 rounded-control border border-line-strong bg-surface px-3 py-2 text-[11px] text-ink hover:border-accent-line"
            >
              <Printer className="size-3.5 text-accent-text" /> {t('acc_print')}
            </button>
          </>
        }
      />

      <StatStrip
        stats={[
          { label: t('acc_revenue'), value: formatMoney(revenue, currency, 0), tone: 'pos', icon: <TrendingUp className="size-4" /> },
          { label: t('fin_total_expenses'), value: formatMoney(financials.totalExpenses, currency, 0), tone: 'neg', icon: <BarChart3 className="size-4" /> },
          {
            label: t('acc_net_result'),
            value: formatMoney(net, currency, 0),
            tone: net >= 0 ? 'pos' : 'neg',
            icon: <FileText className="size-4" />,
          },
          {
            label: t('acc_uncollected'),
            value: formatMoney(receivables, currency, 0),
            tone: 'warn',
            note: `${invoices.filter((i) => invoiceBalance(i) > 0).length} ${t('nav_invoices')}`,
            icon: <FileText className="size-4" />,
          },
        ]}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Card
            title={t('acc_income_statement')}
            subtitle={`${settings.companyName} · ${formatRange(financials.range, financials.transactions, language)}`}
          >
            <StatementRow label={t('acc_revenue')} value={formatMoney(revenue, currency, 0)} share={share(revenue)} accent="text-pos" />
            <StatementRow
              label={t('acc_cost_of_placements')}
              value={`− ${formatMoney(placementCost, currency, 0)}`}
              share={share(placementCost)}
              indent
              accent="text-neg"
            />
            <StatementRow label={t('acc_recruitment_costs')} value={formatMoney(buckets.recruitment, currency, 0)} indent accent="text-ink-2" />
            <StatementRow label={t('agent_commissions')} value={formatMoney(buckets.agent, currency, 0)} indent accent="text-ink-2" />
            <StatementRow label={t('backout_costs')} value={formatMoney(buckets.backout, currency, 0)} indent accent="text-ink-2" />
            <StatementRow label={t('acc_gross_profit')} value={formatMoney(grossProfit, currency, 0)} share={share(grossProfit)} emphasis />
            <StatementRow label={t('acc_operating_expenses')} value={`− ${formatMoney(operating, currency, 0)}`} share={share(operating)} accent="text-neg" />
            <StatementRow label={t('acc_salaries')} value={formatMoney(buckets.payroll, currency, 0)} indent accent="text-ink-2" />
            <StatementRow label={t('acc_office_running')} value={formatMoney(buckets.office, currency, 0)} indent accent="text-ink-2" />
            <StatementRow
              label={t('acc_net_result')}
              value={formatMoney(net, currency, 0)}
              share={share(net)}
              emphasis
              accent={net >= 0 ? 'text-pos' : 'text-neg'}
            />

            <p className="mt-3 rounded-control border border-line bg-sunken p-2.5 text-[10px] leading-relaxed text-ink-3">
              {language === 'ar'
                ? 'الإيرادات تُحتسب عند التحصيل من دفعات الفواتير. المصروفات تُحتسب عند الاستحقاق، وتشمل الرواتب ومصروفات المكتب غير المدفوعة.'
                : 'Revenue is counted when collected, from invoice payments. Expenses are counted when incurred, including payroll and office costs still pending.'}
            </p>
          </Card>
        </div>

        <div className="lg:col-span-7">
          <Card title={t('acc_monthly_trend')} subtitle={formatRange(financials.range, financials.transactions, language)}>
            <MonthlyTrendChart points={monthly} currency={currency} />
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Card title={t('acc_expense_breakdown')} subtitle={t('acc_share')}>
            <ul className="flex flex-col gap-3">
              {breakdown.map((row) => {
                const percent = financials.totalExpenses > 0 ? (row.value / financials.totalExpenses) * 100 : 0
                return (
                  <li key={row.label} className="text-xs">
                    <div className="mb-1 flex items-baseline justify-between gap-2">
                      <span className="flex items-center gap-2 text-ink">
                        <span className="size-2 shrink-0 rounded-pill" style={{ backgroundColor: row.color }} />
                        {row.label}
                      </span>
                      <span className="flex items-baseline gap-2">
                        <span dir="ltr" className="num text-ink-3">
                          {formatMoney(row.value, currency, 0)}
                        </span>
                        <span className="w-8 text-end font-bold num text-ink">{Math.round(percent)}%</span>
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-pill bg-[var(--edge-soft)]">
                      <div className="h-full rounded-pill" style={{ width: `${percent}%`, backgroundColor: row.color }} />
                    </div>
                  </li>
                )
              })}
              {breakdown.length === 0 && <li className="py-8 text-center text-xs text-ink-3">{t('fin_no_data')}</li>}
            </ul>
          </Card>
        </div>

        <div className="lg:col-span-7">
          <Card
            title={t('acc_agency_profitability')}
            subtitle={t('acc_agency_accounts_subtitle')}
            action={
              <Link to="/accounting/agency-accounts" className="text-[11px] text-accent-text hover:text-accent">
                {t('fin_view_details')}
              </Link>
            }
            bodyClassName="overflow-x-auto"
          >
            <table className="data-table">
              <thead>
                <tr>
                  <th className="px-3 py-2.5 text-start">{t('label_name')}</th>
                  <th className="px-3 py-2.5 text-end">{t('fin_workers')}</th>
                  <th className="px-3 py-2.5 text-end">{t('fin_income')}</th>
                  <th className="px-3 py-2.5 text-end">{t('fin_expenses')}</th>
                  <th className="px-3 py-2.5 text-end">{t('acc_net_result')}</th>
                  <th className="px-3 py-2.5 text-end">{t('acc_margin')}</th>
                </tr>
              </thead>
              <tbody>
                {agencyRows.map((row) => (
                  <tr key={row.id} className="text-xs">
                    <td className="px-3 py-2.5 font-medium text-ink">{row.name}</td>
                    <td className="px-3 py-2.5 text-end num text-ink-2">{row.workers}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-end num text-pos">
                      {formatMoney(row.income, currency, 0)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-end num text-neg">
                      {formatMoney(row.cost, currency, 0)}
                    </td>
                    <td
                      dir="ltr"
                      className={`whitespace-nowrap px-3 py-2.5 text-end font-bold num ${
                        row.result >= 0 ? 'text-ink' : 'text-neg'
                      }`}
                    >
                      {formatMoney(row.result, currency, 0)}
                    </td>
                    <td className="px-3 py-2.5 text-end num text-ink-2">
                      {row.income > 0 ? `${Math.round((row.result / row.income) * 100)}%` : '-'}
                    </td>
                  </tr>
                ))}
                {agencyRows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-10 text-center text-xs text-ink-3">
                      {t('acc_no_rows')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Card>
        </div>
      </div>
    </div>
  )
}
