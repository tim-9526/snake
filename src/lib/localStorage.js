const STORAGE_KEY = 'dose-calc-data'
const META_KEY = 'dose-calc-meta'

export function readLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch { return null }
}

export function writeLocal(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
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
