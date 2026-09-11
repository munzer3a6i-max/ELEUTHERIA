import type { StatusDefinition } from '../types'

// The real government/logistics pipeline for each request type. Costs are
// defaults only — every logged status update can override the amount, since
// several steps (passport, medical, ticket) are situational.
export const domesticPipeline: StatusDefinition[] = [
  { id: 'd-1', label: 'Passporting', pipeline: 'Domestic', order: 1, defaultCost: 0, costNote: 'No cost if the applicant already holds a valid passport; otherwise the passport fee applies.', isTerminal: false, isException: false },
  { id: 'd-2', label: 'Ticket to Manila', pipeline: 'Domestic', order: 2, defaultCost: 0, costNote: 'Travel cost to Manila for processing.', isTerminal: false, isException: false },
  { id: 'd-3', label: 'Medical', pipeline: 'Domestic', order: 3, defaultCost: 0, costNote: 'Medical examination fee.', isTerminal: false, isException: false },
  { id: 'd-4', label: 'Vaccine', pipeline: 'Domestic', order: 4, defaultCost: 0, costNote: 'Vaccination fee.', isTerminal: false, isException: false },
  { id: 'd-5', label: 'Selected', pipeline: 'Domestic', order: 5, defaultCost: 500, costNote: 'First down payment to agent ($500), or $150 cash assistance if not placed through an agent.', isTerminal: false, isException: false },
  { id: 'd-6', label: 'Contract', pipeline: 'Domestic', order: 6, defaultCost: 0, costNote: 'Contract signing — no standard fee.', isTerminal: false, isException: false },
  { id: 'd-7', label: 'TESDA', pipeline: 'Domestic', order: 7, defaultCost: 24.01, costNote: 'First-time applicants only ($24.01); not required for ex-abroad workers.', isTerminal: false, isException: false },
  { id: 'd-8', label: 'OWWA', pipeline: 'Domestic', order: 8, defaultCost: 0, costNote: 'First-time applicants only, no cost; not required for ex-abroad workers.', isTerminal: false, isException: false },
  { id: 'd-9', label: 'PDOS', pipeline: 'Domestic', order: 9, defaultCost: 0, costNote: 'Pre-Departure Orientation Seminar.', isTerminal: false, isException: false },
  { id: 'd-10', label: 'ENJAZ', pipeline: 'Domestic', order: 10, defaultCost: 0, costNote: 'Saudi labor contract platform processing.', isTerminal: false, isException: false },
  { id: 'd-11', label: 'Biometric', pipeline: 'Domestic', order: 11, defaultCost: 5, costNote: 'Standard government fee.', isTerminal: false, isException: false },
  { id: 'd-12', label: 'Insurance', pipeline: 'Domestic', order: 12, defaultCost: 38, costNote: 'Standard government fee.', isTerminal: false, isException: false },
  { id: 'd-13', label: 'OEC', pipeline: 'Domestic', order: 13, defaultCost: 38.41, costNote: 'Overseas Employment Certificate fee.', isTerminal: false, isException: false },
  { id: 'd-14', label: 'Visa Stamping', pipeline: 'Domestic', order: 14, defaultCost: 25, costNote: 'Standard government fee.', isTerminal: false, isException: false },
  { id: 'd-15', label: 'Ticket', pipeline: 'Domestic', order: 15, defaultCost: 0, costNote: 'Deployment flight ticket.', isTerminal: false, isException: false },
  { id: 'd-16', label: 'Deployed', pipeline: 'Domestic', order: 16, defaultCost: 500, costNote: 'Second down payment to agent ($500), or $150 cash assistance if not placed through an agent.', isTerminal: false, isException: false },
  { id: 'd-17', label: 'Guarantee Completed', pipeline: 'Domestic', order: 17, defaultCost: 0, costNote: 'Terminal status — guarantee period served in full.', isTerminal: true, isException: false },
  { id: 'd-18', label: 'Repatriated', pipeline: 'Domestic', order: 18, defaultCost: 0, costNote: 'Terminal branch — worker returned before contract end.', isTerminal: true, isException: false },
  { id: 'd-19', label: 'Transfer', pipeline: 'Domestic', order: 19, defaultCost: 0, costNote: 'Terminal branch — worker transferred to a new employer.', isTerminal: true, isException: false },
  { id: 'd-20', label: 'Unfit', pipeline: 'Domestic', order: 0, defaultCost: 0, costNote: 'Exception — can occur at any stage.', isTerminal: true, isException: true },
  { id: 'd-21', label: 'Back Out', pipeline: 'Domestic', order: 0, defaultCost: 0, costNote: 'Exception — can occur at any stage.', isTerminal: true, isException: true },
]

