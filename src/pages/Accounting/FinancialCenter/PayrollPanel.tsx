import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Receipt } from 'lucide-react'
import { useAppStore, formatMoney, payrollTotal } from '../../../store/useAppStore'
import { useTranslation } from '../../../i18n/useTranslation'
import StatusBadge from '../../../components/StatusBadge'
import Card from '../../../components/Card'

export default function PayrollPanel({ currency }: { currency: string }) {
  const payroll = useAppStore((s) => s.payroll)
  const staff = useAppStore((s) => s.staff)
  const setPayrollStatus = useAppStore((s) => s.setPayrollStatus)
  const { t, tb, language } = useTranslation()

  const months = useMemo(
    () => [...new Set(payroll.map((entry) => entry.month))].sort().reverse(),
    [payroll],
  )
  const [month, setMonth] = useState(months[0] ?? '')
  const activeMonth = months.includes(month) ? month : (months[0] ?? '')
  const rows = payroll.filter((entry) => entry.month === activeMonth)

  const totals = rows.reduce(
    (acc, entry) => ({
      basic: acc.basic + entry.basicSalary,
      overtime: acc.overtime + entry.overtime,
      allowances: acc.allowances + entry.allowances,
      total: acc.total + payrollTotal(entry),
    }),
    { basic: 0, overtime: 0, allowances: 0, total: 0 },
  )

  function monthLabel(value: string): string {
    const [year, m] = value.split('-').map(Number)
    return new Date(year, m - 1, 1).toLocaleDateString(language === 'ar' ? 'ar' : 'en-GB', {
      month: 'long',
      year: 'numeric',
    })
  }

  return (
    <Card
      icon={<Receipt className="size-4" />}
      title={t('fin_payroll_employees')}
      subtitle={t('fin_payroll_sub')}
      action={
        <>
          <select
            value={activeMonth}
            onChange={(e) => setMonth(e.target.value)}
            aria-label={t('fin_payroll')}
            className="rounded-control border border-line-strong bg-sunken px-2 py-1.5 text-[11px] text-ink focus:outline-none focus:ring-1 focus:ring-focus"
          >
            {months.map((value) => (
              <option key={value} value={value}>
                {monthLabel(value)}
              </option>
            ))}
          </select>
          <Link to="/accounting/payroll" className="text-[11px] text-accent-text hover:text-accent">
            {t('fin_view_all')}
          </Link>
        </>
      }
      bodyClassName="overflow-x-auto"
    >
      <table className="data-table">
        <thead>
          <tr>
            <th className="w-6 px-2 py-2.5 text-start">#</th>
            <th className="px-2 py-2.5 text-start">{t('label_name')}</th>
            <th className="px-2 py-2.5 text-end" title={t('fin_basic_salary')}>
              {t('fin_basic_short')}
            </th>
            <th className="px-2 py-2.5 text-end" title={t('fin_overtime')}>
              {t('fin_overtime_short')}
            </th>
            <th className="px-2 py-2.5 text-end" title={t('fin_allowances')}>
              {t('fin_allowances_short')}
            </th>
            <th className="px-2 py-2.5 text-end">{t('fin_total')}</th>
            <th className="px-2 py-2.5 text-end">{t('label_status')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((entry, index) => {
            const member = staff.find((m) => m.id === entry.staffId)
            return (
              <tr key={entry.id} className="text-xs">
                <td className="px-2 py-2.5 text-ink-3 num">{index + 1}</td>
                <td className="px-2 py-2.5">
                  <span className="block font-medium text-ink">
                    {member ? tb(member.name) : entry.staffId}
                  </span>
                  <span className="block text-[10px] text-ink-3">
                    {member?.role === 'admin'
                      ? language === 'ar'
                        ? 'مدير'
                        : 'Admin'
                      : language === 'ar'
                        ? 'موظف'
                        : 'Staff'}
                  </span>
                </td>
                <td className="whitespace-nowrap px-2 py-2.5 text-end num text-ink">
                  {formatMoney(entry.basicSalary, currency, 0)}
                </td>
                <td className="whitespace-nowrap px-2 py-2.5 text-end num text-ink-2">
                  {formatMoney(entry.overtime, currency, 0)}
                </td>
                <td className="whitespace-nowrap px-2 py-2.5 text-end num text-ink-2">
                  {formatMoney(entry.allowances, currency, 0)}
                </td>
                <td className="whitespace-nowrap px-2 py-2.5 text-end font-bold num text-ink">
                  {formatMoney(payrollTotal(entry), currency, 0)}
                </td>
                <td className="px-2 py-2.5 text-end">
                  <button
                    type="button"
                    onClick={() => setPayrollStatus(entry.id, entry.status === 'Paid' ? 'Pending' : 'Paid')}
                    title={language === 'ar' ? 'تبديل حالة الدفع' : 'Toggle payment status'}
                    className="[&>span]:px-1.5"
                  >
                    <StatusBadge status={entry.status} />
                  </button>
                </td>
              </tr>
            )
          })}
          {rows.length === 0 && (
            <tr>
              <td colSpan={7} className="px-3 py-8 text-center text-xs text-ink-3">
                {t('fin_no_data')}
              </td>
            </tr>
          )}
        </tbody>
        {rows.length > 0 && (
          <tfoot>
            <tr>
              <td className="px-2 py-2.5" colSpan={2}>
                {t('fin_total')}
              </td>
              <td className="whitespace-nowrap px-2 py-2.5 text-end num">{formatMoney(totals.basic, currency, 0)}</td>
              <td className="whitespace-nowrap px-2 py-2.5 text-end num">{formatMoney(totals.overtime, currency, 0)}</td>
              <td className="whitespace-nowrap px-2 py-2.5 text-end num">{formatMoney(totals.allowances, currency, 0)}</td>
              <td className="whitespace-nowrap px-2 py-2.5 text-end num">{formatMoney(totals.total, currency, 0)}</td>
              <td />
            </tr>
          </tfoot>
        )}
      </table>
    </Card>
  )
}
