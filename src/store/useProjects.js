import { useState, useEffect, useRef, useCallback } from 'react'
import { uid } from '../utils/uid'
import * as fsApi from '../lib/fileStorage'

const DATA_VERSION = 1
const SAVE_DEBOUNCE_MS = 600

const defaultSegment = () => ({ id: uid(), length: '', width: '', height: '' })
const defaultStack = () => ({ id: uid(), code: '', segments: [defaultSegment()] })
const defaultZone = () => ({ id: uid(), name: '', stacks: [defaultStack()] })
const defaultWarehouse = () => ({ id: uid(), name: '', zones: [defaultZone()] })

export const defaultProjectData = () => ({
  _v: DATA_VERSION,
  settings: { density: 5, dosePerPoint: 200, unit: 'g', warehouseColName: '仓库', showZones: true },
  warehouses: [defaultWarehouse()],
})

function clamp(v, min, max, def) {
  const n = Number(v)
  return (isNaN(n) || n < min || n > max) ? def : n
}

function sanitizeSettings(s) {
  if (!s || typeof s !== 'object') return {}
  return {
    density:          clamp(s.density,      0.1, 100,    5),
    dosePerPoint:     clamp(s.dosePerPoint, 1,   100000, 200),
    unit:             ['g', 'kg'].includes(s.unit) ? s.unit : 'g',
    warehouseColName: typeof s.warehouseColName === 'string' ? s.warehouseColName.slice(0, 20) : '仓库',
    showZones:        typeof s.showZones === 'boolean' ? s.showZones : true,
  }
}

function migrateData(data) {
  if (!data) return defaultProjectData()
  const v = data._v ?? 0
  if (v < 1) {
    data = {
      _v: 1,
      settings: { density: 5, dosePerPoint: 200, unit: 'g', warehouseColName: '仓库', showZones: true, ...data.settings },
      warehouses: data.warehouses ?? [],
    }
  }
  // Sanitize settings on every load to clamp out-of-range values
  data = { ...data, settings: sanitizeSettings(data.settings) }
  return data
}

function newProject(name) {
  return { id: uid(), name, data: defaultProjectData() }
}

function parseFileData(raw) {
  const projects = (raw.projects ?? []).map(p => ({ ...p, data: migrateData(p.data) }))
  if (projects.length === 0) {
    const fresh = newProject('项目 1')
    return { projects: [fresh], activeId: fresh.id }
  }
  const activeId = raw.activeId ?? projects[0].id
  return { projects, activeId }
}

