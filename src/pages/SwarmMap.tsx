import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useState, useEffect } from 'react'

interface SwarmData {
  id: string
  size: number
  area_km2: number
  density: number
  speed: number
  health: number
  risk_level: string
  center_name: string
}

interface Stats {
  total_swarms: number
  total_locusts: number
  avg_health: number
  critical_count: number
}

const API_URL = 'http://localhost:8001'

export default function SwarmMap() {
  const [activeOverlay, setActiveOverlay] = useState<'swarms' | 'drones' | 'heatmap' | null>(null)
  const [swarmData, setSwarmData] = useState<SwarmData[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Fetch GeoJSON data
        const geoRes = await fetch(`${API_URL}/api/swarms/geojson`)
        if (!geoRes.ok) throw new Error('Failed to fetch GeoJSON')
        const geoData = await geoRes.json()
        
        // Extract swarm properties
        const swarms = geoData.features?.map((feature: any) => feature.properties) || []
        setSwarmData(swarms)
        
        // Fetch stats
        const statsRes = await fetch(`${API_URL}/api/swarms/stats`)
        if (!statsRes.ok) throw new Error('Failed to fetch stats')
        const statsData = await statsRes.json()
        setStats(statsData)
        
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Connection error')
        console.error('Swarm Engine Error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 5000) // Update every 5 seconds
    return () => clearInterval(interval)
  }, [])

  const riskColors: Record<string, string> = {
    critical: 'bg-red-500/20 text-red-700 border-red-200',
    high: 'bg-orange-500/20 text-orange-700 border-orange-200',
    medium: 'bg-yellow-500/20 text-yellow-700 border-yellow-200',
    low: 'bg-green-500/20 text-green-700 border-green-200',
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Swarm Distribution Map</h1>
        <p className="text-muted-foreground mt-2">Real-time locust swarm tracking · Pakistan geographic data · Live from Swarm Engine API</p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Active Swarms</div>
            <div className="text-3xl font-bold">{stats?.total_swarms || 0}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Critical</div>
            <div className="text-3xl font-bold text-red-600">{stats?.critical_count || 0}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Total Locusts</div>
            <div className="text-2xl font-bold">{stats ? (stats.total_locusts / 1000000000).toFixed(1) : 0}B</div>
            <div className="text-xs text-muted-foreground mt-1">Billion locusts</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Avg Health</div>
            <div className="text-3xl font-bold text-green-600">{stats ? (stats.avg_health * 100).toFixed(0) : 0}%</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Interactive Risk Map — Pakistan</CardTitle>
              <CardDescription>{error ? '⚠️ ' + error : 'Pan, zoom, and toggle overlays'}</CardDescription>
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
        <CardContent className="bg-slate-50 dark:bg-slate-900 rounded p-6 min-h-96">
          {loading ? (
            <div className="flex items-center justify-center h-80">
              <div className="text-center text-muted-foreground">
                <div className="text-4xl mb-4 animate-spin">⚙️</div>
                <p>Connecting to Swarm Engine...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-80">
              <div className="text-center text-red-600">
                <div className="text-4xl mb-4">⚠️</div>
                <p>Connection Error: {error}</p>
                <p className="text-sm mt-2">Make sure Swarm Engine is running on port 8001</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground mb-4">
                <span className="font-semibold">{swarmData.length} active swarm{swarmData.length !== 1 ? 's' : ''} detected</span>
                <span className="ml-2">•</span>
                <span className="ml-2">{stats && stats.total_locusts > 0 ? `${(stats.total_locusts / 1000000000).toFixed(1)}B locusts` : 'No data'}</span>
              </div>
              
              {/* Swarm List */}
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {swarmData.map((swarm) => (
                  <div key={swarm.id} className={`p-3 rounded-lg border ${riskColors[swarm.risk_level] || riskColors.low}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold text-sm">{swarm.id}</div>
                        <div className="text-xs opacity-75">{swarm.center_name}</div>
                        <div className="text-xs mt-1 space-y-0.5">
                          <div>Area: <span className="font-mono">{swarm.area_km2.toFixed(1)} km²</span></div>
                          <div>Population: <span className="font-mono">{(swarm.size / 1000000000).toFixed(2)}B</span> locusts</div>
                          <div>Density: <span className="font-mono">{(swarm.density / 1000000).toFixed(1)}M</span>/km²</div>
                          <div>Speed: <span className="font-mono">{swarm.speed.toFixed(1)} km/h</span></div>
                        </div>
                      </div>
                      <Badge className={riskColors[swarm.risk_level]}>
                        {swarm.risk_level.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="mt-2 h-1.5 bg-slate-300 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-green-500 to-red-500 transition-all"
                        style={{ width: `${swarm.health * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {activeOverlay && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-700 dark:text-blue-400">
                    {activeOverlay === 'swarms' && '🔴 Swarm markers with clustering enabled'}
                    {activeOverlay === 'drones' && '🛸 Drone positions and patrol routes visible'}
                    {activeOverlay === 'heatmap' && '🌡️ Intensity heatmap showing locust density'}
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
