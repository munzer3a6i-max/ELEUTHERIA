export interface Bilingual {
  en: string
  ar: string
}

export type Language = 'en' | 'ar'
export type Theme = 'dark' | 'light'

export type StaffRole = 'admin' | 'user'
export type StaffStatus = 'Active' | 'Inactive' | 'Suspended'

export interface StaffMember {
  id: string
  name: Bilingual
  phone: string
  email: string
  role: StaffRole
  status: StaffStatus
}

export type RequestType = 'Domestic' | 'Profession'
export type ApplicantStatus = 'Available' | 'Unavailable' | 'Selected' | 'Deployed'
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
  recruitmentAgencyId: string | null
  createdOn: string
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
  attachmentName: string | null
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
