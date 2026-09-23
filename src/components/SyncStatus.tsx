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
  const { t, language } = useTranslation()

  if (state.kind === 'off') return null

  if (state.kind === 'error') {
    return (
      <button
        type="button"
        onClick={retrySaving}
        title={state.message}
        className="btn btn-ghost h-8 gap-1.5 px-2 text-neg"
      >
        <TriangleAlert className="size-3.5" />
        <span className="hidden sm:inline">{t('sync_failed')}</span>
        <RefreshCw className="size-3" />
      </button>
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
