/**
 * Mock backend persistence layer.
 *
 * The whole demo database lives in localStorage under `rwandascore_db_v1`.
 * It is re-seeded when the calendar day changes so the demo always contains
 * fixtures relative to "today".
 *
 * Any admin mutation fires `rs:data-change` (same tab) and the native
 * `storage` event (other tabs), which TanStack Query hooks use to invalidate
 * their caches. This is the stand-in for a future WebSocket channel.
 */
import { buildDatabase, dayKey } from '../data/buildDatabase'

export const DB_KEY = 'rwandascore_db_v1'
export const DB_CHANGE_EVENT = 'rs:data-change'

let memoryDb = null

function storageAvailable() {
  try {
    const probe = '__rs_probe__'
    window.localStorage.setItem(probe, '1')
    window.localStorage.removeItem(probe)
    return true
  } catch {
    return false
  }
}

function readFromStorage() {
  if (!storageAvailable()) return null
  try {
    const raw = window.localStorage.getItem(DB_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch (error) {
    console.warn('[RwandaScore] Could not read mock database, reseeding.', error)
    return null
  }
}

function writeToStorage(db) {
  if (!storageAvailable()) {
    memoryDb = db
    return
  }
  try {
    window.localStorage.setItem(DB_KEY, JSON.stringify(db))
  } catch (error) {
    console.warn('[RwandaScore] localStorage write failed, keeping in memory.', error)
    memoryDb = db
  }
}

export function loadDb() {
  const today = dayKey(new Date())
  let db = readFromStorage() || memoryDb

  if (!db || db.version !== 1 || db.seedDate !== today) {
    db = buildDatabase(new Date())
    writeToStorage(db)
  }

  memoryDb = db
  return db
}

export function notifyChange(scope = 'all') {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(DB_CHANGE_EVENT, { detail: { scope } }))
}

export function saveDb(db, scope = 'all') {
  db.updatedAt = new Date().toISOString()
  writeToStorage(db)
  notifyChange(scope)
  return db
}

export function mutateDb(scope, mutator) {
  const db = loadDb()
  const result = mutator(db)
  saveDb(db, scope)
  return result
}

export function resetDb() {
  memoryDb = null
  if (storageAvailable()) {
    try {
      window.localStorage.removeItem(DB_KEY)
    } catch {
      /* ignore */
    }
  }
  const db = loadDb()
  notifyChange('reset')
  return db
}

/**
 * Subscribe to changes from this tab and from other tabs.
 * Returns an unsubscribe function.
 */
export function subscribeToDbChanges(callback) {
  if (typeof window === 'undefined') return () => {}

  const onCustom = (event) => callback(event.detail?.scope || 'all')
  const onStorage = (event) => {
    if (event.key === DB_KEY) callback('external')
  }

  window.addEventListener(DB_CHANGE_EVENT, onCustom)
  window.addEventListener('storage', onStorage)
  return () => {
    window.removeEventListener(DB_CHANGE_EVENT, onCustom)
    window.removeEventListener('storage', onStorage)
  }
}

export function makeId(prefix = 'id') {
  const random = Math.random().toString(36).slice(2, 8)
  return `${prefix}-${Date.now().toString(36)}-${random}`
}
