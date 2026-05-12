import { useState, useEffect, useCallback } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Loader2, Zap, Play, MapPin, Plane, Target, RefreshCw, Activity, Battery, CheckCircle2
} from 'lucide-react'
import { useAuthFetch, API_URL } from '@/context/AuthContext'

// ── Types ────────────────────────────────────────────────────
interface DroneData {
  id: number; drone_id: string; model: string; status: string
  battery: number; lat: number | null; lon: number | null; created_at: string
}
interface ReportData {
  id: number; report_id: string; observer_name: string; zone: string
  risk_level: string; estimated_size: string | null; description: string
  status: string; lat: number | null; lon: number | null; created_at: string
}
interface MissionData {
  id: number; mission_id: string; drone_id: number; report_id: number
  mission_type: string; coverage_km: number; altitude_m: number
  status: string; notes: string | null; assigned_by: number
  started_at: string | null; completed_at: string | null; created_at: string
  drone?: DroneData; report?: ReportData
}

const statusColor = (s: string) => {
  switch (s) {
    case 'Available': return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
    case 'On Mission': return 'bg-blue-500/15 text-blue-400 border-blue-500/30'
    case 'Maintenance': return 'bg-red-500/15 text-red-400 border-red-500/30'
    case 'Charging': return 'bg-amber-500/15 text-amber-400 border-amber-500/30'
    default: return 'bg-muted text-muted-foreground border-border'
  }
}

const missionStatusColor = (s: string) => {
  switch (s) {
    case 'Assigned': return 'bg-blue-500/15 text-blue-400 border-blue-500/30'
    case 'In Progress': return 'bg-amber-500/15 text-amber-400 border-amber-500/30'
    case 'Completed': return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
    case 'Aborted': return 'bg-red-500/15 text-red-400 border-red-500/30'
    default: return 'bg-muted text-muted-foreground border-border'
  }
}

