import { Link } from 'react-router-dom'
import { Building2, Eye, Plus, SquareArrowOutUpRight } from 'lucide-react'
import { formatMoney } from '../../../store/useAppStore'
import { useTranslation } from '../../../i18n/useTranslation'
import StatusBadge from '../../../components/StatusBadge'
import Card from '../../../components/Card'
import type { AgencyAccount, Financials } from '../../../lib/financials'

export default function AgencyAccounts({
  financials,
  currency,
  selectedId,
  onSelect,
}: {
  financials: Financials
  currency: string
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  const { t, tb } = useTranslation()
  const { agencyAccounts, totals } = financials

  return (
    <Card
      icon={<Building2 className="size-4" />}
      title={t('fin_agency_accounts')}
      subtitle={t('fin_agency_accounts_sub')}
      action={
        <Link
          to="/agencies"
          className="flex items-center gap-1.5 rounded-control bg-accent px-3 py-1.5 text-[11px] font-bold text-accent-ink hover:bg-accent"
        >
          <Plus className="size-3.5" /> {t('fin_add_agency')}
        </Link>
      }
      bodyClassName="overflow-x-auto"
    >
      <table className="data-table">
        <thead>
          <tr>
            <th className="w-6 px-2 py-2.5 text-start">#</th>
            <th className="px-2 py-2.5 text-start">{t('label_name')}</th>
            <th className="px-2 py-2.5 text-end">{t('fin_workers')}</th>
            <th className="px-2 py-2.5 text-end">{t('fin_total_paid')}</th>
            <th className="px-2 py-2.5 text-end">{t('fin_balance')}</th>
            <th className="px-2 py-2.5 text-start">{t('label_status')}</th>
            <th className="px-2 py-2.5 text-end">{t('label_action')}</th>
          </tr>
        </thead>
        <tbody>
          {agencyAccounts.map((account: AgencyAccount, index) => {
            const name = tb({ en: account.agency.englishName, ar: account.agency.arabicName })
            const selected = account.agency.id === selectedId
            return (
              <tr
                key={account.agency.id}
                onClick={() => onSelect(account.agency.id)}
                className={`cursor-pointer text-xs ${
                  selected ? 'bg-accent-soft/40' : 'hover:bg-raised'
                }`}
              >
                <td className="px-2 py-2.5 text-ink-3 num">{index + 1}</td>
                <td className="px-2 py-2.5">
                  <span className="flex items-center gap-2">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-pill border border-line-strong bg-sunken text-[9px] font-bold text-accent-text">
                      {name.slice(0, 2).toUpperCase()}
                    </span>
                    <span className="min-w-0">
                      <span className="block max-w-[140px] truncate font-medium text-ink" title={name}>
                        {name}
                      </span>
                      <span className="block text-[10px] text-ink-3">
                        {account.country} · {account.currency}
                      </span>
                    </span>
                  </span>
                </td>
                <td className="px-2 py-2.5 text-end num text-ink">{account.workers}</td>
                <td className="whitespace-nowrap px-2 py-2.5 text-end num text-ink">
                  {formatMoney(account.totalPaid, currency, 0)}
                </td>
                <td className="whitespace-nowrap px-2 py-2.5 text-end num text-accent-text">
                  {formatMoney(account.balance, currency, 0)}
                </td>
                <td className="px-2 py-2.5">
                  <StatusBadge status={account.agency.status} />
                </td>
                <td className="px-2 py-2.5">
                  <span className="flex items-center justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onSelect(account.agency.id)
                      }}
                      title={t('action_view')}
                      className={selected ? 'text-accent-text' : 'text-ink-3 hover:text-accent-text'}
                    >
                      <Eye className="size-3.5" />
                    </button>
                    <Link
                      to="/accounting/agency-accounts"
                      onClick={(e) => e.stopPropagation()}
                      title={t('fin_view_details')}
                      className="text-ink-3 hover:text-accent-text"
                    >
                      <SquareArrowOutUpRight className="size-3.5" />
                    </Link>
                  </span>
                </td>
              </tr>
            )
          })}
          {agencyAccounts.length === 0 && (
            <tr>
              <td colSpan={7} className="px-3 py-8 text-center text-xs text-ink-3">
                {t('fin_no_data')}
              </td>
            </tr>
          )}
        </tbody>
        {agencyAccounts.length > 0 && (
          <tfoot>
            <tr>
              <td className="px-2 py-2.5" colSpan={2}>
                {t('fin_total')}
              </td>
              <td className="px-2 py-2.5 text-end num">{totals.workers}</td>
              <td className="whitespace-nowrap px-2 py-2.5 text-end num">
                {formatMoney(totals.totalPaid, currency, 0)}
              </td>
              <td className="whitespace-nowrap px-2 py-2.5 text-end num text-accent-text">
                {formatMoney(totals.balance, currency, 0)}
              </td>
              <td colSpan={2} />
            </tr>
          </tfoot>
        )}
      </table>
    </Card>
  )
}
