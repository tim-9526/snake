export function segmentVolume(seg) {
  const l = parseFloat(seg.length) || 0
  const w = parseFloat(seg.width) || 0
  const h = parseFloat(seg.height) || 0
  return l * w * h
}

export function stackVolume(stack) {
  return stack.segments.reduce((sum, seg) => sum + segmentVolume(seg), 0)
}

export function stackDose(stack, density) {
  return stackVolume(stack) * density
}

export function stackPoints(stack, density, dosePerPoint) {
  if (dosePerPoint <= 0) return 0
  return Math.ceil(stackDose(stack, density) / dosePerPoint)
}

export function zoneVolume(zone) {
  return zone.stacks.reduce((sum, s) => sum + stackVolume(s), 0)
}

export function zoneDose(zone, density) {
  return zone.stacks.reduce((sum, s) => sum + stackDose(s, density), 0)
}

export function zonePoints(zone, density, dosePerPoint) {
  return zone.stacks.reduce((sum, s) => sum + stackPoints(s, density, dosePerPoint), 0)
}

export function warehouseVolume(wh) {
  return wh.zones.reduce((sum, z) => sum + zoneVolume(z), 0)
}

export function warehouseDose(wh, density) {
  return wh.zones.reduce((sum, z) => sum + zoneDose(z, density), 0)
}

export function warehousePoints(wh, density, dosePerPoint) {
  return wh.zones.reduce((sum, z) => sum + zonePoints(z, density, dosePerPoint), 0)
}

export function totalVolume(warehouses) {
  return warehouses.reduce((sum, wh) => sum + warehouseVolume(wh), 0)
}

export function totalDose(warehouses, density) {
  return warehouses.reduce((sum, wh) => sum + warehouseDose(wh, density), 0)
}

export function totalPoints(warehouses, density, dosePerPoint) {
  return warehouses.reduce((sum, wh) => sum + warehousePoints(wh, density, dosePerPoint), 0)
}

export function formatDose(grams, unit) {
  if (unit === 'kg') return (grams / 1000).toFixed(3)
  return grams.toFixed(1)
}

export function formatVolume(m3) {
  return m3.toFixed(2)
}
