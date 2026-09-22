import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Search } from 'lucide-react'

export interface SearchableOption {
  value: string
  label: string
  sublabel?: string
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Search...',
  emptyText = 'No matches',
}: {
  options: SearchableOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  emptyText?: string
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)

  const selected = options.find((o) => o.value === value)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const filtered = options.filter((o) => {
    const q = query.trim().toLowerCase()
    if (!q) return true
    return o.label.toLowerCase().includes(q) || o.sublabel?.toLowerCase().includes(q)
  })

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-control border border-line bg-sunken px-3 py-2 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-focus"
      >
        <span className={selected ? '' : 'text-ink-3'}>{selected ? selected.label : placeholder}</span>
        <ChevronDown className="size-3.5 text-ink-3" />
      </button>

      {open && (
        <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-control border border-line bg-surface shadow-xl">
          <div className="flex items-center gap-2 border-b border-line px-2.5 py-2">
            <Search className="size-3.5 text-ink-3" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              className="w-full bg-transparent text-xs text-ink placeholder:text-ink-3 focus:outline-none"
            />
          </div>
          <div className="max-h-56 overflow-y-auto py-1">
            {filtered.slice(0, 50).map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => {
                  onChange(o.value)
                  setOpen(false)
                  setQuery('')
                }}
                className={`block w-full px-3 py-2 text-start text-xs hover:bg-raised ${
                  o.value === value ? 'text-accent-text' : 'text-ink'
                }`}
              >
                {o.label}
                {o.sublabel && <span className="ms-1.5 text-ink-3">· {o.sublabel}</span>}
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="px-3 py-3 text-center text-[11px] text-ink-3">{emptyText}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
