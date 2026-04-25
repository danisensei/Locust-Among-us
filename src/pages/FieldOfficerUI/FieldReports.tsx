import { useState, useEffect, useRef, useCallback } from 'react'
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
import { CheckCircle2, Clock, Plus, MapPin, Keyboard, X, Loader2 } from 'lucide-react'
import { useAuthFetch, API_URL } from '@/context/AuthContext'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// ── Constants ────────────────────────────────────────────────
const ZONES = [
  'Khuzdar Valley', 'Quetta', 'Jacobabad Plains', 'D.I. Khan',
  'Thar Desert', 'Cholistan Desert', 'Dera Ghazi Khan',
  'Bahawalpur', 'Lasbela', 'Turbat', 'Gwadar', 'Nushki',
  'Sibi', 'Nasirabad', 'Sukkur', 'Rahimyar Khan',
]

const RISK_LEVELS = [
  { value: 'Critical', color: 'bg-red-500/15 text-red-400 border-red-500/30 hover:bg-red-500/25' },
  { value: 'High',     color: 'bg-orange-500/15 text-orange-400 border-orange-500/30 hover:bg-orange-500/25' },
  { value: 'Medium',   color: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30 hover:bg-yellow-500/25' },
  { value: 'Low',      color: 'bg-green-500/15 text-green-400 border-green-500/30 hover:bg-green-500/25' },
]

const SIZE_OPTIONS = [
  { value: 'Small',   label: 'Small (< 1 km²)' },
  { value: 'Medium',  label: 'Medium (1–5 km²)' },
  { value: 'Large',   label: 'Large (5–20 km²)' },
  { value: 'Massive', label: 'Massive (> 20 km²)' },
]

// ── Types ────────────────────────────────────────────────────
interface ReportData {
  id: number
  report_id: string
  observer_name: string
  zone: string
  risk_level: string
  estimated_size: string | null
  description: string
  status: string
  lat: number | null
  lon: number | null
  created_at: string
}

// ── Map Picker Component ─────────────────────────────────────
function MapPicker({ lat, lon, onChange }: {
  lat: number | null
  lon: number | null
  onChange: (lat: number, lon: number) => void
}) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return

    const map = L.map(mapRef.current).setView([30.2, 69.3], 5)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(map)

    // Place initial marker if coords exist
    if (lat && lon) {
      const marker = L.marker([lat, lon]).addTo(map)
      markerRef.current = marker
      map.setView([lat, lon], 8)
    }

    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat: newLat, lng: newLon } = e.latlng
      if (markerRef.current) {
        markerRef.current.setLatLng([newLat, newLon])
      } else {
        markerRef.current = L.marker([newLat, newLon]).addTo(map)
      }
      onChange(parseFloat(newLat.toFixed(6)), parseFloat(newLon.toFixed(6)))
    })

    mapInstance.current = map

    // Fix tile rendering after dialog animation
    setTimeout(() => map.invalidateSize(), 300)

    return () => {
      map.remove()
      mapInstance.current = null
      markerRef.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Update marker when lat/lon change externally
  useEffect(() => {
    if (!mapInstance.current) return
    if (lat && lon) {
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lon])
      } else {
        markerRef.current = L.marker([lat, lon]).addTo(mapInstance.current)
      }
    }
  }, [lat, lon])

  return (
    <div ref={mapRef} className="w-full h-64 rounded-lg border border-border overflow-hidden" />
  )
}

