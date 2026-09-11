import { useRef } from 'react'
import { Camera, MoreHorizontal, User } from 'lucide-react'
import { useAppStore, currentStatus, requestCost, invoiceTotalPaid, formatMoney } from '../../../store/useAppStore'
import { useTranslation } from '../../../i18n/useTranslation'
import type { Applicant, ApplicantStatus, RecruitmentRequest, Invoice } from '../../../types'

function MetaRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex h-4 items-center">
      <span className="w-28 shrink-0 text-[11px] text-[var(--text-muted)]">{label}</span>
      <span className="text-[11px] text-[var(--text-primary)]">{value}</span>
    </div>
  )
}

function MoneyLine({
  label,
  amount,
  color,
  bold,
  border,
}: {
  label: string
  amount: number
  color: string
  bold?: boolean
  border?: boolean
}) {
  return (
    <div className={`flex w-full items-center justify-between ${border ? 'border-t border-[var(--edge-soft)] pt-[7px]' : ''}`}>
      <span className={`text-xs ${bold ? 'font-bold' : ''}`} style={{ color: bold ? color : 'var(--text-secondary)' }}>
        {label}
      </span>
      <span className={`text-xs tracking-[0.3px] ${bold ? 'font-bold' : ''}`} style={{ color }}>
        {formatMoney(amount)}
      </span>
    </div>
  )
}

function ageFromDob(dob: string): number | null {
  if (!dob) return null
  const birth = new Date(dob)
  if (Number.isNaN(birth.getTime())) return null
  return Math.floor((Date.now() - birth.getTime()) / (1000 * 60 * 60 * 24 * 365.25))
}

const STATUS_OPTIONS: ApplicantStatus[] = ['Available', 'Unavailable', 'Selected', 'Deployed']

