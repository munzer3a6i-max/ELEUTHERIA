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
    data entry   - keeps the four directories -- workers, employers, partner
                   offices, agents -- and nothing else. They add and correct
                   what is on file; they do not open placements, bill anybody,
                   or remove a record once it is there.

  Three verbs, not two. Adding and correcting a record is ordinary work;
  removing one is not, and a role can be trusted with the first without the
  second. Data entry is exactly that case.

  Areas are the unit of permission. Every screen belongs to one, and so does
  every action in the store, which is what makes the rule enforceable rather
  than decorative: hiding a button stops an honest mistake, refusing the action
  stops the rest.
*/

import type { StaffRole } from '../types'

/**
 * `directory` is the four lists the office keeps -- workers, employers,
 * partner offices and agents -- and the records behind them. `placements` is
 * the recruitment itself: the requests, their stage log, and the dashboard that
 * reports on them.
 */
export type Area = 'finance' | 'directory' | 'placements' | 'system' | 'personal'

interface Rule {
  view: Area[]
  edit: Area[]
  /** Where this role may delete a record, which is never everywhere it may edit. */
  remove: Area[]
}

const ALL: Area[] = ['finance', 'directory', 'placements', 'system', 'personal']

const RULES: Record<StaffRole, Rule> = {
  super_admin: { view: ALL, edit: ALL, remove: ALL },
  admin: {
    view: ['finance', 'directory', 'placements', 'personal'],
    edit: ['finance', 'directory', 'placements', 'personal'],
    remove: ['finance', 'directory', 'placements', 'personal'],
  },
  accountant: {
    // Sees the caseload because the money only makes sense beside it, but the
    // caseload is not theirs to edit.
    view: ['finance', 'directory', 'placements', 'personal'],
    edit: ['finance', 'personal'],
    remove: ['finance', 'personal'],
  },
  data_entry: {
    // The four directories, and what is written in them. Not the placements,
    // not the money, and nothing at all once it comes to deleting a record:
    // a wrong entry is corrected, not removed.
    view: ['directory', 'personal'],
    edit: ['directory', 'personal'],
    remove: [],
  },
  // On the payroll, not in the dashboard. Nothing is open to them, which is the
  // point: the row exists so the office can pay them.
  none: { view: [], edit: [], remove: [] },
}

export function canView(role: StaffRole, area: Area): boolean {
  return RULES[role].view.includes(area)
}

export function canEdit(role: StaffRole, area: Area): boolean {
  return RULES[role].edit.includes(area)
}

/** May this person delete a record here? Narrower than editing, on purpose. */
export function canRemove(role: StaffRole, area: Area): boolean {
  return RULES[role].remove.includes(area)
}

/** The label a person sees for their own role. */
export const ROLE_LABEL: Record<StaffRole, { en: string; ar: string }> = {
  super_admin: { en: 'Super Administrator', ar: 'مسؤول أعلى' },
  admin: { en: 'Administrator', ar: 'مسؤول' },
  accountant: { en: 'Accountant', ar: 'محاسب' },
  data_entry: { en: 'Data Entry', ar: 'إدخال بيانات' },
  none: { en: 'No sign-in', ar: 'بدون دخول' },
}

export const ROLE_SUMMARY: Record<StaffRole, { en: string; ar: string }> = {
  super_admin: {
    en: 'Everything, plus the System pages: people, permissions, the stages and the settings',
    ar: 'كل شيء، إضافة إلى صفحات النظام: المستخدمون والصلاحيات والمراحل والإعدادات',
  },
  admin: { en: 'The whole caseload and the whole of the money', ar: 'كل الملفات وكل الحسابات' },
  accountant: { en: 'Changes the finance pages, reads the rest', ar: 'يعدّل الصفحات المالية ويطّلع على الباقي' },
  data_entry: {
    en: 'Adds and corrects workers, employers, offices and agents \u2014 nothing else, and deletes nothing',
    ar: 'يضيف ويعدّل العاملات وأصحاب العمل والمكاتب والوكلاء فقط، ولا يحذف شيئًا',
  },
  none: {
    en: 'On the payroll, with no way into the dashboard',
    ar: 'على كشف الرواتب، دون أي صلاحية للدخول إلى النظام',
  },
}

export const ROLES: StaffRole[] = ['super_admin', 'admin', 'accountant', 'data_entry', 'none']

/**
 * The area a path belongs to. Longest prefix wins, so /accounting/payroll is
 * finance even though /accounting alone would already say so.
 */
const ROUTE_AREAS: [string, Area][] = [
  ['/accounting', 'finance'],
  ['/invoices', 'finance'],
  ['/reports', 'finance'],
  ['/agents', 'directory'],
  ['/applicants', 'directory'],
  ['/employers', 'directory'],
  ['/agencies', 'directory'],
  ['/recruitments', 'placements'],
  ['/staff', 'system'],
  ['/leads', 'system'],
  ['/addons', 'system'],
  ['/settings', 'system'],
  ['/notifications', 'system'],
  ['/account', 'personal'],
  // The dashboard reports on the placements, so it belongs with them.
  ['/', 'placements'],
]

/**
 * The page to open on, for a role that may not see the dashboard. Data entry
 * works the four directories, so it lands on the first of them rather than on a
 * locked page explaining itself.
 */
export function homeFor(role: StaffRole): string {
  return canView(role, 'placements') ? '/' : '/applicants'
}

export function areaForPath(pathname: string): Area {
  for (const [prefix, area] of ROUTE_AREAS) {
    if (prefix === '/' ? pathname === '/' : pathname.startsWith(prefix)) return area
  }
  return 'placements'
}
