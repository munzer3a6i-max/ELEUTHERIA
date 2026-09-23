/*
  Between the app's shapes and the database's rows.

  The two disagree on purpose. The app holds a worker's experience inside the
  worker; the database keeps it in its own table so it can be constrained and
  queried. The app writes `englishName`; Postgres columns are lower_snake. The
  app carries an attachment as one object; the database spreads it across four
  columns so a bill can be found without unpacking JSON.

  Three things are deliberately not carried across, because the database is not
  where they belong:

    passwords          auth.users owns those; ops.staff only points at a user
    file bytes         Storage owns those; a row keeps the path, name and size
    derived totals     they are computed from the rows, never stored

  scripts/test-rows.mjs checks this file against the real migrations: it maps
  the app's whole dataset and inserts it into a Postgres built from
  db/migrations, so a column that does not exist or a required one left out
  fails there rather than in front of somebody's data.
*/


import type {
  AgencyCharge,
  AgencyContract,
  Agent,
  AgentCommission,
  Applicant,
  ApplicantDocument,
  ApplicantNote,
  Attachment,
  Backout,
  BackoutCost,
  City,
  Country,
  EducationEntry,
  Employer,
  ExperienceEntry,
  Invoice,
  InvoicePayment,
  AppNotification,
  OfficeExpense,
  PayrollEntry,
  PaymentSource,
  Profession,
  RecruitmentAgency,
  RecruitmentRequest,
  StaffMember,
  StatusHistoryEntry,
} from '../types'

type Row = Record<string, unknown>

// --------------------------------------------------------------- scalars --

/** The app uses '' for "no date"; a date column uses null. */
const dateOut = (value: string | null | undefined): string | null => (value ? value : null)
const dateIn = (value: unknown): string =>
  typeof value === 'string' ? value.slice(0, 10) : value instanceof Date ? value.toISOString().slice(0, 10) : ''

/** numeric(12,2) arrives as a string, because a float would lose cents. */
const money = (value: unknown): number => (value === null || value === undefined ? 0 : Number(value))

const text = (value: unknown): string => (value === null || value === undefined ? '' : String(value))

/** A month like '2026-09' is stored as the first day of it. */
const monthOut = (month: string): string | null => (month ? `${month}-01` : null)
const monthIn = (value: unknown): string => dateIn(value).slice(0, 7)

/**
 * When a record's own date is the moment it was created, it is written
 * explicitly rather than left to the column's default -- otherwise importing
 * two years of notes stamps every one of them with today.
 */
const createdOut = (date: string): Row => (date ? { created_at: `${date}T00:00:00Z` } : {})

// ----------------------------------------------------------- attachments --

/**
 * The bytes live in Storage once the app is connected, so a row carries where
 * the file is and what it was, never the file itself.
 */
function attachmentOut(attachment: Attachment | null): Row {
  return {
    attachment_path: attachment?.path ?? null,
    attachment_name: attachment?.name ?? null,
    attachment_type: attachment?.type || null,
    attachment_size: attachment?.size ?? null,
  }
}

function attachmentIn(row: Row): Attachment | null {
  if (!row.attachment_name && !row.attachment_path) return null
  return {
    name: text(row.attachment_name),
    type: text(row.attachment_type),
    size: Number(row.attachment_size ?? 0),
    dataUrl: '',
    uploadedOn: '',
    path: (row.attachment_path as string | null) ?? null,
  }
}

// ------------------------------------------------------------- reference --

export const countryRows = {
  table: 'countries',
  out: (c: Country): Row => ({ id: c.id, name_en: c.name.en, name_ar: c.name.ar }),
  in: (r: Row): Country => ({ id: text(r.id), name: { en: text(r.name_en), ar: text(r.name_ar) } }),
}

export const cityRows = {
  table: 'cities',
  out: (c: City): Row => ({ id: c.id, country_id: c.countryId, name_en: c.name.en, name_ar: c.name.ar }),
  in: (r: Row): City => ({
    id: text(r.id),
    countryId: text(r.country_id),
    name: { en: text(r.name_en), ar: text(r.name_ar) },
  }),
}

