import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { GitBranch, Network, Route } from 'lucide-react'
import BFSSubModule from './BFSSubModule'
import AStarSubModule from './AStarSubModule'

const API_URL = import.meta.env.VITE_SWARM_API_URL || 'http://localhost:8001'

interface ZoneInfo { lat: number; lon: number; neighbors: string[] }

export default function AIPrediction() {
  const [zones, setZones] = useState<Record<string, ZoneInfo>>({})
  const [activeView, setActiveView] = useState<'bfs' | 'astar'>('bfs')

  // Fetch zone graph (shared between both submodules)
  useEffect(() => {
    fetch(`${API_URL}/api/ai/zones`)
      .then(r => r.json())
      .then(data => setZones(data.zones || {}))
      .catch(console.error)
  }, [])

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Network className="h-8 w-8 text-violet-400" />
          AI Spread Prediction
        </h1>
        <p className="text-muted-foreground mt-2">
          Locust migration forecasting · Zone-by-zone risk analysis across Pakistan
        </p>
      </div>

      {/* View Toggle */}
      <div className="flex gap-2">
        <Button
          variant={activeView === 'bfs' ? 'default' : 'outline'}
          size="sm"
          className="gap-2"
          onClick={() => setActiveView('bfs')}
        >
          <GitBranch className="h-4 w-4" /> Spread Prediction (BFS)
        </Button>
        <Button
          variant={activeView === 'astar' ? 'default' : 'outline'}
          size="sm"
          className="gap-2"
          onClick={() => setActiveView('astar')}
        >
          <Route className="h-4 w-4" /> Route Finder (A*)
        </Button>
      </div>

      {/* Submodules */}
      {activeView === 'bfs' && <BFSSubModule zones={zones} />}
      {activeView === 'astar' && <AStarSubModule zones={zones} />}
    </div>
  )
}
