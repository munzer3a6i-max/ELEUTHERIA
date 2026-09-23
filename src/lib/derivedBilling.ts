/*
  Milestones create money.

  An agent earns half their fee when the candidate they introduced is selected
  and the other half when she is deployed. A partner office owes half its
  contract price when the worker is selected and the other half when her visa
  is issued. Neither is typed in by hand: both are derived from the request's
  own status history, so a commission or a charge can never exist for a stage
  that has not happened, and logging a stage cannot be forgotten in the books.

  The sync is idempotent. Records are matched by request and milestone rather
  than by id, so re-running it after any edit leaves settled rows untouched,
  refreshes the amounts of unsettled ones, and removes only what the history no
  longer supports — and never something already paid. The ids themselves are
  plain uuids, because that is what the database's columns hold.
*/

import {
  BACKOUT_STAGE,
  DEPLOYMENT_STAGE,
  SELECTION_STAGE,
  VISA_ISSUED_STAGE,
  liabilityFor,
} from '../data/businessRules'
import type {
  Agent,
  AgencyCharge,
  AgencyContract,
  AgentCommission,
  Applicant,
  Backout,
  RecruitmentRequest,
} from '../types'

interface BillingInput {
  requests: RecruitmentRequest[]
  applicants: Applicant[]
  agents: Agent[]
  agencyContracts: AgencyContract[]
  agentCommissions: AgentCommission[]
  agencyCharges: AgencyCharge[]
  backouts: Backout[]
}

interface BillingOutput {
  agentCommissions: AgentCommission[]
  agencyCharges: AgencyCharge[]
  backouts: Backout[]
}

/** The date a request last reached a stage, or null if it never did. */
function stageDate(request: RecruitmentRequest, label: string): string | null {
  let found: string | null = null
  for (const entry of request.statusHistory) {
    if (entry.status === label) found = entry.date
  }
  return found
}

/**
 * The contract that governs a placement: the agency's active one, or the most
 * recently signed if none is active. Without a contract there is nothing to
 * bill, which is the point — domestic workers only come through an agency that
 * has one.
 */
export function contractForAgency(contracts: AgencyContract[], agencyId: string): AgencyContract | null {
  const mine = contracts
    .filter((c) => c.agencyId === agencyId)
    .sort((a, b) => (a.signedOn < b.signedOn ? 1 : -1))
  return mine.find((c) => c.status === 'Active') ?? mine[0] ?? null
}

