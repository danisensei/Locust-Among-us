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
import { CheckCircle2, Clock, Plus, MapPin, Keyboard, X, Loader2, Map as MapIcon, Eye } from 'lucide-react'
import { useAuthFetch, API_URL } from '@/context/AuthContext'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// ── Zone bounding boxes (approx) ─────────────────────────────
// { south, north, west, east } — generous bounds to allow border observations
const ZONE_BOUNDS: Record<string, { s: number; n: number; w: number; e: number }> = {
  'Khuzdar Valley':    { s: 26.5, n: 28.5, w: 65.5, e: 67.5 },
  'Quetta':            { s: 29.5, n: 31.0, w: 66.0, e: 67.5 },
  'Jacobabad Plains':  { s: 27.5, n: 29.0, w: 67.5, e: 69.5 },
  'D.I. Khan':         { s: 31.0, n: 32.5, w: 70.0, e: 71.5 },
  'Thar Desert':       { s: 24.5, n: 27.5, w: 69.5, e: 71.5 },
  'Cholistan Desert':  { s: 27.5, n: 30.0, w: 71.0, e: 73.5 },
  'Dera Ghazi Khan':   { s: 29.0, n: 31.0, w: 69.5, e: 71.0 },
  'Bahawalpur':        { s: 28.5, n: 30.5, w: 70.5, e: 72.5 },
  'Lasbela':           { s: 25.0, n: 27.0, w: 65.5, e: 67.5 },
  'Turbat':            { s: 25.5, n: 27.5, w: 62.5, e: 64.5 },
  'Gwadar':            { s: 24.5, n: 26.5, w: 61.5, e: 63.0 },
  'Nushki':            { s: 28.5, n: 30.5, w: 64.5, e: 66.5 },
  'Sibi':              { s: 28.5, n: 30.5, w: 67.0, e: 68.5 },
  'Nasirabad':         { s: 27.5, n: 29.0, w: 67.0, e: 68.5 },
  'Sukkur':            { s: 27.0, n: 28.5, w: 68.5, e: 70.0 },
  'Rahimyar Khan':     { s: 27.5, n: 29.5, w: 69.5, e: 71.0 },
}

const ZONES = Object.keys(ZONE_BOUNDS)

function isInsideZone(zoneName: string, lat: number, lon: number): boolean {
  const b = ZONE_BOUNDS[zoneName]
  if (!b) return true // unknown zone → no warning
  return lat >= b.s && lat <= b.n && lon >= b.w && lon <= b.e
}

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

