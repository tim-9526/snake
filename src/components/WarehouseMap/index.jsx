import { useState } from 'react'
import { useHistory } from './useHistory.js'
import { DEMO_SHAPES } from './constants.js'
import DrawPanel from './DrawPanel.jsx'
import AutoPanel from './AutoPanel.jsx'
import DataPanel from './DataPanel.jsx'
import IoPanel from './IoPanel.jsx'
import GridPanel from './GridPanel.jsx'
import './WarehouseMap.css'

const TABS = [
  { id: 'draw', label: '手绘模式' },
  { id: 'grid', label: '网格布局' },
  { id: 'auto', label: '自动生成' },
  { id: 'data', label: '从数据生成' },
  { id: 'io',   label: '导入 / 导出' },
]

export default function WarehouseMap({ onClose, warehouses, settings }) {
  const [tab, setTab] = useState('draw')
  const { shapes, push, undo, reset } = useHistory(DEMO_SHAPES)

  function handleAutoGenerate(newShapes) {
    reset(newShapes)
    setTab('draw')
  }

  function handleImport(newShapes) {
    reset(newShapes)
    setTab('draw')
  }

  return (
    <div className="wm-overlay" role="dialog" aria-modal="true" aria-label="仓库垛位图">
      <div className="wm-shell">
        <div className="wm-header">
          <span className="wm-title">垛位图工具</span>
          <button className="wm-close" onClick={onClose} aria-label="关闭">✕</button>
        </div>

        <div className="wm-tabs">
          {TABS.map(t => (
            <button
              key={t.id}
              className={'wm-tab' + (tab === t.id ? ' active' : '')}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="wm-body">
          {tab === 'draw' && (
            <DrawPanel shapes={shapes} push={push} undo={undo} />
          )}
          {tab === 'grid' && (
            <GridPanel
              warehouses={warehouses}
              settings={settings}
              onGenerate={handleAutoGenerate}
            />
          )}
          {tab === 'auto' && (
            <AutoPanel onGenerate={handleAutoGenerate} />
          )}
          {tab === 'data' && (
            <DataPanel
              warehouses={warehouses}
              settings={settings}
              onGenerate={handleAutoGenerate}
            />
          )}
          {tab === 'io' && (
            <IoPanel shapes={shapes} onImport={handleImport} />
          )}
        </div>
      </div>
    </div>
  )
}
