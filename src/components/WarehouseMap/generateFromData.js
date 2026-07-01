/**
 * Generate warehouse map shapes from the app's warehouse data.
 * Each stack becomes a slot with size proportional to its volume.
 * Ports (dosing ports) are placed based on the first zone's dose density.
 */
import { warehouseDose } from '../../utils/calc'

const PAD = 20
const SLOT_MIN = 24
const PORT_R = 14

/**
 * @param {Array} warehouses — the full warehouses array from project data
 * @param {object} settings — { density, unit, showZones, warehouseColName }
 * @returns {{ shapes: Array, stats: object }}
 */
export function generateFromData(warehouses, settings) {
  if (!warehouses?.length) return { shapes: [], stats: { whCount: 0, totalSlots: 0, totalDose: 0 } }

  const { density } = settings
  const shapes = []
  let totalSlots = 0
  let totalDoseVal = 0

  // Layout constants
  const slotGap = 6
  const labelGap = 8
  const whGap = 20  // gap between warehouses in the diagram
  const zoneGap = 14

  let cursorY = PAD
  const diagramW = 640  // usable width inside padding

  for (const wh of warehouses) {
    const whDose = warehouseDose(wh, density)
    totalDoseVal += whDose
    const whName = wh.name || '(未命名)'

    // Warehouse area bounding box
    const whStartY = cursorY

    // Collect all stacks across zones
    const allStacks = []
    for (const zone of wh.zones) {
      for (const stack of zone.stacks) {
        // Calculate total volume across segments
        const totalVol = stack.segments.reduce((sum, seg) => {
          return sum + (parseFloat(seg.length) || 0) * (parseFloat(seg.width) || 0) * (parseFloat(seg.height) || 0)
        }, 0)
        allStacks.push({ stack, zoneName: zone.name || '(区)', volume: totalVol })
      }
    }

    if (allStacks.length === 0) {
      cursorY += 60 + whGap
      continue
    }

    // Find max volume for relative sizing
    const maxVol = Math.max(...allStacks.map(s => s.volume || 1))
    const scaleToWidth = (vol) => Math.max(SLOT_MIN, Math.round((vol / maxVol) * 80))

    // Layout: arrange stacks in rows that fit within diagramW
    let rowX = PAD
    let rowY = cursorY + 24  // space for wh label
    let rowH = 0
    let col = 0

    // Warehouse label
    shapes.push({
      type: 'area', status: 'empty', label: whName,
      x: PAD - 4, y: cursorY,
      w: diagramW, h: 0, // height computed after layout
    })

    for (const item of allStacks) {
      const slotW = scaleToWidth(item.volume)
      const slotH = Math.max(SLOT_MIN, Math.round(slotW * 0.7))
      const itemW = slotW + 2
      const itemH = slotH + 16  // label space below

      // Check if we need to wrap to next row
      if (col > 0 && rowX + itemW + slotGap > PAD + diagramW) {
        rowX = PAD
        rowY += rowH + zoneGap
        rowH = 0
        col = 0
      }

      const stackCode = item.stack.code || 'S' + String(totalSlots + 1).padStart(2, '0')
      const dose = item.volume * density
      const isOccupied = dose > 0

      shapes.push({
        type: 'slot',
        status: isOccupied ? 'occupied' : 'empty',
        label: stackCode,
        x: rowX, y: rowY,
        w: slotW, h: slotH,
        _volume: item.volume,
        _dose: dose,
        _zoneName: item.zoneName,
      })

      rowX += itemW + slotGap
      rowH = Math.max(rowH, itemH)
      col++
      totalSlots++
    }

    const whHeight = (rowY + rowH) - whStartY + PAD
    // Update area height
    const areaShape = shapes.find(s => s.type === 'area' && s.label === whName)
    if (areaShape) areaShape.h = whHeight

    // Add dosing ports — one per warehouse, placed at the right side
    if (whDose > 0) {
      shapes.push({
        type: 'port', status: 'empty',
        label: 'P',
        dose: Math.round(whDose),
        x: PAD + diagramW - PORT_R * 2 - 4,
        y: whStartY + 30,
        w: PORT_R * 2, h: PORT_R * 2,
      })
    }

    cursorY = whStartY + whHeight + whGap
  }

  return {
    shapes,
    stats: {
      whCount: warehouses.length,
      totalSlots,
      totalDose: Math.round(totalDoseVal),
    },
  }
}