export function syncDerivedBilling(input: BillingInput): BillingOutput {
  const applicantById = new Map(input.applicants.map((a) => [a.id, a]))
  const agentById = new Map(input.agents.map((a) => [a.id, a]))

  const commissionByKey = new Map(input.agentCommissions.map((c) => [`${c.requestId}|${c.milestone}`, c]))
  const chargeByKey = new Map(input.agencyCharges.map((c) => [`${c.requestId}|${c.milestone}`, c]))
  const backoutByRequest = new Map(input.backouts.map((b) => [b.requestId, b]))

  const commissions: AgentCommission[] = []
  const charges: AgencyCharge[] = []
  const backouts: Backout[] = []
  const keptCommissions = new Set<string>()
  const keptCharges = new Set<string>()
  const keptBackouts = new Set<string>()

  for (const request of input.requests) {
    const applicant = applicantById.get(request.applicantId)
    if (!applicant) continue

    // --- the agent's two halves -------------------------------------------
    const agent = applicant.agentId ? agentById.get(applicant.agentId) : undefined
    if (agent) {
      const milestones = [
        { milestone: 'Selected' as const, stage: SELECTION_STAGE, fee: agent.selectionFee },
        { milestone: 'Deployed' as const, stage: DEPLOYMENT_STAGE, fee: agent.deploymentFee },
      ]
      for (const { milestone, stage, fee } of milestones) {
        const date = stageDate(request, stage)
        if (!date) continue
        const key = `${request.id}|${milestone}`
        keptCommissions.add(key)
        const existing = commissionByKey.get(key)
        if (existing) {
          // A paid commission is a fact: only the unsettled ones follow the
          // current fee and date.
          commissions.push(
            existing.status === 'Paid'
              ? existing
              : { ...existing, agentId: agent.id, applicantId: applicant.id, amount: fee, earnedOn: date },
          )
        } else {
          commissions.push({
            id: crypto.randomUUID(),
            agentId: agent.id,
            applicantId: applicant.id,
            requestId: request.id,
            milestone,
            amount: fee,
            earnedOn: date,
            status: 'Pending',
            paidOn: null,
            paymentSourceId: null,
          })
        }
      }
    }

    // --- the partner office's two halves -----------------------------------
    const contract = request.recruitmentAgencyId
      ? contractForAgency(input.agencyContracts, request.recruitmentAgencyId)
      : null
    if (contract) {
      const half = contract.pricePerWorker / 2
      const milestones = [
        { milestone: 'Selected' as const, stage: SELECTION_STAGE },
        { milestone: 'Visa Issued' as const, stage: VISA_ISSUED_STAGE },
      ]
      for (const { milestone, stage } of milestones) {
        const date = stageDate(request, stage)
        if (!date) continue
        const key = `${request.id}|${milestone}`
        keptCharges.add(key)
        const existing = chargeByKey.get(key)
        if (existing) {
          charges.push(
            existing.status === 'Paid'
              ? existing
              : {
                  ...existing,
                  agencyId: contract.agencyId,
                  contractId: contract.id,
                  applicantId: applicant.id,
                  amount: half,
                  dueOn: date,
                },
          )
        } else {
          charges.push({
            id: crypto.randomUUID(),
            agencyId: contract.agencyId,
            contractId: contract.id,
            applicantId: applicant.id,
            requestId: request.id,
            milestone,
            amount: half,
            dueOn: date,
            status: 'Pending',
            settledOn: null,
            paymentSourceId: null,
          })
        }
      }
    }

    // --- a worker who pulled out --------------------------------------------
    // Usually after deployment, but she can also walk away mid-pipeline, and
    // the money already spent on her is just as real either way.
    const backedOutOn = stageDate(request, BACKOUT_STAGE)
    const deployedOnRaw = stageDate(request, DEPLOYMENT_STAGE)
    const deployedOn = deployedOnRaw && backedOutOn && backedOutOn >= deployedOnRaw ? deployedOnRaw : null
    const existingBackout = backoutByRequest.get(request.id)
    if (backedOutOn) {
      keptBackouts.add(request.id)
      if (existingBackout) {
        // Dates follow the history; everything the office typed in stays.
        backouts.push({
          ...existingBackout,
          applicantId: applicant.id,
          deployedOn,
          returnedOn: backedOutOn,
          liability:
            existingBackout.liability === 'Agency'
              ? 'Agency'
              : liabilityFor(deployedOn, backedOutOn),
        })
      } else {
        backouts.push({
          id: crypto.randomUUID(),
          requestId: request.id,
          applicantId: applicant.id,
          deployedOn,
          returnedOn: backedOutOn,
          reason: '',
          liability: liabilityFor(deployedOn, backedOutOn),
          notes: '',
          costs: [],
          createdOn: backedOutOn,
        })
      }
    }
  }

  // Rows the history no longer supports go, unless money already moved.
  for (const commission of input.agentCommissions) {
    const key = `${commission.requestId}|${commission.milestone}`
    if (!keptCommissions.has(key) && commission.status === 'Paid') commissions.push(commission)
  }
  for (const charge of input.agencyCharges) {
    const key = `${charge.requestId}|${charge.milestone}`
    if (!keptCharges.has(key) && charge.status === 'Paid') charges.push(charge)
  }
  for (const backout of input.backouts) {
    if (!keptBackouts.has(backout.requestId) && backout.costs.length > 0) backouts.push(backout)
  }

  const newestFirst = (a: string, b: string) => (a < b ? 1 : a > b ? -1 : 0)

  return {
    agentCommissions: commissions.sort((a, b) => newestFirst(a.earnedOn, b.earnedOn)),
    agencyCharges: charges.sort((a, b) => newestFirst(a.dueOn, b.dueOn)),
    backouts: backouts.sort((a, b) => newestFirst(a.returnedOn, b.returnedOn)),
  }
}

/** Total of a backout's bills, optionally only the unsettled ones. */
export function backoutTotal(backout: Backout, only?: 'Pending' | 'Paid'): number {
  return backout.costs
    .filter((cost) => !only || cost.status === only)
    .reduce((sum, cost) => sum + cost.amount, 0)
}
