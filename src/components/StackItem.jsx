import { stackVolume, stackDose, stackPoints, formatDose, formatVolume } from '../utils/calc'

export default function StackItem({ stack, whId, zoneId, settings, actions, canRemove, onOpen }) {
  const { density, dosePerPoint, unit } = settings
  const vol = stackVolume(stack)
  const dose = stackDose(stack, density)
  const pts = stackPoints(stack, density, dosePerPoint)

  const segSummary = stack.segments
    .map(s => `${s.length || 0}×${s.width || 0}×${s.height || 0}`)
    .join('  +  ')

  return (
    <div className="stack-item" onClick={() => onOpen(whId, zoneId, stack.id)}>
      <div className="stack-item-left">
        <span className="stack-code">{stack.code || '未编号'}</span>
        <span className="stack-seg-summary">{segSummary} = {formatVolume(vol)} m³</span>
      </div>
      <div className="stack-item-right">
        <span className="stack-dose accent">{formatDose(dose, unit)} {unit}</span>
        <span className="stack-pts accent">{pts} 点</span>
      </div>
      {canRemove && (
        <button
          className="stack-remove-btn"
          onClick={e => { e.stopPropagation(); actions.removeStack(whId, zoneId, stack.id) }}
          title="删除垛位"
        >×</button>
      )}
    </div>
  )
}
