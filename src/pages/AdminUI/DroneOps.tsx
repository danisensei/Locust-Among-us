import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Loader2, Plus, Zap, CheckCircle2, XCircle, Play, MapPin, Plane, Target, RefreshCw,
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

const MISSION_TYPES = ['Survey', 'Spray', 'Monitor', 'Patrol']

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

const riskColor = (r: string) => {
  switch (r) {
    case 'Critical': return 'bg-red-500/15 text-red-400'
    case 'High': return 'bg-orange-500/15 text-orange-400'
    case 'Medium': return 'bg-yellow-500/15 text-yellow-300'
    case 'Low': return 'bg-green-500/15 text-green-400'
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

  useEffect(() => { fetchAll() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Computed stats
  const availableDrones = drones.filter(d => d.status === 'Available')
  const onMissionDrones = drones.filter(d => d.status === 'On Mission')
  const verifiedReports = reports.filter(r => r.status === 'Verified')
  const activeMissions = missions.filter(m => m.status === 'Assigned' || m.status === 'In Progress')
  const avgBattery = drones.length > 0 ? Math.round(drones.reduce((a, d) => a + d.battery, 0) / drones.length) : 0

  const stats = [
    { label: 'Total Fleet', value: drones.length, color: 'text-sky-300' },
    { label: 'On Mission', value: onMissionDrones.length, color: 'text-blue-300' },
    { label: 'Available', value: availableDrones.length, color: 'text-green-300' },
    { label: 'Active Missions', value: activeMissions.length, color: 'text-amber-300' },
  ]

  // ── Reset form ────────────────────────────────────────────
  const resetForm = () => {
    setSelDrone(''); setSelReport(''); setMissionType('Survey')
    setCoverage(10); setAltitude(500); setNotes(''); setSubmitError(null)
  }

  const resetDroneForm = () => {
    setNewDroneId(''); setNewDroneModel(''); setNewDroneBattery(100); setAddDroneError(null)
  }

  // ── Add drone ─────────────────────────────────────────────
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

  // ── Submit mission ────────────────────────────────────────
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

  // ── Update mission status ─────────────────────────────────
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Plane className="h-8 w-8 text-sky-400" />
            Drone Fleet Operations
          </h1>
          <p className="text-muted-foreground mt-2">
            Fleet management · Mission assignment · Linked to verified field reports
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={fetchAll} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </Button>

          {/* Add Drone Dialog */}
          <Dialog open={addDroneOpen} onOpenChange={(v) => { setAddDroneOpen(v); if (!v) resetDroneForm() }}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Plane className="h-4 w-4" /> Add Drone
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Plane className="h-5 w-5 text-sky-400" /> Add Drone to Fleet
                </DialogTitle>
                <DialogDescription>Register a new drone. It will be set to Available status.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label>Drone ID *</Label>
                  <Input value={newDroneId} onChange={e => setNewDroneId(e.target.value)} placeholder="e.g. DPP-Golf" className="dark:bg-input/30" />
                </div>
                <div className="space-y-2">
                  <Label>Model *</Label>
                  <Input value={newDroneModel} onChange={e => setNewDroneModel(e.target.value)} placeholder="e.g. DJI Matrice 350 RTK" className="dark:bg-input/30" />
                </div>
                <div className="space-y-2">
                  <Label>Battery Level (%)</Label>
                  <div className="flex items-center gap-3">
                    <input type="range" min={0} max={100} value={newDroneBattery} onChange={e => setNewDroneBattery(parseInt(e.target.value))} className="flex-1 accent-sky-500" />
                    <span className="text-sm font-semibold w-10 text-right">{newDroneBattery}%</span>
                  </div>
                </div>
                {addDroneError && (
                  <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">⚠️ {addDroneError}</div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setAddDroneOpen(false); resetDroneForm() }}>Cancel</Button>
                <Button onClick={handleAddDrone} disabled={addingDrone || !newDroneId.trim() || !newDroneModel.trim()} className="gap-2">
                  {addingDrone && <Loader2 className="h-4 w-4 animate-spin" />}
                  {addingDrone ? 'Adding…' : 'Add Drone'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Assign Mission Dialog */}
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm() }}>
            <DialogTrigger asChild>
              <Button className="gap-2 shadow-lg">
                <Plus className="h-4 w-4" /> Assign Mission
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-amber-400" /> Assign Drone Mission
                </DialogTitle>
                <DialogDescription>
                  Link an available drone to a verified field report for monitoring or response.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5 py-2">
                {/* Verified Report Picker */}
                <div className="space-y-2">
                  <Label>Verified Field Report *</Label>
                  <select
                    value={selReport}
                    onChange={e => setSelReport(e.target.value ? parseInt(e.target.value) : '')}
                    className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none dark:bg-input/30"
                  >
                    <option value="">Select a verified report…</option>
                    {verifiedReports.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.report_id} — {r.zone} ({r.risk_level}) {r.lat ? `📍 ${r.lat.toFixed(2)}, ${r.lon?.toFixed(2)}` : ''}
                      </option>
                    ))}
                  </select>
                  {verifiedReports.length === 0 && (
                    <p className="text-xs text-yellow-300">No verified reports available. Approve reports first.</p>
                  )}
                </div>

                {/* Report preview */}
                {selectedReport && (
                  <div className="bg-muted/40 rounded-lg p-3 border border-border space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm">{selectedReport.report_id}</span>
                      <Badge className={`text-xs ${riskColor(selectedReport.risk_level)}`}>
                        {selectedReport.risk_level}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{selectedReport.zone}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{selectedReport.description}</p>
                    {selectedReport.lat && selectedReport.lon && (
                      <p className="text-xs text-sky-400 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {selectedReport.lat.toFixed(6)}, {selectedReport.lon.toFixed(6)}
                      </p>
                    )}
                  </div>
                )}

                {/* Drone Picker */}
                <div className="space-y-2">
                  <Label>Available Drone *</Label>
                  <select
                    value={selDrone}
                    onChange={e => setSelDrone(e.target.value ? parseInt(e.target.value) : '')}
                    className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none dark:bg-input/30"
                  >
                    <option value="">Select a drone…</option>
                    {availableDrones.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.drone_id} — {d.model} (🔋 {d.battery}%)
                      </option>
                    ))}
                  </select>
                  {availableDrones.length === 0 && (
                    <p className="text-xs text-yellow-300">No drones available. All drones are on mission or in maintenance.</p>
                  )}
                </div>

                {/* Mission Type */}
                <div className="space-y-2">
                  <Label>Mission Type</Label>
                  <div className="flex flex-wrap gap-2">
                    {MISSION_TYPES.map(t => (
                      <button key={t} type="button" onClick={() => setMissionType(t)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all duration-150 ${
                          missionType === t
                            ? 'border-amber-500/60 bg-amber-500/15 text-amber-300 ring-2 ring-offset-1 ring-offset-background ring-amber-500/40 scale-105'
                            : 'border-border bg-muted/40 text-muted-foreground hover:text-foreground hover:border-border/80'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Coverage & Altitude */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Coverage Radius (km)</Label>
                    <div className="space-y-1">
                      <input type="range" min={1} max={50} value={coverage}
                        onChange={e => setCoverage(parseInt(e.target.value))}
                        className="w-full accent-amber-500"
                      />
                      <p className="text-xs text-center font-semibold text-amber-300">{coverage} km</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Operating Altitude (m)</Label>
                    <Input type="number" min={50} max={2000} value={altitude}
                      onChange={e => setAltitude(parseInt(e.target.value) || 500)}
                      className="dark:bg-input/30"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label>Notes (optional)</Label>
                  <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)}
                    placeholder="Special instructions, priorities, etc."
                    className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none resize-none dark:bg-input/30"
                  />
                </div>

                {submitError && (
                  <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                    ⚠️ {submitError}
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => { setOpen(false); resetForm() }}>Cancel</Button>
                <Button onClick={handleAssign} disabled={submitting || !selDrone || !selReport} className="gap-2">
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {submitting ? 'Assigning…' : 'Assign Mission'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><Zap className="h-5 w-5 text-sky-400" /> Fleet Status</CardTitle>
              <CardDescription>All drones · Avg battery: {avgBattery}%</CardDescription>
            </div>
          </div>
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

      {/* Missions Table */}
      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border bg-accent/30">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><Target className="h-5 w-5 text-amber-400" /> Missions</CardTitle>
              <CardDescription>{missions.length} total · {activeMissions.length} active</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {missions.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Target className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="font-medium">No missions yet</p>
              <p className="text-sm mt-1">Assign a drone to a verified field report to create a mission.</p>
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
                  <TableHead className="font-semibold text-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {missions.map(m => (
                  <TableRow key={m.mission_id} className="border-b border-border hover:bg-accent/40 transition-colors">
                    <TableCell className="font-semibold text-sm">{m.mission_id}</TableCell>
                    <TableCell className="text-sm">
                      {m.drone ? (
                        <span className="font-medium">{m.drone.drone_id}</span>
                      ) : `Drone #${m.drone_id}`}
                    </TableCell>
                    <TableCell className="text-sm">
                      {m.report ? (
                        <div>
                          <span className="font-medium">{m.report.report_id}</span>
                          <span className="text-xs text-muted-foreground ml-1">({m.report.zone})</span>
                        </div>
                      ) : `Report #${m.report_id}`}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{m.mission_type}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{m.coverage_km} km · {m.altitude_m}m</TableCell>
                    <TableCell>
                      <Badge className={`${missionStatusColor(m.status)} text-xs`}>{m.status}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatTime(m.created_at)}</TableCell>
                    <TableCell>
                      {updatingMission === m.mission_id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : m.status === 'Assigned' ? (
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                            onClick={() => updateMissionStatus(m.mission_id, 'In Progress')}>
                            <Play className="h-3 w-3" /> Start
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            onClick={() => updateMissionStatus(m.mission_id, 'Aborted')}>
                            <XCircle className="h-3 w-3" /> Abort
                          </Button>
                        </div>
                      ) : m.status === 'In Progress' ? (
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-green-400 hover:text-green-300 hover:bg-green-500/10"
                            onClick={() => updateMissionStatus(m.mission_id, 'Completed')}>
                            <CheckCircle2 className="h-3 w-3" /> Complete
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            onClick={() => updateMissionStatus(m.mission_id, 'Aborted')}>
                            <XCircle className="h-3 w-3" /> Abort
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {m.completed_at ? formatTime(m.completed_at) : '—'}
                        </span>
                      )}
                    </TableCell>
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
