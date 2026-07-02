export const SNAP = 20

// Adapted for dark theme
export const COLORS = {
  empty:    { fill: '#162d4a', stroke: '#378ADD', text: '#7ab8f5' },
  occupied: { fill: '#3d2200', stroke: '#BA7517', text: '#FAC775' },
  reserved: { fill: '#142a08', stroke: '#639922', text: '#8dc95a' },
  damaged:  { fill: '#3a0f0f', stroke: '#E24B4A', text: '#F7C1C1' },
  shelf:    { fill: '#1e1e1c', stroke: '#555550', text: '#aaaaaa' },
  area:     { fill: 'rgba(83,74,183,0.08)', stroke: '#534AB7', text: '#a09de8' },
  aisle:    { fill: null, stroke: '#7F77DD', text: '#a09de8', hatch: true },
  port:     { fill: '#3d1408', stroke: '#D85A30', text: '#F0997B' },
}

// Excel-style grid layout colors used in generateGridLayout / canvasLib
export const GRID_COLORS = {
  occupiedFill: '#93c5fd', // light blue for filled stacks
  emptyFill: '#ffffff',
  marker: '#e63946',
  facility: '#2ecc71',
}

export const STATUS_LABELS = {
  empty: '空置',
  occupied: '占用',
  reserved: '预留',
  damaged: '损坏',
}

export const TOOL_LABELS = {
  select: '选择',
  shelf: '货架',
  slot: '货位',
  area: '区域',
  aisle: '通道',
  port: '投药口',
}

export const CANVAS_W = 680
export const CANVAS_H = 460

export const DEMO_SHAPES = [
  { type: 'area',  x: 20,  y: 20,  w: 640, h: 420, status: 'empty', label: '仓库A区' },
  { type: 'aisle', x: 320, y: 20,  w: 60,  h: 420, status: 'empty', label: '主通道' },
  { type: 'shelf', x: 40,  y: 40,  w: 260, h: 380, status: 'empty', label: '货架01' },
  { type: 'shelf', x: 400, y: 40,  w: 240, h: 380, status: 'empty', label: '货架02' },
  ...(() => {
    const arr = []; let n = 1
    for (let r = 0; r < 5; r++) for (let c = 0; c < 4; c++) {
      arr.push({ type: 'slot', x: 44 + c * 62, y: 44 + r * 72, w: 58, h: 66,
        status: n <= 6 ? 'occupied' : n <= 7 ? 'reserved' : 'empty',
        label: 'A-' + String(n++).padStart(2, '0') })
    }
    return arr
  })(),
  ...(() => {
    const arr = []; let n = 21
    for (let r = 0; r < 5; r++) for (let c = 0; c < 4; c++) {
      arr.push({ type: 'slot', x: 404 + c * 58, y: 44 + r * 72, w: 56, h: 66,
        status: n <= 24 ? 'occupied' : n === 25 ? 'damaged' : 'empty',
        label: 'B-' + String(n++ - 20).padStart(2, '0') })
    }
    return arr
  })(),
  { type: 'port', x: 305, y: 50,  w: 30, h: 30, status: 'empty', label: 'P1', dose: 40 },
  { type: 'port', x: 305, y: 220, w: 30, h: 30, status: 'empty', label: 'P2', dose: 40 },
  { type: 'port', x: 305, y: 390, w: 30, h: 30, status: 'empty', label: 'P3', dose: 40 },
]
