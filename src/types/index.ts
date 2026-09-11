export type StageStatus = 'completed' | 'current' | 'pending'

export interface RecruitmentStage {
  order: number
  label: string
  date: string | null
  status: StageStatus
}

export interface ExpenseRow {
  id: string
  stage: string
  date: string
  category: string
  reference: string
  amount: number
  paid: boolean
  receiptName: string
}

export interface IncomePayment {
  id: string
  name: string
  date: string
  type: string
  amount: number
  receiptName: string
}

export interface WorkerDocument {
  id: string
  name: string
  category: string
  uploadedOn: string
}

export interface NoteEntry {
  id: string
  author: string
  date: string
  text: string
}

export type WorkerStatus = 'In Process' | 'Deployed' | 'On Hold' | 'Cancelled'

export interface Worker {
  id: string
  name: string
  status: WorkerStatus
  fileNo: string
  nationality: string
  age: number
  passportNo: string
  client: string
  contractType: string
  mobileNo: string
  photoDataUrl: string | null
  createdOn: string
  updatedOn: string
  updatedBy: string
  stages: RecruitmentStage[]
  expenses: ExpenseRow[]
  incomePayments: IncomePayment[]
  documents: WorkerDocument[]
  notes: NoteEntry[]
}

export interface Client {
  id: string
  company: string
  contactName: string
  email: string
  phone: string
  country: string
  activeWorkers: number
}

export type ApplicationStatus = 'New' | 'Screening' | 'Interview' | 'Approved' | 'Rejected'

export interface Application {
  id: string
  applicantName: string
  position: string
  client: string
  status: ApplicationStatus
  dateApplied: string
}

export type StaffRole = 'Administrator' | 'Recruiter' | 'Accountant' | 'Coordinator'

export interface StaffMember {
  id: string
  name: string
  role: StaffRole
  email: string
  active: boolean
}

export interface AppNotification {
  id: string
  title: string
  detail: string
  date: string
  read: boolean
}
