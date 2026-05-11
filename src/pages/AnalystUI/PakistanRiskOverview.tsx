import { useEffect, useRef, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  AlertTriangle, Layers, MapPin, Loader2, RefreshCw, Shield, Clock,
  User, FileText, ChevronRight, Eye, Globe
} from 'lucide-react'
import { useAuthFetch, API_URL } from '@/context/AuthContext'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
// @ts-ignore
import { MarkerClusterGroup } from 'leaflet.markercluster'
// @ts-ignore
import 'leaflet.heat'

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
  reviewer_feedback: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
}

// ── Risk color mapping ───────────────────────────────────────
function riskColor(risk: string): string {
  switch (risk) {
    case 'Critical': return '#dc2626'
    case 'High':     return '#ea580c'
    case 'Medium':   return '#eab308'
    case 'Low':      return '#22c55e'
    default:         return '#6b7280'
  }
}

function riskIntensity(risk: string): number {
  switch (risk) {
    case 'Critical': return 0.95
    case 'High':     return 0.75
    case 'Medium':   return 0.5
    case 'Low':      return 0.25
    default:         return 0.3
  }
}

const RISK_BADGE: Record<string, string> = {
  Critical: 'bg-red-500/15 text-red-400 border-red-500/30',
  High: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  Medium: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
  Low: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
}

const RISK_DOT: Record<string, string> = {
  Critical: 'bg-red-500',
  High: 'bg-orange-500',
  Medium: 'bg-yellow-500',
  Low: 'bg-emerald-500',
}

