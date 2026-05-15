import { useEffect, useRef, useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Loader2, Play, SkipForward, RotateCcw, GitBranch, Network,
  Layers, Target, Clock, ArrowRight, Info, ShieldAlert, CheckCircle2, AlertTriangle
} from 'lucide-react'
import { useAuthFetch } from '@/context/AuthContext'
import { AnimatePresence, motion } from 'framer-motion'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const API_URL = import.meta.env.VITE_SWARM_API_URL || 'http://localhost:8001'

interface ZoneInfo { lat: number; lon: number; neighbors: string[] }
interface BFSLevel { depth: number; zones: string[] }
interface BFSResult {
  algorithm: string; start_zone: string; start_coords: { lat: number; lon: number }
  levels: BFSLevel[]; visit_order: string[]; edges_traversed: [string, string][]
  total_zones_affected: number; max_depth_reached: number
  zone_coords: Record<string, { lat: number; lon: number }>
}

const DEPTH_COLORS = ['#dc2626','#ea580c','#f59e0b','#84cc16','#22c55e','#06b6d4','#3b82f6','#8b5cf6']
function depthColor(d: number) { return DEPTH_COLORS[Math.min(d, DEPTH_COLORS.length - 1)] }

interface BFSSubModuleProps {
  zones: Record<string, ZoneInfo>
}

