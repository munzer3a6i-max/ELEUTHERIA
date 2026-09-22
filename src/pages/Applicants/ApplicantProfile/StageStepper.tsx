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
    <div className="flex flex-col items-end gap-3.5 rounded-panel border border-line bg-surface p-[15px]">
      <h2 className="w-full text-[11px] font-semibold text-ink-3">
        {language === 'ar' ? 'مراحل الاستقدام' : 'Recruitment Stages'}
      </h2>

      {exception && (
        <div className="flex w-full items-center gap-2 rounded-control border border-neg/40 bg-neg-soft px-3 py-2 text-[11px] text-neg">
          <AlertTriangle className="size-3.5 shrink-0" />
          {exception.label} · {exception.date}
        </div>
      )}

      <ol className={`w-full border-s border-line pb-2.5 ${compact ? 'max-h-[420px] overflow-y-auto' : ''}`}>
        {steps.map((stage) => (
          <li key={stage.order} className="relative w-full pb-4 ps-6 last:pb-0">
            <span
              className={`absolute -start-[10px] top-0.5 flex size-5 items-center justify-center rounded-pill border ${
                stage.status === 'completed'
                  ? 'border-pos bg-pos-soft'
                  : stage.status === 'current'
                    ? 'border-2 border-info bg-info-soft p-0.5'
                    : 'border-line-strong bg-raised'
              }`}
            >
              {stage.status === 'completed' && <Check className="size-3 text-pos" strokeWidth={3} />}
              {stage.status === 'current' && <span className="size-2 rounded-pill bg-white" />}
            </span>

            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-col gap-0.5">
                <p
                  className={`text-[11px] leading-4 ${
                    stage.status === 'current' ? 'font-bold text-info' : 'text-ink'
                  }`}
                >
                  {stage.order}. {stage.label}
                </p>
                {stage.date && <p className="text-[9px] text-ink-3">{stage.date}</p>}
              </div>
              <span
                className={`shrink-0 whitespace-nowrap rounded-control px-1.5 py-px text-[9px] ${
                  stage.status === 'completed'
                    ? 'border border-pos/40 bg-pos-soft text-pos'
                    : stage.status === 'current'
                      ? 'border border-info/40 bg-info-soft text-info'
                      : 'border border-line-strong bg-raised/80 text-ink-3'
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
        className="w-full rounded-control border border-accent-line bg-accent-soft px-3.5 py-1.5 text-xs font-bold tracking-[0.3px] text-accent-text hover:border-accent-line/70"
      >
        {language === 'ar' ? 'تعديل المراحل' : 'Edit Stages'}
      </button>
    </div>
  )
}
