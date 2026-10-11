/*
  The handful of numbers and stage names the money rules depend on. They sit
  together here because they are policy, not layout: changing the guarantee
  window or the stage that counts as "visa issued" changes what the company
  owes and is owed.
*/

import type { ApplicantStatus } from '../types'

/** A worker who leaves before this many months is brought home at our expense. */
export const GUARANTEE_MONTHS = 3

/** Reaching this stage bills the partner agency the second half of its fee. */
export const VISA_ISSUED_STAGE = 'Visa Stamping'

/** Stages that earn an introducing agent their fee. */
export const SELECTION_STAGE = 'Selected'
export const DEPLOYMENT_STAGE = 'Deployed'

/** Logging this stage opens a backout, and marks the worker as one. */
export const BACKOUT_STAGE = 'Back Out'

/**
 * The status her own record should carry, given what her placement has
 * reached. Null means the stage log has nothing to say about it, and her
 * status stays whatever the office set.
 *
 * This is what keeps the website honest. The published view shows only
 * workers who are still Available, so a worker whose status never moved went
 * on advertising herself after she had been selected and after she had flown.
 * The stage log already knew; her record did not.
 *
 * It only ever moves her forward. Removing a stage does not quietly undo a
 * status somebody may have set deliberately -- that is a decision, and it is
 * made on her profile.
 */
export function statusFromStages(history: { status: string }[]): ApplicantStatus | null {
  const reached = new Set(history.map((entry) => entry.status))
  if (reached.has(BACKOUT_STAGE)) return 'Back Out'
  if (reached.has(DEPLOYMENT_STAGE)) return 'Deployed'
  if (reached.has(SELECTION_STAGE)) return 'Selected'
  return null
}

/** True when the second status is further along than the first. */
export function movesForward(from: ApplicantStatus, to: ApplicantStatus): boolean {
  const order: ApplicantStatus[] = ['Available', 'Unavailable', 'Selected', 'Deployed', 'Back Out']
  return order.indexOf(to) > order.indexOf(from)
}

/**
 * Paid to a candidate who came to us directly, at selection and again at
 * deployment. An agent's fee replaces it when one introduced her, which is why
 * the pipeline's own note reads "or $150 cash assistance if not placed through
 * an agent".
 */
export const CASH_ASSISTANCE = 150

/**
 * What a milestone stage costs the office. An agent's fee at selection or
 * deployment is booked as that agent's commission, so the stage itself stays
 * at nothing and the money is counted once. A candidate who came to us
 * directly has no agent to pay, and is given cash assistance at the same two
 * points instead. Null means this is an ordinary stage, priced by the pipeline.
 *
 * Both the stage form and the store that opens a request with Selected already
 * logged ask this, so a placement is costed the same either way.
 */
export function milestoneCost(label: string, hasAgent: boolean): number | null {
  if (label !== SELECTION_STAGE && label !== DEPLOYMENT_STAGE) return null
  return hasAgent ? 0 : CASH_ASSISTANCE
}

/** Months between two dates, used to decide who carries a backout. */
export function monthsBetween(from: string, to: string): number {
  const start = new Date(from)
  const end = new Date(to)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0
  const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())
  return end.getDate() < start.getDate() ? Math.max(0, months - 1) : Math.max(0, months)
}

/**
 * Inside the guarantee window the company carries the return. A worker who
 * backed out before deployment never reached an employer, so whatever was
 * spent on her is ours too.
 */
export function liabilityFor(deployedOn: string | null, returnedOn: string): 'Company' | 'Employer' {
  if (!deployedOn) return 'Company'
  return monthsBetween(deployedOn, returnedOn) < GUARANTEE_MONTHS ? 'Company' : 'Employer'
}
