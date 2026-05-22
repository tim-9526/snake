import { useEffect, useRef, useState } from 'react'

export default function LabelModal({ initial, onConfirm, onClose }) {
  const [value, setValue] = useState(initial)
  const inputRef = useRef()

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 50) }, [])

  function handleKey(e) {
    if (e.key === 'Enter') onConfirm(value)
    if (e.key === 'Escape') onClose()
  }

  return (
    <div className="wm-modal-backdrop">
      <div className="wm-modal-box">
        <h3>编辑标签</h3>
        <input
          ref={inputRef}
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKey}
          placeholder="输入标签或编号"
          maxLength={20}
        />
        <div className="wm-modal-btns">
          <button onClick={onClose}>取消</button>
          <button className="primary" onClick={() => onConfirm(value)}>确定</button>
        </div>
      </div>
    </div>
  )
}
