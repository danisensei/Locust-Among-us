import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CheckCircle2, Clock } from 'lucide-react'

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

      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border bg-accent/30">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Reports</CardTitle>
              <CardDescription>Field observer submissions</CardDescription>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className="text-xs">Total: {reports.length}</Badge>
              <Badge className="bg-green-500/15 text-green-300 text-xs">Verified: {reports.filter(r => r.status === 'Verified').length}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border bg-muted/40 hover:bg-muted/50 transition-colors">
                <TableHead className="font-semibold text-foreground">Report ID</TableHead>
                <TableHead className="font-semibold text-foreground">Observer</TableHead>
                <TableHead className="font-semibold text-foreground">Location</TableHead>
                <TableHead className="font-semibold text-foreground">Status</TableHead>
                <TableHead className="font-semibold text-foreground">Submitted</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((r) => (
                <TableRow 
                  key={r.id}
                  className="border-b border-border hover:bg-accent/40 transition-colors duration-150 cursor-pointer"
                >
                  <TableCell className="font-semibold text-sm">{r.id}</TableCell>
                  <TableCell className="font-medium">{r.observer}</TableCell>
                  <TableCell className="text-sm">{r.location}</TableCell>
                  <TableCell>
                    {r.status === 'Verified' ? (
                      <Badge className="bg-green-500/15 text-green-300 hover:bg-green-500/25 transition-colors flex items-center gap-1 w-fit">
                        <CheckCircle2 className="h-3 w-3" />
                        {r.status}
                      </Badge>
                    ) : (
                      <Badge className="bg-yellow-500/15 text-yellow-200 hover:bg-yellow-500/25 transition-colors flex items-center gap-1 w-fit">
                        <Clock className="h-3 w-3" />
                        {r.status}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{r.time}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
