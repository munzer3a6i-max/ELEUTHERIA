import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  Applicant,
  Employer,
  RecruitmentAgency,
  RecruitmentRequest,
  Invoice,
  InvoicePayment,
  StaffMember,
  Country,
  City,
  Profession,
  PaymentSource,
  AppNotification,
  StatusHistoryEntry,
  Language,
  Theme,
  StaffRole,
  PayrollEntry,
  OfficeExpense,
  LedgerStatus,
} from '../types'
import {
  seedApplicants,
  seedEmployers,
  seedAgencies,
  seedRequests,
  seedInvoices,
  seedStaff,
  seedCountries,
  seedCities,
  seedProfessions,
  seedPaymentSources,
  seedNotifications,
  seedPayroll,
  seedOfficeExpenses,
} from '../data/seed'

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

function newId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`
}

interface AppSettings {
  companyName: string
  companyTagline: string
  licenseNumber: string
  address: string
  currency: string
  language: Language
  theme: Theme
}

interface AppState {
  applicants: Applicant[]
  employers: Employer[]
  agencies: RecruitmentAgency[]
  requests: RecruitmentRequest[]
  invoices: Invoice[]
  staff: StaffMember[]
  countries: Country[]
  cities: City[]
  professions: Profession[]
  paymentSources: PaymentSource[]
  payroll: PayrollEntry[]
  officeExpenses: OfficeExpense[]
  notifications: AppNotification[]
  settings: AppSettings
  invoiceSequence: number

  setLanguage: (lang: Language) => void
  setTheme: (theme: Theme) => void
  updateSettings: (patch: Partial<Omit<AppSettings, 'language' | 'theme'>>) => void

  addApplicant: (data: Omit<Applicant, 'id' | 'createdOn' | 'updatedOn' | 'updatedBy' | 'status' | 'experience' | 'education' | 'documents' | 'notes' | 'photoDataUrl' | 'cvFileName' | 'passportCopyFileName' | 'cvLinkedToWebsite'>) => string
  updateApplicant: (id: string, patch: Partial<Applicant>) => void
  deleteApplicant: (id: string) => void
  addExperience: (applicantId: string, entry: Omit<Applicant['experience'][number], 'id'>) => void
  deleteExperience: (applicantId: string, entryId: string) => void
  addEducation: (applicantId: string, entry: Omit<Applicant['education'][number], 'id'>) => void
  deleteEducation: (applicantId: string, entryId: string) => void
  addApplicantDocument: (applicantId: string, doc: Omit<Applicant['documents'][number], 'id' | 'uploadedOn'>) => void
  deleteApplicantDocument: (applicantId: string, docId: string) => void
  addApplicantNote: (applicantId: string, text: string) => void

  addEmployer: (data: Omit<Employer, 'id' | 'createdOn' | 'status' | 'profileImageDataUrl'>) => string
  updateEmployer: (id: string, patch: Partial<Employer>) => void
  deleteEmployer: (id: string) => void

  addAgency: (data: Omit<RecruitmentAgency, 'id' | 'createdOn' | 'status'>) => string
  updateAgency: (id: string, patch: Partial<RecruitmentAgency>) => void
  deleteAgency: (id: string) => void

  addRequest: (data: Pick<RecruitmentRequest, 'type' | 'contractDurationMonths' | 'applicantId' | 'employerId' | 'responsibleEmployeeId' | 'recruitmentAgencyId' | 'mosanedNumber'>) => string
  updateRequest: (id: string, patch: Partial<RecruitmentRequest>) => void
  deleteRequest: (id: string) => void
  addStatusUpdate: (requestId: string, entry: Omit<StatusHistoryEntry, 'id'>) => void
  updateStatusUpdate: (requestId: string, entryId: string, patch: Omit<StatusHistoryEntry, 'id'>) => void
  deleteStatusUpdate: (requestId: string, entryId: string) => void

  addInvoice: (data: Pick<Invoice, 'recruitmentRequestId' | 'employerId' | 'recruitmentAgencyId' | 'servicePrice'>) => string
  updateInvoiceStatus: (id: string, status: Invoice['status']) => void
  addInvoicePayment: (invoiceId: string, payment: Omit<InvoicePayment, 'id'>) => void
  deleteInvoice: (id: string) => void

  addStaff: (data: Omit<StaffMember, 'id' | 'status'>) => void
  updateStaffRole: (id: string, role: StaffRole) => void
  toggleStaffActive: (id: string) => void
  deleteStaff: (id: string) => void

  addCountry: (name: Country['name']) => void
  deleteCountry: (id: string) => void
  addCity: (data: Omit<City, 'id'>) => void
  deleteCity: (id: string) => void
  addProfession: (name: Profession['name']) => void
  deleteProfession: (id: string) => void
  addPaymentSource: (data: Omit<PaymentSource, 'id'>) => void
  updatePaymentSource: (id: string, patch: Partial<PaymentSource>) => void
  deletePaymentSource: (id: string) => void

  addOfficeExpense: (data: Omit<OfficeExpense, 'id'>) => void
  updateOfficeExpense: (id: string, patch: Partial<Omit<OfficeExpense, 'id'>>) => void
  setOfficeExpenseStatus: (id: string, status: LedgerStatus) => void
  deleteOfficeExpense: (id: string) => void
  addPayrollEntry: (data: Omit<PayrollEntry, 'id'>) => void
  updatePayrollEntry: (id: string, patch: Partial<Omit<PayrollEntry, 'id'>>) => void
  deletePayrollEntry: (id: string) => void
  setPayrollStatus: (id: string, status: LedgerStatus) => void
  /** Copies a month's payroll to a new month, reset to Pending — the usual way a period is opened. */
  rollForwardPayroll: (fromMonth: string, toMonth: string) => number

  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void
  addNotification: (title: string, detail: string) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      applicants: seedApplicants,
      employers: seedEmployers,
      agencies: seedAgencies,
      requests: seedRequests,
      invoices: seedInvoices,
      staff: seedStaff,
      countries: seedCountries,
      cities: seedCities,
      professions: seedProfessions,
      paymentSources: seedPaymentSources,
      payroll: seedPayroll,
      officeExpenses: seedOfficeExpenses,
      notifications: seedNotifications,
      invoiceSequence: seedInvoices.length + 1,
      settings: {
        companyName: 'Eleutheria',
        companyTagline: 'International Placement Services',
        licenseNumber: 'DMW-622-LB-07032025-R',
        address: 'Gedisco Center, Ermita, Manila',
        currency: 'USD',
        language: 'en',
        theme: 'dark',
      },

      setLanguage: (language) => set((s) => ({ settings: { ...s.settings, language } })),
      setTheme: (theme) => set((s) => ({ settings: { ...s.settings, theme } })),
      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),

      addApplicant: (data) => {
        const id = newId('ap')
        const applicant: Applicant = {
          ...data,
          id,
          status: 'Available',
          photoDataUrl: null,
          cvFileName: null,
          passportCopyFileName: null,
          cvLinkedToWebsite: false,
          experience: [],
          education: [],
          documents: [],
          notes: [],
          createdOn: todayIso(),
          updatedOn: todayIso(),
          updatedBy: 'Kylie',
        }
        set((s) => ({ applicants: [applicant, ...s.applicants] }))
        return id
      },
      updateApplicant: (id, patch) =>
        set((s) => ({
          applicants: s.applicants.map((a) =>
            a.id === id ? { ...a, ...patch, updatedOn: todayIso(), updatedBy: 'Kylie' } : a,
          ),
        })),
      deleteApplicant: (id) => set((s) => ({ applicants: s.applicants.filter((a) => a.id !== id) })),
      addExperience: (applicantId, entry) =>
        set((s) => ({
          applicants: s.applicants.map((a) =>
            a.id === applicantId ? { ...a, experience: [...a.experience, { ...entry, id: newId('exp') }] } : a,
          ),
        })),
      deleteExperience: (applicantId, entryId) =>
        set((s) => ({
          applicants: s.applicants.map((a) =>
            a.id === applicantId ? { ...a, experience: a.experience.filter((e) => e.id !== entryId) } : a,
          ),
        })),
      addEducation: (applicantId, entry) =>
        set((s) => ({
          applicants: s.applicants.map((a) =>
            a.id === applicantId ? { ...a, education: [...a.education, { ...entry, id: newId('edu') }] } : a,
          ),
        })),
      deleteEducation: (applicantId, entryId) =>
        set((s) => ({
          applicants: s.applicants.map((a) =>
            a.id === applicantId ? { ...a, education: a.education.filter((e) => e.id !== entryId) } : a,
          ),
        })),
      addApplicantDocument: (applicantId, doc) =>
        set((s) => ({
          applicants: s.applicants.map((a) =>
            a.id === applicantId
              ? { ...a, documents: [...a.documents, { ...doc, id: newId('d'), uploadedOn: todayIso() }] }
              : a,
          ),
        })),
      deleteApplicantDocument: (applicantId, docId) =>
        set((s) => ({
          applicants: s.applicants.map((a) =>
            a.id === applicantId ? { ...a, documents: a.documents.filter((d) => d.id !== docId) } : a,
          ),
        })),
      addApplicantNote: (applicantId, text) =>
        set((s) => ({
          applicants: s.applicants.map((a) =>
            a.id === applicantId
              ? { ...a, notes: [{ id: newId('n'), author: 'Kylie', date: todayIso(), text }, ...a.notes] }
              : a,
          ),
        })),

      addEmployer: (data) => {
        const id = newId('em')
        const employer: Employer = { ...data, id, status: 'Active', profileImageDataUrl: null, createdOn: todayIso() }
        set((s) => ({ employers: [employer, ...s.employers] }))
        return id
      },
      updateEmployer: (id, patch) =>
        set((s) => ({ employers: s.employers.map((e) => (e.id === id ? { ...e, ...patch } : e)) })),
      deleteEmployer: (id) => set((s) => ({ employers: s.employers.filter((e) => e.id !== id) })),

      addAgency: (data) => {
        const id = newId('fra')
        const agency: RecruitmentAgency = { ...data, id, status: 'Active', createdOn: todayIso() }
        set((s) => ({ agencies: [agency, ...s.agencies] }))
        return id
      },
      updateAgency: (id, patch) =>
        set((s) => ({ agencies: s.agencies.map((a) => (a.id === id ? { ...a, ...patch } : a)) })),
      deleteAgency: (id) => set((s) => ({ agencies: s.agencies.filter((a) => a.id !== id) })),

      addRequest: (data) => {
        const id = newId('rr')
        const request: RecruitmentRequest = {
          ...data,
          id,
          notes: { en: '', ar: '' },
          statusHistory: [],
          createdOn: todayIso(),
          updatedOn: todayIso(),
        }
        set((s) => ({ requests: [request, ...s.requests] }))
        return id
      },
      updateRequest: (id, patch) =>
        set((s) => ({
          requests: s.requests.map((r) => (r.id === id ? { ...r, ...patch, updatedOn: todayIso() } : r)),
        })),
      deleteRequest: (id) => set((s) => ({ requests: s.requests.filter((r) => r.id !== id) })),
      addStatusUpdate: (requestId, entry) =>
        set((s) => ({
          requests: s.requests.map((r) =>
            r.id === requestId
              ? { ...r, statusHistory: [...r.statusHistory, { ...entry, id: newId('sh') }], updatedOn: todayIso() }
              : r,
          ),
        })),
      updateStatusUpdate: (requestId, entryId, patch) =>
        set((s) => ({
          requests: s.requests.map((r) =>
            r.id === requestId
              ? {
                  ...r,
                  statusHistory: r.statusHistory.map((h) => (h.id === entryId ? { ...patch, id: h.id } : h)),
                  updatedOn: todayIso(),
                }
              : r,
          ),
        })),
      deleteStatusUpdate: (requestId, entryId) =>
        set((s) => ({
          requests: s.requests.map((r) =>
            r.id === requestId
              ? { ...r, statusHistory: r.statusHistory.filter((h) => h.id !== entryId), updatedOn: todayIso() }
              : r,
          ),
        })),

      addInvoice: (data) => {
        const id = newId('inv')
        const seq = get().invoiceSequence
        const invoiceNumber = `INV-${new Date().getFullYear()}-${String(seq).padStart(4, '0')}`
        const invoice: Invoice = { ...data, id, invoiceNumber, payments: [], status: 'Issued', issuedOn: todayIso() }
        set((s) => ({ invoices: [invoice, ...s.invoices], invoiceSequence: s.invoiceSequence + 1 }))
        return id
      },
      updateInvoiceStatus: (id, status) =>
        set((s) => ({ invoices: s.invoices.map((i) => (i.id === id ? { ...i, status } : i)) })),
      addInvoicePayment: (invoiceId, payment) =>
        set((s) => ({
          invoices: s.invoices.map((i) => {
            if (i.id !== invoiceId) return i
            const payments = [...i.payments, { ...payment, id: newId('ip') }]
            const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)
            const status: Invoice['status'] =
              totalPaid >= i.servicePrice ? 'Completed' : totalPaid > 0 ? 'Partial Payment' : 'Issued'
            return { ...i, payments, status }
          }),
        })),
      deleteInvoice: (id) => set((s) => ({ invoices: s.invoices.filter((i) => i.id !== id) })),

      addStaff: (data) => set((s) => ({ staff: [{ ...data, id: newId('st'), status: 'Active' }, ...s.staff] })),
      updateStaffRole: (id, role) =>
        set((s) => ({ staff: s.staff.map((m) => (m.id === id ? { ...m, role } : m)) })),
      toggleStaffActive: (id) =>
        set((s) => ({
          staff: s.staff.map((m) => (m.id === id ? { ...m, status: m.status === 'Active' ? 'Inactive' : 'Active' } : m)),
        })),
      deleteStaff: (id) => set((s) => ({ staff: s.staff.filter((m) => m.id !== id) })),

      addCountry: (name) => set((s) => ({ countries: [...s.countries, { id: newId('co'), name }] })),
      deleteCountry: (id) => set((s) => ({ countries: s.countries.filter((c) => c.id !== id) })),
      addCity: (data) => set((s) => ({ cities: [...s.cities, { ...data, id: newId('ci') }] })),
      deleteCity: (id) => set((s) => ({ cities: s.cities.filter((c) => c.id !== id) })),
      addProfession: (name) => set((s) => ({ professions: [...s.professions, { id: newId('pr'), name }] })),
      deleteProfession: (id) => set((s) => ({ professions: s.professions.filter((p) => p.id !== id) })),
      addPaymentSource: (data) =>
        set((s) => ({ paymentSources: [...s.paymentSources, { ...data, id: newId('ps') }] })),
      updatePaymentSource: (id, patch) =>
        set((s) => ({ paymentSources: s.paymentSources.map((p) => (p.id === id ? { ...p, ...patch } : p)) })),
      deletePaymentSource: (id) =>
        set((s) => ({ paymentSources: s.paymentSources.filter((p) => p.id !== id) })),

      addOfficeExpense: (data) =>
        set((s) => ({ officeExpenses: [{ ...data, id: newId('oe') }, ...s.officeExpenses] })),
      updateOfficeExpense: (id, patch) =>
        set((s) => ({ officeExpenses: s.officeExpenses.map((e) => (e.id === id ? { ...e, ...patch } : e)) })),
      setOfficeExpenseStatus: (id, status) =>
        set((s) => ({ officeExpenses: s.officeExpenses.map((e) => (e.id === id ? { ...e, status } : e)) })),
      deleteOfficeExpense: (id) =>
        set((s) => ({ officeExpenses: s.officeExpenses.filter((e) => e.id !== id) })),
      addPayrollEntry: (data) => set((s) => ({ payroll: [{ ...data, id: newId('pay') }, ...s.payroll] })),
      updatePayrollEntry: (id, patch) =>
        set((s) => ({ payroll: s.payroll.map((e) => (e.id === id ? { ...e, ...patch } : e)) })),
      deletePayrollEntry: (id) => set((s) => ({ payroll: s.payroll.filter((e) => e.id !== id) })),
      setPayrollStatus: (id, status) =>
        set((s) => ({ payroll: s.payroll.map((e) => (e.id === id ? { ...e, status } : e)) })),
      rollForwardPayroll: (fromMonth, toMonth) => {
        const source = get().payroll.filter((e) => e.month === fromMonth)
        const already = new Set(get().payroll.filter((e) => e.month === toMonth).map((e) => e.staffId))
        const copies = source
          .filter((e) => !already.has(e.staffId))
          .map((e) => ({ ...e, id: newId('pay'), month: toMonth, status: 'Pending' as LedgerStatus }))
        if (copies.length > 0) set((s) => ({ payroll: [...copies, ...s.payroll] }))
        return copies.length
      },

      markNotificationRead: (id) =>
        set((s) => ({ notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) })),
      markAllNotificationsRead: () =>
        set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),
      addNotification: (title, detail) =>
        set((s) => ({
          notifications: [{ id: newId('note'), title, detail, date: todayIso(), read: false }, ...s.notifications],
        })),
    }),
    { name: 'mustaqdem-store' },
  ),
)

// ---- Derived helpers (pure functions, not store state, to avoid duplication drift) ----

export function currentStatus(request: RecruitmentRequest): string | null {
  if (request.statusHistory.length === 0) return null
  return request.statusHistory[request.statusHistory.length - 1].status
}

export function requestCost(request: RecruitmentRequest): number {
  return request.statusHistory.reduce((sum, h) => sum + h.cost, 0)
}

export function invoiceTotalPaid(invoice: Invoice): number {
  return invoice.payments.reduce((sum, p) => sum + p.amount, 0)
}

export function invoiceBalance(invoice: Invoice): number {
  return invoice.servicePrice - invoiceTotalPaid(invoice)
}

export function formatMoney(amount: number, currency = 'USD', fractionDigits = 2): string {
  const symbol = currency === 'USD' ? '$' : currency
  const value = Math.abs(amount).toLocaleString('en-US', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })
  return `${amount < 0 ? '−' : ''}${symbol}${value}`
}

export function payrollTotal(entry: PayrollEntry): number {
  return entry.basicSalary + entry.overtime + entry.allowances
}
