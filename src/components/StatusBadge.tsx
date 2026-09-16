const colorMap: Record<string, string> = {
  Available: 'border-emerald-500/40 bg-emerald-950/80 text-emerald-400',
  Unavailable: 'border-slate-500/40 bg-slate-800/60 text-slate-300',
  Selected: 'border-blue-500/50 bg-blue-900/60 text-blue-300',
  Deployed: 'border-amber-500/40 bg-amber-950/60 text-amber-400',
  Active: 'border-emerald-500/40 bg-emerald-950/80 text-emerald-400',
  Inactive: 'border-slate-500/40 bg-slate-800/60 text-slate-300',
  Issued: 'border-slate-500/40 bg-slate-800/60 text-slate-300',
  'Partial Payment': 'border-amber-500/40 bg-amber-950/60 text-amber-400',
  Completed: 'border-emerald-500/40 bg-emerald-950/80 text-emerald-400',
  Domestic: 'border-blue-500/50 bg-blue-900/60 text-blue-300',
  Profession: 'border-amber-500/40 bg-amber-950/60 text-amber-400',
  'عمالة منزلية': 'border-blue-500/50 bg-blue-900/60 text-blue-300',
  مهنية: 'border-amber-500/40 bg-amber-950/60 text-amber-400',
  New: 'border-slate-500/40 bg-slate-800/60 text-slate-300',
  Screening: 'border-amber-500/40 bg-amber-950/60 text-amber-400',
  Interview: 'border-blue-500/50 bg-blue-900/60 text-blue-300',
  Approved: 'border-emerald-500/40 bg-emerald-950/80 text-emerald-400',
  Rejected: 'border-rose-500/40 bg-rose-950/60 text-rose-400',
  Paid: 'border-emerald-500/40 bg-emerald-950/80 text-emerald-400',
  Pending: 'border-amber-500/40 bg-amber-950/60 text-amber-400',
  مدفوع: 'border-emerald-500/40 bg-emerald-950/80 text-emerald-400',
  'قيد الانتظار': 'border-amber-500/40 bg-amber-950/60 text-amber-400',
}

export default function StatusBadge({ status }: { status: string }) {
  const cls = colorMap[status] ?? 'border-slate-500/40 bg-slate-800/60 text-slate-300'
  return (
    <span className={`inline-flex shrink-0 items-center rounded border px-2.5 py-0.5 text-[10px] font-bold ${cls}`}>
      {status}
    </span>
  )
}
