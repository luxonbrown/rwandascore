const LOCALE = 'en-GB'

export function toDate(value) {
  if (value instanceof Date) return value
  return new Date(value)
}

export function dayKeyOf(value) {
  const date = toDate(value)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`
}

export function todayKey() {
  return dayKeyOf(new Date())
}

export function startOfDay(value = new Date()) {
  const date = toDate(value)
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function addDays(value, days) {
  const date = startOfDay(value)
  date.setDate(date.getDate() + days)
  return date
}

export function formatTime(value) {
  return new Intl.DateTimeFormat(LOCALE, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(toDate(value))
}

export function formatDateShort(value) {
  return new Intl.DateTimeFormat(LOCALE, {
    day: 'numeric',
    month: 'short',
  }).format(toDate(value))
}

export function formatDate(value) {
  return new Intl.DateTimeFormat(LOCALE, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(toDate(value))
}

export function formatDateLong(value) {
  return new Intl.DateTimeFormat(LOCALE, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(toDate(value))
}

export function formatDayLabel(value, t) {
  const key = dayKeyOf(value)
  if (key === dayKeyOf(new Date())) return t('common.today')
  if (key === dayKeyOf(addDays(new Date(), 1))) return t('common.tomorrow')
  if (key === dayKeyOf(addDays(new Date(), -1))) return t('common.yesterday')
  return formatDate(value)
}

export function formatTimeAgo(value, t) {
  const date = toDate(value)
  const minutes = Math.max(0, Math.round((Date.now() - date.getTime()) / 60000))
  if (minutes < 1) return t('time.justNow')
  if (minutes < 60) return t('time.minutesAgo', { count: minutes })
  const hours = Math.round(minutes / 60)
  if (hours < 24) return t('time.hoursAgo', { count: hours })
  const days = Math.round(hours / 24)
  return t('time.daysAgo', { count: days })
}

export function formatDateTime(value) {
  if (value === null || value === undefined || value === '') return '—'
  const date = toDate(value)
  if (Number.isNaN(date.getTime())) return '—'
  return `${formatDate(value)}, ${formatTime(value)}`
}

export function toDateTimeInput(value) {
  const date = toDate(value)
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

export function fromDateTimeInput(value) {
  if (!value) return null
  return new Date(value).toISOString()
}

export function readMinutes(body = []) {
  const words = body.join(' ').split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 200))
}

export function formatNumber(value) {
  return new Intl.NumberFormat(LOCALE).format(Number(value) || 0)
}

export function ordinal(value) {
  const number = Number(value)
  const suffix =
    number % 10 === 1 && number % 100 !== 11
      ? 'st'
      : number % 10 === 2 && number % 100 !== 12
        ? 'nd'
        : number % 10 === 3 && number % 100 !== 13
          ? 'rd'
          : 'th'
  return `${number}${suffix}`
}
