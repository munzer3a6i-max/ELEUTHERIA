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
  /** Jobs the file listed with the years they ran, each one an experience entry. */
  experience: FoundExperience[]
  /** True when the file holds no text at all -- a scan rather than a document. */
  imageOnly: boolean
  pages: number
}

export interface FoundExperience {
  title: string
  employer: string
  fromYear: number
  toYear: number
}

/** Where each found value belongs. The CV tab turns these into the review. */
export type FieldKey =
  | 'englishName'
  | 'arabicName'
  | 'gender'
  | 'dob'
  | 'country'
  | 'profession'
  | 'phone'
  | 'idNumber'
  | 'passportNo'
  | 'passportStart'
  | 'passportEnd'
  | 'experienceYears'
  | 'cv.reference'
  | 'cv.placeOfBirth'
  | 'cv.livingTown'
  | 'cv.children'
  | 'cv.height'
  | 'cv.weight'
  | 'cv.motherName'
  | 'cv.fatherName'
  | 'cv.nextOfKin'
  | 'cv.english'
  | 'cv.arabic'
  | 'cv.availability'
  | 'cv.preferredCountry'
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

/** F, Female, أنثى and the rest all mean the same record. */
function asGender(value: string): string {
  const v = value.trim().toLowerCase()
  if (/^(f|female|woman|أنثى|انثى)/.test(v)) return 'Female'
  if (/^(m|male|man|ذكر)/.test(v)) return 'Male'
  return value.trim()
}

/** "2", "two", "none" -- the number of children as a figure. */
function asCount(value: string): string {
  const v = value.trim().toLowerCase()
  if (/^(none|nil|no|n\/a|0|-)$/.test(v)) return '0'
  const words: Record<string, string> = { one: '1', two: '2', three: '3', four: '4', five: '5', six: '6' }
  return words[v] ?? (value.replace(/[^\d]/g, '').slice(0, 2) || value.trim())
}

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
  { key: 'experienceYears', label: { en: 'Years of experience', ar: 'سنوات الخبرة' }, labels: ['years of experience', 'total experience', 'سنوات الخبرة'], clean: digitsOnly },
  { key: 'gender', label: { en: 'Gender', ar: 'الجنس' }, labels: ['gender', 'sex', 'الجنس'], clean: asGender },
  { key: 'arabicName', label: { en: 'Arabic name', ar: 'الاسم بالعربية' }, labels: ['arabic name', 'name in arabic', 'الاسم بالعربية', 'الاسم بالعربي'] },
  { key: 'idNumber', label: { en: 'ID number', ar: 'رقم الهوية' }, labels: ['id number', 'id no', 'national id', 'identity number', 'رقم الهوية'] },
  { key: 'cv.reference', label: { en: 'Reference no.', ar: 'الرقم المرجعي' }, labels: ['reference no', 'reference number', 'ref no', 'ref', 'code no', 'applicant no', 'الرقم المرجعي'] },
  { key: 'cv.placeOfBirth', label: { en: 'Place of birth', ar: 'مكان الميلاد' }, labels: ['place of birth', 'birthplace', 'birth place', 'مكان الميلاد', 'محل الميلاد'] },
  { key: 'cv.livingTown', label: { en: 'Living town', ar: 'مدينة السكن' }, labels: ['living town', 'home town', 'hometown', 'city', 'province', 'مدينة السكن'] },
  { key: 'cv.children', label: { en: 'Children', ar: 'الأطفال' }, labels: ['no. of children', 'number of children', 'no of children', 'children', 'kids', 'عدد الأطفال', 'الأطفال'], clean: asCount },
  { key: 'cv.height', label: { en: 'Height', ar: 'الطول' }, labels: ['height', 'الطول'] },
  { key: 'cv.weight', label: { en: 'Weight', ar: 'الوزن' }, labels: ['weight', 'الوزن'] },
  { key: 'cv.motherName', label: { en: "Mother's name", ar: 'اسم الأم' }, labels: ["mother's name", 'mother name', 'name of mother', 'mother', 'اسم الأم'] },
  { key: 'cv.fatherName', label: { en: "Father's name", ar: 'اسم الأب' }, labels: ["father's name", 'father name', 'name of father', 'father', 'اسم الأب'] },
  { key: 'cv.nextOfKin', label: { en: 'Next of kin', ar: 'أقرب الأقارب' }, labels: ['next of kin', 'emergency contact', 'contact person', 'أقرب الأقارب', 'جهة الاتصال في الطوارئ'] },
  { key: 'cv.english', label: { en: 'English', ar: 'الإنجليزية' }, labels: ['english language', 'english level', 'english', 'الإنجليزية', 'اللغة الإنجليزية'] },
  { key: 'cv.arabic', label: { en: 'Arabic', ar: 'العربية' }, labels: ['arabic language', 'arabic level', 'arabic', 'العربية', 'اللغة العربية'] },
  { key: 'cv.availability', label: { en: 'Availability', ar: 'الجاهزية' }, labels: ['availability', 'available from', 'available', 'الجاهزية'] },
  { key: 'cv.preferredCountry', label: { en: 'Preferred country', ar: 'الدولة المفضلة' }, labels: ['preferred country', 'country of destination', 'destination', 'الدولة المفضلة'] },
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

  // A name written in Arabic is the Arabic name, wherever it is on the page.
  if (!found.arabicName) {
    const arabic = lines.find((line) => /^[\u0600-\u06FF\s]{6,}$/.test(line) && line.split(' ').length <= 5 && !looksLikeLabel(line))
    if (arabic) found.arabicName = arabic
  }

  return found
}

