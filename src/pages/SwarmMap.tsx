import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useState } from 'react'

export default function SwarmMap() {
  const [activeOverlay, setActiveOverlay] = useState<'swarms' | 'drones' | 'heatmap' | null>(null)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Swarm Distribution Map</h1>
        <p className="text-muted-foreground mt-2">GIS terrain-aware risk visualization · DBSCAN clustering · Real-time satellite overlay</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Interactive Risk Map — Pakistan</CardTitle>
              <CardDescription>Pan, zoom, and toggle overlays</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant={activeOverlay === 'swarms' ? 'default' : 'outline'} onClick={() => setActiveOverlay(activeOverlay === 'swarms' ? null : 'swarms')}>
                🔴 Swarms
              </Button>
              <Button variant={activeOverlay === 'drones' ? 'default' : 'outline'} onClick={() => setActiveOverlay(activeOverlay === 'drones' ? null : 'drones')}>
                🛸 Drones
              </Button>
              <Button variant={activeOverlay === 'heatmap' ? 'default' : 'outline'} onClick={() => setActiveOverlay(activeOverlay === 'heatmap' ? null : 'heatmap')}>
                🌡️ Heatmap
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="bg-slate-50 dark:bg-slate-900 rounded h-96 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <div className="text-5xl mb-4">🗺️</div>
            <p className="text-lg font-semibold">Interactive Pakistan Risk Map</p>
            <p className="text-sm">Showing swarm movements and drone positions</p>
            {activeOverlay && <Badge className="mt-4">{activeOverlay.toUpperCase()} visible</Badge>}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
