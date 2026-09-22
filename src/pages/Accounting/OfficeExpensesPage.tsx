import { useMemo, useState } from 'react'
import { Building, Coins, Pencil, Plus, Search, Trash2, Wallet } from 'lucide-react'
import { useAppStore, formatMoney } from '../../store/useAppStore'
import { useTranslation } from '../../i18n/useTranslation'
import PageHeader from '../../components/PageHeader'
import StatStrip from '../../components/StatStrip'
import StatusBadge from '../../components/StatusBadge'
import Card from '../../components/Card'
import AddExpenseModal from '../../components/AddExpenseModal'
import PeriodSelect from '../../components/PeriodSelect'
import { periodRange } from '../../lib/financials'
import type { PeriodKey } from '../../lib/financials'
import type { LedgerStatus, OfficeExpense } from '../../types'

const SERIES = ['var(--series-1)', 'var(--series-2)', 'var(--series-3)', 'var(--series-4)', 'var(--series-5)', 'var(--series-6)']

export default function OfficeExpensesPage() {
  const officeExpenses = useAppStore((s) => s.officeExpenses)
  const setOfficeExpenseStatus = useAppStore((s) => s.setOfficeExpenseStatus)
  const deleteOfficeExpense = useAppStore((s) => s.deleteOfficeExpense)
  const currency = useAppStore((s) => s.settings.currency)
  const { t, tb, language } = useTranslation()

  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [status, setStatus] = useState<'all' | LedgerStatus>('all')
  const [period, setPeriod] = useState<PeriodKey>('all')
  const [editing, setEditing] = useState<OfficeExpense | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const categories = useMemo(
    () => [...new Set(officeExpenses.map((e) => e.category))].sort(),
    [officeExpenses],
  )

  const rows = useMemo(() => {
    const range = periodRange(period)
    const search = query.trim().toLowerCase()
    return officeExpenses
      .filter((expense) => {
        if (range && (expense.date < range.from || expense.date > range.to)) return false
        if (category !== 'all' && expense.category !== category) return false
        if (status !== 'all' && expense.status !== status) return false
        if (!search) return true
        return (
          expense.item.en.toLowerCase().includes(search) ||
          expense.item.ar.includes(query.trim()) ||
          expense.category.toLowerCase().includes(search)
        )
      })
      .sort((a, b) => (a.date < b.date ? 1 : -1))
  }, [officeExpenses, period, category, status, query])

  const total = rows.reduce((sum, e) => sum + e.amount, 0)
  const paid = rows.filter((e) => e.status === 'Paid').reduce((sum, e) => sum + e.amount, 0)

  const byCategory = useMemo(() => {
    const map = new Map<string, number>()
    for (const expense of rows) map.set(expense.category, (map.get(expense.category) ?? 0) + expense.amount)
    return [...map.entries()].sort((a, b) => b[1] - a[1])
  }, [rows])

  const filterClass =
    'rounded-control border border-line-strong bg-sunken px-2.5 py-2 text-[11px] text-ink focus:outline-none focus:ring-1 focus:ring-focus'

  function handleDelete(expense: OfficeExpense) {
    if (window.confirm(`${t('action_delete')} ${tb(expense.item)}?`)) deleteOfficeExpense(expense.id)
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <PageHeader
        title={t('acc_office_expenses_title')}
        subtitle={t('acc_office_expenses_subtitle')}
        actions={
          <button
            type="button"
            onClick={() => {
              setEditing(null)
              setModalOpen(true)
            }}
            className="flex items-center gap-1.5 rounded-control bg-accent px-3 py-2 text-[11px] font-bold text-accent-ink hover:bg-accent"
          >
            <Plus className="size-3.5" /> {t('fin_add_expense')}
          </button>
        }
      />

      <StatStrip
        stats={[
          { label: t('fin_total_expenses'), value: formatMoney(total, currency, 0), icon: <Coins className="size-4" /> },
          { label: t('acc_paid'), value: formatMoney(paid, currency, 0), tone: 'pos', icon: <Wallet className="size-4" /> },
          {
            label: t('acc_pending'),
            value: formatMoney(total - paid, currency, 0),
            tone: 'warn',
            icon: <Wallet className="size-4" />,
          },
          {
            label: t('acc_largest_category'),
            value: byCategory[0]?.[0] ?? '-',
            note: byCategory[0] ? formatMoney(byCategory[0][1], currency, 0) : undefined,
            icon: <Building className="size-4" />,
          },
        ]}
      />

      <div className="flex flex-wrap items-center gap-2">
        <label className="relative">
          <Search className="pointer-events-none absolute start-2.5 top-1/2 size-3.5 -translate-y-1/2 text-ink-3" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('action_search')}
            aria-label={t('action_search')}
            className={`${filterClass} w-56 ps-8`}
          />
        </label>
        <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label={t('fin_category')} className={filterClass}>
          <option value="all">{t('acc_all_categories')}</option>
          {categories.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as 'all' | LedgerStatus)}
          aria-label={t('label_status')}
          className={filterClass}
        >
          <option value="all">{t('acc_all_statuses')}</option>
          <option value="Paid">{language === 'ar' ? 'مدفوع' : 'Paid'}</option>
          <option value="Pending">{language === 'ar' ? 'قيد الانتظار' : 'Pending'}</option>
        </select>
        <PeriodSelect value={period} onChange={setPeriod} rangeLabel={t('fin_period_all')} compact />
        <span className="text-[11px] text-ink-3">
          {rows.length} / {officeExpenses.length}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <Card title={t('acc_office_expenses_title')} subtitle={t('acc_office_expenses_subtitle')} bodyClassName="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="w-8 px-3 py-2.5 text-start">#</th>
                  <th className="px-3 py-2.5 text-start">{t('fin_item')}</th>
                  <th className="px-3 py-2.5 text-start">{t('fin_category')}</th>
                  <th className="px-3 py-2.5 text-start">{t('label_date')}</th>
                  <th className="px-3 py-2.5 text-end">{t('label_amount')}</th>
                  <th className="px-3 py-2.5 text-start">{t('label_status')}</th>
                  <th className="px-3 py-2.5 text-end">{t('label_action')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((expense, index) => (
                  <tr key={expense.id} className="text-xs">
                    <td className="px-3 py-2.5 num text-ink-3">{index + 1}</td>
                    <td className="px-3 py-2.5 font-medium text-ink">{tb(expense.item)}</td>
                    <td className="px-3 py-2.5 text-ink-2">{expense.category}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 num text-ink-2">{expense.date}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-end font-bold num text-ink">
                      {formatMoney(expense.amount, currency, 0)}
                    </td>
                    <td className="px-3 py-2.5">
                      <button
                        type="button"
                        onClick={() => setOfficeExpenseStatus(expense.id, expense.status === 'Paid' ? 'Pending' : 'Paid')}
                        title={language === 'ar' ? 'تبديل حالة الدفع' : 'Toggle payment status'}
                      >
                        <StatusBadge status={expense.status} />
                      </button>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="flex items-center justify-end gap-2.5">
                        <button
                          type="button"
                          onClick={() => {
                            setEditing(expense)
                            setModalOpen(true)
                          }}
                          title={t('action_edit')}
                          className="text-ink-3 hover:text-accent-text"
                        >
                          <Pencil className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(expense)}
                          title={t('action_delete')}
                          className="text-ink-3 hover:text-neg"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </span>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-3 py-10 text-center text-xs text-ink-3">
                      {t('acc_no_rows')}
                    </td>
                  </tr>
                )}
              </tbody>
              {rows.length > 0 && (
                <tfoot>
                  <tr>
                    <td className="px-3 py-2.5" colSpan={4}>
                      {t('fin_total')}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-end num">{formatMoney(total, currency, 0)}</td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              )}
            </table>
          </Card>
        </div>

        <div className="lg:col-span-4">
          <Card title={t('acc_by_category')} subtitle={t('acc_share')}>
            <ul className="flex flex-col gap-3">
              {byCategory.map(([name, amount], index) => {
                const share = total > 0 ? (amount / total) * 100 : 0
                return (
                  <li key={name} className="text-xs">
                    <div className="mb-1 flex items-baseline justify-between gap-2">
                      <span className="flex items-center gap-2 text-ink">
                        <span
                          className="size-2 shrink-0 rounded-pill"
                          style={{ backgroundColor: SERIES[index] ?? 'var(--series-rest)' }}
                        />
                        {name}
                      </span>
                      <span className="flex items-baseline gap-2">
                        <span dir="ltr" className="num text-ink-3">
                          {formatMoney(amount, currency, 0)}
                        </span>
                        <span className="w-8 text-end font-bold num text-ink">
                          {Math.round(share)}%
                        </span>
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-pill bg-[var(--edge-soft)]">
                      <div
                        className="h-full rounded-pill"
                        style={{ width: `${share}%`, backgroundColor: SERIES[index] ?? 'var(--series-rest)' }}
                      />
                    </div>
                  </li>
                )
              })}
              {byCategory.length === 0 && (
                <li className="py-8 text-center text-xs text-ink-3">{t('acc_no_rows')}</li>
              )}
            </ul>
          </Card>
        </div>
      </div>

      {modalOpen && (
        <AddExpenseModal
          expense={editing}
          onClose={() => {
            setModalOpen(false)
            setEditing(null)
          }}
        />
      )}
    </div>
  )
}
