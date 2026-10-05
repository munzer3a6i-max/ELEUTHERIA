/*
  Reading a CV that arrived as a file.

  Agencies send CVs as PDFs with the same handful of labels on them -- name,
  date of birth, passport number, civil status -- so most of a record can be
  lifted off one without anybody typing it again. This does that with patterns
  and nothing else: no service, no account, no subscription, and nothing leaves
  the browser. What it finds is a suggestion the office confirms, never a
  silent edit, and what it cannot find it says it cannot find.

  A scanned CV has no text to read, only a picture of one. That is reported
  plainly rather than guessed at; reading those would need OCR, which would
  need a service, which is the thing we are not doing.
*/

export interface ReadResult {
  /** Everything the file said, for the office to look at if it wants. */
  text: string
  /** Field name to value, only where a pattern matched. */
  found: Record<string, string>
  /** True when the file holds no text at all -- a scan rather than a document. */
  imageOnly: boolean
  pages: number
}

/** Where each found value belongs. The CV tab turns these into the review. */
export type FieldKey =
  | 'englishName'
  | 'dob'
  | 'country'
  | 'profession'
  | 'phone'
  | 'passportNo'
  | 'passportStart'
  | 'passportEnd'
  | 'experienceYears'
  | 'cv.maritalStatus'
  | 'cv.religion'
  | 'cv.currentLocation'
  | 'cv.email'
  | 'cv.languages'
  | 'cv.education'
  | 'cv.placeOfIssue'
  | 'cv.expectedSalary'
  | 'cv.coreSkills'

interface Rule {
  key: FieldKey
  label: { en: string; ar: string }
  /** Labels as they appear on a CV, in either language. */
  labels: string[]
  clean?: (value: string) => string
}

/** Dates arrive in every order there is; keep what is unambiguous. */
function asDate(value: string): string {
  const text = value.trim()
  const iso = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/.exec(text)
  if (iso) return `${iso[1]}-${iso[2].padStart(2, '0')}-${iso[3].padStart(2, '0')}`

  const months: Record<string, string> = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
  }
  const named = /^(\d{1,2})\s+([a-z]{3,})\.?,?\s+(\d{4})$/i.exec(text)
  if (named) {
    const month = months[named[2].slice(0, 3).toLowerCase()]
    if (month) return `${named[3]}-${month}-${named[1].padStart(2, '0')}`
  }
  const namedFirst = /^([a-z]{3,})\.?\s+(\d{1,2}),?\s+(\d{4})$/i.exec(text)
  if (namedFirst) {
    const month = months[namedFirst[1].slice(0, 3).toLowerCase()]
    if (month) return `${namedFirst[3]}-${month}-${namedFirst[2].padStart(2, '0')}`
  }
  // day/month/year is the common one outside the United States, and a day
  // above twelve settles it. Anything still ambiguous is left as written for
  // the office to correct.
  const slashed = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/.exec(text)
  if (slashed) {
    const [, a, b, year] = slashed
    const day = Number(a) > 12 ? a : Number(b) > 12 ? b : a
    const month = day === a ? b : a
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  }
  return text
}

const digitsOnly = (value: string) => value.replace(/[^\d]/g, '')

const RULES: Rule[] = [
  { key: 'englishName', label: { en: 'Full name', ar: 'الاسم الكامل' }, labels: ['full name', 'name of applicant', 'applicant name', 'candidate name', 'name', 'الاسم الكامل', 'الاسم'] },
  { key: 'dob', label: { en: 'Date of birth', ar: 'تاريخ الميلاد' }, labels: ['date of birth', 'birth date', 'birthdate', 'd.o.b', 'dob', 'تاريخ الميلاد'], clean: asDate },
  { key: 'country', label: { en: 'Nationality', ar: 'الجنسية' }, labels: ['nationality', 'citizenship', 'الجنسية'] },
  { key: 'profession', label: { en: 'Profession', ar: 'المهنة' }, labels: ['position applied', 'position applied for', 'job title', 'position', 'profession', 'occupation', 'المهنة', 'الوظيفة'] },
  { key: 'phone', label: { en: 'Mobile', ar: 'رقم الهاتف' }, labels: ['mobile no', 'mobile number', 'contact no', 'contact number', 'telephone', 'mobile', 'phone', 'رقم الهاتف', 'الجوال'] },
  { key: 'passportNo', label: { en: 'Passport no.', ar: 'رقم الجواز' }, labels: ['passport no', 'passport number', 'passport #', 'رقم الجواز'] },
  { key: 'passportStart', label: { en: 'Passport issued', ar: 'تاريخ الإصدار' }, labels: ['date of issue', 'issue date', 'issued on', 'تاريخ الإصدار'], clean: asDate },
  { key: 'passportEnd', label: { en: 'Passport expires', ar: 'تاريخ الانتهاء' }, labels: ['date of expiry', 'expiry date', 'expiration date', 'valid until', 'تاريخ الانتهاء'], clean: asDate },
  { key: 'cv.placeOfIssue', label: { en: 'Place of issue', ar: 'مكان الإصدار' }, labels: ['place of issue', 'issued at', 'مكان الإصدار'] },
  { key: 'cv.maritalStatus', label: { en: 'Marital status', ar: 'الحالة الاجتماعية' }, labels: ['civil status', 'marital status', 'الحالة الاجتماعية', 'الحالة الاجتماعيه'] },
  { key: 'cv.religion', label: { en: 'Religion', ar: 'الديانة' }, labels: ['religion', 'الديانة'] },
  { key: 'cv.currentLocation', label: { en: 'Current location', ar: 'مكان الإقامة' }, labels: ['current location', 'present address', 'address', 'location', 'مكان الإقامة', 'العنوان'] },
  { key: 'cv.email', label: { en: 'Email', ar: 'البريد الإلكتروني' }, labels: ['email address', 'e-mail', 'email', 'البريد الإلكتروني'] },
  { key: 'cv.languages', label: { en: 'Languages', ar: 'اللغات' }, labels: ['languages spoken', 'language', 'languages', 'اللغات'] },
  { key: 'cv.education', label: { en: 'Education', ar: 'المؤهل' }, labels: ['educational attainment', 'education', 'qualification', 'المؤهل', 'التعليم'] },
  { key: 'cv.expectedSalary', label: { en: 'Expected salary', ar: 'الراتب المتوقع' }, labels: ['expected salary', 'salary expectation', 'الراتب المتوقع'] },
  { key: 'cv.coreSkills', label: { en: 'Skills', ar: 'المهارات' }, labels: ['skills', 'core skills', 'key skills', 'المهارات'] },
  { key: 'experienceYears', label: { en: 'Years of experience', ar: 'سنوات الخبرة' }, labels: ['years of experience', 'total experience', 'experience', 'سنوات الخبرة'], clean: digitsOnly },
]

