/*
  The CV: what the office adds to her record, and what comes out of it.

  Two directions, both from here. Filling the fields below and pressing Build
  produces the agency's own template with her details in it -- to look at, to
  print or save as PDF, and to publish as the CV the website links to. Reading
  a CV she arrived with goes the other way, and is upstairs in the Documents
  tab's import.
*/

import { useEffect, useMemo, useState } from 'react'
import { Download, FileText, Globe, Printer } from 'lucide-react'
import { useAppStore } from '../../../store/useAppStore'
import { useTranslation } from '../../../i18n/useTranslation'
import { buildCvHtml, cvFileNameFor } from '../../../lib/cvDocument'
import { photoAsDataUrl } from '../../../lib/cvPhoto'
import { setWorkerCv } from '../../../lib/cvs'
import CvImport from './CvImport'
import { Field, TextInput, PrimaryButton, SecondaryButton } from '../../../components/form'
import type { Applicant, CvDetails } from '../../../types'

type Line = { key: keyof CvDetails; en: string; ar: string; long?: boolean }

const PERSONAL: Line[] = [
  { key: 'jobTitle', en: 'Job title', ar: 'المهنة' },
  { key: 'maritalStatus', en: 'Marital status', ar: 'الحالة الاجتماعية' },
  { key: 'religion', en: 'Religion', ar: 'الديانة' },
  { key: 'currentLocation', en: 'Current location', ar: 'مكان الإقامة' },
  { key: 'email', en: 'Email', ar: 'البريد الإلكتروني' },
  { key: 'reference', en: 'Reference no.', ar: 'الرقم المرجعي' },
]

const PROFILE: Line[] = [
  { key: 'profileEn', en: 'Profile (English)', ar: 'النبذة بالإنجليزية', long: true },
  { key: 'profileAr', en: 'Profile (Arabic)', ar: 'النبذة بالعربية', long: true },
]

const SKILLS: Line[] = [
  { key: 'coreSkills', en: 'Core skills', ar: 'المهارات الأساسية', long: true },
  { key: 'specialization', en: 'Specialization', ar: 'التخصص' },
  { key: 'tools', en: 'Tools & equipment', ar: 'الأدوات والمعدات', long: true },
  { key: 'safety', en: 'Safety', ar: 'السلامة المهنية' },
  { key: 'overseasExperience', en: 'Overseas experience', ar: 'خبرة خارجية' },
  { key: 'languages', en: 'Languages', ar: 'اللغات' },
]

const EDUCATION: Line[] = [
  { key: 'education', en: 'Education', ar: 'المؤهل', long: true },
  { key: 'technicalTraining', en: 'Technical training', ar: 'التدريب الفني' },
  { key: 'tesda', en: 'TESDA / Training', ar: 'تدريب' },
  { key: 'otherCertificates', en: 'Other certificates', ar: 'شهادات أخرى' },
  { key: 'certificateNo', en: 'Certificate no.', ar: 'رقم الشهادة' },
]

const PLACEMENT: Line[] = [
  { key: 'placeOfIssue', en: 'Passport place of issue', ar: 'مكان إصدار الجواز' },
  { key: 'availability', en: 'Availability', ar: 'التوفر' },
  { key: 'expectedSalary', en: 'Expected salary', ar: 'الراتب المتوقع' },
  { key: 'preferredCountry', en: 'Preferred country', ar: 'الدولة المفضلة' },
  { key: 'client', en: 'Client', ar: 'العميل' },
  { key: 'interviewStatus', en: 'Interview status', ar: 'حالة المقابلة' },
]

