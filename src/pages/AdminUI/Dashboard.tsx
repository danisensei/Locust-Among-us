import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Bug, Radar, Plane, FileText, Thermometer, Droplets, Wind, Eye,
  ArrowUpRight, ArrowDownRight, Activity, Shield, MapPin,
  Clock, Zap
} from 'lucide-react'
import { Area, AreaChart, XAxis, CartesianGrid } from 'recharts'
import { AnimateDigits } from '@/components/unlumen-ui/animate-digits'
import { Tilt } from '@/components/unlumen-ui/tilt'
import type { ChartConfig } from '@/components/ui/chart'

/* ─── Constants ─── */
const WEATHER_REFRESH_MS = 8_000
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
const createWeather = () => ({
  temperature: randomInt(29, 43),
  humidity: randomInt(28, 68),
  windSpeed: randomInt(8, 36),
  visibility: randomInt(6, 15),
})

/* Simulated hourly threat data for chart */
const generateChartData = () => {
  const hours = ['00:00', '02:00', '04:00', '06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00']
  return hours.map(h => ({
    hour: h,
    threats: randomInt(1, 8),
    resolved: randomInt(0, 4),
    sightings: randomInt(2, 12),
  }))
}

const chartConfig: ChartConfig = {
  threats: { label: 'Active Threats', color: 'hsl(0, 72%, 51%)' },
  resolved: { label: 'Resolved', color: 'hsl(142, 71%, 45%)' },
  sightings: { label: 'Sightings', color: 'hsl(199, 89%, 48%)' },
}

/* Zone threat data */
const THREAT_ZONES = [
  { name: 'Thar Desert', level: 92, trend: 'up', status: 'critical' },
  { name: 'Cholistan', level: 78, trend: 'up', status: 'high' },
  { name: 'Khuzdar Valley', level: 65, trend: 'down', status: 'high' },
  { name: 'Sibi', level: 51, trend: 'up', status: 'medium' },
  { name: 'Nasirabad', level: 38, trend: 'down', status: 'medium' },
  { name: 'Quetta', level: 22, trend: 'stable', status: 'low' },
]

/* Alerts */
const ALERTS = [
  { id: 1, type: 'critical' as const, title: 'Swarm Detected — Khuzdar', desc: 'Est. 2.3M locusts, 28 km/h NE', time: '2m ago' },
  { id: 2, type: 'warning' as const, title: 'Wind Alert — Jacobabad', desc: 'Wind 34 km/h — migration risk elevated', time: '12m ago' },
  { id: 3, type: 'info' as const, title: 'Drone RTB — DPP-Gamma', desc: 'Battery 15%, returning to base', time: '28m ago' },
  { id: 4, type: 'critical' as const, title: 'Swarm Cluster — Thar', desc: 'Multiple swarms converging, 5.1M density', time: '35m ago' },
]

const STATUS_COLORS = {
  critical: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-amber-500',
  low: 'bg-emerald-500',
}

const ALERT_STYLES = {
  critical: { bg: 'bg-red-500/8 border-red-500/30', dot: 'bg-red-500', text: 'text-red-400' },
  warning:  { bg: 'bg-amber-500/8 border-amber-500/30', dot: 'bg-amber-500', text: 'text-amber-400' },
  info:     { bg: 'bg-sky-500/8 border-sky-500/30', dot: 'bg-sky-500', text: 'text-sky-400' },
}

