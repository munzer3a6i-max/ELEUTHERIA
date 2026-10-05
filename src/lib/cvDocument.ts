/*
  The agency's two CVs, built from the record.

  A domestic worker goes to a household on a bio data sheet; a tradesman goes
  to an employer on a curriculum vitae. They are different documents with
  different questions on them, so there are two templates here and the worker's
  type picks one unless the office says otherwise.

  Both are produced as one self-contained HTML document, which is the same
  string the office previews, prints to PDF, downloads and publishes as her CV.
  One source, so the file a client opens is the page that was approved. Nothing
  here invents content: an empty field prints the dash the paper form has,
  because a CV with gaps is honest and one that fills them in is not.
*/

import type { Applicant, ExperienceEntry } from '../types'

export type CvTemplate = 'professional' | 'domestic'

export interface CvInput {
  applicant: Applicant
  company: {
    name: string
    tagline: string
    licenceNumber: string
    address: string
    /** The letterhead's second line: how to reach the office. */
    website: string
    phones: string
    email: string
  }
  /** Data URLs, so the finished file depends on nothing it cannot carry. */
  photo: string | null
  fullBody: string | null
  passportCopy: string | null
  logo: string | null
  partnerLogo: string | null
  template?: CvTemplate
}

/* ------------------------------------------------------------- the paper -- */

const INK = '#2a241a'
const INK_STRONG = '#1c1710'
const SOFT = '#5a5140'
const MUTED = '#6e6350'
const MUTED_AR = '#7c6f55'
const GOLD = '#8a6a16'
const GOLD_RULE = '#c9a227'
const LINE = '#e2d8c0'
const LINE_SOFT = '#f0e9d9'
const LINE_MID = '#d9cdaf'
const PAPER = '#fffefb'
const PANEL = '#fbf8f1'
const PANEL_LINE = '#e8dfc9'

const SANS = `'Public Sans', system-ui, -apple-system, 'Segoe UI', sans-serif`
const SERIF = `Newsreader, Georgia, 'Times New Roman', serif`
const ARABIC = `Cairo, 'Segoe UI', Tahoma, sans-serif`

function escape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** A value, or the dash the printed form leaves in its place. */
function show(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '—'
  const text = String(value).trim()
  return text === '' ? '—' : escape(text)
}

function ageFrom(dob: string): string {
  if (!dob) return '—'
  const born = new Date(dob)
  if (Number.isNaN(born.getTime())) return '—'
  const now = new Date()
  let age = now.getFullYear() - born.getFullYear()
  const before =
    now.getMonth() < born.getMonth() || (now.getMonth() === born.getMonth() && now.getDate() < born.getDate())
  if (before) age -= 1
  return age > 0 ? String(age) : '—'
}

function period(job: ExperienceEntry): string {
  if (job.years <= 0) return '—'
  return `${job.years} ${job.years === 1 ? 'year' : 'years'}`
}

