import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, PieChart } from 'lucide-react'
import { formatMoney } from '../../store/useAppStore'
import { useTranslation } from '../../i18n/useTranslation'
import Card from '../../components/Card'

export interface Slice {
  id: string
  label: string
  value: number
  /** CSS custom property holding this entity's categorical slot. */
  color: string
}

const RADIUS = 44
const STROKE = 14
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
/** Surface-coloured breathing room between segments, in path units (~2px). */
const GAP = 2

function Donut({
  slices,
  total,
  currency,
  activeId,
  onHover,
}: {
  slices: Slice[]
  total: number
  currency: string
  activeId: string | null
  onHover: (id: string | null) => void
}) {
  const { language } = useTranslation()
  const active = slices.find((s) => s.id === activeId) ?? null
  let offset = 0

  return (
    <div className="relative mx-auto size-[168px]">
      <svg viewBox="0 0 120 120" className="size-full" role="img" aria-label={language === 'ar' ? 'توزيع المبالغ' : 'Share by agency'}>
        <circle cx="60" cy="60" r={RADIUS} fill="none" stroke="var(--edge-soft)" strokeWidth={STROKE} />
        <g transform="rotate(-90 60 60)">
          {total > 0 &&
            slices.map((slice) => {
              const length = (slice.value / total) * CIRCUMFERENCE
              const drawn = Math.max(length - GAP, 0.5)
              const start = offset
              offset += length
              if (slice.value <= 0) return null
              return (
                <circle
                  key={slice.id}
                  cx="60"
                  cy="60"
                  r={RADIUS}
                  fill="none"
                  stroke={slice.color}
                  strokeWidth={activeId === slice.id ? STROKE + 4 : STROKE}
                  strokeDasharray={`${drawn} ${CIRCUMFERENCE - drawn}`}
                  strokeDashoffset={-start}
                  className="cursor-pointer transition-[stroke-width]"
                  onMouseEnter={() => onHover(slice.id)}
                  onMouseLeave={() => onHover(null)}
                >
                  <title>{`${slice.label}: ${formatMoney(slice.value, currency, 0)}`}</title>
                </circle>
              )
            })}
        </g>
      </svg>

      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <span className="flex w-[104px] flex-col items-center text-center">
          <span className="text-sm font-bold text-[var(--text-primary)]">
            {formatMoney(active ? active.value : total, currency, 0)}
          </span>
          <span className="mt-0.5 line-clamp-2 text-[9px] leading-tight text-[var(--text-muted)]">
            {active ? active.label : language === 'ar' ? 'الإجمالي' : 'Total'}
          </span>
        </span>
      </div>
    </div>
  )
}

export default function AgentSplitChart({
  income,
  expenses,
  currency,
}: {
  income: Slice[]
  expenses: Slice[]
  currency: string
}) {
  const { t } = useTranslation()
  const [tab, setTab] = useState<'income' | 'expenses'>('income')
  const [activeId, setActiveId] = useState<string | null>(null)

  const slices = (tab === 'income' ? income : expenses).filter((s) => s.value > 0)
  const total = slices.reduce((sum, s) => sum + s.value, 0)

  return (
    <Card icon={<PieChart className="size-4" />} title={t('fin_agent_split')} bodyClassName="p-4">
      <div className="mb-3 grid grid-cols-2 gap-1 rounded border border-[var(--edge)] bg-[var(--input)] p-1">
        {(['income', 'expenses'] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              setTab(key)
              setActiveId(null)
            }}
            className={`rounded py-1.5 text-[11px] transition-colors ${
              tab === key ? 'bg-[var(--active)] font-bold text-amber-400' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {key === 'income' ? t('fin_income') : t('fin_expenses')}
          </button>
        ))}
      </div>

      {total === 0 ? (
        <p className="py-10 text-center text-xs text-[var(--text-muted)]">{t('fin_no_data')}</p>
      ) : (
        <>
          <Donut slices={slices} total={total} currency={currency} activeId={activeId} onHover={setActiveId} />
          <ul className="mt-3 flex flex-col gap-1.5">
            {slices.map((slice) => (
              <li
                key={slice.id}
                onMouseEnter={() => setActiveId(slice.id)}
                onMouseLeave={() => setActiveId(null)}
                className={`flex items-center gap-2 rounded px-1.5 py-1 text-[11px] ${
                  activeId === slice.id ? 'bg-[var(--surface-hover)]' : ''
                }`}
              >
                <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: slice.color }} />
                <span className="min-w-0 flex-1 truncate text-[var(--text-secondary)]">{slice.label}</span>
                <span className="shrink-0 tabular-nums text-[var(--text-muted)]">
                  {formatMoney(slice.value, currency, 0)}
                </span>
                <span className="w-9 shrink-0 text-end font-bold tabular-nums text-[var(--text-primary)]">
                  {Math.round((slice.value / total) * 100)}%
                </span>
              </li>
            ))}
          </ul>
        </>
      )}

      <Link
        to="/accounting/agency-accounts"
        className="mt-3 flex items-center justify-center gap-1 rounded border border-[var(--edge-strong)] py-2 text-[11px] text-[var(--text-secondary)] hover:border-amber-500/40 hover:text-amber-400"
      >
        {t('fin_view_all_agencies')} <ChevronRight className="size-3 rtl:rotate-180" />
      </Link>
    </Card>
  )
}
