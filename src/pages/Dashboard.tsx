import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, TrendingUp } from 'lucide-react'

export default function Dashboard() {
  const stats = [
    { label: 'Active Swarms', value: '3', trend: '+1' },
    { label: 'Risk Zones', value: '7', trend: '+2' },
    { label: 'Drones Deployed', value: '12', trend: '-1' },
    { label: 'Field Reports', value: '38', trend: '+94%' },
  ]

  const alerts = [
    { type: 'critical', title: 'Swarm Detected — Khuzdar', desc: 'Est. 2.3M locusts, moving NE at 28 km/h', time: '08:42 PKT' },
    { type: 'warning', title: 'High Wind Alert — Jacobabad', desc: 'Wind 34 km/h NE — migration risk elevated', time: '07:15 PKT' },
    { type: 'info', title: 'Drone Battery Low — DPP-Gamma', desc: 'Battery at 15%, returning to base', time: '06:30 PKT' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Command Dashboard</h1>
        <p className="text-muted-foreground mt-2">Dept. of Plant Protection — Pakistan · Cloud-synced · AI risk scoring active</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                {stat.trend}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pakistan Risk Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Pakistan Risk Overview</CardTitle>
          <CardDescription>GIS terrain-aware risk visualization</CardDescription>
        </CardHeader>
        <CardContent className="bg-slate-50 dark:bg-slate-900 rounded h-72 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <div className="text-4xl mb-2">🗺️</div>
            <p>Interactive Pakistan Risk Map</p>
            <p className="text-sm">Showing swarm movements and risk zones</p>
          </div>
        </CardContent>
      </Card>

      {/* Alerts and Score Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Latest Alerts</CardTitle>
            <CardDescription>Real-time alert aggregation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.map((alert, idx) => (
              <Alert key={idx} variant={alert.type === 'critical' ? 'destructive' : 'default'}>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{alert.title}</AlertTitle>
                <AlertDescription className="flex justify-between">
                  <span>{alert.desc}</span>
                  <span className="text-xs text-muted-foreground">{alert.time}</span>
                </AlertDescription>
              </Alert>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI Confidence Score</CardTitle>
            <CardDescription>72-hour forecast accuracy</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-3xl font-bold text-green-600">87%</div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div className="bg-green-600 h-2 rounded-full" style={{ width: '87%' }}></div>
            </div>
            <p className="text-xs text-muted-foreground">Last trained: 2h ago</p>
          </CardContent>
        </Card>
      </div>

      {/* Weather Cards */}
      <Card>
        <CardHeader>
          <CardTitle>Weather — Key Monitoring Zones</CardTitle>
          <CardDescription>Current conditions in critical areas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { city: 'Quetta, Balochistan', temp: '38°C', wind: '28 km/h NE', risk: 'Critical' },
              { city: 'Jacobabad, Sindh', temp: '41°C', wind: '34 km/h NE', risk: 'High' },
              { city: 'D.I. Khan, KPK', temp: '34°C', wind: '15 km/h SW', risk: 'Medium' },
            ].map((w, idx) => (
              <Card key={idx} className="bg-slate-50 dark:bg-slate-900">
                <CardContent className="pt-4">
                  <p className="font-semibold">{w.city}</p>
                  <p className="text-2xl font-bold mt-2">{w.temp}</p>
                  <p className="text-sm text-muted-foreground mt-2">Wind: {w.wind}</p>
                  <Badge className="mt-3" variant={w.risk === 'Critical' ? 'destructive' : 'secondary'}>
                    {w.risk}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

