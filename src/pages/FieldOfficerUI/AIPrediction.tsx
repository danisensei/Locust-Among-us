import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Play, SkipForward, RotateCcw, GitBranch, Network } from 'lucide-react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const API_URL = import.meta.env.VITE_SWARM_API_URL || 'http://localhost:8001'

// ── Types ────────────────────────────────────────────────────
interface ZoneInfo {
  lat: number
  lon: number
  neighbors: string[]
}

interface BFSLevel {
  depth: number
  zones: string[]
}

interface BFSResult {
  algorithm: string
  start_zone: string
  start_coords: { lat: number; lon: number }
  levels: BFSLevel[]
  visit_order: string[]
  edges_traversed: [string, string][]
  total_zones_affected: number
  max_depth_reached: number
  zone_coords: Record<string, { lat: number; lon: number }>
}

// ── Depth colors ─────────────────────────────────────────────
const DEPTH_COLORS = [
  '#dc2626', // 0 — origin (red)
  '#ea580c', // 1
  '#f59e0b', // 2
  '#84cc16', // 3
  '#22c55e', // 4
  '#06b6d4', // 5
  '#3b82f6', // 6
  '#8b5cf6', // 7+
]
function depthColor(d: number): string {
  return DEPTH_COLORS[Math.min(d, DEPTH_COLORS.length - 1)]
}

