import { useCallback } from 'react'
import { usePreferencesStore } from '../store/preferences'
import { languages, translate } from '../i18n'

export function useI18n() {
  const language = usePreferencesStore((state) => state.language)
  const setLanguage = usePreferencesStore((state) => state.setLanguage)

  const t = useCallback(
    (key, params) => translate(language, key, params),
    [language],
  )

  return {
    t,
    language,
    setLanguage,
    languages,
    isKinyarwanda: language === 'rw',
    locale: language === 'rw' ? 'rw-RW' : 'en-GB',
  }
}
