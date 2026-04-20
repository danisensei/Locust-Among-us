import { useState } from 'react'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import SwarmMap from './pages/SwarmMap'
import AIPrediction from './pages/AIPrediction'
import DroneOps from './pages/DroneOps'
import FieldReports from './pages/FieldReports'
import Alerts from './pages/Alerts'
import Users from './pages/Users'

function App() {
  const [activeSection, setActiveSection] = useState('dashboard')

  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard />
      case 'map':
        return <SwarmMap />
      case 'ai':
        return <AIPrediction />
      case 'drones':
        return <DroneOps />
      case 'reports':
        return <FieldReports />
      case 'alerts':
        return <Alerts />
      case 'users':
        return <Users />
      default:
        return <Dashboard />
    }
  }

  return (
    <div className="flex flex-col w-full h-screen bg-[#060910] text-[#e2e8f0]">
      <Header />
      <div className="flex flex-1 overflow-hidden min-h-0 w-full relative z-1">
        <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} />
        <main className="flex-1 overflow-y-auto px-6 py-5">
          <div className="w-full animate-fade-in">
            {renderSection()}
          </div>
        </main>
      </div>
    </div>
  )
}

export default App
