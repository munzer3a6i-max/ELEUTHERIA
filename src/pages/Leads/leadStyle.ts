/*
  The colours and icons the lead pages give a stage and a source, and the
  initials on an owner's badge.
*/

import { FileText, Mail, MessageCircle, PenLine } from 'lucide-react'
import type { LeadSource, LeadStage } from '../../types'

/** The pill each stage wears, as the design colours them. */
export const STAGE_TONE: Record<LeadStage, string> = {
  'New enquiry': 'bg-[#f4f6f9] text-[#69768a]',
  Qualified: 'bg-[#edf3f9] text-[#42688b]',
  'Proposal sent': 'bg-[#fbf4e5] text-[#82601d]',
  Shortlisting: 'bg-[#fbf4e5] text-[#82601d]',
  Won: 'bg-[#eaf5ef] text-[#24735b]',
  Lost: 'bg-[#fdecea] text-[#b5473d]',
}

export const SOURCE_ICON: Record<LeadSource, typeof Mail> = {
  'Manual entry': PenLine,
  WhatsApp: MessageCircle,
  Email: Mail,
  'Website form': FileText,
}

/** Two letters for somebody's round badge. */
export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return '—'
  return (words[0][0] + (words.length > 1 ? words[words.length - 1][0] : '')).toUpperCase()
}
