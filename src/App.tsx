import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
  const isAnalyst = user.role === 'analyst'
  const isAdmin = user.role === 'admin'

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
        case 'map': return <FOSwarmMap />
        case 'risk': return <FORiskOverview />
        case 'ai': return <FOAIPrediction />
        case 'drones': return <FODroneOps />
        case 'reports': return <FOFieldReports />
        case 'alerts': return <FOAlerts />
        default: return <FODashboard />
      }
    }
    if (isAnalyst) {
      switch (activeTab) {
        case 'dashboard': return <ANDashboard />
        case 'map': return <ANSwarmMap />
        case 'risk': return <ANRiskOverview />
        case 'ai': return <ANAIPrediction />
        case 'drones': return <ANDroneOps />
        case 'reports': return <ANFieldReports />
        case 'alerts': return <ANAlerts />
        default: return <ANDashboard />
      }
    }
    // Admin (default)
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
        <motion.div
          animate={{ width: isSidebarCollapsed ? 80 : 256 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30, mass: 0.8 }}
          className="border-r border-border/50 bg-card/50 backdrop-blur-xl flex flex-col z-50 shadow-[4px_0_24px_-10px_rgba(0,0,0,0.1)] relative overflow-hidden shrink-0"
        >

          {/* Toggle Button (Absolute inside sidebar) */}
          <motion.button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="absolute -right-3 top-20 bg-background border border-border shadow-md rounded-full p-1 hover:bg-accent text-muted-foreground hover:text-foreground z-50"
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          >
            <motion.div
              animate={{ rotate: isSidebarCollapsed ? -90 : 90 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <ChevronDown className="h-4 w-4" />
            </motion.div>
          </motion.button>
          {/* Logo */}
          <div className={`px-4 py-7 border-b border-border/50 relative overflow-hidden group cursor-default`}>
            {/* Animated background glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-sky-500/5 opacity-50 group-hover:opacity-100 transition-opacity duration-700" />

            {/* Faint watermark */}
            <div className="absolute -right-8 -top-8 opacity-40 group-hover:opacity-[1] group-hover:scale-110 group-hover:-rotate-6 transition-all duration-700 pointer-events-none transform origin-center">
              <img src="/models/logo.png" alt="watermark" className="w-40 h-40 object-contain" />
            </div>

            <motion.div
              className="flex gap-4 relative z-10"
              animate={{
                flexDirection: isSidebarCollapsed ? 'column' as const : 'row' as const,
                justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                alignItems: isSidebarCollapsed ? 'center' : 'center',
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <AnimatePresence mode="wait">
                {!isSidebarCollapsed && (
                  <motion.div
                    key="logo-text"
                    className="flex flex-col justify-center overflow-hidden whitespace-nowrap"
                    initial={{ opacity: 0, x: -10, width: 0 }}
                    animate={{ opacity: 1, x: 0, width: 'auto' }}
                    exit={{ opacity: 0, x: -10, width: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25, mass: 0.8 }}
                  >
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
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
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
                    <AnimatePresence mode="wait">
                      {!isSidebarCollapsed && (
                        <motion.span
                          key="section-label"
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -8 }}
                          transition={{ duration: 0.15 }}
                          className="group-hover:translate-x-0.5 transition-transform whitespace-nowrap"
                        >
                          {section.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                    <motion.div
                      animate={{ rotate: expandedSection === section.id ? 180 : 0 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    >
                      <ChevronDown className="h-4 w-4 flex-shrink-0" />
                    </motion.div>
                  </button>
                ) : (
                  <div className={`px-3 py-2 text-xs font-medium text-muted-foreground/70 uppercase tracking-wider ${isSidebarCollapsed ? 'text-center truncate' : ''}`}>
                    {!isSidebarCollapsed ? section.label : '•••'}
                  </div>
                )}

                <AnimatePresence initial={false}>
                  {(!section.expandable || expandedSection === section.id) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 30, mass: 0.8 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div className="space-y-1 ml-2">
                        {section.items.map((page, idx) => {
                          const Icon = page.icon
                          const isActive = activeTab === page.id
                          return (
                            <motion.button
                              key={page.id}
                              initial={{ opacity: 0, x: -12 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.03, type: 'spring', stiffness: 400, damping: 25 }}
                              onClick={() => setActiveTab(page.id)}
                              className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} text-sm font-medium transition-all duration-200 group ${isActive
                                ? 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 shadow-sm border border-emerald-500/20'
                                : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
                                }`}
                              title={isSidebarCollapsed ? page.label : undefined}
                              whileHover={{ x: isSidebarCollapsed ? 0 : 2 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <motion.div
                                animate={{ scale: isActive ? 1.1 : 1 }}
                                transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                              >
                                <Icon className="h-5 w-5 flex-shrink-0" />
                              </motion.div>
                              <AnimatePresence mode="wait">
                                {!isSidebarCollapsed && (
                                  <motion.span
                                    key={`label-${page.id}`}
                                    initial={{ opacity: 0, width: 0 }}
                                    animate={{ opacity: 1, width: 'auto' }}
                                    exit={{ opacity: 0, width: 0 }}
                                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                                    className={`flex-1 whitespace-nowrap overflow-hidden ${isActive ? 'font-semibold' : ''}`}
                                  >
                                    {page.label}
                                  </motion.span>
                                )}
                              </AnimatePresence>
                              <AnimatePresence>
                                {isActive && !isSidebarCollapsed && (
                                  <motion.div
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0, opacity: 0 }}
                                    transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                                    className="h-1.5 w-1.5 rounded-full bg-emerald-500 ml-2 shadow-[0_0_5px_rgba(16,185,129,0.5)]"
                                  />
                                )}
                              </AnimatePresence>
                            </motion.button>
                          )
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </nav>

          {/* User Profile Section */}
          <div className="border-t border-border/50 p-3 space-y-3 bg-muted/10 overflow-hidden">
            <AnimatePresence>
              {!isSidebarCollapsed && (
                <motion.div
                  key="user-profile"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25, mass: 0.8 }}
                  style={{ overflow: 'hidden' }}
                >
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
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${user.role === 'admin' ? 'bg-red-500/15 text-red-400' :
                      user.role === 'analyst' ? 'bg-blue-500/15 text-blue-400' :
                        'bg-green-500/15 text-green-400'
                      }`}>
                      {user.role === 'field_officer' ? 'Field Officer' : user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <motion.button
              onClick={logout}
              className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-2' : 'gap-2 px-3 py-2.5'} text-sm text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all duration-200 group font-medium`}
              title={isSidebarCollapsed ? "Sign Out" : undefined}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              <LogOut className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
              <AnimatePresence>
                {!isSidebarCollapsed && (
                  <motion.span
                    key="signout-text"
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    Sign Out
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </motion.div>

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
