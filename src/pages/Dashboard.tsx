import { HoverEffect } from '@/components/ui/card-hover-effect'
import { NumberTicker } from '@/components/ui/number-ticker'
import { Spotlight } from '@/components/ui/spotlight'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, TrendingUp } from 'lucide-react'

export default function Dashboard() {
  const stats = [
    { label: 'Active Swarms', value: 3, description: 'Detected in field zones' },
    { label: 'Risk Zones', value: 7, description: 'High-alert regions' },
    { label: 'Drones Deployed', value: 12, description: 'Fleet coverage' },
    { label: 'Field Reports', value: 38, description: 'Observer submissions' },
  ]

  const alerts = [
    { type: 'critical', title: 'Swarm Detected — Khuzdar', desc: 'Est. 2.3M locusts, moving NE at 28 km/h', time: '08:42 PKT' },
    { type: 'warning', title: 'High Wind Alert — Jacobabad', desc: 'Wind 34 km/h NE — migration risk elevated', time: '07:15 PKT' },
    { type: 'info', title: 'Drone Battery Low — DPP-Gamma', desc: 'Battery at 15%, returning to base', time: '06:30 PKT' },
  ]

  return (
    <div className="relative w-full space-y-8">
      {/* Spotlight Background */}
      <Spotlight className="left-0 top-0 opacity-30" fill="rgba(59, 130, 246, 0.3)" />
      
      {/* Header */}
      <div className="relative z-10">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2">Command Dashboard</h1>
        <p className="text-lg text-muted-foreground">Dept. of Plant Protection — Pakistan · Cloud-synced · AI risk scoring active</p>
      </div>

      {/* Stats Grid with Hover Effects */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="group">
            <Card className="h-full transition-all duration-300 group-hover:shadow-2xl group-hover:border-blue-500/50 group-hover:scale-105">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-3xl md:text-4xl font-bold tracking-tight text-blue-600">
                    <NumberTicker value={stat.value} />
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-green-500" />
                    {stat.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      {/* Pakistan Risk Overview */}
      <Card className="relative z-10 border-2 border-blue-500/20 shadow-xl">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Pakistan Risk Overview</CardTitle>
              <CardDescription className="mt-2">GIS terrain-aware risk visualization</CardDescription>
            </div>
            <Badge className="bg-blue-500/20 text-blue-600">Active</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="aspect-video w-full rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-dashed border-blue-200 flex items-center justify-center overflow-hidden">
            <div className="text-center opacity-50">
              <p className="text-xl font-semibold mb-2">🗺️</p>
              <p className="text-sm text-muted-foreground">Interactive Pakistan Risk Map</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Latest Alerts */}
      <div className="relative z-10 space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Latest Alerts</h2>
        <div className="space-y-3">
          {alerts.map((alert, idx) => (
            <Alert key={idx} className={`border-l-4 ${
              alert.type === 'critical' ? 'border-l-red-500 bg-red-50/50' :
              alert.type === 'warning' ? 'border-l-yellow-500 bg-yellow-50/50' :
              'border-l-blue-500 bg-blue-50/50'
            }`}>
              <AlertCircle className={`h-4 w-4 ${
                alert.type === 'critical' ? 'text-red-500' :
                alert.type === 'warning' ? 'text-yellow-500' :
                'text-blue-500'
              }`} />
              <div className="ml-2 flex-1">
                <AlertTitle className="font-semibold">{alert.title}</AlertTitle>
                <AlertDescription className="mt-1 text-sm">{alert.desc}</AlertDescription>
              </div>
              <div className="text-xs text-muted-foreground whitespace-nowrap ml-2">{alert.time}</div>
            </Alert>
          ))}
        </div>
      </div>

      {/* Weather Card */}
      <Card className="relative z-10 bg-gradient-to-br from-sky-500/10 to-blue-500/10 border-sky-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">🌤️</span>
            Weather & Conditions
          </CardTitle>
          <CardDescription>Real-time meteorological data for swarm prediction</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 rounded-lg bg-white/50">
            <p className="text-sm text-muted-foreground">Temperature</p>
            <p className="text-2xl font-bold">38°C</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-white/50">
            <p className="text-sm text-muted-foreground">Humidity</p>
            <p className="text-2xl font-bold">42%</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-white/50">
            <p className="text-sm text-muted-foreground">Wind Speed</p>
            <p className="text-2xl font-bold">18 km/h</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-white/50">
            <p className="text-sm text-muted-foreground">Visibility</p>
            <p className="text-2xl font-bold">12 km</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