export const professionRows = {
  table: 'professions',
  out: (p: Profession): Row => ({ id: p.id, name_en: p.name.en, name_ar: p.name.ar }),
  in: (r: Row): Profession => ({ id: text(r.id), name: { en: text(r.name_en), ar: text(r.name_ar) } }),
}

export const paymentSourceRows = {
  table: 'payment_sources',
  out: (p: PaymentSource): Row => ({ id: p.id, name: p.name, scopes: p.scopes }),
  in: (r: Row): PaymentSource => ({
    id: text(r.id),
    name: text(r.name),
    scopes: (r.scopes as PaymentSource['scopes']) ?? [],
  }),
}

/**
 * One row, holding what the company is called and what it bills in. Language
 * and theme are not here: those are how one person likes to read the screen,
 * not something the office agrees on.
 */
export const settingsRows = {
  table: 'settings',
  out: (s: CompanySettings): Row => ({
    id: true,
    company_name: s.companyName,
    company_tagline: s.companyTagline,
    license_number: s.licenseNumber,
    address: s.address,
    currency: s.currency,
  }),
  in: (r: Row): CompanySettings => ({
    companyName: text(r.company_name),
    companyTagline: text(r.company_tagline),
    licenseNumber: text(r.license_number),
    address: text(r.address),
    currency: text(r.currency) || 'USD',
  }),
}

export interface CompanySettings {
  companyName: string
  companyTagline: string
  licenseNumber: string
  address: string
  currency: string
}

// ---------------------------------------------------------------- people --

/**
 * Passwords are absent by design: auth.users holds them, and ops.staff only
 * points at the account. A member read back from the database therefore has no
 * credentials, and the app treats that as "signs in through Supabase".
 */
export const staffRows = {
  table: 'staff',
  out: (m: StaffMember): Row => ({
    id: m.id,
    user_id: m.userId,
    username: m.username.toLowerCase(),
    name_en: m.name.en,
    name_ar: m.name.ar,
    phone: m.phone,
    email: m.email,
    role: m.role,
    status: m.status,
  }),
  in: (r: Row): StaffMember => ({
    id: text(r.id),
    userId: (r.user_id as string | null) ?? null,
    username: text(r.username),
    name: { en: text(r.name_en), ar: text(r.name_ar) },
    phone: text(r.phone),
    email: text(r.email),
    role: r.role as StaffMember['role'],
    status: r.status as StaffMember['status'],
    credentials: null,
  }),
}

export const agencyRows = {
  table: 'agencies',
  out: (a: RecruitmentAgency): Row => ({
    id: a.id,
    english_name: a.englishName,
    arabic_name: a.arabicName,
    license_number: a.licenseNumber,
    license_expiry: dateOut(a.licenseExpiry),
    phone: a.phone,
    email: a.email,
    telephone: a.telephone,
    rating: a.rating,
    primary_manager_en: a.primaryManager.en,
    primary_manager_ar: a.primaryManager.ar,
    second_manager_en: a.secondManager.en,
    second_manager_ar: a.secondManager.ar,
    status: a.status,
  }),
  in: (r: Row): RecruitmentAgency => ({
    id: text(r.id),
    englishName: text(r.english_name),
    arabicName: text(r.arabic_name),
    licenseNumber: text(r.license_number),
    licenseExpiry: dateIn(r.license_expiry),
    phone: text(r.phone),
    email: text(r.email),
    telephone: text(r.telephone),
    rating: Number(r.rating ?? 0),
    primaryManager: { en: text(r.primary_manager_en), ar: text(r.primary_manager_ar) },
    secondManager: { en: text(r.second_manager_en), ar: text(r.second_manager_ar) },
    status: r.status as RecruitmentAgency['status'],
    createdOn: dateIn(r.created_at),
  }),
}

