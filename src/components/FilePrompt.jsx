export default function FilePrompt({ status, fileName, onSelect, onCreate, onResume }) {
  if (status === 'not-supported') {
    return (
      <div className="gate-backdrop">
        <div className="gate-panel">
          <div className="gate-icon">▊</div>
          <h1 className="gate-title">投药量计算工具</h1>
          <p className="gate-subtitle">请使用 Chrome 或 Edge 浏览器打开本工具</p>
        </div>
      </div>
    )
  }

  if (status === 'permission-needed') {
    return (
      <div className="gate-backdrop">
        <div className="gate-panel">
          <div className="gate-icon">▊</div>
          <h1 className="gate-title">投药量计算工具</h1>
          <p className="gate-subtitle file-prompt-hint">上次使用的文件</p>
          <p className="file-prompt-name">{fileName}</p>
          <button className="gate-btn" onClick={onResume}>继续使用此文件</button>
          <button className="gate-btn gate-btn-ghost" onClick={onSelect}>打开其他文件</button>
        </div>
      </div>
    )
  }

  return (
    <div className="gate-backdrop">
      <div className="gate-panel">
        <div className="gate-icon">▊</div>
        <h1 className="gate-title">投药量计算工具</h1>
        <p className="gate-subtitle">数据保存在本地文件，请选择或新建</p>
        <button className="gate-btn" onClick={onCreate}>新建数据文件</button>
        <button className="gate-btn gate-btn-ghost" onClick={onSelect}>打开已有文件</button>
      </div>
    </div>
  )
}
