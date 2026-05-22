export function autoGenerate({ cols, rows, slotW, slotH, aisleN, aislePos, totalDose, slotCap, portN, startLabel }) {
  const aisleW = 40, pad = 20, portR = 14
  const needSlots = Math.ceil(totalDose / slotCap)

  const aisleColSet = new Set()
  for (let i = 0; i < aisleN; i++) {
    aisleColSet.add(Math.min(aislePos + i * Math.floor(cols / (aisleN + 1)), cols - 1))
  }

  let totalW = pad
  const colX = []
  for (let c = 0; c < cols; c++) {
    colX.push(totalW); totalW += slotW
    if (aisleColSet.has(c)) totalW += aisleW
  }
  totalW += pad
  const totalH = pad + rows * slotH + pad

  const W = Math.min(totalW, 660), H = Math.min(totalH, 460)
  const sx = W / totalW, sy = H / totalH

  const shapes = []

  shapes.push({
    type: 'area', status: 'empty', label: '仓库',
    x: Math.round(pad * sx), y: Math.round(pad * sy),
    w: Math.round((totalW - 2 * pad) * sx), h: Math.round((totalH - 2 * pad) * sy),
  })

  for (const ac of aisleColSet) {
    shapes.push({
      type: 'aisle', status: 'empty', label: '通道',
      x: Math.round((colX[ac] + slotW) * sx), y: Math.round(pad * sy),
      w: Math.round(aisleW * sx), h: Math.round(rows * slotH * sy),
    })
  }

  let slotCount = 0
  const charCode = startLabel.charCodeAt(0) - 65
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const col = Math.floor(slotCount / 26)
      const prefix = String.fromCharCode(65 + charCode + col)
      const lbl = prefix + '-' + String(slotCount + 1).padStart(2, '0')
      shapes.push({
        type: 'slot', status: slotCount < needSlots ? 'occupied' : 'empty', label: lbl,
        x: Math.round(colX[c] * sx), y: Math.round((pad + r * slotH) * sy),
        w: Math.round(slotW * sx), h: Math.round(slotH * sy),
      })
      slotCount++
    }
  }

  const aisleArr = [...aisleColSet]
  for (let i = 0; i < portN; i++) {
    const aIdx = i % Math.max(aisleArr.length, 1)
    const ac = aisleArr[aIdx] ?? 0
    const ax = (colX[ac] + slotW) + aisleW / 2
    const ay = pad + (Math.floor(i / Math.max(aisleArr.length, 1)) * Math.floor(rows / Math.ceil(portN / Math.max(aisleArr.length, 1)))) * slotH
    shapes.push({
      type: 'port', status: 'empty', label: 'P' + (i + 1),
      dose: Math.round(totalDose / portN),
      x: Math.round((ax - portR) * sx), y: Math.round(ay * sy),
      w: Math.round(portR * 2 * sx), h: Math.round(portR * 2 * sy),
    })
  }

  return { shapes, slotCount, needSlots }
}
