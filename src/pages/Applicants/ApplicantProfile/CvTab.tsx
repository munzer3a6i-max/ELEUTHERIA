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
import { buildCvHtml, cvFileNameFor, templateFor } from '../../../lib/cvDocument'
import { fullBodyAsDataUrl, passportCopyAsDataUrl, photoAsDataUrl } from '../../../lib/cvPhoto'
import { setWorkerCv } from '../../../lib/cvs'
import CvImport from './CvImport'
import CvPictures from './CvPictures'
import { Field, TextInput, PrimaryButton, SecondaryButton } from '../../../components/form'
import type { Applicant, CvDetails } from '../../../types'

type Line = { key: keyof CvDetails; en: string; ar: string; long?: boolean; hint?: string }

type Group = { en: string; ar: string; lines: Line[] }

/** What the professional curriculum vitae asks for beyond the record. */
const PROFESSIONAL: Group[] = [
  {
    en: 'Heading',
    ar: 'الترويسة',
    lines: [
      { key: 'jobTitle', en: 'Job title', ar: 'المهنة' },
      { key: 'reference', en: 'Reference no.', ar: 'الرقم المرجعي' },
    ],
  },
  {
    en: 'Professional profile',
    ar: 'النبذة المهنية',
    lines: [
      { key: 'profileEn', en: 'Profile (English)', ar: 'النبذة بالإنجليزية', long: true },
      { key: 'profileAr', en: 'Profile (Arabic)', ar: 'النبذة بالعربية', long: true },
    ],
  },
  {
    en: 'Personal details',
    ar: 'البيانات الشخصية',
    lines: [
      { key: 'maritalStatus', en: 'Marital status', ar: 'الحالة الاجتماعية' },
      { key: 'religion', en: 'Religion', ar: 'الديانة' },
      { key: 'currentLocation', en: 'Current location', ar: 'مكان الإقامة' },
      { key: 'email', en: 'Email', ar: 'البريد الإلكتروني' },
    ],
  },
  {
    en: 'Education & certifications',
    ar: 'التعليم والشهادات',
    lines: [
      { key: 'education', en: 'Education', ar: 'المؤهل', long: true },
      { key: 'technicalTraining', en: 'Technical training', ar: 'التدريب الفني' },
      { key: 'tesda', en: 'TESDA / Training', ar: 'تدريب' },
      { key: 'otherCertificates', en: 'Other certificates', ar: 'شهادات أخرى' },
      { key: 'certificateNo', en: 'Certificate no.', ar: 'رقم الشهادة' },
      { key: 'languages', en: 'Languages', ar: 'اللغات' },
    ],
  },
]

/** What the domestic bio data asks for, which is a different list. */
const DOMESTIC: Group[] = [
  {
    en: 'The posting',
    ar: 'بيانات الوظيفة',
    lines: [
      { key: 'postApplied', en: 'Post applied', ar: 'الوظيفة' },
      { key: 'destinationCountry', en: 'Country', ar: 'الدولة', hint: 'KSA unless you say otherwise' },
      { key: 'monthlySalary', en: 'Monthly salary', ar: 'الراتب الشهري' },
      { key: 'contractPeriod', en: 'Contract period', ar: 'مدة العقد', hint: 'Two years unless you say otherwise' },
      { key: 'reference', en: 'Reference no.', ar: 'الرقم المرجعي' },
    ],
  },
  {
    en: 'Personal data',
    ar: 'المعلومات الشخصية',
    lines: [
      { key: 'religion', en: 'Religion', ar: 'الديانة' },
      { key: 'placeOfBirth', en: 'Place of birth', ar: 'مكان الميلاد' },
      { key: 'livingTown', en: 'Living town', ar: 'مكان السكن' },
      { key: 'maritalStatus', en: 'Marital status', ar: 'الحالة الاجتماعية' },
      { key: 'children', en: 'No. of children', ar: 'عدد الأطفال' },
      { key: 'height', en: 'Height', ar: 'الطول' },
      { key: 'weight', en: 'Weight', ar: 'الوزن' },
      { key: 'motherName', en: "Mother's full name", ar: 'اسم الأم كامل' },
      { key: 'fatherName', en: "Father's full name", ar: 'اسم الأب كامل' },
      { key: 'nextOfKin', en: 'Next of kin', ar: 'اسم أحد الأقارب' },
    ],
  },
  {
    en: 'Passport, language & education',
    ar: 'الجواز واللغة والتعليم',
    lines: [
      { key: 'placeOfIssue', en: 'Passport place of issue', ar: 'مكان الإصدار' },
      { key: 'english', en: 'English', ar: 'الإنجليزية' },
      { key: 'arabic', en: 'Arabic', ar: 'العربية' },
      { key: 'education', en: 'Education', ar: 'التعليم' },
    ],
  },
  {
    en: 'Skills & experience',
    ar: 'خبرة العمل',
    lines: [
      { key: 'skillBabySitting', en: 'Baby sitting', ar: 'عناية الرضع' },
      { key: 'skillChildrenCare', en: 'Children care', ar: 'عناية الطفل' },
      { key: 'skillTutoring', en: 'Tutoring', ar: 'تعليم الأطفال' },
      { key: 'skillElderlyCare', en: 'Elderly care', ar: 'عناية كبار السن' },
      { key: 'skillCleaning', en: 'Cleaning', ar: 'التنظيف' },
      { key: 'skillWashing', en: 'Washing', ar: 'الغسيل' },
      { key: 'skillIroning', en: 'Ironing', ar: 'الكوي' },
      { key: 'skillCooking', en: 'Cooking', ar: 'الطبخ' },
    ],
  },
]

