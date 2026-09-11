import { useMemo, useState } from 'react'
import { useAppStore, requestCost, invoiceTotalPaid, formatMoney } from '../store/useAppStore'
import { useTranslation } from '../i18n/useTranslation'
import PageHeader from '../components/PageHeader'

type RangeOption = 'all' | '30' | '90' | 'year'

function withinRange(dateStr: string, range: RangeOption): boolean {
  if (range === 'all') return true
  const date = new Date(dateStr)
  const now = new Date()
  if (range === 'year') return date.getFullYear() === now.getFullYear()
  const days = range === '30' ? 30 : 90
  const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
  return date >= cutoff
}

export default function Reports() {
  const requests = useAppStore((s) => s.requests)
  const employers = useAppStore((s) => s.employers)
  const agencies = useAppStore((s) => s.agencies)
  const invoices = useAppStore((s) => s.invoices)
  const { t, tb, language } = useTranslation()

  // Defaults to "all time" so a fresh visit never silently shows zero
  // just because records happen to fall outside a narrow default window.
  const [range, setRange] = useState<RangeOption>('all')

  const scopedRequests = useMemo(() => requests.filter((r) => withinRange(r.createdOn, range)), [requests, range])
  const scopedInvoices = useMemo(() => invoices.filter((i) => withinRange(i.issuedOn, range)), [invoices, range])

  const byEmployer = useMemo(() => {
    const map = new Map<string, { count: number; cost: number }>()
    for (const r of scopedRequests) {
      const employer = employers.find((e) => e.id === r.employerId)
      const key = employer ? tb({ en: employer.englishName, ar: employer.arabicName }) : '—'
      const entry = map.get(key) ?? { count: 0, cost: 0 }
      entry.count += 1
      entry.cost += requestCost(r)
      map.set(key, entry)
    }
    return Array.from(map.entries()).sort((a, b) => b[1].count - a[1].count)
  }, [scopedRequests, employers, tb])

  const byAgency = useMemo(() => {
    const map = new Map<string, number>()
    for (const r of scopedRequests) {
      const agency = agencies.find((a) => a.id === r.recruitmentAgencyId)
      const key = agency ? tb({ en: agency.englishName, ar: agency.arabicName }) : '—'
      map.set(key, (map.get(key) ?? 0) + 1)
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1])
  }, [scopedRequests, agencies, tb])

  const totalCost = scopedRequests.reduce((sum, r) => sum + requestCost(r), 0)
  const totalPaid = scopedInvoices.reduce((sum, i) => sum + invoiceTotalPaid(i), 0)
  const maxAgencyCount = Math.max(1, ...byAgency.map(([, c]) => c))

  const rangeLabels: Record<RangeOption, string> = {
    all: language === 'ar' ? 'كل الوقت' : 'All Time',
    '30': language === 'ar' ? 'آخر 30 يومًا' : 'Last 30 Days',
    '90': language === 'ar' ? 'آخر 90 يومًا' : 'Last 90 Days',
    year: language === 'ar' ? 'هذا العام' : 'This Year',
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <PageHeader
        title={t('nav_reports')}
        subtitle={t('page_reports_subtitle')}
        actions={
          <div className="flex items-center gap-1">
            {(Object.keys(rangeLabels) as RangeOption[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className={`rounded px-2.5 py-1.5 text-[11px] ${
                  range === r ? 'bg-[var(--active)] text-amber-500' : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
                }`}
              >
                {rangeLabels[r]}
              </button>
            ))}
          </div>
        }
      />

      <p className="text-[11px] text-[var(--text-muted)]">
        {language === 'ar' ? 'عرض البيانات لـ' : 'Showing data for'} <strong className="text-[var(--text-secondary)]">{rangeLabels[range]}</strong> ·{' '}
        {scopedRequests.length} {language === 'ar' ? 'طلب' : 'requests'}, {scopedInvoices.length} {language === 'ar' ? 'فاتورة' : 'invoices'}
      </p>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-[var(--edge)] bg-[var(--surface)] p-4 text-center">
          <p className="text-2xl font-bold text-[var(--text-primary)]">{scopedRequests.length}</p>
          <p className="text-[11px] text-[var(--text-muted)]">{language === 'ar' ? 'الطلبات' : 'Requests'}</p>
        </div>
        <div className="rounded-lg border border-[var(--edge)] bg-[var(--surface)] p-4 text-center">
          <p className="text-2xl font-bold text-rose-400">{formatMoney(totalCost)}</p>
          <p className="text-[11px] text-[var(--text-muted)]">{language === 'ar' ? 'إجمالي التكلفة' : 'Total Cost'}</p>
        </div>
        <div className="rounded-lg border border-[var(--edge)] bg-[var(--surface)] p-4 text-center">
          <p className="text-2xl font-bold text-emerald-400">{formatMoney(totalPaid)}</p>
          <p className="text-[11px] text-[var(--text-muted)]">{language === 'ar' ? 'إجمالي المدفوع' : 'Total Paid'}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-[var(--edge)] bg-[var(--surface)] p-4">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.3px] text-[var(--text-primary)]">
            {language === 'ar' ? 'الأداء حسب صاحب العمل' : 'Performance by Employer'}
          </h2>
          {byEmployer.length === 0 ? (
            <p className="py-6 text-center text-[11px] text-[var(--text-muted)]">
              {language === 'ar' ? 'لا توجد بيانات لهذه الفترة.' : 'No data in this range.'}
            </p>
          ) : (
            <table className="w-full text-start">
              <thead>
                <tr className="border-b border-[var(--edge-soft)] text-[10.5px] font-bold uppercase text-[var(--text-secondary)]">
                  <th className="py-2">{language === 'ar' ? 'صاحب العمل' : 'Employer'}</th>
                  <th className="py-2 text-end">{language === 'ar' ? 'الطلبات' : 'Requests'}</th>
                  <th className="py-2 text-end">{language === 'ar' ? 'التكلفة' : 'Cost'}</th>
                </tr>
              </thead>
              <tbody>
                {byEmployer.map(([name, data]) => (
                  <tr key={name} className="border-b border-[var(--edge-soft2)] text-xs last:border-b-0">
                    <td className="py-2 text-[var(--text-primary)]">{name}</td>
                    <td className="py-2 text-end text-[var(--text-secondary)]">{data.count}</td>
                    <td className="py-2 text-end text-rose-400">{formatMoney(data.cost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="rounded-lg border border-[var(--edge)] bg-[var(--surface)] p-4">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.3px] text-[var(--text-primary)]">
            {language === 'ar' ? 'الطلبات حسب مكتب الاستقدام' : 'Requests by Recruitment Agency'}
          </h2>
          {byAgency.length === 0 ? (
            <p className="py-6 text-center text-[11px] text-[var(--text-muted)]">
              {language === 'ar' ? 'لا توجد بيانات لهذه الفترة.' : 'No data in this range.'}
            </p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {byAgency.map(([name, count]) => (
                <div key={name} className="text-xs">
                  <div className="mb-1 flex items-center justify-between text-[var(--text-secondary)]">
                    <span className="text-[var(--text-primary)]">{name}</span>
                    <span>{count}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-[var(--surface-hover)]">
                    <div className="h-full rounded-full bg-amber-500" style={{ width: `${(count / maxAgencyCount) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
