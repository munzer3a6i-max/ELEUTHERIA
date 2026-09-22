import { useMemo, useState } from 'react'
import { CalendarPlus, CheckCheck, Coins, Pencil, Plus, Trash2, Users, Wallet } from 'lucide-react'
import { useAppStore, formatMoney, payrollTotal } from '../../store/useAppStore'
import { useTranslation } from '../../i18n/useTranslation'
import PageHeader from '../../components/PageHeader'
import StatStrip from '../../components/StatStrip'
import StatusBadge from '../../components/StatusBadge'
import Card from '../../components/Card'
import { monthLabel, nextMonth } from '../../lib/financials'
import PayrollEntryModal from './PayrollEntryModal'
import type { PayrollEntry } from '../../types'

export default function PayrollPage() {
  const payroll = useAppStore((s) => s.payroll)
  const staff = useAppStore((s) => s.staff)
  const setPayrollStatus = useAppStore((s) => s.setPayrollStatus)
  const deletePayrollEntry = useAppStore((s) => s.deletePayrollEntry)
  const rollForwardPayroll = useAppStore((s) => s.rollForwardPayroll)
  const currency = useAppStore((s) => s.settings.currency)
  const { t, tb, language } = useTranslation()

  const [selectedMonth, setSelectedMonth] = useState<string | null>(null)
  const [editing, setEditing] = useState<PayrollEntry | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const months = useMemo(() => [...new Set(payroll.map((e) => e.month))].sort().reverse(), [payroll])
  const month = selectedMonth && months.includes(selectedMonth) ? selectedMonth : (months[0] ?? '')
  const rows = useMemo(
    () =>
      payroll
        .filter((entry) => entry.month === month)
        .sort((a, b) => payrollTotal(b) - payrollTotal(a)),
    [payroll, month],
  )

  const history = useMemo(
    () =>
      months.map((key) => {
        const entries = payroll.filter((e) => e.month === key)
        return {
          month: key,
          gross: entries.reduce((sum, e) => sum + payrollTotal(e), 0),
          paid: entries.filter((e) => e.status === 'Paid').reduce((sum, e) => sum + payrollTotal(e), 0),
          people: entries.length,
        }
      }),
    [months, payroll],
  )

  const gross = rows.reduce((sum, e) => sum + payrollTotal(e), 0)
  const paid = rows.filter((e) => e.status === 'Paid').reduce((sum, e) => sum + payrollTotal(e), 0)
  const totals = rows.reduce(
    (acc, e) => ({
      basic: acc.basic + e.basicSalary,
      overtime: acc.overtime + e.overtime,
      allowances: acc.allowances + e.allowances,
    }),
    { basic: 0, overtime: 0, allowances: 0 },
  )

  function openNextMonth() {
    if (!month) return
    const target = nextMonth(month)
    const created = rollForwardPayroll(month, target)
    setSelectedMonth(target)
    if (created === 0) {
      window.alert(
        language === 'ar'
          ? `${monthLabel(target, language)} مفتوح بالفعل لجميع الموظفين.`
          : `${monthLabel(target, 'en')} is already open for every employee.`,
      )
    }
  }

  function markAllPaid() {
    for (const entry of rows) if (entry.status !== 'Paid') setPayrollStatus(entry.id, 'Paid')
  }

  function handleDelete(entry: PayrollEntry) {
    const member = staff.find((m) => m.id === entry.staffId)
    const name = member ? tb(member.name) : entry.staffId
    if (window.confirm(`${t('action_delete')} ${name} · ${monthLabel(entry.month, language)}?`)) {
      deletePayrollEntry(entry.id)
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <PageHeader
        title={t('acc_payroll_title')}
        subtitle={t('acc_payroll_subtitle')}
        actions={
          <>
            <select
              value={month}
              onChange={(e) => setSelectedMonth(e.target.value)}
              aria-label={t('acc_month')}
              className="rounded border border-[var(--edge-strong)] bg-[var(--input)] px-2.5 py-2 text-[11px] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-amber-500/60"
            >
              {months.map((key) => (
                <option key={key} value={key}>
                  {monthLabel(key, language)}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={openNextMonth}
              disabled={!month}
              className="flex items-center gap-1.5 rounded border border-[var(--edge-strong)] bg-[var(--surface)] px-3 py-2 text-[11px] text-[var(--text-primary)] hover:border-amber-500/40 disabled:opacity-50"
            >
              <CalendarPlus className="size-3.5 text-amber-400" /> {t('acc_roll_forward')}
            </button>
            <button
              type="button"
              onClick={markAllPaid}
              disabled={paid === gross || rows.length === 0}
              className="flex items-center gap-1.5 rounded border border-[var(--edge-strong)] bg-[var(--surface)] px-3 py-2 text-[11px] text-[var(--text-primary)] hover:border-amber-500/40 disabled:opacity-50"
            >
              <CheckCheck className="size-3.5 text-emerald-400" /> {t('acc_mark_all_paid')}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(null)
                setModalOpen(true)
              }}
              className="flex items-center gap-1.5 rounded bg-amber-600 px-3 py-2 text-[11px] font-bold text-slate-950 hover:bg-amber-500"
            >
              <Plus className="size-3.5" /> {t('acc_add_entry')}
            </button>
          </>
        }
      />

      <StatStrip
        stats={[
          { label: t('acc_gross_payroll'), value: formatMoney(gross, currency, 0), icon: <Coins className="size-4" /> },
          { label: t('acc_paid'), value: formatMoney(paid, currency, 0), accent: 'text-emerald-400', icon: <Wallet className="size-4" /> },
          {
            label: t('acc_pending'),
            value: formatMoney(gross - paid, currency, 0),
            accent: 'text-amber-400',
            icon: <Wallet className="size-4" />,
          },
          { label: t('acc_headcount'), value: String(rows.length), icon: <Users className="size-4" /> },
        ]}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <Card
            title={`${t('acc_payroll_title')} · ${month ? monthLabel(month, language) : '—'}`}
            subtitle={t('acc_payroll_subtitle')}
            bodyClassName="overflow-x-auto"
          >
            <table className="w-full text-start">
              <thead>
                <tr className="border-b border-[var(--edge-soft)] text-[10px] font-bold uppercase text-[var(--text-secondary)]">
                  <th className="w-8 px-3 py-2.5 text-start">#</th>
                  <th className="px-3 py-2.5 text-start">{t('acc_employee')}</th>
                  <th className="px-3 py-2.5 text-end">{t('fin_basic_salary')}</th>
                  <th className="px-3 py-2.5 text-end">{t('fin_overtime')}</th>
                  <th className="px-3 py-2.5 text-end">{t('fin_allowances')}</th>
                  <th className="px-3 py-2.5 text-end">{t('acc_net_pay')}</th>
                  <th className="px-3 py-2.5 text-start">{t('label_status')}</th>
                  <th className="px-3 py-2.5 text-end">{t('label_action')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((entry, index) => {
                  const member = staff.find((m) => m.id === entry.staffId)
                  return (
                    <tr key={entry.id} className="border-b border-[var(--edge-soft2)] text-xs last:border-b-0 hover:bg-[var(--surface-hover)]">
                      <td className="px-3 py-2.5 tabular-nums text-[var(--text-muted)]">{index + 1}</td>
                      <td className="px-3 py-2.5">
                        <span className="block font-medium text-[var(--text-primary)]">
                          {member ? tb(member.name) : entry.staffId}
                        </span>
                        <span className="block text-[10px] text-[var(--text-muted)]">
                          {member?.role === 'admin'
                            ? language === 'ar'
                              ? 'مدير'
                              : 'Administrator'
                            : language === 'ar'
                              ? 'موظف'
                              : 'Staff'}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-end tabular-nums text-[var(--text-primary)]">
                        {formatMoney(entry.basicSalary, currency, 0)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-end tabular-nums text-[var(--text-secondary)]">
                        {formatMoney(entry.overtime, currency, 0)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-end tabular-nums text-[var(--text-secondary)]">
                        {formatMoney(entry.allowances, currency, 0)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-end font-bold tabular-nums text-[var(--text-primary)]">
                        {formatMoney(payrollTotal(entry), currency, 0)}
                      </td>
                      <td className="px-3 py-2.5">
                        <button
                          type="button"
                          onClick={() => setPayrollStatus(entry.id, entry.status === 'Paid' ? 'Pending' : 'Paid')}
                          title={language === 'ar' ? 'تبديل حالة الدفع' : 'Toggle payment status'}
                        >
                          <StatusBadge status={entry.status} />
                        </button>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="flex items-center justify-end gap-2.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditing(entry)
                              setModalOpen(true)
                            }}
                            title={t('action_edit')}
                            className="text-[var(--text-muted)] hover:text-amber-400"
                          >
                            <Pencil className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(entry)}
                            title={t('action_delete')}
                            className="text-[var(--text-muted)] hover:text-rose-400"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </span>
                      </td>
                    </tr>
                  )
                })}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-3 py-10 text-center text-xs text-[var(--text-muted)]">
                      {t('acc_no_rows')}
                    </td>
                  </tr>
                )}
              </tbody>
              {rows.length > 0 && (
                <tfoot>
                  <tr className="bg-[var(--surface-hover)] text-xs font-bold text-[var(--text-primary)]">
                    <td className="px-3 py-2.5" colSpan={2}>
                      {t('fin_total')}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-end tabular-nums">{formatMoney(totals.basic, currency, 0)}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-end tabular-nums">{formatMoney(totals.overtime, currency, 0)}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-end tabular-nums">{formatMoney(totals.allowances, currency, 0)}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-end tabular-nums">{formatMoney(gross, currency, 0)}</td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              )}
            </table>
          </Card>
        </div>

        <div className="lg:col-span-4">
          <Card title={t('acc_history')} subtitle={t('acc_period_totals')} bodyClassName="p-2">
            <ul className="flex flex-col gap-1">
              {history.map((row) => {
                const share = row.gross > 0 ? (row.paid / row.gross) * 100 : 0
                return (
                  <li key={row.month}>
                    <button
                      type="button"
                      onClick={() => setSelectedMonth(row.month)}
                      className={`w-full rounded px-2.5 py-2 text-start transition-colors ${
                        row.month === month ? 'bg-[var(--active)]' : 'hover:bg-[var(--surface-hover)]'
                      }`}
                    >
                      <span className="flex items-baseline justify-between gap-2 text-xs">
                        <span className={row.month === month ? 'font-bold text-amber-400' : 'text-[var(--text-primary)]'}>
                          {monthLabel(row.month, language)}
                        </span>
                        <span dir="ltr" className="font-bold tabular-nums text-[var(--text-primary)]">
                          {formatMoney(row.gross, currency, 0)}
                        </span>
                      </span>
                      <span className="mt-1.5 flex h-1.5 w-full overflow-hidden rounded-full bg-[var(--edge-soft)]">
                        <span className="h-full rounded-full bg-emerald-500" style={{ width: `${share}%` }} />
                      </span>
                      <span className="mt-1 block text-[10px] text-[var(--text-muted)]">
                        {row.people} {t('acc_headcount')} · {Math.round(share)}% {t('acc_paid')}
                      </span>
                    </button>
                  </li>
                )
              })}
              {history.length === 0 && (
                <li className="px-2 py-8 text-center text-xs text-[var(--text-muted)]">{t('acc_no_rows')}</li>
              )}
            </ul>
          </Card>
        </div>
      </div>

      {modalOpen && (
        <PayrollEntryModal
          entry={editing}
          month={month || new Date().toISOString().slice(0, 7)}
          onClose={() => {
            setModalOpen(false)
            setEditing(null)
          }}
        />
      )}
    </div>
  )
}
