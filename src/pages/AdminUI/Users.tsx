import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Loader2, Trash2, ShieldAlert, ShieldCheck, User2 } from 'lucide-react'
import { useAuth, useAuthFetch, API_URL } from '@/context/AuthContext'

interface UserRow {
  id:         number
  name:       string
  email:      string
  role:       string
  created_at: string
}

const ROLE_CONFIG: Record<string, { label: string; color: string; icon: typeof ShieldAlert }> = {
  admin:         { label: 'Admin',        color: 'bg-red-500/15 text-red-400 border-red-500/20',   icon: ShieldAlert },
  analyst:       { label: 'Analyst',      color: 'bg-blue-500/15 text-blue-400 border-blue-500/20', icon: ShieldCheck },
  field_officer: { label: 'Field Officer', color: 'bg-green-500/15 text-green-400 border-green-500/20', icon: User2 },
}

export default function Users() {
  const { user: me } = useAuth()
  const authFetch    = useAuthFetch()

  const [users,   setUsers]   = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)
  const [deleting, setDeleting] = useState<number | null>(null)

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const res = await authFetch(`${API_URL}/api/users`)
      if (!res.ok) throw new Error(`Failed to load users (${res.status})`)
      setUsers(await res.json())
      setError(null)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsers() }, [])

  const handleDelete = async (userId: number) => {
    if (!confirm('Remove this user from the system?')) return
    setDeleting(userId)
    try {
      const res = await authFetch(`${API_URL}/api/users/${userId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      setUsers(prev => prev.filter(u => u.id !== userId))
    } catch (e: any) {
      alert(e.message)
    } finally {
      setDeleting(null)
    }
  }

  const isAdmin  = me?.role === 'admin'
  const onlineCount = users.length   // all registered = "online" for now

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Members</h1>
          <p className="text-muted-foreground mt-2">
            Dept. of Plant Protection — Locust Division ·{' '}
            <span className="text-green-400 font-medium">{onlineCount} registered</span>
          </p>
        </div>
        {isAdmin && (
          <Badge className="bg-red-500/15 text-red-400 border border-red-500/20 text-xs px-3 py-1">
            Admin Mode
          </Badge>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4">
        {Object.entries(ROLE_CONFIG).map(([roleKey, cfg]) => {
          const count = users.filter(u => u.role === roleKey).length
          const Icon  = cfg.icon
          return (
            <Card key={roleKey} className={`border ${cfg.color.split(' ')[2]}`}>
              <CardContent className="pt-5 pb-4 flex items-center gap-3">
                <Icon className={`h-5 w-5 ${cfg.color.split(' ')[1]}`} />
                <div>
                  <p className="text-sm text-muted-foreground">{cfg.label}</p>
                  <p className="text-2xl font-bold">{count}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border bg-accent/20">
          <CardTitle>Authorized Personnel</CardTitle>
          <CardDescription>
            {loading ? 'Loading…' : error ? `⚠️ ${error}` : `${users.length} registered users`}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-3">
              <p className="text-red-400">{error}</p>
              <Button variant="outline" size="sm" onClick={fetchUsers}>Retry</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border bg-muted/40">
                  <TableHead className="font-semibold text-foreground">Name</TableHead>
                  <TableHead className="font-semibold text-foreground">Email</TableHead>
                  <TableHead className="font-semibold text-foreground">Role</TableHead>
                  <TableHead className="font-semibold text-foreground">Joined</TableHead>
                  {isAdmin && <TableHead className="font-semibold text-foreground w-12" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => {
                  const cfg  = ROLE_CONFIG[u.role] ?? ROLE_CONFIG.analyst
                  const Icon = cfg.icon
                  const isMe = u.id === me?.id
                  return (
                    <TableRow
                      key={u.id}
                      className={`border-b border-border hover:bg-accent/40 transition-colors duration-150 ${isMe ? 'bg-orange-500/5' : ''}`}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs bg-accent">
                              {u.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-sm">
                            {u.name}{isMe && <span className="ml-2 text-xs text-orange-400">(you)</span>}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">{u.email}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-medium ${cfg.color}`}>
                          <Icon className="h-3 w-3" />
                          {cfg.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(u.created_at).toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </TableCell>
                      {isAdmin && (
                        <TableCell>
                          {!isMe && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(u.id)}
                              disabled={deleting === u.id}
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            >
                              {deleting === u.id
                                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                : <Trash2 className="h-3.5 w-3.5" />
                              }
                            </Button>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
