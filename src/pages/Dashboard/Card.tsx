import type { ReactNode } from 'react'

export default function Card({
  icon,
  title,
  subtitle,
  action,
  children,
  className = '',
  bodyClassName = 'p-4',
}: {
  icon?: ReactNode
  title?: string
  subtitle?: string
  action?: ReactNode
  children: ReactNode
  className?: string
  bodyClassName?: string
}) {
  return (
    <section className={`flex h-full flex-col rounded-lg border border-[var(--edge)] bg-[var(--surface)] ${className}`}>
      {title && (
        <header className="flex items-start justify-between gap-3 border-b border-[var(--edge-soft)] px-4 py-3">
          <div className="flex items-center gap-2.5">
            {icon && (
              <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-amber-500/30 bg-amber-500/10 text-amber-400">
                {icon}
              </span>
            )}
            <div>
              <h2 className="text-xs font-bold uppercase tracking-[0.3px] text-[var(--text-primary)]">{title}</h2>
              {subtitle && <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">{subtitle}</p>}
            </div>
          </div>
          {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
        </header>
      )}
      <div className={`flex-1 ${bodyClassName}`}>{children}</div>
    </section>
  )
}
