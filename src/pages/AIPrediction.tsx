import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useState } from 'react'

export default function AIPrediction() {
  const [selectedRange, setSelectedRange] = useState('4d')

  const forecast = [
    { day: 'Today', risk: 87 },
    { day: 'Tomorrow', risk: 72 },
    { day: 'Day 3', risk: 65 },
    { day: 'Day 4', risk: 58 },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Risk Prediction</h1>
        <p className="text-muted-foreground mt-2">Machine learning forecast · 72-hour risk horizon · ARIMA + Random Forest ensemble</p>
      </div>

      <div className="flex gap-2">
        <Button variant={selectedRange === '24h' ? 'default' : 'outline'} onClick={() => setSelectedRange('24h')}>24 Hours</Button>
        <Button variant={selectedRange === '4d' ? 'default' : 'outline'} onClick={() => setSelectedRange('4d')}>4 Days</Button>
        <Button variant={selectedRange === '8d' ? 'default' : 'outline'} onClick={() => setSelectedRange('8d')}>8 Days</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {forecast.map((f) => (
          <Card key={f.day}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">{f.day}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{f.risk}%</div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-3">
                <div className="bg-orange-600 h-2 rounded-full" style={{ width: `${f.risk}%` }}></div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Risk Level</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>8-Day Forecast</CardTitle>
          <CardDescription>Daily risk predictions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-8 gap-2">
            {Array.from({ length: 8 }).map((_, i) => {
              const risk = Math.floor(Math.random() * 100)
              return (
                <div key={i} className="p-3 border rounded text-center">
                  <p className="text-xs text-muted-foreground mb-2">Day {i + 1}</p>
                  <p className="font-bold">{risk}%</p>
                  <Badge className="mt-2" variant={risk > 70 ? 'destructive' : 'secondary'}>
                    {risk > 70 ? 'High' : 'Low'}
                  </Badge>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
