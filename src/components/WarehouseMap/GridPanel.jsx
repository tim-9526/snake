import { useRef, useEffect, useState } from 'react'
import { generateGridLayout } from './generateGridLayout.js'
import { renderAll } from './canvasLib.js'

const PREVIEW_W = 640
const PREVIEW_H = 220

export default function GridPanel({ warehouses, settings, onGenerate }) {
  const pRef = useRef()
  const [preview, setPreview] = useState(null)
  const [cols, setCols] = useState(13)
  const [rows, setRows] = useState(2)

  function regenerate(options) {
    const result = generateGridLayout(warehouses, settings, options)
    setPreview(result)
    return result
  }

  useEffect(() => {
    const result = regenerate({ colsPerRow: cols, rowCount: rows })

    const canvas = pRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    canvas.width = PREVIEW_W * dpr
    canvas.height = PREVIEW_H * dpr
    canvas.style.width = PREVIEW_W + 'px'
    canvas.style.height = PREVIEW_H + 'px'

    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, PREVIEW_W * dpr, PREVIEW_H * dpr)

    if (!result.shapes.length) return

    const ys = result.shapes.map(s => s.y + s.h)
    const maxY = Math.max(...ys)
    const pad = 12
    const scale = Math.min(1, (PREVIEW_H - pad * 2) / maxY)

    ctx.save()
    if (dpr !== 1) ctx.scale(dpr, dpr)
    ctx.translate(pad, pad)
    ctx.scale(scale, scale)
    renderAll(ctx, PREVIEW_W / scale, PREVIEW_H / scale, result.shapes, null, 1)
    ctx.restore()
  }, [warehouses, settings, cols, rows])

  const hasData = warehouses?.some(wh =>
    wh.zones?.some(z => z.stacks?.some(s => s.segments?.length > 0))
  )

  function handleGenerate() {
    const result = regenerate({ colsPerRow: cols, rowCount: rows })
    if (result.shapes.length) {
      onGenerate(result.shapes)
    }
  }

  return (
    <div className="wm-auto-panel">
      <div className="wm-auto-grid">
        <div>
          <div className="wm-section-title">网格平面布局</div>
          <p className="wm-hint" style={{ margin: '0 0 12px', lineHeight: 1.5 }}>
            按垛位序号生成平面布局图：有药垛位显示蓝色填充，空垛位显示白色网格，
            左右带红色标记，底部标注疏散门、电箱等设施。
          </p>

          <div className="wm-grid-controls" style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
            <label className="wm-field-inline">
              <span>列数</span>
              <input
                type="number" min="1" max="30" value={cols}
                onChange={e => setCols(Math.max(1, parseInt(e.target.value) || 1))}
              />
            </label>
            <label className="wm-field-inline">
              <span>行数</span>
              <input
                type="number" min="1" max="6" value={rows}
                onChange={e => setRows(Math.max(1, parseInt(e.target.value) || 1))}
              />
            </label>
          </div>

          <div className="wm-stats-row" style={{ marginBottom: 12 }}>
            {[
              { label: '仓库数', value: preview?.stats.whCount ?? '—' },
              { label: '垛位数', value: preview?.stats.totalSlots ?? '—' },
              { label: '总投药量', value: preview?.stats.totalDose != null ? preview.stats.totalDose + ' g' : '—' },
            ].map(({ label, value }) => (
              <div key={label} className="wm-stat-card">
                <div className="wm-stat-lbl">{label}</div>
                <div className="wm-stat-val">{value}</div>
              </div>
            ))}
          </div>

          <button
            className="wm-btn-primary"
            onClick={handleGenerate}
            disabled={!hasData}
            style={!hasData ? { opacity: 0.4, cursor: 'default' } : {}}
          >
            ✦ 生成网格垛位图
          </button>
        </div>

        <div>
          <div className="wm-section-title">预览</div>
          <div className="wm-preview-wrap" style={{ marginTop: 6 }}>
            <canvas
              ref={pRef}
              style={{ display: 'block', width: '100%', maxWidth: PREVIEW_W + 'px', height: 'auto', aspectRatio: '64/22' }}
            />
          </div>
          {!hasData && (
            <p className="wm-hint" style={{ marginTop: 8, textAlign: 'center' }}>
              填写垛位数据后生成平面布局
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