function issuedToday(): string {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(now.getDate())} / ${pad(now.getMonth() + 1)} / ${now.getFullYear()}`
}

function referenceFor(applicant: Applicant): string {
  return applicant.cvDetails.reference || `EIP-${applicant.id.slice(0, 4).toUpperCase()}`
}

/** Which document this worker gets, unless somebody has said otherwise. */
export function templateFor(applicant: Applicant): CvTemplate {
  if (applicant.cvDetails.template) return applicant.cvDetails.template
  return applicant.type === 'Domestic' ? 'domestic' : 'professional'
}

/* -------------------------------------------------------------- the parts -- */

const head = (title: string) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;600&family=Newsreader:wght@400&family=Cairo:wght@400;600&display=swap" rel="stylesheet">
<style>
  @page { size: A4; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html { background: #f1efe9; }
  body { font-family: ${SANS}; }
  .page {
    width: 8.27in;
    height: 11.69in;
    margin: 0.2in auto;
    display: flex;
    flex-direction: column;
    background: ${PAPER};
    color: ${INK};
    font-size: 9pt;
    line-height: 1.5;
    box-shadow: 0 1px 10px rgba(0, 0, 0, 0.12);
    overflow: hidden;
  }
  .ar { font-family: ${ARABIC}; }
  .brand-rule { padding-bottom: 10px; border-bottom: 3px double ${GOLD_RULE}; }
  .brand { display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; }
  .brand-left { display: flex; align-items: center; gap: 16px; }
  .brand-divider { width: 1px; align-self: stretch; background: ${LINE_MID}; }
  .contact {
    display: flex; flex-direction: column; align-items: flex-end; gap: 1px;
    font-size: 7pt; line-height: 1.45; color: ${MUTED}; text-align: right; padding-bottom: 3px;
  }
  .sec { display: flex; align-items: baseline; gap: 10px; padding-bottom: 5px; border-bottom: 1px solid ${LINE}; }
  .sec h2 { font-size: 7.5pt; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: ${GOLD}; }
  .sec .ar { font-size: 8pt; color: ${MUTED_AR}; }
  .lab { font-size: 7pt; letter-spacing: 0.1em; text-transform: uppercase; color: ${MUTED}; }
  .lab-ar { font-family: ${ARABIC}; font-size: 7.5pt; color: ${MUTED_AR}; }
  .val { font-size: 9.5pt; color: ${INK}; min-width: 2em; display: inline-block; }
  th { font-size: 7pt; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: ${MUTED}; text-align: left; border-bottom: 1px solid ${LINE}; }
  th .ar { letter-spacing: 0; text-transform: none; color: ${MUTED_AR}; }
  .foot {
    margin-top: auto; padding-top: 9px; border-top: 1px solid ${LINE};
    display: flex; align-items: center; justify-content: space-between; gap: 16px;
    font-size: 7pt; color: ${MUTED};
  }
  @media print {
    html { background: #fff; }
    .page { margin: 0; box-shadow: none; page-break-after: always; }
    .page:last-child { page-break-after: auto; }
  }
</style>
</head>
<body>`

const tail = '</body>\n</html>'

function sectionHead(en: string, ar: string, spread = false): string {
  return `<div class="sec"${spread ? ' style="justify-content:space-between"' : ''}>
    <h2>${escape(en)}</h2>
    <span class="ar" dir="rtl"${spread ? ` style="font-size:9pt;font-weight:600;color:${GOLD}"` : ''}>${escape(ar)}</span>
  </div>`
}

/** The professional CV's field: labels above, value under, hairline below. */
function stacked(en: string, ar: string, value: string | number | null | undefined, last = false): string {
  return `<div style="display:flex;flex-direction:column;gap:1px;padding:6px 0;${last ? '' : `border-bottom:1px solid ${LINE_SOFT};`}">
    <div style="display:flex;align-items:baseline;gap:6px">
      <span class="lab">${escape(en)}</span>
      ${ar ? `<span class="lab-ar" dir="rtl">${escape(ar)}</span>` : ''}
    </div>
    <span class="val">${show(value)}</span>
  </div>`
}

/** The bio data's row: label, value, Arabic label pushed to the margin. */
function threeUp(en: string, value: string | number | null | undefined, ar: string, last = false): string {
  return `<div style="display:grid;grid-template-columns:36% minmax(0,1fr) auto;gap:10px;align-items:baseline;padding:3px 0;${last ? '' : `border-bottom:1px solid ${LINE_SOFT};`}">
    <span class="lab">${escape(en)}</span>
    <span class="val" style="color:${INK_STRONG}">${show(value)}</span>
    <span class="ar" dir="rtl" style="font-size:8pt;color:${MUTED_AR};text-align:right;white-space:nowrap">${escape(ar)}</span>
  </div>`
}

