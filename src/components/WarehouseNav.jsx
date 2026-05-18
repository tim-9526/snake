export default function WarehouseNav({ warehouses, colName }) {
  const scrollTo = (id) => {
    const el = document.getElementById(`wh-${id}`)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="wh-nav">
      <span className="label wh-nav-label">快速跳转</span>
      <div className="wh-nav-list">
        {warehouses.map((wh, i) => (
          <button
            key={wh.id}
            className="wh-nav-btn"
            onClick={() => scrollTo(wh.id)}
            title={wh.name || `${colName || '库'}${i + 1}`}
          >
            {wh.name || `${colName || '库'}${i + 1}`}
          </button>
        ))}
      </div>
    </div>
  )
}
