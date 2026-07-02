const STORAGE_KEY = 'dose-calc-data'
const META_KEY = 'dose-calc-meta'
const LS_DATA_VERSION = 1

function migrateData(raw) {
  if (!raw || typeof raw !== 'object') return null
  const v = raw._lsv ?? 0

  // P2: version migrations applied here; writeLocal manages the final _lsv stamp
  if (v < 1) {
    // Future: v0 → v1 transformations
  }

  return raw
}

export function readLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return migrateData(JSON.parse(raw))
  } catch { return null }
}

export function writeLocal(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...data, _lsv: LS_DATA_VERSION }))
    return true
  } catch { return false }
}

export function getFileName() {
  try {
    return localStorage.getItem(META_KEY) || '本地存储'
  } catch { return '本地存储' }
}

export function setFileName(name) {
  try { localStorage.setItem(META_KEY, name) }
  catch { /* ignore */ }
}

export function clearLocal() {
  try { localStorage.removeItem(STORAGE_KEY) }
  catch { /* ignore */ }
}

export const isSupported = () =>
  typeof window !== 'undefined' && typeof localStorage !== 'undefined'
