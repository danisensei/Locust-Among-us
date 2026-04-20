import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export default function FieldReports() {
  const reports = [
    { id: 'RPT-0482', observer: 'Khalid Ahmad', location: 'Khuzdar', status: 'Verified', time: '2h ago' },
    { id: 'RPT-0481', observer: 'Zainab Khan', location: 'Quetta', status: 'Verified', time: '3h ago' },
    { id: 'RPT-0480', observer: 'Ahmed Hassan', location: 'Jacobabad', status: 'Pending', time: '4h ago' },
    { id: 'RPT-0479', observer: 'Fatima Ali', location: 'D.I. Khan', status: 'Verified', time: '5h ago' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Field Reports</h1>
        <p className="text-muted-foreground mt-2">Observer submissions · AI verification · Crowd-sourced intelligence</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Reports</CardTitle>
          <CardDescription>Field observer submissions</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Report ID</TableHead>
                <TableHead>Observer</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.id}</TableCell>
                  <TableCell>{r.observer}</TableCell>
                  <TableCell>{r.location}</TableCell>
                  <TableCell>
                    <Badge variant={r.status === 'Verified' ? 'default' : 'secondary'}>
                      {r.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{r.time}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
