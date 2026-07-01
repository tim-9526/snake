import { COLORS } from './constants.js'

export function snap(v) {
  return Math.round(v / 20) * 20
}

export function getPos(e, canvas) {
  const r = canvas.getBoundingClientRect()
  const t = e.touches ? e.touches[0] : e
  return { x: t.clientX - r.left, y: t.clientY - r.top }
}

export function drawGrid(ctx, W, H) {
  ctx.save()
  ctx.strokeStyle = 'rgba(255,255,255,0.04)'
  ctx.lineWidth = 0.5
  for (let x = 0; x <= W; x += 20) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke() }
  for (let y = 0; y <= H; y += 20) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke() }
  ctx.restore()
}

function drawHatch(ctx, x, y, w, h) {
  ctx.save()
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip()
  ctx.strokeStyle = 'rgba(127,119,221,0.2)'; ctx.lineWidth = 1
  const m = Math.max(w, h)
  for (let i = -m; i < m * 2; i += 10) {
    ctx.beginPath(); ctx.moveTo(x + i, y); ctx.lineTo(x + i + h, y + h); ctx.stroke()
  }
  ctx.restore()
}

function tracePath(ctx, x, y, w, h, r) {
  if (ctx.roundRect) { ctx.roundRect(x, y, w, h, r); return }
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r)
  ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
  ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r)
  ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r)
}

export function drawShape(ctx, s, selected) {
  const selColor = '#e8d44d'

  if (s.type === 'port') {
    const r = Math.min(s.w, s.h) / 2, cx = s.x + s.w / 2, cy = s.y + s.h / 2
    ctx.save()
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.fillStyle = COLORS.port.fill; ctx.fill()
    ctx.strokeStyle = selected ? selColor : COLORS.port.stroke
    ctx.lineWidth = selected ? 2 : 1; ctx.stroke()
    ctx.beginPath(); ctx.arc(cx, cy, r * 0.45, 0, Math.PI * 2)
    ctx.fillStyle = COLORS.port.stroke; ctx.fill()
    if (s.label) {
      ctx.fillStyle = COLORS.port.text
      ctx.font = '500 10px sans-serif'
      ctx.textAlign = 'center'; ctx.textBaseline = 'top'
      ctx.fillText(s.label, cx, cy + r + 3, s.w + 20)
    }
    if (s.dose != null) {
      ctx.fillStyle = '#F0997B'; ctx.font = '10px sans-serif'
      ctx.textAlign = 'center'; ctx.textBaseline = 'top'
      ctx.fillText(s.dose + 'kg', cx, cy + r + 14, s.w + 30)
    }
    ctx.restore(); return
  }

  const col = COLORS[s.type === 'slot' ? s.status : s.type] || COLORS.shelf
  ctx.save(); ctx.beginPath()
  tracePath(ctx, s.x, s.y, s.w, s.h, s.type === 'area' ? 6 : 3)

  if (col.hatch) {
    ctx.fillStyle = 'rgba(40,36,80,0.5)'; ctx.fill()
    drawHatch(ctx, s.x, s.y, s.w, s.h)
  } else {
    ctx.fillStyle = col.fill; ctx.fill()
  }

  ctx.strokeStyle = selected ? selColor : col.stroke
  ctx.lineWidth = selected ? 2 : (s.type === 'area' ? 0.8 : 0.5)
  if (s.type === 'area') ctx.setLineDash([6, 4])
  ctx.stroke(); ctx.setLineDash([])

  if (s.label) {
    ctx.fillStyle = col.text
    ctx.font = (s.type === 'slot' ? '' : '500 ') + (s.type === 'slot' ? 11 : 12) + 'px sans-serif'
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText(s.label, s.x + s.w / 2, s.y + s.h / 2, s.w - 6)
  }
  ctx.restore()
}

const DRAW_ORDER = ['area', 'aisle', 'shelf', 'slot', 'port']

export function renderAll(ctx, W, H, shapes, selected, dpr = 1) {
  ctx.clearRect(0, 0, W * dpr, H * dpr)
  ctx.save()
  if (dpr !== 1) ctx.scale(dpr, dpr)
  drawGrid(ctx, W, H)
  ;[...shapes]
    .sort((a, b) => DRAW_ORDER.indexOf(a.type) - DRAW_ORDER.indexOf(b.type))
    .forEach(s => drawShape(ctx, s, s === selected))
  ctx.restore()
}

const HIT_ORDER = ['port', 'slot', 'shelf', 'aisle', 'area']

export function hitTest(shapes, mx, my) {
  for (const t of HIT_ORDER) {
    const found = [...shapes].reverse().find(
      s => s.type === t && mx >= s.x && mx <= s.x + s.w && my >= s.y && my <= s.y + s.h
    )
    if (found) return found
  }
  return null
}
