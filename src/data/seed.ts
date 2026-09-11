import type {
  Worker,
  Client,
  Application,
  StaffMember,
  AppNotification,
  RecruitmentStage,
} from '../types'

const STAGE_LABELS = [
  'Application Received',
  'Contract Signed',
  'Passport Processing',
  'Medical Examination',
  'Training',
  'DMW Processing',
  'Insurance',
  'Ticket Booking',
  'Deployed',
]

function buildStages(completedThrough: number, currentDate: string | null): RecruitmentStage[] {
  return STAGE_LABELS.map((label, i) => {
    const order = i + 1
    if (order < completedThrough) {
      return { order, label, date: '2024-05-20', status: 'completed' as const }
    }
    if (order === completedThrough) {
      return { order, label, date: currentDate, status: 'current' as const }
    }
    return { order, label, date: null, status: 'pending' as const }
  })
}

export const seedWorkers: Worker[] = [
  {
    id: 'w-maricel',
    name: 'Maricel S. Dela Cruz',
    status: 'In Process',
    fileNo: 'APP-2024-158',
    nationality: 'Philippines',
    age: 28,
    passportNo: 'P1234567A',
    client: 'Ahmed Al-Harbi',
    contractType: '2 Years',
    mobileNo: '+966 55 123 4567',
    photoDataUrl: null,
    createdOn: '2024-05-20',
    updatedOn: '2024-05-31',
    updatedBy: 'John Admin',
    stages: buildStages(4, '2024-05-24'),
    expenses: [
      { id: 'e-1', stage: 'Passport Processing', date: '2024-05-22', category: 'Government Fee', reference: 'DFA Passport Office', amount: 1200, paid: true, receiptName: 'receipt_passport.pdf' },
      { id: 'e-2', stage: 'Medical Examination', date: '2024-05-24', category: 'Medical', reference: 'Al Noor Medical Center', amount: 3500, paid: true, receiptName: 'medical_receipt.pdf' },
      { id: 'e-3', stage: 'Training Fee', date: '2024-05-25', category: 'Training', reference: 'Eleutheria Training Center', amount: 800, paid: true, receiptName: 'training_receipt.pdf' },
      { id: 'e-4', stage: 'Hotel / Accommodation', date: '2024-05-26', category: 'Accommodation', reference: 'Harmony Hotel', amount: 2000, paid: true, receiptName: 'hotel_receipt.pdf' },
      { id: 'e-5', stage: 'DMW / OEC Fee', date: '2024-05-28', category: 'Government Fee', reference: 'DMW', amount: 1500, paid: true, receiptName: 'dmw_receipt.pdf' },
      { id: 'e-6', stage: 'Insurance', date: '2024-05-29', category: 'Insurance', reference: 'PAG-IBIG / Insurance Co.', amount: 950, paid: true, receiptName: 'insurance_receipt.pdf' },
      { id: 'e-7', stage: 'Airport Fee', date: '2024-05-30', category: 'Travel', reference: 'NAIA Airport', amount: 500, paid: true, receiptName: 'airport_fee.pdf' },
      { id: 'e-8', stage: 'Plane Ticket', date: '2024-05-31', category: 'Travel', reference: 'Saudi Airlines', amount: 11500, paid: true, receiptName: 'ticket_receipt.pdf' },
      { id: 'e-9', stage: 'Others', date: '2024-05-31', category: 'Others', reference: 'Miscellaneous', amount: 1550, paid: true, receiptName: 'others_receipt.pdf' },
    ],
    incomePayments: [
      { id: 'p-1', name: 'Down Payment', date: '2024-05-20', type: 'Cash', amount: 15000, receiptName: 'down_payment.pdf' },
      { id: 'p-2', name: 'Second Payment', date: '2024-05-25', type: 'Bank Transfer', amount: 15000, receiptName: 'second_payment.pdf' },
      { id: 'p-3', name: 'Final Payment', date: '2024-05-31', type: 'Bank Transfer', amount: 15000, receiptName: 'final_payment.pdf' },
    ],
    documents: [
      { id: 'd-1', name: 'passport_scan.pdf', category: 'Identification', uploadedOn: '2024-05-20' },
      { id: 'd-2', name: 'medical_clearance.pdf', category: 'Medical', uploadedOn: '2024-05-24' },
      { id: 'd-3', name: 'employment_contract.pdf', category: 'Contract', uploadedOn: '2024-05-20' },
    ],
    notes: [
      { id: 'n-1', author: 'John Admin', date: '2024-05-20', text: 'Application received and file opened.' },
      { id: 'n-2', author: 'John Admin', date: '2024-05-24', text: 'Scheduled for medical examination at Al Noor Medical Center.' },
    ],
  },
  {
    id: 'w-2',
    name: 'Rosalinda P. Santos',
    status: 'Deployed',
    fileNo: 'APP-2024-142',
    nationality: 'Philippines',
    age: 34,
    passportNo: 'P7654321B',
    client: 'Fahad Al-Mutairi',
    contractType: '2 Years',
    mobileNo: '+966 55 987 6543',
    photoDataUrl: null,
    createdOn: '2024-04-02',
    updatedOn: '2024-05-10',
    updatedBy: 'John Admin',
    stages: buildStages(9, null),
    expenses: [
      { id: 'e-10', stage: 'Passport Processing', date: '2024-04-05', category: 'Government Fee', reference: 'DFA Passport Office', amount: 1200, paid: true, receiptName: 'receipt_passport.pdf' },
      { id: 'e-11', stage: 'Medical Examination', date: '2024-04-10', category: 'Medical', reference: 'St. Luke\'s Medical', amount: 3200, paid: true, receiptName: 'medical_receipt.pdf' },
      { id: 'e-12', stage: 'Plane Ticket', date: '2024-05-08', category: 'Travel', reference: 'Saudi Airlines', amount: 10800, paid: true, receiptName: 'ticket_receipt.pdf' },
    ],
    incomePayments: [
      { id: 'p-4', name: 'Down Payment', date: '2024-04-02', type: 'Cash', amount: 12000, receiptName: 'down_payment.pdf' },
      { id: 'p-5', name: 'Final Payment', date: '2024-05-05', type: 'Bank Transfer', amount: 18000, receiptName: 'final_payment.pdf' },
    ],
    documents: [
      { id: 'd-4', name: 'passport_scan.pdf', category: 'Identification', uploadedOn: '2024-04-02' },
    ],
    notes: [
      { id: 'n-3', author: 'John Admin', date: '2024-05-10', text: 'Deployed successfully. Client confirmed arrival.' },
    ],
  },
  {
    id: 'w-3',
    name: 'Jonalyn M. Reyes',
    status: 'On Hold',
    fileNo: 'APP-2024-171',
    nationality: 'Philippines',
    age: 25,
    passportNo: 'P2233445C',
    client: 'Salem Al-Qahtani',
    contractType: '1 Year',
    mobileNo: '+966 55 222 3344',
    photoDataUrl: null,
    createdOn: '2024-06-01',
    updatedOn: '2024-06-03',
    updatedBy: 'John Admin',
    stages: buildStages(2, '2024-06-03'),
    expenses: [
      { id: 'e-13', stage: 'Passport Processing', date: '2024-06-02', category: 'Government Fee', reference: 'DFA Passport Office', amount: 1200, paid: false, receiptName: 'receipt_passport.pdf' },
    ],
    incomePayments: [
      { id: 'p-6', name: 'Down Payment', date: '2024-06-01', type: 'Cash', amount: 8000, receiptName: 'down_payment.pdf' },
    ],
    documents: [],
    notes: [
      { id: 'n-4', author: 'John Admin', date: '2024-06-03', text: 'On hold pending updated medical documents from client.' },
    ],
  },
  {
    id: 'w-4',
    name: 'Ariel B. Fernandez',
    status: 'In Process',
    fileNo: 'APP-2024-165',
    nationality: 'Philippines',
    age: 31,
    passportNo: 'P5566778D',
    client: 'Khalid Al-Dosari',
    contractType: '2 Years',
    mobileNo: '+966 55 444 5566',
    photoDataUrl: null,
    createdOn: '2024-05-15',
    updatedOn: '2024-05-29',
    updatedBy: 'John Admin',
    stages: buildStages(6, '2024-05-29'),
    expenses: [
      { id: 'e-14', stage: 'Passport Processing', date: '2024-05-17', category: 'Government Fee', reference: 'DFA Passport Office', amount: 1200, paid: true, receiptName: 'receipt_passport.pdf' },
      { id: 'e-15', stage: 'Medical Examination', date: '2024-05-20', category: 'Medical', reference: 'Al Noor Medical Center', amount: 3500, paid: true, receiptName: 'medical_receipt.pdf' },
      { id: 'e-16', stage: 'Training Fee', date: '2024-05-23', category: 'Training', reference: 'Eleutheria Training Center', amount: 800, paid: true, receiptName: 'training_receipt.pdf' },
    ],
    incomePayments: [
      { id: 'p-7', name: 'Down Payment', date: '2024-05-15', type: 'Cash', amount: 15000, receiptName: 'down_payment.pdf' },
    ],
    documents: [
      { id: 'd-5', name: 'passport_scan.pdf', category: 'Identification', uploadedOn: '2024-05-15' },
    ],
    notes: [],
  },
  {
    id: 'w-5',
    name: 'Teresa L. Villanueva',
    status: 'Cancelled',
    fileNo: 'APP-2024-130',
    nationality: 'Philippines',
    age: 40,
    passportNo: 'P9988776E',
    client: 'Nasser Al-Shammari',
    contractType: '2 Years',
    mobileNo: '+966 55 111 2233',
    photoDataUrl: null,
    createdOn: '2024-03-10',
    updatedOn: '2024-03-28',
    updatedBy: 'John Admin',
    stages: buildStages(3, null),
    expenses: [
      { id: 'e-17', stage: 'Passport Processing', date: '2024-03-12', category: 'Government Fee', reference: 'DFA Passport Office', amount: 1200, paid: true, receiptName: 'receipt_passport.pdf' },
    ],
    incomePayments: [
      { id: 'p-8', name: 'Down Payment', date: '2024-03-10', type: 'Cash', amount: 10000, receiptName: 'down_payment.pdf' },
    ],
    documents: [],
    notes: [
      { id: 'n-5', author: 'John Admin', date: '2024-03-28', text: 'Application cancelled at applicant\'s request.' },
    ],
  },
]

