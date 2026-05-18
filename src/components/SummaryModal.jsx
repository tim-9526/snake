import { useEffect } from 'react'
import {
  warehouseVolume, warehouseDose, warehousePoints,
  zoneVolume, zoneDose, zonePoints,
  stackVolume, stackDose, stackPoints,
  totalVolume, totalDose, totalPoints,
  formatVolume, formatDose,
} from '../utils/calc'

export default function SummaryModal({ warehouses, settings, onClose }) {
  const { density, dosePerPoint, unit } = settings

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const tVol = totalVolume(warehouses)
  const tDose = totalDose(warehouses, density)
  const tPts = totalPoints(warehouses, density, dosePerPoint)

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">汇总总览</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {/* 总计行 */}
          <div className="summary-total-row">
            <span className="summary-total-label label">全部合计</span>
            <div className="summary-total-stats">
              <div className="stotal-item">
                <span className="label">总体积</span>
                <span className="num stotal-val">{formatVolume(tVol)} m³</span>
              </div>
              <div className="stotal-item">
                <span className="label">总投药量</span>
                <span className="num stotal-val accent">{formatDose(tDose, unit)} {unit}</span>
              </div>
              <div className="stotal-item">
                <span className="label">总投药点数</span>
                <span className="num stotal-val accent">{tPts} 点</span>
              </div>
            </div>
          </div>

          {/* 树形明细 */}
          <div className="tree-table">
            <div className="tree-header">
              <span>层级 / 名称</span>
              <span>体积 (m³)</span>
              <span>投药量 ({unit})</span>
              <span>投药点数</span>
            </div>

            {warehouses.map(wh => {
              const wVol = warehouseVolume(wh)
              const wDose = warehouseDose(wh, density)
              const wPts = warehousePoints(wh, density, dosePerPoint)
              return (
                <div key={wh.id} className="tree-wh-group">
                  {/* 库行 */}
                  <div className="tree-row tree-row--wh">
                    <span className="tree-name">
                      <span className="tree-badge wh-badge">库</span>
                      {wh.name || '(未命名)'}
                    </span>
                    <span className="num">{formatVolume(wVol)}</span>
                    <span className="num accent">{formatDose(wDose, unit)}</span>
                    <span className="num accent">{wPts}</span>
                  </div>

                  {wh.zones.map(zone => {
                    const zVol = zoneVolume(zone)
                    const zDose = zoneDose(zone, density)
                    const zPts = zonePoints(zone, density, dosePerPoint)
                    return (
                      <div key={zone.id} className="tree-zone-group">
                        {/* 区行 */}
                        <div className="tree-row tree-row--zone">
                          <span className="tree-name tree-indent-1">
                            <span className="tree-badge zone-badge">区</span>
                            {zone.name || '(未命名)'}
                          </span>
                          <span className="num">{formatVolume(zVol)}</span>
                          <span className="num accent">{formatDose(zDose, unit)}</span>
                          <span className="num accent">{zPts}</span>
                        </div>

                        {zone.stacks.map(stack => {
                          const sVol = stackVolume(stack)
                          const sDose = stackDose(stack, density)
                          const sPts = stackPoints(stack, density, dosePerPoint)
                          return (
                            <div key={stack.id} className="tree-row tree-row--stack">
                              <span className="tree-name tree-indent-2">
                                <span className="tree-badge stack-badge">垛</span>
                                {stack.code || '(未编号)'}
                              </span>
                              <span className="num">{formatVolume(sVol)}</span>
                              <span className="num">{formatDose(sDose, unit)}</span>
                              <span className="num">{sPts}</span>
                            </div>
                          )
                        })}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
