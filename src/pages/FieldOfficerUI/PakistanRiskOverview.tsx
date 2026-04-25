import React, { useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Layers, MapPin, TrendingUp } from 'lucide-react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
// @ts-ignore
import { MarkerClusterGroup } from 'leaflet.markercluster'
// @ts-ignore
import 'leaflet.heat'

// Pakistan Bounds & Risk Zones
const PAKISTAN_BOUNDS = {
  north: 37.5,
  south: 23.6,
  east: 77.8,
  west: 60.9,
}

const RISK_ZONES = [
  {
    name: 'Khuzdar Valley',
    coords: [27.81, 66.63],
    area: 'Eastern Balochistan',
    risk: 'CRITICAL',
    color: '#dc2626',
    swarms: 3,
    intensity: 95,
  },
  {
    name: 'Jacobabad Plains',
    coords: [28.27, 68.46],
    area: 'Lower Sindh',
    risk: 'HIGH',
    color: '#ea580c',
    swarms: 2,
    intensity: 78,
  },
  {
    name: 'Dera Ghazi Khan',
    coords: [29.76, 70.63],
    area: 'Southern Punjab',
    risk: 'HIGH',
    color: '#ea580c',
    swarms: 1,
    intensity: 65,
  },
  {
    name: 'Thar Desert',
    coords: [27.02, 71.1],
    area: 'Sindh Border',
    risk: 'MEDIUM',
    color: '#eab308',
    swarms: 1,
    intensity: 45,
  },
  {
    name: 'Cholistan Desert',
    coords: [29.4, 73.0],
    area: 'Bahawalpur',
    risk: 'MEDIUM',
    color: '#eab308',
    swarms: 0,
    intensity: 38,
  },
]

interface HeatPoint {
  lat: number
  lon: number
  intensity: number
}

