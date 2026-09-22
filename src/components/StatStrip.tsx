import type { ReactNode } from 'react'

export interface Stat {
  label: string
  value: string
  note?: string
  accent?: string
  icon?: ReactNode
}

const COLUMNS: Record<number, string> = {
  2: 'lg:grid-cols-2',
  3: 'lg:grid-cols-3',
  4: 'lg:grid-cols-4',
  5: 'lg:grid-cols-5',
}

/** The compact KPI row every accounting page opens with. */
export default function StatStrip({ stats }: { stats: Stat[] }) {
  return (
    <div className={`grid grid-cols-2 gap-4 ${COLUMNS[stats.length] ?? 'lg:grid-cols-4'}`}>
      {stats.map((stat) => (
        <div key={stat.label} className="flex items-center gap-3 rounded-lg border border-[var(--edge)] bg-[var(--surface)] p-3.5">
          {stat.icon && (
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400">
              {stat.icon}
            </span>
          )}
          <div className="min-w-0">
            <p className="text-[11px] text-[var(--text-muted)]">{stat.label}</p>
            <p dir="ltr" className={`truncate text-lg font-bold rtl:text-end ${stat.accent ?? 'text-[var(--text-primary)]'}`}>
              {stat.value}
            </p>
            {stat.note && <p className="truncate text-[10px] text-[var(--text-muted)]">{stat.note}</p>}
          </div>
        </div>
      ))}
    </div>
  )
}
