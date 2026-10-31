import { useEffect } from 'react'
import { useAppStore } from '../store/useAppStore'
import { isSupabaseConfigured } from '../lib/supabase'
import { resumeSession } from '../data/session'
import { useSync } from '../data/sync'
import { fetchLiveRate, isStale } from '../lib/pesoRate'

export default function RootEffects() {
  const language = useAppStore((s) => s.settings.language)
  const theme = useAppStore((s) => s.settings.theme)
  const followLive = useAppStore((s) => s.settings.pesoRateLive !== false)

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

  // The live peso rate: fetched when the one held is a few hours old, and
  // looked at again every hour while the dashboard stays open. A failure
  // leaves the last good rate in place, or the saved one if there is none.
  useEffect(() => {
    if (!followLive) return
    const refresh = () => {
      if (!isStale(useAppStore.getState().pesoLive)) return
      fetchLiveRate()
        .then((live) => useAppStore.getState().setPesoLive(live))
        .catch((problem) => console.warn(problem instanceof Error ? problem.message : problem))
    }
    refresh()
    const timer = window.setInterval(refresh, 60 * 60 * 1000)
    return () => window.clearInterval(timer)
  }, [followLive])

  return null
}
