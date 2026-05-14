import { useState, useEffect, useCallback } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger,
} from '@/components/ui/dialog'
import {
  Loader2, Plus, Zap, CheckCircle2, XCircle, Play, MapPin, Plane, Target, RefreshCw, Activity, Battery, ShieldAlert
} from 'lucide-react'
import { useAuthFetch, API_URL } from '@/context/AuthContext'
import { Separator } from '@/components/ui/separator'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment } from '@react-three/drei'
import DroneModel from '@/components/ui/DroneModel'

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

const MISSION_TYPES = ['Survey', 'Spray', 'Monitor', 'Patrol']

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
  const [reports, setReports] = useState<ReportData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Assign dialog
  const [open, setOpen] = useState(false)
  const [selDrone, setSelDrone] = useState<number | ''>('')
  const [selReport, setSelReport] = useState<number | ''>('')
  const [missionType, setMissionType] = useState('Survey')
  const [coverage, setCoverage] = useState(10)
  const [altitude, setAltitude] = useState(500)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Status update loading
  const [updatingMission, setUpdatingMission] = useState<string | null>(null)

  // Add drone dialog
  const [addDroneOpen, setAddDroneOpen] = useState(false)
  const [newDroneId, setNewDroneId] = useState('')
  const [newDroneModel, setNewDroneModel] = useState('')
  const [newDroneBattery, setNewDroneBattery] = useState(100)
  const [addingDrone, setAddingDrone] = useState(false)
  const [addDroneError, setAddDroneError] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true)
      const [dRes, mRes, rRes] = await Promise.all([
        authFetch(`${API_URL}/api/drones`),
        authFetch(`${API_URL}/api/missions`),
        authFetch(`${API_URL}/api/reports`),
      ])
      if (dRes.ok) setDrones(await dRes.json())
      if (mRes.ok) setMissions(await mRes.json())
      if (rRes.ok) setReports(await rRes.json())
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [authFetch])

  useEffect(() => { fetchAll() }, [])

  // Computed stats
  const availableDrones = drones.filter(d => d.status === 'Available')
  const onMissionDrones = drones.filter(d => d.status === 'On Mission')
  const verifiedReports = reports.filter(r => r.status === 'Verified')
  const activeMissions = missions.filter(m => m.status === 'Assigned' || m.status === 'In Progress')
  const avgBattery = drones.length > 0 ? Math.round(drones.reduce((a, d) => a + d.battery, 0) / drones.length) : 0

  const resetForm = () => {
    setSelDrone(''); setSelReport(''); setMissionType('Survey')
    setCoverage(10); setAltitude(500); setNotes(''); setSubmitError(null)
  }

  const resetDroneForm = () => {
    setNewDroneId(''); setNewDroneModel(''); setNewDroneBattery(100); setAddDroneError(null)
  }

  const handleAddDrone = async () => {
    if (!newDroneId.trim() || !newDroneModel.trim()) { setAddDroneError('Drone ID and Model are required'); return }
    setAddingDrone(true); setAddDroneError(null)
    try {
      const res = await authFetch(`${API_URL}/api/drones`, {
        method: 'POST',
        body: JSON.stringify({ drone_id: newDroneId.trim(), model: newDroneModel.trim(), battery: newDroneBattery }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || `Failed (${res.status})`)
      }
      setAddDroneOpen(false); resetDroneForm(); await fetchAll()
    } catch (e) {
      setAddDroneError(e instanceof Error ? e.message : 'Failed')
    } finally {
      setAddingDrone(false)
    }
  }

  const handleAssign = async () => {
    if (!selDrone || !selReport) { setSubmitError('Select a drone and a report'); return }
    setSubmitting(true); setSubmitError(null)
    try {
      const res = await authFetch(`${API_URL}/api/missions`, {
        method: 'POST',
        body: JSON.stringify({
          drone_id: selDrone, report_id: selReport,
          mission_type: missionType, coverage_km: coverage,
          altitude_m: altitude, notes,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || `Failed (${res.status})`)
      }
      setOpen(false); resetForm(); await fetchAll()
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Failed')
    } finally {
      setSubmitting(false)
    }
  }

  const updateMissionStatus = async (missionId: string, newStatus: string) => {
    setUpdatingMission(missionId)
    try {
      const res = await authFetch(`${API_URL}/api/missions/${missionId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        alert(err.detail || 'Failed to update')
      }
      await fetchAll()
    } finally {
      setUpdatingMission(null)
    }
  }

  const selectedReport = verifiedReports.find(r => r.id === selReport)

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
            Real-time fleet monitoring and mission control.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchAll} disabled={loading} className="border-border/50 bg-background/50 backdrop-blur-sm">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Refresh
          </Button>

          {/* Add Drone Dialog */}
          <Dialog open={addDroneOpen} onOpenChange={(v) => { setAddDroneOpen(v); if (!v) resetDroneForm() }}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="border-sky-500/30 text-sky-400 bg-sky-500/10 hover:bg-sky-500/20 hover:text-sky-300 transition-all">
                <Plus className="h-4 w-4 mr-2" /> Add Drone
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-xl border-border/50">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Plane className="h-5 w-5 text-sky-400" /> Register Drone
                </DialogTitle>
                <DialogDescription>Add a new UAV to the active fleet.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Drone Designation *</Label>
                  <Input value={newDroneId} onChange={e => setNewDroneId(e.target.value)} placeholder="e.g. UAV-007" className="bg-muted/50 border-border/50" />
                </div>
                <div className="space-y-2">
                  <Label>Hardware Model *</Label>
                  <Input value={newDroneModel} onChange={e => setNewDroneModel(e.target.value)} placeholder="e.g. DJI Matrice" className="bg-muted/50 border-border/50" />
                </div>
                <div className="space-y-2">
                  <Label className="flex justify-between"><span>Initial Battery</span> <span className="text-sky-400 font-mono">{newDroneBattery}%</span></Label>
                  <Slider min={0} max={100} value={[newDroneBattery]} onValueChange={e => setNewDroneBattery(e[0])} className="w-full" />
                </div>
                {addDroneError && (
                  <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">⚠️ {addDroneError}</div>
                )}
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => { setAddDroneOpen(false); resetDroneForm() }}>Cancel</Button>
                <Button onClick={handleAddDrone} disabled={addingDrone || !newDroneId.trim() || !newDroneModel.trim()} className="bg-sky-500 hover:bg-sky-600 text-white">
                  {addingDrone && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Register
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Assign Mission Dialog */}
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm() }}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/20 transition-all border-none">
                <Target className="h-4 w-4 mr-2" /> Dispatch
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl bg-background/95 backdrop-blur-xl border-border/50 max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-xl" style={{ fontFamily: "'Outfit', sans-serif" }}>
                  <Target className="h-5 w-5 text-amber-500" /> Dispatch Drone
                </DialogTitle>
                <DialogDescription>Assign an available drone to investigate a verified threat zone.</DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <div className="space-y-3">
                  <Label>Target Zone (Verified Report) *</Label>
                  <Select value={selReport ? selReport.toString() : ""} onValueChange={(val) => setSelReport(parseInt(val))}>
                    <SelectTrigger className="h-10 w-full rounded-md border border-border/50 bg-muted/30 px-3 text-sm focus-visible:ring-1 focus-visible:ring-amber-500 transition-all">
                      <SelectValue placeholder="Select a target..." />
                    </SelectTrigger>
                    <SelectContent>
                      {verifiedReports.map(r => (
                        <SelectItem key={r.id} value={r.id.toString()}>
                          {r.report_id} — {r.zone} ({r.risk_level})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {verifiedReports.length === 0 && <p className="text-xs text-amber-400">No verified reports available.</p>}
                  
                  {selectedReport && (
                    <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-mono text-xs text-amber-400">{selectedReport.report_id}</span>
                        <Badge variant="outline" className="border-amber-500/30 text-amber-400 bg-amber-500/10 text-[10px]">{selectedReport.risk_level} Risk</Badge>
                      </div>
                      <p className="text-sm">{selectedReport.zone}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">{selectedReport.description}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <Label>Available Drone *</Label>
                  <Select value={selDrone ? selDrone.toString() : ""} onValueChange={(val) => setSelDrone(parseInt(val))}>
                    <SelectTrigger className="h-10 w-full rounded-md border border-border/50 bg-muted/30 px-3 text-sm focus-visible:ring-1 focus-visible:ring-sky-500 transition-all">
                      <SelectValue placeholder={availableDrones.length > 0 ? "Select unit..." : "No units available"} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableDrones.map(d => (
                        <SelectItem key={d.id} value={d.id.toString()}>
                          {d.drone_id} — {d.model} (🔋 {d.battery}%)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label>Mission Protocol</Label>
                  <div className="flex flex-wrap gap-2">
                    {MISSION_TYPES.map(t => (
                      <button key={t} type="button" onClick={() => setMissionType(t)}
                        className={`px-4 py-2 rounded-md text-xs font-medium transition-all cursor-pointer ${
                          missionType === t
                            ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                            : 'bg-muted/50 text-muted-foreground hover:bg-muted border border-border/50'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="flex justify-between text-xs"><span>Coverage Area</span><span className="text-amber-500">{coverage} km²</span></Label>
                    <Slider min={1} max={50} value={[coverage]} onValueChange={e => setCoverage(e[0])} className="w-full" />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-xs">Flight Altitude (m)</Label>
                    <Input type="number" min={50} max={2000} value={altitude} onChange={e => setAltitude(parseInt(e.target.value) || 500)} className="bg-muted/50 border-border/50 h-9" />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-xs">Operational Notes</Label>
                  <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)}
                    className="w-full rounded-md border border-border/50 bg-muted/30 px-3 py-2 text-sm focus-visible:ring-1 focus-visible:ring-amber-500 outline-none resize-none"
                    placeholder="Enter special instructions..."
                  />
                </div>

                {submitError && (
                  <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">⚠️ {submitError}</div>
                )}
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => { setOpen(false); resetForm() }}>Cancel</Button>
                <Button onClick={handleAssign} disabled={submitting || !selDrone || !selReport} className="bg-amber-500 hover:bg-amber-600 text-white">
                  {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Launch Drone
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* ━━━ STATS ━━━ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-background to-muted/20 border border-border/40 hover:border-sky-500/30 transition-all group cursor-pointer">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 group-hover:scale-110 transition-transform"><Plane className="w-4 h-4" /></div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Fleet</span>
          </div>
          <div className="text-3xl font-bold text-foreground" style={{ fontFamily: "'Outfit', sans-serif" }}>{drones.length}</div>
        </div>
        <div className="p-4 rounded-2xl bg-gradient-to-br from-background to-muted/20 border border-border/40 hover:border-emerald-500/30 transition-all group cursor-pointer">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform"><CheckCircle2 className="w-4 h-4" /></div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Available</span>
          </div>
          <div className="text-3xl font-bold text-foreground" style={{ fontFamily: "'Outfit', sans-serif" }}>{availableDrones.length}</div>
        </div>
        <div className="p-4 rounded-2xl bg-gradient-to-br from-background to-muted/20 border border-border/40 hover:border-blue-500/30 transition-all group cursor-pointer">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 group-hover:scale-110 transition-transform"><Activity className="w-4 h-4" /></div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">On Mission</span>
          </div>
          <div className="text-3xl font-bold text-foreground" style={{ fontFamily: "'Outfit', sans-serif" }}>{onMissionDrones.length}</div>
        </div>
        <div className="p-4 rounded-2xl bg-gradient-to-br from-background to-muted/20 border border-border/40 hover:border-amber-500/30 transition-all group cursor-pointer">
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
          <TabsTrigger value="fleet" className="rounded-md px-6 text-xs font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-sky-400 transition-all cursor-pointer">Fleet Overview</TabsTrigger>
          <TabsTrigger value="missions" className="rounded-md px-6 text-xs font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-amber-400 transition-all cursor-pointer">Active Missions ({activeMissions.length})</TabsTrigger>
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
                <div key={d.id} className="group relative p-5 rounded-2xl bg-background border border-border/50 hover:border-sky-500/50 hover:shadow-[0_0_20px_-10px_rgba(14,165,233,0.3)] transition-all overflow-hidden cursor-pointer">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
                  
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="h-16 w-16 rounded-xl border border-border/50 bg-muted/10 overflow-hidden relative group-hover:border-sky-500/30 transition-all">
                        <Canvas camera={{ position: [2.5, 1.5, 2.5], fov: 45 }}>
                          <ambientLight intensity={0.5} />
                          <directionalLight position={[10, 10, 5]} intensity={1} />
                          <Environment preset="city" />
                          <OrbitControls enableZoom={false} autoRotate={d.status === 'Available'} autoRotateSpeed={2} />
                          <DroneModel status={d.status} />
                        </Canvas>
                      </div>
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
                <p className="text-sm mt-1">Dispatch a drone to begin operations.</p>
              </div>
            ) : (
              <ScrollArea className="w-full">
                <div className="min-w-[800px]">
                  <div className="grid grid-cols-7 gap-4 p-4 border-b border-border/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-muted/20">
                    <div className="col-span-1">Mission ID</div>
                    <div className="col-span-1">Unit</div>
                    <div className="col-span-2">Target Report</div>
                    <div className="col-span-1">Parameters</div>
                    <div className="col-span-1">Status</div>
                    <div className="col-span-1 text-right">Command</div>
                  </div>
                  
                  <div className="divide-y divide-border/50">
                    {missions.map(m => (
                      <div key={m.mission_id} className="grid grid-cols-7 gap-4 p-4 items-center hover:bg-muted/10 transition-colors cursor-pointer">
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
                          <Badge variant="outline" className={`text-xs px-2.5 py-0.5 ${missionStatusColor(m.status)}`}>
                            {m.status}
                          </Badge>
                        </div>
                        
                        <div className="col-span-1 flex justify-end gap-2">
                          {updatingMission === m.mission_id ? (
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          ) : m.status === 'Assigned' ? (
                            <>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10" onClick={() => updateMissionStatus(m.mission_id, 'In Progress')} title="Commence Operation">
                                <Play className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10" onClick={() => updateMissionStatus(m.mission_id, 'Aborted')} title="Abort Mission">
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          ) : m.status === 'In Progress' ? (
                            <>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10" onClick={() => updateMissionStatus(m.mission_id, 'Completed')} title="Mark Completed">
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10" onClick={() => updateMissionStatus(m.mission_id, 'Aborted')} title="Abort Mission">
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <span className="text-[10px] text-muted-foreground border border-border/50 px-2 py-1 rounded-md bg-muted/20">
                              {m.completed_at ? formatTime(m.completed_at) : 'Concluded'}
                            </span>
                          )}
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