function skillRow(en: string, ar: string, value: string, last = false): string {
  const said = value.trim()
  const on = said !== ''
  return `<div style="display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:10px;align-items:center;padding:3px 0;${last ? '' : `border-bottom:1px solid ${LINE_SOFT};`}">
    <span style="font-size:9pt;color:${INK}">${escape(en)}</span>
    <span class="ar" dir="rtl" style="font-size:8pt;color:${MUTED_AR};text-align:right;white-space:nowrap">${escape(ar)}</span>
    <span style="display:inline-block;min-width:38px;text-align:center;padding:1px 8px;border-radius:100px;font-size:7.5pt;font-weight:600;letter-spacing:0.08em;border:1px solid ${on ? GOLD_RULE : LINE_MID};color:${on ? GOLD : '#9a8c6e'};background:${on ? '#faf4e3' : 'transparent'}">${on ? escape(said.toUpperCase()) : '—'}</span>
  </div>`
}

function photoSlot(photo: string | null, height: string, placeholder: string, alt: string): string {
  return `<div style="width:100%;height:${height};border:1px ${photo ? 'solid' : 'dashed'} ${LINE_MID};border-radius:3px;background:${PANEL};display:flex;align-items:center;justify-content:center;overflow:hidden;font-size:7.5pt;color:${MUTED}">
    ${photo ? `<img src="${photo}" alt="${escape(alt)}" style="width:100%;height:100%;object-fit:contain">` : escape(placeholder)}
  </div>`
}

/* ------------------------------------------------- the professional CV ----- */