export const FIELD_LABELS: Record<string, { en: string; ar: string }> = Object.fromEntries(
  RULES.map((rule) => [rule.key, rule.label]),
)

/** A value that is plainly a label for the next field, not an answer. */
function looksLikeLabel(value: string): boolean {
  return RULES.some((rule) => rule.labels.some((label) => value.toLowerCase().startsWith(label)))
}

export function extractFields(text: string): Record<string, string> {
  const found: Record<string, string> = {}
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)

  for (const rule of RULES) {
    for (const label of rule.labels) {
      // "Label : value" on one line, which is how most of these are written.
      // "Passport No. : X" and "Passport No: X" and "Passport No - X" are the
      // same label; the full stop belongs to the abbreviation, not the value.
      const pattern = new RegExp(
        `(?:^|\\s)${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s.]*[:：\\-–]\\s*(.+)$`,
        'i',
      )
      const line = lines.find((candidate) => pattern.test(candidate))
      const match = line ? pattern.exec(line) : null
      let value = match?.[1]?.trim() ?? ''

      // Or the label alone on a line, with the answer under it.
      if (!value) {
        const index = lines.findIndex((candidate) => candidate.toLowerCase() === label)
        if (index >= 0 && lines[index + 1] && !looksLikeLabel(lines[index + 1])) value = lines[index + 1]
      }

      if (!value) continue
      // Two fields on one line: stop at the next label rather than swallowing it.
      for (const other of RULES.flatMap((r) => r.labels)) {
        const cut = value.toLowerCase().indexOf(` ${other}:`)
        if (cut > 0) value = value.slice(0, cut)
      }
      value = value.replace(/[\s:–-]+$/, '').trim()
      if (!value || value.length > 120) continue

      found[rule.key] = rule.clean ? rule.clean(value) : value
      break
    }
  }

  // An address is a label away from everything; an email is not.
  if (!found['cv.email']) {
    const email = /[\w.+-]+@[\w-]+\.[\w.]+/.exec(text)
    if (email) found['cv.email'] = email[0]
  }

  return found
}

/** Reads a file in the browser. PDFs are parsed; plain text is taken as is. */
export async function readCvFile(file: File): Promise<ReadResult> {
  if (file.type === 'text/plain' || file.name.toLowerCase().endsWith('.txt')) {
    const text = await file.text()
    return { text, found: extractFields(text), imageOnly: text.trim() === '', pages: 1 }
  }

  // Loaded only when somebody actually imports a CV: it is a large library and
  // most days nobody opens this.
  const pdfjs = await import('pdfjs-dist')
  const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url')
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default

  const document = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise
  let text = ''
  for (let number = 1; number <= document.numPages; number += 1) {
    const page = await document.getPage(number)
    const content = await page.getTextContent()
    let line = ''
    let lastY: number | null = null
    for (const item of content.items) {
      if (!('str' in item)) continue
      const y = Math.round(item.transform[5])
      // Items come in reading order with their position; a change in height is
      // a new line, which is what every pattern here keys on.
      if (lastY !== null && Math.abs(y - lastY) > 2) {
        text += `${line.trim()}\n`
        line = ''
      }
      line += item.str
      if (item.hasEOL) {
        text += `${line.trim()}\n`
        line = ''
      }
      lastY = y
    }
    text += `${line.trim()}\n\n`
  }

  return {
    text,
    found: extractFields(text),
    imageOnly: text.trim() === '',
    pages: document.numPages,
  }
}
