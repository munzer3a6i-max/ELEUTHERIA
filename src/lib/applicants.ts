/*
  Removing an applicant.

  A worker on a recruitment request used to be refused outright, which was the
  right instinct and the wrong rule. Every placement now opens with the Selected
  stage already logged, and an applicant added with an employer gets her request
  the moment she is saved -- so somebody entered by mistake was unremovable from
  the minute she existed, for the sake of a stage log nobody had typed and money
  nobody had billed.

  What actually must not vanish is money: an invoice, a commission or a partner
  office charge that has been settled, or a backout somebody has filed bills
  against. Those are the record of what happened, and no delete button is worth
  losing them. A placement carrying none of that is just an empty file, and goes
  with her.

  Her files go too. A published photograph and CV live in buckets the whole
  internet can read, and would otherwise sit at their addresses after the record
  they belong to is gone.
*/

import { useAppStore } from '../store/useAppStore'
import { removeWorkerCv, removeWorkerPhoto, storageAvailable } from './storage'
import type { Applicant } from '../types'

/** What is recorded against her that a delete would take with it. */
export type Blocker = 'invoice' | 'commission' | 'charge' | 'backout'

/** What each blocker is called on screen, so both pages say the same thing. */
export const BLOCKER_LABEL = {
  invoice: 'applicant_blocked_invoice',
  commission: 'applicant_blocked_commission',
  charge: 'applicant_blocked_charge',
  backout: 'applicant_blocked_backout',
} as const

export type RemoveOutcome =
  | { kind: 'ok' }
  /** Money is recorded against one of her placements; the record stays. */
  | { kind: 'blocked'; blocker: Blocker; count: number }

export interface DeletePlan {
  /** Placements that would be removed with her. */
  placements: number
  /** What stands in the way, if anything does. */
  blocked: { blocker: Blocker; count: number } | null
}

/**
 * What deleting her would take, and what stops it.
 *
 * Pending agent commissions are not counted: they are derived from the stage
 * log and disappear with the stage that created them, having never been paid.
 */
export function deletePlan(applicantId: string): DeletePlan {
  const state = useAppStore.getState()
  const requests = state.requests.filter((r) => r.applicantId === applicantId)
  const ids = new Set(requests.map((r) => r.id))

  const invoices = state.invoices.filter((i) => ids.has(i.recruitmentRequestId))
  if (invoices.length > 0) {
    return { placements: requests.length, blocked: { blocker: 'invoice', count: invoices.length } }
  }

  const paidCommissions = state.agentCommissions.filter((c) => ids.has(c.requestId) && c.status === 'Paid')
  if (paidCommissions.length > 0) {
    return { placements: requests.length, blocked: { blocker: 'commission', count: paidCommissions.length } }
  }

  const paidCharges = state.agencyCharges.filter((c) => ids.has(c.requestId) && c.status === 'Paid')
  if (paidCharges.length > 0) {
    return { placements: requests.length, blocked: { blocker: 'charge', count: paidCharges.length } }
  }

  const billedBackouts = state.backouts.filter((b) => ids.has(b.requestId) && b.costs.length > 0)
  if (billedBackouts.length > 0) {
    return { placements: requests.length, blocked: { blocker: 'backout', count: billedBackouts.length } }
  }

  return { placements: requests.length, blocked: null }
}

/** What stands in the way of deleting her, if anything does. */
export function whyNotDelete(applicantId: string): RemoveOutcome {
  const plan = deletePlan(applicantId)
  return plan.blocked ? { kind: 'blocked', ...plan.blocked } : { kind: 'ok' }
}

export async function removeApplicant(applicant: Applicant): Promise<RemoveOutcome> {
  const blocked = whyNotDelete(applicant.id)
  if (blocked.kind !== 'ok') return blocked

  // Her files go first. If this fails the record stays, which is the right way
  // round: an orphaned row can be deleted again, an orphaned public file
  // cannot be found again.
  if (storageAvailable()) {
    if (applicant.photoPath) await removeWorkerPhoto(applicant.photoPath)
    if (applicant.cvPath) await removeWorkerCv(applicant.cvPath)
  }

  // Her placements first: the database refuses to let a worker go while one
  // still points at her, and each takes its own stage log with it.
  const store = useAppStore.getState()
  for (const request of store.requests.filter((r) => r.applicantId === applicant.id)) {
    store.deleteRequest(request.id)
  }
  useAppStore.getState().deleteApplicant(applicant.id)
  return { kind: 'ok' }
}
