/*
  The few pieces the lead pages need that the app's shared components do not
  already give: a row of radio choices drawn as cards (the design's source and
  contact-status pickers), a date or time field with its icon, a section title
  for inside a panel, the filter tabs, and the small print under each page.
  Everything is in the app's own sizes and colours.
*/

import type { ReactNode } from 'react'

/** One of a row of choices, as a small card with a ring that fills when it is the one. */
export function ChoiceCard({
  selected,
  onSelect,
  label,
}: {
  selected: boolean
  onSelect: () => void
  label: string
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`flex h-[34px] min-w-0 flex-1 items-center gap-2 rounded-control border px-2.5 text-start text-[12px] ${
        selected
          ? 'border-accent-line bg-accent-soft font-medium text-accent-text'
          : 'border-line-strong bg-sunken text-ink-2 hover:border-accent-line'
      }`}
    >
      <span
        aria-hidden="true"
        className={`flex size-3 shrink-0 items-center justify-center rounded-full border-[1.5px] ${
          selected ? 'border-accent' : 'border-ink-3'
        }`}
      >
        {selected && <span className="size-1.5 rounded-full bg-accent" />}
      </span>
      <span className="truncate">{label}</span>
    </button>
  )
}

/**
 * A date or time field with an icon on the end. The browser's own picker
 * button is stretched invisibly over the icon, so pressing it still opens the
 * picker.
 */
export function PickerInput({
  icon,
  className = '',
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & { icon: ReactNode }) {
  return (
    <span className="relative flex items-center">
      <input
        className={`field pe-8 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:end-2 [&::-webkit-calendar-picker-indicator]:size-5 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 ${className}`}
        {...rest}
      />
      <span aria-hidden="true" className="pointer-events-none absolute end-2.5 text-ink-3">
        {icon}
      </span>
    </span>
  )
}

/** A section's name inside a panel, with its line of explanation. */
export function SectionTitle({ title, note }: { title: string; note?: string }) {
  return (
    <div className="mb-3">
      <h3 className="panel-title">{title}</h3>
      {note && <p className="panel-subtitle">{note}</p>}
    </div>
  )
}

/** The app's filter tabs: plain text, the chosen one on the accent wash. */
export function FilterTab({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-control px-3 py-1.5 text-[11px] whitespace-nowrap ${
        active ? 'bg-accent-soft font-medium text-accent-text' : 'text-ink-2 hover:bg-raised'
      }`}
    >
      {children}
    </button>
  )
}

/** The small print under every lead page. */
export function DataContext({ right }: { right: string }) {
  return (
    <div className="flex flex-wrap justify-between gap-2 text-[11px] text-ink-3">
      <p>All times in Arabia Standard Time (UTC+3)</p>
      <p>{right}</p>
    </div>
  )
}
