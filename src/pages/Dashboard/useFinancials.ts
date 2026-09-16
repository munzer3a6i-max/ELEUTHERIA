import { useMemo } from 'react'
import { useAppStore, currentStatus, invoiceBalance, payrollTotal } from '../../store/useAppStore'
import { useTranslation } from '../../i18n/useTranslation'
import type { Bilingual, RecruitmentAgency, RecruitmentRequest } from '../../types'

export type PeriodKey = 'all' | 'month' | 'quarter' | 'year' | 'last12'

export interface DateRange {
  from: string
  to: string
}

export interface Transaction {
  id: string
  kind: 'income' | 'expense'
  /** Expense bucket — recruitment costs are per-agency, the rest are overhead. */
  source: 'recruitment' | 'payroll' | 'office' | 'invoice'
  title: string
  detail: string
  date: string
  amount: number
  agencyId: string | null
}

export interface AgencyAccount {
  agency: RecruitmentAgency
  country: string
  currency: string
  workers: number
  income: number
  totalPaid: number
  balance: number
}

export interface Financials {
  range: DateRange | null
  transactions: Transaction[]
  totalIncome: number
  totalExpenses: number
  netProfit: number
  /** Same three figures for the window immediately before this one, or null for all-time. */
  previous: { income: number; expenses: number; net: number } | null
  agencyAccounts: AgencyAccount[]
  totals: { workers: number; totalPaid: number; balance: number }
}

// Partner offices bill in their home currency; the ledger itself stays in the
// company currency set in Settings.
const CURRENCY_BY_COUNTRY: Record<string, string> = {
  Philippines: 'PHP',
  'Saudi Arabia': 'SAR',
  Indonesia: 'IDR',
  India: 'INR',
  Qatar: 'QAR',
  'United Arab Emirates': 'AED',
  Kuwait: 'KWD',
  Oman: 'OMR',
}

