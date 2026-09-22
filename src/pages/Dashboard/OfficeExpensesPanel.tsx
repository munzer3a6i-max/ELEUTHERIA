import { Link } from 'react-router-dom'
import { Building, Plus, Trash2 } from 'lucide-react'
import { useAppStore, formatMoney } from '../../store/useAppStore'
import { useTranslation } from '../../i18n/useTranslation'
import StatusBadge from '../../components/StatusBadge'
import Card from '../../components/Card'

export default function OfficeExpensesPanel({
  currency,
  onAddExpense,
}: {
  currency: string
  onAddExpense: () => void
}) {
  const officeExpenses = useAppStore((s) => s.officeExpenses)
  const setOfficeExpenseStatus = useAppStore((s) => s.setOfficeExpenseStatus)
  const deleteOfficeExpense = useAppStore((s) => s.deleteOfficeExpense)
  const { t, tb, language } = useTranslation()

  const rows = [...officeExpenses].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 6)
  const shortDate = (value: string) =>
    new Date(value).toLocaleDateString(language === 'ar' ? 'ar' : 'en-GB', { day: '2-digit', month: 'short' })
  const total = officeExpenses.reduce((sum, expense) => sum + expense.amount, 0)

  return (
    <Card
      icon={<Building className="size-4" />}
      title={t('fin_office_expenses')}
      subtitle={t('fin_office_expenses_sub')}
      action={
        <>
          <button
            type="button"
            onClick={onAddExpense}
            className="flex items-center gap-1 rounded border border-[var(--edge-strong)] px-2 py-1.5 text-[11px] text-[var(--text-secondary)] hover:border-amber-500/40 hover:text-amber-400"
          >
            <Plus className="size-3" /> {t('action_add')}
          </button>
          <Link to="/accounting/office-expenses" className="text-[11px] text-amber-400 hover:text-amber-300">
            {t('fin_view_all')}
          </Link>
        </>
      }
      bodyClassName="overflow-x-auto"
    >
      <table className="w-full text-start">
        <thead>
          <tr className="border-b border-[var(--edge-soft)] text-[10px] font-bold uppercase text-[var(--text-secondary)]">
            <th className="px-1.5 py-2.5 text-start">{t('fin_item')}</th>
            <th className="px-1.5 py-2.5 text-end">{t('label_amount')}</th>
            <th className="px-1 py-2.5 text-start">{t('label_date')}</th>
            <th className="px-1.5 py-2.5 text-end">{t('label_status')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((expense) => (
            <tr key={expense.id} className="border-b border-[var(--edge-soft2)] text-xs last:border-b-0 hover:bg-[var(--surface-hover)]">
              <td className="px-1.5 py-2.5">
                <span className="block font-medium text-[var(--text-primary)]">{tb(expense.item)}</span>
                <span className="block text-[10px] text-[var(--text-muted)]">{expense.category}</span>
              </td>
              <td className="whitespace-nowrap px-1.5 py-2.5 text-end tabular-nums text-[var(--text-primary)]">
                {formatMoney(expense.amount, currency, 0)}
              </td>
              <td className="whitespace-nowrap px-1 py-2.5 tabular-nums text-[var(--text-secondary)]">
                {shortDate(expense.date)}
              </td>
              <td className="px-1.5 py-2.5">
                <span className="flex items-center justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => setOfficeExpenseStatus(expense.id, expense.status === 'Paid' ? 'Pending' : 'Paid')}
                    title={language === 'ar' ? 'تبديل حالة الدفع' : 'Toggle payment status'}
                    className="[&>span]:px-1.5"
                  >
                    <StatusBadge status={expense.status} />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteOfficeExpense(expense.id)}
                    title={t('action_delete')}
                    className="text-[var(--text-muted)] hover:text-rose-400"
                  >
                    <Trash2 className="size-3" />
                  </button>
                </span>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={4} className="px-3 py-8 text-center text-xs text-[var(--text-muted)]">
                {t('fin_no_data')}
              </td>
            </tr>
          )}
        </tbody>
        {rows.length > 0 && (
          <tfoot>
            <tr className="bg-[var(--surface-hover)] text-xs font-bold text-[var(--text-primary)]">
              <td className="px-1.5 py-2.5">{t('fin_total')}</td>
              <td className="whitespace-nowrap px-1.5 py-2.5 text-end tabular-nums">{formatMoney(total, currency, 0)}</td>
              <td colSpan={2} />
            </tr>
          </tfoot>
        )}
      </table>
    </Card>
  )
}
