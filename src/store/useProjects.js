import { useState, useEffect, useRef } from 'react'
import { uid } from '../utils/uid'

const PROJECTS_KEY = 'dose-calculator-projects'
const ACTIVE_KEY = 'dose-calculator-active-project'
const DATA_VERSION = 1
const SAVE_DEBOUNCE_MS = 200

const defaultSegment = () => ({ id: uid(), length: '', width: '', height: '' })
const defaultStack = () => ({ id: uid(), code: '', segments: [defaultSegment()] })
const defaultZone = () => ({ id: uid(), name: '', stacks: [defaultStack()] })
const defaultWarehouse = () => ({ id: uid(), name: '', zones: [defaultZone()] })

export const defaultProjectData = () => ({
  _v: DATA_VERSION,
  settings: { density: 5, dosePerPoint: 200, unit: 'g', warehouseColName: '仓库', showZones: true },
  warehouses: [defaultWarehouse()],
})

function migrateData(data) {
  if (!data) return defaultProjectData()
  const v = data._v ?? 0

  if (v < 1) {
    data = {
      _v: 1,
      settings: {
        density: 5,
        dosePerPoint: 200,
        unit: 'g',
        warehouseColName: '仓库',
        showZones: true,
        ...data.settings,
      },
      warehouses: data.warehouses ?? [],
    }
  }

  return data
}

function newProject(name) {
  return { id: uid(), name, data: defaultProjectData() }
}

function loadProjects() {
  try {
    const raw = localStorage.getItem(PROJECTS_KEY)
    if (raw) {
      const projects = JSON.parse(raw)
      return projects.map(p => ({ ...p, data: migrateData(p.data) }))
    }
  } catch {}
  return null
}

function loadActiveId() {
  try { return localStorage.getItem(ACTIVE_KEY) || null } catch { return null }
}

// M1: surface storage errors instead of silently swallowing them
function saveProjects(projects, onError) {
  try {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects))
  } catch (e) {
    onError?.('存储空间不足，最新数据未能保存，请导出 JSON 备份')
  }
}

function saveActiveId(id) {
  try { localStorage.setItem(ACTIVE_KEY, id) } catch {}
}

export function useProjects() {
  const [projects, setProjects] = useState(() => {
    const saved = loadProjects()
    if (saved && saved.length > 0) return saved
    const first = newProject('项目 1')
    return [first]
  })

  const [activeId, setActiveId] = useState(() => {
    const saved = loadActiveId()
    const list = loadProjects()
    if (list && list.length > 0) {
      return list.find(p => p.id === saved) ? saved : list[0].id
    }
    return null
  })

  // M1: expose storage error to UI
  const [storageError, setStorageError] = useState(null)

  // sync activeId on first render when projects were freshly created
  useEffect(() => {
    if (!activeId && projects.length > 0) {
      setActiveId(projects[0].id)
    }
  }, [])

  // debounced localStorage write for projects
  const saveTimer = useRef(null)
  useEffect(() => {
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(
      () => saveProjects(projects, setStorageError),
      SAVE_DEBOUNCE_MS,
    )
    return () => clearTimeout(saveTimer.current)
  }, [projects])

  useEffect(() => { if (activeId) saveActiveId(activeId) }, [activeId])

  // H2: guard against undefined during state transitions
  const activeProject = projects.find(p => p.id === activeId) ?? projects[0] ?? null

  // H1: use activeId inside updater, not stale activeProject closure
  const updateActiveData = (updater) => {
    setProjects(prev => {
      const target = prev.find(p => p.id === activeId)
      if (!target) return prev
      return prev.map(p => p.id === activeId ? { ...p, data: updater(p.data) } : p)
    })
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

  // H1: same fix for replaceActiveData
  const replaceActiveData = (data) => {
    setProjects(prev => prev.map(p => p.id === activeId ? { ...p, data } : p))
  }

  return {
    projects,
    activeProject,
    activeId,
    storageError,
    dismissStorageError: () => setStorageError(null),
    switchProject,
    addProject,
    removeProject,
    renameProject,
    updateActiveData,
    importProject,
    replaceActiveData,
  }
}