/**
 * The jobs a CV lists, found by the one thing every format agrees on: the
 * years each one ran. "Housemaid - Al Rashid family, Riyadh 2019 - 2021",
 * "2017 to 2019 Caregiver, Dubai" and "Saudi Arabia (2 years) 2015-2017" each
 * give a range; what is left on the line is the job and who it was for.
 */
export function extractExperience(text: string): FoundExperience[] {
  const out: FoundExperience[] = []
  const range = /\b((?:19|20)\d{2})\s*(?:-|–|—|to|till|until|\/)\s*((?:19|20)\d{2}|present|now|current|date)\b/i
  const thisYear = new Date().getFullYear()

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/\s+/g, ' ').trim()
    const match = range.exec(line)
    if (!match) continue
    const fromYear = Number(match[1])
    const toYear = /^\d{4}$/.test(match[2]) ? Number(match[2]) : thisYear
    if (toYear < fromYear || fromYear < 1960) continue

    // What is left once the years go: a job, and who it was for.
    const rest = line
      .replace(match[0], ' ')
      .replace(/\(\s*\d+\s*(?:years?|yrs?|months?)\s*\)/i, ' ')
      .replace(/^[\s:•·\-–,]+|[\s:•·\-–,]+$/g, '')
      .replace(/\s+/g, ' ')
      .trim()
    if (!rest || rest.length > 140 || looksLikeLabel(rest)) continue
    // "Caregiver - Dubai family" / "Caregiver, Dubai family" / "Caregiver at Dubai family"
    const split = /\s+(?:-|–|—|,|\/|\bat\b|\bfor\b|\bwith\b)\s+/i.exec(rest)
    const title = split ? rest.slice(0, split.index).trim() : rest
    const employer = split ? rest.slice(split.index + split[0].length).trim() : ''
    out.push({ title, employer, fromYear, toYear })
  }
  return out
}

/** Reads a file in the browser. PDFs are parsed; plain text is taken as is. */
export async function readCvFile(file: File): Promise<ReadResult> {
  if (file.type === 'text/plain' || file.name.toLowerCase().endsWith('.txt')) {
    const text = await file.text()
    return { text, found: extractFields(text), experience: extractExperience(text), imageOnly: text.trim() === '', pages: 1 }
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
    experience: extractExperience(text),
    imageOnly: text.trim() === '',
    pages: document.numPages,
  }
}
