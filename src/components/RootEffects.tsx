import { useEffect } from 'react'
import { useAppStore } from '../store/useAppStore'

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

  return null
}
