import { useState } from 'react'

export default function GlobalSettings({ settings, onSet }) {
  const [open, setOpen] = useState(false)
  const showZones = settings.showZones !== false  // default true

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
              min="1"
              step="1"
              value={settings.dosePerPoint}
              onChange={e => onSet('dosePerPoint', Math.max(1, parseFloat(e.target.value) || 1))}
            />
            {/* P1: dosePerPoint<=0 guard — edge case for data loaded before sanitizeSettings clamps to >=1 */}
            {settings.dosePerPoint <= 0 && (
              <span className="label" style={{ color: 'var(--color-danger)' }}>须大于 0</span>
            )}
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
          <div className="field-wrap">
            <span className="label">区块数量</span>
            <div className="unit-toggle">
              <button
                className={`unit-btn${!showZones ? ' active' : ''}`}
                onClick={() => onSet('showZones', false)}
              >0</button>
              <button
                className={`unit-btn${showZones ? ' active' : ''}`}
                onClick={() => onSet('showZones', true)}
              >≥1</button>
            </div>
            <span className="label" style={{ marginTop: 2 }}>
              {showZones ? '显示区层级，导出含区列' : '单区模式，导出不含区列'}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