export const agentRows = {
  table: 'agents',
  out: (a: Agent): Row => ({
    id: a.id,
    name_en: a.name.en,
    name_ar: a.name.ar,
    phone: a.phone,
    email: a.email,
    area: a.area,
    status: a.status,
    selection_fee: a.selectionFee,
    deployment_fee: a.deploymentFee,
    notes: a.notes,
  }),
  in: (r: Row): Agent => ({
    id: text(r.id),
    name: { en: text(r.name_en), ar: text(r.name_ar) },
    phone: text(r.phone),
    email: text(r.email),
    area: text(r.area),
    status: r.status as Agent['status'],
    selectionFee: money(r.selection_fee),
    deploymentFee: money(r.deployment_fee),
    notes: text(r.notes),
    createdOn: dateIn(r.created_at),
  }),
}

export const employerRows = {
  table: 'employers',
  out: (e: Employer): Row => ({
    id: e.id,
    english_name: e.englishName,
    arabic_name: e.arabicName,
    email: e.email,
    phone: e.phone,
    telephone: e.telephone,
    national_address: e.nationalAddress,
    national_id_number: e.nationalIdNumber,
    national_address_short_code: e.nationalAddressShortCode,
    status: e.status,
  }),
  in: (r: Row): Employer => ({
    id: text(r.id),
    englishName: text(r.english_name),
    arabicName: text(r.arabic_name),
    email: text(r.email),
    phone: text(r.phone),
    telephone: text(r.telephone),
    nationalAddress: text(r.national_address),
    nationalIdNumber: text(r.national_id_number),
    nationalAddressShortCode: text(r.national_address_short_code),
    status: r.status as Employer['status'],
    profileImageDataUrl: null,
    createdOn: dateIn(r.created_at),
  }),
}

// -------------------------------------------------------------- caseload --

export const applicantRows = {
  table: 'applicants',
  out: (a: Applicant): Row => ({
    id: a.id,
    english_name: a.englishName,
    arabic_name: a.arabicName,
    gender: a.gender,
    dob: dateOut(a.dob),
    country: a.country,
    profession: a.profession,
    type: a.type,
    experience_years: a.experienceYears,
    passport_no: a.passportNo,
    passport_start: dateOut(a.passportStart),
    passport_end: dateOut(a.passportEnd),
    id_number: a.idNumber,
    phone: a.phone,
    telephone: a.telephone,
    status: a.status,
    photo_path: a.photoPath,
    cv_path: a.cvPath,
    cv_file_name: a.cvFileName,
    // Still a name rather than a path, until passport copies are uploaded too.
    passport_copy_path: a.passportCopyFileName,
    published_to_website: a.cvLinkedToWebsite,
    agency_id: a.recruitmentAgencyId,
    agent_id: a.agentId,
  }),
  in: (r: Row): Applicant => ({
    id: text(r.id),
    englishName: text(r.english_name),
    arabicName: text(r.arabic_name),
    gender: r.gender as Applicant['gender'],
    dob: dateIn(r.dob),
    country: text(r.country),
    profession: text(r.profession),
    type: r.type as Applicant['type'],
    experienceYears: Number(r.experience_years ?? 0),
    passportNo: text(r.passport_no),
    passportStart: dateIn(r.passport_start),
    passportEnd: dateIn(r.passport_end),
    idNumber: text(r.id_number),
    phone: text(r.phone),
    telephone: text(r.telephone),
    status: r.status as Applicant['status'],
    photoDataUrl: null,
    photoPath: (r.photo_path as string | null) ?? null,
    cvPath: (r.cv_path as string | null) ?? null,
    cvFileName: (r.cv_file_name as string | null) ?? null,
    passportCopyFileName: (r.passport_copy_path as string | null) ?? null,
    cvLinkedToWebsite: Boolean(r.published_to_website),
    experience: [],
    education: [],
    documents: [],
    notes: [],
    recruitmentAgencyId: (r.agency_id as string | null) ?? null,
    agentId: (r.agent_id as string | null) ?? null,
    createdOn: dateIn(r.created_at),
    updatedOn: dateIn(r.updated_at),
    updatedBy: '',
  }),
}

