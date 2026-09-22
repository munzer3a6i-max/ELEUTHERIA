import type { ReactNode } from 'react'

export interface Stat {
  label: string
  value: string
  note?: string
  /** Only for figures that carry a direction: money in, money out, overdue. */
  tone?: 'pos' | 'neg' | 'warn' | 'accent'
  /** Marks the one figure the page is really about. */
  lead?: boolean
  icon?: ReactNode
}

const TONE_TEXT = {
  pos: 'text-pos',
  neg: 'text-neg',
  warn: 'text-warn',
  accent: 'text-accent-text',
} as const

const COLUMNS: Record<number, string> = {
  2: 'grid-cols-2',
  3: 'grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-2 xl:grid-cols-4',
  5: 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
}

/**
 * The figure row every page opens with. Surfaces stay neutral so the single
 * brand accent keeps its meaning; colour on a number means direction, not
 * decoration.
 */
export default function StatStrip({ stats }: { stats: Stat[] }) {
  return (
    <div className={`grid gap-3 ${COLUMNS[stats.length] ?? 'grid-cols-2 xl:grid-cols-4'}`}>
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={`panel relative overflow-hidden px-4 py-3.5 ${stat.lead ? 'border-accent-line' : ''}`}
        >
          {stat.lead && <span aria-hidden="true" className="absolute inset-y-0 start-0 w-[3px] bg-accent" />}
          <div className="flex items-start justify-between gap-3">
            <p className="text-[11px] font-medium text-ink-3">{stat.label}</p>
            {stat.icon && <span className="shrink-0 text-ink-3">{stat.icon}</span>}
          </div>
          <p dir="ltr" className={`num mt-1.5 truncate text-[22px] font-medium leading-none rtl:text-end ${stat.tone ? TONE_TEXT[stat.tone] : 'text-ink'}`}>
            {stat.value}
          </p>
          {stat.note && <p className="mt-1.5 truncate text-[11px] text-ink-3">{stat.note}</p>}
        </div>
      ))}
    </div>
  )
}