export const professionPipeline: StatusDefinition[] = [
  { id: 'p-1', label: 'Selected', pipeline: 'Profession', order: 1, defaultCost: 0, costNote: 'Cost varies by trade.', isTerminal: false, isException: false },
  { id: 'p-2', label: 'On Medical', pipeline: 'Profession', order: 2, defaultCost: 0, costNote: 'Medical examination fee.', isTerminal: false, isException: false },
  { id: 'p-3', label: 'Vaccine', pipeline: 'Profession', order: 3, defaultCost: 0, costNote: 'Vaccination fee.', isTerminal: false, isException: false },
  { id: 'p-4', label: 'ENJAZ', pipeline: 'Profession', order: 4, defaultCost: 0, costNote: 'Saudi labor contract platform processing.', isTerminal: false, isException: false },
  { id: 'p-5', label: 'Biometric', pipeline: 'Profession', order: 5, defaultCost: 5, costNote: 'Standard government fee.', isTerminal: false, isException: false },
  { id: 'p-6', label: 'TESDA', pipeline: 'Profession', order: 6, defaultCost: 24.01, costNote: 'First-time applicants only; not required for ex-abroad workers.', isTerminal: false, isException: false },
  { id: 'p-7', label: 'SVP', pipeline: 'Profession', order: 7, defaultCost: 0, costNote: 'Skills Verification Program — cost varies by trade.', isTerminal: false, isException: false },
  { id: 'p-8', label: 'Visa Stamping', pipeline: 'Profession', order: 8, defaultCost: 25, costNote: 'Standard government fee.', isTerminal: false, isException: false },
  { id: 'p-9', label: 'Insurance', pipeline: 'Profession', order: 9, defaultCost: 38, costNote: 'Standard government fee.', isTerminal: false, isException: false },
  { id: 'p-10', label: 'OEC', pipeline: 'Profession', order: 10, defaultCost: 38.41, costNote: 'Overseas Employment Certificate fee.', isTerminal: false, isException: false },
  { id: 'p-11', label: 'Ticket', pipeline: 'Profession', order: 11, defaultCost: 0, costNote: 'Deployment flight ticket.', isTerminal: false, isException: false },
  { id: 'p-12', label: 'Deployed', pipeline: 'Profession', order: 12, defaultCost: 0, costNote: 'Deployment — cost varies by arrangement.', isTerminal: false, isException: false },
  { id: 'p-13', label: 'Guarantee Completed', pipeline: 'Profession', order: 13, defaultCost: 0, costNote: 'Terminal status — guarantee period served in full.', isTerminal: true, isException: false },
  { id: 'p-14', label: 'Repatriated', pipeline: 'Profession', order: 14, defaultCost: 0, costNote: 'Terminal branch — worker returned before contract end.', isTerminal: true, isException: false },
  { id: 'p-15', label: 'Transfer', pipeline: 'Profession', order: 15, defaultCost: 0, costNote: 'Terminal branch — worker transferred to a new employer.', isTerminal: true, isException: false },
  { id: 'p-16', label: 'Back Out', pipeline: 'Profession', order: 0, defaultCost: 0, costNote: 'Exception — can occur at any stage.', isTerminal: true, isException: true },
  { id: 'p-17', label: 'Rejected', pipeline: 'Profession', order: 0, defaultCost: 0, costNote: 'Exception — can occur at any stage.', isTerminal: true, isException: true },
]

export const invoiceStatusDefs: StatusDefinition[] = [
  { id: 'i-1', label: 'Issued', pipeline: 'Invoice', order: 1, defaultCost: 0, costNote: '', isTerminal: false, isException: false },
  { id: 'i-2', label: 'Partial Payment', pipeline: 'Invoice', order: 2, defaultCost: 0, costNote: '', isTerminal: false, isException: false },
  { id: 'i-3', label: 'Completed', pipeline: 'Invoice', order: 3, defaultCost: 0, costNote: '', isTerminal: true, isException: false },
]

export const allStatusDefinitions: StatusDefinition[] = [
  ...domesticPipeline,
  ...professionPipeline,
  ...invoiceStatusDefs,
]

export function pipelineForType(type: 'Domestic' | 'Profession'): StatusDefinition[] {
  return type === 'Domestic' ? domesticPipeline : professionPipeline
}

// Ordered walk excluding exception states, used to suggest "next status".
export function nextStatus(type: 'Domestic' | 'Profession', currentLabel: string | null): StatusDefinition | null {
  const pipeline = pipelineForType(type).filter((s) => !s.isException)
  if (!currentLabel) return pipeline[0] ?? null
  const idx = pipeline.findIndex((s) => s.label === currentLabel)
  if (idx === -1 || idx === pipeline.length - 1) return null
  return pipeline[idx + 1]
}
