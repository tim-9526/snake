import { produce } from 'immer'
import { uid } from '../utils/uid'

const defaultSegment = () => ({ id: uid(), length: '', width: '', height: '' })
const defaultStack = () => ({ id: uid(), code: '', segments: [defaultSegment()] })
const defaultZone = () => ({ id: uid(), name: '', stacks: [defaultStack()] })
const defaultWarehouse = () => ({ id: uid(), name: '', zones: [defaultZone()] })

export function makeActions(data, updateData) {
  const set = (updater) => updateData(d => produce(d, updater))

  return {
    setSetting: (key, value) =>
      set(draft => { draft.settings[key] = value }),

    addWarehouse: () =>
      set(draft => { draft.warehouses.push(defaultWarehouse()) }),
    removeWarehouse: (whId) =>
      set(draft => { draft.warehouses = draft.warehouses.filter(w => w.id !== whId) }),
    updateWarehouse: (whId, key, value) =>
      set(draft => {
        const wh = draft.warehouses.find(w => w.id === whId)
        if (wh) wh[key] = value
      }),

    addZone: (whId) =>
      set(draft => {
        const wh = draft.warehouses.find(w => w.id === whId)
        if (wh) wh.zones.push(defaultZone())
      }),
    removeZone: (whId, zoneId) =>
      set(draft => {
        const wh = draft.warehouses.find(w => w.id === whId)
        if (wh) wh.zones = wh.zones.filter(z => z.id !== zoneId)
      }),
    updateZone: (whId, zoneId, key, value) =>
      set(draft => {
        const zone = draft.warehouses.find(w => w.id === whId)?.zones.find(z => z.id === zoneId)
        if (zone) zone[key] = value
      }),

    addStack: (whId, zoneId) =>
      set(draft => {
        const zone = draft.warehouses.find(w => w.id === whId)?.zones.find(z => z.id === zoneId)
        if (zone) zone.stacks.push(defaultStack())
      }),
    removeStack: (whId, zoneId, stackId) =>
      set(draft => {
        const zone = draft.warehouses.find(w => w.id === whId)?.zones.find(z => z.id === zoneId)
        if (zone) zone.stacks = zone.stacks.filter(s => s.id !== stackId)
      }),
    updateStack: (whId, zoneId, stackId, key, value) =>
      set(draft => {
        const stack = draft.warehouses.find(w => w.id === whId)?.zones.find(z => z.id === zoneId)?.stacks.find(s => s.id === stackId)
        if (stack) stack[key] = value
      }),

    addSegment: (whId, zoneId, stackId) =>
      set(draft => {
        const stack = draft.warehouses.find(w => w.id === whId)?.zones.find(z => z.id === zoneId)?.stacks.find(s => s.id === stackId)
        if (stack) stack.segments.push(defaultSegment())
      }),
    removeSegment: (whId, zoneId, stackId, segId) =>
      set(draft => {
        const stack = draft.warehouses.find(w => w.id === whId)?.zones.find(z => z.id === zoneId)?.stacks.find(s => s.id === stackId)
        if (stack) stack.segments = stack.segments.filter(seg => seg.id !== segId)
      }),
    updateSegment: (whId, zoneId, stackId, segId, key, value) =>
      set(draft => {
        const seg = draft.warehouses.find(w => w.id === whId)?.zones.find(z => z.id === zoneId)?.stacks.find(s => s.id === stackId)?.segments.find(seg => seg.id === segId)
        if (seg) seg[key] = value
      }),
  }
}
