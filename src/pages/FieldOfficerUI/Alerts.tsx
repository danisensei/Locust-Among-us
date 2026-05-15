import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { 
  Bell, ShieldAlert, AlertTriangle, Info, Search, Filter, 
  Trash2, CheckCircle2, RefreshCw, Calendar, MapPin, Inbox
} from 'lucide-react'
import { useAuthFetch, API_URL } from '@/context/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import { Tilt } from '@/components/unlumen-ui/tilt'

interface AlertData {
  id: number
  type: 'critical' | 'warning' | 'info'
  title: string
  description: string
  is_read: boolean
  created_at: string
}

export default function Alerts() {
  const authFetch = useAuthFetch()
  const [alerts, setAlerts] = useState<AlertData[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all')
  const [search, setSearch] = useState('')

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true)
      const res = await authFetch(`${API_URL}/api/alerts`)
      if (res.ok) {
        const data = await res.json()
        setAlerts(data)
      }
    } catch (err) {
      console.error('Failed to load alerts', err)
    } finally {
      setLoading(false)
    }
  }, [authFetch])

  useEffect(() => {
    fetchAlerts()
  }, [fetchAlerts])

  const filteredAlerts = alerts.filter(a => {
    const matchesFilter = filter === 'all' || a.type === filter
    const matchesSearch = a.title.toLowerCase().includes(search.toLowerCase()) || 
                          a.description.toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const stats = {
    total: alerts.length,
    critical: alerts.filter(a => a.type === 'critical').length,
    warning: alerts.filter(a => a.type === 'warning').length,
    info: alerts.filter(a => a.type === 'info').length,
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
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* ━━━ HEADER ━━━ */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent" style={{ fontFamily: "'Outfit', sans-serif" }}>
            Alerts Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            System-wide notification history and event tracking
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-9 gap-2 border-border/40 bg-background/50 backdrop-blur-md"
            onClick={fetchAlerts}
            disabled={loading}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" className="h-9 gap-2 bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Mark All Read
          </Button>
        </div>
      </div>

      {/* ━━━ STATS GRID ━━━ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Events', count: stats.total, color: 'text-foreground', bg: 'bg-muted/10', icon: Bell, glow: 'bg-muted' },
          { label: 'Critical', count: stats.critical, color: 'text-rose-500', bg: 'bg-rose-500/10', icon: ShieldAlert, glow: 'bg-rose-500' },
          { label: 'Warnings', count: stats.warning, color: 'text-orange-500', bg: 'bg-orange-500/10', icon: AlertTriangle, glow: 'bg-orange-500' },
          { label: 'System Info', count: stats.info, color: 'text-sky-500', bg: 'bg-sky-500/10', icon: Info, glow: 'bg-sky-500' },
        ].map((s, i) => {
          const Icon = s.icon
          return (
            <Tilt key={s.label} rotationFactor={5}>
              <Card className="bg-gradient-to-br from-background/80 to-muted/20 border-border/40 overflow-hidden relative group transition-all duration-300">
                <div className={`absolute -inset-1 opacity-0 group-hover:opacity-10 transition-opacity duration-500 blur-2xl ${s.glow}`} />
                <CardContent className="p-5 relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-2.5 rounded-xl ${s.bg} ring-1 ring-inset ring-foreground/5 shadow-inner`}>
                      <Icon className={`h-5 w-5 ${s.color}`} />
                    </div>
                  </div>
                  <div className="mt-1">
                    <div className="text-3xl font-bold tracking-tight">{s.count}</div>
                    <p className="text-sm font-medium text-muted-foreground mt-1 tracking-wide">{s.label}</p>
                  </div>
                </CardContent>
                {/* Gradient border line at bottom */}
                <div className={`absolute bottom-0 left-0 right-0 h-[2px] opacity-40 group-hover:opacity-100 transition-opacity ${s.glow} bg-gradient-to-r from-transparent via-current to-transparent`} style={{ color: s.color.replace('text-', '') }} />
              </Card>
            </Tilt>
          )
        })}
      </div>

      {/* ━━━ CONTROLS ━━━ */}
      <Card className="border-border/40 bg-background/40 backdrop-blur-xl">
        <CardContent className="p-3">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search alert history..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-muted/20 border border-border/40 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary transition-all"
              />
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              <Filter className="h-4 w-4 text-muted-foreground mx-1 hidden md:block" />
              {(['all', 'critical', 'warning', 'info'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setFilter(t)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-all border ${
                    filter === t 
                      ? 'bg-primary text-primary-foreground border-primary shadow-md' 
                      : 'bg-muted/20 text-muted-foreground border-border/40 hover:bg-muted/40'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ━━━ ALERT STREAM ━━━ */}
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 w-full bg-muted/20 rounded-xl animate-pulse" />
          ))
        ) : filteredAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-muted/5 rounded-2xl border border-dashed border-border/50">
            <Inbox className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium text-foreground/70">No alerts found</h3>
            <p className="text-sm text-muted-foreground max-w-xs text-center mt-1">
              {search ? `No results for "${search}". Try a different term.` : 'Your system is clear. No alerts currently match your filters.'}
            </p>
            <Button variant="link" onClick={() => {setFilter('all'); setSearch('')}}>Reset Filters</Button>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredAlerts.map((alert) => (
              <motion.div
                layout
                key={alert.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <Card className={`group relative bg-gradient-to-br from-background/90 to-muted/30 border-border/40 hover:border-border/80 transition-all duration-300 shadow-sm hover:shadow-md ${!alert.is_read ? 'ring-1 ring-primary/20' : ''}`}>
                  <CardContent className="p-0">
                    <div className="flex items-stretch min-h-[80px]">
                      {/* Left indicator bar */}
                      <div className={`w-1.5 ${
                        alert.type === 'critical' ? 'bg-rose-500' : 
                        alert.type === 'warning' ? 'bg-orange-500' : 'bg-sky-500'
                      }`} />
                      
                      <div className="flex-1 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex gap-4">
                          <div className={`mt-1 h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                            alert.type === 'critical' ? 'bg-rose-500/10 text-rose-500' : 
                            alert.type === 'warning' ? 'bg-orange-500/10 text-orange-500' : 'bg-sky-500/10 text-sky-500'
                          }`}>
                            {alert.type === 'critical' ? <ShieldAlert className="h-5 w-5" /> : 
                             alert.type === 'warning' ? <AlertTriangle className="h-5 w-5" /> : <Info className="h-5 w-5" />}
                          </div>
                          
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-semibold tracking-tight">{alert.title}</h3>
                              {!alert.is_read && <Badge className="bg-primary/20 text-primary hover:bg-primary/30 border-none text-[9px] h-4 px-1.5">NEW</Badge>}
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
                              {alert.description}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between md:justify-end gap-6 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-border/30">
                          <div className="flex flex-col items-end gap-1">
                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium">
                              <Calendar className="h-3 w-3" />
                              {formatTime(alert.created_at)}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/30" title="Mark as Read">
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10" title="Delete Alert">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* ━━━ FOOTER ━━━ */}
      <div className="text-center py-4">
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold opacity-50">
          End of Alert History
        </p>
      </div>
    </div>
  )
}
