/*
  What one worker has cost and brought in, across every placement of hers.

  The applicant profile reads the same numbers from her newest request alone,
  which is right when you are looking at her file. A list of a partner office's
  workers is the other case: a worker placed twice has been paid for twice, and
  leaving the earlier placement out would make the office look cheaper than it
  was.
*/

import { requestCost, invoiceTotalPaid } from '../store/useAppStore'
import type { AgentCommission, Invoice, RecruitmentRequest } from '../types'

export interface WorkerMoney {
  /** Placements on file for her. */
  placements: number
  /** Stage costs plus the agent fees booked against those placements. */
  spent: number
  /** What the employer has been billed. */
  invoiced: number
  /** What has actually arrived. */
  collected: number
  /** Billed but not yet paid. */
  outstanding: number
  /** Collected less spent -- the only figure that is profit. */
  net: number
}

export function workerMoney(
  applicantId: string,
  requests: RecruitmentRequest[],
  invoices: Invoice[],
  commissions: AgentCommission[],
): WorkerMoney {
  const mine = requests.filter((r) => r.applicantId === applicantId)
  const ids = new Set(mine.map((r) => r.id))
  const bills = invoices.filter((i) => ids.has(i.recruitmentRequestId))

  const spent = mine.reduce((sum, r) => sum + requestCost(r, commissions), 0)
  const invoiced = bills.reduce((sum, i) => sum + i.servicePrice, 0)
  const collected = bills.reduce((sum, i) => sum + invoiceTotalPaid(i), 0)

  return {
    placements: mine.length,
    spent,
    invoiced,
    collected,
    outstanding: invoiced - collected,
    net: collected - spent,
  }
}

/** The same figures for a whole list of workers. */
export function totalMoney(rows: WorkerMoney[]): WorkerMoney {
  return rows.reduce<WorkerMoney>(
    (sum, row) => ({
      placements: sum.placements + row.placements,
      spent: sum.spent + row.spent,
      invoiced: sum.invoiced + row.invoiced,
      collected: sum.collected + row.collected,
      outstanding: sum.outstanding + row.outstanding,
      net: sum.net + row.net,
    }),
    { placements: 0, spent: 0, invoiced: 0, collected: 0, outstanding: 0, net: 0 },
  )
}
