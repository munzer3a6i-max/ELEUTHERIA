import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Building2, HandCoins, Scale, Users } from 'lucide-react'
import { useAppStore, formatMoney, invoiceBalance, invoiceTotalPaid } from '../../store/useAppStore'
import { useTranslation } from '../../i18n/useTranslation'
import PageHeader from '../../components/PageHeader'
import PeriodSelect from '../../components/PeriodSelect'
import StatStrip from '../../components/StatStrip'
import StatusBadge from '../../components/StatusBadge'
import Card from '../../components/Card'
import { formatRange, useFinancials } from '../../lib/financials'
import type { PeriodKey } from '../../lib/financials'

export default function AgencyAccountsPage() {
  const invoices = useAppStore((s) => s.invoices)
  const currency = useAppStore((s) => s.settings.currency)
  const { t, tb, language } = useTranslation()

  const [period, setPeriod] = useState<PeriodKey>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const financials = useFinancials(period)

  const accounts = financials.agencyAccounts
  const selected = accounts.find((a) => a.agency.id === selectedId) ?? accounts[0] ?? null

  const billedByAgency = useMemo(() => {
    const map = new Map<string, { billed: number; collected: number }>()
    for (const invoice of invoices) {
      const entry = map.get(invoice.recruitmentAgencyId) ?? { billed: 0, collected: 0 }
      entry.billed += invoice.servicePrice
      entry.collected += invoiceTotalPaid(invoice)
      map.set(invoice.recruitmentAgencyId, entry)
    }
    return map
  }, [invoices])

  // A statement reads oldest first, so the running balance accumulates downwards.
  const statement = useMemo(() => {
    if (!selected) return []
    const rows = financials.transactions
      .filter((tx) => tx.agencyId === selected.agency.id)
      .slice()
      .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
    let running = 0
    return rows.map((tx) => {
      running += tx.kind === 'income' ? tx.amount : -tx.amount
      return { ...tx, running }
    })
  }, [financials.transactions, selected])

  const outstanding = accounts.reduce((sum, a) => sum + a.balance, 0)

  return (
    <div className="flex flex-col gap-4 p-4">
      <PageHeader
        title={t('acc_agency_accounts_title')}
        subtitle={t('acc_agency_accounts_subtitle')}
        actions={
          <PeriodSelect
            value={period}
            onChange={setPeriod}
            rangeLabel={formatRange(financials.range, financials.transactions, language)}
          />
        }
      />

      <StatStrip
        stats={[
          { label: t('acc_agencies'), value: String(accounts.length), icon: <Building2 className="size-4" /> },
          { label: t('acc_workers_placed'), value: String(financials.totals.workers), icon: <Users className="size-4" /> },
          {
            label: t('acc_paid_to_agencies'),
            value: formatMoney(financials.totals.totalPaid, currency, 0),
            tone: 'neg',
            icon: <HandCoins className="size-4" />,
          },
          {
            label: t('acc_outstanding'),
            value: formatMoney(outstanding, currency, 0),
            tone: 'warn',
            icon: <Scale className="size-4" />,
          },
        ]}
      />

      <Card title={t('acc_agency_accounts_title')} subtitle={t('acc_agency_accounts_subtitle')} bodyClassName="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th className="w-8 px-3 py-2.5 text-start">#</th>
              <th className="px-3 py-2.5 text-start">{t('label_name')}</th>
              <th className="px-3 py-2.5 text-start">{t('acc_licence')}</th>
              <th className="px-3 py-2.5 text-end">{t('fin_workers')}</th>
              <th className="px-3 py-2.5 text-end">{t('acc_billed')}</th>
              <th className="px-3 py-2.5 text-end">{t('acc_collected')}</th>
              <th className="px-3 py-2.5 text-end">{t('acc_paid_to_agencies')}</th>
              <th className="px-3 py-2.5 text-end">{t('acc_outstanding')}</th>
              <th className="px-3 py-2.5 text-start">{t('label_status')}</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((account, index) => {
              const name = tb({ en: account.agency.englishName, ar: account.agency.arabicName })
              const billing = billedByAgency.get(account.agency.id) ?? { billed: 0, collected: 0 }
              return (
                <tr
                  key={account.agency.id}
                  onClick={() => setSelectedId(account.agency.id)}
                  className={`cursor-pointer text-xs ${
                    account.agency.id === selected?.agency.id ? 'bg-accent-soft/40' : 'hover:bg-raised'
                  }`}
                >
                  <td className="px-3 py-2.5 num text-ink-3">{index + 1}</td>
                  <td className="px-3 py-2.5">
                    <span className="block font-medium text-ink">{name}</span>
                    <span className="block text-[10px] text-ink-3">
                      {account.country} · {account.currency}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 num text-[10px] text-ink-2">
                    {account.agency.licenseNumber}
                  </td>
                  <td className="px-3 py-2.5 text-end num text-ink">{account.workers}</td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-end num text-ink-2">
                    {formatMoney(billing.billed, currency, 0)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-end num text-pos">
                    {formatMoney(billing.collected, currency, 0)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-end num text-neg">
                    {formatMoney(account.totalPaid, currency, 0)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-end num text-accent-text">
                    {formatMoney(account.balance, currency, 0)}
                  </td>
                  <td className="px-3 py-2.5">
                    <StatusBadge status={account.agency.status} />
                  </td>
                </tr>
              )
            })}
            {accounts.length === 0 && (
              <tr>
                <td colSpan={9} className="px-3 py-10 text-center text-xs text-ink-3">
                  {t('acc_no_rows')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      {selected && (
        <Card
          title={`${t('acc_statement')} · ${tb({ en: selected.agency.englishName, ar: selected.agency.arabicName })}`}
          subtitle={formatRange(financials.range, financials.transactions, language)}
          action={
            <Link to="/agencies" className="text-[11px] text-accent-text hover:text-accent">
              {t('fin_view_details')}
            </Link>
          }
          bodyClassName="overflow-x-auto"
        >
          <table className="data-table">
            <thead>
              <tr>
                <th className="px-3 py-2.5 text-start">{t('label_date')}</th>
                <th className="px-3 py-2.5 text-start">{t('acc_description')}</th>
                <th className="px-3 py-2.5 text-end">{t('acc_debit')}</th>
                <th className="px-3 py-2.5 text-end">{t('acc_credit')}</th>
                <th className="px-3 py-2.5 text-end">{t('acc_running')}</th>
              </tr>
            </thead>
            <tbody>
              {statement.map((row) => (
                <tr key={row.id} className="text-xs">
                  <td className="whitespace-nowrap px-3 py-2.5 num text-ink-2">{row.date}</td>
                  <td className="px-3 py-2.5">
                    <span className="block text-ink">{row.title}</span>
                    <span className="block text-[10px] text-ink-3">{row.detail}</span>
                  </td>
                  <td
                    className={`whitespace-nowrap px-3 py-2.5 text-end num ${
                      row.kind === 'expense' ? 'text-neg' : 'text-ink-3'
                    }`}
                  >
                    {row.kind === 'expense' ? formatMoney(row.amount, currency, 0) : '-'}
                  </td>
                  <td
                    className={`whitespace-nowrap px-3 py-2.5 text-end num ${
                      row.kind === 'income' ? 'text-pos' : 'text-ink-3'
                    }`}
                  >
                    {row.kind === 'income' ? formatMoney(row.amount, currency, 0) : '-'}
                  </td>
                  <td
                    dir="ltr"
                    className={`whitespace-nowrap px-3 py-2.5 text-end font-bold num ${
                      row.running >= 0 ? 'text-ink' : 'text-neg'
                    }`}
                  >
                    {formatMoney(row.running, currency, 0)}
                  </td>
                </tr>
              ))}
              {statement.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-10 text-center text-xs text-ink-3">
                    {t('fin_no_data')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="flex flex-wrap items-center gap-x-8 gap-y-2 border-t border-line px-3 py-3 text-xs">
            <span className="text-ink-2">
              {t('acc_billed')}:{' '}
              <strong dir="ltr" className="num text-ink">
                {formatMoney(billedByAgency.get(selected.agency.id)?.billed ?? 0, currency, 0)}
              </strong>
            </span>
            <span className="text-ink-2">
              {t('acc_collected')}:{' '}
              <strong dir="ltr" className="num text-pos">
                {formatMoney(selected.income, currency, 0)}
              </strong>
            </span>
            <span className="text-ink-2">
              {t('acc_paid_to_agencies')}:{' '}
              <strong dir="ltr" className="num text-neg">
                {formatMoney(selected.totalPaid, currency, 0)}
              </strong>
            </span>
            <span className="text-ink-2">
              {t('acc_outstanding')}:{' '}
              <strong dir="ltr" className="num text-accent-text">
                {formatMoney(
                  invoices
                    .filter((i) => i.recruitmentAgencyId === selected.agency.id)
                    .reduce((sum, i) => sum + invoiceBalance(i), 0),
                  currency,
                  0,
                )}
              </strong>
            </span>
          </div>
        </Card>
      )}
    </div>
  )
}
