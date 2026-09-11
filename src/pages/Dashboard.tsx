import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Users, TrendingUp, TrendingDown, Wallet, ArrowRight } from 'lucide-react'
import { useAppStore, computeWorkerTotals, formatCurrency } from '../store/useAppStore'
import StatusBadge from '../components/StatusBadge'
import PageHeader from '../components/PageHeader'

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode
  label: string
  value: string
  accent: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-[#162650] bg-[#0a142f] p-4">
      <div className={`flex size-10 shrink-0 items-center justify-center rounded-full ${accent}`}>{icon}</div>
      <div>
        <p className="text-[11px] text-slate-400">{label}</p>
        <p className="text-lg font-bold text-white">{value}</p>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const workers = useAppStore((s) => s.workers)
  const applications = useAppStore((s) => s.applications)

  const totals = useMemo(() => {
    let totalIncome = 0
    let totalExpenses = 0
    for (const w of workers) {
      const t = computeWorkerTotals(w)
      totalIncome += t.totalIncome
      totalExpenses += t.totalExpenses
    }
    return { totalIncome, totalExpenses, netProfit: totalIncome - totalExpenses }
  }, [workers])

  const recentWorkers = [...workers]
    .sort((a, b) => (a.updatedOn < b.updatedOn ? 1 : -1))
    .slice(0, 5)

  return (
    <div className="flex flex-col gap-4 p-4">
      <PageHeader title="Dashboard" subtitle="Overview of your placement pipeline" />

      <div className="grid grid-cols-4 gap-4">
        <StatCard
          icon={<Users className="size-5 text-blue-300" />}
          label="Total Workers"
          value={String(workers.length)}
          accent="bg-blue-950"
        />
        <StatCard
          icon={<TrendingUp className="size-5 text-emerald-400" />}
          label="Total Income"
          value={`${formatCurrency(totals.totalIncome)} SAR`}
          accent="bg-emerald-950"
        />
        <StatCard
          icon={<TrendingDown className="size-5 text-rose-400" />}
          label="Total Expenses"
          value={`${formatCurrency(totals.totalExpenses)} SAR`}
          accent="bg-rose-950"
        />
        <StatCard
          icon={<Wallet className="size-5 text-amber-400" />}
          label="Net Profit"
          value={`${formatCurrency(totals.netProfit)} SAR`}
          accent="bg-amber-950"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 rounded-lg border border-[#162650] bg-[#0a142f] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-[0.3px] text-slate-300">Recently Updated Workers</h2>
            <Link to="/workers" className="flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300">
              View all <ArrowRight className="size-3" />
            </Link>
          </div>
          <div className="flex flex-col divide-y divide-[#122046]">
            {recentWorkers.map((w) => (
              <Link
                key={w.id}
                to={`/workers/${w.id}`}
                className="flex items-center justify-between py-2.5 text-xs hover:text-amber-300"
              >
                <div>
                  <p className="font-medium text-slate-200">{w.name}</p>
                  <p className="text-[10px] text-slate-500">
                    {w.fileNo} · Updated {w.updatedOn}
                  </p>
                </div>
                <StatusBadge status={w.status} />
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-[#162650] bg-[#0a142f] p-4">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.3px] text-slate-300">Applications Pipeline</h2>
          <div className="flex flex-col gap-2.5">
            {applications.slice(0, 5).map((a) => (
              <div key={a.id} className="flex items-center justify-between text-xs">
                <div>
                  <p className="text-slate-200">{a.applicantName}</p>
                  <p className="text-[10px] text-slate-500">{a.position}</p>
                </div>
                <StatusBadge status={a.status} />
              </div>
            ))}
          </div>
          <Link
            to="/applications"
            className="mt-3 flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300"
          >
            View all applications <ArrowRight className="size-3" />
          </Link>
        </div>
      </div>
    </div>
  )
}
