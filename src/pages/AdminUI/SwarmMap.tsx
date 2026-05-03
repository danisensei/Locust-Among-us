import { useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2, Pause, Play, Plane, BatteryMedium, Radar, MapPin } from 'lucide-react'
import { useAuthFetch, API_URL } from '@/context/AuthContext'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// ── Types ────────────────────────────────────────────────────
interface SwarmProps {
  layer: 'swarm'
  report_id: string
  zone: string
  risk_level: string
  estimated_size: string | null
  description: string
  observer_name: string
  color: string
  created_at: string
}

interface DroneProps {
  layer: 'drone'
  drone_id: string
  drone_db_id: number
  model: string
  battery: number
  status: string
  heading: number
  trail: [number, number][]
  mission_id: string
  mission_type: string
  mission_status: string
  coverage_km: number
  altitude_m: number
  report_id: string
  zone: string
  risk_level: string
  color: string
  swarm_lat: number
  swarm_lon: number
}

type FeatureProps = SwarmProps | DroneProps

interface LiveFeature {
  type: string
  geometry: { type: string; coordinates: [number, number] }
  properties: FeatureProps
}

interface Stats {
  active_missions: number
  in_progress: number
  drones_deployed: number
  avg_battery: number
  total_coverage_km2: number
}

const SWARM_API = import.meta.env.VITE_SWARM_API_URL || 'http://localhost:8001'

// ── Pulse style ──────────────────────────────────────────────
const PULSE_ID = 'mission-pulse-style'
function ensurePulseStyle() {
  if (document.getElementById(PULSE_ID)) return
  const s = document.createElement('style')
  s.id = PULSE_ID
  s.textContent = `
    @keyframes missionPulse {
      0%   { transform: scale(1);   opacity: 0.8; }
      50%  { transform: scale(1.4); opacity: 0.3; }
      100% { transform: scale(1);   opacity: 0.8; }
    }
    .mission-pulse { animation: missionPulse 2s ease-in-out infinite; }
    @keyframes droneGlow {
      0%   { box-shadow: 0 0 4px rgba(56,189,248,0.5); }
      50%  { box-shadow: 0 0 12px rgba(56,189,248,0.9); }
      100% { box-shadow: 0 0 4px rgba(56,189,248,0.5); }
    }
    .drone-glow { animation: droneGlow 1.5s ease-in-out infinite; }
  `
  document.head.appendChild(s)
}