function professionalCv({ applicant, company, photo, logo }: CvInput): string {
  const cv = applicant.cvDetails
  const fullName = applicant.englishName || applicant.arabicName
  // Four rows, like the printed form, so the table keeps its shape whether she
  // has one job behind her or four.
  const jobs = [...applicant.experience, ...Array<null>(4)].slice(0, Math.max(4, applicant.experience.length))

  const rows = jobs
    .map((job, index) => {
      const last = index === jobs.length - 1
      const edge = last ? '' : `border-bottom:1px solid ${LINE_SOFT};`
      const cell = (value: string, color: string, padding: string) =>
        `<td style="padding:${padding};vertical-align:top;${edge}color:${color}">${show(value)}</td>`
      return `<tr>
        ${cell(job?.employer ?? '', INK_STRONG, '9px 12px 9px 0')}
        ${cell(job?.title ?? '', SOFT, '9px 12px 9px 0')}
        ${cell(job ? period(job) : '', SOFT, '9px 12px 9px 0')}
        ${cell(job?.duties ?? '', SOFT, '9px 0')}
      </tr>`
    })
    .join('')

  const education = cv.education
    ? cv.education
    : applicant.education.map((e) => [e.degree, e.institution, e.year].filter(Boolean).join(' · ')).join(' / ')

  return `${head(`${fullName} — Curriculum Vitae`)}
  <section class="page" style="padding:0.5in 0.55in">
    <div class="brand brand-rule">
      <div class="brand-left">
        ${logo ? `<img src="${logo}" alt="${escape(company.name)}" style="width:238px;height:auto">` : `<b style="font-size:13pt">${escape(company.name)}</b>`}
      </div>
      ${letterheadContact(company, '3px')}
    </div>

    <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;padding:8px 0 16px">
      <div style="display:flex;align-items:baseline;gap:10px">
        <span style="font-size:7.5pt;letter-spacing:0.16em;text-transform:uppercase;white-space:nowrap;color:${GOLD}">Professional Worker · Curriculum Vitae</span>
        <span class="ar" dir="rtl" style="font-size:8pt;color:${MUTED}">السيرة الذاتية</span>
      </div>
      <div style="font-size:7pt;letter-spacing:0.14em;text-transform:uppercase;color:${MUTED}">Ref. ${escape(referenceFor(applicant))} · Issued ${issuedToday()}</div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 112px;gap:24px;align-items:start;padding-bottom:16px;border-bottom:1px solid ${LINE}">
      <div style="display:flex;flex-direction:column;gap:12px">
        <div style="display:flex;flex-direction:column;gap:3px">
          <div style="display:flex;align-items:baseline;gap:8px">
            <span class="lab" style="letter-spacing:0.12em">Full Name</span>
            <span class="lab-ar" dir="rtl">الاسم الكامل</span>
          </div>
          <h1 style="font-family:${SERIF};font-weight:400;font-size:25pt;line-height:1.1;letter-spacing:-0.01em;color:${INK_STRONG}">${escape(fullName)}</h1>
        </div>
        <div style="display:flex;flex-direction:column;gap:2px">
          <div style="display:flex;align-items:baseline;gap:8px">
            <span class="lab" style="letter-spacing:0.12em">Job Title</span>
            <span class="lab-ar" dir="rtl">المهنة</span>
          </div>
          <div style="font-size:12pt;color:${GOLD}">${show(cv.jobTitle || applicant.profession)}</div>
        </div>
      </div>
      <div style="width:112px;height:142px">${photoSlot(photo, '142px', 'Photo · صورة', fullName)}</div>
    </div>

    <div style="padding:14px 0 0">
      ${sectionHead('Professional Profile', 'النبذة المهنية')}
      <p style="margin-top:7px;font-size:9pt;color:${SOFT}">${show(cv.profileEn)}</p>
      ${cv.profileAr ? `<p class="ar" dir="rtl" style="margin-top:3px;font-size:9pt;color:${SOFT};text-align:right">${escape(cv.profileAr)}</p>` : ''}
    </div>

    <div style="padding:16px 0 0">
      ${sectionHead('Personal Details', 'البيانات الشخصية')}
      <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:0 24px">
        ${stacked('Full Name', 'الاسم الكامل', fullName)}
        ${stacked('Date of Birth', 'تاريخ الميلاد', applicant.dob)}
        ${stacked('Age', 'العمر', ageFrom(applicant.dob))}
        ${stacked('Nationality', 'الجنسية', applicant.country)}
        ${stacked('Marital Status', 'الحالة الاجتماعية', cv.maritalStatus)}
        ${stacked('Religion', 'الديانة', cv.religion)}
        ${stacked('Current Location', 'مكان الإقامة', cv.currentLocation, true)}
        ${stacked('Mobile', 'رقم الهاتف', applicant.phone, true)}
        ${stacked('Email', 'البريد الإلكتروني', cv.email, true)}
      </div>
    </div>

    <div style="padding:16px 0 0">
      ${sectionHead('Professional Experience', 'الخبرات المهنية')}
      <table style="width:100%;border-collapse:collapse;font-size:9pt">
        <thead>
          <tr>
            <th style="padding:8px 12px 7px 0;width:26%">Employer <span class="ar" dir="rtl">جهة العمل</span></th>
            <th style="padding:8px 12px 7px 0;width:20%">Position <span class="ar" dir="rtl">المهنة</span></th>
            <th style="padding:8px 12px 7px 0;width:18%">Period <span class="ar" dir="rtl">الفترة</span></th>
            <th style="padding:8px 0 7px">Key Duties <span class="ar" dir="rtl">أهم المهام</span></th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>

    <div style="padding:16px 0 0">
      ${sectionHead('Education & Certifications', 'التعليم والشهادات')}
      <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:0 24px">
        ${stacked('Education', 'المؤهل', education)}
        ${stacked('Technical Training', 'التدريب الفني', cv.technicalTraining)}
        ${stacked('TESDA / Training', '', cv.tesda)}
        ${stacked('Other Certificates', 'شهادات أخرى', cv.otherCertificates, true)}
        ${stacked('Certificate No.', 'رقم الشهادة', cv.certificateNo, true)}
        ${stacked('Languages', 'اللغات', cv.languages, true)}
      </div>
    </div>

    <div class="foot">
      <span>Screened, background-checked and document-verified by ${escape(company.name)}.</span>
      <span>${escape(company.email)}</span>
    </div>
  </section>
${tail}`
}

/* ----------------------------------------------- the domestic bio data ----- */