export default function AIPrediction() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<L.Map | null>(null)
  const layersRef = useRef<L.LayerGroup | null>(null)
  const graphLayerRef = useRef<L.LayerGroup | null>(null)

  const [zones, setZones] = useState<Record<string, ZoneInfo>>({})
  const [selectedZone, setSelectedZone] = useState<string>('')
  const [bfsResult, setBfsResult] = useState<BFSResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [animStep, setAnimStep] = useState<number>(-1)   // -1 = not started, 0..N = level
  const [autoPlay, setAutoPlay] = useState(false)
  const [showGraph, setShowGraph] = useState(true)

  // ── Fetch zone graph ───────────────────────────────────────
  useEffect(() => {
    fetch(`${API_URL}/api/ai/zones`)
      .then(r => r.json())
      .then(data => {
        setZones(data.zones || {})
        const names = Object.keys(data.zones || {})
        if (names.length > 0 && !selectedZone) setSelectedZone(names[0])
      })
      .catch(console.error)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Init map ───────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return

    const map = L.map(mapRef.current).setView([28.5, 68.0], 6)

    const street = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap', maxZoom: 18,
    })
    street.addTo(map)

    const satellite = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      { attribution: 'Esri', maxZoom: 18 }
    )
    L.control.layers({ Street: street, Satellite: satellite }, {}, { position: 'topright' }).addTo(map)

    layersRef.current = L.layerGroup().addTo(map)
    graphLayerRef.current = L.layerGroup().addTo(map)
    mapInstance.current = map

    return () => { map.remove(); mapInstance.current = null }
  }, [])

  // ── Draw zone graph on map ─────────────────────────────────
  useEffect(() => {
    if (!graphLayerRef.current || Object.keys(zones).length === 0) return
    graphLayerRef.current.clearLayers()
    if (!showGraph) return

    // Draw edges
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
        }).addTo(graphLayerRef.current!)
      }
    }

    // Draw nodes (small dots)
    for (const [name, info] of Object.entries(zones)) {
      L.circleMarker([info.lat, info.lon], {
        radius: 5, fillColor: '#64748b', color: '#334155',
        weight: 1, fillOpacity: 0.7,
      }).bindTooltip(name, { permanent: false, direction: 'top', offset: [0, -8] })
        .addTo(graphLayerRef.current!)
    }
  }, [zones, showGraph])

  // ── Run BFS ────────────────────────────────────────────────
  const runBFS = useCallback(async () => {
    if (!selectedZone) return
    setLoading(true)
    setBfsResult(null)
    setAnimStep(-1)
    setAutoPlay(false)

    try {
      const res = await fetch(`${API_URL}/api/ai/bfs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ start_zone: selectedZone }),
      })
      if (!res.ok) throw new Error('BFS failed')
      const data: BFSResult = await res.json()
      setBfsResult(data)
      setAnimStep(0) // show origin immediately
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [selectedZone])

  // ── Render BFS on map ──────────────────────────────────────
  useEffect(() => {
    if (!layersRef.current || !bfsResult || animStep < 0) return
    layersRef.current.clearLayers()

    const visibleZones = new Set<string>()
    const visibleEdges: [string, string][] = []

    // Gather all zones and edges up to current step
    for (let i = 0; i <= animStep && i < bfsResult.levels.length; i++) {
      for (const z of bfsResult.levels[i].zones) visibleZones.add(z)
    }
    for (const [from, to] of bfsResult.edges_traversed) {
      if (visibleZones.has(from) && visibleZones.has(to)) {
        visibleEdges.push([from, to])
      }
    }

    // Draw traversed edges (highlighted)
    for (const [from, to] of visibleEdges) {
      const fc = bfsResult.zone_coords[from]
      const tc = bfsResult.zone_coords[to]
      if (!fc || !tc) continue
      L.polyline([[fc.lat, fc.lon], [tc.lat, tc.lon]], {
        color: '#f59e0b', weight: 3, opacity: 0.8,
      }).addTo(layersRef.current!)
    }

    // Draw zone markers
    for (let i = 0; i <= animStep && i < bfsResult.levels.length; i++) {
      const depth = bfsResult.levels[i].depth
      const color = depthColor(depth)
      for (const z of bfsResult.levels[i].zones) {
        const coords = bfsResult.zone_coords[z]
        if (!coords) continue

        const isOrigin = depth === 0
        const isCurrent = i === animStep

        L.circleMarker([coords.lat, coords.lon], {
          radius: isOrigin ? 14 : isCurrent ? 11 : 9,
          fillColor: color,
          color: '#fff',
          weight: isOrigin ? 3 : 2,
          fillOpacity: 0.85,
        }).bindPopup(`
          <div style="font-family:system-ui; font-size:12px;">
            <strong>${z}</strong>
            <div style="color:#888; margin-top:2px;">Depth: ${depth} (Time Step ${depth})</div>
            <div style="margin-top:4px;">
              <span style="display:inline-block; width:10px; height:10px; background:${color}; border-radius:50%;"></span>
              <span style="margin-left:4px;">${isOrigin ? 'Origin — Swarm source' : `Predicted spread at step ${depth}`}</span>
            </div>
          </div>
        `).addTo(layersRef.current!)

        // Label
        L.marker([coords.lat, coords.lon], {
          icon: L.divIcon({
            className: '',
            html: `<div style="font-size:10px; font-weight:600; color:${color}; text-shadow:0 0 3px #000, 0 0 6px #000; white-space:nowrap; transform:translateX(-50%);">${z}</div>`,
            iconAnchor: [0, -14],
          }),
        }).addTo(layersRef.current!)
      }
    }
  }, [bfsResult, animStep])

  // ── Autoplay animation ─────────────────────────────────────
  useEffect(() => {
    if (!autoPlay || !bfsResult) return
    if (animStep >= bfsResult.levels.length - 1) {
      setAutoPlay(false)
      return
    }
    const timer = setTimeout(() => setAnimStep(s => s + 1), 1200)
    return () => clearTimeout(timer)
  }, [autoPlay, animStep, bfsResult])

  // ── Reset ──────────────────────────────────────────────────
  const reset = () => {
    setBfsResult(null)
    setAnimStep(-1)
    setAutoPlay(false)
    layersRef.current?.clearLayers()
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Network className="h-8 w-8 text-violet-400" />
          AI Swarm Spread Prediction
        </h1>
        <p className="text-muted-foreground mt-2">
          BFS on Pakistan's zone adjacency graph · Predicts zone-by-zone locust spread
        </p>
      </div>

      {/* Problem Formulation Card */}
      <Card className="bg-violet-500/5 border-violet-500/20">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <GitBranch className="h-4 w-4" /> Problem Formulation
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-1.5 text-muted-foreground">
          <p><strong>Initial State:</strong> Zone where the swarm / report is located.</p>
          <p><strong>Goal State:</strong> Identify all zones reachable from the initial zone (spread prediction).</p>
          <p><strong>Actions:</strong> Swarm migrates from one zone to an adjacent zone (one time step).</p>
          <p><strong>State Space:</strong> Undirected graph — {Object.keys(zones).length} zones, edges = geographic adjacency.</p>
          <p><strong>Algorithm:</strong> Breadth-First Search (BFS) — explores all neighbors at depth <em>d</em> before depth <em>d+1</em>, giving a time-stepped spread prediction.</p>
        </CardContent>
      </Card>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Run BFS Spread Prediction</CardTitle>
          <CardDescription>Select a source zone and run BFS to predict swarm migration</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 items-end">
            <div className="w-64">
              <label className="text-xs text-muted-foreground mb-1 block">Source Zone (Initial State)</label>
              <Select value={selectedZone} onValueChange={setSelectedZone}>
                <SelectTrigger><SelectValue placeholder="Select zone…" /></SelectTrigger>
                <SelectContent>
                  {Object.keys(zones).sort().map(z => (
                    <SelectItem key={z} value={z}>{z}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={runBFS} disabled={loading || !selectedZone} className="gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              Run BFS
            </Button>

            {bfsResult && (
              <>
                <Button
                  variant="outline" size="sm" className="gap-1"
                  disabled={!bfsResult || animStep >= bfsResult.levels.length - 1}
                  onClick={() => setAnimStep(s => Math.min(s + 1, bfsResult!.levels.length - 1))}
                >
                  <SkipForward className="h-3.5 w-3.5" /> Step
                </Button>
                <Button
                  variant={autoPlay ? 'destructive' : 'secondary'}
                  size="sm" className="gap-1"
                  onClick={() => setAutoPlay(!autoPlay)}
                >
                  {autoPlay ? 'Stop' : '▶ Auto Play'}
                </Button>
                <Button variant="ghost" size="sm" className="gap-1" onClick={reset}>
                  <RotateCcw className="h-3.5 w-3.5" /> Reset
                </Button>
              </>
            )}

            <Button
              variant="ghost" size="sm"
              className={`ml-auto gap-1 ${showGraph ? 'text-sky-400' : 'text-muted-foreground'}`}
              onClick={() => setShowGraph(!showGraph)}
            >
              <Network className="h-3.5 w-3.5" />
              {showGraph ? 'Hide Graph' : 'Show Graph'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Map */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-violet-900/40 to-slate-800 pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-foreground flex items-center gap-2">
              🗺️ Zone Adjacency Graph & BFS Visualization
            </CardTitle>
            {bfsResult && (
              <Badge variant="secondary" className="bg-white/10 text-foreground border-white/20">
                Step {animStep} / {bfsResult.levels.length - 1}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div ref={mapRef} className="w-full h-96 md:h-[500px] lg:h-[550px] bg-slate-900" />
        </CardContent>
      </Card>

      {/* BFS Results */}
      {bfsResult && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Levels */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">BFS Exploration Levels</CardTitle>
              <CardDescription>Each depth = one time step of predicted swarm spread</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {bfsResult.levels.map((level, i) => {
                const isActive = i <= animStep
                return (
                  <div
                    key={level.depth}
                    className={`flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer ${isActive
                        ? 'bg-muted/60 border-border'
                        : 'bg-muted/10 border-transparent opacity-40'
                      } ${i === animStep ? 'ring-1 ring-violet-500/50' : ''}`}
                    onClick={() => setAnimStep(i)}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                      style={{ backgroundColor: depthColor(level.depth) }}
                    >
                      {level.depth}
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">
                        {level.depth === 0 ? 'Origin (Initial State)' : `Time Step ${level.depth}`}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {level.zones.map(z => (
                          <Badge
                            key={z}
                            className="text-xs"
                            style={{
                              backgroundColor: depthColor(level.depth) + '22',
                              color: depthColor(level.depth),
                              borderColor: depthColor(level.depth) + '44',
                            }}
                          >
                            {z}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">BFS Statistics</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Algorithm</div>
                  <div className="font-bold text-lg">{bfsResult.algorithm}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Start Zone</div>
                  <div className="font-bold">{bfsResult.start_zone}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Total Zones Affected</div>
                  <div className="font-bold text-lg text-red-400">{bfsResult.total_zones_affected} / {Object.keys(zones).length}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Max Depth</div>
                  <div className="font-bold text-lg">{bfsResult.max_depth_reached} steps</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Edges Traversed</div>
                  <div className="font-bold text-lg">{bfsResult.edges_traversed.length}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Current Step</div>
                  <div className="font-bold text-lg text-violet-400">{animStep} / {bfsResult.max_depth_reached}</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Visit Order (Queue)</CardTitle>
                <CardDescription>The order BFS visits each zone (FIFO queue)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5">
                  {bfsResult.visit_order.map((z, i) => {
                    // Find this zone's depth
                    const depth = bfsResult.levels.findIndex(l => l.zones.includes(z))
                    const isVisible = depth <= animStep
                    return (
                      <Badge
                        key={`${z}-${i}`}
                        variant="outline"
                        className={`text-xs transition-all ${isVisible ? '' : 'opacity-20'}`}
                        style={isVisible ? { borderColor: depthColor(depth), color: depthColor(depth) } : {}}
                      >
                        {i + 1}. {z}
                      </Badge>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Legend */}
            <Card className="bg-violet-500/5 border-violet-500/20">
              <CardContent className="pt-4">
                <div className="text-xs font-semibold mb-2">Depth Legend</div>
                <div className="flex flex-wrap gap-2">
                  {DEPTH_COLORS.map((c, i) => (
                    <div key={i} className="flex items-center gap-1 text-xs">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c }} />
                      <span className="text-muted-foreground">{i === 0 ? 'Origin' : `Step ${i}`}{i === DEPTH_COLORS.length - 1 ? '+' : ''}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