function friendlyFsError(e) {
  if (e.name === 'NotAllowedError')  return '权限不足，请重新授权文件访问'
  if (e.name === 'NotFoundError')    return '文件不存在或已被移动'
  if (e.name === 'NotReadableError') return '文件无法读取，可能已损坏'
  if (e.name === 'AbortError')       return null  // user cancelled — not an error
  return '文件操作失败'
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useProjects() {
  // 'init' | 'no-file' | 'permission-needed' | 'ready' | 'not-supported'
  const [fileStatus, setFileStatus] = useState('init')
  const [fileHandle, setFileHandle] = useState(null)
  const [fileName, setFileName] = useState('')
  const [projects, setProjects] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [storageError, setStorageError] = useState(null)

  const handleRef = useRef(null)
  const saveTimer = useRef(null)
  const pendingSave = useRef(null)
  const justLoaded = useRef(false)

  useEffect(() => { handleRef.current = fileHandle }, [fileHandle])

  // ── File I/O ──────────────────────────────────────────────────────────────

  const scheduleSave = useCallback((prjs, aid) => {
    pendingSave.current = { projects: prjs, activeId: aid }
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      const h = handleRef.current
      if (!h || !pendingSave.current) return
      try {
        await fsApi.writeFile(h, { _fv: 1, ...pendingSave.current })
      } catch (e) {
        const msg = friendlyFsError(e)
        if (msg) setStorageError(msg)
      }
    }, SAVE_DEBOUNCE_MS)
  }, [])

  // save on data change (skip the render that came from loading)
  useEffect(() => {
    if (fileStatus !== 'ready') return
    if (justLoaded.current) { justLoaded.current = false; return }
    scheduleSave(projects, activeId)
  }, [projects, activeId, fileStatus])

  async function applyHandle(handle) {
    const raw = await fsApi.readFile(handle)
    const { projects: prjs, activeId: aid } = parseFileData(raw)
    justLoaded.current = true
    setProjects(prjs)
    setActiveId(aid)
    setFileHandle(handle)
    setFileName(handle.name)
    setFileStatus('ready')
    await fsApi.storeHandle(handle)
  }

  // ── Startup ───────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!fsApi.isSupported()) { setFileStatus('not-supported'); return }
    fsApi.getStoredHandle().then(async handle => {
      if (!handle) { setFileStatus('no-file'); return }
      const perm = await fsApi.queryPermission(handle)
      if (perm === 'granted') {
        try { await applyHandle(handle) }
        catch (e) { setStorageError(friendlyFsError(e) ?? '文件读取失败'); setFileStatus('no-file') }
      } else if (perm === 'prompt') {
        setFileHandle(handle)
        setFileName(handle.name)
        setFileStatus('permission-needed')
      } else {
        setFileStatus('no-file')
      }
    })
  }, [])

  // ── User actions ──────────────────────────────────────────────────────────

  const selectFile = async () => {
    try {
      const [handle] = await window.showOpenFilePicker({
        types: [{ description: '数据文件', accept: { 'application/json': ['.json'] } }],
        multiple: false,
      })
      await applyHandle(handle)
    } catch (e) {
      const msg = friendlyFsError(e)
      if (msg) setStorageError(msg)
    }
  }

  const createFile = async () => {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: '投药量数据.json',
        types: [{ description: '数据文件', accept: { 'application/json': ['.json'] } }],
      })
      const fresh = newProject('项目 1')
      await fsApi.writeFile(handle, { _fv: 1, activeId: fresh.id, projects: [fresh] })
      justLoaded.current = true
      setProjects([fresh])
      setActiveId(fresh.id)
      setFileHandle(handle)
      setFileName(handle.name)
      setFileStatus('ready')
      await fsApi.storeHandle(handle)
    } catch (e) {
      const msg = friendlyFsError(e)
      if (msg) setStorageError(msg)
    }
  }

  const resumeFile = async () => {
    if (!fileHandle) return
    const perm = await fsApi.requestPermission(fileHandle)
    if (perm === 'granted') {
      try { await applyHandle(fileHandle) }
      catch (e) { setStorageError(friendlyFsError(e) ?? '文件读取失败'); setFileStatus('no-file') }
    } else {
      setFileStatus('no-file')
    }
  }

  // ── Project mutations ─────────────────────────────────────────────────────

  const activeProject = projects.find(p => p.id === activeId) ?? projects[0] ?? null

  const updateActiveData = (updater) => {
    setProjects(prev => {
      const target = prev.find(p => p.id === activeId)
      if (!target) return prev
      return prev.map(p => p.id === activeId ? { ...p, data: updater(p.data) } : p)
    })
  }

  const replaceActiveData = (data) => {
    setProjects(prev => prev.map(p => p.id === activeId ? { ...p, data } : p))
  }

  const addProject = (name) => {
    const p = newProject(name || `项目 ${projects.length + 1}`)
    setProjects(prev => [...prev, p])
    setActiveId(p.id)
  }

  const removeProject = (id) => {
    setProjects(prev => {
      const next = prev.filter(p => p.id !== id)
      if (next.length === 0) {
        const fresh = newProject('项目 1')
        setActiveId(fresh.id)
        return [fresh]
      }
      if (id === activeId) setActiveId(next[0].id)
      return next
    })
  }

  const renameProject = (id, name) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, name } : p))
  }

  const switchProject = (id) => setActiveId(id)

  const importProject = ({ name, data }) => {
    const p = { id: uid(), name: name || `导入项目 ${projects.length + 1}`, data: migrateData(data) }
    setProjects(prev => [...prev, p])
    setActiveId(p.id)
  }

  return {
    projects, activeProject, activeId,
    fileStatus, fileName,
    storageError, dismissStorageError: () => setStorageError(null),
    selectFile, createFile, resumeFile,
    switchProject, addProject, removeProject, renameProject,
    updateActiveData, replaceActiveData, importProject,
  }
}
