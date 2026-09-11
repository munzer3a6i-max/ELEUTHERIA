import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

const fieldClass =
  'w-full rounded border border-[var(--edge)] bg-[var(--input)] px-3 py-2 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-amber-500/60'

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="mb-3 block">
      <span className="mb-1 block text-[11px] font-medium text-[var(--text-secondary)]">{label}</span>
      {children}
    </label>
  )
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${fieldClass} ${props.className ?? ''}`} />
}

export function SelectInput(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${fieldClass} ${props.className ?? ''}`} />
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${fieldClass} ${props.className ?? ''}`} />
}

export function PrimaryButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      type={props.type ?? 'button'}
      className={`rounded bg-amber-600 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-500 disabled:opacity-50 ${props.className ?? ''}`}
    />
  )
}

export function SecondaryButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      type={props.type ?? 'button'}
      className={`rounded border border-[var(--edge-strong)] bg-[var(--surface-hover)] px-4 py-2 text-xs text-[var(--text-secondary)] hover:border-amber-500/40 ${props.className ?? ''}`}
    />
  )
}

export function BilingualField({
  labelEn,
  labelAr,
  valueEn,
  valueAr,
  onChangeEn,
  onChangeAr,
  required,
}: {
  labelEn: string
  labelAr: string
  valueEn: string
  valueAr: string
  onChangeEn: (v: string) => void
  onChangeAr: (v: string) => void
  required?: boolean
}) {
  return (
    <div className="mb-3 grid grid-cols-2 gap-3">
      <label className="block">
        <span className="mb-1 block text-[11px] font-medium text-[var(--text-secondary)]">{labelEn}</span>
        <TextInput value={valueEn} onChange={(e) => onChangeEn(e.target.value)} required={required} />
      </label>
      <label className="block" dir="rtl">
        <span className="mb-1 block text-[11px] font-medium text-[var(--text-secondary)]">{labelAr}</span>
        <TextInput value={valueAr} onChange={(e) => onChangeAr(e.target.value)} required={required} dir="rtl" />
      </label>
    </div>
  )
}
