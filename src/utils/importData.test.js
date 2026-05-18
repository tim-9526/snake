import { describe, it, expect } from 'vitest'
import * as XLSX from 'xlsx'
import { importFromJson, importFromExcel } from './importData.js'

// ── helpers ────────────────────────────────────────────────────────────────

const validSettings = { density: 5, dosePerPoint: 200, unit: 'g', warehouseColName: '仓库' }

function makeExcelBuffer(rows) {
  const ws = XLSX.utils.aoa_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
  // XLSX.write with type:'array' returns Uint8Array; importFromExcel expects that
  return XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
}

// ── importFromJson ─────────────────────────────────────────────────────────

describe('importFromJson — full backup format', () => {
  it('parses { name, data } correctly', () => {
    const input = JSON.stringify({
      name: '测试项目',
      data: { settings: validSettings, warehouses: [] },
    })
    const result = importFromJson(input)
    expect(result.name).toBe('测试项目')
    expect(result.data.warehouses).toEqual([])
  })

  it('preserves settings from backup', () => {
    const input = JSON.stringify({
      name: 'X',
      data: { settings: { ...validSettings, density: 10 }, warehouses: [] },
    })
    expect(importFromJson(input).data.settings.density).toBe(10)
  })
})

describe('importFromJson — bare data format', () => {
  it('parses { settings, warehouses } without name', () => {
    const input = JSON.stringify({ settings: validSettings, warehouses: [] })
    const result = importFromJson(input)
    expect(result.name).toBe('导入项目')
    expect(result.data.settings).toEqual(validSettings)
  })
})

describe('importFromJson — error cases', () => {
  it('throws on invalid JSON', () => {
    expect(() => importFromJson('{ broken')).toThrow('文件不是有效的 JSON 格式')
  })

  it('throws when warehouses field is missing', () => {
    const input = JSON.stringify({ settings: validSettings })
    expect(() => importFromJson(input)).toThrow()
  })

  it('throws when settings field is missing', () => {
    const input = JSON.stringify({ warehouses: [] })
    expect(() => importFromJson(input)).toThrow('数据缺少 settings 字段')
  })

  it('throws when top-level structure is unrecognised', () => {
    const input = JSON.stringify({ foo: 'bar' })
    expect(() => importFromJson(input)).toThrow()
  })

  it('throws when warehouses is not an array', () => {
    const input = JSON.stringify({ settings: validSettings, warehouses: {} })
    expect(() => importFromJson(input)).toThrow()
  })
})

// ── importFromExcel ────────────────────────────────────────────────────────

describe('importFromExcel — basic parsing', () => {
  it('parses single warehouse with stacks', () => {
    const rows = [
      ['仓库', '垛位', '点数', '投药量/g', '体积/m³', '总计/g'],
      ['A库', 'A-01', 3, '500.0', '100.00', ''],
      ['', 'A-02', 2, '300.0', '60.00', '800.0'],
    ]
    const result = importFromExcel(makeExcelBuffer(rows))
    expect(result.data.warehouses).toHaveLength(1)
    expect(result.data.warehouses[0].name).toBe('A库')
    expect(result.data.warehouses[0].zones[0].stacks).toHaveLength(2)
    expect(result.data.warehouses[0].zones[0].stacks[0].code).toBe('A-01')
    expect(result.data.warehouses[0].zones[0].stacks[1].code).toBe('A-02')
  })

  it('parses multiple warehouses', () => {
    const rows = [
      ['仓库', '垛位', '点数', '投药量/g', '体积/m³', '总计/g'],
      ['A库', 'A-01', 1, '100.0', '20.00', '100.0'],
      ['B库', 'B-01', 2, '200.0', '40.00', '200.0'],
    ]
    const result = importFromExcel(makeExcelBuffer(rows))
    expect(result.data.warehouses).toHaveLength(2)
    expect(result.data.warehouses[1].name).toBe('B库')
  })

  it('skips 总计 row', () => {
    const rows = [
      ['仓库', '垛位', '点数', '投药量/g', '体积/m³', '总计/g'],
      ['A库', 'A-01', 1, '100.0', '20.00', '100.0'],
      ['总计', '', 1, '100.0', '20.00', ''],
    ]
    const result = importFromExcel(makeExcelBuffer(rows))
    expect(result.data.warehouses).toHaveLength(1)
    expect(result.data.warehouses[0].zones[0].stacks).toHaveLength(1)
  })

  it('assigns stacks to correct warehouse', () => {
    const rows = [
      ['仓库', '垛位', '点数', '投药量/g', '体积/m³', '总计/g'],
      ['A库', 'A-01', 1, '', '', ''],
      ['', 'A-02', 1, '', '', ''],
      ['B库', 'B-01', 1, '', '', ''],
    ]
    const result = importFromExcel(makeExcelBuffer(rows))
    expect(result.data.warehouses[0].zones[0].stacks).toHaveLength(2)
    expect(result.data.warehouses[1].zones[0].stacks).toHaveLength(1)
  })

  it('returns default settings', () => {
    const rows = [
      ['仓库', '垛位'],
      ['A库', 'A-01'],
    ]
    const { data } = importFromExcel(makeExcelBuffer(rows))
    expect(data.settings.density).toBe(5)
    expect(data.settings.dosePerPoint).toBe(200)
  })
})

describe('importFromExcel — error cases', () => {
  it('throws on empty sheet (only header)', () => {
    const rows = [['仓库', '垛位']]
    expect(() => importFromExcel(makeExcelBuffer(rows))).toThrow()
  })

  it('throws when no warehouses parsed', () => {
    const rows = [
      ['仓库', '垛位'],
      ['总计', ''],
    ]
    expect(() => importFromExcel(makeExcelBuffer(rows))).toThrow('未能从 Excel 中解析出任何仓库数据')
  })
})
