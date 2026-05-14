import { useState, useEffect } from 'react'
import { ChevronDown, BarChart3, Map, Bot, Zap, Inbox, Settings, Users as UsersIcon, LogOut, Globe, Menu } from 'lucide-react'
import { useAuth } from './context/AuthContext'
import { ThemeProvider } from './components/ThemeProvider'
import { ThemeToggle } from './components/ThemeToggle'
import { AlertDropdown } from './components/AlertDropdown'
import Login from './pages/Login'

// ── Admin / Analyst pages ─────────────────────────────────
import Dashboard from './pages/AdminUI/Dashboard'
import SwarmMap from './pages/AdminUI/SwarmMap'
import PakistanRiskOverview from './pages/AdminUI/PakistanRiskOverview'
import AIPrediction from './pages/AdminUI/AIPrediction'
import DroneOps from './pages/AdminUI/DroneOps'
import FieldReports from './pages/AdminUI/FieldReports'
import Alerts from './pages/AdminUI/Alerts'
import Users from './pages/AdminUI/Users'

// ── Field Officer pages ───────────────────────────────────
import FODashboard from './pages/FieldOfficerUI/Dashboard'
import FOSwarmMap from './pages/FieldOfficerUI/SwarmMap'
import FORiskOverview from './pages/FieldOfficerUI/PakistanRiskOverview'
import FOAIPrediction from './pages/FieldOfficerUI/AIPrediction'
import FODroneOps from './pages/FieldOfficerUI/DroneOps'
import FOFieldReports from './pages/FieldOfficerUI/FieldReports'
import FOAlerts from './pages/FieldOfficerUI/Alerts'

// ── Analyst pages ─────────────────────────────────────────
import ANDashboard from './pages/AnalystUI/Dashboard'
import ANSwarmMap from './pages/AnalystUI/SwarmMap'
import ANRiskOverview from './pages/AnalystUI/PakistanRiskOverview'
import ANAIPrediction from './pages/AnalystUI/AIPrediction'
import ANDroneOps from './pages/AnalystUI/DroneOps'
import ANFieldReports from './pages/AnalystUI/FieldReports'
import ANAlerts from './pages/AnalystUI/Alerts'

// ── Page definition type ──────────────────────────────────
interface PageDef {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  section: string
}