export default function CvTab({ applicant }: { applicant: Applicant }) {
  const updateApplicant = useAppStore((s) => s.updateApplicant)
  const settings = useAppStore((s) => s.settings)
  const { t, language } = useTranslation()
  const ar = language === 'ar'

  const [photo, setPhoto] = useState<string | null>(null)
  const [fullBody, setFullBody] = useState<string | null>(null)
  const [passportCopy, setPassportCopy] = useState<string | null>(null)
  // The letterheads are data URLs of their own weight, and most of the
  // dashboard never needs them: fetched when this tab opens rather than
  // carried everywhere.
  const [letterhead, setLetterhead] = useState<{ logo: string; partner: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  // Her type picks the document unless somebody has said otherwise, and what
  // they said is on the record rather than in this screen's memory.
  const template = templateFor(applicant)
  const groups = template === 'domestic' ? DOMESTIC : PROFESSIONAL

  useEffect(() => {
    let live = true
    void photoAsDataUrl(applicant).then((data) => {
      if (live) setPhoto(data)
    })
    void fullBodyAsDataUrl(applicant).then((data) => {
      if (live) setFullBody(data)
    })
    void passportCopyAsDataUrl(applicant).then((data) => {
      if (live) setPassportCopy(data)
    })
    void import('../../../lib/cvAsset').then((asset) => {
      if (live) setLetterhead({ logo: asset.LOGO_DATA_URL, partner: asset.PARTNER_LOGO_DATA_URL })
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
          website: settings.website,
          phones: settings.phones,
          email: settings.email,
        },
        photo,
        fullBody,
        passportCopy,
        logo: letterhead?.logo ?? null,
        partnerLogo: letterhead?.partner ?? null,
        template,
      }),
    [applicant, settings, photo, fullBody, passportCopy, letterhead, template],
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

          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-ink-3">{t('cv_template')}</span>
            {(
              [
                ['', ar ? `حسب نوعها (${applicant.type === 'Domestic' ? 'بيانات' : 'سيرة'})` : `Follow her type (${applicant.type === 'Domestic' ? 'bio data' : 'CV'})`],
                ['domestic', t('cv_template_domestic')],
                ['professional', t('cv_template_professional')],
              ] as [CvDetails['template'], string][]
            ).map(([value, label]) => (
              <button
                key={value || 'auto'}
                type="button"
                onClick={() => set('template', value)}
                className={`rounded-control px-2.5 py-1.5 text-[11px] ${
                  applicant.cvDetails.template === value
                    ? 'bg-accent-soft text-accent-text'
                    : 'border border-line text-ink-2 hover:bg-raised'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

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

        <CvPictures applicant={applicant} />

        <CvImport applicant={applicant} />

        {groups.map((group) => (
          <Group key={group.en} title={ar ? group.ar : group.en} lines={group.lines} applicant={applicant} onSet={set} ar={ar} />
        ))}
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
            <Field label={ar ? line.ar : line.en} hint={line.hint}>
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
