/*
  The agency's CV, built from the record.

  It is one HTML document rather than a React view, for a reason: the same
  string is what the office looks at on screen, what it prints to PDF, and what
  is uploaded as the worker's CV for the website to serve. One source, so the
  file a client opens is the page the office approved, down to the comma.

  The layout follows the printed template: two A4 pages, every label in English
  and Arabic, a dash wherever the office has not filled something in. Nothing
  here invents content -- an empty field stays visibly empty, because a CV that
  quietly makes things up is worse than one with gaps.
*/

import type { Applicant, Bilingual, CvDetails } from '../types'

export interface CvInput {
  applicant: Applicant
  company: { name: string; tagline: string; licenceNumber: string; address: string }
  /** Data URLs, so the finished file depends on nothing it cannot carry. */
  photo: string | null
  logo: string | null
  /** The client and the stage, when a request says so. */
  client?: string
  interviewStatus?: string
}

const GOLD = '#a8823a'
const INK = '#17181c'
const MUTED = '#6f7278'
const RULE = '#dedbd2'

function escape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** A value, or the dash the template uses for one nobody has filled in. */
function show(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '—'
  const text = String(value).trim()
  return text === '' || text === '0' ? '—' : escape(text)
}

function ageFrom(dob: string): string {
  if (!dob) return '—'
  const born = new Date(dob)
  if (Number.isNaN(born.getTime())) return '—'
  const now = new Date()
  let age = now.getFullYear() - born.getFullYear()
  const beforeBirthday =
    now.getMonth() < born.getMonth() || (now.getMonth() === born.getMonth() && now.getDate() < born.getDate())
  if (beforeBirthday) age -= 1
  return age > 0 ? String(age) : '—'
}

function label(en: string, ar: string): string {
  return `<span class="lab"><span class="lab-en">${escape(en)}</span><span class="lab-ar">${escape(ar)}</span></span>`
}

function field(en: string, ar: string, value: string | number | null | undefined): string {
  return `<div class="field">${label(en, ar)}<p class="val">${show(value)}</p></div>`
}

function section(en: string, ar: string, body: string): string {
  return `<section class="block">
    <h2 class="sec"><span>${escape(en)}</span><span class="sec-ar">${escape(ar)}</span></h2>
    ${body}
  </section>`
}

const name = (bilingual: Bilingual) => bilingual.en || bilingual.ar

