type Tone = 'pos' | 'neg' | 'warn' | 'info' | 'accent' | 'neutral'

/*
  One chip vocabulary for every state in the app. Tones carry meaning, never
  decoration: settled and available read positive, money owed and rejections
  read negative, anything mid-pipeline reads as in-progress.
*/
const TONES: Record<string, Tone> = {
  // Records
  Active: 'pos',
  Available: 'pos',
  Inactive: 'neutral',
  Unavailable: 'neutral',
  Suspended: 'neg',
  // Placement
  Selected: 'info',
  Deployed: 'pos',
  'Guarantee Completed': 'pos',
  Repatriated: 'warn',
  Transfer: 'warn',
  Unfit: 'neg',
  'Back Out': 'neg',
  // Money
  Issued: 'neutral',
  'Partial Payment': 'warn',
  Completed: 'pos',
  Paid: 'pos',
  Pending: 'warn',
  // Request types
  Domestic: 'info',
  Profession: 'accent',
  'عمالة منزلية': 'info',
  مهنية: 'accent',
  // Arabic record states
  نشط: 'pos',
  'غير نشط': 'neutral',
  مدفوع: 'pos',
  'قيد الانتظار': 'warn',
  // Legacy screening vocabulary
  New: 'neutral',
  Screening: 'warn',
  Interview: 'info',
  Approved: 'pos',
  Rejected: 'neg',
}

export default function StatusBadge({ status, tone }: { status: string; tone?: Tone }) {
  const resolved = tone ?? TONES[status] ?? 'neutral'
  return <span className={`chip chip-${resolved}`}>{status}</span>
}
