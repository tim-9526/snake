import { uid } from '../utils/uid'

const defaultSegment = () => ({ id: uid(), length: '', width: '', height: '' })
const defaultStack = () => ({ id: uid(), code: '', segments: [defaultSegment()] })
const defaultZone = () => ({ id: uid(), name: '', stacks: [defaultStack()] })
const defaultWarehouse = () => ({ id: uid(), name: '', zones: [defaultZone()] })

function update(data, updater) {
  return updater(data)
}

export function makeActions(data, updateData) {
  const set = (updater) => updateData(d => updater(d))

  return {
    setSetting: (key, value) =>
      set(d => ({ ...d, settings: { ...d.settings, [key]: value } })),

    addWarehouse: () =>
      set(d => ({ ...d, warehouses: [...d.warehouses, defaultWarehouse()] })),
    removeWarehouse: (whId) =>
      set(d => ({ ...d, warehouses: d.warehouses.filter(w => w.id !== whId) })),
    updateWarehouse: (whId, key, value) =>
      set(d => ({ ...d, warehouses: d.warehouses.map(w => w.id === whId ? { ...w, [key]: value } : w) })),

    addZone: (whId) =>
      set(d => ({ ...d, warehouses: d.warehouses.map(w => w.id === whId ? { ...w, zones: [...w.zones, defaultZone()] } : w) })),
    removeZone: (whId, zoneId) =>
      set(d => ({ ...d, warehouses: d.warehouses.map(w => w.id === whId ? { ...w, zones: w.zones.filter(z => z.id !== zoneId) } : w) })),
    updateZone: (whId, zoneId, key, value) =>
      set(d => ({ ...d, warehouses: d.warehouses.map(w => w.id === whId ? { ...w, zones: w.zones.map(z => z.id === zoneId ? { ...z, [key]: value } : z) } : w) })),

    addStack: (whId, zoneId) =>
      set(d => ({ ...d, warehouses: d.warehouses.map(w => w.id === whId ? { ...w, zones: w.zones.map(z => z.id === zoneId ? { ...z, stacks: [...z.stacks, defaultStack()] } : z) } : w) })),
    removeStack: (whId, zoneId, stackId) =>
      set(d => ({ ...d, warehouses: d.warehouses.map(w => w.id === whId ? { ...w, zones: w.zones.map(z => z.id === zoneId ? { ...z, stacks: z.stacks.filter(s => s.id !== stackId) } : z) } : w) })),
    updateStack: (whId, zoneId, stackId, key, value) =>
      set(d => ({ ...d, warehouses: d.warehouses.map(w => w.id === whId ? { ...w, zones: w.zones.map(z => z.id === zoneId ? { ...z, stacks: z.stacks.map(s => s.id === stackId ? { ...s, [key]: value } : s) } : z) } : w) })),

    addSegment: (whId, zoneId, stackId) =>
      set(d => ({ ...d, warehouses: d.warehouses.map(w => w.id === whId ? { ...w, zones: w.zones.map(z => z.id === zoneId ? { ...z, stacks: z.stacks.map(s => s.id === stackId ? { ...s, segments: [...s.segments, defaultSegment()] } : s) } : z) } : w) })),
    removeSegment: (whId, zoneId, stackId, segId) =>
      set(d => ({ ...d, warehouses: d.warehouses.map(w => w.id === whId ? { ...w, zones: w.zones.map(z => z.id === zoneId ? { ...z, stacks: z.stacks.map(s => s.id === stackId ? { ...s, segments: s.segments.filter(seg => seg.id !== segId) } : s) } : z) } : w) })),
    updateSegment: (whId, zoneId, stackId, segId, key, value) =>
      set(d => ({ ...d, warehouses: d.warehouses.map(w => w.id === whId ? { ...w, zones: w.zones.map(z => z.id === zoneId ? { ...z, stacks: z.stacks.map(s => s.id === stackId ? { ...s, segments: s.segments.map(seg => seg.id === segId ? { ...seg, [key]: value } : seg) } : s) } : z) } : w) })),
  }
}