function iso(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function shiftMonths(date: Date, months: number): Date {
  const next = new Date(date)
  next.setMonth(next.getMonth() + months)
  return next
}

/** Resolves a preset to a concrete window, anchored on today. */
export function periodRange(period: PeriodKey, today = new Date()): DateRange | null {
  const to = iso(today)
  switch (period) {
    case 'month':
      return { from: iso(new Date(today.getFullYear(), today.getMonth(), 1)), to }
    case 'quarter':
      return { from: iso(shiftMonths(today, -3)), to }
    case 'year':
      return { from: iso(new Date(today.getFullYear(), 0, 1)), to }
    case 'last12':
      return { from: iso(shiftMonths(today, -12)), to }
    default:
      return null
  }
}

/** The window of the same length sitting immediately before `range`. */
function previousRange(range: DateRange): DateRange {
  const from = new Date(range.from)
  const to = new Date(range.to)
  const span = to.getTime() - from.getTime()
  return { from: iso(new Date(from.getTime() - span)), to: range.from }
}

function inRange(date: string, range: DateRange | null): boolean {
  if (!range) return true
  return date >= range.from && date <= range.to
}

/** Payroll is booked on the last day of the period it covers. */
function payrollDate(month: string): string {
  const [year, m] = month.split('-').map(Number)
  return iso(new Date(year, m, 0))
}

export function formatRange(range: DateRange | null, transactions: Transaction[], language: 'en' | 'ar'): string {
  const locale = language === 'ar' ? 'ar' : 'en-GB'
  const fmt = (value: string) =>
    new Date(value).toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' })
  if (range) return `${fmt(range.from)} – ${fmt(range.to)}`
  if (transactions.length === 0) return '—'
  const dates = transactions.map((tx) => tx.date).sort()
  return `${fmt(dates[0])} – ${fmt(dates[dates.length - 1])}`
}

export function useFinancials(period: PeriodKey): Financials {
  const applicants = useAppStore((s) => s.applicants)
  const employers = useAppStore((s) => s.employers)
  const agencies = useAppStore((s) => s.agencies)
  const requests = useAppStore((s) => s.requests)
  const invoices = useAppStore((s) => s.invoices)
  const staff = useAppStore((s) => s.staff)
  const payroll = useAppStore((s) => s.payroll)
  const officeExpenses = useAppStore((s) => s.officeExpenses)
  const { language } = useTranslation()

  return useMemo(() => {
    const range = periodRange(period)
    const pick = (value: Bilingual) => value[language] || value.en

    // Every money movement in the system, normalised into one ledger.
    const ledger: Transaction[] = []

    for (const invoice of invoices) {
      const employer = employers.find((e) => e.id === invoice.employerId)
      for (const payment of invoice.payments) {
        ledger.push({
          id: `income-${payment.id}`,
          kind: 'income',
          source: 'invoice',
          title: employer ? pick({ en: employer.englishName, ar: employer.arabicName }) : invoice.invoiceNumber,
          detail: invoice.invoiceNumber,
          date: payment.date,
          amount: payment.amount,
          agencyId: invoice.recruitmentAgencyId,
        })
      }
    }

    for (const request of requests) {
      const applicant = applicants.find((a) => a.id === request.applicantId)
      for (const entry of request.statusHistory) {
        if (entry.cost <= 0) continue
        ledger.push({
          id: `cost-${entry.id}`,
          kind: 'expense',
          source: 'recruitment',
          title: entry.status,
          detail: applicant ? pick({ en: applicant.englishName, ar: applicant.arabicName }) : '—',
          date: entry.date,
          amount: entry.cost,
          agencyId: request.recruitmentAgencyId,
        })
      }
    }

    for (const entry of payroll) {
      const member = staff.find((m) => m.id === entry.staffId)
      ledger.push({
        id: `payroll-${entry.id}`,
        kind: 'expense',
        source: 'payroll',
        title: language === 'ar' ? 'راتب' : 'Salary',
        detail: member ? pick(member.name) : entry.staffId,
        date: payrollDate(entry.month),
        amount: payrollTotal(entry),
        agencyId: null,
      })
    }

    for (const expense of officeExpenses) {
      ledger.push({
        id: `office-${expense.id}`,
        kind: 'expense',
        source: 'office',
        title: pick(expense.item),
        detail: expense.category,
        date: expense.date,
        amount: expense.amount,
        agencyId: null,
      })
    }

    ledger.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))

    const transactions = ledger.filter((tx) => inRange(tx.date, range))
    const sum = (rows: Transaction[], kind: Transaction['kind']) =>
      rows.filter((tx) => tx.kind === kind).reduce((total, tx) => total + tx.amount, 0)

    const totalIncome = sum(transactions, 'income')
    const totalExpenses = sum(transactions, 'expense')

    let previous: Financials['previous'] = null
    if (range) {
      const before = previousRange(range)
      const rows = ledger.filter((tx) => tx.date >= before.from && tx.date < before.to)
      const income = sum(rows, 'income')
      const expenses = sum(rows, 'expense')
      previous = { income, expenses, net: income - expenses }
    }

    const agencyAccounts: AgencyAccount[] = agencies.map((agency) => {
      const agencyApplicants = applicants.filter((a) => a.recruitmentAgencyId === agency.id)
      const country = agencyApplicants[0]?.country ?? '—'
      const rows = transactions.filter((tx) => tx.agencyId === agency.id)
      return {
        agency,
        country,
        currency: CURRENCY_BY_COUNTRY[country] ?? '—',
        workers: agencyApplicants.length,
        income: sum(rows, 'income'),
        totalPaid: sum(rows, 'expense'),
        balance: invoices
          .filter((i) => i.recruitmentAgencyId === agency.id)
          .reduce((total, i) => total + invoiceBalance(i), 0),
      }
    })

    return {
      range,
      transactions,
      totalIncome,
      totalExpenses,
      netProfit: totalIncome - totalExpenses,
      previous,
      agencyAccounts,
      totals: {
        workers: agencyAccounts.reduce((total, a) => total + a.workers, 0),
        totalPaid: agencyAccounts.reduce((total, a) => total + a.totalPaid, 0),
        balance: agencyAccounts.reduce((total, a) => total + a.balance, 0),
      },
    }
  }, [period, applicants, employers, agencies, requests, invoices, staff, payroll, officeExpenses, language])
}

/** Latest pipeline stage reached by an applicant, falling back to their record status. */
export function workerStage(applicantId: string, requests: RecruitmentRequest[], fallback: string): string {
  const request = requests
    .filter((r) => r.applicantId === applicantId)
    .sort((a, b) => (a.updatedOn < b.updatedOn ? 1 : -1))[0]
  return (request && currentStatus(request)) || fallback
}

export function ageFromDob(dob: string): number | null {
  if (!dob) return null
  const birth = new Date(dob)
  if (Number.isNaN(birth.getTime())) return null
  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  const month = now.getMonth() - birth.getMonth()
  if (month < 0 || (month === 0 && now.getDate() < birth.getDate())) age -= 1
  return age
}
