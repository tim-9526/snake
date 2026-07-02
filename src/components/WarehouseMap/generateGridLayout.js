import { stackVolume, stackDose } from '../../utils/calc'

const PAD = 24
const DIAGRAM_W = 640

// Facility labels placed along the bottom of the diagram
const DEFAULT_FACILITIES = ['疏散门', '电箱', '门', '电箱', '疏散门']

function getStackDisplayCode(stack, index) {
  if (stack.code) return stack.code
  return String(index + 1) + '#'
}

export function generateGridLayout(warehouses, settings, options = {}) {
  if (!warehouses?.length) {
    return { shapes: [], stats: { whCount: 0, totalSlots: 0, totalDose: 0 } }
  }

  const { density } = settings
  const {
    colsPerRow = 13,
    rowCount = 2,
    slotW = 44,
    slotH = 56,
    gapX = 8,
    gapY = 18,
    facilities = DEFAULT_FACILITIES,
  } = options

  const shapes = []
  let cursorY = PAD
  let totalSlots = 0
  let totalDoseVal = 0

  // Collect all stacks with dose across all warehouses/zones, in order
  const allStacks = []
  for (const wh of warehouses) {
    for (const zone of wh.zones ?? []) {
      for (const stack of zone.stacks ?? []) {
        const vol = stackVolume(stack)
        const dose = vol * density
        allStacks.push({
          wh,
          zone,
          stack,
          vol,
          dose,
          globalIndex: allStacks.length,
        })
      }
    }
  }

  // Compute diagram layout metrics
  const blocks = allStacks.length
  const topRowSlots = Math.min(blocks, colsPerRow)
  const bottomRowSlots = Math.max(0, blocks - colsPerRow)
  const diagramW = topRowSlots * slotW + (topRowSlots - 1) * gapX
  const diagramH = rowCount * slotH + gapY

  // Center the whole grid
  const startX = PAD + Math.max(0, (DIAGRAM_W - diagramW) / 2)
  const startY = cursorY

  // Background area
  shapes.push({
    type: 'area',
    status: 'empty',
    label: '',
    x: startX - 10,
    y: startY - 10,
    w: diagramW + 20,
    h: diagramH + 44,
  })

  // Top row (rendered right-to-left to match screenshot numbering: 1# on the right)
  for (let i = 0; i < topRowSlots; i++) {
    const col = topRowSlots - 1 - i // right to left
    const item = allStacks[i]
    const x = startX + col * (slotW + gapX)
    const y = startY
    const isOccupied = item.dose > 0

    shapes.push({
      type: 'slot',
      status: isOccupied ? 'occupied' : 'empty',
      label: getStackDisplayCode(item.stack, i),
      x, y, w: slotW, h: slotH,
      _dose: Math.round(item.dose * 100) / 100,
      _volume: Math.round(item.vol * 100) / 100,
      _zoneName: item.zone.name || '',
      _gridStyle: true,
      _labelPosition: 'below',
    })

    // Red markers on left and right corners of each slot (like screenshot)
    const markerW = 4
    const markerH = 8
    shapes.push({ type: 'marker', status: 'empty', x: x - markerW, y: y + slotH * 0.35, w: markerW, h: markerH })
    shapes.push({ type: 'marker', status: 'empty', x: x + slotW, y: y + slotH * 0.35, w: markerW, h: markerH })

    totalDoseVal += item.dose
    totalSlots++
  }

  // Bottom row (rendered left-to-right, continuing numbering)
  for (let i = 0; i < bottomRowSlots; i++) {
    const idx = colsPerRow + i
    const item = allStacks[idx]
    const x = startX + i * (slotW + gapX)
    const y = startY + slotH + gapY
    const isOccupied = item.dose > 0

    shapes.push({
      type: 'slot',
      status: isOccupied ? 'occupied' : 'empty',
      label: getStackDisplayCode(item.stack, idx),
      x, y, w: slotW, h: slotH,
      _dose: Math.round(item.dose * 100) / 100,
      _volume: Math.round(item.vol * 100) / 100,
      _zoneName: item.zone.name || '',
      _gridStyle: true,
      _labelPosition: 'below',
    })

    const markerW = 4
    const markerH = 8
    shapes.push({ type: 'marker', status: 'empty', x: x - markerW, y: y + slotH * 0.35, w: markerW, h: markerH })
    shapes.push({ type: 'marker', status: 'empty', x: x + slotW, y: y + slotH * 0.35, w: markerW, h: markerH })

    totalDoseVal += item.dose
    totalSlots++
  }

  // Facility labels at the bottom (疏散门, 电箱, 门, etc.)
  const facilityCount = facilities.length
  const availableWidth = diagramW
  const step = availableWidth / Math.max(facilityCount, 1)
  facilities.forEach((name, idx) => {
    const cx = startX + (idx + 0.5) * step
    const labelW = 48
    const labelH = 18
    shapes.push({
      type: 'facility',
      status: 'empty',
      label: name,
      x: cx - labelW / 2,
      y: startY + diagramH + 10,
      w: labelW, h: labelH,
    })
  })

  return {
    shapes,
    stats: {
      whCount: warehouses.length,
      totalSlots,
      totalDose: Math.round(totalDoseVal),
    },
  }
}
