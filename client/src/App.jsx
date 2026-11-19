import { useState } from 'react'
import { Link, Route, Routes, useLocation } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import WearableFeedProvider from './components/WearableFeedProvider'
import WorkspaceProvider from './components/WorkspaceProvider'
import NotificationsProvider from './components/NotificationsProvider'
import { Page } from './components/WorkspaceUI'
import Dashboard from './pages/Dashboard'
import AIChatbot from './pages/AIChatbot'
import DigitalTwinPage from './pages/DigitalTwinPage'
import HealthRecords from './pages/HealthRecords'
import Medications from './pages/Medications'
import Appointments from './pages/Appointments'
import Settings from './pages/Settings'
import Help from './pages/Help'
import { Devices, Recommendations, Reports, RiskAnalysis, SimulatorPage } from './pages/WearablePages'
import { useWorkspaceData } from './lib/useWorkspaceData'

function WorkspaceShell() {
  const { storageError } = useWorkspaceData()
  const { key } = useLocation()
  const [openFor, setOpenFor] = useState(null)
  const menuOpen = openFor === key
  const closeMenu = () => setOpenFor(null)

  return (
    <div className="flex h-dvh overflow-hidden bg-bg-main text-text-primary">
      <Sidebar open={menuOpen} onNavigate={closeMenu} />
      {menuOpen && <button aria-label="Close navigation overlay" type="button" onClick={closeMenu} className="fixed inset-x-0 bottom-0 top-16 z-40 bg-black/55 lg:hidden" />}
      <div className="flex min-w-0 flex-1 flex-col">
        <Header menuOpen={menuOpen} toggleMenu={() => setOpenFor(menuOpen ? null : key)} />
        {storageError && <p role="status" className="bg-danger/10 px-4 py-2 text-xs">Browser storage is unavailable. Changes may disappear after reload.</p>}
        <main className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-5 lg:p-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/medivox" element={<AIChatbot />} />
            <Route path="/digital-twin" element={<DigitalTwinPage />} />
            <Route path="/records" element={<HealthRecords />} />
            <Route path="/risk" element={<RiskAnalysis />} />
            <Route path="/simulator" element={<SimulatorPage />} />
            <Route path="/recommendations" element={<Recommendations />} />
            <Route path="/medications" element={<Medications />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/appointments" element={<Appointments />} />
            <Route path="/devices" element={<Devices />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/help" element={<Help />} />
            <Route path="*" element={<Page title="Page not found" description="Check the address or return to your dashboard." action={<Link className="workspace-button" to="/">Open Dashboard</Link>} />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return <WorkspaceProvider><WearableFeedProvider><NotificationsProvider><WorkspaceShell /></NotificationsProvider></WearableFeedProvider></WorkspaceProvider>
}
