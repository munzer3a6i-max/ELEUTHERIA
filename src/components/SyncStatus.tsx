import { useState } from 'react'
import { Check, CloudOff, Loader2, RefreshCw, TriangleAlert } from 'lucide-react'
import { useSync, retrySaving } from '../data/sync'
import { useTranslation } from '../i18n/useTranslation'

/**
 * Whether what is on the screen has reached the database. Silent when there is
 * nothing to say: a person should notice this only when something is wrong, or
 * in the moment a save is in flight.
 */
export default function SyncStatus() {
  const state = useSync((s) => s.state)
  const [open, setOpen] = useState(false)
  const { t, language } = useTranslation()

  if (state.kind === 'off') return null

  if (state.kind === 'error') {
    // The reason lived in a tooltip, which on a phone is nowhere at all: a
    // refused save said "Not saved" and nothing else, and the one thing that
    // tells you what to do about it was the database's own words. They are on
    // the screen now, with the retry beside them.
    return (
      <span className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="btn btn-ghost h-8 gap-1.5 px-2 text-neg"
        >
          <TriangleAlert className="size-3.5" />
          <span className="hidden sm:inline">{t('sync_failed')}</span>
          {state.pending > 0 && <span className="num text-[10px]">{state.pending}</span>}
        </button>
        {open && (
          <div className="absolute end-0 top-10 z-30 w-72 rounded-panel border border-line bg-surface p-3 shadow-pop">
            <p className="text-[11px] font-semibold text-neg">{t('sync_failed')}</p>
            <p className="mt-1 break-words text-[11px] leading-relaxed text-ink-2">{state.message}</p>
            <p className="mt-2 text-[10.5px] leading-relaxed text-ink-3">{t('sync_failed_hint')}</p>
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                retrySaving()
              }}
              className="btn btn-secondary mt-2 h-7 w-full gap-1.5"
            >
              <RefreshCw className="size-3" /> {t('sync_retry')}
            </button>
          </div>
        )}
      </span>
    )
  }

  if (state.kind === 'saving') {
    return (
      <span className="flex h-8 items-center gap-1.5 px-2 text-[11px] text-ink-3">
        <Loader2 className="size-3.5 animate-spin" />
        <span className="hidden sm:inline">{t('sync_saving')}</span>
      </span>
    )
  }

  if (state.kind === 'loading') {
    return (
      <span className="flex h-8 items-center gap-1.5 px-2 text-[11px] text-ink-3">
        <Loader2 className="size-3.5 animate-spin" />
        <span className="hidden sm:inline">{t('sync_loading')}</span>
      </span>
    )
  }

  if (state.savedAt === null) {
    return (
      <span className="flex h-8 items-center gap-1.5 px-2 text-[11px] text-ink-3" title={t('sync_connected')}>
        <CloudOff className="size-3.5 opacity-0" aria-hidden="true" />
      </span>
    )
  }

  const at = new Date(state.savedAt).toLocaleTimeString(language === 'ar' ? 'ar' : 'en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  })
  return (
    <span className="flex h-8 items-center gap-1.5 px-2 text-[11px] text-ink-3" title={`${t('sync_saved')} ${at}`}>
      <Check className="size-3.5 text-pos" />
      <span className="num hidden sm:inline">{at}</span>
    </span>
  )
}
