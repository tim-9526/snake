import { useState, useEffect } from 'react'

export default function ImportPreviewModal({ importResult, onConfirm, onCancel }) {
  const [name, setName] = useState(importResult.name || '导入项目')

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onCancel() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  const { warehouses } = importResult.data
  const totalZones = warehouses.reduce((s, w) => s + w.zones.length, 0)
  const totalStacks = warehouses.reduce((s, w) =>
    s + w.zones.reduce((sz, z) => sz + z.stacks.length, 0), 0)

  const handleConfirm = () => onConfirm({ ...importResult, name })

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal-panel import-preview-panel" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">确认导入</h2>
          <button className="modal-close" onClick={onCancel}>✕</button>
        </div>

        <div className="modal-body">
          <div className="import-preview-stats">
            <div className="preview-stat">
              <span className="preview-stat-num">{warehouses.length}</span>
              <span className="preview-stat-label">库</span>
            </div>
            <div className="preview-stat">
              <span className="preview-stat-num">{totalZones}</span>
              <span className="preview-stat-label">区</span>
            </div>
            <div className="preview-stat">
              <span className="preview-stat-num">{totalStacks}</span>
              <span className="preview-stat-label">垛位</span>
            </div>
          </div>

          <div className="import-preview-wh-list">
            {warehouses.slice(0, 5).map(wh => (
              <div key={wh.id} className="preview-wh-row">
                <span className="tree-badge wh-badge">库</span>
                <span className="preview-wh-name">{wh.name || '(未命名)'}</span>
                <span className="preview-wh-count muted">
                  {wh.zones.reduce((s, z) => s + z.stacks.length, 0)} 垛位
                </span>
              </div>
            ))}
            {warehouses.length > 5 && (
              <div className="preview-wh-row muted">… 还有 {warehouses.length - 5} 个库</div>
            )}
          </div>

          <label className="import-name-label">
            <span className="label">项目名称</span>
            <input
              className="import-name-input"
              type="text"
              value={name}
              autoFocus
              onChange={e => setName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleConfirm() }}
            />
          </label>
        </div>

        <div className="import-preview-footer">
          <button className="btn-ghost" onClick={onCancel}>取消</button>
          <button className="summary-export-btn" onClick={handleConfirm}>
            导入
          </button>
        </div>
      </div>
    </div>
  )
}
