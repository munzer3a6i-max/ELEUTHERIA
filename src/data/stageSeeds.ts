import type { StatusDefinition } from '../types'

// The ids are fixed uuids rather than the short codes they used to be, because
// they are written to the database as the office's starting pipeline and that
// column is a uuid: "d-5" was refused as not one, which held up every save
// queued behind it. Each is derived from its old code, so the same stage gets
// the same id on every machine and two people seeding at once write one set.
// The real government/logistics pipeline for each request type.
//
// Selected comes first on both. Opening a recruitment request is the office
// saying this candidate has been chosen for this employer -- there is nothing
// to passport or medically clear before that decision -- so the request is
// opened with the stage already logged rather than waiting for somebody to
// add it afterwards.
//
// A default cost is filled in only where the amount genuinely does not move:
// ENJAZ, TESDA, insurance. Everything else is left at nothing and typed when
// the step is logged, because a figure that looks official and is out of date
// is worse than an empty box -- the OEC fee rises month to month, the agent's
// down payments are whatever that agent is on, and the government's own fees
// are not the same twice. The cost note on each step says which it is.
export const domesticPipeline: StatusDefinition[] = [
  { id: '78922172-0462-54b0-8240-7a9d7d4a8c77', label: 'Selected', pipeline: 'Domestic', order: 1, defaultCost: 0, costNote: 'First down payment to the agent — typed each time, since every agent is on a different commission. $150 cash assistance if no agent introduced her.', isTerminal: false, isException: false },
  { id: '74eac85a-823d-5899-a6b0-2c9fa1179292', label: 'Passporting', pipeline: 'Domestic', order: 2, defaultCost: 0, costNote: 'No cost if the applicant already holds a valid passport; otherwise the passport fee applies.', isTerminal: false, isException: false },
  { id: '3f095b9e-bdb2-59d4-88df-bdfb8030ee58', label: 'Ticket to Manila', pipeline: 'Domestic', order: 3, defaultCost: 0, costNote: 'Travel cost to Manila for processing.', isTerminal: false, isException: false },
  { id: 'd27a402c-b08c-514d-a3fd-aa7a39cc77b8', label: 'Medical', pipeline: 'Domestic', order: 4, defaultCost: 0, costNote: 'Medical examination fee.', isTerminal: false, isException: false },
  { id: 'c248fc53-b661-58d2-813d-b1c991190d54', label: 'Vaccine', pipeline: 'Domestic', order: 5, defaultCost: 0, costNote: 'Vaccination fee.', isTerminal: false, isException: false },
  { id: '50f0a039-ae8c-53ff-8189-cba6c2232cf8', label: 'Contract', pipeline: 'Domestic', order: 6, defaultCost: 0, costNote: 'Contract signing - no standard fee.', isTerminal: false, isException: false },
  { id: '39feedda-3cec-5e2d-8c3a-010ccc89ad39', label: 'TESDA', pipeline: 'Domestic', order: 7, defaultCost: 24.01, costNote: 'First-time applicants only ($24.01); not required for ex-abroad workers.', isTerminal: false, isException: false },
  { id: 'fb589fe0-1427-59e3-ae96-2999ddc305ff', label: 'OWWA', pipeline: 'Domestic', order: 8, defaultCost: 0, costNote: 'First-time applicants only, no cost; not required for ex-abroad workers.', isTerminal: false, isException: false },
  { id: '1349a7c2-6fcc-5a4f-86c7-f964dab0a980', label: 'PDOS', pipeline: 'Domestic', order: 9, defaultCost: 0, costNote: 'Pre-Departure Orientation Seminar.', isTerminal: false, isException: false },
  { id: '42716a28-b610-52de-895d-6008b58695e6', label: 'ENJAZ', pipeline: 'Domestic', order: 10, defaultCost: 21, costNote: 'Saudi labour contract platform. Fixed at $21.', isTerminal: false, isException: false },
  { id: 'f3415b71-9184-5f29-8601-efa69cb1ef77', label: 'Biometric', pipeline: 'Domestic', order: 11, defaultCost: 0, costNote: 'Government fee — typed each time, since it is not the same amount every time.', isTerminal: false, isException: false },
  { id: '13a68bfc-9665-5d06-9c4b-d7016d6308be', label: 'Insurance', pipeline: 'Domestic', order: 12, defaultCost: 38, costNote: 'Standard government fee.', isTerminal: false, isException: false },
  { id: 'aed327cc-2ed8-5523-a1b5-e293ec3419ff', label: 'OEC', pipeline: 'Domestic', order: 13, defaultCost: 0, costNote: 'Overseas Employment Certificate — typed each time, since the fee goes up month to month.', isTerminal: false, isException: false },
  { id: 'e65c39bc-ca6f-5fdf-b58d-e46231e55923', label: 'Visa Stamping', pipeline: 'Domestic', order: 14, defaultCost: 0, costNote: 'Typed each time, since it is not the same amount every time.', isTerminal: false, isException: false },
  { id: 'ed40b4a7-dcdc-53ba-a57c-28ceefbb9aab', label: 'Ticket', pipeline: 'Domestic', order: 15, defaultCost: 0, costNote: 'Deployment flight ticket.', isTerminal: false, isException: false },
  { id: '54d58c93-b40b-5803-837f-1882d1101a73', label: 'Deployed', pipeline: 'Domestic', order: 16, defaultCost: 0, costNote: 'Second down payment to the agent — typed each time, since every agent is on a different commission. $150 cash assistance if no agent introduced her.', isTerminal: false, isException: false },
  { id: '1b6e26fb-b42b-5efe-a000-8e4710055c3b', label: 'Guarantee Completed', pipeline: 'Domestic', order: 17, defaultCost: 0, costNote: 'Terminal status - guarantee period served in full.', isTerminal: true, isException: false },
  { id: '62d2365e-47d5-55f0-a515-e1ace053bcbe', label: 'Repatriated', pipeline: 'Domestic', order: 18, defaultCost: 0, costNote: 'Terminal branch - worker returned before contract end.', isTerminal: true, isException: false },
  { id: 'e8cd4dce-92b9-5e7a-8092-1c46dd16da9f', label: 'Transfer', pipeline: 'Domestic', order: 19, defaultCost: 0, costNote: 'Terminal branch - worker transferred to a new employer.', isTerminal: true, isException: false },
  { id: '08a8eeb0-3647-532d-b98e-d8417d9b5969', label: 'Unfit', pipeline: 'Domestic', order: 0, defaultCost: 0, costNote: 'Exception - can occur at any stage.', isTerminal: true, isException: true },
  { id: '13633bc4-dec6-53ce-abe3-db6344952281', label: 'Back Out', pipeline: 'Domestic', order: 0, defaultCost: 0, costNote: 'Exception - can occur at any stage.', isTerminal: true, isException: true },
]

