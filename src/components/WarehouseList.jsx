import WarehouseItem from './WarehouseItem'

export default function WarehouseList({ warehouses, settings, actions, onOpenStack }) {
  return (
    <div className="warehouse-list">
      {warehouses.map(wh => (
        <WarehouseItem
          key={wh.id}
          warehouse={wh}
          settings={settings}
          actions={actions}
          canRemove={warehouses.length > 1}
          onOpenStack={onOpenStack}
        />
      ))}
      <button className="add-wh-btn" onClick={actions.addWarehouse}>
        + 添加库
      </button>
    </div>
  )
}
