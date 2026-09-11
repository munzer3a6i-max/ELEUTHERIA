import { useState } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { PrimaryButton } from '../../components/form'
import type { RecruitmentStage, StageStatus, Worker } from '../../types'

const STATUS_OPTIONS: StageStatus[] = ['pending', 'current', 'completed']

export default function StagesEditorTab({ worker }: { worker: Worker }) {
  const replaceStages = useAppStore((s) => s.replaceStages)
  const [stages, setStages] = useState<RecruitmentStage[]>(worker.stages)
  const [saved, setSaved] = useState(false)

  function updateStage(order: number, patch: Partial<RecruitmentStage>) {
    setStages((prev) => prev.map((s) => (s.order === order ? { ...s, ...patch } : s)))
    setSaved(false)
  }

  function handleSave() {
    replaceStages(worker.id, stages)
    setSaved(true)
  }

  return (
    <div className="rounded-lg border border-[#162650] bg-[#0a142f] p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-[0.3px] text-slate-200">Recruitment Stages</h2>
        <div className="flex items-center gap-3">
          {saved && <span className="text-[11px] text-emerald-400">Saved.</span>}
          <PrimaryButton onClick={handleSave}>Save Changes</PrimaryButton>
        </div>
      </div>

      <div className="overflow-hidden rounded border border-[#122046]">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[#14234b] text-[10.5px] font-bold uppercase text-slate-400">
              <th className="px-3 py-2.5">#</th>
              <th className="px-3 py-2.5">Stage</th>
              <th className="px-3 py-2.5">Status</th>
              <th className="px-3 py-2.5">Date</th>
            </tr>
          </thead>
          <tbody>
            {stages.map((stage) => (
              <tr key={stage.order} className="border-b border-[#122046] text-xs last:border-b-0">
                <td className="px-3 py-2.5 text-slate-400">{stage.order}</td>
                <td className="px-3 py-2.5 text-slate-200">{stage.label}</td>
                <td className="px-3 py-2.5">
                  <select
                    value={stage.status}
                    onChange={(e) => updateStage(stage.order, { status: e.target.value as StageStatus })}
                    className="rounded border border-[#1b2b54] bg-[#0d1836] px-2 py-1 text-[11px] text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500/60"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s[0].toUpperCase() + s.slice(1)}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2.5">
                  <input
                    type="date"
                    value={stage.date ?? ''}
                    onChange={(e) => updateStage(stage.order, { date: e.target.value || null })}
                    className="rounded border border-[#1b2b54] bg-[#0d1836] px-2 py-1 text-[11px] text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500/60"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
