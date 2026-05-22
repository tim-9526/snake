import { useRef, useState, useEffect, useCallback } from 'react'
import { renderAll, drawShape, snap, getPos, hitTest } from './canvasLib.js'
import { CANVAS_W, CANVAS_H, STATUS_LABELS, TOOL_LABELS } from './constants.js'
import ContextMenu from './ContextMenu.jsx'
import LabelModal from './LabelModal.jsx'

const TOOLS = ['select', 'shelf', 'slot', 'area', 'aisle', 'port']
const STATUSES = ['empty', 'occupied', 'reserved', 'damaged']

function nextLabel(type, counters) {
  const c = counters
  if (type === 'slot') {
    const n = c.slot
    const prefix = String.fromCharCode(64 + Math.ceil(n / 26))
    c.slot++
    return `${prefix}-${String(n).padStart(2, '0')}`
  }
  if (type === 'shelf')  { return `货架${String(c.shelf++).padStart(2, '0')}` }
  if (type === 'area')   { return `区域${c.area++}` }
  if (type === 'aisle')  { return `通道${c.aisle++}` }
  if (type === 'port')   { return `P${c.port++}` }
  return ''
}

export default function DrawPanel({ shapes, push, undo }) {
  const canvasRef = useRef()
  const shapesRef = useRef(shapes)

  // Sync shapesRef whenever parent shapes prop changes
  useEffect(() => { shapesRef.current = shapes }, [shapes])

  const [tool, setTool] = useState('select')
  const [status, setStatus] = useState('empty')
  const toolRef = useRef('select')
  const statusRef = useRef('empty')

  const selRef    = useRef(null)
  const drawRef   = useRef({ active: false, start: { x: 0, y: 0 }, cur: { x: 0, y: 0 } })
  const dragRef   = useRef({ active: false, off: { x: 0, y: 0 } })
  const counters  = useRef({ slot: 41, shelf: 3, area: 2, aisle: 2, port: 4 })

  const [ctxMenu, setCtxMenu] = useState(null)
  const [lblModal, setLblModal] = useState(null)

  // Keep refs in sync with state
  useEffect(() => { toolRef.current = tool }, [tool])
  useEffect(() => { statusRef.current = status }, [status])

  // Clear selection when shapes are replaced from outside (undo / auto-generate)
  useEffect(() => { selRef.current = null }, [shapes])

  const drawFrame = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    renderAll(ctx, CANVAS_W, CANVAS_H, shapesRef.current, selRef.current)

    const d = drawRef.current
    if (d.active) {
      const x = Math.min(d.start.x, d.cur.x), y = Math.min(d.start.y, d.cur.y)
      const w = Math.abs(d.cur.x - d.start.x), h = Math.abs(d.cur.y - d.start.y)
      if (w > 4 && h > 4) {
        ctx.globalAlpha = 0.45
        drawShape(ctx, { type: toolRef.current, x, y, w, h, status: statusRef.current, label: '' }, false)
        ctx.globalAlpha = 1
      }
    }
  }, [])

  useEffect(() => { drawFrame() }, [shapes, drawFrame])

  function onMouseDown(e) {
    if (e.button === 2) return
    const { x, y } = getPos(e, canvasRef.current)
    if (toolRef.current === 'select') {
      const hit = hitTest(shapesRef.current, x, y)
      selRef.current = hit || null
      if (hit) dragRef.current = { active: true, off: { x: x - hit.x, y: y - hit.y } }
      drawFrame()
    } else {
      drawRef.current = { active: true, start: { x: snap(x), y: snap(y) }, cur: { x: snap(x), y: snap(y) } }
    }
  }

  function onMouseMove(e) {
    const { x, y } = getPos(e, canvasRef.current)
    if (toolRef.current === 'select' && dragRef.current.active && selRef.current) {
      // Intentional in-place mutation for drag-preview performance; committed via push on mouseup
      selRef.current.x = snap(x - dragRef.current.off.x)
      selRef.current.y = snap(y - dragRef.current.off.y)
      drawFrame()
    } else if (drawRef.current.active) {
      drawRef.current.cur = { x: snap(x), y: snap(y) }
      drawFrame()
    }
  }

  function onMouseUp() {
    if (dragRef.current.active) {
      dragRef.current.active = false
      push([...shapesRef.current])
    }
    if (drawRef.current.active) {
      const d = drawRef.current
      d.active = false
      const x = Math.min(d.start.x, d.cur.x), y = Math.min(d.start.y, d.cur.y)
      const w = Math.abs(d.cur.x - d.start.x), h = Math.abs(d.cur.y - d.start.y)
      const minW = toolRef.current === 'port' ? 16 : 20
      if (w >= minW && h >= 16) {
        const shape = {
          type: toolRef.current, x, y, w, h,
          status: statusRef.current,
          label: nextLabel(toolRef.current, counters.current),
        }
        if (toolRef.current === 'port') shape.dose = 0
        push([...shapesRef.current, shape])
      }
      drawFrame()
    }
  }

  function onDblClick(e) {
    const { x, y } = getPos(e, canvasRef.current)
    const hit = hitTest(shapesRef.current, x, y)
    if (hit) setLblModal({ shape: hit })
  }

  function onContextMenu(e) {
    e.preventDefault()
    const { x, y } = getPos(e, canvasRef.current)
    const hit = hitTest(shapesRef.current, x, y)
    if (hit) {
      selRef.current = hit; drawFrame()
      setCtxMenu({ x: e.clientX, y: e.clientY, target: hit })
    }
  }

  function onKeyDown(e) {
    if (e.key === 'Delete' && selRef.current) {
      push(shapesRef.current.filter(s => s !== selRef.current))
      selRef.current = null
    }
  }

  function ctxAction(action) {
    const target = ctxMenu?.target
    setCtxMenu(null)
    if (!target) return
    if (action === 'delete') {
      if (selRef.current === target) selRef.current = null
      push(shapesRef.current.filter(s => s !== target))
    } else if (action === 'label') {
      setLblModal({ shape: target })
    } else {
      target.status = action // status change mutation, then commit
      push([...shapesRef.current])
    }
  }

  function confirmLabel(newLabel) {
    if (lblModal) {
      lblModal.shape.label = newLabel
      push([...shapesRef.current])
    }
    setLblModal(null)
  }

  function handleSetTool(t) {
    setTool(t)
    selRef.current = null
    drawFrame()
  }

  function clearAll() {
    selRef.current = null
    counters.current = { slot: 1, shelf: 1, area: 1, aisle: 1, port: 1 }
    push([])
  }

  function exportPng() {
    const a = document.createElement('a')
    a.download = '垛位图.png'
    a.href = canvasRef.current.toDataURL('image/png')
    a.click()
  }

  return (
    <div className="wm-draw-panel">
      <div className="wm-toolbar">
        <span className="wm-tl">工具</span>
        {TOOLS.map(t => (
          <button
            key={t}
            className={tool === t ? 'active' : ''}
            onClick={() => handleSetTool(t)}
          >
            {TOOL_LABELS[t]}
          </button>
        ))}

        <div className="wm-sep" />
        <span className="wm-tl">状态</span>
        <select value={status} onChange={e => setStatus(e.target.value)}>
          {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>

        <div className="wm-sep" />
        <button onClick={undo} title="撤销">↩ 撤销</button>
        <button onClick={clearAll} title="清空">清空</button>
        <button onClick={exportPng} title="导出PNG">导出 PNG</button>
      </div>

      <div
        className="wm-canvas-wrap"
        tabIndex={0}
        onKeyDown={onKeyDown}
        style={{ outline: 'none' }}
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onDoubleClick={onDblClick}
          onContextMenu={onContextMenu}
          style={{ cursor: tool === 'select' ? 'default' : 'crosshair', display: 'block' }}
        />
      </div>

      <div className="wm-legend">
        <span className="wm-tl" style={{ marginRight: 4 }}>图例：</span>
        {[
          { bg: '#162d4a', border: '#378ADD', label: '空置' },
          { bg: '#3d2200', border: '#BA7517', label: '占用' },
          { bg: '#142a08', border: '#639922', label: '预留' },
          { bg: '#3a0f0f', border: '#E24B4A', label: '损坏' },
          { bg: '#1e1e1c', border: '#555550', label: '货架/区域' },
          { bg: 'repeating-linear-gradient(45deg,#28244f,#28244f 4px,#3d3880 4px,#3d3880 8px)', border: '#7F77DD', label: '通道' },
          { bg: '#3d1408', border: '#D85A30', label: '投药口', round: true },
        ].map(({ bg, border, label, round }) => (
          <div key={label} className="wm-leg-item">
            <div className="wm-leg-sw" style={{
              background: bg, border: `0.5px solid ${border}`,
              borderRadius: round ? '50%' : 3,
            }} />
            {label}
          </div>
        ))}
      </div>

      <div className="wm-hint">
        提示：拖拽绘制元素；双击编辑标签；右键更多操作；Delete 删除选中
      </div>

      {ctxMenu && (
        <ContextMenu
          x={ctxMenu.x} y={ctxMenu.y}
          onAction={ctxAction}
          onClose={() => setCtxMenu(null)}
        />
      )}

      {lblModal && (
        <LabelModal
          initial={lblModal.shape.label || ''}
          onConfirm={confirmLabel}
          onClose={() => setLblModal(null)}
        />
      )}
    </div>
  )
}
