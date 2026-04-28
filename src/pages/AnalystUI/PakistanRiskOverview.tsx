import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertCircle, Layers, MapPin, TrendingUp, Loader2, RefreshCw } from 'lucide-react'
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

  // Only verified reports with coordinates
  const verifiedReports = reports.filter(
    r => r.status === 'Verified' && r.lat !== null && r.lon !== null
  )

  // ── Stats from real data ───────────────────────────────────
  const stats = {
    totalReports: verifiedReports.length,
    criticalZones: verifiedReports.filter(r => r.risk_level === 'Critical').length,
    highZones: verifiedReports.filter(r => r.risk_level === 'High').length,
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

    // Street layer (default)
    const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    })
    streetLayer.addTo(map)

    // Satellite layer
    const satelliteLayer = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      { attribution: 'Tiles &copy; Esri', maxZoom: 18 }
    )

    // Terrain hillshade overlay
    const terrainLayer = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Terrain_Base/MapServer/tile/{z}/{y}/{x}',
      { attribution: 'Tiles &copy; Esri', maxZoom: 13, opacity: 0.3 }
    )

    // Marker cluster group
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

    // Layer control
    L.control.layers(
      { 'Street': streetLayer, 'Satellite': satelliteLayer },
      { 'Terrain Overlay': terrainLayer, 'Report Clusters': markerClusterGroup },
      { position: 'topright' }
    ).addTo(map)

    mapInstanceRef.current = map
    setMapReady(true)

    return () => { map.remove(); mapInstanceRef.current = null; setMapReady(false) }
  }, [])

  // ── Update map markers when data changes ───────────────────
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !markersRef.current) return

    const map = mapInstanceRef.current
    const clusterGroup = markersRef.current

    // Clear old markers
    clusterGroup.clearLayers()

    // Remove old heat layer
    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current)
      heatLayerRef.current = null
    }

    if (verifiedReports.length === 0) return

    // Add markers for each verified report
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
        <div style="font-family: system-ui; font-size: 12px; min-width: 220px;">
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
            <strong style="font-size: 14px;">${report.report_id}</strong>
            <span style="background: ${color}22; color: ${color}; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">${report.risk_level}</span>
          </div>
          <div style="color: #999; margin-bottom: 8px; font-size: 11px;">${report.zone}</div>
          <div style="background: #f5f5f5; padding: 8px; border-radius: 6px; margin-bottom: 8px; color: #333; line-height: 1.4;">
            ${report.description.length > 150 ? report.description.substring(0, 150) + '…' : report.description}
          </div>
          <div style="font-size: 11px; space-y: 2px;">
            ${report.estimated_size ? `<div><strong>Estimated Size:</strong> ${report.estimated_size}</div>` : ''}
            <div><strong>Submitted by:</strong> ${report.observer_name}</div>
            <div><strong>Submitted:</strong> ${formatTime(report.created_at)}</div>
            ${report.reviewed_by ? `<div><strong>Verified by:</strong> ${report.reviewed_by}</div>` : ''}
            ${report.reviewed_at ? `<div><strong>Verified:</strong> ${formatTime(report.reviewed_at)}</div>` : ''}
            ${report.reviewer_feedback ? `<div style="margin-top: 4px; padding-top: 4px; border-top: 1px solid #eee;"><strong>Feedback:</strong> ${report.reviewer_feedback}</div>` : ''}
          </div>
          <div style="margin-top: 6px; font-size: 10px; color: #aaa;">
            📍 ${report.lat!.toFixed(6)}, ${report.lon!.toFixed(6)}
          </div>
        </div>
      `)

      marker.on('click', () => setActiveReport(report.report_id))
      clusterGroup.addLayer(marker)
    })

    // Heat layer from verified reports
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

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-2">
            <MapPin className="h-8 w-8 text-red-400" />
            Pakistan Risk Overview
          </h2>
          <p className="text-muted-foreground">
            Verified field report locations · Live risk distribution across Pakistan
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={fetchReports} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/25">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-300 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Critical Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-400">{stats.criticalZones}</div>
            <p className="text-xs text-red-300 mt-1">Immediate action required</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/25">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-300">High Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-300">{stats.highZones}</div>
            <p className="text-xs text-orange-300 mt-1">Elevated risk areas</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-violet-500/10 to-violet-500/5 border-violet-500/25">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-violet-300">Verified Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-violet-300">{stats.totalReports}</div>
            <p className="text-xs text-violet-300 mt-1">With location data</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-sky-500/10 to-sky-500/5 border-sky-500/25">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-sky-300 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Affected Zones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-sky-300">{stats.zones}</div>
            <p className="text-xs text-sky-300 mt-1">Distinct zones reported</p>
          </CardContent>
        </Card>
      </div>

      {/* Map Container */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 text-foreground pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5" />
              <CardTitle className="text-foreground">GIS Risk Visualization</CardTitle>
            </div>
            <div className="flex gap-2">
              <Badge variant="secondary" className="bg-white/10 text-foreground border-white/20">
                Verified Reports Only
              </Badge>
              <Badge variant="secondary" className="bg-white/10 text-foreground border-white/20">
                {verifiedReports.length} points
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 relative">
          <div ref={mapRef} className="w-full h-96 md:h-[500px] lg:h-[600px] bg-slate-800" />
          {loading && (
            <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-sky-400" />
                <p className="text-sm text-muted-foreground">Loading reports…</p>
              </div>
            </div>
          )}
          {!loading && verifiedReports.length === 0 && (
            <div className="absolute inset-0 bg-background/40 flex items-center justify-center">
              <div className="text-center bg-background/80 rounded-lg p-6 border border-border">
                <MapPin className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                <p className="font-medium">No verified reports with coordinates</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Reports approved by analysts will appear here as risk markers.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Verified Reports List */}
      {verifiedReports.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-400" />
              Verified Risk Reports
            </CardTitle>
            <CardDescription>Click any report on the map to highlight it below</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {verifiedReports.map((report) => (
                <div
                  key={report.report_id}
                  className={`p-4 rounded-lg border-l-4 cursor-pointer transition-all ${
                    activeReport === report.report_id
                      ? 'border-sky-500 bg-sky-500/10 shadow-lg ring-1 ring-sky-500/30'
                      : 'bg-muted/40 hover:bg-muted/60'
                  }`}
                  style={{ borderLeftColor: activeReport === report.report_id ? '#38bdf8' : riskColor(report.risk_level) }}
                  onClick={() => {
                    setActiveReport(report.report_id)
                    if (mapInstanceRef.current && report.lat && report.lon) {
                      mapInstanceRef.current.setView([report.lat, report.lon], 10, { animate: true })
                    }
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-bold text-sm">{report.report_id}</h4>
                      <p className="text-xs text-muted-foreground">{report.zone}</p>
                    </div>
                    <Badge
                      className={`text-xs ${
                        report.risk_level === 'Critical' ? 'bg-red-500/15 text-red-400' :
                        report.risk_level === 'High' ? 'bg-orange-500/15 text-orange-400' :
                        report.risk_level === 'Medium' ? 'bg-yellow-500/15 text-yellow-300' :
                        'bg-green-500/15 text-green-400'
                      }`}
                    >
                      {report.risk_level}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{report.description}</p>
                  <div className="space-y-1 text-xs">
                    {report.estimated_size && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Size:</span>
                        <span className="font-semibold">{report.estimated_size}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">By:</span>
                      <span className="font-semibold">{report.observer_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Submitted:</span>
                      <span className="font-semibold">{formatTime(report.created_at)}</span>
                    </div>
                    {report.reviewed_by && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Verified by:</span>
                        <span className="font-semibold">{report.reviewed_by}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Box */}
      <Card className="bg-sky-500/10 border-sky-500/20">
        <CardHeader>
          <CardTitle className="text-sm">📊 What You're Seeing</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2 text-sky-100">
          <p>
            <strong>Risk Markers:</strong> Each dot represents a verified field report. Dot size and color reflect risk level (Critical → red, High → orange, Medium → yellow, Low → green).
          </p>
          <p>
            <strong>Heatmap Layer:</strong> Color gradient from blue (low) → yellow → red (critical) showing intensity distribution across the region.
          </p>
          <p>
            <strong>Marker Clusters:</strong> Reports in the same area are grouped — zoom in to see individual reports.
          </p>
          <p>
            <strong>Click a marker</strong> to see full report details: observer name, submission time, description, verification status, and analyst feedback.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