// ── Map Viewer Component ─────────────────────────────────────
function MapViewer({ lat, lon, zone }: { lat: number; lon: number; zone: string }) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return

    const map = L.map(mapRef.current).setView([lat, lon], 12)

    const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    })

    const satelliteLayer = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      { attribution: 'Tiles &copy; Esri', maxZoom: 18 }
    )

    streetLayer.addTo(map)

    L.control.layers(
      { 'Street': streetLayer, 'Satellite': satelliteLayer },
      {},
      { position: 'topright' }
    ).addTo(map)

    const marker = L.marker([lat, lon]).addTo(map)
    marker.bindPopup(`
      <div style="font-family: system-ui; font-size: 12px;">
        <strong>${zone}</strong><br/>
        <span style="color: #666;">Lat: ${lat.toFixed(6)}</span><br/>
        <span style="color: #666;">Lon: ${lon.toFixed(6)}</span>
      </div>
    `).openPopup()

    mapInstance.current = map
    setTimeout(() => map.invalidateSize(), 300)

    return () => { map.remove(); mapInstance.current = null }
  }, [lat, lon, zone])

  return <div ref={mapRef} className="w-full h-80 rounded-lg border border-border overflow-hidden" />
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
  const [showMismatchConfirm, setShowMismatchConfirm] = useState(false)

  // Form state
  const [zone, setZone] = useState('')
  const [riskLevel, setRiskLevel] = useState('')
  const [estimatedSize, setEstimatedSize] = useState('')
  const [description, setDescription] = useState('')
  const [lat, setLat] = useState<number | null>(null)
  const [lon, setLon] = useState<number | null>(null)
  const [locationMode, setLocationMode] = useState<'map' | 'manual'>('map')

  // Map viewer dialog state
  const [mapViewOpen, setMapViewOpen] = useState(false)
  const [mapViewReport, setMapViewReport] = useState<ReportData | null>(null)

  // ── Zone / coordinate mismatch check ───────────────────────
  const zoneMismatch = zone && lat !== null && lon !== null && !isInsideZone(zone, lat, lon)

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
    setShowMismatchConfirm(false)
  }

  // ── Submit report ──────────────────────────────────────────
  const handleSubmitClick = () => {
    if (!zone || !riskLevel || !description) {
      setSubmitError('Please fill in Zone, Risk Level, and Description.')
      return
    }
    // If there's a mismatch, ask for confirmation first
    if (zoneMismatch) {
      setShowMismatchConfirm(true)
      return
    }
    doSubmit()
  }

  const doSubmit = async () => {
    setShowMismatchConfirm(false)

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

                {/* Zone / Location mismatch warning */}
                {zoneMismatch && (
                  <div className="flex items-start gap-2 text-sm text-yellow-300 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2.5">
                    <span className="text-base mt-0.5">⚠️</span>
                    <div>
                      <p className="font-medium">Location mismatch</p>
                      <p className="text-xs text-yellow-300/80 mt-0.5">
                        The pinned coordinates ({lat?.toFixed(4)}, {lon?.toFixed(4)}) appear to be outside <strong>{zone}</strong>. 
                        Please verify the zone or adjust the pin. You can still submit if you're near the border.
                      </p>
                    </div>
                  </div>
                )}

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
                <Button onClick={handleSubmitClick} disabled={submitting} className="gap-2">
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {submitting ? 'Submitting…' : 'Submit Report'}
                </Button>
              </DialogFooter>
            )}
          </DialogContent>
        </Dialog>

        {/* Mismatch Confirmation Dialog */}
        <Dialog open={showMismatchConfirm} onOpenChange={setShowMismatchConfirm}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-yellow-400">
                <MapPin className="h-5 w-5" />
                Location Mismatch
              </DialogTitle>
              <DialogDescription>
                The coordinates you pinned don't appear to be inside <strong className="text-foreground">{zone}</strong>.
              </DialogDescription>
            </DialogHeader>
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 text-sm space-y-1">
              <p className="text-yellow-300"><strong>Zone:</strong> {zone}</p>
              <p className="text-yellow-300"><strong>Pinned location:</strong> {lat?.toFixed(4)}, {lon?.toFixed(4)}</p>
              <p className="text-xs text-yellow-300/70 mt-2">
                This could mean the wrong zone was selected, or the pin was placed incorrectly.
                If you're near a zone border, this may be normal.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowMismatchConfirm(false)}>
                Go Back & Fix
              </Button>
              <Button
                variant="default"
                className="bg-yellow-600 hover:bg-yellow-700 text-white gap-2"
                onClick={doSubmit}
                disabled={submitting}
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Submit Anyway
              </Button>
            </DialogFooter>
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
                    <TableCell className="text-xs text-muted-foreground">
                      {r.lat && r.lon ? (
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono">{r.lat.toFixed(4)}, {r.lon.toFixed(4)}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 text-[10px] gap-1 px-1.5 text-sky-400 hover:text-sky-300"
                            onClick={() => { setMapViewReport(r); setMapViewOpen(true) }}
                          >
                            <Eye className="h-3 w-3" /> View
                          </Button>
                        </div>
                      ) : '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{formatTime(r.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      {/* Map Viewer Dialog */}
      <Dialog open={mapViewOpen} onOpenChange={(v) => { setMapViewOpen(v); if (!v) setMapViewReport(null) }}>
        <DialogContent className="sm:max-w-2xl">
          {mapViewReport && mapViewReport.lat && mapViewReport.lon && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <MapIcon className="h-5 w-5 text-sky-400" />
                  Report Location — {mapViewReport.report_id}
                </DialogTitle>
                <DialogDescription>
                  {mapViewReport.zone} · {mapViewReport.lat.toFixed(6)}, {mapViewReport.lon.toFixed(6)} · Toggle layers in the top-right corner
                </DialogDescription>
              </DialogHeader>
              <MapViewer lat={mapViewReport.lat} lon={mapViewReport.lon} zone={mapViewReport.zone} />
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
