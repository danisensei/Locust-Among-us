import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Loader2, Zap, MapPin, Plane, Target, RefreshCw } from 'lucide-react'
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
    case 'Available': return 'bg-green-500/15 text-green-300'
    case 'On Mission': return 'bg-blue-500/15 text-blue-300'
    case 'Maintenance': return 'bg-red-500/15 text-red-400'
    case 'Charging': return 'bg-yellow-500/15 text-yellow-300'
    default: return 'bg-muted text-muted-foreground'
  }
}

const missionStatusColor = (s: string) => {
  switch (s) {
    case 'Assigned': return 'bg-blue-500/15 text-blue-300'
    case 'In Progress': return 'bg-amber-500/15 text-amber-300'
    case 'Completed': return 'bg-green-500/15 text-green-300'
    case 'Aborted': return 'bg-red-500/15 text-red-400'
    default: return 'bg-muted text-muted-foreground'
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

  const onMissionDrones = drones.filter(d => d.status === 'On Mission')
  const availableDrones = drones.filter(d => d.status === 'Available')
  const activeMissions = missions.filter(m => m.status === 'Assigned' || m.status === 'In Progress')
  const avgBattery = drones.length > 0 ? Math.round(drones.reduce((a, d) => a + d.battery, 0) / drones.length) : 0

  const stats = [
    { label: 'Total Fleet', value: drones.length, color: 'text-sky-300' },
    { label: 'On Mission', value: onMissionDrones.length, color: 'text-blue-300' },
    { label: 'Available', value: availableDrones.length, color: 'text-green-300' },
    { label: 'Active Missions', value: activeMissions.length, color: 'text-amber-300' },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Plane className="h-8 w-8 text-sky-400" />
            Drone Fleet Operations
          </h1>
          <p className="text-muted-foreground mt-2">
            Fleet status · Mission tracking · Read-only view
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={fetchAll} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <Card key={s.label} className="hover:shadow-md transition-shadow duration-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Fleet Status Table */}
      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border bg-accent/30">
          <CardTitle className="flex items-center gap-2"><Zap className="h-5 w-5 text-sky-400" /> Fleet Status</CardTitle>
          <CardDescription>All drones · Avg battery: {avgBattery}%</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" /><p className="text-sm text-muted-foreground">Loading fleet…</p></div>
          ) : error ? (
            <div className="p-8 text-center text-red-400"><p>⚠️ {error}</p><Button variant="outline" size="sm" className="mt-3" onClick={fetchAll}>Retry</Button></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border bg-muted/40">
                  <TableHead className="font-semibold text-foreground">Drone ID</TableHead>
                  <TableHead className="font-semibold text-foreground">Model</TableHead>
                  <TableHead className="font-semibold text-foreground">Status</TableHead>
                  <TableHead className="font-semibold text-foreground">Battery</TableHead>
                  <TableHead className="font-semibold text-foreground">Position</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {drones.map(d => (
                  <TableRow key={d.id} className="border-b border-border hover:bg-accent/40 transition-colors">
                    <TableCell className="font-semibold">{d.drone_id}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{d.model}</TableCell>
                    <TableCell><Badge className={`${statusColor(d.status)} text-xs`}>{d.status}</Badge></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                          <div className={`h-full transition-all rounded-full ${
                            d.battery > 60 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                            d.battery > 30 ? 'bg-gradient-to-r from-yellow-500 to-amber-500' :
                            'bg-gradient-to-r from-red-500 to-orange-500'
                          }`} style={{ width: `${d.battery}%` }} />
                        </div>
                        <span className="text-sm font-medium">{d.battery}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {d.lat && d.lon ? (
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3 text-sky-400" />{d.lat.toFixed(4)}, {d.lon.toFixed(4)}</span>
                      ) : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Missions Table (read-only) */}
      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border bg-accent/30">
          <CardTitle className="flex items-center gap-2"><Target className="h-5 w-5 text-amber-400" /> Missions</CardTitle>
          <CardDescription>{missions.length} total · {activeMissions.length} active</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {missions.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Target className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="font-medium">No missions yet</p>
              <p className="text-sm mt-1">Missions assigned by Admin or Analyst will appear here.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border bg-muted/40">
                  <TableHead className="font-semibold text-foreground">Mission</TableHead>
                  <TableHead className="font-semibold text-foreground">Drone</TableHead>
                  <TableHead className="font-semibold text-foreground">Report</TableHead>
                  <TableHead className="font-semibold text-foreground">Type</TableHead>
                  <TableHead className="font-semibold text-foreground">Coverage</TableHead>
                  <TableHead className="font-semibold text-foreground">Status</TableHead>
                  <TableHead className="font-semibold text-foreground">Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {missions.map(m => (
                  <TableRow key={m.mission_id} className="border-b border-border hover:bg-accent/40 transition-colors">
                    <TableCell className="font-semibold text-sm">{m.mission_id}</TableCell>
                    <TableCell className="text-sm">{m.drone ? m.drone.drone_id : `Drone #${m.drone_id}`}</TableCell>
                    <TableCell className="text-sm">
                      {m.report ? (
                        <div>
                          <span className="font-medium">{m.report.report_id}</span>
                          <span className="text-xs text-muted-foreground ml-1">({m.report.zone})</span>
                        </div>
                      ) : `Report #${m.report_id}`}
                    </TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{m.mission_type}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{m.coverage_km} km · {m.altitude_m}m</TableCell>
                    <TableCell><Badge className={`${missionStatusColor(m.status)} text-xs`}>{m.status}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatTime(m.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
