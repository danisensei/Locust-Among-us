import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Loader2, Trash2, ShieldAlert, ShieldCheck, User2, Search, Users as UsersIcon, RefreshCw } from 'lucide-react'
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
  
  // Dialog state
  const [deleting, setDeleting] = useState<number | null>(null)
  const [userToDelete, setUserToDelete] = useState<UserRow | null>(null)

  // Filters & Search
  const [filter, setFilter] = useState<'all' | 'admin' | 'analyst' | 'field_officer'>('all')
  const [search, setSearch] = useState('')

  const fetchUsers = useCallback(async () => {
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
  }, [authFetch])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const handleDelete = async (userId: number) => {
    setDeleting(userId)
    try {
      const res = await authFetch(`${API_URL}/api/users/${userId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      setUsers(prev => prev.filter(u => u.id !== userId))
      setUserToDelete(null)
    } catch (e: any) {
      alert(e.message)
    } finally {
      setDeleting(null)
    }
  }

  const isAdmin  = me?.role === 'admin'
  const onlineCount = users.length

  // Filtered Users
  const filteredUsers = users.filter(u => {
    const matchesFilter = filter === 'all' || u.role === filter
    const searchLower = search.toLowerCase()
    const matchesSearch =
      u.name.toLowerCase().includes(searchLower) ||
      u.email.toLowerCase().includes(searchLower) ||
      u.role.toLowerCase().includes(searchLower)
    return matchesFilter && matchesSearch
  })

  const adminCount = users.filter(u => u.role === 'admin').length
  const analystCount = users.filter(u => u.role === 'analyst').length
  const fieldOfficerCount = users.filter(u => u.role === 'field_officer').length

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent drop-shadow-sm font-['Outfit']">
            User Directory
          </h1>
          <p className="text-muted-foreground mt-1 font-medium">
            Manage system access and team roles · <span className="text-green-400">{onlineCount} registered</span>
          </p>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-3">
            <Badge className="bg-red-500/15 text-red-400 border border-red-500/20 text-xs px-3 py-1">
              Admin Mode
            </Badge>
          </div>
        )}
      </div>

      {/* Modern Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div 
          onClick={() => setFilter('all')}
          className={`p-5 rounded-2xl border transition-all duration-300 cursor-pointer group relative overflow-hidden ${filter === 'all' ? 'bg-sky-500/10 border-sky-500/50 shadow-[0_0_30px_-5px_rgba(14,165,233,0.15)]' : 'bg-gradient-to-br from-background to-muted/20 border-border/50 hover:border-sky-500/30'}`}
        >
          <div className="absolute -right-4 -top-4 p-6 bg-sky-500/5 rounded-full group-hover:bg-sky-500/10 transition-colors">
            <UsersIcon className="h-8 w-8 text-sky-500/40" />
          </div>
          <p className="text-sm font-semibold text-muted-foreground mb-1">Total Users</p>
          <p className={`text-3xl font-bold font-['Outfit'] ${filter === 'all' ? 'text-sky-400' : 'text-foreground'}`}>{users.length}</p>
        </div>
        
        <div 
          onClick={() => setFilter('admin')}
          className={`p-5 rounded-2xl border transition-all duration-300 cursor-pointer group relative overflow-hidden ${filter === 'admin' ? 'bg-rose-500/10 border-rose-500/50 shadow-[0_0_30px_-5px_rgba(244,63,94,0.15)]' : 'bg-gradient-to-br from-background to-muted/20 border-border/50 hover:border-rose-500/30'}`}
        >
          <div className="absolute -right-4 -top-4 p-6 bg-rose-500/5 rounded-full group-hover:bg-rose-500/10 transition-colors">
            <ShieldAlert className="h-8 w-8 text-rose-500/40" />
          </div>
          <p className="text-sm font-semibold text-muted-foreground mb-1">Administrators</p>
          <p className={`text-3xl font-bold font-['Outfit'] ${filter === 'admin' ? 'text-rose-400' : 'text-foreground'}`}>{adminCount}</p>
        </div>

        <div 
          onClick={() => setFilter('analyst')}
          className={`p-5 rounded-2xl border transition-all duration-300 cursor-pointer group relative overflow-hidden ${filter === 'analyst' ? 'bg-blue-500/10 border-blue-500/50 shadow-[0_0_30px_-5px_rgba(59,130,246,0.15)]' : 'bg-gradient-to-br from-background to-muted/20 border-border/50 hover:border-blue-500/30'}`}
        >
          <div className="absolute -right-4 -top-4 p-6 bg-blue-500/5 rounded-full group-hover:bg-blue-500/10 transition-colors">
            <ShieldCheck className="h-8 w-8 text-blue-500/40" />
          </div>
          <p className="text-sm font-semibold text-muted-foreground mb-1">Analysts</p>
          <p className={`text-3xl font-bold font-['Outfit'] ${filter === 'analyst' ? 'text-blue-400' : 'text-foreground'}`}>{analystCount}</p>
        </div>

        <div 
          onClick={() => setFilter('field_officer')}
          className={`p-5 rounded-2xl border transition-all duration-300 cursor-pointer group relative overflow-hidden ${filter === 'field_officer' ? 'bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_30px_-5px_rgba(16,185,129,0.15)]' : 'bg-gradient-to-br from-background to-muted/20 border-border/50 hover:border-emerald-500/30'}`}
        >
          <div className="absolute -right-4 -top-4 p-6 bg-emerald-500/5 rounded-full group-hover:bg-emerald-500/10 transition-colors">
            <User2 className="h-8 w-8 text-emerald-500/40" />
          </div>
          <p className="text-sm font-semibold text-muted-foreground mb-1">Field Officers</p>
          <p className={`text-3xl font-bold font-['Outfit'] ${filter === 'field_officer' ? 'text-emerald-400' : 'text-foreground'}`}>{fieldOfficerCount}</p>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search users by name, email, or role..." 
            className="pl-10 bg-background/50 backdrop-blur-sm border-border/50 focus:border-sky-500/50 transition-colors h-11 rounded-xl"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button 
          type="button" 
          onClick={fetchUsers} 
          disabled={loading} 
          className="w-full sm:w-auto gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 shadow-lg shadow-emerald-500/20 transition-all font-medium rounded-xl h-11"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh Directory
        </Button>
      </div>

      {/* Glassmorphism Table Container */}
      <Card className="bg-card/40 backdrop-blur-xl border border-border/50 shadow-2xl rounded-2xl overflow-hidden">
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
              <p className="text-sm text-muted-foreground">Loading directory...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground gap-4 bg-red-500/5">
              <ShieldAlert className="h-10 w-10 text-red-400/50" />
              <p className="text-red-400 font-medium">{error}</p>
              <Button variant="outline" onClick={fetchUsers} className="rounded-xl">Retry Connection</Button>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground gap-3">
              <Search className="h-10 w-10 text-muted-foreground/30 mb-2" />
              <p className="font-medium text-foreground">No users found</p>
              <p className="text-sm">Try adjusting your search or role filters.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border/50 bg-muted/20 hover:bg-muted/20">
                  <TableHead className="font-bold text-[11px] uppercase tracking-wider text-muted-foreground h-12">Name</TableHead>
                  <TableHead className="font-bold text-[11px] uppercase tracking-wider text-muted-foreground h-12">Email</TableHead>
                  <TableHead className="font-bold text-[11px] uppercase tracking-wider text-muted-foreground h-12">Role</TableHead>
                  <TableHead className="font-bold text-[11px] uppercase tracking-wider text-muted-foreground h-12">Joined</TableHead>
                  {isAdmin && <TableHead className="w-12 h-12" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((u) => {
                  const cfg  = ROLE_CONFIG[u.role] ?? ROLE_CONFIG.analyst
                  const Icon = cfg.icon
                  const isMe = u.id === me?.id
                  return (
                    <TableRow
                      key={u.id}
                      className={`border-b border-border/50 hover:bg-accent/30 transition-all duration-200 ${isMe ? 'bg-orange-500/5' : ''}`}
                    >
                      <TableCell className="py-4">
                        <div className="flex items-center gap-3">
                          <Avatar className={`h-9 w-9 border border-border/50 shadow-sm ${isMe ? 'ring-2 ring-orange-500/30' : ''}`}>
                            <AvatarFallback className="text-xs bg-gradient-to-br from-muted to-muted/50 font-medium">
                              {u.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-semibold text-sm text-foreground">
                            {u.name}{isMe && <span className="ml-2 text-[10px] font-bold tracking-wider uppercase text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full">You</span>}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm font-medium">{u.email}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border shadow-sm font-semibold tracking-wide ${cfg.color}`}>
                          <Icon className="h-3.5 w-3.5" />
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
                              onClick={() => setUserToDelete(u)}
                              disabled={deleting === u.id}
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-red-400 hover:bg-red-500/15 rounded-full transition-all"
                            >
                              {deleting === u.id
                                ? <Loader2 className="h-4 w-4 animate-spin" />
                                : <Trash2 className="h-4 w-4" />
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

      {/* Delete Dialog */}
      <Dialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <DialogContent className="sm:max-w-[425px] border-border/50 bg-card/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-red-400 flex items-center gap-2">
              <ShieldAlert className="h-5 w-5" />
              Remove User
            </DialogTitle>
            <DialogDescription className="pt-2">
              Are you sure you want to remove <span className="font-semibold text-foreground">{userToDelete?.name}</span> from the system? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setUserToDelete(null)} disabled={deleting === userToDelete?.id} className="rounded-xl">
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => userToDelete && handleDelete(userToDelete.id)} disabled={deleting === userToDelete?.id} className="rounded-xl">
              {deleting === userToDelete?.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Remove Access
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