function domesticBioData({ applicant, company, photo, fullBody, passportCopy, logo, partnerLogo }: CvInput): string {
  const cv = applicant.cvDetails
  const fullName = (applicant.englishName || applicant.arabicName).toUpperCase()

  const abroad = applicant.experience.length
    ? applicant.experience
        .map(
          (job, index) => `<tr>
            <td style="padding:5px 12px 5px 0;vertical-align:top;color:${INK_STRONG};${index === applicant.experience.length - 1 ? '' : `border-bottom:1px solid ${LINE_SOFT};`}">${show(job.title)}</td>
            <td style="padding:5px 12px 5px 0;vertical-align:top;color:${SOFT};${index === applicant.experience.length - 1 ? '' : `border-bottom:1px solid ${LINE_SOFT};`}">${show(job.country || job.employer)}</td>
            <td style="padding:5px 0;vertical-align:top;text-align:right;color:${SOFT};${index === applicant.experience.length - 1 ? '' : `border-bottom:1px solid ${LINE_SOFT};`}">${show(period(job))}</td>
          </tr>`,
        )
        .join('')
    : `<tr><td style="padding:5px 12px 5px 0;color:${INK_STRONG}">—</td><td style="padding:5px 12px 5px 0;color:${SOFT}">—</td><td style="padding:5px 0;text-align:right;color:${SOFT}">—</td></tr>`

  const education = cv.education
    ? cv.education
    : applicant.education.map((e) => e.degree).filter(Boolean).join(' / ')

  const banner = (label: string, ar: string, value: string) => `<div style="display:flex;flex-direction:column;align-items:flex-end;gap:1px">
    <span class="lab" style="white-space:nowrap">${escape(label)}${ar ? ` <span class="ar" dir="rtl" style="letter-spacing:0;text-transform:none;color:${MUTED_AR}">${escape(ar)}</span>` : ''}</span>
    <span style="font-family:${SERIF};font-size:16pt;line-height:1.1;color:${INK_STRONG};white-space:nowrap">${show(value)}</span>
  </div>`

  const brandLeft = `<div class="brand-left">
    ${logo ? `<img src="${logo}" alt="${escape(company.name)}" style="width:200px;height:auto">` : `<b style="font-size:12pt">${escape(company.name)}</b>`}
    ${partnerLogo ? `<div class="brand-divider"></div><img src="${partnerLogo}" alt="Six Direction Recruitment" style="height:60px;width:auto">` : ''}
  </div>`

  return `${head(`${fullName} — Bio Data`)}
  <section class="page" style="padding:0.45in 0.5in;line-height:1.4">
    <div class="brand brand-rule" style="padding-bottom:9px">
      ${brandLeft}
      ${letterheadContact(company, '2px')}
    </div>

    <div style="display:flex;align-items:flex-end;justify-content:space-between;gap:20px;padding:12px 0">
      <div style="display:flex;flex-direction:column;gap:2px">
        <span style="font-size:7.5pt;letter-spacing:0.18em;text-transform:uppercase;color:${GOLD}">Bio Data for Employment</span>
        <span class="ar" dir="rtl" style="font-size:10pt;font-weight:600;color:${INK}">السيرة الذاتية للعمل في المملكة العربية السعودية</span>
      </div>
      <div style="display:flex;gap:22px;flex:0 0 auto">
        ${banner('Post Applied', 'الوظيفة', (cv.postApplied || cv.jobTitle || applicant.profession).toUpperCase())}
        ${banner('Country', 'الدولة', (cv.destinationCountry || 'KSA').toUpperCase())}
        ${banner('Ref. No.', '', referenceFor(applicant))}
      </div>
    </div>

    <div style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:18px;align-items:end;padding:12px 16px;background:${PANEL};border:1px solid ${PANEL_LINE}">
      <div style="display:flex;flex-direction:column;gap:2px;min-width:0">
        <div style="display:flex;align-items:baseline;gap:8px">
          <span class="lab">Full Name</span>
          <span class="ar" dir="rtl" style="font-size:8pt;color:${MUTED_AR}">الاسم كامل</span>
        </div>
        <span style="font-family:${SERIF};font-size:21pt;line-height:1.15;color:${INK_STRONG}">${escape(fullName)}</span>
      </div>
      <div style="display:flex;gap:26px">
        <div style="display:flex;flex-direction:column;gap:2px">
          <span class="lab" style="white-space:nowrap">Monthly Salary</span>
          <span class="ar" dir="rtl" style="font-size:7.5pt;color:${MUTED_AR}">الراتب الشهري</span>
          <span style="font-size:12pt;font-weight:600;color:${INK_STRONG};white-space:nowrap">${show(cv.monthlySalary || cv.expectedSalary)}</span>
        </div>
        <div style="display:flex;flex-direction:column;gap:2px">
          <span class="lab" style="white-space:nowrap">Contract Period</span>
          <span class="ar" dir="rtl" style="font-size:7.5pt;color:${MUTED_AR}">مدة العقد</span>
          <span style="font-size:12pt;font-weight:600;color:${INK_STRONG};white-space:nowrap">${show(cv.contractPeriod || 'TWO YEARS')}</span>
        </div>
      </div>
    </div>

    <div style="flex:1;display:grid;grid-template-columns:minmax(0,1.5fr) minmax(0,1fr);gap:24px;align-items:start;padding-top:14px;min-height:0">
      <div style="display:flex;flex-direction:column;gap:13px">
        <div>
          ${sectionHead('Personal Data', 'المعلومات الشخصية', true)}
          ${threeUp('Nationality', applicant.country, 'الجنسية')}
          ${threeUp('Religion', cv.religion, 'الديانة')}
          ${threeUp('Date of Birth', applicant.dob, 'تاريخ الميلاد')}
          ${threeUp('Age', ageFrom(applicant.dob), 'العمر')}
          ${threeUp('Place of Birth', cv.placeOfBirth, 'مكان الميلاد')}
          ${threeUp('Living Town', cv.livingTown || cv.currentLocation, 'مكان السكن')}
          ${threeUp('Marital Status', cv.maritalStatus, 'الحالة الاجتماعية')}
          ${threeUp('No. of Children', cv.children, 'عدد الأطفال')}
          ${threeUp('Height', cv.height, 'الطول')}
          ${threeUp('Weight', cv.weight, 'الوزن')}
          ${threeUp("Mother's Full Name", cv.motherName, 'اسم الأم كامل')}
          ${threeUp("Father's Full Name", cv.fatherName, 'اسم الأب كامل')}
          ${threeUp('Next of Kin', cv.nextOfKin, 'اسم أحد الأقارب', true)}
        </div>

        <div>
          ${sectionHead('Passport Details', 'بيانات جواز السفر', true)}
          ${threeUp('Number', applicant.passportNo, 'رقم الجواز')}
          ${threeUp('Date of Issue', applicant.passportStart, 'تاريخ الإصدار')}
          ${threeUp('Date of Expiry', applicant.passportEnd, 'تاريخ الانتهاء')}
          ${threeUp('Place of Issue', cv.placeOfIssue, 'مكان الإصدار', true)}
        </div>

        <div>
          ${sectionHead('Language & Education', 'اللغة والتعليم', true)}
          <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:0 12px">
            ${['English|الإنجليزية|' + cv.english, 'Arabic|العربية|' + cv.arabic, 'Education|التعليم|' + education]
              .map((entry) => {
                const [en, ar, value] = entry.split('|')
                return `<div style="display:flex;flex-direction:column;gap:1px;padding:5px 0">
                  <div style="display:flex;align-items:baseline;justify-content:space-between;gap:4px">
                    <span class="lab" style="white-space:nowrap">${escape(en)}</span>
                    <span class="ar" dir="rtl" style="font-size:8pt;color:${MUTED_AR};white-space:nowrap">${escape(ar)}</span>
                  </div>
                  <span class="val" style="color:${INK_STRONG}">${show(value)}</span>
                </div>`
              })
              .join('')}
          </div>
        </div>
      </div>

      <div style="display:flex;flex-direction:column;gap:13px">
        <div style="display:flex;flex-direction:column;gap:8px">
          ${photoSlot(photo, '120px', 'Photo · صورة شخصية', fullName)}
          ${photoSlot(fullBody, '240px', 'Full body · صورة كاملة', fullName)}
        </div>
        <div>
          ${sectionHead('Skills & Experience', 'خبرة العمل', true)}
          ${skillRow('Baby Sitting', 'عناية الرضع', cv.skillBabySitting)}
          ${skillRow('Children Care', 'عناية الطفل', cv.skillChildrenCare)}
          ${skillRow('Tutoring', 'تعليم الأطفال', cv.skillTutoring)}
          ${skillRow('Elderly Care', 'عناية كبار السن', cv.skillElderlyCare)}
          ${skillRow('Cleaning', 'التنظيف', cv.skillCleaning)}
          ${skillRow('Washing', 'الغسيل', cv.skillWashing)}
          ${skillRow('Ironing', 'الكوي', cv.skillIroning)}
          ${skillRow('Cooking', 'الطبخ', cv.skillCooking, true)}
        </div>
      </div>
    </div>

    <div style="padding-top:13px">
      ${sectionHead('Previous Employment Abroad', 'خبرة العمل خارج البلاد', true)}
      <table style="width:100%;border-collapse:collapse;font-size:9pt">
        <thead>
          <tr>
            <th style="padding:5px 12px 4px 0;width:40%">Position <span class="ar" dir="rtl">المهنة</span></th>
            <th style="padding:5px 12px 4px 0;width:30%">Country <span class="ar" dir="rtl">الدولة</span></th>
            <th style="padding:5px 0 4px;width:30%;text-align:right">Period <span class="ar" dir="rtl">المدة</span></th>
          </tr>
        </thead>
        <tbody>${abroad}</tbody>
      </table>
    </div>

    <div class="foot" style="margin-top:12px">
      <span>Screened and document-verified by ${escape(company.name)}${company.email ? ` · ${escape(company.email)}` : ''}</span>
      <span>Page 1 of 2</span>
    </div>
  </section>

  <section class="page" style="padding:0.45in 0.5in;line-height:1.4">
    <div class="brand brand-rule" style="padding-bottom:9px">
      <div class="brand-left">
        ${logo ? `<img src="${logo}" alt="${escape(company.name)}" style="width:170px;height:auto">` : ''}
        ${partnerLogo ? `<div class="brand-divider"></div><img src="${partnerLogo}" alt="Six Direction Recruitment" style="height:50px;width:auto">` : ''}
      </div>
      <div style="display:flex;align-items:baseline;gap:10px">
        <span style="font-size:7.5pt;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:${GOLD}">Passport Copy</span>
        <span class="ar" dir="rtl" style="font-size:9pt;font-weight:600;color:${GOLD}">صورة جواز السفر</span>
      </div>
    </div>

    <div style="flex:1;display:flex;align-items:center;justify-content:center;margin:18px 0;border:1px ${passportCopy ? 'solid' : 'dashed'} ${LINE_MID};border-radius:3px;background:${PANEL};color:${MUTED};font-size:8pt;overflow:hidden">
      ${passportCopy ? `<img src="${passportCopy}" alt="Passport copy" style="max-width:100%;max-height:100%;object-fit:contain">` : 'Paste the passport copy here · ألصق صورة جواز السفر هنا'}
    </div>

    <div class="foot">
      <span>${escape(company.name)} · ${escape(company.licenceNumber)}</span>
      <span>Page 2 of 2</span>
    </div>
  </section>
${tail}`
}

/**
 * The letterhead's right-hand side: the licence number, then the line somebody
 * holding the document rings. Both templates print the same thing, and an
 * empty field simply does not take a line.
 */
function letterheadContact(company: CvInput['company'], padding: string): string {
  const reach = [company.website, company.phones].filter(Boolean).join(' · ')
  const lines = [company.licenceNumber, reach, company.address].filter(Boolean)
  return `<div class="contact" style="padding-bottom:${padding}">
        ${lines.map((line) => `<span>${escape(line)}</span>`).join('\n        ')}
      </div>`
}

/* --------------------------------------------------------------- the door -- */

export function buildCvHtml(input: CvInput): string {
  const which = input.template ?? templateFor(input.applicant)
  return which === 'domestic' ? domesticBioData(input) : professionalCv(input)
}

/** What the office calls the file when it is saved or published. */
export function cvFileNameFor(applicant: Pick<Applicant, 'englishName'>): string {
  const safe = applicant.englishName.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase()
  return `${safe || 'worker'}-cv.html`
}
