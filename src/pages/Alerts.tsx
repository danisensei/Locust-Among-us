import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'
import { useState } from 'react'

export default function Alerts() {
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([])

  const alerts = [
    { id: 1, type: 'critical', title: 'CRITICAL: Massive Swarm — Balochistan', desc: '2.8M locusts detected', time: '08:42 PKT' },
    { id: 2, type: 'warning', title: 'HIGH: Wind Alert — Jacobabad', desc: 'Wind speeds 40 km/h, migration risk', time: '07:15 PKT' },
    { id: 3, type: 'info', title: 'INFO: Drone mission — Complete', desc: 'DPP-Alpha completed 180 ha survey', time: '06:30 PKT' },
  ]

  const handleDismiss = (id: number) => {
    setDismissedAlerts([...dismissedAlerts, String(id)])
  }

  const filtered = alerts.filter(a => !dismissedAlerts.includes(String(a.id)))

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Alerts Management</h1>
        <p className="text-muted-foreground mt-2">Real-time event notification center · {filtered.length} active</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Critical</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">1</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Warnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">2</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Info</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">1</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Alert Stream</CardTitle>
          <CardDescription>Newest first</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {filtered.map((a) => (
            <Alert key={a.id} variant={a.type === 'critical' ? 'destructive' : 'default'}>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{a.title}</AlertTitle>
              <AlertDescription className="mt-2 flex justify-between items-center">
                <span>{a.desc}</span>
                <div className="flex gap-2">
                  <span className="text-xs">{a.time}</span>
                  <Button size="sm" variant="ghost" onClick={() => handleDismiss(a.id)}>Dismiss</Button>
                </div>
              </AlertDescription>
            </Alert>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
