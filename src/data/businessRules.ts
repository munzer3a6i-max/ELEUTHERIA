/*
  The handful of numbers and stage names the money rules depend on. They sit
  together here because they are policy, not layout: changing the guarantee
  window or the stage that counts as "visa issued" changes what the company
  owes and is owed.
*/

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
 * Paid to a candidate who came to us directly, at selection and again at
 * deployment. An agent's fee replaces it when one introduced her, which is why
 * the pipeline's own note reads "or $150 cash assistance if not placed through
 * an agent".
 */
export const CASH_ASSISTANCE = 150

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
