import { useState, useEffect, useRef } from 'react'

const PROJECTS_KEY = 'dose-calculator-projects'
const ACTIVE_KEY = 'dose-calculator-active-project'
const DATA_VERSION = 1
const SAVE_DEBOUNCE_MS = 200

const uid = () => Math.random().toString(36).slice(2, 9)

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

  // v0 → v1: add _v field; settings shape is compatible, no structural changes
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
  return localStorage.getItem(ACTIVE_KEY) || null
}

function saveProjects(projects) {
  try { localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects)) } catch {}
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
    saveTimer.current = setTimeout(() => saveProjects(projects), SAVE_DEBOUNCE_MS)
    return () => clearTimeout(saveTimer.current)
  }, [projects])

  useEffect(() => { if (activeId) saveActiveId(activeId) }, [activeId])

  const activeProject = projects.find(p => p.id === activeId) ?? projects[0]

  const updateActiveData = (updater) => {
    setProjects(prev => prev.map(p =>
      p.id === activeProject.id
        ? { ...p, data: updater(p.data) }
        : p
    ))
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

  const replaceActiveData = (data) => {
    setProjects(prev => prev.map(p =>
      p.id === activeProject.id ? { ...p, data } : p
    ))
  }

  return {
    projects,
    activeProject,
    activeId,
    switchProject,
    addProject,
    removeProject,
    renameProject,
    updateActiveData,
    importProject,
    replaceActiveData,
  }
}
