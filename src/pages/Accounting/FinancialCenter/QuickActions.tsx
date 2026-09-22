import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Banknote, Building2, CreditCard, FileBarChart, UserPlus, Wallet, Zap } from 'lucide-react'
import { useTranslation } from '../../../i18n/useTranslation'
import Card from '../../../components/Card'

const tileClass =
  'flex flex-col items-center justify-center gap-1.5 rounded-panel border border-line bg-sunken px-2 py-3 text-center text-[10px] font-medium text-ink-2 transition-colors hover:border-accent-line hover:text-accent-text'

function Tile({ to, onClick, icon, label }: { to?: string; onClick?: () => void; icon: ReactNode; label: string }) {
  const content = (
    <>
      <span className="text-accent-text">{icon}</span>
      {label}
    </>
  )
  return to ? (
    <Link to={to} className={tileClass}>
      {content}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={tileClass}>
      {content}
    </button>
  )
}

export default function QuickActions({
  onAddExpense,
  onAddIncome,
}: {
  onAddExpense: () => void
  onAddIncome: () => void
}) {
  const { t } = useTranslation()

  return (
    <Card icon={<Zap className="size-4" />} title={t('fin_quick_actions')}>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Tile to="/applicants" icon={<UserPlus className="size-4" />} label={t('fin_add_worker')} />
        <Tile to="/agencies" icon={<Building2 className="size-4" />} label={t('fin_add_agency')} />
        <Tile onClick={onAddExpense} icon={<CreditCard className="size-4" />} label={t('fin_record_expense')} />
        <Tile onClick={onAddIncome} icon={<Wallet className="size-4" />} label={t('fin_add_income')} />
        <Tile to="/accounting/reports" icon={<FileBarChart className="size-4" />} label={t('fin_generate_report')} />
        <Tile to="/accounting/payroll" icon={<Banknote className="size-4" />} label={t('fin_payroll')} />
      </div>
    </Card>
  )
}
