/**
 * Generate warehouse map shapes from the app's warehouse data.
 * Each stack becomes a slot with size proportional to its physical footprint.
 * Ports (dosing ports) are placed on the right side of each warehouse area.
 *
 * Layout rules:
 * 1. Filter out stacks with zero volume (empty/default segments)
 * 2. Group stacks by zone within each warehouse
 * 3. Slot size based on physical dimensions (length + width), capped at a max
 * 4. Auto-wrap within diagram width, zone labels as section headers
 */
import { warehouseDose, stackVolume } from '../../utils/calc'

const PAD = 20
const SLOT_MIN_W = 32
const SLOT_MIN_H = 28
const SLOT_MAX_W = 90
const PORT_R = 14
const DIAGRAM_W = 640

/**
 * @param {Array} warehouses — full warehouses array from project data
 * @param {object} settings — { density, unit, showZones, warehouseColName }
 * @returns {{ shapes: Array, stats: object }}
 */
export function generateFromData(warehouses, settings) {
  if (!warehouses?.length) {
    return { shapes: [], stats: { whCount: 0, totalSlots: 0, totalDose: 0 } }
  }

  const { density } = settings
  const shapes = []
  let totalSlots = 0
  let totalDoseVal = 0
  let cursorY = PAD

  for (const wh of warehouses) {
    const whDose = warehouseDose(wh, density)
    totalDoseVal += whDose
    const whName = wh.name || '(未命名)'
    const whStartY = cursorY

    // Collect all stacks grouped by zone, filter out zero-volume
    const zoneGroups = []
    for (const zone of wh.zones) {
      const stacks = []
      for (const stack of zone.stacks) {
        const vol = stackVolume(stack)
        if (vol <= 0) continue // skip empty stacks
        // Physical footprint: length * width of first segment as guide
        const firstSeg = stack.segments[0]
        const len = parseFloat(firstSeg?.length) || 0
        const wid = parseFloat(firstSeg?.width) || 0
        stacks.push({ stack, zoneName: zone.name || '(区)', volume: vol, len, wid })
      }
      if (stacks.length > 0) {
        zoneGroups.push({ zoneName: zone.name || '(区)', stacks })
      }
    }

    if (zoneGroups.length === 0) {
      cursorY += 60 + 20
      continue
    }

    // Calculate sizing: find max volume across this warehouse for relative scaling
    const allStacks = zoneGroups.flatMap(g => g.stacks)
    const maxVol = Math.max(...allStacks.map(s => s.volume), 1)

    // Draw warehouse area outline
    const areaStartY = cursorY
    shapes.push({
      type: 'area', status: 'empty', label: whName,
      x: PAD - 4, y: cursorY,
      w: DIAGRAM_W, h: 0,
    })
    cursorY += 28 // space for warehouse label

    // Layout each zone
    for (const group of zoneGroups) {
      // Zone label
      shapes.push({
        type: 'shelf', status: 'empty', label: group.zoneName,
        x: PAD, y: cursorY,
        w: DIAGRAM_W, h: 20,
      })
      cursorY += 24

      let rowX = PAD
      let rowY = cursorY
      let rowH = 0
      let col = 0
      const slotGap = 6
      const rowGap = 8

      for (const item of group.stacks) {
        // Size based on physical footprint: length + width as proxy for floor area
        const footprint = Math.max(item.len * item.wid, 1)
        const maxFootprint = Math.max(...group.stacks.map(s => Math.max(s.len * s.wid, 1)))
        const ratio = footprint / maxFootprint
        const slotW = Math.round(SLOT_MIN_W + ratio * (SLOT_MAX_W - SLOT_MIN_W))
        const slotH = Math.max(SLOT_MIN_H, Math.round(slotW * 0.7))

        // Check wrap
        if (col > 0 && rowX + slotW + slotGap > PAD + DIAGRAM_W) {
          rowX = PAD
          rowY += rowH + rowGap
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
          _volume: Math.round(item.volume * 100) / 100,
          _dose: Math.round(dose * 100) / 100,
          _zoneName: group.zoneName,
        })

        rowX += slotW + slotGap
        rowH = Math.max(rowH, slotH)
        col++
        totalSlots++
      }

      cursorY = rowY + rowH
    }

    // Update area height
    const whHeight = cursorY - whStartY + PAD
    const areaShape = shapes.find(s => s.type === 'area' && s.label === whName)
    if (areaShape) areaShape.h = whHeight

    // Add dosing port on the right side
    if (whDose > 0) {
      shapes.push({
        type: 'port', status: 'empty',
        label: 'P',
        dose: Math.round(whDose),
        x: PAD + DIAGRAM_W - PORT_R * 2 - 4,
        y: whStartY + 30,
        w: PORT_R * 2, h: PORT_R * 2,
      })
    }

    cursorY = whStartY + whHeight + 20
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
