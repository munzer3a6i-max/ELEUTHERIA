import { useRef, useState } from 'react'
import { Eye, Paperclip, Trash2, TriangleAlert } from 'lucide-react'
import { AttachmentError, formatBytes, openAttachment, readAttachment } from '../lib/attachments'
import { useTranslation } from '../i18n/useTranslation'
import type { Attachment } from '../types'

/**
 * The bill behind the number. One control for every money record in the app:
 * choose a file, see what is already attached, open it, or take it off.
 */
export default function AttachmentField({
  value,
  onChange,
  label,
}: {
  value: Attachment | null
  onChange: (attachment: Attachment | null) => void
  label?: string
}) {
  const input = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const { t, language } = useTranslation()

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setError(null)
    try {
      onChange(await readAttachment(file))
    } catch (problem) {
      setError(problem instanceof AttachmentError ? problem.message : String(problem))
    }
  }

  return (
    <div className="mb-3">
      <span className="mb-1.5 block text-[11px] font-semibold text-ink-2">{label ?? t('attach_label')}</span>

      {value ? (
        <div className="flex items-center gap-2 rounded-control border border-line bg-sunken px-2.5 py-2">
          <Paperclip className="size-3.5 shrink-0 text-accent-text" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[12px] text-ink">{value.name}</span>
            <span className="num block text-[10.5px] text-ink-3">
              {value.size > 0 ? formatBytes(value.size) : t('attach_name_only')}
              {value.uploadedOn ? ` · ${value.uploadedOn}` : ''}
            </span>
          </span>
          {value.dataUrl && (
            <button
              type="button"
              onClick={() => openAttachment(value)}
              aria-label={t('attach_view')}
              className="btn btn-ghost size-7 shrink-0 p-0"
            >
              <Eye className="size-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => onChange(null)}
            aria-label={t('action_delete')}
            className="btn btn-ghost size-7 shrink-0 p-0 text-ink-3 hover:text-neg"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      ) : (
        <>
          <input ref={input} type="file" className="hidden" onChange={handleFile} />
          <button type="button" onClick={() => input.current?.click()} className="btn btn-secondary w-full">
            <Paperclip className="size-3.5" /> {t('attach_upload')}
          </button>
          <span className="mt-1 block text-[10.5px] text-ink-3">
            {language === 'ar'
              ? 'صورة أو ملف PDF للفاتورة، بحد أقصى ٢ ميغابايت.'
              : 'A photo or PDF of the bill, up to 2 MB.'}
          </span>
        </>
      )}

      {error && (
        <span className="mt-1.5 flex items-start gap-1.5 text-[11px] font-medium text-neg">
          <TriangleAlert className="mt-px size-3.5 shrink-0" /> {error}
        </span>
      )}
    </div>
  )
}

/** The read-only counterpart: a paperclip in a table that opens the file. */
export function AttachmentChip({ attachment }: { attachment: Attachment | null }) {
  const { t } = useTranslation()
  if (!attachment) return null
  if (!attachment.dataUrl) {
    return (
      <span title={`${attachment.name} — ${t('attach_name_only')}`} className="inline-flex items-center gap-1 text-[10.5px] text-ink-3">
        <Paperclip className="size-3" />
      </span>
    )
  }
  return (
    <button
      type="button"
      onClick={() => openAttachment(attachment)}
      title={attachment.name}
      aria-label={`${t('attach_view')}: ${attachment.name}`}
      className="inline-flex items-center gap-1 text-[10.5px] text-accent-text hover:text-accent"
    >
      <Paperclip className="size-3" />
    </button>
  )
}
