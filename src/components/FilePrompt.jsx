export default function FilePrompt({ status, fileName, onSelect, onCreate, onResume }) {
  if (status === 'not-supported') {
    return (
      <div className="gate-backdrop">
        <div className="gate-panel">
          <div className="gate-icon">▊</div>
          <h1 className="gate-title">投药量计算工具</h1>
          <p className="gate-subtitle">当前浏览器不支持文件 API</p>
          <p className="gate-hint">请使用 Chrome、Edge 或 Safari 浏览器</p>
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

  if (status === 'ls-no-file') {
    return (
      <div className="gate-backdrop">
        <div className="gate-panel">
          <div className="gate-icon">▊</div>
          <h1 className="gate-title">投药量计算工具</h1>
          <p className="gate-subtitle">数据保存在本地浏览器中</p>
          <p className="gate-hint">新建项目即可开始使用，或从文件导入已有数据</p>
          <button className="gate-btn" onClick={onCreate}>新建数据</button>
          <button className="gate-btn gate-btn-ghost" onClick={onSelect}>从文件导入</button>
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
