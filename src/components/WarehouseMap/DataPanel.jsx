import { useRef, useEffect, useState } from 'react'
import { generateFromData } from './generateFromData.js'
import { renderAll } from './canvasLib.js'

const PREVIEW_W = 640
const PREVIEW_H = 360

export default function DataPanel({ warehouses, settings, onGenerate }) {
  const pRef = useRef()
  const [preview, setPreview] = useState(null)

  function handleGenerate() {
    const result = generateFromData(warehouses, settings)
    if (result.shapes.length) {
      onGenerate(result.shapes)
    }
  }

  useEffect(() => {
    const result = generateFromData(warehouses, settings)
    setPreview(result)

    const canvas = pRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    canvas.width = PREVIEW_W * dpr
    canvas.height = PREVIEW_H * dpr
    canvas.style.width = PREVIEW_W + 'px'
    canvas.style.height = PREVIEW_H + 'px'

    const ctx = canvas.getContext('2d')
    const shapes = result.shapes
    if (!shapes.length) {
      ctx.clearRect(0, 0, PREVIEW_W * dpr, PREVIEW_H * dpr)
      return
    }

    // Compute bounding box
    const xs = shapes.map(s => s.x), ys = shapes.map(s => s.y)
    const xe = shapes.map(s => s.x + s.w), ye = shapes.map(s => s.y + s.h)
    const mx = Math.min(...xs), my = Math.min(...ys)
    const mxe = Math.max(...xe), mye = Math.max(...ye)
    const contentW = mxe - mx, contentH = mye - my
    const pad = 12
    const scale = Math.min((PREVIEW_W - pad * 2) / contentW, (PREVIEW_H - pad * 2) / contentH, 1)

    ctx.clearRect(0, 0, PREVIEW_W * dpr, PREVIEW_H * dpr)
    ctx.save()
    if (dpr !== 1) ctx.scale(dpr, dpr)
    ctx.translate(pad - mx * scale, pad - my * scale)
    ctx.scale(scale, scale)
    renderAll(ctx, PREVIEW_W / scale, PREVIEW_H / scale, shapes, null)
    ctx.restore()
  }, [warehouses, settings])

  const hasData = warehouses?.some(wh =>
    wh.zones?.some(z => z.stacks?.some(s =>
      s.segments?.some(seg => (parseFloat(seg.length) || 0) * (parseFloat(seg.width) || 0) * (parseFloat(seg.height) || 0) > 0)
    ))
  )

  return (
    <div className="wm-auto-panel">
      <div className="wm-auto-grid">
        <div>
          <div className="wm-section-title">从项目数据生成</div>
          <p className="wm-hint" style={{ margin: '0 0 12px', lineHeight: 1.5 }}>
            根据当前仓库中已填写的垛位段数据（长×宽×高），自动计算体积并按比例生成垛位图。
            体积为 0 的空垛位会被自动跳过。
            {!hasData && (
              <span style={{ display: 'block', color: '#f59e0b', marginTop: 6 }}>
                ⚠ 当前没有有效数据，请先在主界面填写垛位的长宽高（至少一个段有尺寸）。
              </span>
            )}
          </p>

          <div className="wm-stats-row" style={{ marginBottom: 12 }}>
            {[
              { label: '仓库数', value: preview?.stats.whCount ?? '—' },
              { label: '有效垛位', value: preview?.stats.totalSlots ?? '—' },
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
            ✦ 生成垛位图
          </button>
        </div>

        <div>
          <div className="wm-section-title">预览</div>
          <div className="wm-preview-wrap" style={{ marginTop: 6 }}>
            <canvas
              ref={pRef}
              style={{ display: 'block', width: '100%', maxWidth: PREVIEW_W + 'px', height: 'auto', aspectRatio: '16/9' }}
            />
          </div>
          {!hasData && (
            <p className="wm-hint" style={{ marginTop: 8, textAlign: 'center' }}>
              填写有效垛位数据后，这里会显示预览
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
