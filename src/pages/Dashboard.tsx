import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Users, TrendingUp, TrendingDown, Wallet, ArrowRight } from 'lucide-react'
import { useAppStore, requestCost, invoiceTotalPaid, currentStatus, formatMoney } from '../store/useAppStore'
import { useTranslation } from '../i18n/useTranslation'
import PageHeader from '../components/PageHeader'

function StatCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-[var(--edge)] bg-[var(--surface)] p-4">
      <div className={`flex size-10 shrink-0 items-center justify-center rounded-full ${accent}`}>{icon}</div>
      <div>
        <p className="text-[11px] text-[var(--text-muted)]">{label}</p>
        <p className="text-lg font-bold text-[var(--text-primary)]">{value}</p>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const applicants = useAppStore((s) => s.applicants)
  const requests = useAppStore((s) => s.requests)
  const invoices = useAppStore((s) => s.invoices)
  const { t, language } = useTranslation()

  const totals = useMemo(() => {
    const totalCost = requests.reduce((sum, r) => sum + requestCost(r), 0)
    const totalPaid = invoices.reduce((sum, i) => sum + invoiceTotalPaid(i), 0)
    return { totalCost, totalPaid, net: totalPaid - totalCost }
  }, [requests, invoices])

  const recentRequests = [...requests].sort((a, b) => (a.updatedOn < b.updatedOn ? 1 : -1)).slice(0, 5)

  return (
    <div className="flex flex-col gap-4 p-4">
      <PageHeader title={t('nav_dashboard')} subtitle={t('page_dashboard_subtitle')} />

      <div className="grid grid-cols-4 gap-4">
        <StatCard
          icon={<Users className="size-5 text-blue-300" />}
          label={t('nav_applicants')}
          value={String(applicants.length)}
          accent="bg-blue-950"
        />
        <StatCard
          icon={<TrendingUp className="size-5 text-emerald-400" />}
          label={language === 'ar' ? 'إجمالي المدفوع' : 'Total Paid'}
          value={formatMoney(totals.totalPaid)}
          accent="bg-emerald-950"
        />
        <StatCard
          icon={<TrendingDown className="size-5 text-rose-400" />}
          label={language === 'ar' ? 'إجمالي التكلفة' : 'Total Cost'}
          value={formatMoney(totals.totalCost)}
          accent="bg-rose-950"
        />
        <StatCard
          icon={<Wallet className="size-5 text-amber-400" />}
          label={language === 'ar' ? 'صافي' : 'Net'}
          value={formatMoney(totals.net)}
          accent="bg-amber-950"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 rounded-lg border border-[var(--edge)] bg-[var(--surface)] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-[0.3px] text-[var(--text-primary)]">
              {language === 'ar' ? 'أحدث طلبات الاستقدام' : 'Recently Updated Requests'}
            </h2>
            <Link to="/recruitments" className="flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300">
              {language === 'ar' ? 'عرض الكل' : 'View all'} <ArrowRight className="size-3" />
            </Link>
          </div>
          <div className="flex flex-col divide-y divide-[var(--edge-soft2)]">
            {recentRequests.map((r) => {
              const applicant = applicants.find((a) => a.id === r.applicantId)
              const status = currentStatus(r)
              return (
                <Link key={r.id} to={`/recruitments/${r.id}`} className="flex items-center justify-between py-2.5 text-xs hover:text-amber-300">
                  <div>
                    <p className="font-medium text-[var(--text-primary)]">{applicant?.englishName ?? '—'}</p>
                    <p className="text-[10px] text-[var(--text-muted)]">
                      {r.type === 'Domestic' ? t('type_domestic') : t('type_profession')} · {r.updatedOn}
                    </p>
                  </div>
                  <span className="rounded border border-blue-500/50 bg-blue-900/60 px-2 py-0.5 text-[10px] text-blue-300">
                    {status ?? (language === 'ar' ? 'لم يبدأ' : 'Not started')}
                  </span>
                </Link>
              )
            })}
            {recentRequests.length === 0 && (
              <p className="py-6 text-center text-xs text-[var(--text-muted)]">
                {language === 'ar' ? 'لا توجد طلبات بعد.' : 'No requests yet.'}
              </p>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-[var(--edge)] bg-[var(--surface)] p-4">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.3px] text-[var(--text-primary)]">{t('nav_invoices')}</h2>
          <div className="flex flex-col gap-2.5">
            {invoices.slice(0, 5).map((inv) => (
              <div key={inv.id} className="flex items-center justify-between text-xs">
                <div>
                  <p className="font-mono text-[var(--text-primary)]">{inv.invoiceNumber}</p>
                  <p className="text-[10px] text-[var(--text-muted)]">{formatMoney(inv.servicePrice)}</p>
                </div>
                <span className="rounded border border-[var(--edge-strong)] px-2 py-0.5 text-[10px] text-[var(--text-secondary)]">{inv.status}</span>
              </div>
            ))}
          </div>
          <Link to="/invoices" className="mt-3 flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300">
            {language === 'ar' ? 'عرض كل الفواتير' : 'View all invoices'} <ArrowRight className="size-3" />
          </Link>
        </div>
      </div>
    </div>
  )
}
