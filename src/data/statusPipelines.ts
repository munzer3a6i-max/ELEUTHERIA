import { useAppStore } from '../store/useAppStore'
import { allStatusDefinitions } from './stageSeeds'
import type { RecruitmentRequest, StatusDefinition } from '../types'

export { domesticPipeline, professionPipeline, invoiceStatusDefs, allStatusDefinitions } from './stageSeeds'

/**
 * The stages of a pipeline, as the office has them now.
 *
 * The arrays in stageSeeds are the pipelines we ship with; the live ones are
 * kept in
 * the store, where a super administrator can add a stage, reword one or take
 * one out. Pass them in wherever the screen should follow an edit as it is
 * made; left out, the stored list is read directly, which is what the helpers
 * called outside React do.
 */
export function pipelineForType(
  type: 'Domestic' | 'Profession',
  definitions?: StatusDefinition[],
): StatusDefinition[] {
  const all = definitions ?? storedDefinitions()
  return all
    .filter((s) => s.pipeline === type)
    // In the order they happen, with the exceptions -- which carry no place in
    // the walk -- after the ones that do.
    .sort((a, b) => Number(a.isException) - Number(b.isException) || a.order - b.order)
}

/** Reads the store lazily, so this module can be imported before it exists. */
function storedDefinitions(): StatusDefinition[] {
  const stored = useAppStore.getState().statusDefinitions
  return stored.length > 0 ? stored : allStatusDefinitions
}

/**
 * Her placements that are still running: nothing logged yet, or a latest stage
 * that does not end the placement. A worker on one of these is spoken for --
 * she cannot be put on a second -- and a worker whose last placement ended
 * (repatriated, transferred, guarantee served, backed out) can be placed again
 * whatever her status field happens to say.
 */
export function openPlacements(
  applicantId: string,
  requests: RecruitmentRequest[],
  definitions?: StatusDefinition[],
): RecruitmentRequest[] {
  return requests.filter((request) => {
    if (request.applicantId !== applicantId) return false
    const last = request.statusHistory[request.statusHistory.length - 1]
    if (!last) return true
    const stage = pipelineForType(request.type, definitions).find((d) => d.label === last.status)
    return !stage?.isTerminal
  })
}

// Ordered walk excluding exception states, used to suggest "next status".
export function nextStatus(
  type: 'Domestic' | 'Profession',
  currentLabel: string | null,
  definitions?: StatusDefinition[],
): StatusDefinition | null {
  const pipeline = pipelineForType(type, definitions).filter((s) => !s.isException)
  if (!currentLabel) return pipeline[0] ?? null
  const idx = pipeline.findIndex((s) => s.label === currentLabel)
  if (idx === -1 || idx === pipeline.length - 1) return null
  return pipeline[idx + 1]
}

export interface StageProgressItem {
  order: number
  label: string
  date: string | null
  status: 'completed' | 'current' | 'pending'
}

interface HistoryLike {
  status: string
  date: string
}

// Maps a request's logged status-history onto the full ordered pipeline, so
// the stepper can show every possible step (not just the ones logged so far)
// with completed / current / pending state. A trailing exception (Unfit,
// Back Out, Rejected) is reported separately since it isn't part of the
// ordered walk.
export function computeStageProgress(
  type: 'Domestic' | 'Profession',
  history: HistoryLike[],
  definitions?: StatusDefinition[],
): { steps: StageProgressItem[]; exception: { label: string; date: string } | null } {
  const pipeline = pipelineForType(type, definitions)
    .filter((s) => !s.isException)
    .sort((a, b) => a.order - b.order)

  const lastDateByLabel = new Map<string, string>()
  for (const h of history) lastDateByLabel.set(h.status, h.date)

  let maxLoggedOrder = 0
  for (const step of pipeline) {
    if (lastDateByLabel.has(step.label)) maxLoggedOrder = Math.max(maxLoggedOrder, step.order)
  }
  const effectiveCurrent = maxLoggedOrder === 0 ? (pipeline[0]?.order ?? 0) : maxLoggedOrder

  const steps: StageProgressItem[] = pipeline.map((step) => ({
    order: step.order,
    label: step.label,
    date: lastDateByLabel.get(step.label) ?? null,
    status: step.order < effectiveCurrent ? 'completed' : step.order === effectiveCurrent ? 'current' : 'pending',
  }))

  const lastEntry = history[history.length - 1]
  const exceptionDef = lastEntry
    ? pipelineForType(type, definitions).find((s) => s.isException && s.label === lastEntry.status)
    : undefined

  return { steps, exception: exceptionDef ? { label: lastEntry.status, date: lastEntry.date } : null }
}
