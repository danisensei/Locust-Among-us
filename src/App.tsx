import { useState, useEffect } from 'react'
import { ChevronDown, BarChart3, Map, Bot, Zap, Inbox, Settings, Users as UsersIcon, LogOut } from 'lucide-react'
import Dashboard from './pages/Dashboard'
import SwarmMap from './pages/SwarmMap'
import AIPrediction from './pages/AIPrediction'
import DroneOps from './pages/DroneOps'
import FieldReports from './pages/FieldReports'
import Alerts from './pages/Alerts'
import Users from './pages/Users'

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [expandedSection, setExpandedSection] = useState<string | null>('platform')

  useEffect(() => {
    document.documentElement.classList.add('dark')
  }, [])

  const pages = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, section: 'platform' },
    { id: 'map', label: 'Swarm Map', icon: Map, section: 'platform' },
    { id: 'ai', label: 'AI Prediction', icon: Bot, section: 'platform' },
    { id: 'drones', label: 'Drone Ops', icon: Zap, section: 'platform' },
    { id: 'reports', label: 'Field Reports', icon: Inbox, section: 'platform' },
    { id: 'alerts', label: 'Alerts', icon: Settings, section: 'operations' },
    { id: 'users', label: 'Users', icon: UsersIcon, section: 'team' },
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

  const sections = [
    {
      id: 'platform',
      label: 'Platform',
      items: pages.filter(p => p.section === 'platform'),
      expandable: true
    },
    {
      id: 'operations',
      label: 'Operations',
      items: pages.filter(p => p.section === 'operations'),
      expandable: false
    },
    {
      id: 'team',
      label: 'Team',
      items: pages.filter(p => p.section === 'team'),
      expandable: false
    }
  ]

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: 'hsl(var(--background))' }}>
      {/* Sidebar */}
      <div className="w-64 border-r border-border bg-background flex flex-col overflow-hidden">
        {/* Logo */}
        <div className="px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <span className="text-2xl">🦗</span>
            <span>LC-EWS</span>
          </div>
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-2">
          {sections.map(section => (
            <div key={section.id}>
              {section.expandable ? (
                <button
                  onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-md transition-colors"
                >
                  <span>{section.label}</span>
                  <ChevronDown 
                    className={`h-4 w-4 transition-transform ${expandedSection === section.id ? 'rotate-180' : ''}`}
                  />
                </button>
              ) : (
                <div className="px-3 py-2 text-xs font-medium text-muted-foreground/70 uppercase tracking-wider">
                  {section.label}
                </div>
              )}

              {(!section.expandable || expandedSection === section.id) && (
                <div className="space-y-1 ml-2">
                  {section.items.map(page => {
                    const Icon = page.icon
                    return (
                      <button
                        key={page.id}
                        onClick={() => setActiveTab(page.id)}
                        className={`w-full text-left px-3 py-2 rounded-md flex items-center gap-3 text-sm transition-all ${
                          activeTab === page.id
                            ? 'bg-primary text-primary-foreground'
                            : 'text-foreground hover:bg-accent/50'
                        }`}
                      >
                        <Icon className="h-4 w-4 flex-shrink-0" />
                        <span className="flex-1">{page.label}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* User Profile Section */}
        <div className="border-t border-border p-3 space-y-3">
          <div className="px-3 py-2 bg-accent/30 rounded-md">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-semibold">
                SH
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">shadcn</div>
                <div className="text-xs text-muted-foreground truncate">m@example.com</div>
              </div>
            </div>
          </div>
          <button className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-md transition-colors">
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="border-b border-border bg-background h-14 flex items-center px-6 gap-4">
          <div className="flex-1 flex items-center gap-2">
            <span className="text-2xl">🦗</span>
            <h1 className="font-semibold text-lg">LC-EWS - Locust Early Warning System</h1>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            {renderPage()}
          </div>
        </main>
      </div>
    </div>
  )
}
