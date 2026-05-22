import { useRef, useEffect, useState } from 'react'
import { autoGenerate } from './autoGenerate.js'
import { renderAll } from './canvasLib.js'

export default function AutoPanel({ onGenerate }) {
  const pRef = useRef()
  const [params, setParams] = useState({
    cols: 8, rows: 6, slotW: 60, slotH: 60,
    aisleN: 1, aislePos: 4,
    totalDose: 120, slotCap: 20, portN: 3, startLabel: 'A',
  })
  const [stats, setStats] = useState(null)
  const previewShapes = useRef([])

  function set(key, val) {
    setParams(p => ({ ...p, [key]: val }))
  }

  function computePreview(p) {
    const result = autoGenerate(p)
    previewShapes.current = result.shapes
    setStats({ total: result.slotCount, need: result.needSlots, free: Math.max(0, result.slotCount - result.needSlots), ports: p.portN })

    const canvas = pRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width, H = canvas.height
    const shapes = result.shapes
    if (!shapes.length) { ctx.clearRect(0, 0, W, H); return }

    const xs = shapes.map(s => s.x), ys = shapes.map(s => s.y)
    const xe = shapes.map(s => s.x + s.w), ye = shapes.map(s => s.y + s.h)
    const mx = Math.min(...xs), my = Math.min(...ys), mxe = Math.max(...xe), mye = Math.max(...ye)
    const scale = Math.min((W - 8) / (mxe - mx), (H - 8) / (mye - my), 1)

    ctx.save()
    ctx.translate(4 - mx * scale, 4 - my * scale)
    ctx.scale(scale, scale)
    renderAll(ctx, W / scale, H / scale, shapes, null)
    ctx.restore()
  }

  useEffect(() => { computePreview(params) }, [params])

  function num(key, val) {
    return set(key, Number(val) || 0)
  }

  function handleGenerate() {
    const result = autoGenerate(params)
    onGenerate(result.shapes)
  }

  return (
    <div className="wm-auto-panel">
      <div className="wm-auto-grid">
        <div>
          <div className="wm-section-title">仓库参数</div>
          <div className="wm-form-grid">
            <label>仓库宽度（格）<input type="number" value={params.cols} min={2} max={20} onChange={e => num('cols', e.target.value)} /></label>
            <label>仓库深度（格）<input type="number" value={params.rows} min={2} max={16} onChange={e => num('rows', e.target.value)} /></label>
            <label>货位宽（px）<input type="number" value={params.slotW} min={30} max={120} onChange={e => num('slotW', e.target.value)} /></label>
            <label>货位高（px）<input type="number" value={params.slotH} min={30} max={120} onChange={e => num('slotH', e.target.value)} /></label>
            <label>通道数（纵向）<input type="number" value={params.aisleN} min={0} max={4} onChange={e => num('aisleN', e.target.value)} /></label>
            <label>通道位置（列后）<input type="number" value={params.aislePos} min={1} max={19} onChange={e => num('aislePos', e.target.value)} /></label>
          </div>

          <div className="wm-section-title" style={{ marginTop: 12 }}>投药参数</div>
          <div className="wm-form-grid">
            <label>总投药量（kg）<input type="number" value={params.totalDose} min={0} onChange={e => num('totalDose', e.target.value)} /></label>
            <label>单位货位容量（kg）<input type="number" value={params.slotCap} min={1} onChange={e => num('slotCap', e.target.value)} /></label>
            <label>投药口数量<input type="number" value={params.portN} min={0} max={10} onChange={e => num('portN', e.target.value)} /></label>
            <label>标注起始编号<input type="text" value={params.startLabel} maxLength={1} onChange={e => set('startLabel', e.target.value || 'A')} /></label>
          </div>

          <p className="wm-hint">投药口将自动分布于通道两侧，优先在货架顶部开口。</p>
          <button className="wm-btn-primary" onClick={handleGenerate}>✦ 自动生成垛位图</button>
        </div>

        <div>
          <div className="wm-section-title">实时统计</div>
          <div className="wm-stats-row">
            {[
              { label: '货位总数',   value: stats?.total ?? '—' },
              { label: '需占用货位', value: stats?.need  ?? '—' },
              { label: '剩余空置',   value: stats?.free  ?? '—' },
              { label: '投药口数',   value: stats?.ports ?? '—' },
            ].map(({ label, value }) => (
              <div key={label} className="wm-stat-card">
                <div className="wm-stat-lbl">{label}</div>
                <div className="wm-stat-val">{value}</div>
              </div>
            ))}
          </div>

          <div className="wm-section-title" style={{ margin: '12px 0 6px' }}>预览</div>
          <div className="wm-preview-wrap">
            <canvas ref={pRef} width={320} height={220} style={{ display: 'block', width: '100%' }} />
          </div>
        </div>
      </div>
    </div>
  )
}
