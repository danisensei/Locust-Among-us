import { useEffect, useRef, useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Route } from 'lucide-react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const API_URL = import.meta.env.VITE_SWARM_API_URL || 'http://localhost:8001'

interface ZoneInfo { lat: number; lon: number; neighbors: string[] }
interface AStarResult {
  algorithm: string; start_zone: string; goal_zone: string; path: string[]
  path_length: number; total_distance_km: number
  segments: { from: string; to: string; distance_km: number }[]
  nodes_explored: number; explored_order: string[]
  zone_coords: Record<string, { lat: number; lon: number }>
}

interface AStarSubModuleProps {
  zones: Record<string, ZoneInfo>
}

export default function AStarSubModule({ zones }: AStarSubModuleProps) {
  const astarMapRef = useRef<HTMLDivElement>(null)
  const astarMapInstance = useRef<L.Map | null>(null)
  const astarLayersRef = useRef<L.LayerGroup | null>(null)
  const astarGraphLayerRef = useRef<L.LayerGroup | null>(null)

  const [astarStart, setAstarStart] = useState<string>('')
  const [astarGoal, setAstarGoal] = useState<string>('')
  const [astarResult, setAstarResult] = useState<AStarResult | null>(null)
  const [astarLoading, setAstarLoading] = useState(false)

  // Init A* map
  useEffect(() => {
    if (!astarMapRef.current || astarMapInstance.current) return
    const map = L.map(astarMapRef.current).setView([28.5, 68.0], 6)
    const street = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap', maxZoom: 18,
    })
    street.addTo(map)
    const satellite = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      { attribution: 'Esri', maxZoom: 18 }
    )
    L.control.layers({ Street: street, Satellite: satellite }, {}, { position: 'topright' }).addTo(map)
    astarLayersRef.current = L.layerGroup().addTo(map)
    astarGraphLayerRef.current = L.layerGroup().addTo(map)
    astarMapInstance.current = map
    setTimeout(() => map.invalidateSize(), 100)
    setTimeout(() => map.invalidateSize(), 300)
    return () => { map.remove(); astarMapInstance.current = null }
  }, [])

  // Draw zone graph on A* map
  useEffect(() => {
    if (!astarGraphLayerRef.current || Object.keys(zones).length === 0) return
    astarGraphLayerRef.current.clearLayers()
    const drawn = new Set<string>()
    for (const [name, info] of Object.entries(zones)) {
      for (const nb of info.neighbors) {
        const key = [name, nb].sort().join('|')
        if (drawn.has(key)) continue
        drawn.add(key)
        const nbInfo = zones[nb]
        if (!nbInfo) continue
        L.polyline([[info.lat, info.lon], [nbInfo.lat, nbInfo.lon]], {
          color: '#475569', weight: 1.5, opacity: 0.4, dashArray: '4,4',
        }).addTo(astarGraphLayerRef.current!)
      }
    }
    for (const [name, info] of Object.entries(zones)) {
      L.circleMarker([info.lat, info.lon], {
        radius: 5, fillColor: '#64748b', color: '#334155', weight: 1, fillOpacity: 0.7,
      }).bindTooltip(name, { permanent: false, direction: 'top', offset: [0, -8] })
        .addTo(astarGraphLayerRef.current!)
    }
  }, [zones])

  // Run A*
  const runAStar = useCallback(async () => {
    if (!astarStart || !astarGoal) return
    setAstarLoading(true); setAstarResult(null)
    try {
      const res = await fetch(`${API_URL}/api/ai/astar`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ start_zone: astarStart, goal_zone: astarGoal }),
      })
      if (!res.ok) throw new Error('A* failed')
      setAstarResult(await res.json())
    } catch (err) { console.error(err) }
    finally { setAstarLoading(false) }
  }, [astarStart, astarGoal])

  // Render A* path on map
  useEffect(() => {
    if (!astarLayersRef.current || !astarResult) return
    astarLayersRef.current.clearLayers()

    // Draw explored nodes (grey, small)
    for (const z of astarResult.explored_order) {
      const coords = astarResult.zone_coords[z]
      if (!coords) continue
      if (astarResult.path.includes(z)) continue // skip path nodes, drawn separately
      L.circleMarker([coords.lat, coords.lon], {
        radius: 7, fillColor: '#6b7280', color: '#374151', weight: 1.5, fillOpacity: 0.5,
      }).bindPopup(`<strong>${z}</strong><br/><span style="color:#888">Evaluated but not on optimal path</span>`)
        .addTo(astarLayersRef.current!)
    }

    // Draw path edges (animated green line)
    for (const seg of astarResult.segments) {
      const fc = astarResult.zone_coords[seg.from], tc = astarResult.zone_coords[seg.to]
      if (!fc || !tc) continue
      // Background thick line
      L.polyline([[fc.lat, fc.lon], [tc.lat, tc.lon]], {
        color: '#22c55e', weight: 5, opacity: 0.3,
      }).addTo(astarLayersRef.current!)
      // Foreground dashed animated line
      L.polyline([[fc.lat, fc.lon], [tc.lat, tc.lon]], {
        color: '#22c55e', weight: 3, opacity: 0.9, dashArray: '8,6',
      }).addTo(astarLayersRef.current!)
      // Distance label at midpoint
      const midLat = (fc.lat + tc.lat) / 2, midLon = (fc.lon + tc.lon) / 2
      L.marker([midLat, midLon], {
        icon: L.divIcon({
          className: '',
          html: `<div style="font-size:10px;font-weight:700;color:#22c55e;background:rgba(0,0,0,0.7);padding:1px 5px;border-radius:4px;white-space:nowrap;">${seg.distance_km} km</div>`,
          iconAnchor: [20, 8],
        }),
      }).addTo(astarLayersRef.current!)
    }

    // Draw path nodes
    astarResult.path.forEach((z, i) => {
      const coords = astarResult.zone_coords[z]
      if (!coords) return
      const isStart = i === 0, isGoal = i === astarResult.path.length - 1
      const color = isStart ? '#22c55e' : isGoal ? '#ef4444' : '#f59e0b'
      const label = isStart ? 'Start' : isGoal ? 'Destination' : `Waypoint ${i}`
      L.circleMarker([coords.lat, coords.lon], {
        radius: isStart || isGoal ? 14 : 10, fillColor: color, color: '#fff',
        weight: isStart || isGoal ? 3 : 2, fillOpacity: 0.9,
      }).bindPopup(`
        <div style="font-family:system-ui;font-size:12px;">
          <strong>${z}</strong>
          <div style="color:${color};margin-top:2px;">${label}</div>
          ${!isGoal && i < astarResult.segments.length ? `<div style="color:#888;margin-top:2px;">→ ${astarResult.segments[i].distance_km} km to ${astarResult.segments[i].to}</div>` : ''}
        </div>
      `).addTo(astarLayersRef.current!)
      // Name label
      L.marker([coords.lat, coords.lon], {
        icon: L.divIcon({
          className: '',
          html: `<div style="font-size:10px;font-weight:600;color:${color};text-shadow:0 0 3px #000,0 0 6px #000;white-space:nowrap;transform:translateX(-50%);">${z}</div>`,
          iconAnchor: [0, -16],
        }),
      }).addTo(astarLayersRef.current!)
    })

    // Fit bounds to path
    if (astarResult.path.length > 1) {
      const pathCoords = astarResult.path
        .map(z => astarResult.zone_coords[z])
        .filter(Boolean)
        .map(c => [c.lat, c.lon] as [number, number])
      if (pathCoords.length > 1) {
        astarMapInstance.current?.fitBounds(L.latLngBounds(pathCoords), { padding: [40, 40] })
      }
    }
  }, [astarResult])

  return (
    <>
      <Card className="bg-amber-500/5 border-amber-500/20">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Route className="h-4 w-4" /> How This Model Works
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-1.5 text-muted-foreground">
          <p><strong>Starting Point:</strong> Zone where the drone / response team is currently located.</p>
          <p><strong>Destination:</strong> Target zone where the swarm or threat has been reported.</p>
          <p><strong>Objective:</strong> Find the shortest route between two zones across the network.</p>
          <p><strong>Model:</strong> A* Pathfinding — uses geographic distance as a heuristic to find the optimal route efficiently.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Find Optimal Route</CardTitle>
          <CardDescription>Select start and destination zones to calculate the best path</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 items-end">
            <div className="w-56">
              <label className="text-xs text-muted-foreground mb-1 block">Start Zone</label>
              <Select value={astarStart} onValueChange={setAstarStart}>
                <SelectTrigger><SelectValue placeholder="Select start…" /></SelectTrigger>
                <SelectContent>
                  {Object.keys(zones).sort().map(z => (<SelectItem key={z} value={z}>{z}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-56">
              <label className="text-xs text-muted-foreground mb-1 block">Destination Zone</label>
              <Select value={astarGoal} onValueChange={setAstarGoal}>
                <SelectTrigger><SelectValue placeholder="Select destination…" /></SelectTrigger>
                <SelectContent>
                  {Object.keys(zones).sort().map(z => (<SelectItem key={z} value={z}>{z}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={runAStar} disabled={astarLoading || !astarStart || !astarGoal || astarStart === astarGoal} className="gap-2">
              {astarLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Route className="h-4 w-4" />}
              Find Route
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* A* Map */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-amber-900/40 to-slate-800 pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-foreground flex items-center gap-2">
              🗺️ Optimal Route Visualization
            </CardTitle>
            {astarResult && (
              <Badge variant="secondary" className="bg-white/10 text-foreground border-white/20">
                {astarResult.path_length} zones · {astarResult.total_distance_km} km
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div ref={astarMapRef} className="w-full h-96 md:h-[500px] lg:h-[550px] bg-slate-900" />
        </CardContent>
      </Card>

      {astarResult && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Optimal Route</CardTitle>
              <CardDescription>{astarResult.start_zone} → {astarResult.goal_zone}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {astarResult.path.map((zone, i) => (
                <div key={zone} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${
                    i === 0 ? 'bg-green-500' : i === astarResult.path.length - 1 ? 'bg-red-500' : 'bg-amber-500'
                  }`}>{i + 1}</div>
                  <div>
                    <div className="font-medium text-sm">{zone}</div>
                    {i < astarResult.segments.length && (
                      <div className="text-xs text-muted-foreground">→ {astarResult.segments[i].distance_km} km to next</div>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm">Route Summary</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <div><div className="text-muted-foreground">Model</div><div className="font-bold text-lg">Pathfinder (A*)</div></div>
              <div><div className="text-muted-foreground">Total Distance</div><div className="font-bold text-lg text-amber-400">{astarResult.total_distance_km} km</div></div>
              <div><div className="text-muted-foreground">Zones in Route</div><div className="font-bold text-lg">{astarResult.path_length}</div></div>
              <div><div className="text-muted-foreground">Zones Evaluated</div><div className="font-bold text-lg">{astarResult.nodes_explored}</div></div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