export default function BFSSubModule({ zones }: BFSSubModuleProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<L.Map | null>(null)
  const layersRef = useRef<L.LayerGroup | null>(null)
  const graphLayerRef = useRef<L.LayerGroup | null>(null)

  const [selectedZone, setSelectedZone] = useState<string>('')
  const [bfsResult, setBfsResult] = useState<BFSResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [animStep, setAnimStep] = useState<number>(-1)
  const [autoPlay, setAutoPlay] = useState(false)
  const [showGraph, setShowGraph] = useState(true)
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

  useEffect(() => {
    const names = Object.keys(zones)
    if (names.length > 0 && !selectedZone) setSelectedZone(names[0])
  }, [zones]) // eslint-disable-line react-hooks/exhaustive-deps

  // Init map
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
    setTimeout(() => map.invalidateSize(), 100)
    setTimeout(() => map.invalidateSize(), 300)
    const ro = new ResizeObserver(() => map.invalidateSize())
    ro.observe(mapRef.current)
    return () => { ro.disconnect(); map.remove(); mapInstance.current = null }
  }, [])

  // Draw zone graph
  useEffect(() => {
    if (!graphLayerRef.current || Object.keys(zones).length === 0) return
    graphLayerRef.current.clearLayers()
    if (!showGraph) return
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
    for (const [name, info] of Object.entries(zones)) {
      L.circleMarker([info.lat, info.lon], {
        radius: 5, fillColor: '#64748b', color: '#334155', weight: 1, fillOpacity: 0.7,
      }).bindTooltip(name, { permanent: false, direction: 'top', offset: [0, -8] })
        .addTo(graphLayerRef.current!)
    }
  }, [zones, showGraph])

  // Run BFS
  const runBFS = useCallback(async () => {
    if (!selectedZone) return
    setLoading(true); setBfsResult(null); setAnimStep(-1); setAutoPlay(false)
    try {
      const res = await fetch(`${API_URL}/api/ai/bfs`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ start_zone: selectedZone }),
      })
      if (!res.ok) throw new Error('BFS failed')
      const data: BFSResult = await res.json()
      setBfsResult(data); setAnimStep(0)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }, [selectedZone])

  // Render BFS on map
  useEffect(() => {
    if (!layersRef.current || !bfsResult || animStep < 0) return
    layersRef.current.clearLayers()
    const visibleZones = new Set<string>()
    const visibleEdges: [string, string][] = []
    for (let i = 0; i <= animStep && i < bfsResult.levels.length; i++) {
      for (const z of bfsResult.levels[i].zones) visibleZones.add(z)
    }
    for (const [from, to] of bfsResult.edges_traversed) {
      if (visibleZones.has(from) && visibleZones.has(to)) visibleEdges.push([from, to])
    }
    for (const [from, to] of visibleEdges) {
      const fc = bfsResult.zone_coords[from], tc = bfsResult.zone_coords[to]
      if (!fc || !tc) continue
      L.polyline([[fc.lat, fc.lon], [tc.lat, tc.lon]], { color: '#f59e0b', weight: 3, opacity: 0.8 }).addTo(layersRef.current!)
    }
    for (let i = 0; i <= animStep && i < bfsResult.levels.length; i++) {
      const depth = bfsResult.levels[i].depth
      const color = depthColor(depth)
      for (const z of bfsResult.levels[i].zones) {
        const coords = bfsResult.zone_coords[z]
        if (!coords) continue
        const isOrigin = depth === 0, isCurrent = i === animStep
        L.circleMarker([coords.lat, coords.lon], {
          radius: isOrigin ? 14 : isCurrent ? 11 : 9, fillColor: color, color: '#fff',
          weight: isOrigin ? 3 : 2, fillOpacity: 0.85,
        }).bindPopup(`
          <div style="font-family:'Inter',system-ui; font-size:12px;">
            <strong>${z}</strong>
            <div style="color:#888; margin-top:2px;">Depth ${depth}</div>
            <div style="margin-top:4px;">
              <span style="display:inline-block; width:10px; height:10px; background:${color}; border-radius:50%;"></span>
              <span style="margin-left:4px;">${isOrigin ? 'Origin' : `Spread step ${depth}`}</span>
            </div>
          </div>
        `).addTo(layersRef.current!)
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

  // Autoplay
  useEffect(() => {
    if (!autoPlay || !bfsResult) return
    if (animStep >= bfsResult.levels.length - 1) { setAutoPlay(false); return }
    const timer = setTimeout(() => setAnimStep(s => s + 1), 1200)
    return () => clearTimeout(timer)
  }, [autoPlay, animStep, bfsResult])

  const reset = () => { setBfsResult(null); setAnimStep(-1); setAutoPlay(false); layersRef.current?.clearLayers() }

  const progressPct = bfsResult ? ((animStep + 1) / bfsResult.levels.length) * 100 : 0

  return (
    <>
    <div className="space-y-4">
      {/* ━━━ Controls ━━━ */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-56">
          <label className="text-[11px] text-muted-foreground mb-1 block font-medium">Source Zone</label>
          <Select value={selectedZone} onValueChange={setSelectedZone}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select zone…" /></SelectTrigger>
            <SelectContent className="z-[1000]">
              {Object.keys(zones).sort().map(z => (
                <SelectItem key={z} value={z}>{z}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={runBFS} disabled={loading || !selectedZone} size="sm" className="gap-1.5 h-8 text-xs">
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
          Run BFS
        </Button>
        {bfsResult && (
          <>
            <Separator orientation="vertical" className="h-6" />
            <Button variant="outline" size="sm" className="gap-1 h-8 text-xs"
              disabled={animStep >= bfsResult.levels.length - 1}
              onClick={() => setAnimStep(s => Math.min(s + 1, bfsResult!.levels.length - 1))}>
              <SkipForward className="h-3 w-3" /> Step
            </Button>
            <Button variant={autoPlay ? 'destructive' : 'secondary'} size="sm" className="gap-1 h-8 text-xs"
              onClick={() => setAutoPlay(!autoPlay)}>
              {autoPlay ? <><Loader2 className="h-3 w-3 animate-spin" /> Stop</> : <><Play className="h-3 w-3" /> Simulate</>}
            </Button>
            <Button variant="ghost" size="sm" className="gap-1 h-8 text-xs" onClick={reset}>
              <RotateCcw className="h-3 w-3" /> Reset
            </Button>
          </>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="sm"
              className={`ml-auto gap-1 h-8 text-xs ${showGraph ? 'text-sky-400' : 'text-muted-foreground'}`}
              onClick={() => setShowGraph(!showGraph)}>
              <Network className="h-3 w-3" />
              Graph
            </Button>
          </TooltipTrigger>
          <TooltipContent>Toggle zone network overlay</TooltipContent>
        </Tooltip>
      </div>

      {/* ━━━ Progress bar (when result exists) ━━━ */}
      {bfsResult && (
        <div className="flex items-center gap-3">
          <Progress value={progressPct} className="h-1.5 flex-1 [&>div]:bg-violet-500" />
          <span className="text-[10px] text-muted-foreground tabular-nums font-mono whitespace-nowrap">
            Step {animStep + 1} / {bfsResult.levels.length}
          </span>
        </div>
      )}

      {/* ━━━ MAP + SIDEBAR ━━━ */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">

        {/* Map — 3 cols */}
        <Card className="lg:col-span-3 overflow-hidden">
          <CardContent className="p-0 relative">
            <div ref={mapRef} className="w-full h-[520px] bg-slate-900" />
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
          <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 p-3">
            <div className="flex items-center gap-1.5 text-xs font-medium mb-2">
              <Info className="h-3.5 w-3.5 text-violet-400" /> BFS Spread Model
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed mb-2">
              Breadth-first traversal predicts layer-by-layer swarm migration from a source zone through the neighbor graph.
            </p>
            <p className="text-[10px] text-muted-foreground leading-relaxed font-semibold">
              <strong>How to use:</strong> Select a Source Zone and click "Run BFS". The prediction helps you identify which adjacent zones will be impacted first, allowing you to set up containment lines.
            </p>
          </div>

          {/* Result stats */}
          {bfsResult ? (
            <Card className="border-border/50">
              <CardHeader className="pb-2 pt-3 px-3">
                <CardTitle className="text-xs font-medium flex items-center gap-1.5">
                  <Target className="h-3.5 w-3.5 text-red-400" />
                  Prediction Result
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3 space-y-2.5">
                <Separator />
                {[
                  { label: 'Origin', value: bfsResult.start_zone, color: 'text-foreground' },
                  { label: 'Zones at risk', value: `${bfsResult.total_zones_affected} / ${Object.keys(zones).length}`, color: 'text-red-400' },
                  { label: 'Spread horizon', value: `${bfsResult.max_depth_reached} steps`, color: 'text-foreground' },
                  { label: 'Migration paths', value: `${bfsResult.edges_traversed.length}`, color: 'text-foreground' },
                  { label: 'Current step', value: `${animStep} / ${bfsResult.max_depth_reached}`, color: 'text-violet-400' },
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{row.label}</span>
                    <span className={`font-mono font-medium tabular-nums ${row.color}`}>{row.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-lg border border-dashed border-border/50 p-4 text-center">
              <GitBranch className="h-5 w-5 mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-[11px] text-muted-foreground">Select a zone and run BFS</p>
            </div>
          )}

          {/* Recommended Next Steps */}
          {bfsResult && bfsResult.levels.length > 1 && (
            <div className="bg-muted/30 rounded-lg p-2.5 border border-border/50">
              <div className="text-[10px] font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
                <ShieldAlert className="h-3 w-3 text-violet-400" />
                Containment Strategy
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed mb-2">
                Based on the spread horizon, we recommend setting up containment lines around the {bfsResult.levels[1].zones.length} zones at Depth 1 to halt the swarm.
              </p>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleAction('issue_warning', bfsResult.levels[1].zones.join(', '))} disabled={actionLoading} className="h-7 text-[10px] flex-1 bg-violet-500 hover:bg-violet-600 text-white border-0">
                  {actionLoading ? <Loader2 className="h-3 w-3 animate-spin mx-auto" /> : 'Issue Early Warning'}
                </Button>
              </div>
            </div>
          )}

          {/* Timeline (compact) */}
          {bfsResult && (
            <div className="space-y-1 max-h-[280px] overflow-y-auto pr-1">
              {bfsResult.levels.map((level, i) => {
                const isActive = i <= animStep
                return (
                  <button
                    key={level.depth}
                    onClick={() => setAnimStep(i)}
                    className={`w-full text-left rounded-lg border p-2 transition-all text-xs ${
                      isActive
                        ? i === animStep ? 'border-violet-500/40 bg-violet-500/5' : 'border-border/40 bg-muted/30'
                        : 'border-border/20 opacity-30'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                        style={{ backgroundColor: depthColor(level.depth) }}>{level.depth}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] text-muted-foreground">
                          {level.depth === 0 ? 'Origin' : `Step ${level.depth}`}
                          <span className="ml-1 text-muted-foreground/60">· {level.zones.length} zone{level.zones.length !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="flex flex-wrap gap-0.5 mt-0.5">
                          {level.zones.slice(0, 4).map(z => (
                            <Badge key={z} variant="outline" className="text-[9px] px-1 py-0 h-4" style={{
                              borderColor: depthColor(level.depth) + '44',
                              color: depthColor(level.depth),
                            }}>{z}</Badge>
                          ))}
                          {level.zones.length > 4 && (
                            <span className="text-[9px] text-muted-foreground">+{level.zones.length - 4}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}

        </div>
      </div>

      {/* ━━━ LEGEND ━━━ */}
      <div className="flex items-center gap-4 text-[10px] text-muted-foreground px-1">
        {DEPTH_COLORS.slice(0, 6).map((c, i) => (
          <span key={i} className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c }} />
            {i === 0 ? 'Origin' : `Step ${i}`}
          </span>
        ))}
        <Separator orientation="vertical" className="h-3" />
        <span>orange lines = migration paths · Dots = affected zones</span>
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
