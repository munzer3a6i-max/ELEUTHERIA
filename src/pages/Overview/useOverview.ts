import { useMemo } from 'react'
import { useAppStore, currentStatus, invoiceBalance, payrollTotal } from '../../store/useAppStore'
import { useTranslation } from '../../i18n/useTranslation'
import { pipelineForType } from '../../data/statusPipelines'
import type { Applicant, Bilingual, RecruitmentRequest } from '../../types'

/** Days a request can sit on the same stage before the desk should look at it. */
const STALLED_AFTER_DAYS = 21
/** Passports inside this window need renewing before a deployment can be booked. */
const PASSPORT_WARNING_DAYS = 180
/** An invoice older than this with money outstanding is chased. */
const INVOICE_OVERDUE_DAYS = 30

export type AlertKind = 'stalled' | 'passport' | 'invoice' | 'payroll'

export interface Alert {
  id: string
  kind: AlertKind
  title: string
  detail: string
  /** Days past the threshold, used to sort the most urgent to the top. */
  weight: number
  to: string
}

export interface StageCount {
  label: string
  count: number
}

export interface ActivityItem {
  id: string
  worker: string
  stage: string
  date: string
  by: string
  to: string
}

export interface AgencyLoad {
  id: string
  name: string
  workers: number
  deployed: number
}

function daysBetween(from: string, to: Date): number {
  const start = new Date(from)
  if (Number.isNaN(start.getTime())) return 0
  return Math.floor((to.getTime() - start.getTime()) / 86_400_000)
}

function isActive(request: RecruitmentRequest): boolean {
  const status = currentStatus(request)
  if (!status) return true
  const definition = pipelineForType(request.type).find((step) => step.label === status)
  return !definition?.isTerminal
}

export function useOverview() {
  const applicants = useAppStore((s) => s.applicants)
  const agencies = useAppStore((s) => s.agencies)
  const employers = useAppStore((s) => s.employers)
  const requests = useAppStore((s) => s.requests)
  const invoices = useAppStore((s) => s.invoices)
  const staff = useAppStore((s) => s.staff)
  const payroll = useAppStore((s) => s.payroll)
  const { language } = useTranslation()

  return useMemo(() => {
    const today = new Date()
    const pick = (value: Bilingual) => value[language] || value.en
    const nameOf = (applicant: Applicant | undefined) =>
      applicant ? pick({ en: applicant.englishName, ar: applicant.arabicName }) : '-'

    const activeRequests = requests.filter(isActive)

    // Where the active caseload actually sits, in pipeline order.
    const stageCounts = new Map<string, number>()
    for (const request of activeRequests) {
      const status = currentStatus(request)
      if (!status) continue
      stageCounts.set(status, (stageCounts.get(status) ?? 0) + 1)
    }
    const order = new Map(pipelineForType('Domestic').map((step) => [step.label, step.order]))
    const stages: StageCount[] = [...stageCounts.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => (order.get(a.label) ?? 99) - (order.get(b.label) ?? 99))

    const alerts: Alert[] = []

    for (const request of activeRequests) {
      const idle = daysBetween(request.updatedOn, today)
      if (idle < STALLED_AFTER_DAYS) continue
      const applicant = applicants.find((a) => a.id === request.applicantId)
      alerts.push({
        id: `stalled-${request.id}`,
        kind: 'stalled',
        title: nameOf(applicant),
        detail:
          language === 'ar'
            ? `${currentStatus(request) ?? 'لم يبدأ'} · بدون تحديث منذ ${idle} يومًا`
            : `${currentStatus(request) ?? 'Not started'}, no update in ${idle} days`,
        weight: idle,
        to: `/recruitments/${request.id}`,
      })
    }

    for (const applicant of applicants) {
      if (!applicant.passportEnd) continue
      const daysLeft = -daysBetween(applicant.passportEnd, today)
      if (daysLeft > PASSPORT_WARNING_DAYS) continue
      alerts.push({
        id: `passport-${applicant.id}`,
        kind: 'passport',
        title: nameOf(applicant),
        detail:
          daysLeft < 0
            ? language === 'ar'
              ? `انتهى جواز السفر قبل ${Math.abs(daysLeft)} يومًا`
              : `Passport expired ${Math.abs(daysLeft)} days ago`
            : language === 'ar'
              ? `ينتهي جواز السفر خلال ${daysLeft} يومًا`
              : `Passport expires in ${daysLeft} days`,
        weight: PASSPORT_WARNING_DAYS - daysLeft,
        to: `/applicants/${applicant.id}`,
      })
    }

    for (const invoice of invoices) {
      const balance = invoiceBalance(invoice)
      if (balance <= 0) continue
      const age = daysBetween(invoice.issuedOn, today)
      if (age < INVOICE_OVERDUE_DAYS) continue
      const employer = employers.find((e) => e.id === invoice.employerId)
      alerts.push({
        id: `invoice-${invoice.id}`,
        kind: 'invoice',
        title: invoice.invoiceNumber,
        detail:
          language === 'ar'
            ? `${employer ? pick({ en: employer.englishName, ar: employer.arabicName }) : ''} · مستحق منذ ${age} يومًا`
            : `${employer ? pick({ en: employer.englishName, ar: employer.arabicName }) : ''}, outstanding for ${age} days`,
        weight: age,
        to: '/invoices',
      })
    }

    const pendingPayroll = payroll.filter((entry) => entry.status === 'Pending')
    if (pendingPayroll.length > 0) {
      const amount = pendingPayroll.reduce((sum, entry) => sum + payrollTotal(entry), 0)
      alerts.push({
        id: 'payroll-pending',
        kind: 'payroll',
        title: language === 'ar' ? 'رواتب غير مدفوعة' : 'Salaries not released',
        detail:
          language === 'ar'
            ? `${pendingPayroll.length} سجل بانتظار الصرف`
            : `${pendingPayroll.length} entries waiting to be paid`,
        weight: amount,
        to: '/accounting/payroll',
      })
    }

    alerts.sort((a, b) => b.weight - a.weight)

    // Latest stage updates across the whole desk, newest first.
    const activity: ActivityItem[] = requests
      .flatMap((request) => {
        const applicant = applicants.find((a) => a.id === request.applicantId)
        return request.statusHistory.map((entry) => ({
          id: entry.id,
          worker: nameOf(applicant),
          stage: entry.status,
          date: entry.date,
          by: staff.find((m) => m.id === entry.responsibleEmployeeId)?.name?.[language] ?? '',
          to: `/recruitments/${request.id}`,
        }))
      })
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
      .slice(0, 7)

    const agencyLoad: AgencyLoad[] = agencies
      .map((agency) => {
        const own = applicants.filter((a) => a.recruitmentAgencyId === agency.id)
        return {
          id: agency.id,
          name: pick({ en: agency.englishName, ar: agency.arabicName }),
          workers: own.length,
          deployed: own.filter((a) => a.status === 'Deployed').length,
        }
      })
      .sort((a, b) => b.workers - a.workers)

    return {
      stages,
      alerts,
      activity,
      agencyLoad,
      counts: {
        workers: applicants.length,
        available: applicants.filter((a) => a.status === 'Available').length,
        activePlacements: activeRequests.length,
        deployed: applicants.filter((a) => a.status === 'Deployed').length,
        receivables: invoices.reduce((sum, invoice) => sum + invoiceBalance(invoice), 0),
        openInvoices: invoices.filter((invoice) => invoiceBalance(invoice) > 0).length,
      },
    }
  }, [applicants, agencies, employers, requests, invoices, staff, payroll, language])
}