export const experienceRows = {
  table: 'applicant_experience',
  out: (e: ExperienceEntry, applicantId: string): Row => ({
    id: e.id,
    applicant_id: applicantId,
    title: e.title,
    employer: e.employer,
    years: e.years,
  }),
  in: (r: Row): ExperienceEntry => ({
    id: text(r.id),
    title: text(r.title),
    employer: text(r.employer),
    years: Number(r.years ?? 0),
  }),
}

export const educationRows = {
  table: 'applicant_education',
  out: (e: EducationEntry, applicantId: string): Row => ({
    id: e.id,
    applicant_id: applicantId,
    degree: e.degree,
    institution: e.institution,
    year: e.year,
  }),
  in: (r: Row): EducationEntry => ({
    id: text(r.id),
    degree: text(r.degree),
    institution: text(r.institution),
    year: text(r.year),
  }),
}

export const documentRows = {
  table: 'applicant_documents',
  out: (d: ApplicantDocument, applicantId: string): Row => ({
    id: d.id,
    applicant_id: applicantId,
    name: d.name,
    category: d.category,
    ...(d.uploadedOn ? { uploaded_at: `${d.uploadedOn}T00:00:00Z` } : {}),
  }),
  in: (r: Row): ApplicantDocument => ({
    id: text(r.id),
    name: text(r.name),
    category: text(r.category),
    uploadedOn: dateIn(r.uploaded_at),
  }),
}

export const noteRows = {
  table: 'applicant_notes',
  out: (n: ApplicantNote, applicantId: string): Row => ({
    id: n.id,
    applicant_id: applicantId,
    body: n.text,
    ...createdOut(n.date),
  }),
  in: (r: Row): ApplicantNote => ({
    id: text(r.id),
    author: '',
    date: dateIn(r.created_at),
    text: text(r.body),
  }),
}

export const requestRows = {
  table: 'requests',
  out: (r: RecruitmentRequest): Row => ({
    id: r.id,
    type: r.type,
    contract_duration_months: r.contractDurationMonths,
    applicant_id: r.applicantId,
    employer_id: r.employerId,
    responsible_staff_id: r.responsibleEmployeeId || null,
    agency_id: r.recruitmentAgencyId || null,
    mosaned_number: r.mosanedNumber,
    notes_en: r.notes.en,
    notes_ar: r.notes.ar,
  }),
  in: (r: Row): RecruitmentRequest => ({
    id: text(r.id),
    type: r.type as RecruitmentRequest['type'],
    contractDurationMonths: Number(r.contract_duration_months ?? 0),
    applicantId: text(r.applicant_id),
    employerId: text(r.employer_id),
    responsibleEmployeeId: text(r.responsible_staff_id),
    recruitmentAgencyId: text(r.agency_id),
    mosanedNumber: text(r.mosaned_number),
    notes: { en: text(r.notes_en), ar: text(r.notes_ar) },
    statusHistory: [],
    createdOn: dateIn(r.created_at),
    updatedOn: dateIn(r.updated_at),
  }),
}

export const statusHistoryRows = {
  table: 'request_status_history',
  out: (h: StatusHistoryEntry, requestId: string): Row => ({
    id: h.id,
    request_id: requestId,
    status: h.status,
    occurred_on: h.date,
    cost: h.cost,
    payment_source_id: h.paymentSourceId || null,
    responsible_staff_id: h.responsibleEmployeeId || null,
    notes: h.notes,
    ...attachmentOut(h.attachment),
  }),
  in: (r: Row): StatusHistoryEntry => ({
    id: text(r.id),
    status: text(r.status),
    date: dateIn(r.occurred_on),
    cost: money(r.cost),
    paymentSourceId: text(r.payment_source_id),
    responsibleEmployeeId: text(r.responsible_staff_id),
    attachment: attachmentIn(r),
    notes: text(r.notes),
  }),
}