// ── Component ────────────────────────────────────────────────
export default function SwarmMap() {
  const authFetch = useAuthFetch()
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<L.Map | null>(null)

  // Layer refs — cleared and rebuilt each tick
  const swarmMarkersRef = useRef<L.Layer[]>([])
  const droneMarkersRef = useRef<Map<string, L.Marker>>(new Map())
  const coverageRef = useRef<L.Layer[]>([])
  const trailsRef = useRef<Map<string, L.Polyline>>(new Map())

  const [stats, setStats] = useState<Stats | null>(null)
  const [droneList, setDroneList] = useState<DroneProps[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [paused, setPaused] = useState(false)
  const [tickCount, setTickCount] = useState(0)
  const [selectedDrone, setSelectedDrone] = useState<string | null>(null)

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Init map ───────────────────────────────────────────────
  useEffect(() => {
    ensurePulseStyle()
    if (!mapRef.current || mapInstance.current) return

    const map = L.map(mapRef.current, { zoomControl: true }).setView([30.2, 69.3], 6)

    const street = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap', maxZoom: 18,
    }).addTo(map)

    const satellite = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      { attribution: 'Tiles &copy; Esri', maxZoom: 18 }
    )

    L.control.layers({ 'Street': street, 'Satellite': satellite }, {}, { position: 'topright' }).addTo(map)
    mapInstance.current = map

    return () => { map.remove(); mapInstance.current = null }
  }, [])

  // ── Poll data ──────────────────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [liveRes, statsRes] = await Promise.all([
          authFetch(`${SWARM_API}/api/swarms/live`),
          authFetch(`${SWARM_API}/api/swarms/stats`),
        ])
        if (!liveRes.ok || !statsRes.ok) throw new Error('API error')

        const liveData = await liveRes.json()
        const statsData: Stats = await statsRes.json()
        setStats(statsData)
        setError(null)
        setTickCount(t => t + 1)

        const features: LiveFeature[] = liveData.features || []
        const swarms = features.filter(f => f.properties.layer === 'swarm')
        const drones = features.filter(f => f.properties.layer === 'drone')
        setDroneList(drones.map(d => d.properties as DroneProps))

        if (!mapInstance.current) return
        const map = mapInstance.current

        // ── Clear old swarm markers + coverage circles ───
        swarmMarkersRef.current.forEach(l => map.removeLayer(l))
        swarmMarkersRef.current = []
        coverageRef.current.forEach(l => map.removeLayer(l))
        coverageRef.current = []

        // ── Draw swarm markers ───────────────────────────
        const seenSwarms = new Set<string>()
        for (const f of swarms) {
          const p = f.properties as SwarmProps
          if (seenSwarms.has(p.report_id)) continue // dedup (multiple drones per report)
          seenSwarms.add(p.report_id)

          const [lon, lat] = f.geometry.coordinates

          // Pulsing swarm circle
          const outerSize = 36
          const icon = L.divIcon({
            className: '',
            iconSize: [outerSize, outerSize],
            iconAnchor: [outerSize / 2, outerSize / 2],
            html: `
              <div class="mission-pulse" style="width:${outerSize}px;height:${outerSize}px;border-radius:50%;background:${p.color}33;display:flex;align-items:center;justify-content:center;">
                <div style="width:18px;height:18px;border-radius:50%;background:${p.color};border:2px solid #fff;display:flex;align-items:center;justify-content:center;font-size:10px;">🦗</div>
              </div>
            `,
          })

          const marker = L.marker([lat, lon], { icon, zIndexOffset: 100 })
            .bindPopup(`
              <div style="font-family:system-ui;font-size:12px;min-width:200px;">
                <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
                  <strong style="font-size:14px;">${p.report_id}</strong>
                  <span style="background:${p.color}22;color:${p.color};padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;">${p.risk_level}</span>
                </div>
                <div style="color:#999;margin-bottom:6px;">${p.zone}</div>
                <div style="background:#f5f5f5;padding:6px;border-radius:4px;margin-bottom:6px;color:#333;font-size:11px;line-height:1.4;">
                  ${p.description.length > 120 ? p.description.substring(0, 120) + '…' : p.description}
                </div>
                <div style="font-size:11px;">
                  ${p.estimated_size ? `<div><strong>Size:</strong> ${p.estimated_size}</div>` : ''}
                  <div><strong>Observer:</strong> ${p.observer_name}</div>
                  <div style="margin-top:4px;font-size:10px;color:#aaa;">📍 ${lat.toFixed(6)}, ${lon.toFixed(6)}</div>
                </div>
              </div>
            `, { maxWidth: 260 })
            .addTo(map)
          swarmMarkersRef.current.push(marker)
        }

        // ── Draw drones ──────────────────────────────────
        const currentDroneIds = new Set(drones.map(d => (d.properties as DroneProps).drone_id))

        // Remove departed drones
        droneMarkersRef.current.forEach((marker, id) => {
          if (!currentDroneIds.has(id)) {
            map.removeLayer(marker)
            droneMarkersRef.current.delete(id)
          }
        })
        trailsRef.current.forEach((line, id) => {
          if (!currentDroneIds.has(id)) {
            map.removeLayer(line)
            trailsRef.current.delete(id)
          }
        })

        for (const f of drones) {
          const p = f.properties as DroneProps
          const [lon, lat] = f.geometry.coordinates
          const batteryColor = p.battery > 60 ? '#22c55e' : p.battery > 30 ? '#eab308' : '#dc2626'

          // Drone icon
          const droneIcon = L.divIcon({
            className: '',
            iconSize: [32, 32],
            iconAnchor: [16, 16],
            html: `
              <div class="drone-glow" style="width:32px;height:32px;border-radius:50%;background:#0c4a6e;border:2px solid #38bdf8;display:flex;align-items:center;justify-content:center;position:relative;">
                <span style="font-size:14px;transform:rotate(${p.heading}deg);display:block;">✈️</span>
                <div style="position:absolute;bottom:-8px;left:50%;transform:translateX(-50%);background:${batteryColor};color:#fff;font-size:8px;padding:0 4px;border-radius:3px;white-space:nowrap;font-weight:700;">
                  ${p.battery}%
                </div>
              </div>
            `,
          })

          // Popup
          const popup = `
            <div style="font-family:system-ui;font-size:12px;min-width:220px;">
              <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
                <strong style="font-size:14px;">✈️ ${p.drone_id}</strong>
                <span style="background:#38bdf822;color:#38bdf8;padding:2px 6px;border-radius:4px;font-size:10px;font-weight:600;">${p.mission_status}</span>
              </div>
              <div style="color:#999;margin-bottom:6px;">${p.model}</div>
              <table style="width:100%;font-size:11px;border-collapse:collapse;">
                <tr><td style="padding:2px 0;color:#888;">Battery</td><td style="text-align:right;font-weight:600;color:${batteryColor};">${p.battery}%</td></tr>
                <tr><td style="padding:2px 0;color:#888;">Mission</td><td style="text-align:right;font-weight:600;">${p.mission_id}</td></tr>
                <tr><td style="padding:2px 0;color:#888;">Type</td><td style="text-align:right;font-weight:600;">${p.mission_type}</td></tr>
                <tr><td style="padding:2px 0;color:#888;">Coverage</td><td style="text-align:right;font-weight:600;">${p.coverage_km} km</td></tr>
                <tr><td style="padding:2px 0;color:#888;">Altitude</td><td style="text-align:right;font-weight:600;">${p.altitude_m} m</td></tr>
                <tr><td style="padding:2px 0;color:#888;">Heading</td><td style="text-align:right;font-weight:600;">${p.heading.toFixed(0)}°</td></tr>
              </table>
              <div style="margin-top:6px;padding-top:6px;border-top:1px solid #eee;font-size:11px;">
                <div><strong>Report:</strong> ${p.report_id} (${p.zone})</div>
                <div><strong>Risk:</strong> <span style="color:${p.color}">${p.risk_level}</span></div>
              </div>
              <div style="margin-top:4px;font-size:10px;color:#aaa;">📍 ${lat.toFixed(6)}, ${lon.toFixed(6)}</div>
            </div>
          `

          if (droneMarkersRef.current.has(p.drone_id)) {
            const marker = droneMarkersRef.current.get(p.drone_id)!
            marker.setLatLng([lat, lon])
            marker.setIcon(droneIcon)
            marker.getPopup()?.setContent(popup)
          } else {
            const marker = L.marker([lat, lon], { icon: droneIcon, zIndexOffset: 200 })
              .bindPopup(popup, { maxWidth: 280 })
              .addTo(map)
            marker.on('click', () => setSelectedDrone(p.drone_id))
            droneMarkersRef.current.set(p.drone_id, marker)
          }

          // Coverage circle
          const coverageCircle = L.circle([p.swarm_lat, p.swarm_lon], {
            radius: p.coverage_km * 1000, // km → meters
            color: '#38bdf8',
            weight: 1.5,
            opacity: 0.6,
            fillColor: '#38bdf8',
            fillOpacity: 0.06,
            dashArray: '8, 4',
          }).addTo(map)
          coverageRef.current.push(coverageCircle)

          // Trail
          if (p.trail && p.trail.length > 1) {
            const coords = p.trail.map(([tLat, tLon]) => [tLat, tLon] as L.LatLngTuple)
            if (trailsRef.current.has(p.drone_id)) {
              trailsRef.current.get(p.drone_id)!.setLatLngs(coords)
            } else {
              const line = L.polyline(coords, {
                color: '#38bdf8',
                weight: 2,
                opacity: 0.4,
                dashArray: '4, 4',
              }).addTo(map)
              trailsRef.current.set(p.drone_id, line)
            }
          }
        }

        if (loading) setLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Connection failed')
        if (loading) setLoading(false)
      }
    }

    fetchData()
    if (!paused) {
      intervalRef.current = setInterval(fetchData, 3000)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [paused]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Focus on drone ─────────────────────────────────────────
  const focusDrone = (id: string) => {
    setSelectedDrone(id)
    const marker = droneMarkersRef.current.get(id)
    if (marker && mapInstance.current) {
      mapInstance.current.setView(marker.getLatLng(), 10, { animate: true })
      marker.openPopup()
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Radar className="h-8 w-8 text-sky-400" />
            Swarm Map
          </h1>
          <p className="text-muted-foreground mt-2">
            Live drone monitoring of verified swarm locations · Updates every 3s
            {tickCount > 0 && <span className="ml-1">· Tick #{tickCount}</span>}
          </p>
        </div>
        <Button
          variant={paused ? 'default' : 'outline'}
          size="sm" className="gap-2"
          onClick={() => setPaused(!paused)}
        >
          {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          {paused ? 'Resume' : 'Pause'}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="pt-5 pb-4">
            <div className="text-sm text-muted-foreground">Active Missions</div>
            <div className="text-3xl font-bold text-amber-300">{stats?.active_missions ?? '—'}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-5 pb-4">
            <div className="text-sm text-muted-foreground">Drones Deployed</div>
            <div className="text-3xl font-bold text-blue-300">{stats?.drones_deployed ?? '—'}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-5 pb-4">
            <div className="text-sm text-muted-foreground">Avg Battery</div>
            <div className="text-3xl font-bold text-green-300">{stats ? `${stats.avg_battery.toFixed(0)}%` : '—'}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-violet-500">
          <CardContent className="pt-5 pb-4">
            <div className="text-sm text-muted-foreground">Coverage</div>
            <div className="text-2xl font-bold text-violet-300">{stats ? `${stats.total_coverage_km2.toFixed(0)} km²` : '—'}</div>
          </CardContent>
        </Card>
      </div>

      {/* Map */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 text-foreground pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-foreground flex items-center gap-2">
              🗺️ Live Drone Patrol
            </CardTitle>
            <div className="flex gap-2">
              <Badge variant="secondary" className="bg-white/10 text-foreground border-white/20">
                {paused ? '⏸ Paused' : '🔴 LIVE'}
              </Badge>
              <Badge variant="secondary" className="bg-white/10 text-foreground border-white/20">
                {droneList.length} drone{droneList.length !== 1 ? 's' : ''} active
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
          {!loading && !error && droneList.length === 0 && (
            <div className="absolute inset-0 bg-background/40 flex items-center justify-center z-[400]">
              <div className="text-center bg-background/80 rounded-lg p-6 border border-border">
                <Plane className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                <p className="font-medium">No active drone missions</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Assign a drone to a verified report in Drone Ops and start the mission to see it here.
                </p>
              </div>
            </div>
          )}
          {error && (
            <div className="absolute bottom-4 left-4 right-4 bg-red-500/15 border border-red-500/30 rounded-lg p-3 text-sm text-red-300 z-[500]">
              ⚠️ {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Drone Detail Cards */}
      {droneList.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plane className="h-5 w-5 text-sky-400" />
              Deployed Drones
              <span className="text-xs font-normal text-muted-foreground ml-auto">Click a card to focus on the map</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {droneList.map(d => {
                const battColor = d.battery > 60 ? 'text-green-400' : d.battery > 30 ? 'text-yellow-300' : 'text-red-400'
                return (
                  <div
                    key={d.drone_id}
                    className={`p-4 rounded-lg border-l-4 cursor-pointer transition-all ${
                      selectedDrone === d.drone_id
                        ? 'bg-sky-500/10 ring-1 ring-sky-500/30 shadow-lg'
                        : 'bg-muted/40 hover:bg-muted/60'
                    }`}
                    style={{ borderLeftColor: '#38bdf8' }}
                    onClick={() => focusDrone(d.drone_id)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-bold text-sm flex items-center gap-1.5">
                          ✈️ {d.drone_id}
                        </h4>
                        <p className="text-xs text-muted-foreground">{d.model}</p>
                      </div>
                      <Badge className="bg-blue-500/15 text-blue-300 text-xs">{d.mission_status}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mt-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground flex items-center gap-1"><BatteryMedium className="h-3 w-3" /> Battery</span>
                        <span className={`font-semibold ${battColor}`}>{d.battery}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Mission</span>
                        <span className="font-semibold">{d.mission_id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Type</span>
                        <span className="font-semibold">{d.mission_type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Coverage</span>
                        <span className="font-semibold">{d.coverage_km} km</span>
                      </div>
                    </div>
                    {/* Battery bar */}
                    <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 rounded-full ${
                          d.battery > 60 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                          d.battery > 30 ? 'bg-gradient-to-r from-yellow-500 to-amber-500' :
                          'bg-gradient-to-r from-red-500 to-orange-500'
                        }`}
                        style={{ width: `${d.battery}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
                      <span>📍 {d.zone} — {d.report_id}</span>
                      <span style={{ color: d.color }}>{d.risk_level}</span>
                    </div>
                  </div>
                )
              })}
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
          <p><strong>🦗 Pulsing circles:</strong> Verified swarm locations from field reports. Color reflects risk level.</p>
          <p><strong>✈️ Drone markers:</strong> Drones patrolling around swarms. Battery level shown below. Click for full details.</p>
          <p><strong>⭕ Dashed circles:</strong> Drone coverage zones — radius matches mission coverage setting.</p>
          <p><strong>- - - Trails:</strong> Recent drone patrol path (last 20 positions).</p>
          <p><strong>🔋 Battery drain:</strong> Drones drain ~1.67%/min. When battery hits 0%, the mission auto-completes.</p>
        </CardContent>
      </Card>
    </div>
  )
}
