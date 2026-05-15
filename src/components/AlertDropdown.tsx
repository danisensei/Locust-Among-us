import { useState, useRef, useEffect, useCallback } from "react"
import { Bell, AlertTriangle, ShieldAlert, Info, Inbox } from "lucide-react"
import { useAuthFetch, API_URL } from "@/context/AuthContext"

type Alert = {
  id: number
  type: "critical" | "warning" | "info"
  title: string
  description: string
  is_read: boolean
  created_at: string
}

export function AlertDropdown({ onNavigate }: { onNavigate?: (tab: string) => void }) {
  const authFetch = useAuthFetch()
  const [isOpen, setIsOpen] = useState(false)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const dropdownRef = useRef<HTMLDivElement>(null)

  const unreadCount = alerts.filter((a) => !a.is_read).length

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await authFetch(`${API_URL}/api/alerts`)
      if (res.ok) {
        const data = await res.json()
        setAlerts(data)
      }
    } catch (err) {
      console.error('Failed to fetch alerts', err)
    }
  }, [authFetch])

  // Fetch alerts on mount and every 10 seconds
  useEffect(() => {
    fetchAlerts()
    const interval = setInterval(fetchAlerts, 10000)
    return () => clearInterval(interval)
  }, [fetchAlerts])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const markAllAsRead = () => {
    // In a real app, you'd call a backend endpoint here
    setAlerts(alerts.map((a) => ({ ...a, is_read: true })))
  }

  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleString('en-PK', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-accent/50 text-muted-foreground hover:text-foreground transition-colors group"
      >
        {unreadCount > 0 && (
          <>
            <div className="absolute top-1 right-1.5 h-2.5 w-2.5 rounded-full bg-rose-500 animate-pulse border-2 border-background z-10" />
            <div className="absolute inset-0 bg-rose-500/10 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
          </>
        )}
        <Bell className="h-5 w-5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-4 w-96 bg-card/98 backdrop-blur-xl border border-border shadow-[0_20px_50px_-12px_rgba(0,0,0,0.3)] z-[5000] rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-top-4 duration-300 origin-top-right">
          <div className="px-5 py-4 border-b border-border/40 bg-muted/20 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm">Notifications</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">Real-time alerts and system updates</p>
            </div>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                className="text-[11px] text-primary hover:text-primary/80 font-bold"
              >
                Clear All
              </button>
            )}
          </div>
          
          <div className="max-h-[28rem] overflow-y-auto">
            {alerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                <div className="h-14 w-14 rounded-2xl bg-muted/20 flex items-center justify-center mb-4">
                  <Inbox className="h-7 w-7 text-muted-foreground/30" />
                </div>
                <p className="text-sm font-bold text-foreground">No new notifications</p>
                <p className="text-xs text-muted-foreground mt-1">
                  You're all caught up! New events will appear here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/10">
                {alerts.map((alert) => (
                  <div 
                    key={alert.id}
                    className={`p-4 hover:bg-accent/40 transition-all cursor-pointer flex gap-4 relative group/item ${!alert.is_read ? 'bg-primary/[0.02]' : ''}`}
                    onClick={() => {
                      setAlerts(alerts.map(a => a.id === alert.id ? { ...a, is_read: true } : a))
                    }}
                  >
                    {!alert.is_read && (
                      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary" />
                    )}
                    
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                      alert.type === 'critical' ? 'bg-rose-500/10 text-rose-500' :
                      alert.type === 'warning' ? 'bg-amber-500/10 text-amber-500' :
                      'bg-sky-500/10 text-sky-500'
                    }`}>
                      {alert.type === "critical" && <ShieldAlert className="h-5 w-5" />}
                      {alert.type === "warning" && <AlertTriangle className="h-5 w-5" />}
                      {alert.type === "info" && <Info className="h-5 w-5" />}
                    </div>
                    
                    <div className="flex-1 space-y-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-sm font-semibold truncate ${!alert.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {alert.title}
                        </p>
                        <span className="text-[10px] text-muted-foreground/50 font-medium whitespace-nowrap">
                          {formatTime(alert.created_at).split(',')[1]}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground/70 line-clamp-2">
                        {alert.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="p-3 bg-muted/10 border-t border-border/40">
            <button 
              onClick={() => {
                onNavigate?.('alerts')
                setIsOpen(false)
              }}
              className="w-full text-center text-xs py-2.5 font-bold text-primary hover:bg-primary/5 rounded-xl transition-all"
            >
              View All Alerts
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
