import { useState, useEffect } from 'react'
import { ChevronDown, BarChart3, Map, Bot, Zap, Inbox, Settings, Users as UsersIcon, LogOut, Globe } from 'lucide-react'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import SwarmMap from './pages/SwarmMap'
import PakistanRiskOverview from './pages/PakistanRiskOverview'
import AIPrediction from './pages/AIPrediction'
import DroneOps from './pages/DroneOps'
import FieldReports from './pages/FieldReports'
import Alerts from './pages/Alerts'
import Users from './pages/Users'

export default function App() {
  const { user, logout, isLoading } = useAuth()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [expandedSection, setExpandedSection] = useState<string | null>('platform')

  useEffect(() => {
    document.documentElement.classList.add('dark')
  }, [])

  // Show nothing while restoring session from localStorage
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#060910] flex items-center justify-center">
        <div className="text-amber-500 text-2xl animate-pulse">🦗</div>
      </div>
    )
  }

  // Auth gate — unauthenticated users see the login screen
  if (!user) return <Login />

  const pages = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, section: 'platform' },
    { id: 'map', label: 'Swarm Map', icon: Map, section: 'platform' },
    { id: 'risk', label: 'Risk Overview', icon: Globe, section: 'platform' },
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
      case 'risk': return <PakistanRiskOverview />
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
      <div className="w-64 border-r border-border bg-background flex flex-col overflow-hidden shadow-lg">
        {/* Logo */}
        <div className="px-6 py-4 border-b border-border hover:bg-accent/30 transition-colors duration-200">
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
                  className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-lg transition-all duration-200 group"
                >
                  <span className="group-hover:translate-x-0.5 transition-transform">{section.label}</span>
                  <ChevronDown 
                    className={`h-4 w-4 transition-all duration-300 ${expandedSection === section.id ? 'rotate-180' : 'group-hover:translate-x-0.5'}`}
                  />
                </button>
              ) : (
                <div className="px-3 py-2 text-xs font-medium text-muted-foreground/70 uppercase tracking-wider">
                  {section.label}
                </div>
              )}

              {(!section.expandable || expandedSection === section.id) && (
                <div className="space-y-1 ml-2 animate-in fade-in slide-in-from-top-1 duration-200">
                  {section.items.map(page => {
                    const Icon = page.icon
                    const isActive = activeTab === page.id
                    return (
                      <button
                        key={page.id}
                        onClick={() => setActiveTab(page.id)}
                        className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-3 text-sm font-medium transition-all duration-200 group ${
                          isActive
                            ? 'bg-primary text-primary-foreground shadow-md'
                            : 'text-foreground hover:bg-accent/60 hover:shadow-sm'
                        }`}
                      >
                        <Icon className={`h-4 w-4 flex-shrink-0 transition-all duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                        <span className={`flex-1 transition-all duration-200 ${isActive ? 'font-semibold' : 'group-hover:translate-x-0.5'}`}>
                          {page.label}
                        </span>
                        {isActive && <div className="h-2 w-2 rounded-full bg-primary-foreground ml-2 animate-pulse" />}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* User Profile Section */}
        <div className="border-t border-border p-3 space-y-3 bg-accent/20">
          <div className="px-3 py-3 bg-accent/40 rounded-lg hover:bg-accent/60 transition-all duration-200 group cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-black text-sm font-bold group-hover:scale-110 transition-transform duration-200">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{user.name}</div>
                <div className="text-xs text-muted-foreground truncate">{user.email}</div>
              </div>
            </div>
            <div className="mt-2 px-0">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                user.role === 'admin'         ? 'bg-red-500/15 text-red-400' :
                user.role === 'analyst'       ? 'bg-blue-500/15 text-blue-400' :
                                               'bg-green-500/15 text-green-400'
              }`}>
                {user.role === 'field_officer' ? 'Field Officer' : user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </span>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent/60 rounded-lg transition-all duration-200 group font-medium"
          >
            <LogOut className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
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