// ── Main Component ───────────────────────────────────────────
export default function FieldReports() {
  const authFetch = useAuthFetch()

  // Reports list
  const [reports, setReports] = useState<ReportData[]>([])
  const [loadingReports, setLoadingReports] = useState(true)
  const [listError, setListError] = useState<string | null>(null)

  // Dialog state
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  // Form state
  const [zone, setZone] = useState('')
  const [riskLevel, setRiskLevel] = useState('')
  const [estimatedSize, setEstimatedSize] = useState('')
  const [description, setDescription] = useState('')
  const [lat, setLat] = useState<number | null>(null)
  const [lon, setLon] = useState<number | null>(null)
  const [locationMode, setLocationMode] = useState<'map' | 'manual'>('map')

  // ── Fetch reports ──────────────────────────────────────────
  const fetchReports = useCallback(async () => {
    try {
      setLoadingReports(true)
      const res = await authFetch(`${API_URL}/api/reports`)
      if (!res.ok) throw new Error(`Failed (${res.status})`)
      setReports(await res.json())
      setListError(null)
    } catch (err) {
      setListError(err instanceof Error ? err.message : 'Failed to load reports')
    } finally {
      setLoadingReports(false)
    }
  }, [authFetch])

  useEffect(() => { fetchReports() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Reset form ─────────────────────────────────────────────
  const resetForm = () => {
    setZone('')
    setRiskLevel('')
    setEstimatedSize('')
    setDescription('')
    setLat(null)
    setLon(null)
    setLocationMode('map')
    setSubmitError(null)
    setSubmitSuccess(false)
  }

  // ── Submit report ──────────────────────────────────────────
  const handleSubmit = async () => {
    if (!zone || !riskLevel || !description) {
      setSubmitError('Please fill in Zone, Risk Level, and Description.')
      return
    }

    setSubmitting(true)
    setSubmitError(null)
    try {
      const body: Record<string, any> = {
        zone,
        risk_level: riskLevel,
        description,
      }
      if (estimatedSize) body.estimated_size = estimatedSize
      if (lat !== null && lon !== null) {
        body.lat = lat
        body.lon = lon
      }

      const res = await authFetch(`${API_URL}/api/reports`, {
        method: 'POST',
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || `Server error (${res.status})`)
      }

      setSubmitSuccess(true)
      await fetchReports()
      setTimeout(() => {
        setOpen(false)
        resetForm()
      }, 1200)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Submission failed')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Helpers ────────────────────────────────────────────────
  const formatTime = (iso: string) => {
    const d = new Date(iso)
    const now = new Date()
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000)
    if (diff < 60) return 'Just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  }

  const riskBadgeColor = (risk: string) => {
    switch (risk) {
      case 'Critical': return 'bg-red-500/15 text-red-400'
      case 'High':     return 'bg-orange-500/15 text-orange-400'
      case 'Medium':   return 'bg-yellow-500/15 text-yellow-300'
      case 'Low':      return 'bg-green-500/15 text-green-400'
      default:         return 'bg-muted text-muted-foreground'
    }
  }

  return (
    <div className="space-y-8">
      {/* Header + New Report button */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Field Reports</h1>
          <p className="text-muted-foreground mt-2">
            Submit and track field observations · Location-tagged · Verified by analysts
          </p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm() }}>
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-lg">
              <Plus className="h-4 w-4" />
              New Report
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg">Submit Field Report</DialogTitle>
              <DialogDescription>
                Record your observation. Location can be set by tapping the map or entering coordinates.
              </DialogDescription>
            </DialogHeader>

            {submitSuccess ? (
              <div className="py-8 text-center space-y-3">
                <CheckCircle2 className="h-12 w-12 text-green-400 mx-auto" />
                <p className="text-lg font-semibold text-green-400">Report Submitted!</p>
                <p className="text-sm text-muted-foreground">Your report has been queued for verification.</p>
              </div>
            ) : (
              <div className="space-y-5 py-2">
                {/* Zone */}
                <div className="space-y-2">
                  <Label htmlFor="zone">Zone *</Label>
                  <select
                    id="zone"
                    value={zone}
                    onChange={(e) => setZone(e.target.value)}
                    className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none dark:bg-input/30"
                  >
                    <option value="" disabled>Select zone…</option>
                    {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
                  </select>
                </div>

                {/* Risk Level */}
                <div className="space-y-2">
                  <Label>Risk Level *</Label>
                  <div className="flex flex-wrap gap-2">
                    {RISK_LEVELS.map(rl => (
                      <button
                        key={rl.value}
                        type="button"
                        onClick={() => setRiskLevel(rl.value)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all duration-150 ${
                          riskLevel === rl.value
                            ? `${rl.color} ring-2 ring-offset-1 ring-offset-background ring-current scale-105`
                            : `${rl.color} opacity-60 hover:opacity-100`
                        }`}
                      >
                        {rl.value}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Estimated Size */}
                <div className="space-y-2">
                  <Label htmlFor="size">Estimated Swarm Size</Label>
                  <select
                    id="size"
                    value={estimatedSize}
                    onChange={(e) => setEstimatedSize(e.target.value)}
                    className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none dark:bg-input/30"
                  >
                    <option value="">Unknown / Not estimated</option>
                    {SIZE_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="desc">Description *</Label>
                  <textarea
                    id="desc"
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe what you observed — swarm direction, density, crop damage, etc."
                    className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none resize-none dark:bg-input/30"
                  />
                </div>

                {/* Location Picker */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Location (optional)</Label>
                    <div className="flex gap-1 bg-muted/50 rounded-lg p-0.5">
                      <button
                        type="button"
                        onClick={() => setLocationMode('map')}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                          locationMode === 'map'
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <MapPin className="h-3 w-3" /> Map
                      </button>
                      <button
                        type="button"
                        onClick={() => setLocationMode('manual')}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                          locationMode === 'manual'
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <Keyboard className="h-3 w-3" /> Manual
                      </button>
                    </div>
                  </div>

                  {locationMode === 'map' ? (
                    <div className="space-y-2">
                      <MapPicker
                        lat={lat}
                        lon={lon}
                        onChange={(newLat, newLon) => { setLat(newLat); setLon(newLon) }}
                      />
                      {lat !== null && lon !== null && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3 text-green-400" />
                          <span>Selected: {lat.toFixed(6)}, {lon.toFixed(6)}</span>
                          <button
                            type="button"
                            onClick={() => { setLat(null); setLon(null) }}
                            className="ml-auto text-red-400 hover:text-red-300"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                      {lat === null && (
                        <p className="text-xs text-muted-foreground">Click on the map to set the observation location</p>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="lat" className="text-xs">Latitude</Label>
                        <Input
                          id="lat"
                          type="number"
                          step="0.000001"
                          placeholder="e.g. 27.81"
                          value={lat ?? ''}
                          onChange={(e) => setLat(e.target.value ? parseFloat(e.target.value) : null)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="lon" className="text-xs">Longitude</Label>
                        <Input
                          id="lon"
                          type="number"
                          step="0.000001"
                          placeholder="e.g. 66.63"
                          value={lon ?? ''}
                          onChange={(e) => setLon(e.target.value ? parseFloat(e.target.value) : null)}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Error */}
                {submitError && (
                  <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                    ⚠️ {submitError}
                  </div>
                )}
              </div>
            )}

            {!submitSuccess && (
              <DialogFooter>
                <Button variant="outline" onClick={() => { setOpen(false); resetForm() }}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={submitting} className="gap-2">
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {submitting ? 'Submitting…' : 'Submit Report'}
                </Button>
              </DialogFooter>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Reports</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{reports.length}</div></CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Verified</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-400">{reports.filter(r => r.status === 'Verified').length}</div></CardContent>
        </Card>
        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Pending</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-yellow-300">{reports.filter(r => r.status === 'Pending').length}</div></CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Critical</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-red-400">{reports.filter(r => r.risk_level === 'Critical').length}</div></CardContent>
        </Card>
      </div>

      {/* Reports Table */}
      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border bg-accent/30">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Reports</CardTitle>
              <CardDescription>Your submitted field observations</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchReports} disabled={loadingReports}>
              {loadingReports ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Refresh'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {listError ? (
            <div className="p-8 text-center text-red-400">
              <p>⚠️ {listError}</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={fetchReports}>Retry</Button>
            </div>
          ) : loadingReports ? (
            <div className="p-8 text-center text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
              <p>Loading reports…</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <p className="text-lg mb-1">No reports yet</p>
              <p className="text-sm">Click "New Report" to submit your first observation.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border bg-muted/40 hover:bg-muted/50 transition-colors">
                  <TableHead className="font-semibold text-foreground">Report ID</TableHead>
                  <TableHead className="font-semibold text-foreground">Zone</TableHead>
                  <TableHead className="font-semibold text-foreground">Risk</TableHead>
                  <TableHead className="font-semibold text-foreground">Size</TableHead>
                  <TableHead className="font-semibold text-foreground">Status</TableHead>
                  <TableHead className="font-semibold text-foreground">Location</TableHead>
                  <TableHead className="font-semibold text-foreground">Submitted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((r) => (
                  <TableRow
                    key={r.report_id}
                    className="border-b border-border hover:bg-accent/40 transition-colors duration-150"
                  >
                    <TableCell className="font-semibold text-sm">{r.report_id}</TableCell>
                    <TableCell className="text-sm">{r.zone}</TableCell>
                    <TableCell>
                      <Badge className={`${riskBadgeColor(r.risk_level)} text-xs`}>{r.risk_level}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{r.estimated_size || '—'}</TableCell>
                    <TableCell>
                      {r.status === 'Verified' ? (
                        <Badge className="bg-green-500/15 text-green-300 flex items-center gap-1 w-fit">
                          <CheckCircle2 className="h-3 w-3" />
                          {r.status}
                        </Badge>
                      ) : (
                        <Badge className="bg-yellow-500/15 text-yellow-200 flex items-center gap-1 w-fit">
                          <Clock className="h-3 w-3" />
                          {r.status}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">
                      {r.lat && r.lon ? `${r.lat.toFixed(4)}, ${r.lon.toFixed(4)}` : '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{formatTime(r.created_at)}</TableCell>
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
