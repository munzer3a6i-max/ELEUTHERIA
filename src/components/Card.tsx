import type { ReactNode } from 'react'

/**
 * The one panel shell. A header appears only when the section needs a name;
 * otherwise content sits directly on the surface, because a box inside a box
 * costs density and buys nothing.
 */
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
    <section className={`panel flex h-full flex-col ${className}`}>
      {title && (
        <header className="panel-header">
          <div className="flex min-w-0 items-center gap-2.5">
            {icon && (
              <span className="flex size-7 shrink-0 items-center justify-center rounded-control bg-accent-soft text-accent-text">
                {icon}
              </span>
            )}
            <div className="min-w-0">
              <h2 className="panel-title truncate">{title}</h2>
              {subtitle && <p className="panel-subtitle truncate">{subtitle}</p>}
            </div>
          </div>
          {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
        </header>
      )}
      <div className={`flex-1 ${bodyClassName}`}>{children}</div>
    </section>
  )
}
