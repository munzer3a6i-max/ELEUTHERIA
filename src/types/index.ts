export interface Bilingual {
  en: string
  ar: string
}

export type Language = 'en' | 'ar'
export type Theme = 'dark' | 'light'

/**
 * What a member of staff may do. `accountant` changes the money and reads the
 * rest; `data_entry` works the caseload and never sees the finance pages.
 */
export type StaffRole = 'admin' | 'accountant' | 'data_entry'
export type StaffStatus = 'Active' | 'Inactive' | 'Suspended'

/**
 * What is kept instead of the password itself: a per-account salt and the
 * SHA-256 of salt and password together. `temporary` marks one nobody chose --
 * a new account, or a reset -- so the app can say so.
 */
export interface StaffCredentials {
  salt: string
  hash: string
  temporary: boolean
  updatedOn: string
}

export interface StaffMember {
  id: string
  name: Bilingual
  phone: string
  email: string
  role: StaffRole
  status: StaffStatus
  /** What they type to sign in. Unique, compared without case. */
  username: string
  /**
   * The Supabase auth account this person signs in with, once the app is
   * connected to a database. Null while passwords are kept in the browser.
   */
  userId: string | null
  credentials: StaffCredentials | null
}

/**
 * A file kept with the record it belongs to — a receipt, an invoice, a payslip.
 * The bytes live in the record as a data URL so a bill can always be produced
 * for the money it claims to explain.
 */
export interface Attachment {
  name: string
  /** MIME type as the browser reported it, for choosing how to open the file. */
  type: string
  size: number
  /** Empty for records that were kept before files themselves were stored. */
  dataUrl: string
  uploadedOn: string
  /**
   * Where the file lives in Storage, once the app is connected to a database.
   * Until then the bytes are the dataUrl above and this is null.
   */
  path?: string | null
}

export type RequestType = 'Domestic' | 'Profession'
export type ApplicantStatus = 'Available' | 'Unavailable' | 'Selected' | 'Deployed' | 'Back Out'
export type Gender = 'Male' | 'Female'

export interface ExperienceEntry {
  id: string
  title: string
  employer: string
  years: number
}

export interface EducationEntry {
  id: string
  degree: string
  institution: string
  year: string
}

export interface ApplicantDocument {
  id: string
  name: string
  category: string
  uploadedOn: string
}

export interface ApplicantNote {
  id: string
  author: string
  date: string
  text: string
}

export interface Applicant {
  id: string
  englishName: string
  arabicName: string
  gender: Gender
  dob: string
  country: string
  profession: string
  type: RequestType
  experienceYears: number
  passportNo: string
  passportStart: string
  passportEnd: string
  idNumber: string
  phone: string
  telephone: string
  status: ApplicantStatus
  photoDataUrl: string | null
  cvFileName: string | null
  passportCopyFileName: string | null
  cvLinkedToWebsite: boolean
  experience: ExperienceEntry[]
  education: EducationEntry[]
  documents: ApplicantDocument[]
  notes: ApplicantNote[]
  recruitmentAgencyId: string | null
  /** The agent who introduced this candidate, when one did. */
  agentId: string | null
  createdOn: string
  updatedOn: string
  updatedBy: string
}

export type EmployerStatus = 'Active' | 'Inactive'

export interface Employer {
  id: string
  englishName: string
  arabicName: string
  email: string
  phone: string
  telephone: string
  nationalAddress: string
  nationalIdNumber: string
  nationalAddressShortCode: string
  status: EmployerStatus
  profileImageDataUrl: string | null
  createdOn: string
}

export type AgencyStatus = 'Active' | 'Inactive'

export interface RecruitmentAgency {
  id: string
  englishName: string
  arabicName: string
  licenseNumber: string
  licenseExpiry: string
  phone: string
  email: string
  telephone: string
  rating: number
  primaryManager: Bilingual
  secondManager: Bilingual
  status: AgencyStatus
  createdOn: string
}

export interface StatusDefinition {
  id: string
  label: string
  pipeline: RequestType | 'Invoice'
  order: number
  defaultCost: number
  costNote: string
  isTerminal: boolean
  isException: boolean
}

export interface StatusHistoryEntry {
  id: string
  status: string
  date: string
  cost: number
  paymentSourceId: string
  responsibleEmployeeId: string
  /** The receipt for this stage's cost. */
  attachment: Attachment | null
  notes: string
}

export interface RecruitmentRequest {
  id: string
  type: RequestType
  contractDurationMonths: number
  applicantId: string
  employerId: string
  responsibleEmployeeId: string
  recruitmentAgencyId: string
  mosanedNumber: string
  notes: Bilingual
  statusHistory: StatusHistoryEntry[]
  createdOn: string
  updatedOn: string
}