// ── Time formatter ───────────────────────────────────────────
function formatTime(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000)
  if (diff < 60) return 'Just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function PakistanRiskOverview() {
  const authFetch = useAuthFetch()
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markersRef = useRef<any>(null)
  const heatLayerRef = useRef<L.Layer | null>(null)

  const [reports, setReports] = useState<ReportData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeReport, setActiveReport] = useState<string | null>(null)
  const [mapReady, setMapReady] = useState(false)

  const verifiedReports = reports.filter(
    r => r.status === 'Verified' && r.lat !== null && r.lon !== null
  )

  const stats = {
    totalReports: verifiedReports.length,
    criticalZones: verifiedReports.filter(r => r.risk_level === 'Critical').length,
    highZones: verifiedReports.filter(r => r.risk_level === 'High').length,
    mediumZones: verifiedReports.filter(r => r.risk_level === 'Medium').length,
    lowZones: verifiedReports.filter(r => r.risk_level === 'Low').length,
    zones: [...new Set(verifiedReports.map(r => r.zone))].length,
  }

  // ── Fetch verified reports ─────────────────────────────────
  const fetchReports = useCallback(async () => {
    try {
      setLoading(true)
      const res = await authFetch(`${API_URL}/api/reports`)
      if (!res.ok) throw new Error(`Failed (${res.status})`)
      const all: ReportData[] = await res.json()
      setReports(all)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reports')
    } finally {
      setLoading(false)
    }
  }, [authFetch])

  useEffect(() => { fetchReports() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Initialize base map ────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    const map = L.map(mapRef.current).setView([30.2, 69.3], 6)

    const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    })
    streetLayer.addTo(map)

    const satelliteLayer = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      { attribution: 'Tiles &copy; Esri', maxZoom: 18 }
    )

    const terrainLayer = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Terrain_Base/MapServer/tile/{z}/{y}/{x}',
      { attribution: 'Tiles &copy; Esri', maxZoom: 13, opacity: 0.3 }
    )

    const markerClusterGroup = new (MarkerClusterGroup || (L as any).MarkerClusterGroup)({
      maxClusterRadius: 80,
      iconCreateFunction: (cluster: any) => {
        const count = cluster.getChildCount()
        const radius = count > 10 ? 40 : count > 5 ? 30 : 25
        return L.divIcon({
          html: `<div style="background-color: #dc2626; color: white; border-radius: 50%; width: ${radius}px; height: ${radius}px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">${count}</div>`,
          className: 'cluster-icon',
          iconSize: [radius, radius],
        })
      },
    })
    map.addLayer(markerClusterGroup)
    markersRef.current = markerClusterGroup

    L.control.layers(
      { 'Street': streetLayer, 'Satellite': satelliteLayer },
      { 'Terrain Overlay': terrainLayer, 'Report Clusters': markerClusterGroup },
      { position: 'topright' }
    ).addTo(map)

    mapInstanceRef.current = map
    setMapReady(true)

    setTimeout(() => map.invalidateSize(), 100)
    setTimeout(() => map.invalidateSize(), 300)
    const ro = new ResizeObserver(() => map.invalidateSize())
    ro.observe(mapRef.current)

    return () => { ro.disconnect(); map.remove(); mapInstanceRef.current = null; setMapReady(false) }
  }, [])

  // ── Update map markers when data changes ───────────────────
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !markersRef.current) return

    const map = mapInstanceRef.current
    const clusterGroup = markersRef.current

    clusterGroup.clearLayers()

    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current)
      heatLayerRef.current = null
    }

    if (verifiedReports.length === 0) return

    verifiedReports.forEach((report) => {
      if (!report.lat || !report.lon) return

      const color = riskColor(report.risk_level)
      const intensity = riskIntensity(report.risk_level)

      const marker = L.circleMarker([report.lat, report.lon], {
        radius: 6 + intensity * 8,
        fillColor: color,
        color: '#fff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.75,
      })

      marker.bindPopup(`
        <div style="font-family: 'Inter', system-ui, sans-serif; font-size: 12px; min-width: 220px;">
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
            <strong style="font-size: 14px;">${report.report_id}</strong>
            <span style="background: ${color}22; color: ${color}; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">${report.risk_level}</span>
          </div>
          <div style="color: #999; margin-bottom: 8px; font-size: 11px;">${report.zone}</div>
          <div style="background: #1a1a2e; padding: 8px; border-radius: 6px; margin-bottom: 8px; color: #ccc; line-height: 1.4;">
            ${report.description.length > 150 ? report.description.substring(0, 150) + '…' : report.description}
          </div>
          <div style="font-size: 11px;">
            ${report.estimated_size ? `<div><strong>Size:</strong> ${report.estimated_size}</div>` : ''}
            <div><strong>Observer:</strong> ${report.observer_name}</div>
            <div><strong>Submitted:</strong> ${formatTime(report.created_at)}</div>
            ${report.reviewed_by ? `<div><strong>Verified by:</strong> ${report.reviewed_by}</div>` : ''}
            ${report.reviewer_feedback ? `<div style="margin-top: 4px; padding-top: 4px; border-top: 1px solid #333;"><strong>Feedback:</strong> ${report.reviewer_feedback}</div>` : ''}
          </div>
          <div style="margin-top: 6px; font-size: 10px; color: #666;">
            ${report.lat!.toFixed(6)}, ${report.lon!.toFixed(6)}
          </div>
        </div>
      `)

      marker.on('click', () => setActiveReport(report.report_id))
      clusterGroup.addLayer(marker)
    })

    const heatData = verifiedReports
      .filter(r => r.lat && r.lon)
      .map(r => [r.lat!, r.lon!, riskIntensity(r.risk_level)] as [number, number, number])

    if (heatData.length > 0) {
      // @ts-ignore
      const heatLayer = L.heatLayer(heatData, {
        radius: 60,
        blur: 20,
        maxZoom: 12,
        max: 1.0,
        gradient: {
          0.0: '#0047ab',
          0.25: '#00d4ff',
          0.5: '#ffff00',
          0.75: '#ff7f00',
          1.0: '#8b0000',
        },
        minOpacity: 0.2,
      })
      heatLayer.addTo(map)
      heatLayerRef.current = heatLayer
    }
  }, [verifiedReports, mapReady]) // eslint-disable-line react-hooks/exhaustive-deps

  const focusReport = (report: ReportData) => {
    setActiveReport(report.report_id)
    if (mapInstanceRef.current && report.lat && report.lon) {
      mapInstanceRef.current.setView([report.lat, report.lon], 10, { animate: true })
    }
  }

  const selectedReport = verifiedReports.find(r => r.report_id === activeReport)

  // Risk distribution bar
  const riskTotal = stats.totalReports || 1

  return (
    <TooltipProvider>
      <div className="w-full space-y-5" style={{ fontFamily: "'Inter', sans-serif" }}>

        {/* ━━━ HEADER ━━━ */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
              <Globe className="h-6 w-6 text-sky-400" />
              Risk Overview
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Verified field reports · GIS risk heatmap · {stats.zones} affected zones
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`text-[10px] gap-1 ${loading ? 'border-amber-500/40 text-amber-400' : 'border-emerald-500/40 text-emerald-400'}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${loading ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
              {loading ? 'Loading' : `${stats.totalReports} reports`}
            </Badge>
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5" onClick={fetchReports} disabled={loading}>
              {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
              Refresh
            </Button>
          </div>
        </div>

        {/* ━━━ STATS BAR ━━━ */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Critical', value: stats.criticalZones, icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10' },
            { label: 'High Risk', value: stats.highZones, icon: Shield, color: 'text-orange-400', bg: 'bg-orange-500/10' },
            { label: 'Verified Reports', value: stats.totalReports, icon: Eye, color: 'text-sky-400', bg: 'bg-sky-500/10' },
            { label: 'Affected Zones', value: stats.zones, icon: MapPin, color: 'text-violet-400', bg: 'bg-violet-500/10' },
          ].map(s => {
            const Icon = s.icon
            return (
              <div key={s.label} className="rounded-lg border border-border/50 p-3 flex items-center gap-3">
                <div className={`p-2 rounded-lg ${s.bg}`}>
                  <Icon className={`h-4 w-4 ${s.color}`} />
                </div>
                <div>
                  <div className="text-lg font-bold tabular-nums leading-tight">{s.value}</div>
                  <div className="text-[10px] text-muted-foreground">{s.label}</div>
                </div>
              </div>
            )
          })}
        </div>

        {/* ━━━ RISK DISTRIBUTION BAR ━━━ */}
        {stats.totalReports > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>Risk Distribution</span>
              <span>{stats.totalReports} total</span>
            </div>
            <div className="flex h-2 rounded-full overflow-hidden bg-muted/30">
              {stats.criticalZones > 0 && <div className="bg-red-500 transition-all" style={{ width: `${(stats.criticalZones / riskTotal) * 100}%` }} />}
              {stats.highZones > 0 && <div className="bg-orange-500 transition-all" style={{ width: `${(stats.highZones / riskTotal) * 100}%` }} />}
              {stats.mediumZones > 0 && <div className="bg-yellow-500 transition-all" style={{ width: `${(stats.mediumZones / riskTotal) * 100}%` }} />}
              {stats.lowZones > 0 && <div className="bg-emerald-500 transition-all" style={{ width: `${(stats.lowZones / riskTotal) * 100}%` }} />}
            </div>
            <div className="flex gap-4 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-red-500" /> Critical {stats.criticalZones}</span>
              <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-orange-500" /> High {stats.highZones}</span>
              <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-yellow-500" /> Medium {stats.mediumZones}</span>
              <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Low {stats.lowZones}</span>
            </div>
          </div>
        )}

        {/* ━━━ MAP + SIDEBAR ━━━ */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">

          {/* Map — 3 cols */}
          <Card className="lg:col-span-3 overflow-hidden">
            <CardContent className="p-0 relative">
              <div ref={mapRef} className="w-full h-[520px] bg-slate-900" />

              {/* Overlay badges */}
              <div className="absolute top-3 left-3 z-[400] flex gap-1.5">
                <Badge className="bg-background/80 backdrop-blur-sm text-foreground border-border/50 text-[10px] gap-1">
                  <Layers className="h-3 w-3" />
                  {verifiedReports.length} reports
                </Badge>
              </div>

              {loading && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-[500]">
                  <div className="text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-sky-400" />
                    <p className="text-xs text-muted-foreground">Loading reports…</p>
                  </div>
                </div>
              )}
              {!loading && verifiedReports.length === 0 && (
                <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center z-[500]">
                  <div className="text-center bg-background/90 rounded-lg p-6 border border-border/50">
                    <MapPin className="h-6 w-6 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-sm font-medium">No verified reports</p>
                    <p className="text-[11px] text-muted-foreground mt-1">Verified reports with coordinates appear here.</p>
                  </div>
                </div>
              )}
              {error && !loading && (
                <div className="absolute bottom-3 left-3 right-3 bg-red-500/10 backdrop-blur-sm border border-red-500/30 rounded-lg p-2.5 text-xs text-red-400 z-[500] flex items-center gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  {error}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sidebar — 1 col */}
          <div className="lg:col-span-1 space-y-3">

            {/* Selected report detail */}
            {selectedReport ? (
              <Card className="border-border/50">
                <CardHeader className="pb-2 pt-3 px-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs font-medium">{selectedReport.report_id}</CardTitle>
                    <Badge className={`text-[10px] ${RISK_BADGE[selectedReport.risk_level] || ''}`}>
                      {selectedReport.risk_level}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground">{selectedReport.zone}</p>
                </CardHeader>
                <CardContent className="px-3 pb-3 space-y-2.5">
                  <Separator />
                  <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-3">
                    {selectedReport.description}
                  </p>
                  <Separator />
                  <div className="space-y-1.5">
                    {selectedReport.estimated_size && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 text-muted-foreground"><FileText className="h-3 w-3" /> Size</span>
                        <span className="font-mono font-medium text-[11px]">{selectedReport.estimated_size}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-muted-foreground"><User className="h-3 w-3" /> Observer</span>
                      <span className="font-medium text-[11px]">{selectedReport.observer_name}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-muted-foreground"><Clock className="h-3 w-3" /> Submitted</span>
                      <span className="font-mono text-[11px]">{formatTime(selectedReport.created_at)}</span>
                    </div>
                    {selectedReport.reviewed_by && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 text-muted-foreground"><Shield className="h-3 w-3" /> Verified by</span>
                        <span className="font-medium text-[11px]">{selectedReport.reviewed_by}</span>
                      </div>
                    )}
                  </div>
                  {selectedReport.reviewer_feedback && (
                    <>
                      <Separator />
                      <div>
                        <div className="text-[10px] text-muted-foreground mb-1">Analyst Feedback</div>
                        <p className="text-[11px] leading-relaxed">{selectedReport.reviewer_feedback}</p>
                      </div>
                    </>
                  )}
                  <Button variant="ghost" size="sm" className="w-full text-xs h-7" onClick={() => setActiveReport(null)}>
                    Clear selection
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="rounded-lg border border-dashed border-border/50 p-4 text-center">
                <MapPin className="h-5 w-5 mx-auto text-muted-foreground/40 mb-2" />
                <p className="text-xs text-muted-foreground">Click a report to inspect</p>
              </div>
            )}

            {/* Report list */}
            <div className="space-y-1 max-h-[360px] overflow-y-auto pr-1">
              {verifiedReports.map(r => (
                <Tooltip key={r.report_id}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => focusReport(r)}
                      className={`w-full text-left rounded-lg border p-2.5 transition-all text-xs ${
                        activeReport === r.report_id
                          ? 'border-sky-500/40 bg-sky-500/5'
                          : 'border-border/40 hover:border-border hover:bg-accent/30'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full shrink-0 ${RISK_DOT[r.risk_level] || 'bg-gray-500'}`} />
                          <span className="font-medium">{r.report_id}</span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-2.5 w-2.5" />
                          <span className="text-[10px]">{formatTime(r.created_at)}</span>
                        </div>
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5 pl-4 flex items-center gap-1">
                        {r.zone}
                        <ChevronRight className="h-2.5 w-2.5 ml-auto" />
                      </div>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="text-xs max-w-[200px]">
                    <div className="font-medium">{r.observer_name}</div>
                    <div className="text-muted-foreground line-clamp-2">{r.description}</div>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>

          </div>
        </div>

        {/* ━━━ LEGEND ━━━ */}
        <div className="flex items-center gap-4 text-[10px] text-muted-foreground px-1">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500" /> Critical</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-orange-500" /> High</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-yellow-500" /> Medium</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Low</span>
          <Separator orientation="vertical" className="h-3" />
          <span>Dot size = risk intensity · Heatmap = density gradient · Clusters = grouped reports</span>
        </div>

      </div>
    </TooltipProvider>
  )
}
