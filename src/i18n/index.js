import en from './en.json'
import rw from './rw.json'

export const dictionaries = { en, rw }

export const languages = [
  { code: 'en', label: 'English' },
  { code: 'rw', label: 'Kinyarwanda' },
]

export const DEFAULT_LANGUAGE = 'en'

export function isLanguage(value) {
  return value === 'en' || value === 'rw'
}

function lookup(dictionary, key) {
  return key.split('.').reduce((acc, part) => {
    if (acc && typeof acc === 'object' && part in acc) return acc[part]
    return undefined
  }, dictionary)
}

export function translate(language, key, params = {}) {
  const lang = isLanguage(language) ? language : DEFAULT_LANGUAGE
  const value = lookup(dictionaries[lang], key) ?? lookup(dictionaries[DEFAULT_LANGUAGE], key)

  if (typeof value !== 'string') return key

  return value.replace(/\{\{(\w+)\}\}/g, (match, token) =>
    Object.prototype.hasOwnProperty.call(params, token) ? String(params[token]) : match,
  )
}
