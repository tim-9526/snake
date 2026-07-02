import ExcelJS from 'exceljs'
import { uid } from './uid'

const defaultSegment = (length = '', width = '', height = '') => ({ id: uid(), length, width, height })
const defaultStack = (code = '') => ({ id: uid(), code, segments: [defaultSegment()] })
const defaultZone = (name = '') => ({ id: uid(), name, stacks: [] })
const defaultWarehouse = (name = '') => ({ id: uid(), name, zones: [] })

function normalizeNum(v) {
  const n = parseFloat(v)
  return isNaN(n) ? '' : n
}

function cellText(cell) {
  const v = cell.value
  if (v === null || v === undefined) return ''
  if (typeof v === 'object' && v !== null) {
    if (v.richText) return v.richText.map(r => r.text).join('')
    if (v.result !== undefined) return String(v.result) // formula cell
  }
  return String(v)
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

  if (parsed.data && parsed.data.warehouses) {
    validateProjectData(parsed.data)
    return { name: parsed.name || '导入项目', data: parsed.data }
  }

  if (parsed.warehouses) {
    validateProjectData(parsed)
    return { name: '导入项目', data: parsed }
  }

  throw new Error('JSON 结构不匹配，请导出后再导入')
}

// P1: deep validation — repair malformed nested structures
function validateProjectData(data) {
  if (!Array.isArray(data.warehouses)) throw new Error('数据缺少 warehouses 字段')
  if (!data.settings || typeof data.settings !== 'object') throw new Error('数据缺少 settings 字段')

  // Deep-repair: ensure zones/stacks/segments are valid arrays
  for (const wh of data.warehouses) {
    if (!wh || typeof wh !== 'object') continue
    if (!Array.isArray(wh.zones)) wh.zones = [defaultZone('1区')]
    for (const zone of wh.zones) {
      if (!Array.isArray(zone.stacks)) zone.stacks = []
      for (const stack of zone.stacks) {
        if (!Array.isArray(stack.segments) || stack.segments.length === 0) {
          stack.segments = [defaultSegment()]
        }
      }
    }
  }
}

/**
 * Import from Excel file (ArrayBuffer | Buffer).
 * Uses ExcelJS (no prototype-pollution CVEs).
 */
export async function importFromExcel(arrayBuffer, warehouseColName = '仓库') {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(arrayBuffer)

  const ws = workbook.worksheets[0]
  if (!ws) throw new Error('Excel 文件中没有工作表')

  const rows = []
  ws.eachRow((row) => {
    const cells = []
    for (let c = 1; c <= row.cellCount; c++) {
      cells.push(cellText(row.getCell(c)))
    }
    rows.push(cells)
  })

  if (rows.length < 2) throw new Error('Excel 数据为空')

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

    if (colA === '总计' || colA.toLowerCase() === 'total') continue
    if (!colA && !colBVal) continue

    if (colA) {
      const wh = defaultWarehouse(colA)
      wh.zones = [defaultZone('1区')]
      warehouses.push(wh)
      currentWh = wh
    }

    if (colBVal && currentWh) {
      currentWh.zones[0].stacks.push(defaultStack(colBVal))
    }
  }

  if (warehouses.length === 0) throw new Error('未能从 Excel 中解析出任何仓库数据')

  return {
    name: '导入项目',
    data: {
      settings: { density: 5, dosePerPoint: 200, unit: 'g', warehouseColName },
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
