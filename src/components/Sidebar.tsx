interface SidebarProps {
  activeSection: string
  setActiveSection: (section: string) => void
}

export default function Sidebar({ activeSection, setActiveSection }: SidebarProps) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', emoji: '⬛', group: 'Overview' },
    { id: 'map', label: 'Swarm Map', emoji: '🗺', group: 'Overview' },
    { id: 'ai', label: 'AI Prediction', emoji: '🤖', group: 'Operations' },
    { id: 'drones', label: 'Drone Ops', emoji: '🛸', group: 'Operations' },
    { id: 'reports', label: 'Field Reports', emoji: '📋', group: 'Operations' },
    { id: 'alerts', label: 'Alerts', emoji: '🔔', group: 'System', badge: 5 },
    { id: 'users', label: 'Users', emoji: '👥', group: 'System' },
  ]

  const groups = ['Overview', 'Operations', 'System']

  return (
    <nav className="w-56 bg-[rgba(13,20,33,0.7)] border-r border-[rgba(255,255,255,0.07)] py-4 flex-shrink-0 overflow-y-auto">
      {groups.map((group) => (
        <div key={group} className="mb-5">
          <div className="text-xs font-mono-space font-bold text-[#374151] uppercase tracking-widest px-4.5 mb-1.5">
            {group}
          </div>
          <div>
            {navItems
              .filter((item) => item.group === group)
              .map((item) => {
                const isActive = activeSection === item.id
                return (
                  <div
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`flex items-center gap-2.5 px-4.5 py-2.25 cursor-pointer text-sm transition-all border-l-2 ${
                      isActive
                        ? 'bg-[rgba(245,158,11,0.12)] text-amber-400 border-l-amber-500'
                        : 'bg-transparent text-[#64748b] border-l-transparent hover:text-[#e2e8f0] hover:bg-[#131d2e]'
                    }`}
                  >
                    <span className="text-sm">{item.emoji}</span>
                    <span className="flex-1">{item.label}</span>
                    {item.badge && (
                      <span className="bg-red-500 text-white text-xs px-1.5 rounded-full font-mono-space">
                        {item.badge}
                      </span>
                    )}
                  </div>
                )
              })}
          </div>
        </div>
      ))}
    </nav>
  )
}