export function buildCvHtml({ applicant, company, photo, logo, client, interviewStatus }: CvInput): string {
  const cv: CvDetails = applicant.cvDetails
  const fullName = applicant.englishName || applicant.arabicName
  const jobTitle = cv.jobTitle || applicant.profession
  const reference = cv.reference || `EIP-${applicant.id.slice(0, 6).toUpperCase()}`
  const issued = new Date().toISOString().slice(0, 10)

  const experience = applicant.experience.length
    ? applicant.experience
        .map(
          (job) => `<tr>
            <td>${show(job.employer)}</td>
            <td>${show(job.title)}</td>
            <td class="num">${job.years > 0 ? `${job.years} ${job.years === 1 ? 'year' : 'years'}` : '—'}</td>
            <td>${show(job.duties)}</td>
          </tr>`,
        )
        .join('')
    : `<tr><td colspan="4" class="empty">—</td></tr>`

  const educationLines = cv.education
    ? escape(cv.education)
    : applicant.education.length
      ? applicant.education.map((e) => escape([e.degree, e.institution, e.year].filter(Boolean).join(' · '))).join('<br>')
      : '—'

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(fullName)} — Curriculum Vitae</title>
<style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; }
  html { background: #f1efe9; }
  body {
    margin: 0;
    color: ${INK};
    font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
    font-size: 10.5px;
    line-height: 1.45;
  }
  .page {
    position: relative;
    width: 210mm;
    min-height: 297mm;
    margin: 10mm auto;
    padding: 16mm 15mm 20mm;
    background: #fff;
    box-shadow: 0 1px 10px rgba(0, 0, 0, 0.12);
  }
  .head { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
  .brand { display: flex; align-items: center; gap: 12px; }
  .brand img { width: 46px; height: 46px; object-fit: contain; }
  .brand b { display: block; font-size: 13px; font-weight: 600; letter-spacing: 0.01em; }
  .brand span { display: block; font-size: 10px; color: ${GOLD}; letter-spacing: 0.04em; }
  .contact { text-align: right; font-size: 8.5px; color: ${MUTED}; line-height: 1.6; }
  .rule-gold { height: 2px; background: ${GOLD}; margin: 10px 0 0; }
  .band {
    display: flex; justify-content: space-between; align-items: baseline;
    padding: 7px 0 10px; font-size: 8.5px; letter-spacing: 0.16em;
  }
  .band .t { color: ${GOLD}; font-weight: 600; }
  .band .t i { font-style: normal; color: ${MUTED}; letter-spacing: 0; margin-inline-start: 8px; font-size: 9px; }
  .band .r { color: ${MUTED}; }

  .identity { display: flex; justify-content: space-between; gap: 18px; align-items: flex-start; }
  .identity h1 {
    margin: 2px 0 10px;
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 30px; font-weight: 400; letter-spacing: -0.01em;
  }
  .identity .role { margin: 0; color: ${GOLD}; font-size: 13px; }
  .photo {
    width: 104px; height: 104px; flex: 0 0 auto;
    display: flex; align-items: center; justify-content: center;
    border: 1px dashed ${RULE}; border-radius: 2px; background: #faf8f4;
    color: ${MUTED}; font-size: 8px; text-align: center; overflow: hidden;
  }
  .photo img { width: 100%; height: 100%; object-fit: cover; }

  .block { margin-top: 16px; }
  .sec {
    display: flex; align-items: baseline; gap: 10px; text-transform: uppercase;
    margin: 0 0 8px; padding-bottom: 5px; border-bottom: 1px solid ${RULE};
    font-size: 9px; font-weight: 700; letter-spacing: 0.14em; color: ${GOLD};
  }
  .sec-ar { font-size: 10px; font-weight: 400; letter-spacing: 0; color: ${MUTED}; }

  .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2px 18px; }
  .grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 2px 18px; }
  .field { padding: 7px 0 6px; border-bottom: 1px solid ${RULE}; }
  .lab { display: flex; align-items: baseline; gap: 7px; }
  .lab-en { font-size: 7.5px; letter-spacing: 0.12em; color: ${MUTED}; text-transform: uppercase; }
  .lab-ar { font-size: 9px; color: ${MUTED}; }
  .val { margin: 3px 0 0; font-size: 11px; }
  .lines { margin: 4px 0 0; font-size: 11px; }

  .profile p { margin: 2px 0; }
  .profile .ar { text-align: right; direction: rtl; }

  table { width: 100%; border-collapse: collapse; }
  th {
    padding: 0 0 6px; border-bottom: 1px solid ${RULE};
    font-size: 7.5px; font-weight: 600; letter-spacing: 0.12em; color: ${MUTED};
    text-transform: uppercase; text-align: left;
  }
  th i { font-style: normal; font-size: 9px; letter-spacing: 0; margin-inline-start: 6px; }
  td { padding: 9px 10px 9px 0; border-bottom: 1px solid ${RULE}; font-size: 11px; vertical-align: top; }
  td.empty { color: ${MUTED}; text-align: center; }
  .num { font-variant-numeric: tabular-nums; white-space: nowrap; }

  .boxed { border: 1px solid ${RULE}; background: #faf8f4; padding: 10px 12px; }
  .boxed .grid { gap: 0 18px; }
  .boxed .field { border-bottom: 0; padding-bottom: 0; }

  .foot {
    position: absolute; inset-inline: 15mm; bottom: 12mm;
    display: flex; justify-content: space-between; gap: 12px;
    padding-top: 7px; border-top: 1px solid ${RULE};
    font-size: 8px; color: ${MUTED};
  }

  @media print {
    html { background: #fff; }
    .page { margin: 0; box-shadow: none; page-break-after: always; }
    .page:last-child { page-break-after: auto; }
  }
</style>
</head>
<body>
  <article class="page">
    <header class="head">
      <div class="brand">
        ${logo ? `<img src="${logo}" alt="">` : ''}
        <div>
          <b>${escape(company.name)}</b>
          <span>${escape(company.tagline)}</span>
        </div>
      </div>
      <div class="contact">
        ${escape(company.licenceNumber)}<br>
        ${escape(company.address)}
      </div>
    </header>
    <div class="rule-gold"></div>
    <div class="band">
      <span class="t">PROFESSIONAL WORKER · CURRICULUM VITAE<i>السيرة الذاتية</i></span>
      <span class="r">REF. ${escape(reference)} · ISSUED ${escape(issued)}</span>
    </div>

    <div class="identity">
      <div>
        ${label('Full name', 'الاسم الكامل')}
        <h1>${escape(fullName)}</h1>
        ${label('Job title', 'المهنة')}
        <p class="role">${show(jobTitle)}</p>
      </div>
      <div class="photo">${photo ? `<img src="${photo}" alt="${escape(fullName)}">` : 'No photograph<br>بدون صورة'}</div>
    </div>

    ${section(
      'Professional profile',
      'النبذة المهنية',
      `<div class="profile">
        <p>${show(cv.profileEn)}</p>
        ${cv.profileAr ? `<p class="ar">${escape(cv.profileAr)}</p>` : ''}
      </div>`,
    )}

    ${section(
      'Personal details',
      'البيانات الشخصية',
      `<div class="grid">
        ${field('Full name', 'الاسم الكامل', fullName)}
        ${field('Date of birth', 'تاريخ الميلاد', applicant.dob)}
        ${field('Age', 'العمر', ageFrom(applicant.dob))}
        ${field('Nationality', 'الجنسية', applicant.country)}
        ${field('Marital status', 'الحالة الاجتماعية', cv.maritalStatus)}
        ${field('Religion', 'الديانة', cv.religion)}
        ${field('Current location', 'مكان الإقامة', cv.currentLocation)}
        ${field('Mobile', 'رقم الهاتف', applicant.phone)}
        ${field('Email', 'البريد الإلكتروني', cv.email)}
      </div>`,
    )}

    ${section(
      'Professional experience',
      'الخبرات المهنية',
      `<table>
        <thead>
          <tr>
            <th>Employer<i>جهة العمل</i></th>
            <th>Position<i>المهنة</i></th>
            <th>Period<i>الفترة</i></th>
            <th>Key duties<i>أهم المهام</i></th>
          </tr>
        </thead>
        <tbody>${experience}</tbody>
      </table>`,
    )}

    <footer class="foot">
      <span>Screened, background-checked and document-verified by ${escape(company.name)}.</span>
      <span>Page 1 of 2</span>
    </footer>
  </article>

  <article class="page">
    <div class="band" style="border-bottom:1px solid ${RULE}">
      <span class="t" style="color:${MUTED};font-weight:400">PROFESSIONAL WORKER · CURRICULUM VITAE</span>
      <span class="r">REF. ${escape(reference)}</span>
    </div>

    ${section(
      'Technical skills & specialization',
      'المهارات الفنية والتخصص',
      `<div class="grid-2">
        ${field('Core skills', 'المهارات الأساسية', cv.coreSkills)}
        ${field('Specialization', 'التخصص', cv.specialization || applicant.profession)}
        ${field('Tools & equipment', 'الأدوات والمعدات', cv.tools)}
        ${field('Safety', 'السلامة المهنية', cv.safety)}
        ${field('Years of experience', 'سنوات الخبرة', applicant.experienceYears || applicant.experience.reduce((sum, job) => sum + job.years, 0))}
        ${field('Overseas experience', 'خبرة خارجية', cv.overseasExperience)}
      </div>`,
    )}

    ${section(
      'Education & certifications',
      'التعليم والشهادات',
      `<div class="grid-2">
        <div class="field">${label('Education', 'المؤهل')}<p class="lines">${educationLines}</p></div>
        ${field('Technical training', 'التدريب الفني', cv.technicalTraining)}
        ${field('TESDA / Training', '', cv.tesda)}
        ${field('Other certificates', 'شهادات أخرى', cv.otherCertificates)}
        ${field('Certificate no.', 'رقم الشهادة', cv.certificateNo)}
        ${field('Languages', 'اللغات', cv.languages)}
      </div>`,
    )}

    ${section(
      'Passport & availability',
      'بيانات الجواز والتوفر',
      `<div class="grid">
        ${field('Passport no.', 'رقم الجواز', applicant.passportNo)}
        ${field('Issue date', 'تاريخ الإصدار', applicant.passportStart)}
        ${field('Expiry date', 'تاريخ الانتهاء', applicant.passportEnd)}
        ${field('Place of issue', 'مكان الإصدار', cv.placeOfIssue)}
        ${field('Availability', 'التوفر', cv.availability || applicant.status)}
        ${field('Expected salary', 'الراتب المتوقع', cv.expectedSalary)}
      </div>`,
    )}

    ${section(
      'Recruitment information',
      'بيانات التوظيف',
      `<div class="boxed">
        <div class="grid">
          ${field('Preferred country', 'الدولة المفضلة', cv.preferredCountry)}
          ${field('Client', 'العميل', cv.client || client)}
          ${field('Interview status', 'حالة المقابلة', cv.interviewStatus || interviewStatus)}
        </div>
      </div>`,
    )}

    <footer class="foot">
      <span>${escape(company.name)} · ${escape(company.licenceNumber)}</span>
      <span>Page 2 of 2</span>
    </footer>
  </article>
</body>
</html>`
}

/** What the office calls the file when it is saved or published. */
export function cvFileNameFor(applicant: Pick<Applicant, 'englishName'>): string {
  const safe = applicant.englishName.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase()
  return `${safe || 'worker'}-cv.html`
}

export { name as bilingualName }
