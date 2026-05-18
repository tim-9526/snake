import { useState } from 'react'
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
    switchProject, addProject, removeProject, renameProject,
    updateActiveData, importProject,
  } = useProjects()

  const [showSummary, setShowSummary] = useState(false)
  // { whId, zoneId, stackId } | null
  const [detailTarget, setDetailTarget] = useState(null)

  const { settings, warehouses } = activeProject.data
  const actions = makeActions(activeProject.data, updateActiveData)

  // resolve stack object for detail view
  const detailStack = detailTarget
    ? warehouses
        .find(w => w.id === detailTarget.whId)
        ?.zones.find(z => z.id === detailTarget.zoneId)
        ?.stacks.find(s => s.id === detailTarget.stackId)
    : null

  const detailWh = detailTarget
    ? warehouses.find(w => w.id === detailTarget.whId)
    : null

  const detailZone = detailTarget
    ? detailWh?.zones.find(z => z.id === detailTarget.zoneId)
    : null

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
