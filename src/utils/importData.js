import * as XLSX from 'xlsx'
import { uid } from './uid'
const defaultSegment = (length = '', width = '', height = '') => ({ id: uid(), length, width, height })
const defaultStack = (code = '') => ({ id: uid(), code, segments: [defaultSegment()] })
const defaultZone = (name = '') => ({ id: uid(), name, stacks: [] })
const defaultWarehouse = (name = '') => ({ id: uid(), name, zones: [] })

function normalizeNum(v) {
  const n = parseFloat(v)
  return isNaN(n) ? '' : n
}

/**
 * Import from JSON backup.
 * Accepts either a full project object { name, data } or just data { settings, warehouses }.
 */
export function importFromJson(text) {
  let parsed
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('文件不是有效的 JSON 格式')
  }

  // Full project export: { name, data: { settings, warehouses } }
  if (parsed.data && parsed.data.warehouses) {
    validateProjectData(parsed.data)
    return { name: parsed.name || '导入项目', data: parsed.data }
  }

  // Bare data export: { settings, warehouses }
  if (parsed.warehouses) {
    validateProjectData(parsed)
    return { name: '导入项目', data: parsed }
  }

  throw new Error('JSON 结构不匹配，请导出后再导入')
}

function validateProjectData(data) {
  if (!Array.isArray(data.warehouses)) throw new Error('数据缺少 warehouses 字段')
  if (!data.settings || typeof data.settings !== 'object') throw new Error('数据缺少 settings 字段')
}

/**
 * Import from Excel file (ArrayBuffer).
 * Parses the format produced by exportExcel.js:
 *   Col A: 仓库名  Col B: 垛位编号  Col C: 点数  Col D: 投药量  Col E: 体积
 * We reconstruct warehouses → zones(单区) → stacks from this flat table.
 * Since the Excel format doesn't encode zone structure, each warehouse gets one zone.
 */
export function importFromExcel(arrayBuffer, warehouseColName = '仓库') {
  const wb = XLSX.read(arrayBuffer, { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  if (!ws) throw new Error('Excel 文件中没有工作表')

  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })
  if (rows.length < 2) throw new Error('Excel 数据为空')

  // Validate header: col A must match the warehouse column name
  const headerRow = rows[0]
  const expectedWh = warehouseColName || '仓库'
  if (String(headerRow[0] ?? '').trim() !== expectedWh) {
    throw new Error('Excel 格式不匹配，请使用本工具导出的文件')
  }

  const warehouses = []
  let currentWh = null

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    const colA = String(row[0] ?? '').trim()
    const colBVal = String(row[1] ?? '').trim()

    // Skip totals row
    if (colA === '总计' || colA === 'total' || colA.toLowerCase() === 'total') continue
    // Skip empty rows
    if (!colA && !colBVal) continue

    // New warehouse when col A has a value
    if (colA && colA !== '') {
      const wh = defaultWarehouse(colA)
      const zone = defaultZone('1区')
      wh.zones = [zone]
      warehouses.push(wh)
      currentWh = wh
    }

    // Stack row when col B has a value
    if (colBVal && currentWh) {
      const stack = defaultStack(colBVal)
      // We can't recover original segment dimensions from totals, so leave a blank segment
      currentWh.zones[0].stacks.push(stack)
    }
  }

  if (warehouses.length === 0) throw new Error('未能从 Excel 中解析出任何仓库数据')

  return {
    name: '导入项目',
    data: {
      settings: { density: 5, dosePerPoint: 200, unit: 'g', warehouseColName: warehouseColName },
      warehouses,
    },
  }
}

/**
 * Export the current project as a JSON backup file.
 */
export function exportJson(project) {
  const blob = new Blob([JSON.stringify({ name: project.name, data: project.data }, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const date = new Date().toISOString().slice(0, 10)
  a.href = url
  a.download = `投药计算备份_${project.name}_${date}.json`
  a.click()
  URL.revokeObjectURL(url)
}
