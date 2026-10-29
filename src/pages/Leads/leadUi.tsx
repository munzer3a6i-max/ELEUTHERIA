/*
  The pieces the three lead pages share, drawn from the design file: its pill
  buttons, its 52px grey fields with the spaced capital label above, its
  choice cards with a ring that fills when chosen, and a white dialog in the
  same hand.
*/

import { useEffect } from 'react'
import { ChevronDown, X } from 'lucide-react'

/* ------------------------------------------------------------ buttons -- */

const PILL = 'inline-flex items-center justify-center gap-2 rounded-[999px] px-6 py-[13px] text-[17px] font-medium whitespace-nowrap disabled:opacity-40'

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>

/** The gold one: the main thing to do. */
export function GoldButton({ className = '', type = 'button', ...rest }: ButtonProps) {
  return <button type={type} className={`${PILL} bg-[#e5b44d] text-[#0b1b2b] hover:bg-[#ecc263] ${className}`} {...rest} />
}

/** The outlined one that sits on the dark page. */
export function GhostButton({ className = '', type = 'button', ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      className={`${PILL} border border-[#506078] bg-white/[0.04] text-ink hover:bg-white/[0.08] ${className}`}
      {...rest}
    />
  )
}

/** The outlined one that sits on a white card. */
export function LightButton({ className = '', type = 'button', ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      className={`${PILL} border border-[#d0dcec] bg-white text-[#17263c] hover:bg-[#f4f7fa] ${className}`}
      {...rest}
    />
  )
}

/* ------------------------------------------------------------- fields -- */

const BOX = 'rounded-[12px] border bg-[#f5f8fb] text-[15px] text-[#17263c] placeholder:text-[#8a9bb1] focus:outline-none focus:ring-2 focus:ring-[#e5b44d]/40'
const boxBorder = (error?: boolean) => (error ? 'border-[#b5473d]' : 'border-[#d5dee7] focus:border-[#e5b44d]')

/** A label in spaced capitals over whatever field it names, with its hint or its problem beneath. */
export function Field({
  label,
  hint,
  error,
  className = '',
  children,
}: {
  label: string
  hint?: React.ReactNode
  error?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <label className={`flex min-w-0 flex-col gap-2 ${className}`}>
      <span className="text-[12px] font-medium tracking-[0.08em] whitespace-nowrap text-[#69768a]">{label}</span>
      {children}
      {error ? (
        <span className="text-[12px] leading-[1.45] text-[#b5473d]">{error}</span>
      ) : (
        hint && <span className="text-[12px] leading-[1.45] text-[#69768a]">{hint}</span>
      )}
    </label>
  )
}

export function TextBox({ error, className = '', ...rest }: React.InputHTMLAttributes<HTMLInputElement> & { error?: boolean }) {
  return <input className={`h-[52px] w-full px-4 ${BOX} ${boxBorder(error)} ${className}`} {...rest} />
}

export function TextArea({ error, className = '', ...rest }: React.ComponentProps<'textarea'> & { error?: boolean }) {
  return <textarea className={`min-h-[84px] w-full resize-y px-4 py-3.5 ${BOX} ${boxBorder(error)} ${className}`} {...rest} />
}

export function SelectBox({ className = '', children, ...rest }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <span className={`relative flex h-[52px] w-full items-center ${className}`}>
      <select className={`h-full w-full appearance-none pe-10 ps-4 ${BOX} ${boxBorder()}`} {...rest}>
        {children}
      </select>
      <ChevronDown aria-hidden="true" className="pointer-events-none absolute end-4 size-[18px] text-[#69768a]" />
    </span>
  )
}

/**
 * A date or time field with the design's icon on the end. The browser's own
 * picker button is stretched invisibly over the icon, so pressing the icon
 * still opens the picker.
 */
export function PickerBox({
  icon,
  error,
  className = '',
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & { icon: React.ReactNode; error?: boolean }) {
  return (
    <span className="relative flex h-[52px] w-full items-center">
      <input
        className={`h-full w-full pe-11 ps-4 ${BOX} ${boxBorder(error)} [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:end-3 [&::-webkit-calendar-picker-indicator]:size-6 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 ${className}`}
        {...rest}
      />
      <span aria-hidden="true" className="pointer-events-none absolute end-4">
        {icon}
      </span>
    </span>
  )
}

/** One of a row of choices, as a card with a ring that fills when it is the one. */
export function ChoiceCard({
  selected,
  onSelect,
  label,
  size = 'small',
  icon,
}: {
  selected: boolean
  onSelect: () => void
  label: string
  size?: 'small' | 'large'
  icon?: React.ReactNode
}) {
  const large = size === 'large'
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`flex min-w-0 flex-1 items-center rounded-[12px] border text-start text-[#17263c] ${
        large ? 'h-12 gap-[9px] px-3.5 text-[14px]' : 'h-11 gap-2 px-3 text-[13px]'
      } ${
        selected
          ? 'border-[#e5b44d] bg-[#fcf8ee] font-medium'
          : `border-[#d0dcec] hover:border-[#b9c7d8] ${large ? 'bg-white' : 'bg-[#f4f7fa]'}`
      }`}
    >
      <span
        aria-hidden="true"
        className={`flex shrink-0 items-center justify-center rounded-full border-[1.5px] ${large ? 'size-[15px]' : 'size-[14px]'} ${
          selected ? 'border-[#e5b44d]' : 'border-[#8a99ab]'
        }`}
      >
        {selected && <span className="size-[7px] rounded-full bg-[#e5b44d]" />}
      </span>
      {icon}
      <span className="truncate">{label}</span>
    </button>
  )
}

/** A section's title on a white card, with its line of explanation. */
export function SectionTitle({ title, note }: { title: string; note?: string }) {
  return (
    <div className="flex flex-col gap-[5px]">
      <h2 className="text-[20px] font-medium text-[#17263c]">{title}</h2>
      {note && <p className="text-[12px] leading-[1.4] text-[#69768a]">{note}</p>}
    </div>
  )
}

/** The small print under every lead page. */
export function DataContext({ right }: { right: string }) {
  return (
    <div className="flex flex-wrap justify-between gap-2 text-[11px] leading-[1.4] text-[#a6b4c9]">
      <p>All times in Arabia Standard Time (UTC+3)</p>
      <p>{right}</p>
    </div>
  )
}

/* ------------------------------------------------------------- dialog -- */

/** A white card over the page, closed by Escape, the cross or the backdrop. */
export function LeadDialog({
  title,
  note,
  onClose,
  children,
  width = 'max-w-[560px]',
}: {
  title: string
  note?: string
  onClose: () => void
  children: React.ReactNode
  width?: string
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#060d18]/70 p-4 sm:items-center"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div role="dialog" aria-modal="true" aria-label={title} className={`w-full ${width} rounded-[18px] bg-white text-[#17263c] shadow-2xl`}>
        <div className="flex items-start justify-between gap-4 border-b border-[#e3e8ef] px-6 py-5">
          <SectionTitle title={title} note={note} />
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-[7px] p-1 text-[#69768a] hover:bg-[#f4f6f9]">
            <X className="size-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
