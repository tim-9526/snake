import { segmentVolume, formatVolume } from '../utils/calc'

export default function SegmentRow({ seg, index, canRemove, onUpdate, onRemove }) {
  const vol = segmentVolume(seg)

  return (
    <div className="segment-card">
      <div className="segment-card-header">
        <span className="segment-index">第 {index + 1} 段</span>
        <span className="segment-vol-inline">= {formatVolume(vol)} m³</span>
        {canRemove && (
          <button className="icon-btn danger" onClick={onRemove} title="删除此段">×</button>
        )}
      </div>
      <div className="segment-fields-vertical">
        <label className="seg-field">
          <span className="label">长 (m)</span>
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={seg.length}
            onChange={e => onUpdate('length', e.target.value)}
            placeholder="0"
          />
        </label>
        <label className="seg-field">
          <span className="label">宽 (m)</span>
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={seg.width}
            onChange={e => onUpdate('width', e.target.value)}
            placeholder="0"
          />
        </label>
        <label className="seg-field">
          <span className="label">高 (m)</span>
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={seg.height}
            onChange={e => onUpdate('height', e.target.value)}
            placeholder="0"
          />
        </label>
      </div>
    </div>
  )
}