export const seedClients: Client[] = [
  { id: 'c-1', company: 'Al-Harbi Household', contactName: 'Ahmed Al-Harbi', email: 'ahmed.harbi@example.sa', phone: '+966 55 123 0001', country: 'Saudi Arabia', activeWorkers: 1 },
  { id: 'c-2', company: 'Al-Mutairi Household', contactName: 'Fahad Al-Mutairi', email: 'fahad.mutairi@example.sa', phone: '+966 55 123 0002', country: 'Saudi Arabia', activeWorkers: 1 },
  { id: 'c-3', company: 'Al-Qahtani Household', contactName: 'Salem Al-Qahtani', email: 'salem.qahtani@example.sa', phone: '+966 55 123 0003', country: 'Saudi Arabia', activeWorkers: 1 },
  { id: 'c-4', company: 'Al-Dosari Household', contactName: 'Khalid Al-Dosari', email: 'khalid.dosari@example.sa', phone: '+966 55 123 0004', country: 'Saudi Arabia', activeWorkers: 1 },
]

export const seedApplications: Application[] = [
  { id: 'a-1', applicantName: 'Maricel S. Dela Cruz', position: 'Household Worker', client: 'Ahmed Al-Harbi', status: 'Interview', dateApplied: '2024-05-20' },
  { id: 'a-2', applicantName: 'Rosalinda P. Santos', position: 'Household Worker', client: 'Fahad Al-Mutairi', status: 'Approved', dateApplied: '2024-04-02' },
  { id: 'a-3', applicantName: 'Jonalyn M. Reyes', position: 'Caregiver', client: 'Salem Al-Qahtani', status: 'Screening', dateApplied: '2024-06-01' },
  { id: 'a-4', applicantName: 'Ariel B. Fernandez', position: 'Driver', client: 'Khalid Al-Dosari', status: 'Interview', dateApplied: '2024-05-15' },
]

export const seedStaff: StaffMember[] = [
  { id: 's-1', name: 'John Admin', role: 'Administrator', email: 'john.admin@eleutheria.com', active: true },
  { id: 's-2', name: 'Grace Lim', role: 'Recruiter', email: 'grace.lim@eleutheria.com', active: true },
  { id: 's-3', name: 'Mark Tan', role: 'Accountant', email: 'mark.tan@eleutheria.com', active: true },
  { id: 's-4', name: 'Diana Cruz', role: 'Coordinator', email: 'diana.cruz@eleutheria.com', active: false },
]

export const seedNotifications: AppNotification[] = [
  { id: 'note-1', title: 'Medical exam scheduled', detail: 'Maricel S. Dela Cruz is scheduled for a medical exam.', date: '2024-05-24', read: false },
  { id: 'note-2', title: 'Worker deployed', detail: 'Rosalinda P. Santos has been deployed successfully.', date: '2024-05-10', read: false },
  { id: 'note-3', title: 'Payment received', detail: 'Final payment received for Maricel S. Dela Cruz.', date: '2024-05-31', read: true },
]