// ----------------------------------------------------------------- money --

export const invoiceRows = {
  table: 'invoices',
  out: (i: Invoice): Row => ({
    id: i.id,
    invoice_number: i.invoiceNumber,
    request_id: i.recruitmentRequestId || null,
    employer_id: i.employerId,
    agency_id: i.recruitmentAgencyId || null,
    service_price: i.servicePrice,
    status: i.status,
    issued_on: i.issuedOn,
  }),
  in: (r: Row): Invoice => ({
    id: text(r.id),
    invoiceNumber: text(r.invoice_number),
    recruitmentRequestId: text(r.request_id),
    employerId: text(r.employer_id),
    recruitmentAgencyId: text(r.agency_id),
    servicePrice: money(r.service_price),
    payments: [],
    status: r.status as Invoice['status'],
    issuedOn: dateIn(r.issued_on),
  }),
}

export const paymentRows = {
  table: 'invoice_payments',
  out: (p: InvoicePayment, invoiceId: string): Row => ({
    id: p.id,
    invoice_id: invoiceId,
    paid_on: p.date,
    amount: p.amount,
    payment_source_id: p.sourceId || null,
    ...attachmentOut(p.attachment),
  }),
  in: (r: Row): InvoicePayment => ({
    id: text(r.id),
    date: dateIn(r.paid_on),
    amount: money(r.amount),
    sourceId: text(r.payment_source_id),
    attachment: attachmentIn(r),
  }),
}

export const payrollRows = {
  table: 'payroll_entries',
  out: (e: PayrollEntry): Row => ({
    id: e.id,
    staff_id: e.staffId,
    period: monthOut(e.month),
    basic_salary: e.basicSalary,
    overtime: e.overtime,
    allowances: e.allowances,
    status: e.status,
    ...attachmentOut(e.attachment),
  }),
  in: (r: Row): PayrollEntry => ({
    id: text(r.id),
    staffId: text(r.staff_id),
    month: monthIn(r.period),
    basicSalary: money(r.basic_salary),
    overtime: money(r.overtime),
    allowances: money(r.allowances),
    status: r.status as PayrollEntry['status'],
    attachment: attachmentIn(r),
  }),
}

export const officeExpenseRows = {
  table: 'office_expenses',
  out: (e: OfficeExpense): Row => ({
    id: e.id,
    item_en: e.item.en,
    item_ar: e.item.ar,
    category: e.category,
    amount: e.amount,
    spent_on: e.date,
    status: e.status,
    ...attachmentOut(e.attachment),
  }),
  in: (r: Row): OfficeExpense => ({
    id: text(r.id),
    item: { en: text(r.item_en), ar: text(r.item_ar) },
    category: text(r.category),
    amount: money(r.amount),
    date: dateIn(r.spent_on),
    status: r.status as OfficeExpense['status'],
    attachment: attachmentIn(r),
  }),
}

export const contractRows = {
  table: 'agency_contracts',
  out: (c: AgencyContract): Row => ({
    id: c.id,
    agency_id: c.agencyId,
    reference: c.reference,
    price_per_worker: c.pricePerWorker,
    signed_on: dateOut(c.signedOn),
    expires_on: dateOut(c.expiresOn),
    status: c.status,
    notes: c.notes,
  }),
  in: (r: Row): AgencyContract => ({
    id: text(r.id),
    agencyId: text(r.agency_id),
    reference: text(r.reference),
    pricePerWorker: money(r.price_per_worker),
    signedOn: dateIn(r.signed_on),
    expiresOn: dateIn(r.expires_on),
    status: r.status as AgencyContract['status'],
    notes: text(r.notes),
  }),
}

