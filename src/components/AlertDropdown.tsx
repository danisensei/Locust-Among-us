import { useState, useRef, useEffect } from "react"
import { Bell, AlertTriangle, ShieldAlert, Info } from "lucide-react"

type Alert = {
  id: string
  title: string
  message: string
  time: string
  type: "critical" | "warning" | "info"
  isRead: boolean
}

const MOCK_ALERTS: Alert[] = [
  {
    id: "1",
    title: "Critical Swarm Detected",
    message: "A high-density swarm has been verified in Khuzdar Valley.",
    time: "2 mins ago",
    type: "critical",
    isRead: false,
  },
  {
    id: "2",
    title: "Drone Ops Dispatched",
    message: "Drone fleet Alpha-7 is en route to Sector 4.",
    time: "15 mins ago",
    type: "info",
    isRead: false,
  },
  {
    id: "3",
    title: "High Wind Warning",
    message: "Wind patterns indicate swarm movement towards eastern crops.",
    time: "1 hour ago",
    type: "warning",
    isRead: true,
  },
]

export function AlertDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const [alerts, setAlerts] = useState<Alert[]>(MOCK_ALERTS)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const unreadCount = alerts.filter((a) => !a.isRead).length

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
    setAlerts(alerts.map((a) => ({ ...a, isRead: true })))
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
        <div className="absolute right-0 mt-2 w-80 bg-card border border-border/50 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
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
            {alerts.map((alert) => (
              <div 
                key={alert.id}
                className={`p-4 border-b border-border/50 last:border-0 hover:bg-accent/30 transition-colors cursor-pointer flex gap-3 ${!alert.isRead ? 'bg-primary/5' : ''}`}
                onClick={() => {
                  setAlerts(alerts.map(a => a.id === alert.id ? { ...a, isRead: true } : a))
                }}
              >
                <div className="mt-0.5">
                  {alert.type === "critical" && <ShieldAlert className="h-4 w-4 text-rose-500" />}
                  {alert.type === "warning" && <AlertTriangle className="h-4 w-4 text-orange-500" />}
                  {alert.type === "info" && <Info className="h-4 w-4 text-sky-500" />}
                </div>
                <div className="flex-1 space-y-1">
                  <p className={`text-sm font-medium leading-none ${!alert.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {alert.title}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {alert.message}
                  </p>
                  <p className="text-[10px] text-muted-foreground/60 font-medium pt-1">
                    {alert.time}
                  </p>
                </div>
                {!alert.isRead && (
                  <div className="h-2 w-2 rounded-full bg-primary mt-1" />
                )}
              </div>
            ))}
          </div>
          
          <div className="p-2 bg-muted/10 border-t border-border/50">
            <button className="w-full text-center text-xs py-2 font-medium text-muted-foreground hover:text-foreground transition-colors">
              View All Alerts
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
