import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FileBarChart, MapPin, Minus, Plus, ScrollText, Wallet } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import { useTranslation } from '../../i18n/useTranslation'
import AddExpenseModal from '../../components/AddExpenseModal'
import AddIncomeModal from '../../components/AddIncomeModal'
import AgencyAccounts from './AgencyAccounts'
import AgencyDetail from './AgencyDetail'
import AgentSplitChart from './AgentSplitChart'
import FinancialSummary from './FinancialSummary'
import KpiCards from './KpiCards'
import OfficeExpensesPanel from './OfficeExpensesPanel'
import PayrollPanel from './PayrollPanel'
import PeriodSelect from '../../components/PeriodSelect'
import QuickActions from './QuickActions'
import RecentTransactions from './RecentTransactions'
import { formatRange, useFinancials } from '../../lib/financials'
import type { PeriodKey } from '../../lib/financials'
import type { Slice } from './AgentSplitChart'

// Categorical slots are handed out by the agency's position in the store, so a
// filter or a tab switch never repaints the agencies that stay on screen.
const SERIES = ['var(--series-1)', 'var(--series-2)', 'var(--series-3)', 'var(--series-4)', 'var(--series-5)', 'var(--series-6)']
const MAX_SLICES = 5

export default function Dashboard() {
  const applicants = useAppStore((s) => s.applicants)
  const settings = useAppStore((s) => s.settings)
  const { t, tb, language } = useTranslation()

  const [period, setPeriod] = useState<PeriodKey>('all')
  const [selectedAgencyId, setSelectedAgencyId] = useState<string | null>(null)
  const [modal, setModal] = useState<'expense' | 'income' | null>(null)

  const financials = useFinancials(period)
  const currency = settings.currency

  const selectedAccount =
    financials.agencyAccounts.find((a) => a.agency.id === selectedAgencyId) ?? financials.agencyAccounts[0] ?? null

  const { income, expenses } = useMemo(() => {
    const otherLabel = language === 'ar' ? 'أخرى' : 'Other'
    const overheadLabel = language === 'ar' ? 'المكتب والرواتب' : 'Office & payroll'

    function build(kind: 'income' | 'expense'): Slice[] {
      const items: Slice[] = financials.agencyAccounts.map((account, index) => ({
        id: account.agency.id,
        label: tb({ en: account.agency.englishName, ar: account.agency.arabicName }),
        value: kind === 'income' ? account.income : account.totalPaid,
        color: SERIES[index] ?? 'var(--series-rest)',
      }))
      const ranked = [...items].sort((a, b) => b.value - a.value)
      const top = ranked.slice(0, MAX_SLICES)
      const tail = ranked.slice(MAX_SLICES).reduce((sum, slice) => sum + slice.value, 0)
      const overhead =
        kind === 'expense'
          ? financials.transactions
              .filter((tx) => tx.kind === 'expense' && tx.agencyId === null)
              .reduce((sum, tx) => sum + tx.amount, 0)
          : 0
      if (tail + overhead > 0) {
        top.push({
          id: 'other',
          label: tail > 0 ? otherLabel : overheadLabel,
          value: tail + overhead,
          color: 'var(--series-rest)',
        })
      }
      return top
    }

    return { income: build('income'), expenses: build('expense') }
  }, [financials.agencyAccounts, financials.transactions, tb, language])

  const activeWorkers = applicants.filter((a) => a.status === 'Selected' || a.status === 'Deployed').length

  return (
    <div className="flex flex-col gap-4 p-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-400">
            <ScrollText className="size-5" />
          </span>
          <div>
            <h1 className="text-lg font-bold text-[var(--text-primary)]">{t('fin_title')}</h1>
            <p className="mt-0.5 text-xs text-[var(--text-secondary)]">{t('fin_subtitle')}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <PeriodSelect
            value={period}
            onChange={setPeriod}
            rangeLabel={formatRange(financials.range, financials.transactions, language)}
          />
          <button
            type="button"
            onClick={() => setModal('expense')}
            className="flex items-center gap-1.5 rounded border border-[var(--edge-strong)] bg-[var(--surface)] px-3 py-2 text-[11px] text-[var(--text-primary)] hover:border-amber-500/40"
          >
            <Minus className="size-3.5 text-rose-400" /> {t('fin_add_expense')}
          </button>
          <button
            type="button"
            onClick={() => setModal('income')}
            className="flex items-center gap-1.5 rounded border border-[var(--edge-strong)] bg-[var(--surface)] px-3 py-2 text-[11px] text-[var(--text-primary)] hover:border-amber-500/40"
          >
            <Plus className="size-3.5 text-emerald-400" /> {t('fin_add_income')}
          </button>
          <Link
            to="/accounting/reports"
            className="flex items-center gap-1.5 rounded bg-amber-600 px-3 py-2 text-[11px] font-bold text-slate-950 hover:bg-amber-500"
          >
            <FileBarChart className="size-3.5" /> {t('fin_generate_report')}
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="flex flex-col gap-4 xl:col-span-9">
          <KpiCards
            financials={financials}
            currency={currency}
            workers={applicants.length}
            activeWorkers={activeWorkers}
          />

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <AgencyAccounts
                financials={financials}
                currency={currency}
                selectedId={selectedAccount?.agency.id ?? null}
                onSelect={setSelectedAgencyId}
              />
            </div>
            <div className="lg:col-span-5">
              <AgencyDetail account={selectedAccount} currency={currency} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <PayrollPanel currency={currency} />
            </div>
            <div className="lg:col-span-4">
              <OfficeExpensesPanel currency={currency} onAddExpense={() => setModal('expense')} />
            </div>
            <div className="lg:col-span-3">
              <RecentTransactions transactions={financials.transactions} currency={currency} />
            </div>
          </div>
        </div>

        <aside className="flex flex-col gap-4 xl:col-span-3">
          <AgentSplitChart income={income} expenses={expenses} currency={currency} />
          <QuickActions onAddExpense={() => setModal('expense')} onAddIncome={() => setModal('income')} />
          <FinancialSummary financials={financials} currency={currency} />
        </aside>
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 rounded-lg border border-[var(--edge)] bg-[var(--surface)] px-4 py-3 text-[10px] text-[var(--text-muted)]">
        <span className="font-bold uppercase tracking-[0.5px] text-amber-500">
          {settings.companyName}{' '}
          <span className="font-normal normal-case tracking-normal text-[var(--text-muted)]">
            {settings.companyTagline}
          </span>
        </span>
        <span className="flex items-center gap-1.5">
          <Wallet className="size-3" /> {t('fin_licence')} {settings.licenseNumber}
        </span>
        <span className="flex items-center gap-1.5">
          <MapPin className="size-3" /> {settings.address}
        </span>
        <span className="text-[var(--text-secondary)]">{t('fin_partner_line')}</span>
      </footer>

      {modal === 'expense' && <AddExpenseModal onClose={() => setModal(null)} />}
      {modal === 'income' && <AddIncomeModal onClose={() => setModal(null)} currency={currency} />}
    </div>
  )
}
