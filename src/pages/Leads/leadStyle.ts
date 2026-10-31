/*
  The chip each stage wears, the icon for each source, and the initials on an
  owner's badge -- in the app's own chip colours, so a lead page reads like
  every other page in either theme.
*/

import { FileText, Mail, MessageCircle, PenLine } from 'lucide-react'
import type { LeadSource, LeadStage } from '../../types'

/** The design's stage colours, as the app's chips: grey, blue, gold, green, red. */
export const STAGE_CHIP: Record<LeadStage, string> = {
  'New enquiry': 'chip chip-neutral',
  Qualified: 'chip chip-info',
  'Proposal sent': 'chip chip-accent',
  Shortlisting: 'chip chip-accent',
  Won: 'chip chip-pos',
  Lost: 'chip chip-neg',
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
