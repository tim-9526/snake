import ExcelJS from 'exceljs'
import {
  stackVolume, stackDose, stackPoints,
  warehouseDose,
  totalVolume, totalDose, totalPoints,
  formatVolume, formatDose,
} from './calc'

export async function exportExcel(warehouses, settings) {
  // P2: merges use 0-based row/col indices internally, converted to 1-based for ExcelJS.
  //
  // Layout (withZones mode, 7 cols):
  //   Col 0=仓库  1=区  2=垛位  3=投药点  4=投药量  5=体积  6=总计投药量
  // Merges:
  //   - Col 0 (仓库名) and Col 6 (总计) merged across all rows of a warehouse
  //   - Col 1 (区名) merged across all rows of a zone (iff zone.stacks.length > 1)
  //
  // Layout (single-zone mode, 6 cols):
  //   Col 0=仓库  1=垛位  2=投药点  3=投药量  4=体积  5=总计投药量
  // Merges:
  //   - Col 0 and Col 5 merged across all rows of a warehouse (iff stacks.length > 1)
  const { density, dosePerPoint, unit, warehouseColName, showZones } = settings
  const whColName = warehouseColName || '仓库'
  const doseUnit = unit === 'kg' ? 'kg' : 'g'
  const withZones = showZones !== false

  const rows = []
  // merges: 0-based { sr, sc, er, ec } — converted to 1-based when applying
  const merges = []

  if (withZones) {
    rows.push([whColName, '区', '垛位', `投药点/个`, `投药量/${doseUnit}`, `体积/m³`, `总计投药量/${doseUnit}`])
  } else {
    rows.push([whColName, '垛位', `投药点/个`, `投药量/${doseUnit}`, `体积/m³`, `总计投药量/${doseUnit}`])
  }

  for (const wh of warehouses) {
    if (withZones) {
      const whStartRow = rows.length
      const whDose = warehouseDose(wh, density)
      let whTotalRows = 0

      for (const zone of wh.zones) {
        if (zone.stacks.length === 0) continue
        const zoneStartRow = rows.length

        zone.stacks.forEach((stack, si) => {
          const sVol = stackVolume(stack)
          const sDose = stackDose(stack, density)
          const sPts = stackPoints(stack, density, dosePerPoint)
          const isLastZone = zone === wh.zones[wh.zones.length - 1]
          const isLastStack = si === zone.stacks.length - 1

          rows.push([
            whTotalRows === 0 && si === 0 ? (wh.name || '(未命名)') : '',
            si === 0 ? (zone.name || '(未命名)') : '',
            stack.code || '(未编号)',
            sPts,
            formatDose(sDose, unit),
            formatVolume(sVol),
            isLastZone && isLastStack ? formatDose(whDose, unit) : '',
          ])
          whTotalRows++
        })

        const zoneEndRow = rows.length - 1
        if (zone.stacks.length > 1) {
          merges.push({ sr: zoneStartRow, sc: 1, er: zoneEndRow, ec: 1 })
        }
      }

      const whEndRow = rows.length - 1
      if (whTotalRows > 1) {
        merges.push({ sr: whStartRow, sc: 0, er: whEndRow, ec: 0 })
        merges.push({ sr: whStartRow, sc: 6, er: whEndRow, ec: 6 })
      }
    } else {
      const whStacks = wh.zones[0]?.stacks ?? []
      if (whStacks.length === 0) continue

      const whStartRow = rows.length
      const whDose = warehouseDose(wh, density)

      whStacks.forEach((stack, i) => {
        const sVol = stackVolume(stack)
        const sDose = stackDose(stack, density)
        const sPts = stackPoints(stack, density, dosePerPoint)
        const isLast = i === whStacks.length - 1

        rows.push([
          i === 0 ? (wh.name || '(未命名)') : '',
          stack.code || '(未编号)',
          sPts,
          formatDose(sDose, unit),
          formatVolume(sVol),
          isLast ? formatDose(whDose, unit) : '',
        ])
      })

      const whEndRow = rows.length - 1
      if (whStacks.length > 1) {
        merges.push({ sr: whStartRow, sc: 0, er: whEndRow, ec: 0 })
        merges.push({ sr: whStartRow, sc: 5, er: whEndRow, ec: 5 })
      }
    }
  }

  const tVol = totalVolume(warehouses)
  const tDose = totalDose(warehouses, density)
  const tPts = totalPoints(warehouses, density, dosePerPoint)

  if (withZones) {
    rows.push(['总计', '', '', tPts, formatDose(tDose, unit), formatVolume(tVol), ''])
  } else {
    rows.push(['总计', '', tPts, formatDose(tDose, unit), formatVolume(tVol), ''])
  }

  // ── Build workbook ─────────────────────────────────────────────────────────
  const workbook = new ExcelJS.Workbook()
  const ws = workbook.addWorksheet('投药计算汇总')

  ws.columns = withZones
    ? [14, 10, 14, 12, 14, 12, 16].map(w => ({ width: w }))
    : [14, 14, 12, 14, 12, 16].map(w => ({ width: w }))

  rows.forEach(row => ws.addRow(row))

  // Apply merges (convert 0-based → 1-based for ExcelJS)
  merges.forEach(({ sr, sc, er, ec }) => {
    ws.mergeCells(sr + 1, sc + 1, er + 1, ec + 1)
  })

  // Bold header and totals rows
  ws.getRow(1).font = { bold: true }
  ws.getRow(rows.length).font = { bold: true }

  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const date = new Date().toISOString().slice(0, 10)
  a.href = url
  a.download = `投药计算_${date}.xlsx`
  a.click()
  URL.revokeObjectURL(url)
}
