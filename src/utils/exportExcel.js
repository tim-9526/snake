import * as XLSX from 'xlsx'
import {
  stackVolume, stackDose, stackPoints,
  warehouseVolume, warehouseDose, warehousePoints,
  totalVolume, totalDose, totalPoints,
  formatVolume, formatDose,
} from './calc'

export function exportExcel(warehouses, settings) {
  const { density, dosePerPoint, unit, warehouseColName } = settings
  const whColName = warehouseColName || '仓库'
  const doseUnit = unit === 'kg' ? 'kg' : 'g'

  const rows = []
  const merges = []

  // header row
  rows.push([whColName, '垛位', `投药点/个`, `投药量/${doseUnit}`, `体积/m³`, `总计投药量/${doseUnit}`])

  for (const wh of warehouses) {
    const whStacks = wh.zones.flatMap(z => z.stacks)
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

    // 仓库列、总计投药量列合并同一库的所有行
    if (whStacks.length > 1) {
      merges.push({ s: { r: whStartRow, c: 0 }, e: { r: whEndRow, c: 0 } })
      merges.push({ s: { r: whStartRow, c: 5 }, e: { r: whEndRow, c: 5 } })
    }
  }

  // 总计行
  const tVol = totalVolume(warehouses)
  const tDose = totalDose(warehouses, density)
  const tPts = totalPoints(warehouses, density, dosePerPoint)
  rows.push(['总计', '', tPts, formatDose(tDose, unit), formatVolume(tVol), ''])

  const ws = XLSX.utils.aoa_to_sheet(rows)
  ws['!merges'] = merges
  ws['!cols'] = [
    { wch: 14 },
    { wch: 14 },
    { wch: 12 },
    { wch: 14 },
    { wch: 12 },
    { wch: 16 },
  ]

  // 加粗：表头行 + 总计行
  const totalRowIdx = rows.length - 1
  Object.keys(ws).forEach(key => {
    if (key.startsWith('!')) return
    const match = key.match(/[A-Z]+(\d+)/)
    if (!match) return
    const rowIdx = parseInt(match[1]) - 1
    if (rowIdx === 0 || rowIdx === totalRowIdx) {
      if (!ws[key].s) ws[key].s = {}
      ws[key].s.font = { bold: true }
    }
  })

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '投药计算汇总')

  const date = new Date().toISOString().slice(0, 10)
  XLSX.writeFile(wb, `投药计算_${date}.xlsx`)
}
