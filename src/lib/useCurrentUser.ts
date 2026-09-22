import { useAppStore } from '../store/useAppStore'
import { canEdit, canView, type Area } from './permissions'
import type { StaffMember, StaffRole } from '../types'

export interface CurrentUser {
  member: StaffMember | null
  role: StaffRole
  /** May this person open pages in this area at all? */
  canView: (area: Area) => boolean
  /** May this person change things in this area? */
  canEdit: (area: Area) => boolean
}

/**
 * Who is signed in and what they may do. Signed out, or signed in as someone
 * who has been removed or suspended, falls back to the narrowest role rather
 * than the widest.
 */
export function useCurrentUser(): CurrentUser {
  const staff = useAppStore((s) => s.staff)
  const currentStaffId = useAppStore((s) => s.currentStaffId)

  const member = staff.find((m) => m.id === currentStaffId) ?? null
  const role: StaffRole = member && member.status === 'Active' ? member.role : 'data_entry'

  return {
    member,
    role,
    canView: (area) => canView(role, area),
    canEdit: (area) => canEdit(role, area),
  }
}
