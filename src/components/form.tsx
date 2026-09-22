import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

export function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: ReactNode }) {
  return (
    <label className="mb-3 block">
      <span className="mb-1.5 block text-[11px] font-semibold text-ink-2">{label}</span>
      {children}
      {hint && !error && <span className="mt-1 block text-[11px] text-ink-3">{hint}</span>}
      {error && <span className="mt-1 block text-[11px] font-medium text-neg">{error}</span>}
    </label>
  )
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`field ${props.className ?? ''}`} />
}

export function SelectInput(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`field ${props.className ?? ''}`} />
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`field ${props.className ?? ''}`} />
}

export function PrimaryButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} type={props.type ?? 'button'} className={`btn btn-primary ${props.className ?? ''}`} />
}

export function SecondaryButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} type={props.type ?? 'button'} className={`btn btn-secondary ${props.className ?? ''}`} />
}

export function GhostButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} type={props.type ?? 'button'} className={`btn btn-ghost ${props.className ?? ''}`} />
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
        <span className="mb-1.5 block text-[11px] font-semibold text-ink-2">{labelEn}</span>
        <TextInput value={valueEn} onChange={(e) => onChangeEn(e.target.value)} required={required} />
      </label>
      <label className="block" dir="rtl">
        <span className="mb-1.5 block text-[11px] font-semibold text-ink-2">{labelAr}</span>
        <TextInput value={valueAr} onChange={(e) => onChangeAr(e.target.value)} required={required} dir="rtl" />
      </label>
    </div>
  )
}
