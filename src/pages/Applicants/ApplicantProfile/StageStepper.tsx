import { Check, AlertTriangle } from 'lucide-react'
import { computeStageProgress } from '../../../data/statusPipelines'
import { useTranslation } from '../../../i18n/useTranslation'
import type { RecruitmentRequest, RequestType } from '../../../types'

export default function StageStepper({
  requestType,
  request,
  onEditStages,
  compact = true,
}: {
  requestType: RequestType
  request: RecruitmentRequest | null
  onEditStages: () => void
  compact?: boolean
}) {
  const { language } = useTranslation()
  const { steps, exception } = computeStageProgress(requestType, request?.statusHistory ?? [])

  return (
    <div className="flex flex-col items-end gap-3.5 rounded-lg border border-[var(--edge)] bg-[var(--surface)] p-[15px]">
      <h2 className="w-full text-[11px] font-bold uppercase tracking-[0.55px] text-[var(--text-secondary)]">
        {language === 'ar' ? 'مراحل الاستقدام' : 'Recruitment Stages'}
      </h2>

      {exception && (
        <div className="flex w-full items-center gap-2 rounded border border-rose-800 bg-rose-950/60 px-3 py-2 text-[11px] text-rose-300">
          <AlertTriangle className="size-3.5 shrink-0" />
          {exception.label} · {exception.date}
        </div>
      )}

      <ol className={`w-full border-s border-slate-600/60 pb-2.5 ${compact ? 'max-h-[420px] overflow-y-auto' : ''}`}>
        {steps.map((stage) => (
          <li key={stage.order} className="relative w-full pb-4 ps-6 last:pb-0">
            <span
              className={`absolute -start-[10px] top-0.5 flex size-5 items-center justify-center rounded-full border ${
                stage.status === 'completed'
                  ? 'border-emerald-500 bg-emerald-950'
                  : stage.status === 'current'
                    ? 'border-2 border-white bg-blue-600 p-0.5'
                    : 'border-slate-600 bg-slate-800'
              }`}
            >
              {stage.status === 'completed' && <Check className="size-3 text-emerald-400" strokeWidth={3} />}
              {stage.status === 'current' && <span className="size-2 rounded-full bg-white" />}
            </span>

            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-col gap-0.5">
                <p
                  className={`text-[11px] leading-4 ${
                    stage.status === 'current' ? 'font-bold text-blue-400' : 'text-[var(--text-primary)]'
                  }`}
                >
                  {stage.order}. {stage.label}
                </p>
                {stage.date && <p className="text-[9px] text-[var(--text-muted)]">{stage.date}</p>}
              </div>
              <span
                className={`shrink-0 whitespace-nowrap rounded px-1.5 py-px text-[9px] ${
                  stage.status === 'completed'
                    ? 'border border-emerald-800 bg-emerald-950 text-emerald-400'
                    : stage.status === 'current'
                      ? 'border border-blue-600 bg-blue-900/80 text-blue-300'
                      : 'border border-slate-700 bg-slate-800/80 text-slate-400'
                }`}
              >
                {stage.status === 'completed' ? 'Completed' : stage.status === 'current' ? 'Current' : 'Pending'}
              </span>
            </div>
          </li>
        ))}
      </ol>

      <button
        type="button"
        onClick={onEditStages}
        className="w-full rounded border border-amber-500/40 bg-[var(--active)] px-3.5 py-1.5 text-xs font-bold tracking-[0.3px] text-amber-400 hover:border-amber-500/70"
      >
        {language === 'ar' ? 'تعديل المراحل' : 'Edit Stages'}
      </button>
    </div>
  )
}
