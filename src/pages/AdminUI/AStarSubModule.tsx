import { useEffect, useRef, useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Loader2, Route, Layers, Info, MapPin, ArrowRight, Ruler, Search, ShieldAlert, CheckCircle2, AlertTriangle
} from 'lucide-react'
import { useAuthFetch } from '@/context/AuthContext'
import { AnimatePresence, motion } from 'framer-motion'
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
  const [actionLoading, setActionLoading] = useState(false)
  const [actionToast, setActionToast] = useState<{show: boolean, type: 'success'|'error', message: string}>({show: false, type: 'success', message: ''})
  const authFetch = useAuthFetch()

  const handleAction = async (actionType: string, zone: string) => {
    setActionLoading(true)
    try {
      const res = await authFetch(`${API_URL}/api/actions/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zone, action_type: actionType })
      })
      const data = await res.json()
      setActionToast({ show: true, type: 'success', message: data.message || 'Action executed successfully' })
      setTimeout(() => setActionToast(prev => ({ ...prev, show: false })), 4000)
    } catch (err) {
      setActionToast({ show: true, type: 'error', message: 'Action failed. Please try again.' })
      setTimeout(() => setActionToast(prev => ({ ...prev, show: false })), 4000)
    } finally {
      setActionLoading(false)
    }
  }

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
    const ro = new ResizeObserver(() => map.invalidateSize())
    ro.observe(astarMapRef.current)
    return () => { ro.disconnect(); map.remove(); astarMapInstance.current = null }
  }, [])

  // Draw zone graph
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

    // Draw explored nodes (grey)
    for (const z of astarResult.explored_order) {
      const coords = astarResult.zone_coords[z]
      if (!coords) continue
      if (astarResult.path.includes(z)) continue
      L.circleMarker([coords.lat, coords.lon], {
        radius: 7, fillColor: '#6b7280', color: '#374151', weight: 1.5, fillOpacity: 0.5,
      }).bindPopup(`<strong>${z}</strong><br/><span style="color:#888">Evaluated, not on path</span>`)
        .addTo(astarLayersRef.current!)
    }

    // Draw path edges
    for (const seg of astarResult.segments) {
      const fc = astarResult.zone_coords[seg.from], tc = astarResult.zone_coords[seg.to]
      if (!fc || !tc) continue
      L.polyline([[fc.lat, fc.lon], [tc.lat, tc.lon]], { color: '#22c55e', weight: 5, opacity: 0.3 }).addTo(astarLayersRef.current!)
      L.polyline([[fc.lat, fc.lon], [tc.lat, tc.lon]], { color: '#22c55e', weight: 3, opacity: 0.9, dashArray: '8,6' }).addTo(astarLayersRef.current!)
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
        <div style="font-family:'Inter',system-ui;font-size:12px;">
          <strong>${z}</strong>
          <div style="color:${color};margin-top:2px;">${label}</div>
          ${!isGoal && i < astarResult.segments.length ? `<div style="color:#888;margin-top:2px;">→ ${astarResult.segments[i].distance_km} km to ${astarResult.segments[i].to}</div>` : ''}
        </div>
      `).addTo(astarLayersRef.current!)
      L.marker([coords.lat, coords.lon], {
        icon: L.divIcon({
          className: '',
          html: `<div style="font-size:10px;font-weight:600;color:${color};text-shadow:0 0 3px #000,0 0 6px #000;white-space:nowrap;transform:translateX(-50%);">${z}</div>`,
          iconAnchor: [0, -16],
        }),
      }).addTo(astarLayersRef.current!)
    })

    // Fit bounds
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
    <div className="space-y-4">
      {/* ━━━ Controls ━━━ */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-48">
          <label className="text-[11px] text-muted-foreground mb-1 block font-medium">Start Zone</label>
          <Select value={astarStart} onValueChange={setAstarStart}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select start…" /></SelectTrigger>
            <SelectContent className="z-[1000]">
              {Object.keys(zones).sort().map(z => (<SelectItem key={z} value={z}>{z}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground mb-1" />
        <div className="w-48">
          <label className="text-[11px] text-muted-foreground mb-1 block font-medium">Destination Zone</label>
          <Select value={astarGoal} onValueChange={setAstarGoal}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select goal…" /></SelectTrigger>
            <SelectContent className="z-[1000]">
              {Object.keys(zones).sort().map(z => (<SelectItem key={z} value={z}>{z}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={runAStar} disabled={astarLoading || !astarStart || !astarGoal || astarStart === astarGoal} size="sm" className="gap-1.5 h-8 text-xs">
          {astarLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Route className="h-3 w-3" />}
          Find Route
        </Button>
      </div>

      {/* ━━━ MAP + SIDEBAR ━━━ */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">

        {/* Map — 3 cols */}
        <Card className="lg:col-span-3 overflow-hidden">
          <CardContent className="p-0 relative">
            <div ref={astarMapRef} className="w-full h-[520px] bg-slate-900" />
            <div className="absolute top-3 left-3 z-[400]">
              <Badge className="bg-background/80 backdrop-blur-sm text-foreground border-border/50 text-[10px] gap-1">
                <Layers className="h-3 w-3" />
                {Object.keys(zones).length} zones
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Sidebar — 1 col */}
        <div className="lg:col-span-1 space-y-3">

          {/* Model info */}
          <div className="rounded-lg border border-orange-500/20 bg-orange-500/5 p-3">
            <div className="flex items-center gap-1.5 text-xs font-medium mb-2">
              <Info className="h-3.5 w-3.5 text-orange-400" /> A* Pathfinder
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed mb-2">
              Uses geographic distance as heuristic to find the shortest path between two zones in the network graph.
            </p>
            <p className="text-[10px] text-muted-foreground leading-relaxed font-semibold">
              <strong>How to use:</strong> Select a Start Zone and Destination Zone to calculate the most likely flight path of a swarm. Use this to determine where to deploy intercept teams.
            </p>
          </div>

          {/* Result stats */}
          {astarResult ? (
            <Card className="border-border/50">
              <CardHeader className="pb-2 pt-3 px-3">
                <CardTitle className="text-xs font-medium flex items-center gap-1.5">
                  <Route className="h-3.5 w-3.5 text-emerald-400" />
                  Route Found
                </CardTitle>
                <CardDescription className="text-[10px]">
                  {astarResult.start_zone} → {astarResult.goal_zone}
                </CardDescription>
              </CardHeader>
              <CardContent className="px-3 pb-3 space-y-2.5">
                <Separator />
                {[
                  { icon: Ruler, label: 'Total distance', value: `${astarResult.total_distance_km} km`, color: 'text-orange-400' },
                  { icon: MapPin, label: 'Zones in route', value: `${astarResult.path_length}`, color: 'text-foreground' },
                  { icon: Search, label: 'Zones evaluated', value: `${astarResult.nodes_explored}`, color: 'text-foreground' },
                ].map(row => {
                  const RIcon = row.icon
                  return (
                    <div key={row.label} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <RIcon className="h-3 w-3" /> {row.label}
                      </span>
                      <span className={`font-mono font-medium tabular-nums ${row.color}`}>{row.value}</span>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-lg border border-dashed border-border/50 p-4 text-center">
              <Route className="h-5 w-5 mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-[11px] text-muted-foreground">Select zones and find route</p>
            </div>
          )}

          {/* Recommended Next Steps */}
          {astarResult && astarResult.path.length > 2 && (
            <div className="bg-muted/30 rounded-lg p-2.5 border border-border/50">
              <div className="text-[10px] font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
                <ShieldAlert className="h-3 w-3 text-orange-400" />
                Strategic Recommendation
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed mb-2">
                The swarm is predicted to take this optimal path. Intercept the swarm at the midpoint zone <strong>{astarResult.path[Math.floor(astarResult.path.length / 2)]}</strong> before it reaches the destination.
              </p>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleAction('deploy_intercept', astarResult.path[Math.floor(astarResult.path.length / 2)])} disabled={actionLoading} className="h-7 text-[10px] flex-1 bg-orange-500 hover:bg-orange-600 text-white border-0">
                  {actionLoading ? <Loader2 className="h-3 w-3 animate-spin mx-auto" /> : 'Deploy Intercept Team'}
                </Button>
              </div>
            </div>
          )}

          {/* Route steps */}
          {astarResult && (
            <div className="space-y-1 max-h-[300px] overflow-y-auto pr-1">
              {astarResult.path.map((zone, i) => {
                const isStart = i === 0
                const isGoal = i === astarResult.path.length - 1
                return (
                  <div key={zone} className="rounded-lg border border-border/40 p-2 text-xs">
                    <div className="flex items-center gap-2">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0 ${
                        isStart ? 'bg-emerald-500' : isGoal ? 'bg-red-500' : 'bg-orange-500'
                      }`}>{i + 1}</div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-[11px]">{zone}</div>
                        {i < astarResult.segments.length && (
                          <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <ArrowRight className="h-2.5 w-2.5" />
                            {astarResult.segments[i].distance_km} km
                          </div>
                        )}
                      </div>
                      {isStart && <Badge variant="outline" className="text-[9px] border-emerald-500/30 text-emerald-400 h-4 px-1">Start</Badge>}
                      {isGoal && <Badge variant="outline" className="text-[9px] border-red-500/30 text-red-400 h-4 px-1">Goal</Badge>}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

        </div>
      </div>

      {/* ━━━ LEGEND ━━━ */}
      <div className="flex items-center gap-4 text-[10px] text-muted-foreground px-1">
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Start</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-orange-500" /> Waypoint</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500" /> Destination</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-gray-500" /> Explored</span>
        <Separator orientation="vertical" className="h-3" />
        <span>Green line = optimal path · Grey dots = evaluated but rejected</span>
      </div>
    </div>

    {/* Action Toast Notification */}
    <AnimatePresence>
      {actionToast.show && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-md ${
            actionToast.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}
        >
          {actionToast.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
          <div>
            <p className="text-sm font-semibold text-foreground">
              {actionToast.type === 'success' ? 'Action Dispatched' : 'Action Failed'}
            </p>
            <p className="text-xs opacity-90">{actionToast.message}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  )
}
