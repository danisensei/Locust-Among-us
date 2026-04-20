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

  const droneData = [
    { id: 'DPP-Alpha', status: 'Active', battery: 85, mission: 'Khuzdar Survey', lastUpdated: '2 min ago' },
    { id: 'DPP-Beta', status: 'Active', battery: 72, mission: 'Quetta Patrol', lastUpdated: '1 min ago' },
    { id: 'DPP-Gamma', status: 'Charging', battery: 45, mission: 'Idle', lastUpdated: '5 min ago' },
    { id: 'DPP-Delta', status: 'Active', battery: 91, mission: 'Jacobabad Scan', lastUpdated: '3 min ago' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Drone Fleet Operations</h1>
        <p className="text-muted-foreground mt-2">Real-time fleet telemetry · Battery health · Mission status</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="hover:shadow-md transition-shadow duration-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border bg-accent/30">
          <CardTitle>Fleet Status</CardTitle>
          <CardDescription>All active drones</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border bg-muted/40 hover:bg-muted/50 transition-colors">
                <TableHead className="font-semibold text-foreground">Drone ID</TableHead>
                <TableHead className="font-semibold text-foreground">Status</TableHead>
                <TableHead className="font-semibold text-foreground">Battery</TableHead>
                <TableHead className="font-semibold text-foreground">Mission</TableHead>
                <TableHead className="font-semibold text-foreground">Last Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {droneData.map((drone) => (
                <TableRow 
                  key={drone.id}
                  className="border-b border-border hover:bg-accent/40 transition-colors duration-150 cursor-pointer"
                >
                  <TableCell className="font-semibold">{drone.id}</TableCell>
                  <TableCell>
                    <Badge 
                      className={`${
                        drone.status === 'Active' 
                          ? 'bg-green-500/20 text-green-700 hover:bg-green-500/30' 
                          : 'bg-yellow-500/20 text-yellow-700 hover:bg-yellow-500/30'
                      } transition-colors`}
                    >
                      {drone.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all"
                          style={{ width: `${drone.battery}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{drone.battery}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{drone.mission}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{drone.lastUpdated}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
