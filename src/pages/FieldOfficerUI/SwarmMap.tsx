import { useAuthFetch, API_URL as AUTH_API_URL } from '@/context/AuthContext'
import { useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Loader2, Pause, Play, Navigation, Bug, AlertTriangle,
  Users, HeartPulse, Compass, Gauge, Mountain, Maximize2, Layers
} from 'lucide-react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
// @ts-ignore
import 'leaflet.heat'

// ── Types ────────────────────────────────────────────────────
interface SwarmProps {
  id: string
  name: string
  center_name: string
  mission_id: string
  report_id: string
  observer_name: string
  size: number
  area_km2: number
  density: number
  speed: number
  heading: number
  altitude: number
  health: number
  risk_level: string
  last_updated: string
  intensity: number
  trail: [number, number][]
}

interface SwarmFeature {
  type: string
  geometry: { type: string; coordinates: [number, number] }
  properties: SwarmProps
}

interface Stats {
  total_swarms: number
  total_locusts: number
  avg_health: number
  critical_count: number
  timestamp: string
}

const API_URL = import.meta.env.VITE_SWARM_API_URL || 'http://localhost:8001'

// ── Risk colors ──────────────────────────────────────────────
const RISK_COLORS: Record<string, string> = {
  critical: '#dc2626',
  high: '#ea580c',
  medium: '#eab308',
  low: '#22c55e',
}

const RISK_BADGE: Record<string, string> = {
  critical: 'bg-red-500/15 text-red-400 border-red-500/30',
  high: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  medium: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
  low: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
}

const RISK_DOT: Record<string, string> = {
  critical: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-yellow-500',
  low: 'bg-emerald-500',
}

// ── Pulsing CSS animation (injected once) ────────────────────
const PULSE_STYLE_ID = 'swarm-pulse-style'
function ensurePulseStyle() {
  if (document.getElementById(PULSE_STYLE_ID)) return
  const style = document.createElement('style')
  style.id = PULSE_STYLE_ID
  style.textContent = `
    @keyframes swarmPulse {
      0%   { transform: scale(1);   opacity: 0.85; }
      50%  { transform: scale(1.3); opacity: 0.4;  }
      100% { transform: scale(1);   opacity: 0.85; }
    }
    .swarm-pulse {
      animation: swarmPulse 2s ease-in-out infinite;
    }
    .swarm-marker-outer {
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }
    .swarm-marker-inner {
      border-radius: 50%;
      border: 2px solid rgba(255,255,255,0.9);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 10px;
      color: #fff;
      text-shadow: 0 1px 2px rgba(0,0,0,0.5);
    }
    .swarm-heading-arrow {
      position: absolute;
      width: 0; height: 0;
      border-left: 5px solid transparent;
      border-right: 5px solid transparent;
      border-bottom: 10px solid #fff;
      top: -12px; left: 50%;
      transform-origin: center bottom;
    }
  `
  document.head.appendChild(style)
}