export const chargeRows = {
  table: 'agency_charges',
  out: (c: AgencyCharge): Row => ({
    id: c.id,
    agency_id: c.agencyId,
    contract_id: c.contractId || null,
    applicant_id: c.applicantId,
    request_id: c.requestId,
    milestone: c.milestone,
    amount: c.amount,
    due_on: c.dueOn,
    status: c.status,
    settled_on: dateOut(c.settledOn),
    payment_source_id: c.paymentSourceId,
  }),
  in: (r: Row): AgencyCharge => ({
    id: text(r.id),
    agencyId: text(r.agency_id),
    contractId: text(r.contract_id),
    applicantId: text(r.applicant_id),
    requestId: text(r.request_id),
    milestone: r.milestone as AgencyCharge['milestone'],
    amount: money(r.amount),
    dueOn: dateIn(r.due_on),
    status: r.status as AgencyCharge['status'],
    settledOn: (r.settled_on ? dateIn(r.settled_on) : null),
    paymentSourceId: (r.payment_source_id as string | null) ?? null,
  }),
}

export const commissionRows = {
  table: 'agent_commissions',
  out: (c: AgentCommission): Row => ({
    id: c.id,
    agent_id: c.agentId,
    applicant_id: c.applicantId,
    request_id: c.requestId,
    milestone: c.milestone,
    amount: c.amount,
    earned_on: c.earnedOn,
    status: c.status,
    paid_on: dateOut(c.paidOn),
    payment_source_id: c.paymentSourceId,
  }),
  in: (r: Row): AgentCommission => ({
    id: text(r.id),
    agentId: text(r.agent_id),
    applicantId: text(r.applicant_id),
    requestId: text(r.request_id),
    milestone: r.milestone as AgentCommission['milestone'],
    amount: money(r.amount),
    earnedOn: dateIn(r.earned_on),
    status: r.status as AgentCommission['status'],
    paidOn: (r.paid_on ? dateIn(r.paid_on) : null),
    paymentSourceId: (r.payment_source_id as string | null) ?? null,
  }),
}

export const backoutRows = {
  table: 'backouts',
  out: (b: Backout): Row => ({
    id: b.id,
    request_id: b.requestId,
    applicant_id: b.applicantId,
    deployed_on: dateOut(b.deployedOn),
    returned_on: b.returnedOn,
    reason: b.reason,
    liability: b.liability,
    notes: b.notes,
  }),
  in: (r: Row): Backout => ({
    id: text(r.id),
    requestId: text(r.request_id),
    applicantId: text(r.applicant_id),
    deployedOn: (r.deployed_on ? dateIn(r.deployed_on) : null),
    returnedOn: dateIn(r.returned_on),
    reason: text(r.reason),
    liability: r.liability as Backout['liability'],
    notes: text(r.notes),
    costs: [],
    createdOn: dateIn(r.created_at),
  }),
}

export const backoutCostRows = {
  table: 'backout_costs',
  out: (c: BackoutCost, backoutId: string): Row => ({
    id: c.id,
    backout_id: backoutId,
    label_en: c.label.en,
    label_ar: c.label.ar,
    category: c.category,
    amount: c.amount,
    spent_on: c.date,
    status: c.status,
    payment_source_id: c.paymentSourceId,
    ...attachmentOut(c.attachment),
  }),
  in: (r: Row): BackoutCost => ({
    id: text(r.id),
    label: { en: text(r.label_en), ar: text(r.label_ar) },
    category: text(r.category),
    amount: money(r.amount),
    date: dateIn(r.spent_on),
    status: r.status as BackoutCost['status'],
    paymentSourceId: (r.payment_source_id as string | null) ?? null,
    attachment: attachmentIn(r),
  }),
}

export const notificationRows = {
  table: 'notifications',
  out: (n: AppNotification): Row => ({
    id: n.id,
    title: n.title,
    detail: n.detail,
    read_at: n.read ? `${n.date}T00:00:00Z` : null,
    ...createdOut(n.date),
  }),
  in: (r: Row): AppNotification => ({
    id: text(r.id),
    title: text(r.title),
    detail: text(r.detail),
    date: dateIn(r.created_at),
    read: r.read_at !== null && r.read_at !== undefined,
  }),
}
