import { useState, useEffect } from 'react'
import Dashboard from './pages/Dashboard'
import SwarmMap from './pages/SwarmMap'
import AIPrediction from './pages/AIPrediction'
import DroneOps from './pages/DroneOps'
import FieldReports from './pages/FieldReports'
import Alerts from './pages/Alerts'
import Users from './pages/Users'

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard')

  useEffect(() => {
    document.documentElement.classList.add('dark')
  }, [])

  const pages = [
    { id: 'dashboard', label: 'Dashboard', emoji: '📊' },
    { id: 'map', label: 'Swarm Map', emoji: '🗺️' },
    { id: 'ai', label: 'AI Prediction', emoji: '🤖' },
    { id: 'drones', label: 'Drone Ops', emoji: '🛸' },
    { id: 'reports', label: 'Field Reports', emoji: '📋' },
    { id: 'alerts', label: 'Alerts', emoji: '🔔' },
    { id: 'users', label: 'Users', emoji: '👥' },
  ]

  const renderPage = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />
      case 'map': return <SwarmMap />
      case 'ai': return <AIPrediction />
      case 'drones': return <DroneOps />
      case 'reports': return <FieldReports />
      case 'alerts': return <Alerts />
      case 'users': return <Users />
      default: return <Dashboard />
    }
  }

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', backgroundColor: 'hsl(var(--background))', color: 'hsl(var(--foreground))' }}>
      {/* Sidebar */}
      <div style={{
        width: '16rem',
        backgroundColor: 'hsl(var(--background))',
        borderRight: '1px solid hsl(var(--border))',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ padding: '1rem', borderBottom: '1px solid hsl(var(--border))' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.125rem', fontWeight: 600 }}>
            <span style={{ fontSize: '1.5rem' }}>🦗</span>
            <span>LC-EWS</span>
          </div>
        </div>
        <nav style={{ padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1, overflowY: 'auto' }}>
          {pages.map((page) => (
            <button
              key={page.id}
              onClick={() => setActiveTab(page.id)}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                border: 'none',
                backgroundColor: activeTab === page.id ? 'hsl(var(--primary))' : 'transparent',
                color: activeTab === page.id ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.875rem',
                fontFamily: 'inherit',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (activeTab !== page.id) {
                  e.currentTarget.style.backgroundColor = 'hsl(var(--accent))'
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== page.id) {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }
              }}
            >
              <span style={{ fontSize: '1rem' }}>{page.emoji}</span>
              <span>{page.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        {/* Header */}
        <header style={{
          borderBottom: '1px solid hsl(var(--border))',
          backgroundColor: 'hsl(var(--background))',
          height: '3.5rem',
          display: 'flex',
          alignItems: 'center',
          paddingLeft: '1rem',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.5rem' }}>🦗</span>
            <h1 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>LC-EWS - Locust Early Warning System</h1>
          </div>
        </header>

        {/* Content Area */}
        <main style={{
          flex: 1,
          overflowY: 'auto',
          backgroundColor: 'hsl(var(--background))',
          color: 'hsl(var(--foreground))'
        }}>
          <div style={{ padding: '1.5rem' }}>
            {renderPage()}
          </div>
        </main>
      </div>
    </div>
  )
}