// ── Main Component ───────────────────────────────────────────
export default function SwarmMap() {
  const authFetch = useAuthFetch()
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<L.Map | null>(null)
  const markersRef = useRef<Map<string, L.Marker>>(new Map())
  const trailsRef = useRef<Map<string, L.Polyline>>(new Map())
  const heatRef = useRef<L.Layer | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [stats, setStats] = useState<Stats | null>(null)
  const [swarms, setSwarms] = useState<SwarmProps[]>([])
  
  const [drones, setDrones] = useState<any[]>([])
  const [missions, setMissions] = useState<any[]>([])
  const [reports, setReports] = useState<any[]>([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [paused, setPaused] = useState(false)
  const [selectedSwarm, setSelectedSwarm] = useState<string | null>(null)
  const [tickCount, setTickCount] = useState(0)

  // ── Initialize map ─────────────────────────────────────────
  useEffect(() => {
    ensurePulseStyle()
    if (!mapRef.current || mapInstance.current) return

    const map = L.map(mapRef.current, { zoomControl: true }).setView([30.2, 69.3], 6)

    const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    })
    streetLayer.addTo(map)

    const satelliteLayer = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      { attribution: 'Tiles &copy; Esri', maxZoom: 18 }
    )

    L.control.layers(
      { 'Street': streetLayer, 'Satellite': satelliteLayer },
      {},
      { position: 'topright' }
    ).addTo(map)


    mapInstance.current = map

    // Force Leaflet to recalculate after CSS grid layout settles
    setTimeout(() => map.invalidateSize(), 100)
    setTimeout(() => map.invalidateSize(), 300)

    // Also watch for container resizes
    const ro = new ResizeObserver(() => map.invalidateSize())
    ro.observe(mapRef.current)

    return () => {
      ro.disconnect()
      map.remove()
      mapInstance.current = null
      markersRef.current.clear()
      trailsRef.current.clear()
    }
  }, [])

  // ── Fetch + update loop ────────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [geoRes, statsRes, dRes, mRes, rRes] = await Promise.all([
          fetch(`${API_URL}/api/swarms/geojson`),
          fetch(`${API_URL}/api/swarms/stats`),
          authFetch(`${AUTH_API_URL}/api/drones`),
          authFetch(`${AUTH_API_URL}/api/missions`),
          authFetch(`${AUTH_API_URL}/api/reports`),
        ])
        if (!geoRes.ok || !statsRes.ok) throw new Error('API error')

        const geoData = await geoRes.json()
        const statsData: Stats = await statsRes.json()

        const fDrones = dRes.ok ? await dRes.json() : []
        const fMissions = mRes.ok ? await mRes.json() : []
        const fReports = rRes.ok ? await rRes.json() : []

        setDrones(fDrones)
        setMissions(fMissions)
        setReports(fReports)

        const features: SwarmFeature[] = geoData.features || []
        const swarmList = features.map(f => f.properties)
        setSwarms(swarmList)
        setStats(statsData)
        setError(null)
        setTickCount(t => t + 1)

        // Find active missions to attach drones
        const activeMissions = fMissions.filter((m: any) => m.status === 'Assigned' || m.status === 'In Progress')

        // ── Update map markers ───────────────────────────
        if (!mapInstance.current) return
        const map = mapInstance.current
        const currentIds = new Set(swarmList.map(s => s.id))

        // Remove dead swarms
        markersRef.current.forEach((marker, id) => {
          if (!currentIds.has(id)) {
            map.removeLayer(marker)
            markersRef.current.delete(id)
          }
        })
        trailsRef.current.forEach((line, id) => {
          if (!currentIds.has(id)) {
            map.removeLayer(line)
            trailsRef.current.delete(id)
          }
        })

        // Update or create markers
        for (const feature of features) {
          const p = feature.properties
          const [lon, lat] = feature.geometry.coordinates
          const color = RISK_COLORS[p.risk_level] || '#6b7280'
          const radius = Math.max(16, Math.min(40, 10 + (p.area_km2 / 20)))

          // Build custom icon
          const icon = L.divIcon({
            className: '',
            iconSize: [radius * 2, radius * 2],
            iconAnchor: [radius, radius],
            html: `
              <div class="swarm-marker-outer swarm-pulse" style="width:${radius * 2}px; height:${radius * 2}px; background: ${color}33;">
                <div class="swarm-marker-inner" style="width:${radius * 1.2}px; height:${radius * 1.2}px; background: ${color};">
                  🦗
                </div>
                <div class="swarm-heading-arrow" style="transform: translateX(-50%) rotate(${p.heading}deg);"></div>
              </div>
            `,
          })

          // Attach Drone Info
          const swarmReport = fReports.find((r: any) => r.report_id === p.report_id)
          const assignedMission = activeMissions.find((m: any) => m.report_id === swarmReport?.id)
          const trackingDrone = assignedMission ? fDrones.find((d: any) => d.id === assignedMission.drone_id) : null

          // Popup content
          const popupHtml = `
            <div style="font-family: 'Inter', system-ui, sans-serif; font-size: 12px; min-width: 250px;">
              <div style="display:flex; align-items:center; gap:6px; margin-bottom:4px;">
                <strong style="font-size:14px;">${p.id}</strong>
                <span style="background:${color}22; color:${color}; padding:2px 8px; border-radius:4px; font-size:11px; font-weight:600;">${p.risk_level.toUpperCase()}</span>
              </div>
              <div style="color:#999; margin-bottom:4px;">${p.center_name}</div>
              ${p.report_id ? `<div style="font-size:11px; color:#888; margin-bottom:2px;">Report: <strong>${p.report_id}</strong></div>` : ''}
              ${p.observer_name ? `<div style="font-size:11px; color:#888; margin-bottom:2px;">Observer: <strong>${p.observer_name}</strong></div>` : ''}
              ${trackingDrone ? `<div style="font-size:11px; color:#38bdf8; margin-bottom:6px; background:#0ea5e915; border:1px solid #0ea5e930; padding:4px 6px; border-radius:4px;">Drone: <strong>${trackingDrone.drone_id}</strong> (${trackingDrone.model})</div>` : ''}
              <table style="width:100%; font-size:11px; border-collapse:collapse; margin-top:6px;">
                <tr><td style="padding:2px 0; color:#888;">Area</td><td style="text-align:right; font-weight:600;">${p.area_km2.toFixed(1)} km²</td></tr>
                <tr><td style="padding:2px 0; color:#888;">Population</td><td style="text-align:right; font-weight:600;">${(p.size / 1e9).toFixed(2)}B</td></tr>
                <tr><td style="padding:2px 0; color:#888;">Density</td><td style="text-align:right; font-weight:600;">${(p.density / 1e6).toFixed(1)}M/km²</td></tr>
                <tr><td style="padding:2px 0; color:#888;">Speed</td><td style="text-align:right; font-weight:600;">${p.speed.toFixed(1)} km/h</td></tr>
                <tr><td style="padding:2px 0; color:#888;">Heading</td><td style="text-align:right; font-weight:600;">${p.heading.toFixed(0)}°</td></tr>
                <tr><td style="padding:2px 0; color:#888;">Altitude</td><td style="text-align:right; font-weight:600;">${p.altitude.toFixed(0)} m</td></tr>
                <tr><td style="padding:2px 0; color:#888;">Health</td><td style="text-align:right; font-weight:600;">${(p.health * 100).toFixed(0)}%</td></tr>
              </table>
              <div style="margin-top:6px; padding-top:6px; border-top:1px solid #333;">
                <div style="background:#222; border-radius:4px; height:6px; overflow:hidden;">
                  <div style="height:100%; background:linear-gradient(to right, #22c55e, #dc2626); width:${p.health * 100}%;"></div>
                </div>
              </div>
              <div style="margin-top:4px; font-size:10px; color:#666;">${lat.toFixed(6)}, ${lon.toFixed(6)}</div>
            </div>
          `

          if (markersRef.current.has(p.id)) {
            // Smoothly move existing marker
            const marker = markersRef.current.get(p.id)!
            marker.setLatLng([lat, lon])
            marker.setIcon(icon)
            marker.getPopup()?.setContent(popupHtml)
          } else {
            // Create new marker
            const marker = L.marker([lat, lon], { icon })
              .bindPopup(popupHtml, { maxWidth: 280 })
              .addTo(map)
            marker.on('click', () => setSelectedSwarm(p.id))
            markersRef.current.set(p.id, marker)
          }

          // Trail line
          if (p.trail && p.trail.length > 1) {
            const trailCoords = p.trail.map(([tLat, tLon]: [number, number]) => [tLat, tLon] as L.LatLngTuple)
            if (trailsRef.current.has(p.id)) {
              trailsRef.current.get(p.id)!.setLatLngs(trailCoords)
            } else {
              const line = L.polyline(trailCoords, {
                color: color,
                weight: 2,
                opacity: 0.5,
                dashArray: '6, 4',
              }).addTo(map)
              trailsRef.current.set(p.id, line)
            }
          }
        }

        // Update heatmap
        if (heatRef.current) {
          map.removeLayer(heatRef.current)
        }
        const heatData = features
          .map(f => [f.geometry.coordinates[1], f.geometry.coordinates[0], f.properties.intensity] as [number, number, number])
        if (heatData.length > 0) {
          // @ts-ignore
          heatRef.current = L.heatLayer(heatData, {
            radius: 70,
            blur: 25,
            maxZoom: 12,
            max: 1.0,
            gradient: { 0.0: '#0047ab', 0.25: '#00d4ff', 0.5: '#ffff00', 0.75: '#ff7f00', 1.0: '#8b0000' },
            minOpacity: 0.15,
          }).addTo(map)
        }

        if (loading) setLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Connection failed')
        if (loading) setLoading(false)
      }
    }

    fetchData()
    if (!paused) {
      intervalRef.current = setInterval(fetchData, 3000) // Poll every 3s
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [paused]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Focus on swarm ─────────────────────────────────────────
  const focusSwarm = (id: string) => {
    setSelectedSwarm(id)
    const marker = markersRef.current.get(id)
    if (marker && mapInstance.current) {
      const ll = marker.getLatLng()
      mapInstance.current.setView(ll, 8, { animate: true })
      marker.openPopup()
    }
  }

  const selectedData = swarms.find(s => s.id === selectedSwarm)

  return (
    <TooltipProvider>
      <div className="space-y-5" style={{ fontFamily: "'Inter', sans-serif" }}>

        {/* ━━━ HEADER ━━━ */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
              Swarm Map
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Live tracking · 3s polling · {tickCount > 0 ? `Tick #${tickCount}` : 'Connecting…'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`text-[10px] gap-1 ${paused ? 'border-orange-500/40 text-orange-400' : 'border-emerald-500/40 text-emerald-400'}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${paused ? 'bg-orange-500' : 'bg-emerald-500 animate-pulse'}`} />
              {paused ? 'Paused' : 'Live'}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1.5"
              onClick={() => setPaused(!paused)}
            >
              {paused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
              {paused ? 'Resume' : 'Pause'}
            </Button>
          </div>
        </div>

        {/* ━━━ STATS BAR ━━━ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Active Swarms', value: stats?.total_swarms ?? '—', icon: Bug, color: 'text-red-400', bg: 'bg-red-500/10', glow: 'bg-red-500' },
            { label: 'Critical', value: stats?.critical_count ?? '—', icon: AlertTriangle, color: 'text-orange-400', bg: 'bg-orange-500/10', glow: 'bg-orange-500' },
            { label: 'Total Locusts', value: stats ? `${(stats.total_locusts / 1e9).toFixed(1)}B` : '—', icon: Users, color: 'text-sky-400', bg: 'bg-sky-500/10', glow: 'bg-sky-500' },
            { label: 'Avg Health', value: stats ? `${(stats.avg_health * 100).toFixed(0)}%` : '—', icon: HeartPulse, color: 'text-emerald-400', bg: 'bg-emerald-500/10', glow: 'bg-emerald-500' },
          ].map(s => {
            const Icon = s.icon
            return (
              <div key={s.label} className="group relative overflow-hidden p-4 rounded-2xl bg-gradient-to-br from-background/80 to-muted/20 border border-border/40 hover:border-border/80 transition-all duration-300 shadow-sm hover:shadow-md flex items-center gap-4">
                <div className={`absolute -inset-1 opacity-0 group-hover:opacity-10 transition-opacity duration-500 blur-2xl ${s.glow}`} />
                <div className="relative z-10 flex items-center gap-4 w-full">
                  <div className={`p-2.5 rounded-xl ${s.bg} ring-1 ring-inset ring-foreground/5 shadow-inner transition-transform group-hover:scale-110 duration-300`}>
                    <Icon className={`h-5 w-5 ${s.color}`} />
                  </div>
                  <div>
                    <div className="text-2xl font-bold tabular-nums tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>{s.value}</div>
                    <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mt-0.5">{s.label}</div>
                  </div>
                </div>
                <div className={`absolute bottom-0 left-0 right-0 h-[3px] opacity-60 group-hover:opacity-100 transition-opacity bg-gradient-to-r from-transparent via-current to-transparent`} style={{ color: s.color.replace('text-', '') }} />
              </div>
            )
          })}
        </div>

        {/* ━━━ MAP + SIDEBAR ━━━ */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">

          {/* Map — 3 cols */}
          <Card className="lg:col-span-3 overflow-hidden">
            <CardContent className="p-0 relative">
              <div ref={mapRef} className="w-full h-[520px] bg-slate-900" />

              {/* Overlay: status indicator */}
              <div className="absolute top-3 left-3 z-[400] flex gap-1.5">
                <Badge className="bg-background/80 backdrop-blur-sm text-foreground border-border/50 text-[10px] gap-1">
                  <Layers className="h-3 w-3" />
                  {swarms.length} swarm{swarms.length !== 1 ? 's' : ''}
                </Badge>
              </div>

              {loading && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-[500]">
                  <div className="text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-sky-400" />
                    <p className="text-xs text-muted-foreground">Connecting to Swarm Engine…</p>
                  </div>
                </div>
              )}
              {error && !loading && (
                <div className="absolute bottom-3 left-3 right-3 bg-red-500/10 backdrop-blur-sm border border-red-500/30 rounded-lg p-2.5 text-xs text-red-400 z-[500] flex items-center gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  {error} — Ensure the Swarm Engine is running
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sidebar — Selected swarm detail or swarm list */}
          <div className="lg:col-span-1 space-y-3">

            {/* Selected swarm detail */}
            {selectedData ? (
              <Card className="border-border/50">
                <CardHeader className="pb-2 pt-4 px-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">{selectedData.id}</CardTitle>
                    <Badge className={`text-[10px] ${RISK_BADGE[selectedData.risk_level]}`}>
                      {selectedData.risk_level.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground">{selectedData.center_name}</p>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-3">
                  <Separator />
                  <div className="space-y-2">
                    {[
                      { icon: Maximize2, label: 'Area', value: `${selectedData.area_km2.toFixed(1)} km²` },
                      { icon: Users, label: 'Population', value: `${(selectedData.size / 1e9).toFixed(2)}B` },
                      { icon: Gauge, label: 'Speed', value: `${selectedData.speed.toFixed(1)} km/h` },
                      { icon: Compass, label: 'Heading', value: `${selectedData.heading.toFixed(0)}°` },
                      { icon: Mountain, label: 'Altitude', value: `${selectedData.altitude.toFixed(0)} m` },
                    ].map(row => {
                      const RIcon = row.icon
                      return (
                        <div key={row.label} className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1.5 text-muted-foreground">
                            <RIcon className="h-3 w-3" /> {row.label}
                          </span>
                          <span className="font-mono font-medium tabular-nums">{row.value}</span>
                        </div>
                      )
                    })}
                  </div>
                  <Separator />
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-muted-foreground flex items-center gap-1"><HeartPulse className="h-3 w-3" /> Health</span>
                      <span className="font-mono font-medium">{(selectedData.health * 100).toFixed(0)}%</span>
                    </div>
                    <Progress
                      value={selectedData.health * 100}
                      className={`h-1.5 ${selectedData.health > 0.6 ? '[&>div]:bg-emerald-500' : selectedData.health > 0.3 ? '[&>div]:bg-orange-500' : '[&>div]:bg-red-500'}`}
                    />
                  </div>
                  <Button variant="ghost" size="sm" className="w-full text-xs h-7" onClick={() => setSelectedSwarm(null)}>
                    Clear selection
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="rounded-lg border border-dashed border-border/50 p-4 text-center">
                <Navigation className="h-5 w-5 mx-auto text-muted-foreground/40 mb-2" />
                <p className="text-xs text-muted-foreground">Click a swarm to inspect</p>
              </div>
            )}

            {/* Swarm list */}
            <div className="space-y-1.5 max-h-[340px] overflow-y-auto pr-1">
              {swarms.map(s => (
                <Tooltip key={s.id}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => focusSwarm(s.id)}
                      className={`w-full text-left rounded-lg border p-2.5 transition-all text-xs ${
                        selectedSwarm === s.id
                          ? 'border-sky-500/40 bg-sky-500/5'
                          : 'border-border/40 hover:border-border hover:bg-accent/30'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${RISK_DOT[s.risk_level] || 'bg-gray-500'}`} />
                          <span className="font-medium">{s.id}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Navigation className="h-2.5 w-2.5" style={{ transform: `rotate(${s.heading}deg)` }} />
                          <span className="font-mono tabular-nums">{s.speed.toFixed(0)} km/h</span>
                        </div>
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5 pl-4">{s.center_name}</div>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="text-xs">
                    <div>{s.area_km2.toFixed(1)} km² · {(s.size / 1e9).toFixed(2)}B locusts</div>
                    <div>Health: {(s.health * 100).toFixed(0)}%</div>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>

          </div>
        </div>

        {/* ━━━ LEGEND ━━━ */}
        <div className="flex items-center gap-6 text-[11px] text-muted-foreground px-1">
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-red-500" /> Critical</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-orange-500" /> High</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-yellow-500" /> Medium</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Low</span>
          <Separator orientation="vertical" className="h-3" />
          <span className="flex items-center gap-1">Pulsing dot = swarm · Dashed line = trail · Background heat = density</span>
        </div>

      </div>
    </TooltipProvider>
  )
}
