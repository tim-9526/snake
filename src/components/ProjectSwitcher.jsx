import { useState, useRef, useEffect } from 'react'
import ImportButton from './ImportButton'

export default function ProjectSwitcher({ projects, activeId, onSwitch, onAdd, onRemove, onRename, onImport, onExportJson }) {
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const active = projects.find(p => p.id === activeId) ?? projects[0]

  const startRename = (p, e) => {
    e.stopPropagation()
    setEditingId(p.id)
    setEditName(p.name)
  }

  const commitRename = (id) => {
    if (editName.trim()) onRename(id, editName.trim())
    setEditingId(null)
  }

  const handleAdd = () => {
    onAdd()
    setOpen(false)
  }

  const handleImport = (result) => {
    onImport(result)
    setOpen(false)
  }

  return (
    <div className="project-switcher" ref={ref}>
      <button className="project-current" onClick={() => setOpen(o => !o)}>
        <span className="project-icon">◈</span>
        <span className="project-name">{active?.name ?? '项目'}</span>
        <span className="project-chevron">{open ? '▴' : '▾'}</span>
      </button>

      {open && (
        <div className="project-dropdown">
          <div className="project-list">
            {projects.map(p => (
              <div
                key={p.id}
                className={`project-item ${p.id === activeId ? 'active' : ''}`}
                onClick={() => { onSwitch(p.id); setOpen(false) }}
              >
                {editingId === p.id ? (
                  <input
                    className="project-rename-input"
                    value={editName}
                    autoFocus
                    onChange={e => setEditName(e.target.value)}
                    onBlur={() => commitRename(p.id)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') commitRename(p.id)
                      if (e.key === 'Escape') setEditingId(null)
                    }}
                    onClick={e => e.stopPropagation()}
                  />
                ) : (
                  <span className="project-item-name">{p.name}</span>
                )}
                <div className="project-item-actions">
                  <button
                    className="project-action-btn"
                    title="重命名"
                    onClick={e => startRename(p, e)}
                  >✎</button>
                  {projects.length > 1 && (
                    <button
                      className="project-action-btn danger"
                      title="删除项目"
                      onClick={e => { e.stopPropagation(); onRemove(p.id) }}
                    >×</button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="project-footer-actions">
            <button className="project-add-btn" onClick={handleAdd}>
              + 新建项目
            </button>
            <ImportButton
              label="导入项目"
              className="project-import-wrap"
              onImport={handleImport}
            />
            {onExportJson && (
              <button
                className="project-add-btn"
                onClick={() => { onExportJson(); setOpen(false) }}
              >
                备份当前项目
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