const formatTime = (iso: string) => {
  const d = new Date(iso), now = new Date()
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000)
  if (diff < 60) return 'Just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function DroneOps() {
  const authFetch = useAuthFetch()

  const [drones, setDrones] = useState<DroneData[]>([])
  const [missions, setMissions] = useState<MissionData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true)
      const [dRes, mRes] = await Promise.all([
        authFetch(`${API_URL}/api/drones`),
        authFetch(`${API_URL}/api/missions`),
      ])
      if (dRes.ok) setDrones(await dRes.json())
      if (mRes.ok) setMissions(await mRes.json())
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [authFetch])

  useEffect(() => { fetchAll() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Computed stats
  const availableDrones = drones.filter(d => d.status === 'Available')
  const onMissionDrones = drones.filter(d => d.status === 'On Mission')
  const activeMissions = missions.filter(m => m.status === 'Assigned' || m.status === 'In Progress')
  const avgBattery = drones.length > 0 ? Math.round(drones.reduce((a, d) => a + d.battery, 0) / drones.length) : 0

  return (
    <div className="w-full space-y-6" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* ━━━ HEADER ━━━ */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight flex items-center gap-3" style={{ fontFamily: "'Outfit', sans-serif" }}>
            <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20">
              <Plane className="h-6 w-6 text-sky-400" />
            </div>
            Drone Ops Center
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Real-time fleet monitoring and mission tracking (Read-only).
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchAll} disabled={loading} className="border-border/50 bg-background/50 backdrop-blur-sm">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          ⚠️ {error}
        </div>
      )}

      {/* ━━━ STATS ━━━ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-background to-muted/20 border border-border/40 hover:border-sky-500/30 transition-all group">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 group-hover:scale-110 transition-transform"><Plane className="w-4 h-4" /></div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Fleet</span>
          </div>
          <div className="text-3xl font-bold text-foreground" style={{ fontFamily: "'Outfit', sans-serif" }}>{drones.length}</div>
        </div>
        <div className="p-4 rounded-2xl bg-gradient-to-br from-background to-muted/20 border border-border/40 hover:border-emerald-500/30 transition-all group">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform"><CheckCircle2 className="w-4 h-4" /></div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Available</span>
          </div>
          <div className="text-3xl font-bold text-foreground" style={{ fontFamily: "'Outfit', sans-serif" }}>{availableDrones.length}</div>
        </div>
        <div className="p-4 rounded-2xl bg-gradient-to-br from-background to-muted/20 border border-border/40 hover:border-blue-500/30 transition-all group">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 group-hover:scale-110 transition-transform"><Activity className="w-4 h-4" /></div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">On Mission</span>
          </div>
          <div className="text-3xl font-bold text-foreground" style={{ fontFamily: "'Outfit', sans-serif" }}>{onMissionDrones.length}</div>
        </div>
        <div className="p-4 rounded-2xl bg-gradient-to-br from-background to-muted/20 border border-border/40 hover:border-amber-500/30 transition-all group">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 group-hover:scale-110 transition-transform"><Battery className="w-4 h-4" /></div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Avg Battery</span>
          </div>
          <div className="text-3xl font-bold text-foreground" style={{ fontFamily: "'Outfit', sans-serif" }}>{avgBattery}%</div>
        </div>
      </div>

      {/* ━━━ MAIN CONTENT TABS ━━━ */}
      <Tabs defaultValue="fleet" className="w-full">
        <TabsList className="bg-muted/40 p-1 border border-border/40 rounded-lg w-fit mb-4">
          <TabsTrigger value="fleet" className="rounded-md px-6 text-xs font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-sky-400 transition-all">Fleet Overview</TabsTrigger>
          <TabsTrigger value="missions" className="rounded-md px-6 text-xs font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-amber-400 transition-all">Active Missions ({activeMissions.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="fleet" className="m-0 mt-2 outline-none">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-sky-500 mb-4" />
              <p className="text-sm">Connecting to fleet network...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {drones.map(d => (
                <div key={d.id} className="group relative p-5 rounded-2xl bg-background border border-border/50 hover:border-sky-500/50 hover:shadow-[0_0_20px_-10px_rgba(14,165,233,0.3)] transition-all overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
                  
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border border-border/50 bg-muted/30">
                        <AvatarFallback className="bg-transparent text-sky-400"><Plane className="h-5 w-5" /></AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-sm">{d.drone_id}</h3>
                        <p className="text-xs text-muted-foreground">{d.model}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className={`text-[10px] uppercase px-2 py-0.5 font-semibold ${statusColor(d.status)}`}>
                      {d.status}
                    </Badge>
                  </div>

                  <div className="space-y-3 relative z-10">
                    <div>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-muted-foreground flex items-center gap-1"><Battery className="w-3 h-3" /> Power Level</span>
                        <span className={d.battery < 20 ? 'text-red-400 font-medium' : 'text-emerald-400 font-medium'}>{d.battery}%</span>
                      </div>
                      <Progress value={d.battery} className={`h-1.5 ${d.battery < 20 ? '[&>div]:bg-red-500' : d.battery < 50 ? '[&>div]:bg-amber-500' : '[&>div]:bg-emerald-500'}`} />
                    </div>
                    
                    <div className="flex items-center justify-between pt-2">
                      <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <MapPin className="w-3 h-3" />
                        {d.lat && d.lon ? `${d.lat.toFixed(4)}, ${d.lon.toFixed(4)}` : 'Position Unknown'}
                      </div>
                      <span className="text-[10px] text-muted-foreground/60">Updated {formatTime(d.created_at)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="missions" className="m-0 mt-2 outline-none">
          <div className="rounded-2xl border border-border/50 bg-background/50 backdrop-blur-md overflow-hidden">
            {missions.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center text-muted-foreground">
                <Target className="h-12 w-12 opacity-20 mb-4" />
                <p className="text-lg font-medium">No active missions</p>
              </div>
            ) : (
              <ScrollArea className="w-full">
                <div className="min-w-[800px]">
                  <div className="grid grid-cols-6 gap-4 p-4 border-b border-border/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-muted/20">
                    <div className="col-span-1">Mission ID</div>
                    <div className="col-span-1">Unit</div>
                    <div className="col-span-2">Target Report</div>
                    <div className="col-span-1">Parameters</div>
                    <div className="col-span-1">Status</div>
                  </div>
                  
                  <div className="divide-y divide-border/50">
                    {missions.map(m => (
                      <div key={m.mission_id} className="grid grid-cols-6 gap-4 p-4 items-center hover:bg-muted/10 transition-colors">
                        <div className="col-span-1 font-mono text-sm">{m.mission_id}</div>
                        
                        <div className="col-span-1 flex items-center gap-2">
                          <Plane className="w-4 h-4 text-sky-400" />
                          <span className="text-sm font-medium">{m.drone ? m.drone.drone_id : m.drone_id}</span>
                        </div>
                        
                        <div className="col-span-2">
                          {m.report ? (
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-foreground">{m.report.zone}</span>
                              <span className="text-xs text-muted-foreground font-mono">{m.report.report_id}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">Report #{m.report_id}</span>
                          )}
                        </div>
                        
                        <div className="col-span-1 flex flex-col gap-1">
                          <Badge variant="outline" className="w-fit text-[10px] bg-background">{m.mission_type}</Badge>
                          <span className="text-[10px] text-muted-foreground">{m.coverage_km}km @ {m.altitude_m}m</span>
                        </div>
                        
                        <div className="col-span-1">
                          <div className="flex flex-col gap-1 items-start">
                            <Badge variant="outline" className={`text-xs px-2.5 py-0.5 ${missionStatusColor(m.status)}`}>
                              {m.status}
                            </Badge>
                            {m.completed_at && (
                              <span className="text-[10px] text-muted-foreground">
                                Concluded {formatTime(m.completed_at)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollArea>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
