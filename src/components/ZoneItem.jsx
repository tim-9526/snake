import StackItem from './StackItem'
import { zoneVolume, zoneDose, zonePoints, formatDose, formatVolume } from '../utils/calc'

export default function ZoneItem({ zone, whId, settings, actions, canRemove, onOpenStack }) {
  const { density, dosePerPoint, unit } = settings
  const dose = zoneDose(zone, density)
  const pts = zonePoints(zone, density, dosePerPoint)

  return (
    <div className="zone-item">
      <div className="zone-header">
        <div className="zone-title-row">
          <span className="zone-tag">区</span>
          <input
            className="zone-name-input"
            type="text"
            value={zone.name}
            onChange={e => actions.updateZone(whId, zone.id, 'name', e.target.value)}
            placeholder="区名"
            onClick={e => e.stopPropagation()}
          />
        </div>
        <div className="zone-stats">
          <span className="accent">{formatDose(dose, unit)} {unit}</span>
          <span className="muted">{pts} 点</span>
        </div>
        {canRemove && (
          <button
            className="icon-btn danger"
            onClick={() => actions.removeZone(whId, zone.id)}
            title="删除区"
          >×</button>
        )}
      </div>

      <div className="stacks-list">
        {zone.stacks.map(stack => (
          <StackItem
            key={stack.id}
            stack={stack}
            whId={whId}
            zoneId={zone.id}
            settings={settings}
            actions={actions}
            canRemove={zone.stacks.length > 1}
            onOpen={onOpenStack}
          />
        ))}
        <button className="add-row-btn" onClick={() => actions.addStack(whId, zone.id)}>
          + 添加垛位
        </button>
      </div>
    </div>
  )
}
