import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, MapPin, Search } from 'lucide-react'
import { useAppStore, formatMoney } from '../../../store/useAppStore'
import { useTranslation } from '../../../i18n/useTranslation'
import StatusBadge from '../../../components/StatusBadge'
import { ageFromDob, workerStage } from '../../../lib/financials'
import type { AgencyAccount } from '../../../lib/financials'

function Stat({ label, value, accent = '' }: { label: string; value: string; accent?: string }) {
  return (
    <div className="px-3 py-2">
      <p className="text-[10px] text-ink-3">{label}</p>
      <p className={`text-xs font-bold num ${accent || 'text-ink'}`}>{value}</p>
    </div>
  )
}

export default function AgencyDetail({ account, currency }: { account: AgencyAccount | null; currency: string }) {
  const applicants = useAppStore((s) => s.applicants)
  const requests = useAppStore((s) => s.requests)
  const { t, tb, language } = useTranslation()
  const [query, setQuery] = useState('')

  if (!account) {
    return (
      <section className="flex h-full items-center justify-center rounded-panel border border-line bg-surface p-8 text-center text-xs text-ink-3">
        {language === 'ar' ? 'اختر مكتب استقدام لعرض تفاصيله.' : 'Select an agency to see its account.'}
      </section>
    )
  }

  const name = tb({ en: account.agency.englishName, ar: account.agency.arabicName })
  const workers = applicants.filter((a) => a.recruitmentAgencyId === account.agency.id)
  const search = query.trim().toLowerCase()
  const visible = search
    ? workers.filter(
        (w) =>
          w.englishName.toLowerCase().includes(search) ||
          w.arabicName.includes(query.trim()) ||
          w.profession.toLowerCase().includes(search),
      )
    : workers

  return (
    <section className="flex h-full flex-col rounded-panel border border-line bg-surface">
      <header className="flex items-start justify-between gap-3 border-b border-line px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-pill border border-accent-line bg-accent/10 text-xs font-bold text-accent-text">
            {name.slice(0, 2).toUpperCase()}
          </span>
          <div>
            <h2 className="text-sm font-bold text-ink">{name}</h2>
            <p className="mt-0.5 flex items-center gap-2 text-[10px] text-ink-3">
              <span className="flex items-center gap-1">
                <MapPin className="size-3" /> {account.country}
              </span>
              <StatusBadge status={account.agency.status} />
            </p>
          </div>
        </div>
        <Link to="/agencies" className="flex shrink-0 items-center gap-1 text-[11px] text-accent-text hover:text-accent">
          {t('fin_view_details')} <ChevronRight className="size-3" />
        </Link>
      </header>

      <div className="grid grid-cols-4 divide-x divide-line border-b border-line px-1 py-1 rtl:divide-x-reverse">
        <Stat label={t('fin_currency')} value={account.currency} />
        <Stat label={t('fin_workers')} value={String(account.workers)} />
        <Stat label={t('fin_total_paid')} value={formatMoney(account.totalPaid, currency, 0)} />
        <Stat label={t('fin_balance')} value={formatMoney(account.balance, currency, 0)} accent="text-accent-text" />
      </div>

      <div className="flex items-center justify-between gap-3 px-4 py-2.5">
        <h3 className="text-xs font-bold text-ink">
          {t('fin_workers')} ({workers.length})
        </h3>
        <div className="flex items-center gap-2">
          <label className="relative">
            <Search className="pointer-events-none absolute start-2 top-1/2 size-3 -translate-y-1/2 text-ink-3" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('fin_search_worker')}
              aria-label={t('fin_search_worker')}
              className="w-44 rounded-control border border-line bg-sunken py-1.5 pe-2 ps-7 text-[11px] text-ink placeholder:text-ink-3 focus:outline-none focus:ring-1 focus:ring-focus"
            />
          </label>
          <Link to="/applicants" className="text-[11px] text-accent-text hover:text-accent">
            {t('fin_view_all')}
          </Link>
        </div>
      </div>

      <ul className="flex flex-1 flex-col divide-y divide-line border-t border-line">
        {visible.slice(0, 5).map((worker, index) => {
          const age = ageFromDob(worker.dob)
          return (
            <li key={worker.id}>
              <Link
                to={`/applicants/${worker.id}`}
                className="flex items-center gap-3 px-4 py-2.5 text-xs hover:bg-raised"
              >
                <span className="w-4 shrink-0 text-[10px] text-ink-3 num">{index + 1}</span>
                <span className="flex size-7 shrink-0 items-center justify-center rounded-pill border border-line-strong bg-sunken text-[9px] font-bold text-ink-2">
                  {worker.englishName.slice(0, 2).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-ink">
                    {tb({ en: worker.englishName, ar: worker.arabicName })}
                  </span>
                  <span className="block text-[10px] text-ink-3">
                    {worker.profession}
                    {age !== null && ` · ${t('fin_age')} ${age}`}
                  </span>
                </span>
                <StatusBadge status={workerStage(worker.id, requests, worker.status)} />
                <ChevronRight className="size-3.5 shrink-0 text-ink-3 rtl:rotate-180" />
              </Link>
            </li>
          )
        })}
        {visible.length === 0 && (
          <li className="px-4 py-8 text-center text-xs text-ink-3">{t('fin_no_workers')}</li>
        )}
      </ul>
    </section>
  )
}
