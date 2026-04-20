import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export default function Users() {
  const users = [
    { id: 1, name: 'Dr. Khalid Ahmad', role: 'Operations Lead', status: 'Online', email: 'khalid@dpp.gov.pk' },
    { id: 2, name: 'Fatima Khan', role: 'Field Coordinator', status: 'Online', email: 'fatima@dpp.gov.pk' },
    { id: 3, name: 'Ahmed Hassan', role: 'Drone Pilot', status: 'Offline', email: 'ahmed@dpp.gov.pk' },
    { id: 4, name: 'Zainab Ali', role: 'Data Analyst', status: 'Online', email: 'zainab@dpp.gov.pk' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Team Members</h1>
        <p className="text-muted-foreground mt-2">Department of Plant Protection — Locust Division · {users.filter(u => u.status === 'Online').length} online</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Team</CardTitle>
          <CardDescription>All authorized personnel</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>{u.name[0]}</AvatarFallback>
                    </Avatar>
                    {u.name}
                  </TableCell>
                  <TableCell>{u.role}</TableCell>
                  <TableCell className="text-muted-foreground">{u.email}</TableCell>
                  <TableCell>
                    <Badge variant={u.status === 'Online' ? 'default' : 'secondary'}>
                      {u.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
