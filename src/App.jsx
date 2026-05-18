import { useState, useEffect } from 'react'
import { useProjects } from './store/useProjects'
import { makeActions } from './store/useStore'
import GlobalSettings from './components/GlobalSettings'
import WarehouseList from './components/WarehouseList'
import StackDetail from './components/StackDetail'
import SummaryBar from './components/SummaryBar'
import SummaryModal from './components/SummaryModal'
import ProjectSwitcher from './components/ProjectSwitcher'
import { exportExcel } from './utils/exportExcel'
import { exportJson } from './utils/importData'
import './App.css'

export default function App() {
  const {
    projects, activeProject, activeId,
    storageError, dismissStorageError,
    switchProject, addProject, removeProject, renameProject,
    updateActiveData, importProject,
  } = useProjects()

  const [showSummary, setShowSummary] = useState(false)
  const [detailTarget, setDetailTarget] = useState(null)

  // H2: guard against null during state transition
  if (!activeProject) return null

  const { settings, warehouses } = activeProject.data
  const actions = makeActions(activeProject.data, updateActiveData)

  const detailStack = detailTarget
    ? warehouses
        .find(w => w.id === detailTarget.whId)
        ?.zones.find(z => z.id === detailTarget.zoneId)
        ?.stacks.find(s => s.id === detailTarget.stackId)
    : null

  const detailWh = detailTarget ? warehouses.find(w => w.id === detailTarget.whId) : null
  const detailZone = detailTarget ? detailWh?.zones.find(z => z.id === detailTarget.zoneId) : null

  // M2: auto-clear stale detailTarget when the referenced stack no longer exists
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (detailTarget && !detailStack) setDetailTarget(null)
  }, [detailTarget, detailStack])

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
          onExport={() => exportExcel(warehouses, settings)}
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

  return (
    <div className="app">
      {/* M1: localStorage quota error toast */}
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
        onExport={() => exportExcel(warehouses, settings)}
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
