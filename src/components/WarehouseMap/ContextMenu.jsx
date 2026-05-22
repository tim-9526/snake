import { useEffect, useRef } from 'react'

export default function ContextMenu({ x, y, onAction, onClose }) {
  const ref = useRef()

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  return (
    <div ref={ref} className="wm-ctx-menu" style={{ left: x, top: y }}>
      <div onClick={() => onAction('label')}>编辑标签</div>
      <div className="wm-ctx-sep" />
      <div onClick={() => onAction('empty')}>空置</div>
      <div onClick={() => onAction('occupied')}>占用</div>
      <div onClick={() => onAction('reserved')}>预留</div>
      <div onClick={() => onAction('damaged')}>损坏</div>
      <div className="wm-ctx-sep" />
      <div className="danger" onClick={() => onAction('delete')}>删除</div>
    </div>
  )
}