export default function CvTab({ applicant }: { applicant: Applicant }) {
  const updateApplicant = useAppStore((s) => s.updateApplicant)
  const settings = useAppStore((s) => s.settings)
  const requests = useAppStore((s) => s.requests)
  const employers = useAppStore((s) => s.employers)
  const { t, tb, language } = useTranslation()
  const ar = language === 'ar'

  const [photo, setPhoto] = useState<string | null>(null)
  // The seal is a data URL of its own weight, and most of the dashboard never
  // needs it: fetched when this tab opens rather than carried everywhere.
  const [logo, setLogo] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  // Her latest request names the client and the stage she has reached, which
  // the template asks for and the record already knows.
  const latest = useMemo(
    () =>
      requests
        .filter((r) => r.applicantId === applicant.id)
        .sort((a, b) => (a.createdOn < b.createdOn ? 1 : -1))[0] ?? null,
    [requests, applicant.id],
  )
  const client = employers.find((e) => e.id === latest?.employerId)
  const stage = latest?.statusHistory[latest.statusHistory.length - 1]?.status ?? ''

  useEffect(() => {
    let live = true
    void photoAsDataUrl(applicant).then((data) => {
      if (live) setPhoto(data)
    })
    void import('../../../lib/cvAsset').then((asset) => {
      if (live) setLogo(asset.LOGO_DATA_URL)
    })
    return () => {
      live = false
    }
  }, [applicant])

  // Derived rather than kept: an edit on the left is on the page beside it, so
  // nobody prints yesterday's version and there is no Rebuild to remember.
  const html = useMemo(
    () =>
      buildCvHtml({
        applicant,
        company: {
          name: settings.companyName,
          tagline: settings.companyTagline,
          licenceNumber: settings.licenseNumber,
          address: settings.address,
        },
        photo,
        logo,
        client: client ? tb({ en: client.englishName, ar: client.arabicName }) : '',
        interviewStatus: stage,
      }),
    [applicant, settings, photo, logo, client, stage, tb],
  )

  function set(key: keyof CvDetails, value: string) {
    updateApplicant(applicant.id, { cvDetails: { ...applicant.cvDetails, [key]: value } })
  }

  function download() {
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = cvFileNameFor(applicant)
    link.click()
    URL.revokeObjectURL(url)
  }

  function print() {
    const frame = document.getElementById('cv-preview') as HTMLIFrameElement | null
    frame?.contentWindow?.focus()
    frame?.contentWindow?.print()
  }

  async function publish() {
    setBusy(true)
    setNotice(null)
    try {
      const file = new File([html], cvFileNameFor(applicant), { type: 'text/html' })
      await setWorkerCv(applicant, file)
      setNotice(t('cv_published'))
    } catch (problem) {
      setNotice(problem instanceof Error ? problem.message : String(problem))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div className="flex flex-col gap-4">
        <div className="rounded-panel border border-line bg-surface p-4">
          <h2 className="panel-title">{t('cv_title')}</h2>
          <p className="mt-0.5 text-[11px] text-ink-3">{t('cv_subtitle')}</p>

          <div className="mt-3 flex flex-wrap gap-2">
            <PrimaryButton onClick={publish} disabled={busy} className="flex items-center gap-1.5">
              <Globe className="size-3.5" /> {t('cv_publish')}
            </PrimaryButton>
            <SecondaryButton onClick={print} className="flex items-center gap-1.5">
              <Printer className="size-3.5" /> {t('cv_print')}
            </SecondaryButton>
            <SecondaryButton onClick={download} className="flex items-center gap-1.5">
              <Download className="size-3.5" /> {t('cv_download')}
            </SecondaryButton>
          </div>

          {notice && (
            <p className="mt-3 rounded-control border border-accent-line bg-accent-soft px-3 py-2 text-[11.5px] text-accent-text">
              {notice}
            </p>
          )}

          <p className="mt-3 flex items-start gap-1.5 text-[10.5px] leading-relaxed text-ink-3">
            <FileText className="mt-px size-3.5 shrink-0" />
            {t('cv_publish_hint')}
          </p>
        </div>

        <CvImport applicant={applicant} />

        <Group title={ar ? 'التفاصيل الشخصية' : 'Personal details'} lines={PERSONAL} applicant={applicant} onSet={set} ar={ar} />
        <Group title={ar ? 'النبذة المهنية' : 'Professional profile'} lines={PROFILE} applicant={applicant} onSet={set} ar={ar} />
        <Group title={ar ? 'المهارات' : 'Skills'} lines={SKILLS} applicant={applicant} onSet={set} ar={ar} />
        <Group title={ar ? 'التعليم والشهادات' : 'Education & certifications'} lines={EDUCATION} applicant={applicant} onSet={set} ar={ar} />
        <Group title={ar ? 'التوظيف' : 'Placement'} lines={PLACEMENT} applicant={applicant} onSet={set} ar={ar} />
      </div>

      <div className="rounded-panel border border-line bg-surface p-3">
        <p className="mb-2 text-[11px] text-ink-3">{t('cv_preview')}</p>
        <iframe
          id="cv-preview"
          title={t('cv_preview')}
          srcDoc={html}
          className="h-[80vh] w-full rounded-control border border-line bg-white"
        />
      </div>
    </div>
  )
}

function Group({
  title,
  lines,
  applicant,
  onSet,
  ar,
}: {
  title: string
  lines: Line[]
  applicant: Applicant
  onSet: (key: keyof CvDetails, value: string) => void
  ar: boolean
}) {
  return (
    <div className="rounded-panel border border-line bg-surface p-4">
      <h2 className="mb-3 panel-title">{title}</h2>
      <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
        {lines.map((line) => (
          <div key={line.key} className={line.long ? 'sm:col-span-2' : undefined}>
            <Field label={ar ? line.ar : line.en}>
              <TextInput
                value={applicant.cvDetails[line.key]}
                onChange={(event) => onSet(line.key, event.target.value)}
              />
            </Field>
          </div>
        ))}
      </div>
    </div>
  )
}
