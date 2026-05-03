import { useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2, Pause, Play, Navigation } from 'lucide-react'
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
  critical: 'bg-red-500/15 text-red-300 border-red-500/30',
  high: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
  medium: 'bg-yellow-500/15 text-yellow-200 border-yellow-500/30',
  low: 'bg-green-500/15 text-green-300 border-green-500/30',
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
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<L.Map | null>(null)
  const markersRef = useRef<Map<string, L.Marker>>(new Map())
  const trailsRef = useRef<Map<string, L.Polyline>>(new Map())
  const heatRef = useRef<L.Layer | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [stats, setStats] = useState<Stats | null>(null)
  const [swarms, setSwarms] = useState<SwarmProps[]>([])
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

    return () => {
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
        const [geoRes, statsRes] = await Promise.all([
          fetch(`${API_URL}/api/swarms/geojson`),
          fetch(`${API_URL}/api/swarms/stats`),
        ])
        if (!geoRes.ok || !statsRes.ok) throw new Error('API error')

        const geoData = await geoRes.json()
        const statsData: Stats = await statsRes.json()

        const features: SwarmFeature[] = geoData.features || []
        const swarmList = features.map(f => f.properties)
        setSwarms(swarmList)
        setStats(statsData)
        setError(null)
        setTickCount(t => t + 1)

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

          // Popup content
          const popupHtml = `
            <div style="font-family: system-ui; font-size: 12px; min-width: 250px;">
              <div style="display:flex; align-items:center; gap:6px; margin-bottom:4px;">
                <strong style="font-size:14px;">${p.id}</strong>
                <span style="background:${color}22; color:${color}; padding:2px 8px; border-radius:4px; font-size:11px; font-weight:600;">${p.risk_level.toUpperCase()}</span>
              </div>
              <div style="color:#999; margin-bottom:4px;">${p.center_name}</div>
              ${p.report_id ? `<div style="font-size:11px; color:#888; margin-bottom:2px;">📋 Report: <strong>${p.report_id}</strong></div>` : ''}
              ${p.observer_name ? `<div style="font-size:11px; color:#888; margin-bottom:6px;">👤 Submitted by: <strong>${p.observer_name}</strong></div>` : ''}
              <table style="width:100%; font-size:11px; border-collapse:collapse;">
                <tr><td style="padding:2px 0; color:#888;">Area</td><td style="text-align:right; font-weight:600;">${p.area_km2.toFixed(1)} km²</td></tr>
                <tr><td style="padding:2px 0; color:#888;">Population</td><td style="text-align:right; font-weight:600;">${(p.size / 1e9).toFixed(2)}B</td></tr>
                <tr><td style="padding:2px 0; color:#888;">Density</td><td style="text-align:right; font-weight:600;">${(p.density / 1e6).toFixed(1)}M/km²</td></tr>
                <tr><td style="padding:2px 0; color:#888;">Speed</td><td style="text-align:right; font-weight:600;">${p.speed.toFixed(1)} km/h</td></tr>
                <tr><td style="padding:2px 0; color:#888;">Heading</td><td style="text-align:right; font-weight:600;">${p.heading.toFixed(0)}°</td></tr>
                <tr><td style="padding:2px 0; color:#888;">Altitude</td><td style="text-align:right; font-weight:600;">${p.altitude.toFixed(0)} m</td></tr>
                <tr><td style="padding:2px 0; color:#888;">Health</td><td style="text-align:right; font-weight:600;">${(p.health * 100).toFixed(0)}%</td></tr>
              </table>
              <div style="margin-top:6px; padding-top:6px; border-top:1px solid #eee;">
                <div style="background:#f5f5f5; border-radius:4px; height:6px; overflow:hidden;">
                  <div style="height:100%; background:linear-gradient(to right, #22c55e, #dc2626); width:${p.health * 100}%;"></div>
                </div>
              </div>
              <div style="margin-top:4px; font-size:10px; color:#aaa;">📍 ${lat.toFixed(6)}, ${lon.toFixed(6)}</div>
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Swarm Map</h1>
          <p className="text-muted-foreground mt-2">
            Live swarm tracking · Positions update every 3s · {tickCount > 0 ? `Tick #${tickCount}` : 'Connecting…'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={paused ? 'default' : 'outline'}
            size="sm"
            className="gap-2"
            onClick={() => setPaused(!paused)}
          >
            {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            {paused ? 'Resume' : 'Pause'}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="pt-5 pb-4">
            <div className="text-sm text-muted-foreground">Active Swarms</div>
            <div className="text-3xl font-bold">{stats?.total_swarms ?? '—'}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="pt-5 pb-4">
            <div className="text-sm text-muted-foreground">Critical</div>
            <div className="text-3xl font-bold text-red-400">{stats?.critical_count ?? '—'}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-5 pb-4">
            <div className="text-sm text-muted-foreground">Total Locusts</div>
            <div className="text-2xl font-bold">{stats ? `${(stats.total_locusts / 1e9).toFixed(1)}B` : '—'}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-5 pb-4">
            <div className="text-sm text-muted-foreground">Avg Health</div>
            <div className="text-3xl font-bold text-green-300">{stats ? `${(stats.avg_health * 100).toFixed(0)}%` : '—'}</div>
          </CardContent>
        </Card>
      </div>

      {/* Map */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 text-foreground pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-foreground flex items-center gap-2">
              🗺️ Live Swarm Tracker
            </CardTitle>
            <div className="flex gap-2">
              <Badge variant="secondary" className="bg-white/10 text-foreground border-white/20">
                {paused ? '⏸ Paused' : '🔴 LIVE'}
              </Badge>
              <Badge variant="secondary" className="bg-white/10 text-foreground border-white/20">
                {swarms.length} swarm{swarms.length !== 1 ? 's' : ''}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 relative">
          <div ref={mapRef} className="w-full h-96 md:h-[500px] lg:h-[600px] bg-slate-900" />
          {loading && (
            <div className="absolute inset-0 bg-background/70 flex items-center justify-center z-[500]">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-sky-400" />
                <p className="text-sm">Connecting to Swarm Engine…</p>
              </div>
            </div>
          )}
          {error && !loading && (
            <div className="absolute bottom-4 left-4 right-4 bg-red-500/15 border border-red-500/30 rounded-lg p-3 text-sm text-red-300 z-[500]">
              ⚠️ {error} — Make sure the Swarm Engine is running on the server
            </div>
          )}
        </CardContent>
      </Card>

      {/* Swarm Details Panel */}
      {swarms.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🦗 Active Swarms
              <span className="text-xs text-muted-foreground font-normal ml-auto">Click a card to focus on the map</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {swarms.map((s) => (
                <div
                  key={s.id}
                  className={`p-4 rounded-lg border-l-4 cursor-pointer transition-all ${
                    selectedSwarm === s.id
                      ? 'bg-sky-500/10 ring-1 ring-sky-500/30 shadow-lg'
                      : 'bg-muted/40 hover:bg-muted/60'
                  }`}
                  style={{ borderLeftColor: RISK_COLORS[s.risk_level] || '#6b7280' }}
                  onClick={() => focusSwarm(s.id)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-bold text-sm flex items-center gap-1.5">
                        {s.id}
                        <Navigation className="h-3 w-3 text-muted-foreground" style={{ transform: `rotate(${s.heading}deg)` }} />
                      </h4>
                      <p className="text-xs text-muted-foreground">{s.center_name}</p>
                    </div>
                    <Badge className={RISK_BADGE[s.risk_level]}>{s.risk_level.toUpperCase()}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mt-2">
                    <div className="flex justify-between"><span className="text-muted-foreground">Area</span><span className="font-mono font-semibold">{s.area_km2.toFixed(1)} km²</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Pop</span><span className="font-mono font-semibold">{(s.size / 1e9).toFixed(2)}B</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Speed</span><span className="font-mono font-semibold">{s.speed.toFixed(1)} km/h</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Alt</span><span className="font-mono font-semibold">{s.altitude.toFixed(0)} m</span></div>
                  </div>
                  <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-red-500 transition-all duration-500"
                      style={{ width: `${s.health * 100}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-1 text-right">Health: {(s.health * 100).toFixed(0)}%</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Legend */}
      <Card className="bg-sky-500/10 border-sky-500/20">
        <CardHeader>
          <CardTitle className="text-sm">📊 Map Legend</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2 text-sky-100">
          <p><strong>🦗 Pulsing markers:</strong> Each swarm is a pulsing dot — size reflects swarm area, color reflects risk level. The white arrow shows heading direction.</p>
          <p><strong>- - - Dashed trails:</strong> Show the swarm's recent movement path (last 20 positions).</p>
          <p><strong>🌡️ Heatmap:</strong> Background heat layer visualizes swarm density concentration.</p>
          <p><strong>⏸ Pause/Play:</strong> Stop polling to inspect the map without updates.</p>
        </CardContent>
      </Card>
    </div>
  )
}
