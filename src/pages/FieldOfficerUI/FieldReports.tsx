import { useState, useEffect, useRef, useCallback } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger,
} from '@/components/ui/dialog'
import {
  CheckCircle2, Clock, Plus, MapPin, Keyboard, X, Loader2, Map as MapIcon, Eye, XCircle, MessageSquare, AlertTriangle, FileText, Search, ShieldAlert, CheckSquare, Send, Activity, RefreshCw
} from 'lucide-react'
import { useAuth, useAuthFetch, API_URL } from '@/context/AuthContext'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// ── Zone bounding boxes (approx) ─────────────────────────────
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
  { value: 'Critical', color: 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20 active:bg-rose-500/30 ring-rose-500' },
  { value: 'High',     color: 'bg-orange-500/10 text-orange-400 border-orange-500/30 hover:bg-orange-500/20 active:bg-orange-500/30 ring-orange-500' },
  { value: 'Medium',   color: 'bg-orange-500/10 text-orange-400 border-orange-500/30 hover:bg-orange-500/20 active:bg-orange-500/30 ring-orange-500' },
  { value: 'Low',      color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20 active:bg-emerald-500/30 ring-emerald-500' },
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
  user_id: number
  observer_name: string
  zone: string
  risk_level: string
  estimated_size: string | null
  description: string
  status: string
  lat: number | null
  lon: number | null
  reviewer_feedback: string | null
  reviewed_by: string | null
  reviewed_at: string | null
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

    setTimeout(() => map.invalidateSize(), 300)

    return () => {
      map.remove()
      mapInstance.current = null
      markerRef.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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
    <div ref={mapRef} className="w-full h-[280px] rounded-xl border border-border/50 overflow-hidden shadow-inner" />
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

  return <div ref={mapRef} className="w-full h-80 rounded-xl border border-border/50 overflow-hidden shadow-inner" />
}

// ── Main Component ───────────────────────────────────────────
export default function FieldReports() {
  const authFetch = useAuthFetch()
  const { user } = useAuth()

  // Reports list
  const [reports, setReports] = useState<ReportData[]>([])
  const [loadingReports, setLoadingReports] = useState(true)
  const [listError, setListError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'Pending' | 'Verified' | 'Rejected'>('all')

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

  // Detail dialog state
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailReport, setDetailReport] = useState<ReportData | null>(null)

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

  useEffect(() => { fetchReports() }, [fetchReports])

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
      }, 1500)
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
      case 'Critical': return 'bg-rose-500/15 text-rose-400 border-rose-500/20'
      case 'High':     return 'bg-orange-500/15 text-orange-400 border-orange-500/20'
      case 'Medium':   return 'bg-orange-500/15 text-orange-300 border-orange-500/20'
      case 'Low':      return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'
      default:         return 'bg-muted text-muted-foreground border-border'
    }
  }

  const statusIcon = (status: string) => {
    switch (status) {
      case 'Verified': return <CheckCircle2 className="h-4 w-4 text-emerald-400" />
      case 'Rejected': return <XCircle className="h-4 w-4 text-rose-400" />
      default:         return <Clock className="h-4 w-4 text-orange-400" />
    }
  }

  const myReports = reports.filter(r => r.observer_name === user?.name)
  const filteredMyReports = filter === 'all' ? myReports : myReports.filter(r => r.status === filter)
  
  const myVerified = myReports.filter(r => r.status === 'Verified').length
  const myPending = myReports.filter(r => r.status === 'Pending').length
  const myRejected = myReports.filter(r => r.status === 'Rejected').length

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header + New Report button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent drop-shadow-sm font-['Outfit']">
            My Field Reports
          </h1>
          <p className="text-muted-foreground mt-1 font-medium">
            Submit and track field observations · Location-tagged · Verified by analysts
          </p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm() }}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-gradient-to-r from-sky-500 to-indigo-500 shadow-lg shadow-sky-500/20 transition-opacity hover:opacity-90 font-semibold">
              <Plus className="h-5 w-5" />
              New Report
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto border-border/50 bg-background/95 backdrop-blur-xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-['Outfit'] flex items-center gap-2">
                <Send className="h-5 w-5 text-sky-400" />
                Submit Field Report
              </DialogTitle>
              <DialogDescription>
                Record your observation. Location can be set by tapping the map or entering coordinates.
              </DialogDescription>
            </DialogHeader>

            {submitSuccess ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-4 animate-in zoom-in duration-500">
                <div className="h-20 w-20 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                  <CheckCircle2 className="h-10 w-10 text-emerald-400" />
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-bold font-['Outfit'] text-foreground">Report Submitted!</h3>
                  <p className="text-muted-foreground mt-1">Your report has been queued for analyst verification.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6 py-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Zone */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-1">Zone *</Label>
                    <Select value={zone} onValueChange={setZone}>
                      <SelectTrigger className="w-full bg-muted/10 border-input transition-colors hover:bg-muted/20">
                        <SelectValue placeholder="Select observation zone..." />
                      </SelectTrigger>
                      <SelectContent>
                        {ZONES.map(z => (
                          <SelectItem key={z} value={z}>{z}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Estimated Size */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-1">Estimated Swarm Size</Label>
                    <Select value={estimatedSize} onValueChange={setEstimatedSize}>
                      <SelectTrigger className="w-full bg-muted/10 border-input transition-colors hover:bg-muted/20">
                        <SelectValue placeholder="Unknown / Not estimated" />
                      </SelectTrigger>
                      <SelectContent>
                        {SIZE_OPTIONS.map(s => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Risk Level */}
                <div className="space-y-3 p-4 rounded-xl bg-muted/10 border border-border/50">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Risk Level *</Label>
                  <div className="flex flex-wrap gap-3">
                    {RISK_LEVELS.map(rl => (
                      <button
                        key={rl.value}
                        type="button"
                        onClick={() => setRiskLevel(rl.value)}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all duration-200 ${
                          riskLevel === rl.value
                            ? `${rl.color} ring-2 ring-offset-2 ring-offset-background scale-105 shadow-lg`
                            : `${rl.color} opacity-70 hover:opacity-100`
                        }`}
                      >
                        {rl.value}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-1">Description *</Label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe swarm direction, density, crop damage, etc."
                    className="w-full rounded-xl border border-input bg-muted/10 px-4 py-3 text-sm placeholder:text-muted-foreground focus-visible:border-sky-500/50 focus-visible:ring-1 focus-visible:ring-sky-500/50 outline-none resize-none transition-all"
                  />
                </div>

                {/* Location Picker */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-1">Location (optional)</Label>
                    <div className="flex gap-1 bg-muted/30 border border-border/50 rounded-lg p-1">
                      <button
                        type="button"
                        onClick={() => setLocationMode('map')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                          locationMode === 'map'
                            ? 'bg-background shadow-sm text-foreground'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <MapPin className="h-3.5 w-3.5" /> Map
                      </button>
                      <button
                        type="button"
                        onClick={() => setLocationMode('manual')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                          locationMode === 'manual'
                            ? 'bg-background shadow-sm text-foreground'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <Keyboard className="h-3.5 w-3.5" /> Manual
                      </button>
                    </div>
                  </div>

                  {locationMode === 'map' ? (
                    <div className="space-y-2 relative">
                      <MapPicker
                        lat={lat}
                        lon={lon}
                        onChange={(newLat, newLon) => { setLat(newLat); setLon(newLon) }}
                      />
                      {lat !== null && lon !== null ? (
                        <div className="absolute top-2 left-2 bg-background/90 backdrop-blur-sm border border-border/50 rounded-lg px-3 py-2 flex items-center gap-3 text-xs font-medium shadow-md">
                          <div className="flex items-center gap-1.5 text-sky-400">
                            <MapPin className="h-3.5 w-3.5" />
                            <span>{lat.toFixed(4)}, {lon.toFixed(4)}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => { setLat(null); setLon(null) }}
                            className="text-muted-foreground hover:text-rose-400 transition-colors"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="absolute top-2 left-2 bg-background/80 backdrop-blur-sm border border-border/50 rounded-lg px-3 py-1.5 text-xs text-muted-foreground font-medium shadow-sm pointer-events-none">
                          Click map to pin location
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4 bg-muted/10 p-4 rounded-xl border border-border/50">
                      <div className="space-y-1.5">
                        <Label htmlFor="lat" className="text-xs">Latitude</Label>
                        <Input
                          id="lat"
                          type="number"
                          step="0.000001"
                          placeholder="e.g. 27.81"
                          value={lat ?? ''}
                          onChange={(e) => setLat(e.target.value ? parseFloat(e.target.value) : null)}
                          className="bg-background"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="lon" className="text-xs">Longitude</Label>
                        <Input
                          id="lon"
                          type="number"
                          step="0.000001"
                          placeholder="e.g. 66.63"
                          value={lon ?? ''}
                          onChange={(e) => setLon(e.target.value ? parseFloat(e.target.value) : null)}
                          className="bg-background"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Zone / Location mismatch warning */}
                {zoneMismatch && (
                  <div className="flex items-start gap-3 text-sm text-orange-400 bg-orange-500/10 border border-orange-500/20 rounded-xl px-4 py-3 shadow-inner">
                    <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-orange-500">Location mismatch detected</p>
                      <p className="text-xs text-orange-400/80 mt-1 leading-relaxed">
                        The pinned coordinates ({lat?.toFixed(4)}, {lon?.toFixed(4)}) appear to be outside <strong className="text-orange-500">{zone}</strong>. 
                        Please verify the zone or pin. You can still submit if you're near the border.
                      </p>
                    </div>
                  </div>
                )}

                {/* Error */}
                {submitError && (
                  <div className="flex items-center gap-2 text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 font-medium">
                    <AlertTriangle className="h-4 w-4 shrink-0" /> {submitError}
                  </div>
                )}
              </div>
            )}

            {!submitSuccess && (
              <DialogFooter className="pt-2 border-t border-border/50">
                <Button variant="ghost" onClick={() => { setOpen(false); resetForm() }}>
                  Cancel
                </Button>
                <Button onClick={handleSubmitClick} disabled={submitting} className="gap-2 bg-sky-500 hover:bg-sky-600 text-white shadow-lg shadow-sky-500/20">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {submitting ? 'Submitting...' : 'Submit Report'}
                </Button>
              </DialogFooter>
            )}
          </DialogContent>
        </Dialog>

        {/* Mismatch Confirmation Dialog */}
        <Dialog open={showMismatchConfirm} onOpenChange={setShowMismatchConfirm}>
          <DialogContent className="sm:max-w-md border-orange-500/20 bg-background/95 backdrop-blur-xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-orange-500">
                <MapPin className="h-5 w-5" />
                Location Mismatch
              </DialogTitle>
              <DialogDescription>
                The coordinates you pinned don't appear to be inside <strong className="text-foreground">{zone}</strong>.
              </DialogDescription>
            </DialogHeader>
            <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-4 text-sm space-y-2 mt-2">
              <p className="text-orange-400/90 flex justify-between"><strong className="text-orange-500">Zone:</strong> {zone}</p>
              <p className="text-orange-400/90 flex justify-between"><strong className="text-orange-500">Pinned location:</strong> {lat?.toFixed(4)}, {lon?.toFixed(4)}</p>
              <p className="text-xs text-orange-400/70 mt-3 pt-3 border-t border-orange-500/10">
                This could mean the wrong zone was selected, or the pin was placed incorrectly.
                If you're near a zone border, this may be normal.
              </p>
            </div>
            <DialogFooter className="mt-4">
              <Button variant="ghost" onClick={() => setShowMismatchConfirm(false)}>
                Go Back & Fix
              </Button>
              <Button
                variant="default"
                className="bg-orange-500 hover:bg-orange-600 text-orange-950 gap-2 font-semibold shadow-lg shadow-orange-500/20"
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

      {/* My Reports Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div 
          onClick={() => setFilter('all')}
          className={`p-5 rounded-2xl border transition-all duration-300 cursor-pointer group relative overflow-hidden ${filter === 'all' ? 'bg-sky-500/10 border-sky-500/50 shadow-[0_0_30px_-5px_rgba(14,165,233,0.15)]' : 'bg-gradient-to-br from-background to-muted/20 border-border/50 hover:border-sky-500/30'}`}
        >
          <div className="absolute -right-4 -top-4 p-6 bg-sky-500/5 rounded-full group-hover:bg-sky-500/10 transition-colors">
            <FileText className="h-8 w-8 text-sky-500/40" />
          </div>
          <p className="text-sm font-semibold text-muted-foreground mb-1">My Reports</p>
          <p className={`text-3xl font-bold font-['Outfit'] ${filter === 'all' ? 'text-sky-400' : 'text-foreground'}`}>{myReports.length}</p>
        </div>
        
        <div 
          onClick={() => setFilter('Pending')}
          className={`p-5 rounded-2xl border transition-all duration-300 cursor-pointer group relative overflow-hidden ${filter === 'Pending' ? 'bg-orange-500/10 border-orange-500/50 shadow-[0_0_30px_-5px_rgba(245,158,11,0.15)]' : 'bg-gradient-to-br from-background to-muted/20 border-border/50 hover:border-orange-500/30'}`}
        >
          <div className="absolute -right-4 -top-4 p-6 bg-orange-500/5 rounded-full group-hover:bg-orange-500/10 transition-colors">
            <Clock className="h-8 w-8 text-orange-500/40" />
          </div>
          <p className="text-sm font-semibold text-muted-foreground mb-1">Pending</p>
          <p className={`text-3xl font-bold font-['Outfit'] ${filter === 'Pending' ? 'text-orange-400' : 'text-foreground'}`}>{myPending}</p>
        </div>

        <div 
          onClick={() => setFilter('Verified')}
          className={`p-5 rounded-2xl border transition-all duration-300 cursor-pointer group relative overflow-hidden ${filter === 'Verified' ? 'bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_30px_-5px_rgba(16,185,129,0.15)]' : 'bg-gradient-to-br from-background to-muted/20 border-border/50 hover:border-emerald-500/30'}`}
        >
          <div className="absolute -right-4 -top-4 p-6 bg-emerald-500/5 rounded-full group-hover:bg-emerald-500/10 transition-colors">
            <CheckSquare className="h-8 w-8 text-emerald-500/40" />
          </div>
          <p className="text-sm font-semibold text-muted-foreground mb-1">Verified</p>
          <p className={`text-3xl font-bold font-['Outfit'] ${filter === 'Verified' ? 'text-emerald-400' : 'text-foreground'}`}>{myVerified}</p>
        </div>

        <div 
          onClick={() => setFilter('Rejected')}
          className={`p-5 rounded-2xl border transition-all duration-300 cursor-pointer group relative overflow-hidden ${filter === 'Rejected' ? 'bg-rose-500/10 border-rose-500/50 shadow-[0_0_30px_-5px_rgba(244,63,94,0.15)]' : 'bg-gradient-to-br from-background to-muted/20 border-border/50 hover:border-rose-500/30'}`}
        >
          <div className="absolute -right-4 -top-4 p-6 bg-rose-500/5 rounded-full group-hover:bg-rose-500/10 transition-colors">
            <ShieldAlert className="h-8 w-8 text-rose-500/40" />
          </div>
          <p className="text-sm font-semibold text-muted-foreground mb-1">Rejected</p>
          <p className={`text-3xl font-bold font-['Outfit'] ${filter === 'Rejected' ? 'text-rose-400' : 'text-foreground'}`}>{myRejected}</p>
        </div>
      </div>

      {/* My Submitted Reports List */}
      <div className="rounded-2xl border border-border/50 bg-background/50 backdrop-blur-xl overflow-hidden shadow-xl flex flex-col">
        <div className="p-4 border-b border-border/50 bg-muted/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-500/20 rounded-lg">
              <Search className="h-4 w-4 text-indigo-400" />
            </div>
            <h2 className="font-semibold font-['Outfit'] text-lg">My Submitted Reports</h2>
            {filter !== 'all' && (
              <Badge variant="outline" className="ml-2 bg-background border-border/50 text-muted-foreground cursor-pointer hover:bg-muted" onClick={() => setFilter('all')}>
                {filter} <X className="h-3 w-3 ml-1" />
              </Badge>
            )}
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={fetchReports} disabled={loadingReports} className="h-8 w-8 p-0 hover:bg-sky-500/10 hover:text-sky-400 transition-colors">
            {loadingReports ? <Loader2 className="h-4 w-4 animate-spin text-sky-500" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
        </div>

        <div className="bg-muted/10 grid grid-cols-[110px_1fr_110px_120px_140px_130px] gap-4 px-8 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border/50 hidden md:grid">
          <div>Report ID</div>
          <div>Zone / Size</div>
          <div>Risk Level</div>
          <div>Status</div>
          <div>Location</div>
          <div className="text-right">Submitted</div>
        </div>

        <ScrollArea className="h-[350px]">
          {listError ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-rose-400">
              <AlertTriangle className="h-10 w-10 mb-3 opacity-80" />
              <p className="font-medium">{listError}</p>
            </div>
          ) : (loadingReports && myReports.length === 0) ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mb-3 text-sky-500" />
              <p className="text-sm font-medium">Loading your reports...</p>
            </div>
          ) : filteredMyReports.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-12 text-muted-foreground text-center">
              <div className="p-4 bg-muted/20 rounded-full mb-4">
                <FileText className="h-8 w-8 opacity-50" />
              </div>
              <p className="text-lg font-medium text-foreground mb-1">No {filter !== 'all' ? filter.toLowerCase() : ''} reports found</p>
              <p className="text-sm max-w-sm">Click "New Report" to submit your first observation from the field.</p>
            </div>
          ) : (
            <div className={`flex flex-col gap-2.5 p-3 transition-opacity duration-300 ${loadingReports ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
              {filteredMyReports.map((r) => (
                <div
                  key={r.report_id}
                  onClick={() => { setDetailReport(r); setDetailOpen(true) }}
                  className="relative overflow-hidden grid grid-cols-1 md:grid-cols-[110px_1fr_110px_120px_140px_130px] gap-4 px-5 py-3 items-center bg-background/40 hover:bg-muted/30 border border-border/50 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group"
                >
                  <div className={`absolute left-0 top-0 bottom-0 w-1 opacity-0 group-hover:opacity-100 transition-opacity ${
                    r.status === 'Verified' ? 'bg-emerald-500' : r.status === 'Rejected' ? 'bg-rose-500' : 'bg-sky-500'
                  }`} />
                  
                  <div className="font-mono text-sm font-semibold text-muted-foreground group-hover:text-sky-400 transition-colors flex items-center gap-2">
                    {r.status === 'Pending' && <span className="h-2 w-2 rounded-full bg-orange-400 animate-pulse" />}
                    {r.report_id}
                  </div>
                  
                  <div>
                    <div className="font-bold text-sm flex items-center gap-1.5 text-foreground"><MapPin className="h-3 w-3 text-sky-400" />{r.zone}</div>
                    <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mt-0.5">{r.estimated_size || 'Size unknown'}</div>
                  </div>

                  <div>
                    <Badge variant="outline" className={`${riskBadgeColor(r.risk_level)} text-xs px-2.5 py-0.5 shadow-sm font-semibold tracking-wide`}>
                      {r.risk_level}
                    </Badge>
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5 text-sm font-bold">
                      {statusIcon(r.status)}
                      <span className={r.status === 'Verified' ? 'text-emerald-500' : r.status === 'Rejected' ? 'text-rose-500' : 'text-orange-500'}>
                        {r.status}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    {r.lat && r.lon ? (
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono bg-muted/30 px-1.5 py-0.5 rounded text-foreground/80">{r.lat.toFixed(2)}, {r.lon.toFixed(2)}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-sky-400 hover:text-sky-300 hover:bg-sky-500/10 rounded-full"
                          onClick={(e) => { e.stopPropagation(); setMapViewReport(r); setMapViewOpen(true) }}
                        >
                          <MapIcon className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ) : '—'}
                  </div>

                  <div className="text-right text-sm font-medium text-muted-foreground md:flex md:flex-col md:items-end">
                    {formatTime(r.created_at)}
                    <span className="text-[10px] uppercase tracking-wider text-sky-400 opacity-0 group-hover:opacity-100 transition-opacity mt-1 flex items-center gap-1">
                      <Eye className="h-3 w-3" /> View details
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-3xl p-0 overflow-hidden border-border/50 bg-background/95 backdrop-blur-xl shadow-2xl">
          {detailReport && (
            <>
              {/* Header section with gradient */}
              <div className="relative p-6 pb-8 bg-gradient-to-br from-sky-500/10 via-background to-background border-b border-border/50">
                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                  <FileText className="w-32 h-32 text-sky-500" />
                </div>
                <DialogHeader className="relative z-10">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-sky-500/20 rounded-xl shadow-inner border border-sky-500/20">
                        <MessageSquare className="h-5 w-5 text-sky-400" />
                      </div>
                      <div>
                        <DialogTitle className="text-2xl font-black font-['Outfit'] tracking-tight text-foreground">
                          My Observation
                        </DialogTitle>
                        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                          <span className="font-mono text-sky-400 bg-sky-500/10 px-1.5 py-0.5 rounded">{detailReport.report_id}</span>
                          <span>·</span>
                          <span>Submitted {new Date(detailReport.created_at).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    {/* Status Badge */}
                    <div className={`px-4 py-1.5 rounded-full border shadow-sm flex items-center gap-2 text-sm font-semibold tracking-wide ${
                      detailReport.status === 'Verified' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : detailReport.status === 'Rejected' ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                        : 'bg-orange-500/10 border-orange-500/30 text-orange-400'
                    }`}>
                      {statusIcon(detailReport.status)}
                      {detailReport.status.toUpperCase()}
                    </div>
                  </div>
                </DialogHeader>
              </div>

              <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh]">
                {/* Details Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="space-y-1.5 p-3.5 rounded-xl bg-muted/10 border border-border/40 hover:bg-muted/20 transition-colors">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                      <MapPin className="h-3 w-3 text-sky-400" /> Zone
                    </label>
                    <p className="text-sm font-semibold">{detailReport.zone}</p>
                  </div>
                  <div className="space-y-1.5 p-3.5 rounded-xl bg-muted/10 border border-border/40 hover:bg-muted/20 transition-colors">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                      <AlertTriangle className="h-3 w-3 text-orange-400" /> Risk Level
                    </label>
                    <div>
                      <Badge variant="outline" className={`${riskBadgeColor(detailReport.risk_level)} text-xs shadow-sm`}>
                        {detailReport.risk_level}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-1.5 p-3.5 rounded-xl bg-muted/10 border border-border/40 hover:bg-muted/20 transition-colors">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                      <Activity className="h-3 w-3 text-indigo-400" /> Swarm Size
                    </label>
                    <p className="text-sm font-semibold text-foreground">{detailReport.estimated_size || '—'}</p>
                  </div>
                  <div className="space-y-1.5 p-3.5 rounded-xl bg-muted/10 border border-border/40 hover:bg-muted/20 transition-colors">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                      <Search className="h-3 w-3 text-emerald-400" /> Exact Location
                    </label>
                    {detailReport.lat && detailReport.lon ? (
                      <p className="text-sm font-mono font-medium text-sky-400">
                        {detailReport.lat.toFixed(4)}, {detailReport.lon.toFixed(4)}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">Unspecified</p>
                    )}
                  </div>
                </div>

                {/* Description block */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Observation Notes</label>
                  <div className="bg-gradient-to-br from-background to-muted/20 border border-border/60 rounded-2xl p-5 text-sm leading-relaxed text-foreground shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-sky-500/50"></div>
                    {detailReport.description}
                  </div>
                </div>

                {/* Review Info */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Analyst Feedback</label>
                  {detailReport.reviewed_by ? (
                    <div className={`rounded-2xl p-5 border shadow-sm relative overflow-hidden ${
                      detailReport.status === 'Verified' ? 'bg-gradient-to-r from-emerald-500/10 to-transparent border-emerald-500/20'
                        : detailReport.status === 'Rejected' ? 'bg-gradient-to-r from-rose-500/10 to-transparent border-rose-500/20'
                        : 'bg-gradient-to-r from-sky-500/10 to-transparent border-sky-500/20'
                    }`}>
                      <div className="flex items-start justify-between mb-1">
                        <div>
                          <p className="text-sm font-semibold text-foreground">Reviewed by {detailReport.reviewed_by}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{detailReport.reviewed_at ? new Date(detailReport.reviewed_at).toLocaleString() : 'Date unknown'}</p>
                        </div>
                      </div>
                      
                      {detailReport.reviewer_feedback ? (
                        <div className="mt-3 bg-background/60 rounded-xl p-4 border border-border/40 shadow-inner">
                          <p className="text-sm text-foreground italic border-l-2 border-primary/30 pl-3">"{detailReport.reviewer_feedback}"</p>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground italic mt-2">No additional feedback provided.</p>
                      )}
                    </div>
                  ) : (
                    <div className="bg-orange-500/5 border border-orange-500/20 rounded-2xl p-5 flex items-center gap-3">
                      <Clock className="h-5 w-5 text-orange-400 animate-pulse" />
                      <div>
                        <p className="text-sm font-semibold text-orange-500">Awaiting Assignment</p>
                        <p className="text-xs text-orange-400/80 mt-0.5">Your report is waiting for an analyst to review.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter className="border-t border-border/50 pt-4">
                <Button variant="ghost" onClick={() => setDetailOpen(false)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Map Viewer Dialog */}
      <Dialog open={mapViewOpen} onOpenChange={(v) => { setMapViewOpen(v); if (!v) setMapViewReport(null) }}>
        <DialogContent className="sm:max-w-3xl border-border/50 bg-background/95 backdrop-blur-xl p-0 overflow-hidden">
          {mapViewReport && mapViewReport.lat && mapViewReport.lon && (
            <>
              <div className="p-6 pb-4 bg-muted/20 border-b border-border/50">
                <DialogTitle className="flex items-center gap-2 text-xl font-['Outfit']">
                  <MapIcon className="h-5 w-5 text-sky-400" />
                  Location: {mapViewReport.zone}
                </DialogTitle>
                <DialogDescription className="mt-1">
                  Report {mapViewReport.report_id} · Coordinates: {mapViewReport.lat.toFixed(6)}, {mapViewReport.lon.toFixed(6)}
                </DialogDescription>
              </div>
              <div className="p-6">
                <MapViewer lat={mapViewReport.lat} lon={mapViewReport.lon} zone={mapViewReport.zone} />
                <div className="flex justify-end mt-4">
                  <Button variant="outline" onClick={() => setMapViewOpen(false)}>Close Map</Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
