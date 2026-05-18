const DB_NAME = 'dose-calc'
const STORE = 'handles'
const KEY = 'project-file'

async function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function getStoredHandle() {
  try {
    const db = await openDB()
    return new Promise(resolve => {
      const req = db.transaction(STORE).objectStore(STORE).get(KEY)
      req.onsuccess = () => resolve(req.result ?? null)
      req.onerror = () => resolve(null)
    })
  } catch { return null }
}

export async function storeHandle(handle) {
  try {
    const db = await openDB()
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).put(handle, KEY)
      tx.oncomplete = resolve
      tx.onerror = () => reject(tx.error)
    })
  } catch { /* ignore */ }
}

export async function queryPermission(handle) {
  try { return await handle.queryPermission({ mode: 'readwrite' }) }
  catch { return 'denied' }
}

export async function requestPermission(handle) {
  try { return await handle.requestPermission({ mode: 'readwrite' }) }
  catch { return 'denied' }
}

export async function readFile(handle) {
  const file = await handle.getFile()
  const text = await file.text()
  return JSON.parse(text)
}

export async function writeFile(handle, data) {
  const writable = await handle.createWritable()
  await writable.write(JSON.stringify(data, null, 2))
  await writable.close()
}

export const isSupported = () =>
  typeof window !== 'undefined' && 'showOpenFilePicker' in window
