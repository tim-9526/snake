import { useState, useEffect } from 'react'
import { useProjects } from './store/useProjects'
import { makeActions } from './store/useStore'
import GlobalSettings from './components/GlobalSettings'
import WarehouseList from './components/WarehouseList'
import StackDetail from './components/StackDetail'
import SummaryBar from './components/SummaryBar'
import SummaryModal from './components/SummaryModal'
import ProjectSwitcher from './components/ProjectSwitcher'
import FilePrompt from './components/FilePrompt'
import { exportExcel } from './utils/exportExcel'
import { exportJson } from './utils/importData'
import './App.css'

export default function App() {
  const {
    projects, activeProject, activeId,
    fileStatus, fileName,
    storageError, dismissStorageError,
    selectFile, createFile, resumeFile,
    switchProject, addProject, removeProject, renameProject,
    updateActiveData, importProject,
  } = useProjects()

  const [showSummary, setShowSummary] = useState(false)
  const [detailTarget, setDetailTarget] = useState(null)

  // Derive these safely even when activeProject is null
  const warehouses = activeProject?.data.warehouses ?? []
  const settings = activeProject?.data.settings ?? {}
  const actions = activeProject ? makeActions(activeProject.data, updateActiveData) : null

  const detailStack = detailTarget
    ? warehouses
        .find(w => w.id === detailTarget.whId)
        ?.zones.find(z => z.id === detailTarget.zoneId)
        ?.stacks.find(s => s.id === detailTarget.stackId) ?? null
    : null

  const detailWh = detailTarget ? warehouses.find(w => w.id === detailTarget.whId) ?? null : null
  const detailZone = detailTarget ? detailWh?.zones.find(z => z.id === detailTarget.zoneId) ?? null : null

  // M2: auto-clear stale detailTarget — must be before any early return
  useEffect(() => {
    if (detailTarget && !detailStack) setDetailTarget(null)
  }, [detailTarget, detailStack])

  // ── Guard renders ──────────────────────────────────────────────────────────

  if (fileStatus === 'init') {
    return <div className="auth-loading"><span className="auth-loading-dot" /></div>
  }

  if (fileStatus !== 'ready') {
    return (
      <FilePrompt
        status={fileStatus}
        fileName={fileName}
        onSelect={selectFile}
        onCreate={createFile}
        onResume={resumeFile}
      />
    )
  }

  // H2: guard against null during state transition
  if (!activeProject) return null

  // ── Detail view ────────────────────────────────────────────────────────────

  if (detailTarget && detailStack) {
    return (
      <div className="app">
        <StackDetail
          stack={detailStack}
          warehouse={detailWh}
          zone={detailZone}
          settings={settings}
          actions={actions}
          whId={detailTarget.whId}
          zoneId={detailTarget.zoneId}
          onBack={() => setDetailTarget(null)}
        />
        <SummaryBar
          warehouses={warehouses}
          settings={settings}
          onExport={() => exportExcel(warehouses, settings).catch(() => {})}
          onShowSummary={() => setShowSummary(true)}
        />
        {showSummary && (
          <SummaryModal
            warehouses={warehouses}
            settings={settings}
            onClose={() => setShowSummary(false)}
          />
        )}
      </div>
    )
  }

  // ── Main view ──────────────────────────────────────────────────────────────

  return (
    <div className="app">
      {storageError && (
        <div className="storage-error-toast" role="alert">
          <span>{storageError}</span>
          <button onClick={dismissStorageError}>×</button>
        </div>
      )}

      <header className="app-header">
        <div className="header-inner">
          <div className="app-title">
            <span className="title-mark">▊</span>
            <h1>投药量计算工具</h1>
          </div>
          <div className="header-right">
            <button className="file-name-chip" onClick={selectFile} title="更换数据文件">
              <span className="file-name-icon">💾</span>
              <span className="file-name-text">{fileName}</span>
            </button>
            <ProjectSwitcher
              projects={projects}
              activeId={activeId}
              onSwitch={switchProject}
              onAdd={addProject}
              onRemove={removeProject}
              onRename={renameProject}
              onImport={importProject}
              onExportJson={() => exportJson(activeProject)}
            />
          </div>
        </div>
      </header>

      <main className="app-main">
        <GlobalSettings settings={settings} onSet={actions.setSetting} />
        <WarehouseList
          warehouses={warehouses}
          settings={settings}
          actions={actions}
          onOpenStack={(whId, zoneId, stackId) =>
            setDetailTarget({ whId, zoneId, stackId })
          }
        />
      </main>

      <SummaryBar
        warehouses={warehouses}
        settings={settings}
        onExport={() => exportExcel(warehouses, settings).catch(() => {})}
        onShowSummary={() => setShowSummary(true)}
      />

      {showSummary && (
        <SummaryModal
          warehouses={warehouses}
          settings={settings}
          onClose={() => setShowSummary(false)}
        />
      )}
    </div>
  )
}