export default function Dashboard() {
  const [weather, setWeather] = useState(createWeather)
  const [chartData] = useState(generateChartData)
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const w = setInterval(() => setWeather(createWeather()), WEATHER_REFRESH_MS)
    const c = setInterval(() => setNow(new Date()), 1000)
    return () => { clearInterval(w); clearInterval(c) }
  }, [])

  const stats = useMemo(() => [
    { label: 'Active Swarms', value: 3, icon: Bug, color: 'text-red-400', bg: 'bg-red-500/10', trend: '+1', trendUp: true },
    { label: 'Risk Zones', value: 7, icon: Shield, color: 'text-amber-400', bg: 'bg-amber-500/10', trend: '—', trendUp: false },
    { label: 'Drones Active', value: 12, icon: Plane, color: 'text-sky-400', bg: 'bg-sky-500/10', trend: '+3', trendUp: true },
    { label: 'Reports Today', value: 38, icon: FileText, color: 'text-emerald-400', bg: 'bg-emerald-500/10', trend: '+12', trendUp: true },
  ], [])

  const weatherItems = useMemo(() => [
    { icon: Thermometer, label: 'Temp', value: `${weather.temperature}`, unit: '°C', color: 'text-red-400', barColor: 'bg-red-500', pct: Math.min(100, (weather.temperature / 50) * 100) },
    { icon: Droplets, label: 'Humidity', value: `${weather.humidity}`, unit: '%', color: 'text-blue-400', barColor: 'bg-blue-500', pct: weather.humidity },
    { icon: Wind, label: 'Wind', value: `${weather.windSpeed}`, unit: 'km/h', color: 'text-cyan-400', barColor: 'bg-cyan-500', pct: Math.min(100, (weather.windSpeed / 40) * 100) },
    { icon: Eye, label: 'Visibility', value: `${weather.visibility}`, unit: 'km', color: 'text-emerald-400', barColor: 'bg-emerald-500', pct: Math.min(100, (weather.visibility / 20) * 100) },
  ], [weather])

  return (
    <TooltipProvider>
      <div className="w-full space-y-6" style={{ fontFamily: "'Inter', sans-serif" }}>

        {/* ━━━ HEADER ━━━ */}
        <div className="flex flex-col gap-4">
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
                Command Dashboard
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Real-time swarm intelligence · AI-powered risk assessment
              </p>
            </div>
            <div className="text-right">
              <div className="text-xl font-medium tabular-nums tracking-wider" style={{ fontFamily: "'Space Mono', monospace" }}>
                {now.toLocaleTimeString('en-US', { hour12: false })}
              </div>
              <div className="text-[11px] text-muted-foreground">
                {now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })} · PKT
              </div>
            </div>
          </div>
        </div>

        <Separator />

        <Tabs defaultValue="overview" className="space-y-6">
          <div className="flex justify-between items-center">
            <TabsList className="bg-muted/50 border border-border/50">
              <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
              <TabsTrigger value="intelligence" className="text-xs">Intelligence & Threats</TabsTrigger>
              <TabsTrigger value="performance" className="text-xs">System Performance</TabsTrigger>
            </TabsList>
            <Badge variant="outline" className="text-[10px] bg-background">
              LC-EWS v2.0
            </Badge>
          </div>

          {/* ━━━ TAB 1: OVERVIEW ━━━ */}
          <TabsContent value="overview" className="space-y-6 mt-0">
            {/* STATS ROW */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map(stat => {
                const Icon = stat.icon
                return (
                  <Tilt key={stat.label} rotationFactor={6}>
                    <Card className="relative overflow-hidden border-border/50 hover:border-border transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className={`p-2 rounded-lg ${stat.bg}`}>
                            <Icon className={`h-4 w-4 ${stat.color}`} />
                          </div>
                          <Tooltip>
                            <TooltipTrigger>
                              <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${stat.trendUp ? 'text-red-400' : 'text-muted-foreground'}`}>
                                {stat.trend}
                                {stat.trendUp && <ArrowUpRight className="h-3 w-3" />}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>Change since yesterday</TooltipContent>
                          </Tooltip>
                        </div>
                        <div className="mt-3">
                          <AnimateDigits value={String(stat.value)} className="text-2xl font-bold" />
                          <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                        </div>
                      </CardContent>
                      <div className={`absolute bottom-0 left-0 right-0 h-[2px] ${stat.bg.replace('/10', '/40')}`} />
                    </Card>
                  </Tilt>
                )
              })}
            </div>

            {/* ALERTS & WEATHER GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Alerts */}
              <Card className="lg:col-span-1">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Zap className="h-4 w-4 text-red-400" />
                      Recent Alerts
                    </CardTitle>
                    <span className="flex items-center gap-1 text-[10px] text-red-400 font-medium">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                      Live
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {ALERTS.map(alert => {
                    const style = ALERT_STYLES[alert.type]
                    return (
                      <div key={alert.id} className={`rounded-lg border p-3 ${style.bg} transition-colors hover:border-opacity-60`}>
                        <div className="flex items-start gap-2.5">
                          <div className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${style.dot}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-semibold truncate">{alert.title}</span>
                              <span className="text-[10px] text-muted-foreground whitespace-nowrap">{alert.time}</span>
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{alert.desc}</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>

              {/* Weather */}
              <Card className="lg:col-span-1">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <span className="text-base">🌤️</span>
                      Weather & Conditions
                    </CardTitle>
                    <Tooltip>
                      <TooltipTrigger>
                        <Badge variant="outline" className="text-[10px] gap-1">
                          <Clock className="h-2.5 w-2.5" />
                          8s refresh
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>Simulated meteorological feed</TooltipContent>
                    </Tooltip>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {weatherItems.map(item => {
                    const WIcon = item.icon
                    return (
                      <div key={item.label} className="flex items-center gap-3">
                        <WIcon className={`h-4 w-4 ${item.color} shrink-0`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-muted-foreground">{item.label}</span>
                            <span className="text-sm font-bold tabular-nums">
                              <AnimateDigits value={item.value} className="text-sm font-bold inline-flex" />
                              <span className="text-xs text-muted-foreground ml-0.5">{item.unit}</span>
                            </span>
                          </div>
                          <div className="h-1 rounded-full bg-muted overflow-hidden">
                            <div
                              className={`h-full rounded-full ${item.barColor} transition-all duration-700 ease-out`}
                              style={{ width: `${item.pct}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  <Separator className="my-2" />
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> Quetta, Pakistan</span>
                    <span>Last sync: {now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ━━━ TAB 2: INTELLIGENCE & THREATS ━━━ */}
          <TabsContent value="intelligence" className="space-y-6 mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Activity Chart — 3 cols */}
              <Card className="lg:col-span-3">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Activity className="h-4 w-4 text-sky-400" />
                        Threat Activity — 24h
                      </CardTitle>
                      <CardDescription className="text-xs">Swarm sightings, active threats, and resolved incidents</CardDescription>
                    </div>
                    <Badge variant="outline" className="text-[10px]">Live</Badge>
                  </div>
                </CardHeader>
                <CardContent className="pb-2">
                  <ChartContainer config={chartConfig} className="h-[280px] w-full">
                    <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gThreats" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gSightings" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(199, 89%, 48%)" stopOpacity={0.2} />
                          <stop offset="100%" stopColor="hsl(199, 89%, 48%)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/30" />
                      <XAxis dataKey="hour" tickLine={false} axisLine={false} tickMargin={8} className="text-[10px]" />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area type="monotone" dataKey="sightings" stroke="hsl(199, 89%, 48%)" strokeWidth={1.5} fill="url(#gSightings)" />
                      <Area type="monotone" dataKey="threats" stroke="hsl(0, 72%, 51%)" strokeWidth={2} fill="url(#gThreats)" />
                      <Area type="monotone" dataKey="resolved" stroke="hsl(142, 71%, 45%)" strokeWidth={1.5} fill="transparent" strokeDasharray="4 4" />
                    </AreaChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Zone Threat Levels — 2 cols */}
              <Card className="lg:col-span-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Radar className="h-4 w-4 text-amber-400" />
                    Zone Threat Levels
                  </CardTitle>
                  <CardDescription className="text-xs">Real-time risk assessment by zone</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {THREAT_ZONES.map(zone => (
                    <div key={zone.name} className="group">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full ${STATUS_COLORS[zone.status as keyof typeof STATUS_COLORS]}`} />
                          <span className="text-sm font-medium">{zone.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {zone.trend === 'up' && <ArrowUpRight className="h-3 w-3 text-red-400" />}
                          {zone.trend === 'down' && <ArrowDownRight className="h-3 w-3 text-emerald-400" />}
                          <span className="text-xs font-mono tabular-nums text-muted-foreground">{zone.level}%</span>
                        </div>
                      </div>
                      <Progress
                        value={zone.level}
                        className={`h-2 ${zone.status === 'critical' ? '[&>div]:bg-red-500' : zone.status === 'high' ? '[&>div]:bg-orange-500' : zone.status === 'medium' ? '[&>div]:bg-amber-500' : '[&>div]:bg-emerald-500'}`}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ━━━ TAB 3: SYSTEM PERFORMANCE ━━━ */}
          <TabsContent value="performance" className="mt-0">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Radar className="h-4 w-4 text-emerald-400" />
                  Operational Metrics
                </CardTitle>
                <CardDescription className="text-xs">Overall system performance and AI model health</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Avg Response Time', value: '14 min', sub: 'Last 24h', color: 'text-emerald-400' },
                    { label: 'Coverage Area', value: '847K km²', sub: 'Pakistan', color: 'text-sky-400' },
                    { label: 'Detection Rate', value: '94.2%', sub: 'AI model', color: 'text-violet-400' },
                    { label: 'Uptime', value: '99.8%', sub: 'System', color: 'text-amber-400' },
                  ].map(m => (
                    <div key={m.label} className="rounded-lg border border-border/40 bg-accent/20 p-4 text-center hover:bg-accent/30 transition-colors">
                      <div className={`text-2xl font-bold tabular-nums ${m.color}`}>{m.value}</div>
                      <div className="text-xs font-medium mt-1">{m.label}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{m.sub}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>

      </div>
    </TooltipProvider>
  )
}
