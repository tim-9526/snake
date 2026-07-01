import { totalVolume, totalDose, totalPoints, formatDose, formatVolume } from '../utils/calc'

export default function SummaryBar({ warehouses, settings, onExport, onShowSummary, exporting }) {
  const { density, dosePerPoint, unit } = settings
  const vol = totalVolume(warehouses)
  const dose = totalDose(warehouses, density)
  const pts = totalPoints(warehouses, density, dosePerPoint)

  return (
    <div className="summary-bar">
      <div className="summary-nums">
        <div className="summary-num-item">
          <span className="summary-big accent">{pts}</span>
          <span className="summary-unit">点</span>
        </div>
        <div className="summary-divider" />
        <div className="summary-num-item">
          <span className="summary-big accent">{formatDose(dose, unit)}</span>
          <span className="summary-unit">{unit}</span>
        </div>
        <div className="summary-divider" />
        <div className="summary-num-item">
          <span className="summary-mid">{formatVolume(vol)}</span>
          <span className="summary-unit">m³</span>
        </div>
      </div>
      <div className="summary-actions">
        <button className="summary-ghost-btn" onClick={onShowSummary}>汇总</button>
        <button className="summary-export-btn" onClick={onExport} disabled={exporting}>
          {exporting ? '导出中…' : '导出 Excel'}
        </button>
      </div>
    </div>
  )
}
