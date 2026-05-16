import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronLeft, BarChart3, Map, Bot, Zap, Inbox, Settings, Users as UsersIcon, LogOut, Globe, Menu, X } from 'lucide-react'
import { useAuth } from './context/AuthContext'
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setIsMobileMenuOpen(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Handle nav click — close mobile menu
  const handleNavClick = (pageId: string) => {
    setActiveTab(pageId)
    setIsMobileMenuOpen(false)
  }

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

  // ── Shared sidebar content for desktop and mobile ────
  const renderSidebarContent = (isMobile: boolean) => {
    const collapsed = isMobile ? false : isSidebarCollapsed
    return (
      <>
        {/* Logo */}
        <div className={`h-20 border-b border-border/50 relative overflow-hidden group cursor-default flex items-center justify-center bg-background/30`}>
          
          {/* Animated Mesh Gradient Background */}
          <div className="absolute inset-0 opacity-20 group-hover:opacity-40 transition-opacity duration-1000">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.1),transparent_50%)] animate-pulse" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(56,189,248,0.1),transparent_50%)] animate-pulse [animation-delay:1s]" />
          </div>

          {/* Scanning Effect Line */}
          <motion.div
            className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent z-20"
            animate={{ top: ['-10%', '110%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />

          {/* Faint watermark - HIDE WHEN COLLAPSED */}
          {!collapsed && (
            <div 
              className="absolute -right-4 -top-4 opacity-40 group-hover:opacity-80 group-hover:scale-110 group-hover:rotate-6 transition-all duration-1000 pointer-events-none transform origin-center dark:mix-blend-screen mix-blend-normal"
              style={{ 
                WebkitMaskImage: 'radial-gradient(circle at center, black 30%, transparent 65%)', 
                maskImage: 'radial-gradient(circle at center, black 30%, transparent 65%)' 
              }}
            >
              <img src="/models/locust-tech-logo.png" alt="AI Locust Logo" className="w-32 h-32 object-contain" />
            </div>
          )}

          <motion.div
            className="flex items-center justify-center relative z-10 w-full"
            animate={{
              paddingLeft: collapsed ? 0 : 20,
              paddingRight: collapsed ? 0 : 20,
            }}
          >
            {collapsed ? (
              <motion.div 
                className="relative flex items-center justify-center"
                whileHover={{ scale: 1.1 }}
              >
                <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full" />
                <div className="h-10 w-10 rounded-xl border border-emerald-500/30 flex items-center justify-center bg-background/50 backdrop-blur-md shadow-inner relative z-10">
                  <span className="text-lg font-black bg-gradient-to-br from-emerald-400 to-sky-400 bg-clip-text text-transparent">LC</span>
                </div>
              </motion.div>
            ) : (
              <div className="flex flex-col items-start w-full relative">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[26px] leading-none font-black tracking-tighter bg-gradient-to-r from-emerald-400 via-sky-400 to-indigo-400 bg-clip-text text-transparent font-['Outfit'] drop-shadow-md pb-1 transition-all duration-700">LC-EWS</span>
                </div>
                <div className="flex items-center gap-2 pl-4">
                  <div className="h-[1px] w-4 bg-border/50" />
                  {isFieldOfficer && <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-emerald-500/60">Field Officer</span>}
                  {isAnalyst && <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-sky-500/60">Analyst Portal</span>}
                  {isAdmin && <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-indigo-500/60">Admin Portal</span>}
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 space-y-2">
          {sections.map(section => (
            <div key={section.id}>
              {section.expandable ? (
                <button
                  onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
                  className={`w-full flex items-center ${collapsed ? 'justify-center' : 'justify-between'} px-3 py-2.5 text-sm font-bold text-foreground/80 hover:text-foreground hover:bg-accent/50 rounded-lg transition-all duration-200 group`}
                  title={collapsed ? section.label : undefined}
                >
                  <AnimatePresence mode="wait">
                    {!collapsed && (
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
                  <motion.div animate={{ rotate: expandedSection === section.id ? 180 : 0 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
                    <ChevronDown className="h-4 w-4 flex-shrink-0" />
                  </motion.div>
                </button>
              ) : (
                <div className={`px-3 pt-6 pb-2 text-[10px] font-bold text-foreground/60 uppercase tracking-[0.2em] ${collapsed ? 'text-center' : 'pl-4'}`}>
                  {!collapsed ? section.label : <div className="h-px bg-border/50 w-full" />}
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
                            onClick={() => handleNavClick(page.id)}
                            className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center ${collapsed ? 'justify-center' : 'gap-3'} text-sm font-semibold transition-all duration-300 group ${isActive
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-[0_0_20px_-5px_rgba(16,185,129,0.2)] border border-emerald-500/30'
                              : 'text-foreground/70 hover:bg-emerald-500/5 hover:text-foreground'
                              }`}
                            title={collapsed ? page.label : undefined}
                            whileHover={{ x: collapsed ? 0 : 2 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <motion.div animate={{ scale: isActive ? 1.1 : 1 }} transition={{ type: 'spring', stiffness: 500, damping: 20 }}>
                              <Icon className="h-5 w-5 flex-shrink-0" />
                            </motion.div>
                            <AnimatePresence mode="wait">
                              {!collapsed && (
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
                              {isActive && !collapsed && (
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
            {!collapsed && (
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
                    <div className="text-sm font-bold truncate">{user.name}</div>
                    <div className="text-xs text-foreground/60 font-medium truncate">{user.email}</div>
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
            className={`w-full flex items-center ${collapsed ? 'justify-center p-2' : 'gap-2 px-3 py-2.5'} text-sm font-bold text-foreground/70 hover:text-rose-600 dark:hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all duration-200 group`}
            title={collapsed ? "Sign Out" : undefined}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
          >
            <LogOut className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
            <AnimatePresence>
              {!collapsed && (
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
      </>
    )
  }

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans">
        
        {/* ── Mobile sidebar backdrop ── */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998] md:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* ── Desktop Sidebar (in-flow, collapsible) ── */}
        <div className="relative z-50 shrink-0 hidden md:flex">
          <motion.div
            animate={{ width: isSidebarCollapsed ? 80 : 256 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30, mass: 0.8 }}
            className="h-full border-r border-border/50 bg-card/50 backdrop-blur-xl flex flex-col shadow-[4px_0_24px_-10px_rgba(0,0,0,0.1)] overflow-hidden"
          >
            {renderSidebarContent(false)}
          </motion.div>

          {/* Toggle Button */}
          <motion.button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="absolute -right-4 top-1/2 -translate-y-1/2 bg-background border border-border shadow-xl rounded-full p-2 hover:bg-accent text-primary hover:text-primary transition-all z-[60] flex items-center justify-center group"
            whileHover={{ scale: 1.1, x: 2 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          >
            <motion.div
              animate={{ rotate: isSidebarCollapsed ? 180 : 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <ChevronLeft className="h-4 w-4" />
            </motion.div>
          </motion.button>
        </div>

        <div
          className={`md:hidden fixed inset-y-0 left-0 z-[9999] w-64 transition-transform duration-300 ease-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
          <div className="w-full h-full border-r border-border/50 bg-card backdrop-blur-xl flex flex-col shadow-[4px_0_24px_-10px_rgba(0,0,0,0.3)] overflow-hidden">
            {renderSidebarContent(true)}
          </div>

          <motion.button
            onClick={() => setIsMobileMenuOpen(false)}
            className={`absolute -right-4 top-1/2 -translate-y-1/2 bg-background border border-border shadow-xl rounded-full p-2 hover:bg-accent text-primary hover:text-rose-500 transition-all duration-300 z-[60] flex items-center justify-center group ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            whileHover={{ scale: 1.1, x: 2 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          >
            <X className="h-4 w-4 group-hover:scale-110 transition-transform" />
          </motion.button>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="border-b border-border/40 bg-background/80 backdrop-blur-xl h-14 md:h-16 flex items-center justify-between px-3 md:px-6 sticky top-0 z-[1000] shadow-sm relative">
            {/* Subtle top glow line */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent opacity-0 transition-opacity duration-500 header-glow-line" />

            <div className="flex items-center gap-2 md:gap-3">
              {/* Mobile hamburger */}
              <motion.button
                onClick={() => setIsMobileMenuOpen(true)}
                className="md:hidden p-2 -ml-2 text-foreground/80 hover:text-foreground rounded-lg hover:bg-accent/50"
                whileHover={{ scale: 1.05 }}
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </motion.button>
              {/* Breadcrumb / Page Title */}
              <div className="flex items-center gap-2">
                <span className="text-foreground/70 font-bold text-xs capitalize tracking-wide hidden sm:inline">
                  {pages.find(p => p.id === activeTab)?.section || 'Platform'}
                </span>
                <span className="text-foreground/30 text-xs font-light hidden sm:inline">/</span>
                <h1 className="font-bold text-foreground tracking-tight text-sm md:text-base" style={{ fontFamily: "'Outfit', sans-serif" }}>
                  {pages.find(p => p.id === activeTab)?.label || 'Overview'}
                </h1>
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-4 relative z-[1001]">
              <AlertDropdown onNavigate={setActiveTab} />

              <div className="h-6 w-px bg-border/50 mx-1" />
              <ThemeToggle />
            </div>
          </header>

          {/* Content Area */}
          <main className="flex-1 overflow-y-auto">
            <div className="p-3 md:p-6">
              {renderPage()}
            </div>
          </main>
        </div>
      </div>
  )
}
