import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export default function DroneOps() {
  const stats = [
    { label: 'Total Fleet', value: '12' },
    { label: 'On Mission', value: '4' },
    { label: 'Available', value: '7' },
    { label: 'Battery Avg', value: '76%' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Drone Fleet Operations</h1>
        <p className="text-muted-foreground mt-2">Real-time fleet telemetry · Battery health · Mission status</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">{s.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fleet Status</CardTitle>
          <CardDescription>All active drones</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Drone ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Battery</TableHead>
                <TableHead>Mission</TableHead>
                <TableHead>Last Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {['DPP-Alpha', 'DPP-Beta', 'DPP-Gamma', 'DPP-Delta'].map((drone) => (
                <TableRow key={drone}>
                  <TableCell className="font-medium">{drone}</TableCell>
                  <TableCell><Badge>Active</Badge></TableCell>
                  <TableCell>{Math.floor(Math.random() * 40 + 60)}%</TableCell>
                  <TableCell>Khuzdar Survey</TableCell>
                  <TableCell className="text-muted-foreground">{Math.floor(Math.random() * 5)} min ago</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
