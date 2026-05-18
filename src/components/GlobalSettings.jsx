import { useState } from 'react'

export default function GlobalSettings({ settings, onSet }) {
  const [open, setOpen] = useState(false)

  return (
    <div className={`global-settings${open ? ' open' : ''}`}>
      <button className="settings-toggle" onClick={() => setOpen(o => !o)}>
        <span className="settings-toggle-label">全局参数</span>
        <span className="settings-toggle-summary">
          {settings.density} g/m³ · 每点 {settings.dosePerPoint} g · {settings.unit}
        </span>
        <span className="settings-toggle-arrow">{open ? '▴' : '▾'}</span>
      </button>

      {open && (
        <div className="settings-body">
          <label className="field-wrap">
            <span className="label">投药密度 (g/m³)</span>
            <input
              type="number"
              min="0"
              step="0.1"
              value={settings.density}
              onChange={e => onSet('density', parseFloat(e.target.value) || 0)}
            />
          </label>
          <label className="field-wrap">
            <span className="label">每点投药量 (g)</span>
            <input
              type="number"
              min="0"
              step="1"
              value={settings.dosePerPoint}
              onChange={e => onSet('dosePerPoint', parseFloat(e.target.value) || 0)}
            />
          </label>
          <label className="field-wrap">
            <span className="label">仓库列名称</span>
            <input
              type="text"
              value={settings.warehouseColName}
              onChange={e => onSet('warehouseColName', e.target.value)}
              placeholder="仓库"
            />
          </label>
          <div className="field-wrap">
            <span className="label">投药量单位</span>
            <div className="unit-toggle">
              <button
                className={`unit-btn${settings.unit === 'g' ? ' active' : ''}`}
                onClick={() => onSet('unit', 'g')}
              >g</button>
              <button
                className={`unit-btn${settings.unit === 'kg' ? ' active' : ''}`}
                onClick={() => onSet('unit', 'kg')}
              >kg</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
