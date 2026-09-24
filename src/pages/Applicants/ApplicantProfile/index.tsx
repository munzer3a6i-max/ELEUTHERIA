import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Printer, Send } from 'lucide-react'
import { useAppStore, requestCost, invoiceTotalPaid, formatMoney } from '../../../store/useAppStore'
import { useTranslation } from '../../../i18n/useTranslation'
import { useCurrentUser } from '../../../lib/useCurrentUser'
import Confirm from '../../../components/Confirm'
import { removeApplicant, whyNotDelete } from '../../../lib/applicants'
import Header from './Header'
import ProfileTabs, { type ProfileTabKey } from './ProfileTabs'
import StageStepper from './StageStepper'
import InfoTab from './InfoTab'
import RecruitmentStagesTab from './RecruitmentStagesTab'
import FinancialCenter from './FinancialCenter'
import DocumentsTab from './DocumentsTab'
import NotesTab from './NotesTab'

export default function ApplicantProfile() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const applicant = useAppStore((s) => s.applicants.find((a) => a.id === id))
  const { language } = useTranslation()

  if (!applicant) {
    return (
      <div className="flex flex-col items-center gap-3 p-10 text-center">
        <p className="text-sm text-ink">{language === 'ar' ? 'المتقدم غير موجود.' : 'Applicant not found.'}</p>
        <Link to="/applicants" className="text-xs text-accent-text hover:text-accent">
          {language === 'ar' ? 'العودة إلى المتقدمين' : 'Back to Applicants'}
        </Link>
      </div>
    )
  }

  return <ApplicantProfileContent key={applicant.id} applicantId={applicant.id} onDeleted={() => navigate('/applicants')} />
}

function ApplicantProfileContent({ applicantId, onDeleted }: { applicantId: string; onDeleted: () => void }) {
  const applicant = useAppStore((s) => s.applicants.find((a) => a.id === applicantId))
  const allRequests = useAppStore((s) => s.requests)
  const invoices = useAppStore((s) => s.invoices)
  const { t, language } = useTranslation()
  const { canEdit } = useCurrentUser()
  const [activeTab, setActiveTab] = useState<ProfileTabKey>('financial')
  const [removing, setRemoving] = useState(false)
  const [refused, setRefused] = useState<number | null>(null)

  if (!applicant) {
    onDeleted()
    return null
  }

  const linkedRequests = allRequests
    .filter((r) => r.applicantId === applicantId)
    .sort((a, b) => (a.createdOn < b.createdOn ? 1 : -1))
  const activeRequest = linkedRequests[0] ?? null
  const invoice = activeRequest ? (invoices.find((i) => i.recruitmentRequestId === activeRequest.id) ?? null) : null

  function handlePrint() {
    window.print()
  }

  function handleSendToClient() {
    const cost = activeRequest ? requestCost(activeRequest) : 0
    const paid = invoice ? invoiceTotalPaid(invoice) : 0
    const subject = encodeURIComponent(`Applicant Summary - ${applicant!.englishName}`)
    const body = encodeURIComponent(
      `Applicant: ${applicant!.englishName}\nPassport No.: ${applicant!.passportNo}\n\n` +
        `Total Expenses: ${formatMoney(cost)}\nTotal Income: ${formatMoney(paid)}\nNet: ${formatMoney(paid - cost)}`,
    )
    window.location.href = `mailto:?subject=${subject}&body=${body}`
  }

  function askToDelete() {
    // The database refuses a worker who is on a request, and a refusal after
    // the fact reads as the delete simply not working.
    const blocked = whyNotDelete(applicantId)
    if (blocked.kind === 'has-requests') setRefused(blocked.count)
    else setRemoving(true)
  }

  function handleDeleteApplicant() {
    const doomed = applicant!
    setRemoving(false)
    void removeApplicant(doomed).then((outcome) => {
      if (outcome.kind === 'has-requests') setRefused(outcome.count)
    })
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <nav className="flex min-w-0 items-center gap-1.5 text-xs text-ink-2">
          <Link to="/applicants" className="hover:text-ink">
            {t('nav_applicants')}
          </Link>
          <span>/</span>
          <span className="truncate text-ink">{applicant.englishName}</span>
        </nav>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="btn btn-secondary"
          >
            <Printer className="size-3.5" /> {language === 'ar' ? 'طباعة' : 'Print'}
          </button>
          <button
            type="button"
            onClick={handleSendToClient}
            className="btn btn-secondary"
          >
            <Send className="size-3.5" /> {language === 'ar' ? 'إرسال للعميل' : 'Send to Client'}
          </button>
          {canEdit('operations') && (
            <button
              type="button"
              onClick={askToDelete}
              className="btn btn-danger"
            >
              {t('action_delete')}
            </button>
          )}
        </div>
      </div>

      {removing && (
        <Confirm
          title={t('applicant_delete_title')}
          message={t('applicant_delete_confirm')}
          detail={`${applicant.englishName} — ${applicant.passportNo || applicant.profession}`}
          confirmLabel={t('action_delete')}
          tone="danger"
          onConfirm={handleDeleteApplicant}
          onClose={() => setRemoving(false)}
        />
      )}

      {refused !== null && (
        <Confirm
          title={t('applicant_has_requests_title')}
          message={t('applicant_has_requests')}
          detail={`${t('applicant_requests_count')} ${refused}`}
          confirmLabel={t('action_ok')}
          tone="danger"
          withoutCancel
          onConfirm={() => setRefused(null)}
          onClose={() => setRefused(null)}
        />
      )}

      <Header applicant={applicant} activeRequest={activeRequest} invoice={invoice} />
      <ProfileTabs active={activeTab} onChange={setActiveTab} />

      {activeTab === 'financial' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-3">
            <StageStepper
              requestType={applicant.type}
              request={activeRequest}
              onEditStages={() => setActiveTab('stages')}
            />
          </div>
          <div className="lg:col-span-9">
            <FinancialCenter applicant={applicant} activeRequest={activeRequest} />
          </div>
        </div>
      )}
      {activeTab === 'info' && <InfoTab applicant={applicant} />}
      {activeTab === 'stages' && <RecruitmentStagesTab activeRequest={activeRequest} />}
      {activeTab === 'documents' && <DocumentsTab applicant={applicant} />}
      {activeTab === 'notes' && <NotesTab applicant={applicant} />}

      <div className="flex items-center justify-between border-t border-line pt-3 text-[10px] text-ink-3">
        <p>
          <span className="text-ink-2">{language === 'ar' ? 'ملاحظة:' : 'Note:'}</span>{' '}
          {language === 'ar' ? 'جميع المبالغ بالدولار الأمريكي' : 'All amounts are in US Dollars (USD)'}
        </p>
        <p>
          {language === 'ar' ? 'أُنشئ' : 'Created'}: {applicant.createdOn} | {language === 'ar' ? 'آخر تحديث' : 'Last Updated'}: {applicant.updatedOn} {language === 'ar' ? 'بواسطة' : 'by'} {applicant.updatedBy}
        </p>
      </div>
    </div>
  )
}
