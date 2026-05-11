import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { GitBranch, Network, Route } from 'lucide-react'
import BFSSubModule from './BFSSubModule'
import AStarSubModule from './AStarSubModule'

const API_URL = import.meta.env.VITE_SWARM_API_URL || 'http://localhost:8001'

interface ZoneInfo { lat: number; lon: number; neighbors: string[] }

export default function AIPrediction() {
  const [zones, setZones] = useState<Record<string, ZoneInfo>>({})
  const [activeView, setActiveView] = useState<'bfs' | 'astar'>('bfs')

  useEffect(() => {
    fetch(`${API_URL}/api/ai/zones`)
      .then(r => r.json())
      .then(data => setZones(data.zones || {}))
      .catch(console.error)
  }, [])

  const zoneCount = Object.keys(zones).length

  return (
    <TooltipProvider>
      <div className="w-full space-y-5" style={{ fontFamily: "'Inter', sans-serif" }}>

        {/* ━━━ HEADER ━━━ */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2.5" style={{ fontFamily: "'Outfit', sans-serif" }}>
              <Network className="h-6 w-6 text-violet-400" />
              AI Prediction
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Migration forecasting · Zone-graph pathfinding · {zoneCount} monitored zones
            </p>
          </div>
          <Badge variant="outline" className="text-[10px] gap-1 border-violet-500/30 text-violet-400">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-pulse" />
            Model ready
          </Badge>
        </div>

        {/* ━━━ VIEW TOGGLE ━━━ */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/40 border border-border/40 w-fit">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setActiveView('bfs')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  activeView === 'bfs'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <GitBranch className="h-3.5 w-3.5" /> Spread Prediction
              </button>
            </TooltipTrigger>
            <TooltipContent>BFS — layer-by-layer migration forecasting</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setActiveView('astar')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  activeView === 'astar'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Route className="h-3.5 w-3.5" /> Route Finder
              </button>
            </TooltipTrigger>
            <TooltipContent>A* — optimal path between two zones</TooltipContent>
          </Tooltip>
        </div>

        <Separator />

        {/* ━━━ SUBMODULES ━━━ */}
        {activeView === 'bfs' && <BFSSubModule zones={zones} />}
        {activeView === 'astar' && <AStarSubModule zones={zones} />}
      </div>
    </TooltipProvider>
  )
}
