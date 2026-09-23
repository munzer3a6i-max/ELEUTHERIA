import { useEffect } from 'react'
import { useAppStore } from '../store/useAppStore'
import { isSupabaseConfigured } from '../lib/supabase'
import { resumeSession } from '../data/session'
import { useSync } from '../data/sync'

export default function RootEffects() {
  const language = useAppStore((s) => s.settings.language)
  const theme = useAppStore((s) => s.settings.theme)

  useEffect(() => {
    document.documentElement.lang = language
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr'
  }, [language])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  // A reload should not ask for the password again, so a session left in the
  // browser is picked up and its data loaded before anything renders behind it.
  useEffect(() => {
    if (!isSupabaseConfigured) return
    useSync.getState().set({ kind: 'loading' })
    void resumeSession().then((signedIn) => {
      if (!signedIn) useSync.getState().set({ kind: 'ready', savedAt: null })
    })
  }, [])

  return null
}
