import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  Worker,
  Client,
  Application,
  StaffMember,
  AppNotification,
  ExpenseRow,
  IncomePayment,
  WorkerDocument,
  RecruitmentStage,
  WorkerStatus,
  ApplicationStatus,
} from '../types'
import { seedWorkers, seedClients, seedApplications, seedStaff, seedNotifications } from '../data/seed'

const CURRENT_USER = 'John Admin'

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

function newId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`
}

interface AppSettings {
  companyName: string
  companyTagline: string
  currency: string
}

interface AppState {
  workers: Worker[]
  clients: Client[]
  applications: Application[]
  staff: StaffMember[]
  notifications: AppNotification[]
  settings: AppSettings

  // Workers
  addWorker: (data: Pick<Worker, 'name' | 'client' | 'nationality' | 'age' | 'passportNo' | 'contractType' | 'mobileNo'>) => string
  updateWorker: (id: string, patch: Partial<Worker>) => void
  deleteWorker: (id: string) => void
  setWorkerStatus: (id: string, status: WorkerStatus) => void
  setWorkerPhoto: (id: string, dataUrl: string | null) => void

  // Stages
  setStageStatus: (workerId: string, order: number, status: RecruitmentStage['status'], date?: string | null) => void
  replaceStages: (workerId: string, stages: RecruitmentStage[]) => void

  // Expenses
  addExpense: (workerId: string, expense: Omit<ExpenseRow, 'id'>) => void
  updateExpense: (workerId: string, expenseId: string, patch: Partial<ExpenseRow>) => void
  deleteExpense: (workerId: string, expenseId: string) => void
  toggleExpensePaid: (workerId: string, expenseId: string) => void

  // Income payments
  addPayment: (workerId: string, payment: Omit<IncomePayment, 'id'>) => void
  updatePayment: (workerId: string, paymentId: string, patch: Partial<IncomePayment>) => void
  deletePayment: (workerId: string, paymentId: string) => void

  // Documents
  addDocument: (workerId: string, doc: Omit<WorkerDocument, 'id' | 'uploadedOn'>) => void
  deleteDocument: (workerId: string, docId: string) => void

  // Notes
  addNote: (workerId: string, text: string) => void

  // Clients
  addClient: (data: Omit<Client, 'id' | 'activeWorkers'>) => void
  updateClient: (id: string, patch: Partial<Client>) => void
  deleteClient: (id: string) => void

  // Applications
  addApplication: (data: Omit<Application, 'id'>) => void
  updateApplicationStatus: (id: string, status: ApplicationStatus) => void
  deleteApplication: (id: string) => void

  // Staff
  addStaff: (data: Omit<StaffMember, 'id' | 'active'>) => void
  toggleStaffActive: (id: string) => void
  deleteStaff: (id: string) => void

  // Notifications
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void
  addNotification: (title: string, detail: string) => void

  // Settings
  updateSettings: (patch: Partial<AppSettings>) => void
}

function touchWorker(worker: Worker): Worker {
  return { ...worker, updatedOn: todayIso(), updatedBy: CURRENT_USER }
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      workers: seedWorkers,
      clients: seedClients,
      applications: seedApplications,
      staff: seedStaff,
      notifications: seedNotifications,
      settings: {
        companyName: 'Eleutheria',
        companyTagline: 'International Placement Services Inc.',
        currency: 'SAR',
      },

      addWorker: (data) => {
        const id = newId('w')
        const worker: Worker = {
          id,
          name: data.name,
          status: 'In Process',
          fileNo: `APP-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
          nationality: data.nationality,
          age: data.age,
          passportNo: data.passportNo,
          client: data.client,
          contractType: data.contractType,
          mobileNo: data.mobileNo,
          photoDataUrl: null,
          createdOn: todayIso(),
          updatedOn: todayIso(),
          updatedBy: CURRENT_USER,
          stages: [
            'Application Received',
            'Contract Signed',
            'Passport Processing',
            'Medical Examination',
            'Training',
            'DMW Processing',
            'Insurance',
            'Ticket Booking',
            'Deployed',
          ].map((label, i) => ({
            order: i + 1,
            label,
            date: i === 0 ? todayIso() : null,
            status: i === 0 ? ('current' as const) : ('pending' as const),
          })),
          expenses: [],
          incomePayments: [],
          documents: [],
          notes: [],
        }
        set((s) => ({ workers: [worker, ...s.workers] }))
        return id
      },

      updateWorker: (id, patch) =>
        set((s) => ({
          workers: s.workers.map((w) => (w.id === id ? touchWorker({ ...w, ...patch }) : w)),
        })),

      deleteWorker: (id) => set((s) => ({ workers: s.workers.filter((w) => w.id !== id) })),

      setWorkerStatus: (id, status) =>
        set((s) => ({
          workers: s.workers.map((w) => (w.id === id ? touchWorker({ ...w, status }) : w)),
        })),

      setWorkerPhoto: (id, dataUrl) =>
        set((s) => ({
          workers: s.workers.map((w) => (w.id === id ? touchWorker({ ...w, photoDataUrl: dataUrl }) : w)),
        })),

      setStageStatus: (workerId, order, status, date) =>
        set((s) => ({
          workers: s.workers.map((w) => {
            if (w.id !== workerId) return w
            const stages = w.stages.map((st) =>
              st.order === order ? { ...st, status, date: date !== undefined ? date : st.date } : st,
            )
            return touchWorker({ ...w, stages })
          }),
        })),

      replaceStages: (workerId, stages) =>
        set((s) => ({
          workers: s.workers.map((w) => (w.id === workerId ? touchWorker({ ...w, stages }) : w)),
        })),

      addExpense: (workerId, expense) =>
        set((s) => ({
          workers: s.workers.map((w) =>
            w.id === workerId
              ? touchWorker({ ...w, expenses: [...w.expenses, { ...expense, id: newId('e') }] })
              : w,
          ),
        })),

      updateExpense: (workerId, expenseId, patch) =>
        set((s) => ({
          workers: s.workers.map((w) =>
            w.id === workerId
              ? touchWorker({
                  ...w,
                  expenses: w.expenses.map((e) => (e.id === expenseId ? { ...e, ...patch } : e)),
                })
              : w,
          ),
        })),

      deleteExpense: (workerId, expenseId) =>
        set((s) => ({
          workers: s.workers.map((w) =>
            w.id === workerId
              ? touchWorker({ ...w, expenses: w.expenses.filter((e) => e.id !== expenseId) })
              : w,
          ),
        })),

      toggleExpensePaid: (workerId, expenseId) =>
        set((s) => ({
          workers: s.workers.map((w) =>
            w.id === workerId
              ? touchWorker({
                  ...w,
                  expenses: w.expenses.map((e) => (e.id === expenseId ? { ...e, paid: !e.paid } : e)),
                })
              : w,
          ),
        })),

      addPayment: (workerId, payment) =>
        set((s) => ({
          workers: s.workers.map((w) =>
            w.id === workerId
              ? touchWorker({ ...w, incomePayments: [...w.incomePayments, { ...payment, id: newId('p') }] })
              : w,
          ),
        })),

      updatePayment: (workerId, paymentId, patch) =>
        set((s) => ({
          workers: s.workers.map((w) =>
            w.id === workerId
              ? touchWorker({
                  ...w,
                  incomePayments: w.incomePayments.map((p) => (p.id === paymentId ? { ...p, ...patch } : p)),
                })
              : w,
          ),
        })),

      deletePayment: (workerId, paymentId) =>
        set((s) => ({
          workers: s.workers.map((w) =>
            w.id === workerId
              ? touchWorker({ ...w, incomePayments: w.incomePayments.filter((p) => p.id !== paymentId) })
              : w,
          ),
        })),

      addDocument: (workerId, doc) =>
        set((s) => ({
          workers: s.workers.map((w) =>
            w.id === workerId
              ? touchWorker({
                  ...w,
                  documents: [...w.documents, { ...doc, id: newId('d'), uploadedOn: todayIso() }],
                })
              : w,
          ),
        })),

      deleteDocument: (workerId, docId) =>
        set((s) => ({
          workers: s.workers.map((w) =>
            w.id === workerId
              ? touchWorker({ ...w, documents: w.documents.filter((d) => d.id !== docId) })
              : w,
          ),
        })),

      addNote: (workerId, text) =>
        set((s) => ({
          workers: s.workers.map((w) =>
            w.id === workerId
              ? touchWorker({
                  ...w,
                  notes: [{ id: newId('n'), author: CURRENT_USER, date: todayIso(), text }, ...w.notes],
                })
              : w,
          ),
        })),

      addClient: (data) =>
        set((s) => ({ clients: [{ ...data, id: newId('c'), activeWorkers: 0 }, ...s.clients] })),

      updateClient: (id, patch) =>
        set((s) => ({ clients: s.clients.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),

      deleteClient: (id) => set((s) => ({ clients: s.clients.filter((c) => c.id !== id) })),

      addApplication: (data) =>
        set((s) => ({ applications: [{ ...data, id: newId('a') }, ...s.applications] })),

      updateApplicationStatus: (id, status) =>
        set((s) => ({
          applications: s.applications.map((a) => (a.id === id ? { ...a, status } : a)),
        })),

      deleteApplication: (id) => set((s) => ({ applications: s.applications.filter((a) => a.id !== id) })),

      addStaff: (data) =>
        set((s) => ({ staff: [{ ...data, id: newId('s'), active: true }, ...s.staff] })),

      toggleStaffActive: (id) =>
        set((s) => ({ staff: s.staff.map((m) => (m.id === id ? { ...m, active: !m.active } : m)) })),

      deleteStaff: (id) => set((s) => ({ staff: s.staff.filter((m) => m.id !== id) })),

      markNotificationRead: (id) =>
        set((s) => ({
          notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
        })),

      markAllNotificationsRead: () =>
        set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),

      addNotification: (title, detail) =>
        set((s) => ({
          notifications: [
            { id: newId('note'), title, detail, date: todayIso(), read: false },
            ...s.notifications,
          ],
        })),

      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
    }),
    { name: 'eleutheria-store' },
  ),
)

export function computeWorkerTotals(worker: Worker) {
  const totalExpenses = worker.expenses.reduce((sum, e) => sum + e.amount, 0)
  const totalIncome = worker.incomePayments.reduce((sum, p) => sum + p.amount, 0)
  const netProfit = totalIncome - totalExpenses
  const profitMargin = totalIncome === 0 ? 0 : (netProfit / totalIncome) * 100
  return { totalExpenses, totalIncome, netProfit, profitMargin }
}

export function formatCurrency(amount: number): string {
  return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