export default function App() {
  const { user, logout, isLoading } = useAuth()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [expandedSection, setExpandedSection] = useState<string | null>('platform')
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  // Show nothing while restoring session from localStorage
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-primary text-2xl animate-pulse">🦗</div>
      </div>
    )
  }

  // Auth gate — unauthenticated users see the login screen
  if (!user) return <Login />

  const isFieldOfficer = user.role === 'field_officer'
  const isAnalyst      = user.role === 'analyst'
  const isAdmin        = user.role === 'admin'

  // ── Page lists per role ─────────────────────────────────
  const adminPages: PageDef[] = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, section: 'platform' },
    { id: 'map', label: 'Swarm Map', icon: Map, section: 'platform' },
    { id: 'risk', label: 'Risk Overview', icon: Globe, section: 'platform' },
    { id: 'ai', label: 'AI Prediction', icon: Bot, section: 'platform' },
    { id: 'drones', label: 'Drone Ops', icon: Zap, section: 'platform' },
    { id: 'reports', label: 'Field Reports', icon: Inbox, section: 'platform' },
    { id: 'alerts', label: 'Alerts', icon: Settings, section: 'operations' },
    { id: 'users', label: 'Users', icon: UsersIcon, section: 'team' },
  ]

  const analystPages: PageDef[] = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, section: 'platform' },
    { id: 'map', label: 'Swarm Map', icon: Map, section: 'platform' },
    { id: 'risk', label: 'Risk Overview', icon: Globe, section: 'platform' },
    { id: 'ai', label: 'AI Prediction', icon: Bot, section: 'platform' },
    { id: 'drones', label: 'Drone Ops', icon: Zap, section: 'platform' },
    { id: 'reports', label: 'Field Reports', icon: Inbox, section: 'platform' },
    { id: 'alerts', label: 'Alerts', icon: Settings, section: 'operations' },
  ]

  const foPages: PageDef[] = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, section: 'platform' },
    { id: 'map', label: 'Swarm Map', icon: Map, section: 'platform' },
    { id: 'risk', label: 'Risk Overview', icon: Globe, section: 'platform' },
    { id: 'ai', label: 'AI Prediction', icon: Bot, section: 'platform' },
    { id: 'drones', label: 'Drone Ops', icon: Zap, section: 'platform' },
    { id: 'reports', label: 'Field Reports', icon: Inbox, section: 'platform' },
    { id: 'alerts', label: 'Alerts', icon: Settings, section: 'operations' },
  ]

  const pages = isFieldOfficer ? foPages : isAnalyst ? analystPages : adminPages

  // ── Page renderer ──────────────────────────────────────
  const renderPage = () => {
    if (isFieldOfficer) {
      switch (activeTab) {
        case 'dashboard': return <FODashboard />
        case 'map':       return <FOSwarmMap />
        case 'risk':      return <FORiskOverview />
        case 'ai':        return <FOAIPrediction />
        case 'drones':    return <FODroneOps />
        case 'reports':   return <FOFieldReports />
        case 'alerts':    return <FOAlerts />
        default:          return <FODashboard />
      }
    }
    if (isAnalyst) {
      switch (activeTab) {
        case 'dashboard': return <ANDashboard />
        case 'map':       return <ANSwarmMap />
        case 'risk':      return <ANRiskOverview />
        case 'ai':        return <ANAIPrediction />
        case 'drones':    return <ANDroneOps />
        case 'reports':   return <ANFieldReports />
        case 'alerts':    return <ANAlerts />
        default:          return <ANDashboard />
      }
    }
    // Admin (default)
    switch (activeTab) {
      case 'dashboard': return <Dashboard />
      case 'map':       return <SwarmMap />
      case 'risk':      return <PakistanRiskOverview />
      case 'ai':        return <AIPrediction />
      case 'drones':    return <DroneOps />
      case 'reports':   return <FieldReports />
      case 'alerts':    return <Alerts />
      case 'users':     return <Users />
      default:          return <Dashboard />
    }
  }

  // ── Sidebar sections ───────────────────────────────────
  const sections = [
    {
      id: 'platform',
      label: 'Platform',
      items: pages.filter(p => p.section === 'platform'),
      expandable: true,
    },
    {
      id: 'operations',
      label: 'Operations',
      items: pages.filter(p => p.section === 'operations'),
      expandable: false,
    },
    // Only admin sees the Team section
    ...(isAdmin
      ? [{
          id: 'team',
          label: 'Team',
          items: pages.filter(p => p.section === 'team'),
          expandable: false,
        }]
      : []),
  ]

  return (
    <ThemeProvider defaultTheme="dark" storageKey="lc-ews-theme">
      <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans">
        {/* Collapsible Sidebar */}
        <div className={`${isSidebarCollapsed ? 'w-20' : 'w-64'} border-r border-border/50 bg-card/50 backdrop-blur-xl flex flex-col transition-all duration-300 z-50 shadow-[4px_0_24px_-10px_rgba(0,0,0,0.1)] relative overflow-x-hidden`}>
          
          {/* Toggle Button (Absolute inside sidebar) */}
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="absolute -right-3 top-20 bg-background border border-border shadow-md rounded-full p-1 hover:bg-accent text-muted-foreground hover:text-foreground z-50"
          >
            <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${isSidebarCollapsed ? '-rotate-90' : 'rotate-90'}`} />
          </button>
        {/* Logo */}
        <div className={`px-4 py-7 border-b border-border/50 relative overflow-hidden group cursor-default transition-all duration-300 ${isSidebarCollapsed ? 'items-center justify-center' : ''}`}>
          {/* Animated background glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-sky-500/5 opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
          
          {/* Faint watermark */}
          <div className="absolute -right-8 -top-8 opacity-5 group-hover:opacity-[0.08] group-hover:scale-110 group-hover:-rotate-6 transition-all duration-700 pointer-events-none transform origin-center">
            <span className="text-9xl">🦗</span>
          </div>
          
          <div className={`flex ${isSidebarCollapsed ? 'flex-col justify-center' : 'items-center'} gap-4 relative z-10`}>
            {/* Logo Icon with radar/pulse ring */}
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 bg-sky-500/20 rounded-xl blur-xl group-hover:blur-2xl transition-all duration-500 opacity-0 group-hover:opacity-100" />
              <div className="absolute inset-0 border border-sky-400/30 rounded-xl animate-ping opacity-0 group-hover:opacity-100" style={{ animationDuration: '3s' }} />
              <div className="p-3 bg-gradient-to-br from-emerald-500/20 via-sky-500/20 to-indigo-500/20 rounded-xl shadow-inner border border-white/10 group-hover:border-white/20 group-hover:shadow-[0_0_20px_rgba(14,165,233,0.3)] transition-all duration-300 relative bg-background/50 backdrop-blur-sm">
                <span className="text-2xl drop-shadow-lg transform group-hover:scale-110 group-hover:rotate-12 group-hover:-translate-y-0.5 transition-all duration-300 inline-block">🦗</span>
              </div>
            </div>

            {!isSidebarCollapsed && (
              <div className="flex flex-col justify-center overflow-hidden whitespace-nowrap">
                <span className="text-[28px] leading-none font-black tracking-tighter bg-gradient-to-r from-emerald-400 via-sky-400 to-indigo-400 bg-clip-text text-transparent font-['Outfit'] drop-shadow-sm pb-1.5 group-hover:from-sky-400 group-hover:via-indigo-400 group-hover:to-emerald-400 transition-all duration-700" style={{ backgroundSize: '200% auto' }}>LC-EWS</span>
                {isFieldOfficer && (
                  <span className="text-[9px] leading-none uppercase tracking-[0.25em] font-bold text-emerald-400/90 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" /> Field Officer
                  </span>
                )}
                {isAnalyst && (
                  <span className="text-[9px] leading-none uppercase tracking-[0.25em] font-bold text-sky-400/90 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-pulse shadow-[0_0_8px_rgba(56,189,248,0.8)]" /> Analyst Portal
                  </span>
                )}
                {isAdmin && (
                  <span className="text-[9px] leading-none uppercase tracking-[0.25em] font-bold text-indigo-400/90 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse shadow-[0_0_8px_rgba(129,140,248,0.8)]" /> Admin Portal
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 space-y-2">
          {sections.map(section => (
            <div key={section.id}>
              {section.expandable ? (
                <button
                  onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
                  className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'} px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-lg transition-all duration-200 group`}
                  title={isSidebarCollapsed ? section.label : undefined}
                >
                  {!isSidebarCollapsed && <span className="group-hover:translate-x-0.5 transition-transform whitespace-nowrap">{section.label}</span>}
                  <ChevronDown 
                    className={`h-4 w-4 flex-shrink-0 transition-all duration-300 ${expandedSection === section.id ? 'rotate-180' : 'group-hover:translate-x-0.5'}`}
                  />
                </button>
              ) : (
                <div className={`px-3 py-2 text-xs font-medium text-muted-foreground/70 uppercase tracking-wider ${isSidebarCollapsed ? 'text-center truncate' : ''}`}>
                  {!isSidebarCollapsed ? section.label : '•••'}
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
                        className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} text-sm font-medium transition-all duration-200 group ${
                          isActive
                            ? 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 shadow-sm border border-emerald-500/20'
                            : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
                        }`}
                        title={isSidebarCollapsed ? page.label : undefined}
                      >
                        <Icon className={`h-5 w-5 flex-shrink-0 transition-all duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                        {!isSidebarCollapsed && (
                          <span className={`flex-1 transition-all duration-200 whitespace-nowrap overflow-hidden ${isActive ? 'font-semibold' : 'group-hover:translate-x-0.5'}`}>
                            {page.label}
                          </span>
                        )}
                        {isActive && !isSidebarCollapsed && <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 ml-2 shadow-[0_0_5px_rgba(16,185,129,0.5)]" />}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* User Profile Section */}
        <div className="border-t border-border/50 p-3 space-y-3 bg-muted/10 overflow-hidden">
          {!isSidebarCollapsed && (
            <>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 flex-shrink-0 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold group-hover:scale-110 transition-transform duration-200">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{user.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                </div>
              </div>
              <div className="mt-2 px-0 whitespace-nowrap">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  user.role === 'admin'         ? 'bg-red-500/15 text-red-400' :
                  user.role === 'analyst'       ? 'bg-blue-500/15 text-blue-400' :
                                                'bg-green-500/15 text-green-400'
                }`}>
                  {user.role === 'field_officer' ? 'Field Officer' : user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </span>
              </div>
            </>
          )}
          <button
            onClick={logout}
            className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-2' : 'gap-2 px-3 py-2.5'} text-sm text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all duration-200 group font-medium`}
            title={isSidebarCollapsed ? "Sign Out" : undefined}
          >
            <LogOut className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
            {!isSidebarCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="border-b border-border/40 bg-background/80 backdrop-blur-xl h-16 flex items-center justify-between px-6 sticky top-0 z-40 shadow-sm relative overflow-hidden">
          {/* Subtle top glow line */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent opacity-0 transition-opacity duration-500 header-glow-line" />
          
          <div className="flex items-center gap-3">
            {/* Breadcrumb / Page Title */}
            <div className="flex items-baseline gap-2">
              <span className="text-muted-foreground/60 font-medium text-sm">Dashboard</span>
              <span className="text-muted-foreground/40 text-xs">/</span>
              <h1 className="font-semibold text-foreground tracking-tight">
                {pages.find(p => p.id === activeTab)?.label || 'Overview'}
              </h1>
            </div>
          </div>
          
          {/* Right Actions */}
          <div className="flex items-center gap-4">
            <AlertDropdown />
            
            <div className="h-6 w-px bg-border/50 mx-1" />
            <ThemeToggle />
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
    </ThemeProvider>
  )
}