export const professionPipeline: StatusDefinition[] = [
  { id: 'a825f47e-16df-50df-ac92-cb5f29e5c837', label: 'Selected', pipeline: 'Profession', order: 1, defaultCost: 0, costNote: 'Cost varies by trade.', isTerminal: false, isException: false },
  { id: '25bc2b65-c795-52ac-ad4f-ac7dcdd3228c', label: 'On Medical', pipeline: 'Profession', order: 2, defaultCost: 0, costNote: 'Medical examination fee.', isTerminal: false, isException: false },
  { id: '15932f54-848a-50dc-a584-08d7f1998f46', label: 'Vaccine', pipeline: 'Profession', order: 3, defaultCost: 0, costNote: 'Vaccination fee.', isTerminal: false, isException: false },
  { id: '0c3231d3-09f4-5abf-8772-f91ec6c4f5a3', label: 'ENJAZ', pipeline: 'Profession', order: 4, defaultCost: 21, costNote: 'Saudi labour contract platform. Fixed at $21.', isTerminal: false, isException: false },
  { id: 'fba2cacd-225d-519d-967b-96bd375ad794', label: 'Biometric', pipeline: 'Profession', order: 5, defaultCost: 0, costNote: 'Government fee — typed each time, since it is not the same amount every time.', isTerminal: false, isException: false },
  { id: '2b7c76ec-eb42-53f8-b9d9-a75ebf1bfe73', label: 'TESDA', pipeline: 'Profession', order: 6, defaultCost: 24.01, costNote: 'First-time applicants only; not required for ex-abroad workers.', isTerminal: false, isException: false },
  { id: '0bff22e4-799e-5206-acb1-aba16201685a', label: 'SVP', pipeline: 'Profession', order: 7, defaultCost: 0, costNote: 'Skills Verification Program - cost varies by trade.', isTerminal: false, isException: false },
  { id: '18938021-c636-5f68-b0be-2a55916f4e0f', label: 'Visa Stamping', pipeline: 'Profession', order: 8, defaultCost: 0, costNote: 'Typed each time, since it is not the same amount every time.', isTerminal: false, isException: false },
  { id: '8c228b6d-f16f-5f78-a9f5-73e7d6f0360b', label: 'Insurance', pipeline: 'Profession', order: 9, defaultCost: 38, costNote: 'Standard government fee.', isTerminal: false, isException: false },
  { id: '9049db43-32c3-5c61-86aa-f7a7ac31f741', label: 'OEC', pipeline: 'Profession', order: 10, defaultCost: 0, costNote: 'Overseas Employment Certificate — typed each time, since the fee goes up month to month.', isTerminal: false, isException: false },
  { id: 'ba23ca5d-49a0-50f3-b131-1e7bbc66451d', label: 'Ticket', pipeline: 'Profession', order: 11, defaultCost: 0, costNote: 'Deployment flight ticket.', isTerminal: false, isException: false },
  { id: 'b32c2e16-a37a-574b-8c53-e1b391bf4b9e', label: 'Deployed', pipeline: 'Profession', order: 12, defaultCost: 0, costNote: 'Deployment - cost varies by arrangement.', isTerminal: false, isException: false },
  { id: '0034e3e2-0ce2-5741-8da9-d2c27ccd23e6', label: 'Guarantee Completed', pipeline: 'Profession', order: 13, defaultCost: 0, costNote: 'Terminal status - guarantee period served in full.', isTerminal: true, isException: false },
  { id: '6c97f37b-f9f4-5496-a7ea-bb26ea192a55', label: 'Repatriated', pipeline: 'Profession', order: 14, defaultCost: 0, costNote: 'Terminal branch - worker returned before contract end.', isTerminal: true, isException: false },
  { id: 'c407bb48-6f55-5e69-a6a3-ed6e2d84d7dc', label: 'Transfer', pipeline: 'Profession', order: 15, defaultCost: 0, costNote: 'Terminal branch - worker transferred to a new employer.', isTerminal: true, isException: false },
  { id: 'fd16116f-d42b-5764-8e80-c92123395a7a', label: 'Back Out', pipeline: 'Profession', order: 0, defaultCost: 0, costNote: 'Exception - can occur at any stage.', isTerminal: true, isException: true },
  { id: 'bcbc334f-b18c-550f-964c-5af9e372bd8d', label: 'Rejected', pipeline: 'Profession', order: 0, defaultCost: 0, costNote: 'Exception - can occur at any stage.', isTerminal: true, isException: true },
]

export const invoiceStatusDefs: StatusDefinition[] = [
  { id: 'b9c7b592-9e22-58a7-b1db-1f4ea2ad7ae9', label: 'Issued', pipeline: 'Invoice', order: 1, defaultCost: 0, costNote: '', isTerminal: false, isException: false },
  { id: 'ab9d1bce-86cd-51dd-b1a1-65ee766e4376', label: 'Partial Payment', pipeline: 'Invoice', order: 2, defaultCost: 0, costNote: '', isTerminal: false, isException: false },
  { id: '95479bd2-73ad-5ae2-b455-b3556263dd03', label: 'Completed', pipeline: 'Invoice', order: 3, defaultCost: 0, costNote: '', isTerminal: true, isException: false },
]

export const allStatusDefinitions: StatusDefinition[] = [
  ...domesticPipeline,
  ...professionPipeline,
  ...invoiceStatusDefs,
]
