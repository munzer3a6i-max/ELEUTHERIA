import { useAppStore } from '../store/useAppStore'
import { translations, type TranslationKey } from './translations'
import type { Bilingual } from '../types'

export function useTranslation() {
  const language = useAppStore((s) => s.settings.language)

  function t(key: TranslationKey): string {
    return translations[key][language]
  }

  function tb(value: Bilingual): string {
    return value[language] || value.en
  }

  return { t, tb, language, dir: language === 'ar' ? ('rtl' as const) : ('ltr' as const) }
}
