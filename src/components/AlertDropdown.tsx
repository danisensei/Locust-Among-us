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
        <div className="absolute right-0 mt-2 w-80 bg-card border border-border/50 rounded-xl shadow-xl z-[1010] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-4 py-3 border-b border-border/50 bg-muted/20 flex items-center justify-between">
            <h3 className="font-semibold text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                className="text-[11px] text-primary hover:underline font-medium"
              >
                Mark all as read
              </button>
            )}
          </div>
          
          <div className="max-h-80 overflow-y-auto">
            {alerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <div className="h-12 w-12 rounded-full bg-muted/30 flex items-center justify-center mb-3">
                  <Inbox className="h-6 w-6 text-muted-foreground/50" />
                </div>
                <p className="text-sm font-medium text-foreground/80">No notifications</p>
                <p className="text-xs text-muted-foreground mt-1">
                  You're all caught up! New alerts will appear here.
                </p>
              </div>
            ) : (
              alerts.map((alert) => (
                <div 
                  key={alert.id}
                  className={`p-4 border-b border-border/50 last:border-0 hover:bg-accent/30 transition-colors cursor-pointer flex gap-3 ${!alert.is_read ? 'bg-primary/5' : ''}`}
                  onClick={() => {
                    setAlerts(alerts.map(a => a.id === alert.id ? { ...a, is_read: true } : a))
                  }}
                >
                  <div className="mt-0.5">
                    {alert.type === "critical" && <ShieldAlert className="h-4 w-4 text-rose-500" />}
                    {alert.type === "warning" && <AlertTriangle className="h-4 w-4 text-orange-500" />}
                    {alert.type === "info" && <Info className="h-4 w-4 text-sky-500" />}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className={`text-sm font-medium leading-none ${!alert.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {alert.title}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {alert.description}
                    </p>
                    <p className="text-[10px] text-muted-foreground/60 font-medium pt-1">
                      {formatTime(alert.created_at)}
                    </p>
                  </div>
                  {!alert.is_read && (
                    <div className="h-2 w-2 rounded-full bg-primary mt-1" />
                  )}
                </div>
              ))
            )}
          </div>
          
          <div className="p-2 bg-muted/10 border-t border-border/50">
            <button 
              onClick={() => {
                onNavigate?.('alerts')
                setIsOpen(false)
              }}
              className="w-full text-center text-xs py-2 font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              View All Alerts
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
