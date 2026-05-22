import { useState } from 'react'

export default function IoPanel({ shapes, onImport }) {
  const [importText, setImportText] = useState('')
  const [importMsg, setImportMsg] = useState('')
  const [exportText, setExportText] = useState('')
  const [exportMsg, setExportMsg] = useState('')

  function doExport() {
    const data = JSON.stringify({ version: 2, shapes }, null, 2)
    setExportText(data)
    navigator.clipboard.writeText(data)
      .then(() => setExportMsg('✓ 已复制到剪贴板'))
      .catch(() => setExportMsg('请手动复制上方内容'))
  }

  function doImport() {
    try {
      const obj = JSON.parse(importText.trim())
      const arr = Array.isArray(obj) ? obj : (obj.shapes || [])
      if (!arr.length) throw new Error('未找到 shapes 数组')
      onImport(arr)
      setImportMsg(`✓ 导入成功，共 ${arr.length} 个元素`)
    } catch (e) {
      setImportMsg('✗ 解析失败：' + e.message)
    }
  }

  return (
    <div className="wm-io-panel">
      <div className="wm-io-grid">
        <div className="wm-io-card">
          <h4>导入 JSON</h4>
          <textarea
            value={importText}
            onChange={e => setImportText(e.target.value)}
            placeholder="粘贴 JSON 数据..."
          />
          <button onClick={doImport}>✓ 确认导入</button>
          {importMsg && <p className="wm-io-msg">{importMsg}</p>}
        </div>
        <div className="wm-io-card">
          <h4>导出 JSON</h4>
          <textarea value={exportText} readOnly placeholder="点击下方按钮生成..." />
          <button onClick={doExport}>复制到剪贴板</button>
          {exportMsg && <p className="wm-io-msg">{exportMsg}</p>}
        </div>
      </div>

      <div className="wm-io-schema">
        <div className="wm-section-title">JSON 结构说明</div>
        <pre>{`{
  "version": 2,
  "shapes": [
    {
      "type": "slot|shelf|area|aisle|port",
      "x": 40, "y": 40, "w": 60, "h": 60,
      "status": "empty|occupied|reserved|damaged",
      "label": "A-01",
      "dose": 20   // 仅 port 类型（投药量 kg）
    }
  ]
}`}</pre>
      </div>
    </div>
  )
}