export default function Header({
  applicant,
  activeRequest,
  invoice,
}: {
  applicant: Applicant
  activeRequest: RecruitmentRequest | null
  invoice: Invoice | null
}) {
  const updateApplicant = useAppStore((s) => s.updateApplicant)
  const employers = useAppStore((s) => s.employers)
  const { language } = useTranslation()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const employer = activeRequest ? employers.find((e) => e.id === activeRequest.employerId) : undefined
  const age = ageFromDob(applicant.dob)
  const totalExpenses = activeRequest ? requestCost(activeRequest) : 0
  const totalIncome = invoice ? invoiceTotalPaid(invoice) : 0
  const netProfit = totalIncome - totalExpenses
  const profitMargin = totalIncome === 0 ? 0 : (netProfit / totalIncome) * 100

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => updateApplicant(applicant.id, { photoDataUrl: reader.result as string })
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-8 flex items-center gap-5 rounded-lg border border-[var(--edge)] bg-[var(--surface)] p-[17px]">
        <div className="flex flex-col items-center">
          <div className="flex size-24 items-center justify-center overflow-hidden rounded-full border-2 border-amber-500/50 bg-[var(--surface-hover)] p-1 shadow-md">
            <div className="flex size-full items-center justify-center overflow-hidden rounded-full bg-[var(--surface-hover)]">
              {applicant.photoDataUrl ? (
                <img src={applicant.photoDataUrl} alt={applicant.englishName} className="size-full object-cover" />
              ) : (
                <User className="size-10 text-[var(--text-muted)]" />
              )}
            </div>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-2 flex items-center gap-1 rounded border border-[var(--edge-strong)] bg-[var(--surface-hover)] px-2.5 py-1 text-[10px] text-[var(--text-secondary)] shadow-sm hover:border-amber-500/40"
          >
            <Camera className="size-3" /> {language === 'ar' ? 'تغيير الصورة' : 'Change Photo'}
          </button>
        </div>

        <div className="flex-1">
          <div className="mb-2.5 flex items-center gap-3">
            <h1 className="text-lg font-bold uppercase tracking-[0.45px] text-[var(--text-primary)]">
              {language === 'ar' ? applicant.arabicName || applicant.englishName : applicant.englishName}
            </h1>
            <select
              value={applicant.status}
              onChange={(e) => updateApplicant(applicant.id, { status: e.target.value as ApplicantStatus })}
              className="rounded border border-emerald-500/40 bg-emerald-950/80 px-2 py-0.5 text-[10px] font-bold text-emerald-400 focus:outline-none"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s} className="bg-slate-900 text-slate-200">
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1">
            <MetaRow
              label={language === 'ar' ? 'رقم الملف' : 'File No.'}
              value={activeRequest?.mosanedNumber || (activeRequest ? (language === 'ar' ? 'لم يُعيّن بعد' : 'Not yet assigned') : '—')}
            />
            <MetaRow label={language === 'ar' ? 'صاحب العمل' : 'Client'} value={employer ? employer.englishName : '—'} />
            <MetaRow label={language === 'ar' ? 'الجنسية' : 'Nationality'} value={applicant.country} />
            <MetaRow
              label={language === 'ar' ? 'نوع العقد' : 'Contract Type'}
              value={activeRequest ? `${activeRequest.contractDurationMonths} ${language === 'ar' ? 'شهر' : 'months'}` : '—'}
            />
            <MetaRow label={language === 'ar' ? 'العمر' : 'Age'} value={age !== null ? `${age} ${language === 'ar' ? 'سنة' : 'yrs'}` : '—'} />
            <MetaRow
              label={language === 'ar' ? 'المرحلة الحالية' : 'Current Stage'}
              value={
                <span className="rounded border border-blue-500/50 bg-blue-900/60 px-2.5 py-0.5 text-[10px] text-blue-300">
                  {activeRequest ? (currentStatus(activeRequest) ?? (language === 'ar' ? 'لم يبدأ' : 'Not started')) : '—'}
                </span>
              }
            />
            <MetaRow label={language === 'ar' ? 'رقم الجواز' : 'Passport No.'} value={applicant.passportNo} />
            <MetaRow label={language === 'ar' ? 'رقم الجوال' : 'Mobile No.'} value={applicant.phone || '—'} />
          </div>
        </div>
      </div>

      <div className="col-span-4 flex flex-col justify-between rounded-lg border border-[var(--edge)] bg-[var(--surface)] p-[17px]">
        <div className="flex items-center justify-between border-b border-[var(--edge-soft)] pb-[9px]">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.55px] text-[var(--text-secondary)]">
            {language === 'ar' ? 'الملخص المالي' : 'Financial Summary'}
          </h2>
          <button type="button" className="text-[var(--text-muted)] hover:text-[var(--text-secondary)]">
            <MoreHorizontal className="size-3.5" />
          </button>
        </div>
        <div className="flex flex-col gap-1.5 py-2">
          <MoneyLine label={language === 'ar' ? 'إجمالي التكلفة' : 'Total Expenses'} amount={totalExpenses} color="#f43f5e" />
          <MoneyLine label={language === 'ar' ? 'إجمالي الدخل' : 'Total Income'} amount={totalIncome} color="#34d399" />
          <MoneyLine label={language === 'ar' ? 'صافي الربح' : 'Net Profit'} amount={netProfit} color="#fbbf24" bold border />
          <div className="flex w-full items-center justify-between">
            <span className="text-xs text-[var(--text-secondary)]">{language === 'ar' ? 'هامش الربح' : 'Profit Margin'}</span>
            <span className="text-xs font-bold text-sky-400">{profitMargin.toFixed(2)}%</span>
          </div>
        </div>
        <div className="border-t border-[var(--edge-soft2)] pt-[5px] text-end text-[9px] text-[var(--text-muted)]">
          {language === 'ar' ? 'محدث' : 'Updated'} {applicant.updatedOn} {language === 'ar' ? 'بواسطة' : 'by'} {applicant.updatedBy}
        </div>
      </div>
    </div>
  )
}
