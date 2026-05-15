import { useEffect, useState, useMemo, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { AnimatedTabs } from '@/components/ui/animated-tabs'
import {
  Bug, Radar, Plane, FileText, Thermometer, Droplets, Wind, Eye,
  ArrowUpRight, ArrowDownRight, Activity, Shield, MapPin,
  Clock, Zap
} from 'lucide-react'
import { Area, AreaChart, XAxis, CartesianGrid } from 'recharts'
import { AnimateDigits } from '@/components/unlumen-ui/animate-digits'
import { Tilt } from '@/components/unlumen-ui/tilt'
import type { ChartConfig } from '@/components/ui/chart'
import { useAuthFetch, API_URL } from '@/context/AuthContext'

// ── Types ────────────────────────────────────────────────────
interface AlertData {
  id: number
  type: 'critical' | 'warning' | 'info'
  title: string
  description: string
  created_at: string
}

/* ─── Constants ─── */
const PAK_CITIES = [
  { name: 'Karachi', lat: 24.8607, lon: 67.0011 },
  { name: 'Lahore', lat: 31.5497, lon: 74.3436 },
  { name: 'Islamabad', lat: 33.6844, lon: 73.0479 },
  { name: 'Quetta', lat: 30.1798, lon: 66.0245 },
  { name: 'Peshawar', lat: 34.0151, lon: 71.5249 },
  { name: 'Multan', lat: 30.1575, lon: 71.5249 },
]
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
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

const STATUS_COLORS = {
  critical: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-orange-500',
  low: 'bg-emerald-500',
}

const ALERT_STYLES = {
  critical: { bg: 'bg-accent/30 border-l-4 border-l-red-500 border-y border-r border-border/50', dot: 'bg-red-500', text: 'text-red-400' },
  warning:  { bg: 'bg-accent/30 border-l-4 border-l-orange-500 border-y border-r border-border/50', dot: 'bg-orange-500', text: 'text-orange-400' },
  info:     { bg: 'bg-accent/30 border-l-4 border-l-sky-500 border-y border-r border-border/50', dot: 'bg-sky-500', text: 'text-sky-400' },
}

export default function Dashboard() {
  const authFetch = useAuthFetch()
  const [alerts, setAlerts] = useState<AlertData[]>([])
  
  const [cityWeatherMap, setCityWeatherMap] = useState<Record<string, any>>({})
  const [currentCityIndex, setCurrentCityIndex] = useState(0)
  const [chartData] = useState(generateChartData)
  const [now, setNow] = useState(new Date())
  const [activeTab, setActiveTab] = useState("overview")

  const dashboardTabs = [
    { id: "overview", label: "Overview" },
    { id: "intelligence", label: "Intelligence & Threats" },
    { id: "performance", label: "System Performance" },
  ]

  const fetchWeather = useCallback(async () => {
    try {
      const results: Record<string, any> = {}
      await Promise.all(PAK_CITIES.map(async (city) => {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,visibility&timezone=auto`)
        const data = await res.json()
        if (data && data.current) {
          results[city.name] = {
            temperature: Math.round(data.current.temperature_2m),
            humidity: Math.round(data.current.relative_humidity_2m),
            windSpeed: Math.round(data.current.wind_speed_10m),
            visibility: Math.round((data.current.visibility || 10000) / 1000),
          }
        }
      }))
      setCityWeatherMap(results)
    } catch (err) {
      console.error('Failed to fetch weather', err)
    }
  }, [])

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await authFetch(`${API_URL}/api/alerts`)
      if (res.ok) {
        const data = await res.json()
        setAlerts(data)
      }
    } catch (err) {
      console.error('Failed to fetch alerts', err)
    }
  }, [authFetch])

  useEffect(() => {
    fetchWeather()
    fetchAlerts()
    
    const c = setInterval(() => setNow(new Date()), 1000)
    const rotate = setInterval(() => {
      setCurrentCityIndex(prev => (prev + 1) % PAK_CITIES.length)
    }, 5000)
    const w = setInterval(fetchWeather, 600000) // 10 min refresh
    const a = setInterval(fetchAlerts, 10000)   // 10 sec refresh for alerts
    
    return () => { clearInterval(c); clearInterval(rotate); clearInterval(w); clearInterval(a) }
  }, [fetchWeather, fetchAlerts])

  const currentCity = PAK_CITIES[currentCityIndex]
  const weather = cityWeatherMap[currentCity.name] || { temperature: 32, humidity: 45, windSpeed: 12, visibility: 10 }

  const stats = useMemo(() => [
    { label: 'Active Swarms', value: 3, icon: Bug, color: 'text-red-400', bg: 'bg-red-500/10', trend: '+1', trendUp: true },
    { label: 'Risk Zones', value: 7, icon: Shield, color: 'text-orange-400', bg: 'bg-orange-500/10', trend: '—', trendUp: false },
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
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
                Command Dashboard
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground mt-1">
                Real-time swarm intelligence · AI-powered risk assessment
              </p>
            </div>
            <div className="text-left sm:text-right">
              <div className="text-lg md:text-xl font-medium tabular-nums tracking-wider" style={{ fontFamily: "'Space Mono', monospace" }}>
                {now.toLocaleTimeString('en-US', { hour12: false })}
              </div>
              <div className="text-[11px] text-muted-foreground">
                {now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })} · PKT
              </div>
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <AnimatedTabs
              tabs={dashboardTabs}
              activeTab={activeTab}
              onChange={setActiveTab}
            />
            <Badge variant="outline" className="text-[10px] bg-background">
              LC-EWS v2.0
            </Badge>
          </div>

          {/* ━━━ TAB 1: OVERVIEW ━━━ */}
          {activeTab === "overview" && (
            <div className="space-y-6 mt-0 animate-in fade-in duration-300">
            {/* STATS ROW */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map(stat => {
                const Icon = stat.icon
                return (
                  <Tilt key={stat.label} rotationFactor={6}>
                    <Card className="group relative overflow-hidden bg-gradient-to-br from-background/80 to-muted/20 border-border/40 hover:border-border/80 transition-all duration-300 shadow-sm hover:shadow-md">
                      {/* Subdued Glow effect on hover */}
                      <div className={`absolute -inset-1 opacity-0 group-hover:opacity-10 transition-opacity duration-500 blur-2xl ${stat.bg.replace('/10', '')}`} />
                      
                      <CardContent className="p-5 relative z-10">
                        <div className="flex items-center justify-between mb-4">
                          <div className={`p-2.5 rounded-xl ${stat.bg} ring-1 ring-inset ring-foreground/5 shadow-inner transition-transform group-hover:scale-110 duration-300`}>
                            <Icon className={`h-5 w-5 ${stat.color}`} />
                          </div>
                          <Tooltip>
                            <TooltipTrigger>
                              <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold px-2 py-0.5 rounded-full ${stat.trendUp ? 'bg-red-500/10 text-red-400' : 'bg-muted text-muted-foreground'}`}>
                                {stat.trend}
                                {stat.trendUp && <ArrowUpRight className="h-3 w-3" />}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>Change since yesterday</TooltipContent>
                          </Tooltip>
                        </div>
                        <div className="mt-1">
                          <AnimateDigits value={String(stat.value)} className="text-3xl font-bold tracking-tight" />
                          <p className="text-sm font-medium text-muted-foreground mt-1 tracking-wide">{stat.label}</p>
                        </div>
                      </CardContent>
                      
                      {/* Gradient border line at bottom */}
                      <div className={`absolute bottom-0 left-0 right-0 h-[3px] opacity-60 group-hover:opacity-100 transition-opacity ${stat.bg.replace('/10', '')} bg-gradient-to-r from-transparent via-current to-transparent`} style={{ color: stat.color.replace('text-', '') }} />
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
                  {alerts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
                      <Shield className="h-8 w-8 mb-2 opacity-20" />
                      <p className="text-sm">No recent alerts</p>
                    </div>
                  ) : alerts.map(alert => {
                    const style = ALERT_STYLES[alert.type] || ALERT_STYLES.info
                    const timeStr = new Date(alert.created_at).toLocaleString('en-PK', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    })
                    return (
                      <div key={alert.id} className={`rounded-lg border p-3 ${style.bg} transition-colors hover:border-opacity-60`}>
                        <div className="flex items-start gap-2.5">
                          <div className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${style.dot}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-semibold truncate">{alert.title}</span>
                              <span className="text-[10px] text-muted-foreground whitespace-nowrap">{timeStr}</span>
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{alert.description}</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>

              {/* Weather */}
              <Card className="lg:col-span-1 group relative overflow-hidden bg-gradient-to-br from-background/80 to-muted/20 border border-border/40 hover:border-border/80 transition-all duration-300 shadow-sm hover:shadow-md">
                <div className="absolute -inset-1 opacity-0 group-hover:opacity-10 transition-opacity duration-500 blur-2xl bg-sky-500" />
                <CardHeader className="pb-3 relative z-10">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <span className="text-base">🌤️</span>
                      Weather & Conditions
                    </CardTitle>
                    <Tooltip>
                      <TooltipTrigger>
                        <Badge variant="outline" className="text-[10px] gap-1 bg-sky-500/10 text-sky-400 border-sky-500/20 shadow-sm">
                          <Clock className="h-2.5 w-2.5" />
                          Live Data
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>Open-Meteo Live API</TooltipContent>
                    </Tooltip>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 relative z-10">
                  <div className="space-y-4">
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
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground bg-muted/20 p-2 rounded-lg border border-border/30">
                      <AnimatePresence mode="wait">
                        <motion.span
                          key={currentCity.name}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          transition={{ duration: 0.2 }}
                          className="flex items-center gap-1.5 font-semibold text-foreground"
                        >
                          <MapPin className="h-3 w-3 text-sky-400" /> {currentCity.name}, PK
                        </motion.span>
                      </AnimatePresence>
                      <span>{now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </CardContent>
                <div className="absolute bottom-0 left-0 right-0 h-[3px] opacity-60 group-hover:opacity-100 transition-opacity bg-gradient-to-r from-transparent via-sky-500 to-transparent" />
              </Card>
            </div>
            </div>
          )}

          {/* ━━━ TAB 2: INTELLIGENCE & THREATS ━━━ */}
          {activeTab === "intelligence" && (
            <div className="space-y-6 mt-0 animate-in fade-in duration-300">
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
                    <Radar className="h-4 w-4 text-orange-400" />
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
                        className={`h-2 ${zone.status === 'critical' ? '[&>div]:bg-red-500' : zone.status === 'high' ? '[&>div]:bg-orange-500' : zone.status === 'medium' ? '[&>div]:bg-orange-500' : '[&>div]:bg-emerald-500'}`}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
            </div>
          )}

          {/* ━━━ TAB 3: SYSTEM PERFORMANCE ━━━ */}
          {activeTab === "performance" && (
            <div className="mt-0 animate-in fade-in duration-300">
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
                    { label: 'Uptime', value: '99.8%', sub: 'System', color: 'text-orange-400' },
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
            </div>
          )}

        </div>

      </div>
    </TooltipProvider>
  )
}
