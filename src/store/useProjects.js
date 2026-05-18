import { useState, useEffect, useRef, useCallback } from 'react'
import { uid } from '../utils/uid'
import { supabase } from '../lib/supabase'

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

function migrateData(data) {
  if (!data) return defaultProjectData()
  const v = data._v ?? 0
  if (v < 1) {
    data = {
      _v: 1,
      settings: {
        density: 5, dosePerPoint: 200, unit: 'g', warehouseColName: '仓库', showZones: true,
        ...data.settings,
      },
      warehouses: data.warehouses ?? [],
    }
  }
  return data
}

function newLocalProject(name) {
  return { id: uid(), name: name ?? '项目 1', data: defaultProjectData() }
}

// ── Supabase helpers ─────────────────────────────────────────────────────────

async function fetchProjects(userId) {
  const { data, error } = await supabase
    .from('projects')
    .select('id, name, data, updated_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data.map(p => ({ id: p.id, name: p.name, data: migrateData(p.data) }))
}

async function upsertProject(userId, project) {
  const { error } = await supabase
    .from('projects')
    .upsert({ id: project.id, user_id: userId, name: project.name, data: project.data })
  if (error) throw error
}

async function deleteProject(id) {
  const { error } = await supabase.from('projects').delete().eq('id', id)
  if (error) throw error
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useProjects(userId) {
  const [projects, setProjects] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [storageError, setStorageError] = useState(null)

  // initial load
  useEffect(() => {
    if (!userId) return
    setLoading(true)
    fetchProjects(userId)
      .then(list => {
        if (list.length === 0) {
          // first login: create a default project
          const fresh = newLocalProject('项目 1')
          setProjects([fresh])
          setActiveId(fresh.id)
          upsertProject(userId, fresh).catch(e => setStorageError(e.message))
        } else {
          setProjects(list)
          setActiveId(list[0].id)
        }
      })
      .catch(e => setStorageError(e.message))
      .finally(() => setLoading(false))
  }, [userId])

  // real-time subscription: sync changes from other tabs/devices
  useEffect(() => {
    if (!userId) return
    const channel = supabase
      .channel('projects-sync')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'projects',
        filter: `user_id=eq.${userId}`,
      }, payload => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const p = payload.new
          setProjects(prev => {
            const exists = prev.find(x => x.id === p.id)
            const updated = { id: p.id, name: p.name, data: migrateData(p.data) }
            return exists ? prev.map(x => x.id === p.id ? updated : x) : [...prev, updated]
          })
        }
        if (payload.eventType === 'DELETE') {
          setProjects(prev => prev.filter(x => x.id !== payload.old.id))
        }
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [userId])

  // debounced Supabase write
  const saveTimer = useRef(null)
  const pendingSave = useRef(null)

  const scheduleSave = useCallback((project) => {
    pendingSave.current = project
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      if (!pendingSave.current || !userId) return
      upsertProject(userId, pendingSave.current).catch(e => setStorageError(e.message))
    }, SAVE_DEBOUNCE_MS)
  }, [userId])

  const activeProject = projects.find(p => p.id === activeId) ?? projects[0] ?? null

  const updateActiveData = (updater) => {
    setProjects(prev => {
      const target = prev.find(p => p.id === activeId)
      if (!target) return prev
      const updated = { ...target, data: updater(target.data) }
      scheduleSave(updated)
      return prev.map(p => p.id === activeId ? updated : p)
    })
  }

  const addProject = async (name) => {
    const p = newLocalProject(name ?? `项目 ${projects.length + 1}`)
    setProjects(prev => [...prev, p])
    setActiveId(p.id)
    try { await upsertProject(userId, p) } catch (e) { setStorageError(e.message) }
  }

  const removeProject = async (id) => {
    setProjects(prev => {
      const next = prev.filter(p => p.id !== id)
      if (next.length === 0) {
        const fresh = newLocalProject('项目 1')
        setActiveId(fresh.id)
        upsertProject(userId, fresh).catch(e => setStorageError(e.message))
        return [fresh]
      }
      if (id === activeId) setActiveId(next[0].id)
      return next
    })
    try { await deleteProject(id) } catch (e) { setStorageError(e.message) }
  }

  const renameProject = (id, name) => {
    setProjects(prev => prev.map(p => {
      if (p.id !== id) return p
      const updated = { ...p, name }
      scheduleSave(updated)
      return updated
    }))
  }

  const switchProject = (id) => setActiveId(id)

  const importProject = async ({ name, data }) => {
    const p = { id: uid(), name: name ?? `导入项目 ${projects.length + 1}`, data: migrateData(data) }
    setProjects(prev => [...prev, p])
    setActiveId(p.id)
    try { await upsertProject(userId, p) } catch (e) { setStorageError(e.message) }
  }

  return {
    projects, activeProject, activeId, loading,
    storageError, dismissStorageError: () => setStorageError(null),
    switchProject, addProject, removeProject, renameProject,
    updateActiveData, importProject,
  }
}
