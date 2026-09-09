export type StageStatus = 'completed' | 'current' | 'pending'

export interface RecruitmentStage {
  order: number
  label: string
  date: string | null
  status: StageStatus
}

export interface ExpenseRow {
  id: number
  stage: string
  date: string
  category: string
  reference: string
  amount: number
  paid: boolean
  receiptName: string
}

export interface IncomePayment {
  id: number
  name: string
  date: string
  type: string
  amount: number
  receiptName: string
}

export interface StageExpenseSlice {
  label: string
  amount: number
  color: string
}

export const worker = {
  name: 'Maricel S. Dela Cruz',
  status: 'In Process',
  fileNo: 'APP-2024-158',
  nationality: 'Philippines',
  age: 28,
  passportNo: 'P1234567A',
  client: 'Ahmed Al-Harbi',
  contractType: '2 Years',
  currentStage: 'Medical Examination',
  mobileNo: '+966 55 123 4567',
  lastUpdated: 'May 31, 2024',
  createdOn: 'May 20, 2024',
  updatedBy: 'John Admin',
}

export const recruitmentStages: RecruitmentStage[] = [
  { order: 1, label: 'Application Received', date: 'May 20, 2024', status: 'completed' },
  { order: 2, label: 'Contract Signed', date: 'May 20, 2024', status: 'completed' },
  { order: 3, label: 'Passport Processing', date: 'May 22, 2024', status: 'completed' },
  { order: 4, label: 'Medical Examination', date: 'May 24, 2024', status: 'current' },
  { order: 5, label: 'Training', date: null, status: 'pending' },
  { order: 6, label: 'DMW Processing', date: null, status: 'pending' },
  { order: 7, label: 'Insurance', date: null, status: 'pending' },
  { order: 8, label: 'Ticket Booking', date: null, status: 'pending' },
  { order: 9, label: 'Deployed', date: null, status: 'pending' },
]

export const expenses: ExpenseRow[] = [
  { id: 1, stage: 'Passport Processing', date: 'May 22, 2024', category: 'Government Fee', reference: 'DFA Passport Office', amount: 1200, paid: true, receiptName: 'receipt_passport.pdf' },
  { id: 2, stage: 'Medical Examination', date: 'May 24, 2024', category: 'Medical', reference: 'Al Noor Medical Center', amount: 3500, paid: true, receiptName: 'medical_receipt.pdf' },
  { id: 3, stage: 'Training Fee', date: 'May 25, 2024', category: 'Training', reference: 'Eleutheria Training Center', amount: 800, paid: true, receiptName: 'training_receipt.pdf' },
  { id: 4, stage: 'Hotel / Accommodation', date: 'May 26, 2024', category: 'Accommodation', reference: 'Harmony Hotel', amount: 2000, paid: true, receiptName: 'hotel_receipt.pdf' },
  { id: 5, stage: 'DMW / OEC Fee', date: 'May 28, 2024', category: 'Government Fee', reference: 'DMW', amount: 1500, paid: true, receiptName: 'dmw_receipt.pdf' },
  { id: 6, stage: 'Insurance', date: 'May 29, 2024', category: 'Insurance', reference: 'PAG-IBIG / Insurance Co.', amount: 950, paid: true, receiptName: 'insurance_receipt.pdf' },
  { id: 7, stage: 'Airport Fee', date: 'May 30, 2024', category: 'Travel', reference: 'NAIA Airport', amount: 500, paid: true, receiptName: 'airport_fee.pdf' },
  { id: 8, stage: 'Plane Ticket', date: 'May 31, 2024', category: 'Travel', reference: 'Saudi Airlines', amount: 11500, paid: true, receiptName: 'ticket_receipt.pdf' },
  { id: 9, stage: 'Others', date: 'May 31, 2024', category: 'Others', reference: 'Miscellaneous', amount: 1550, paid: true, receiptName: 'others_receipt.pdf' },
]

export const incomePayments: IncomePayment[] = [
  { id: 1, name: 'Down Payment', date: 'May 20, 2024', type: 'Cash', amount: 15000, receiptName: 'down_payment.pdf' },
  { id: 2, name: 'Second Payment', date: 'May 25, 2024', type: 'Bank Transfer', amount: 15000, receiptName: 'second_payment.pdf' },
  { id: 3, name: 'Final Payment', date: 'May 31, 2024', type: 'Bank Transfer', amount: 15000, receiptName: 'final_payment.pdf' },
]

export const stageExpenseBreakdown: StageExpenseSlice[] = [
  { label: 'Passport', amount: 1200, color: '#38bdf8' },
  { label: 'Medical', amount: 3500, color: '#3b82f6' },
  { label: 'Training', amount: 800, color: '#10b981' },
  { label: 'Hotel', amount: 2000, color: '#fbbf24' },
  { label: 'DMW / OEC', amount: 1500, color: '#fb923c' },
  { label: 'Insurance', amount: 950, color: '#2dd4bf' },
  { label: 'Airport Fee', amount: 500, color: '#818cf8' },
  { label: 'Ticket', amount: 11500, color: '#f43f5e' },
  { label: 'Others', amount: 1550, color: '#d97706' },
]

export const totalExpenses = expenses.reduce((sum, row) => sum + row.amount, 0)
export const totalIncome = incomePayments.reduce((sum, row) => sum + row.amount, 0)
export const netProfit = totalIncome - totalExpenses
export const profitMargin = (netProfit / totalIncome) * 100

export function formatCurrency(amount: number): string {
  return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
