import { describe, it, expect } from 'vitest'
import {
  segmentVolume, stackVolume, stackDose, stackPoints,
  zoneVolume, zoneDose, zonePoints,
  warehouseVolume, warehouseDose, warehousePoints,
  totalVolume, totalDose, totalPoints,
  formatDose, formatVolume,
} from './calc.js'

// helpers
const seg = (l, w, h) => ({ length: l, width: w, height: h })
const stack = (...segs) => ({ segments: segs.map(([l, w, h]) => seg(l, w, h)) })
const zone = (...stacks) => ({ stacks })
const wh = (...zones) => ({ zones })

describe('segmentVolume', () => {
  it('calculates l * w * h', () => {
    expect(segmentVolume(seg(10, 5, 2))).toBe(100)
  })
  it('treats empty string as 0', () => {
    expect(segmentVolume(seg('', 5, 2))).toBe(0)
  })
  it('treats non-numeric string as 0', () => {
    expect(segmentVolume(seg('abc', 5, 2))).toBe(0)
  })
  it('returns 0 when any dimension is 0', () => {
    expect(segmentVolume(seg(0, 5, 2))).toBe(0)
  })
  it('handles decimal dimensions', () => {
    expect(segmentVolume(seg(2.5, 4, 2))).toBeCloseTo(20)
  })
})

describe('stackVolume', () => {
  it('sums all segment volumes', () => {
    const s = stack([10, 5, 2], [3, 3, 3])
    expect(stackVolume(s)).toBeCloseTo(127)
  })
  it('single segment', () => {
    expect(stackVolume(stack([2, 3, 4]))).toBe(24)
  })
  it('empty segments array gives 0', () => {
    expect(stackVolume({ segments: [] })).toBe(0)
  })
})

describe('stackDose', () => {
  it('volume * density', () => {
    const s = stack([10, 10, 1])  // 100 m³
    expect(stackDose(s, 5)).toBe(500)
  })
  it('density 0 gives dose 0', () => {
    expect(stackDose(stack([10, 10, 1]), 0)).toBe(0)
  })
})

describe('stackPoints', () => {
  it('ceiling division', () => {
    // 100m³ * 5 g/m³ = 500g, dosePerPoint=200 → ceil(2.5) = 3
    const s = stack([10, 10, 1])
    expect(stackPoints(s, 5, 200)).toBe(3)
  })
  it('exact division', () => {
    // 100m³ * 4 g/m³ = 400g, dosePerPoint=200 → 2
    expect(stackPoints(stack([10, 10, 1]), 4, 200)).toBe(2)
  })
  it('returns 0 when dosePerPoint is 0', () => {
    expect(stackPoints(stack([10, 10, 1]), 5, 0)).toBe(0)
  })
  it('returns 0 when dosePerPoint is negative', () => {
    expect(stackPoints(stack([10, 10, 1]), 5, -1)).toBe(0)
  })
  it('returns 0 for zero volume', () => {
    expect(stackPoints(stack([0, 10, 1]), 5, 200)).toBe(0)
  })
})

describe('zone aggregations', () => {
  const z = zone(stack([10, 5, 2]), stack([3, 3, 3]))  // 100 + 27 = 127 m³
  it('zoneVolume', () => expect(zoneVolume(z)).toBeCloseTo(127))
  it('zoneDose', () => expect(zoneDose(z, 5)).toBeCloseTo(635))
  it('zonePoints', () => expect(zonePoints(z, 5, 200)).toBe(4))  // ceil(635/200)=4
})

describe('warehouse aggregations', () => {
  const w = wh(
    zone(stack([10, 10, 1])),  // 100 m³
    zone(stack([5, 5, 1])),    // 25 m³
  )  // total 125 m³
  it('warehouseVolume', () => expect(warehouseVolume(w)).toBe(125))
  it('warehouseDose', () => expect(warehouseDose(w, 5)).toBe(625))
  it('warehousePoints', () => expect(warehousePoints(w, 5, 200)).toBe(4))  // ceil(625/200)=4
})

describe('total aggregations', () => {
  const warehouses = [
    wh(zone(stack([10, 10, 1]))),  // 100 m³
    wh(zone(stack([5, 5, 1]))),    // 25 m³
  ]
  it('totalVolume', () => expect(totalVolume(warehouses)).toBe(125))
  it('totalDose', () => expect(totalDose(warehouses, 4)).toBe(500))
  it('totalPoints', () => expect(totalPoints(warehouses, 4, 200)).toBe(3))  // ceil(500/200)=3
  it('empty warehouses gives 0', () => {
    expect(totalVolume([])).toBe(0)
    expect(totalDose([], 5)).toBe(0)
    expect(totalPoints([], 5, 200)).toBe(0)
  })
})

describe('formatDose', () => {
  it('g unit: 1 decimal place', () => expect(formatDose(1500, 'g')).toBe('1500.0'))
  it('g unit: zero', () => expect(formatDose(0, 'g')).toBe('0.0'))
  it('kg unit: divide by 1000 and 3 decimal places', () => expect(formatDose(1500, 'kg')).toBe('1.500'))
  it('kg unit: fractional grams', () => expect(formatDose(1234.5, 'kg')).toBe('1.234'))  // 1234.5/1000 = 1.2345 but float gives 1.2344999..., toFixed(3) → '1.234'
  it('kg unit: zero', () => expect(formatDose(0, 'kg')).toBe('0.000'))
})

describe('formatVolume', () => {
  it('2 decimal places', () => expect(formatVolume(12.3456)).toBe('12.35'))
  it('integer input', () => expect(formatVolume(100)).toBe('100.00'))
  it('zero', () => expect(formatVolume(0)).toBe('0.00'))
})