export type InvoiceStatus = 'Issued' | 'Partial Payment' | 'Completed'

export interface InvoicePayment {
  id: string
  date: string
  amount: number
  sourceId: string
  /** Proof the money arrived: a transfer slip or a signed receipt. */
  attachment: Attachment | null
}

export interface Invoice {
  id: string
  invoiceNumber: string
  recruitmentRequestId: string
  employerId: string
  recruitmentAgencyId: string
  servicePrice: number
  payments: InvoicePayment[]
  status: InvoiceStatus
  issuedOn: string
}

export type PaymentSourceScope = 'Invoices' | 'Request Status'

export interface PaymentSource {
  id: string
  name: string
  scopes: PaymentSourceScope[]
}

export interface Country {
  id: string
  name: Bilingual
}

export interface City {
  id: string
  name: Bilingual
  countryId: string
}

export interface Profession {
  id: string
  name: Bilingual
}

export interface AppNotification {
  id: string
  title: string
  detail: string
  date: string
  read: boolean
}

export type LedgerStatus = 'Paid' | 'Pending'

export interface PayrollEntry {
  id: string
  staffId: string
  /** Pay period, formatted YYYY-MM. */
  month: string
  basicSalary: number
  overtime: number
  allowances: number
  status: LedgerStatus
  /** The payslip or transfer slip for this month. */
  attachment: Attachment | null
}

export interface OfficeExpense {
  id: string
  item: Bilingual
  category: string
  amount: number
  date: string
  status: LedgerStatus
  /** The bill this expense is claiming. */
  attachment: Attachment | null
}


// ---------------------------------------------------------------- agents --

export type AgentStatus = 'Active' | 'Inactive'

/**
 * A person who introduces candidates. Unlike a partner agency, an agent works
 * case by case: they bring the workers they find, and earn on each one that
 * reaches a milestone.
 */
export interface Agent {
  id: string
  name: Bilingual
  phone: string
  email: string
  /** Where this agent sources candidates, for example a province or city. */
  area: string
  status: AgentStatus
  /** Earned when a candidate they introduced is selected by a client. */
  selectionFee: number
  /** Earned when that same candidate is deployed. */
  deploymentFee: number
  notes: string
  createdOn: string
}

export type CommissionMilestone = 'Selected' | 'Deployed'

/** Money owed to someone outside the company, and whether it has been sent. */
export type SettlementStatus = 'Pending' | 'Paid'

/**
 * One half of an agent's fee for one candidate. Created automatically when the
 * candidate's request reaches the milestone, so a commission can never exist
 * for a stage that has not happened.
 */
export interface AgentCommission {
  id: string
  agentId: string
  applicantId: string
  requestId: string
  milestone: CommissionMilestone
  amount: number
  earnedOn: string
  status: SettlementStatus
  paidOn: string | null
  paymentSourceId: string | null
}

// ------------------------------------------------------ agency contracts --

export type ContractStatus = 'Active' | 'Expired'

/**
 * The agreement with a partner office abroad. It fixes what they pay for each
 * domestic worker placed with them; domestic workers are only placed through
 * an agency holding one of these.
 */
export interface AgencyContract {
  id: string
  agencyId: string
  reference: string
  /** What the partner office pays for each domestic worker placed. */
  pricePerWorker: number
  signedOn: string
  expiresOn: string
  status: ContractStatus
  notes: string
}

/** Half falls due when the worker is selected, half when her visa is issued. */
export type AgencyChargeMilestone = 'Selected' | 'Visa Issued'

export interface AgencyCharge {
  id: string
  agencyId: string
  contractId: string
  applicantId: string
  requestId: string
  milestone: AgencyChargeMilestone
  amount: number
  dueOn: string
  status: SettlementStatus
  settledOn: string | null
  paymentSourceId: string | null
}

// -------------------------------------------------------------- backouts --

/** Who carries the cost of bringing a worker home. */
export type BackoutLiability = 'Company' | 'Employer' | 'Agency'

export interface BackoutCost {
  id: string
  label: Bilingual
  category: string
  amount: number
  date: string
  status: SettlementStatus
  paymentSourceId: string | null
  /** The bill for this line of the return. */
  attachment: Attachment | null
}

/**
 * A deployed worker who left the placement and returned home. Inside the
 * guarantee window the company brings her back at its own expense, so each
 * backout carries its own bills.
 */
export interface Backout {
  id: string
  requestId: string
  applicantId: string
  /** Null when she backed out before ever leaving, so nothing was served. */
  deployedOn: string | null
  returnedOn: string
  reason: string
  liability: BackoutLiability
  notes: string
  costs: BackoutCost[]
  createdOn: string
}
