import SegmentRow from './SegmentRow'
import { stackVolume, stackDose, stackPoints, formatDose, formatVolume } from '../utils/calc'

export default function StackDetail({ stack, warehouse, zone, settings, actions, whId, zoneId, onBack }) {
  const { density, dosePerPoint, unit } = settings
  const vol = stackVolume(stack)
  const dose = stackDose(stack, density)
  const pts = stackPoints(stack, density, dosePerPoint)

  return (
    <div className="detail-page">
      <div className="detail-header">
        <button className="back-btn" onClick={onBack}>
          <span className="back-arrow">‹</span> 返回
        </button>
        <div className="detail-crumb">
          {warehouse?.name || '库'} / {zone?.name || '区'}
        </div>
      </div>

      <div className="detail-hero">
        <div className="detail-code-row">
          <input
            className="detail-code-input"
            type="text"
            value={stack.code}
            onChange={e => actions.updateStack(whId, zoneId, stack.id, 'code', e.target.value)}
            placeholder="垛位编号"
          />
        </div>
        <div className="detail-stats-row">
          <div className="detail-stat">
            <span className="detail-stat-val">{formatVolume(vol)}</span>
            <span className="detail-stat-unit">m³</span>
          </div>
          <div className="detail-stat accent">
            <span className="detail-stat-val">{formatDose(dose, unit)}</span>
            <span className="detail-stat-unit">{unit}</span>
          </div>
          <div className="detail-stat accent">
            <span className="detail-stat-val">{pts}</span>
            <span className="detail-stat-unit">点</span>
          </div>
        </div>
      </div>

      <div className="detail-segments">
        {stack.segments.map((seg, i) => (
          <SegmentRow
            key={seg.id}
            seg={seg}
            index={i}
            canRemove={stack.segments.length > 1}
            onUpdate={(key, val) => actions.updateSegment(whId, zoneId, stack.id, seg.id, key, val)}
            onRemove={() => actions.removeSegment(whId, zoneId, stack.id, seg.id)}
          />
        ))}
        <button
          className="add-seg-btn"
          onClick={() => actions.addSegment(whId, zoneId, stack.id)}
        >
          + 添加分段
        </button>
      </div>
    </div>
  )
}
