import { Link } from 'react-router-dom'
import { useAppStore } from '../../store/useAppStore'
import PageHeader from '../../components/PageHeader'

const STAGE_LABELS = [
  'Application Received',
  'Contract Signed',
  'Passport Processing',
  'Medical Examination',
  'Training',
  'DMW Processing',
  'Insurance',
  'Ticket Booking',
  'Deployed',
]

export default function RecruitmentStagesBoard() {
  const workers = useAppStore((s) => s.workers)

  return (
    <div className="flex flex-col gap-4 p-4">
      <PageHeader title="Recruitment Stages" subtitle="Workers grouped by their current pipeline stage" />

      <div className="flex gap-3 overflow-x-auto pb-2">
        {STAGE_LABELS.map((label, i) => {
          const order = i + 1
          const atStage = workers.filter((w) => w.stages.some((s) => s.order === order && s.status === 'current'))
          const deployed = order === 9 ? workers.filter((w) => w.status === 'Deployed') : []
          const list = order === 9 ? deployed : atStage

          return (
            <div key={label} className="w-56 shrink-0 rounded-lg border border-[#162650] bg-[#0a142f] p-3">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-[11px] font-bold text-slate-300">
                  {order}. {label}
                </h2>
                <span className="rounded-full bg-[#192b59] px-1.5 py-0.5 text-[10px] font-bold text-amber-400">
                  {list.length}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {list.map((w) => (
                  <Link
                    key={w.id}
                    to={`/workers/${w.id}`}
                    className="block rounded border border-[#122046] bg-[#0d1838] px-2.5 py-2 text-[11px] text-slate-200 hover:border-amber-500/40"
                  >
                    {w.name}
                    <p className="text-[10px] text-slate-500">{w.fileNo}</p>
                  </Link>
                ))}
                {list.length === 0 && <p className="text-[10px] text-slate-600">No workers at this stage.</p>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
