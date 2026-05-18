import ZoneItem from './ZoneItem'
import { warehouseDose, warehousePoints, formatDose } from '../utils/calc'

export default function WarehouseItem({ warehouse, settings, actions, canRemove, onOpenStack }) {
  const { density, dosePerPoint, unit, warehouseColName } = settings
  const dose = warehouseDose(warehouse, density)
  const pts = warehousePoints(warehouse, density, dosePerPoint)
  const colName = warehouseColName || '仓库'

  return (
    <div className="warehouse-item" id={`wh-${warehouse.id}`}>
      <div className="warehouse-header">
        <div className="wh-title-row">
          <span className="wh-tag">{colName}</span>
          <input
            className="wh-name-input"
            type="text"
            value={warehouse.name}
            onChange={e => actions.updateWarehouse(warehouse.id, 'name', e.target.value)}
            placeholder="库名"
          />
        </div>
        <div className="wh-stats">
          <span className="accent">{formatDose(dose, unit)} {unit}</span>
          <span className="muted">{pts} 点</span>
        </div>
        {canRemove && (
          <button
            className="icon-btn danger"
            onClick={() => actions.removeWarehouse(warehouse.id)}
            title="删除仓库"
          >×</button>
        )}
      </div>

      <div className="zones-list">
        {warehouse.zones.map(zone => (
          <ZoneItem
            key={zone.id}
            zone={zone}
            whId={warehouse.id}
            settings={settings}
            actions={actions}
            canRemove={warehouse.zones.length > 1}
            onOpenStack={onOpenStack}
          />
        ))}
        <button
          className="add-row-btn wh-add-zone"
          onClick={() => actions.addZone(warehouse.id)}
        >
          + 添加区
        </button>
      </div>
    </div>
  )
}
