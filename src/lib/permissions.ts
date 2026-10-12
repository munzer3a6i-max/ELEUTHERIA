/*
  Who may see what, and who may change it.

  Four roles, and one rule each:

    super admin  - everything, and the only one who may open the System pages:
                   the people, the lists the office runs on, the stages of the
                   recruitment itself, and the settings. Whoever holds this can
                   hand it to somebody else, so it is the keys to the building.
    admin        - runs the office: the whole caseload and the whole of the
                   money, and nothing that changes how the system itself works.
    accountant   - reads the whole office, changes only the money.
    data entry   - works the caseload, and the money pages are not there.

  Areas are the unit of permission. Every screen belongs to one, and so does
  every action in the store, which is what makes the rule enforceable rather
  than decorative: hiding a button stops an honest mistake, refusing the action
  stops the rest.
*/

import type { StaffRole } from '../types'

export type Area = 'finance' | 'operations' | 'system' | 'personal'

interface Rule {
  view: Area[]
  edit: Area[]
}

const RULES: Record<StaffRole, Rule> = {
  super_admin: {
    view: ['finance', 'operations', 'system', 'personal'],
    edit: ['finance', 'operations', 'system', 'personal'],
  },
  admin: {
    view: ['finance', 'operations', 'personal'],
    edit: ['finance', 'operations', 'personal'],
  },
  accountant: {
    // Sees the caseload because the money only makes sense beside it, but the
    // caseload is not theirs to edit.
    view: ['finance', 'operations', 'personal'],
    edit: ['finance', 'personal'],
  },
  data_entry: {
    view: ['operations', 'personal'],
    edit: ['operations', 'personal'],
  },
}

export function canView(role: StaffRole, area: Area): boolean {
  return RULES[role].view.includes(area)
}

export function canEdit(role: StaffRole, area: Area): boolean {
  return RULES[role].edit.includes(area)
}

/** The label a person sees for their own role. */
export const ROLE_LABEL: Record<StaffRole, { en: string; ar: string }> = {
  super_admin: { en: 'Super Administrator', ar: 'مسؤول أعلى' },
  admin: { en: 'Administrator', ar: 'مسؤول' },
  accountant: { en: 'Accountant', ar: 'محاسب' },
  data_entry: { en: 'Data Entry', ar: 'إدخال بيانات' },
}

export const ROLE_SUMMARY: Record<StaffRole, { en: string; ar: string }> = {
  super_admin: {
    en: 'Everything, plus the System pages: people, permissions, the stages and the settings',
    ar: 'كل شيء، إضافة إلى صفحات النظام: المستخدمون والصلاحيات والمراحل والإعدادات',
  },
  admin: { en: 'The whole caseload and the whole of the money', ar: 'كل الملفات وكل الحسابات' },
  accountant: { en: 'Changes the finance pages, reads the rest', ar: 'يعدّل الصفحات المالية ويطّلع على الباقي' },
  data_entry: { en: 'Works the caseload, no finance pages', ar: 'يعمل على الملفات دون الصفحات المالية' },
}

export const ROLES: StaffRole[] = ['super_admin', 'admin', 'accountant', 'data_entry']

/**
 * The area a path belongs to. Longest prefix wins, so /accounting/payroll is
 * finance even though /accounting alone would already say so.
 */
const ROUTE_AREAS: [string, Area][] = [
  ['/accounting', 'finance'],
  ['/invoices', 'finance'],
  ['/reports', 'finance'],
  ['/agents', 'operations'],
  ['/applicants', 'operations'],
  ['/employers', 'operations'],
  ['/agencies', 'operations'],
  ['/recruitments', 'operations'],
  ['/staff', 'system'],
  ['/addons', 'system'],
  ['/settings', 'system'],
  ['/notifications', 'system'],
  ['/account', 'personal'],
  ['/', 'operations'],
]

export function areaForPath(pathname: string): Area {
  for (const [prefix, area] of ROUTE_AREAS) {
    if (prefix === '/' ? pathname === '/' : pathname.startsWith(prefix)) return area
  }
  return 'operations'
}
