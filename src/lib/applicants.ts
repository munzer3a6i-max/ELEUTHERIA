/*
  Removing an applicant.

  The database will not delete a worker who has a recruitment request against
  her: `ops.requests.applicant_id` is `on delete restrict`, deliberately, since
  a request carries a stage log, invoices and money. Pressing Delete and being
  quietly refused is the worst version of that rule -- she disappears from the
  screen, comes back on the next load, and stays on the website throughout --
  so the refusal is worked out here, before anything is removed.

  What deletion does take with her are her files. A published photograph and CV
  live in buckets the whole internet can read, and they would otherwise sit
  there at their addresses after the record they belong to is gone.
*/

import { useAppStore } from '../store/useAppStore'
import { removeWorkerCv, removeWorkerPhoto, storageAvailable } from './storage'
import type { Applicant } from '../types'

export type RemoveOutcome =
  | { kind: 'ok' }
  /** She is on a recruitment request; the database will not let her go. */
  | { kind: 'has-requests'; count: number }

/** What stands in the way of deleting her, if anything does. */
export function whyNotDelete(applicantId: string): RemoveOutcome {
  const requests = useAppStore.getState().requests.filter((r) => r.applicantId === applicantId)
  return requests.length > 0 ? { kind: 'has-requests', count: requests.length } : { kind: 'ok' }
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

  useAppStore.getState().deleteApplicant(applicant.id)
  return { kind: 'ok' }
}