export default function PakistanRiskOverview() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markersRef = useRef<any>(null)
  const heatLayerRef = useRef<L.Layer | null>(null)
  const [activeRiskZone, setActiveRiskZone] = useState<string | null>(null)
  const [stats, setStats] = useState({
    totalRiskZones: RISK_ZONES.length,
    criticalZones: RISK_ZONES.filter(z => z.risk === 'CRITICAL').length,
    totalSwarms: RISK_ZONES.reduce((sum, z) => sum + z.swarms, 0),
    avgIntensity: Math.round(RISK_ZONES.reduce((sum, z) => sum + z.intensity, 0) / RISK_ZONES.length),
  })

  useEffect(() => {
    if (!mapRef.current) return

    // Initialize Leaflet Map
    const map = L.map(mapRef.current).setView([30.2, 69.3], 6)

    // Layer 1: OpenStreetMap Tiles (Base Layer)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18,
      className: 'map-tiles',
    }).addTo(map)

    // Layer 2: Terrain-Aware Hillshade (Optional - shows elevation)
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Terrain_Base/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri',
      maxZoom: 13,
      opacity: 0.3,
      className: 'terrain-layer',
    }).addTo(map)

    // Layer 3: Prepare Marker Cluster Group (for swarm markers)
    const markerClusterGroup = new (MarkerClusterGroup || (L as any).MarkerClusterGroup)({
      maxClusterRadius: 80,
      iconCreateFunction: (cluster: any) => {
        const count = cluster.getChildCount()
        const size = count > 100 ? 'large' : count > 50 ? 'medium' : 'small'
        const radius = size === 'large' ? 40 : size === 'medium' ? 30 : 25
        return L.divIcon({
          html: `<div style="background-color: #dc2626; color: white; border-radius: 50%; width: ${radius}px; height: ${radius}px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">${count}</div>`,
          className: 'cluster-icon',
          iconSize: [radius, radius],
        })
      },
    })
    map.addLayer(markerClusterGroup)
    markersRef.current = markerClusterGroup

    // Layer 4: Add Risk Zone Markers (GeoJSON-style points)
    RISK_ZONES.forEach((zone) => {
      const marker = L.circleMarker([zone.coords[0], zone.coords[1]], {
        radius: zone.intensity / 20,
        fillColor: zone.color,
        color: '#fff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.7,
        className: `risk-marker risk-${zone.risk.toLowerCase()}`,
      })

      marker.bindPopup(`
        <div style="font-family: system-ui; font-size: 12px;">
          <strong style="font-size: 14px;">${zone.name}</strong><br/>
          <span style="color: #666;">${zone.area}</span><br/>
          <br/>
          <strong>Risk Level:</strong> <span style="color: ${zone.color}; font-weight: bold;">${zone.risk}</span><br/>
          <strong>Intensity:</strong> ${zone.intensity}%<br/>
          <strong>Active Swarms:</strong> ${zone.swarms}<br/>
          <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #ddd; font-size: 11px; color: #888;">
            Last updated: ${new Date().toLocaleTimeString('en-PK')}
          </div>
        </div>
      `)

      marker.on('click', () => setActiveRiskZone(zone.name))
      markerClusterGroup.addLayer(marker)
    })

    // Layer 5: Heat Layer (Risk Intensity Heatmap)
    const heatData: HeatPoint[] = RISK_ZONES.map((zone) => ({
      lat: zone.coords[0],
      lon: zone.coords[1],
      intensity: zone.intensity / 100,
    }))

    // @ts-ignore
    const heatLayer = L.heatLayer(
      heatData.map((p) => [p.lat, p.lon, p.intensity]),
      {
        radius: 60,
        blur: 20,
        maxZoom: 12,
        max: 1.0,
        gradient: {
          0.0: '#0047ab',
          0.25: '#00d4ff',
          0.5: '#ffff00',
          0.75: '#ff7f00',
          1.0: '#8b0000',
        },
        minOpacity: 0.2,
      }
    )
    heatLayer.addTo(map)
    heatLayerRef.current = heatLayer

    // Layer 6: GeoJSON Risk Zone Boundaries (Optional polygons)
    const riskPolygons = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [66.5, 27.7],
                [67.2, 27.5],
                [67.5, 28.2],
                [66.8, 28.4],
                [66.5, 27.7],
              ],
            ],
          },
          properties: { name: 'Khuzdar Valley Buffer', risk: 'CRITICAL' },
        },
      ],
    }

    L.geoJSON(riskPolygons as any, {
      style: {
        color: '#dc2626',
        weight: 2,
        opacity: 0.3,
        fillOpacity: 0.1,
      },
    }).addTo(map)

    // Layer Control (Toggle between layers)
    const layerControl = L.control.layers(
      {
        'OpenStreetMap': L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
        }),
        'Satellite': L.tileLayer(
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          { attribution: 'Tiles &copy; Esri' }
        ),
      },
      {
        'Risk Heatmap': heatLayer,
        'Zone Boundaries': L.geoJSON(riskPolygons as any),
        'Swarm Clusters': markerClusterGroup,
      },
      { position: 'topright' }
    )
    layerControl.addTo(map)

    mapInstanceRef.current = map

    return () => {
      map.remove()
    }
  }, [])

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-2">
          <MapPin className="h-8 w-8 text-red-400" />
          Pakistan Risk Overview
        </h2>
        <p className="text-muted-foreground">Real-time locust swarm risk distribution across Pakistan</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/25">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-300 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Critical Zones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-400">{stats.criticalZones}</div>
            <p className="text-xs text-red-300 mt-1">Immediate action required</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/25">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-300">Risk Zones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-300">{stats.totalRiskZones}</div>
            <p className="text-xs text-orange-300 mt-1">Under monitoring</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-violet-500/10 to-violet-500/5 border-violet-500/25">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-violet-300">Active Swarms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-violet-300">{stats.totalSwarms}</div>
            <p className="text-xs text-violet-300 mt-1">Detected in field</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-sky-500/10 to-sky-500/5 border-sky-500/25">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-sky-300 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Avg Intensity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-sky-300">{stats.avgIntensity}%</div>
            <p className="text-xs text-sky-300 mt-1">Risk distribution</p>
          </CardContent>
        </Card>
      </div>

      {/* Map Container */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 text-foreground pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5" />
              <CardTitle className="text-foreground">GIS Risk Visualization</CardTitle>
            </div>
            <div className="flex gap-2">
              <Badge variant="secondary" className="bg-white/10 text-foreground border-white/20">
                OpenStreetMap + Terrain
              </Badge>
              <Badge variant="secondary" className="bg-white/10 text-foreground border-white/20">
                leaflet.heat
              </Badge>
              <Badge variant="secondary" className="bg-white/10 text-foreground border-white/20">
                MarkerCluster
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div ref={mapRef} className="w-full h-96 md:h-[500px] lg:h-[600px] bg-slate-800" />
        </CardContent>
      </Card>

      {/* Risk Zones List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-400" />
            Active Risk Zones
          </CardTitle>
          <CardDescription>Click any zone on the map to highlight here</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {RISK_ZONES.map((zone) => (
              <div
                key={zone.name}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  activeRiskZone === zone.name
                    ? 'border-sky-500 bg-sky-500/10 shadow-lg'
                    : 'border-l-4 bg-muted/40 hover:bg-muted/60'
                }`}
                style={{
                  borderLeftColor: activeRiskZone === zone.name ? '#38bdf8' : zone.color,
                  borderLeftWidth: '4px',
                }}
                onClick={() => setActiveRiskZone(zone.name)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-bold text-sm">{zone.name}</h4>
                    <p className="text-xs text-muted-foreground">{zone.area}</p>
                  </div>
                  <Badge
                    variant={
                      zone.risk === 'CRITICAL'
                        ? 'destructive'
                        : zone.risk === 'HIGH'
                          ? 'default'
                          : 'secondary'
                    }
                  >
                    {zone.risk}
                  </Badge>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Intensity:</span>
                    <span className="font-semibold">{zone.intensity}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Swarms:</span>
                    <span className="font-semibold">{zone.swarms}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 mt-2">
                    <div
                      className="bg-gradient-to-r from-yellow-400 to-red-600 h-2 rounded-full"
                      style={{ width: `${zone.intensity}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Info Box */}
      <Card className="bg-sky-500/10 border-sky-500/20">
        <CardHeader>
          <CardTitle className="text-sm">📊 What You're Seeing</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2 text-sky-100">
          <p>
            <strong>OpenStreetMap Tiles:</strong> Base geographic layer showing Pakistan terrain and cities
          </p>
          <p>
            <strong>Terrain Layer:</strong> Esri hillshade overlay showing elevation (disabled by default)
          </p>
          <p>
            <strong>leaflet.heat:</strong> Color gradient from blue (low risk) → yellow → red (critical) showing intensity distribution
          </p>
          <p>
            <strong>MarkerCluster:</strong> Red numbered clusters that expand when you zoom in to show individual swarms
          </p>
          <p>
            <strong>GeoJSON Boundaries:</strong> Semi-transparent zones marking high-risk areas
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
