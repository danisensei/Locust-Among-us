import { useState, useEffect, useCallback } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import {
  CheckCircle2, Clock, XCircle, Eye, Loader2, MapPin, MessageSquare, Trash2, AlertTriangle, FileText, Search, Activity, ShieldAlert, CheckSquare, RefreshCw 
} from 'lucide-react'
import { useAuthFetch, API_URL } from '@/context/AuthContext'

// ── Types ────────────────────────────────────────────────────
interface ReportData {
  id: number
  report_id: string
  observer_name: string
  zone: string
  risk_level: string
  estimated_size: string | null
  description: string
  status: string
  lat: number | null
  lon: number | null
  reviewer_feedback: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
}

// ── Main Component ───────────────────────────────────────────
export default function FieldReports() {
  const authFetch = useAuthFetch()

  const [reports, setReports] = useState<ReportData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Detail dialog
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailReport, setDetailReport] = useState<ReportData | null>(null)

  // Delete confirmation dialog
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<ReportData | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // Filter
  const [filter, setFilter] = useState<'all' | 'Pending' | 'Verified' | 'Rejected'>('all')

  // ── Fetch reports ──────────────────────────────────────────
  const fetchReports = useCallback(async () => {
    try {
      setLoading(true)
      const res = await authFetch(`${API_URL}/api/reports`)
      if (!res.ok) throw new Error(`Failed (${res.status})`)
      setReports(await res.json())
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reports')
    } finally {
      setLoading(false)
    }
  }, [authFetch])

  useEffect(() => { fetchReports() }, [fetchReports])

  // ── Delete handler ─────────────────────────────────────────
  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return
    try {
      setDeleting(true)
      setDeleteError(null)
      const res = await authFetch(`${API_URL}/api/reports/${deleteTarget.report_id}`, { method: 'DELETE' })
      if (!res.ok) {
        const body = await res.json().catch(() => ({ detail: `Failed (${res.status})` }))
        throw new Error(body.detail || `Failed (${res.status})`)
      }
      setDeleteOpen(false)
      setDeleteTarget(null)
      if (detailReport?.report_id === deleteTarget.report_id) {
        setDetailOpen(false)
        setDetailReport(null)
      }
      fetchReports()
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Delete failed')
    } finally {
      setDeleting(false)
    }
  }, [deleteTarget, authFetch, detailReport, fetchReports])

  // ── Helpers ────────────────────────────────────────────────
  const formatTime = (iso: string) => {
    const d = new Date(iso)
    const now = new Date()
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000)
    if (diff < 60) return 'Just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  }

  const riskBadgeColor = (risk: string) => {
    switch (risk) {
      case 'Critical': return 'bg-red-500/15 text-red-400 border-red-500/20'
      case 'High':     return 'bg-orange-500/15 text-orange-400 border-orange-500/20'
      case 'Medium':   return 'bg-yellow-500/15 text-yellow-300 border-yellow-500/20'
      case 'Low':      return 'bg-green-500/15 text-green-400 border-green-500/20'
      default:         return 'bg-muted text-muted-foreground border-border'
    }
  }

  const statusIcon = (status: string) => {
    switch (status) {
      case 'Verified': return <CheckCircle2 className="h-4 w-4 text-green-400" />
      case 'Rejected': return <XCircle className="h-4 w-4 text-red-400" />
      default:         return <Clock className="h-4 w-4 text-orange-400" />
    }
  }

  const filteredReports = filter === 'all' ? reports : reports.filter(r => r.status === filter)
  const pendingCount = reports.filter(r => r.status === 'Pending').length
  const verifiedCount = reports.filter(r => r.status === 'Verified').length
  const rejectedCount = reports.filter(r => r.status === 'Rejected').length

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent drop-shadow-sm font-['Outfit']">
            Field Reports
          </h1>
          <p className="text-muted-foreground mt-1 font-medium">
            Monitor and manage field observations · <span className="text-orange-400">{pendingCount} pending</span> · <span className="text-green-400">{verifiedCount} verified</span>
          </p>
        </div>
        <Button type="button" onClick={fetchReports} disabled={loading} className="gap-2 bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 shadow-lg shadow-sky-500/20 transition-all font-medium">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh Database
        </Button>
      </div>

      {/* Modern Stats Blocks */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div 
          onClick={() => setFilter('all')}
          className={`p-5 rounded-2xl border transition-all duration-300 cursor-pointer group relative overflow-hidden ${filter === 'all' ? 'bg-sky-500/10 border-sky-500/50 shadow-[0_0_30px_-5px_rgba(14,165,233,0.15)]' : 'bg-gradient-to-br from-background to-muted/20 border-border/50 hover:border-sky-500/30'}`}
        >
          <div className="absolute -right-4 -top-4 p-6 bg-sky-500/5 rounded-full group-hover:bg-sky-500/10 transition-colors">
            <FileText className="h-8 w-8 text-sky-500/40" />
          </div>
          <p className="text-sm font-semibold text-muted-foreground mb-1">Total Reports</p>
          <p className={`text-3xl font-bold font-['Outfit'] ${filter === 'all' ? 'text-sky-400' : 'text-foreground'}`}>{reports.length}</p>
        </div>
        
        <div 
          onClick={() => setFilter('Pending')}
          className={`p-5 rounded-2xl border transition-all duration-300 cursor-pointer group relative overflow-hidden ${filter === 'Pending' ? 'bg-orange-500/10 border-orange-500/50 shadow-[0_0_30px_-5px_rgba(245,158,11,0.15)]' : 'bg-gradient-to-br from-background to-muted/20 border-border/50 hover:border-orange-500/30'}`}
        >
          <div className="absolute -right-4 -top-4 p-6 bg-orange-500/5 rounded-full group-hover:bg-orange-500/10 transition-colors">
            <Clock className="h-8 w-8 text-orange-500/40" />
          </div>
          <p className="text-sm font-semibold text-muted-foreground mb-1">Pending Review</p>
          <p className={`text-3xl font-bold font-['Outfit'] ${filter === 'Pending' ? 'text-orange-400' : 'text-foreground'}`}>{pendingCount}</p>
        </div>

        <div 
          onClick={() => setFilter('Verified')}
          className={`p-5 rounded-2xl border transition-all duration-300 cursor-pointer group relative overflow-hidden ${filter === 'Verified' ? 'bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_30px_-5px_rgba(16,185,129,0.15)]' : 'bg-gradient-to-br from-background to-muted/20 border-border/50 hover:border-emerald-500/30'}`}
        >
          <div className="absolute -right-4 -top-4 p-6 bg-emerald-500/5 rounded-full group-hover:bg-emerald-500/10 transition-colors">
            <CheckSquare className="h-8 w-8 text-emerald-500/40" />
          </div>
          <p className="text-sm font-semibold text-muted-foreground mb-1">Verified</p>
          <p className={`text-3xl font-bold font-['Outfit'] ${filter === 'Verified' ? 'text-emerald-400' : 'text-foreground'}`}>{verifiedCount}</p>
        </div>

        <div 
          onClick={() => setFilter('Rejected')}
          className={`p-5 rounded-2xl border transition-all duration-300 cursor-pointer group relative overflow-hidden ${filter === 'Rejected' ? 'bg-rose-500/10 border-rose-500/50 shadow-[0_0_30px_-5px_rgba(244,63,94,0.15)]' : 'bg-gradient-to-br from-background to-muted/20 border-border/50 hover:border-rose-500/30'}`}
        >
          <div className="absolute -right-4 -top-4 p-6 bg-rose-500/5 rounded-full group-hover:bg-rose-500/10 transition-colors">
            <ShieldAlert className="h-8 w-8 text-rose-500/40" />
          </div>
          <p className="text-sm font-semibold text-muted-foreground mb-1">Rejected</p>
          <p className={`text-3xl font-bold font-['Outfit'] ${filter === 'Rejected' ? 'text-rose-400' : 'text-foreground'}`}>{rejectedCount}</p>
        </div>
      </div>

      {/* Main Reports List */}
      <div className="rounded-2xl border border-border/50 bg-background/50 backdrop-blur-xl overflow-hidden shadow-xl flex flex-col">
        <div className="p-4 border-b border-border/50 bg-muted/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-500/20 rounded-lg">
              <Search className="h-4 w-4 text-indigo-400" />
            </div>
            <h2 className="font-semibold font-['Outfit'] text-lg">Field Reports Inbox</h2>
            {filter !== 'all' && (
              <Badge variant="outline" className="ml-2 bg-background border-border/50 text-muted-foreground cursor-pointer hover:bg-muted" onClick={() => setFilter('all')}>
                {filter} <XCircle className="h-3 w-3 ml-1" />
              </Badge>
            )}
          </div>
        </div>

        <div className="bg-muted/10 grid grid-cols-[120px_1fr_120px_140px_140px] gap-4 px-8 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border/50">
          <div>Report ID</div>
          <div>Observer / Zone</div>
          <div>Risk Level</div>
          <div>Status</div>
          <div className="text-right">Submitted</div>
        </div>

        <ScrollArea className="h-[400px]">
          {error ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-rose-400">
              <AlertTriangle className="h-10 w-10 mb-3 opacity-80" />
              <p className="font-medium">{error}</p>
            </div>
          ) : (loading && reports.length === 0) ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mb-3 text-sky-500" />
              <p className="text-sm font-medium">Loading reports database...</p>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-12 text-muted-foreground text-center">
              <div className="p-4 bg-muted/20 rounded-full mb-4">
                <FileText className="h-8 w-8 opacity-50" />
              </div>
              <p className="text-lg font-medium text-foreground mb-1">No {filter !== 'all' ? filter.toLowerCase() : ''} reports found</p>
              <p className="text-sm max-w-sm">When field officers submit new observations from the field, they will appear here.</p>
            </div>
          ) : (
            <div className={`flex flex-col gap-2.5 p-3 transition-opacity duration-300 ${loading ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
              {filteredReports.map((r) => (
                <div
                  key={r.report_id}
                  onClick={() => { setDetailReport(r); setDetailOpen(true) }}
                  className="relative overflow-hidden grid grid-cols-[120px_1fr_120px_140px_140px] gap-4 px-5 py-3 items-center bg-background/40 hover:bg-muted/30 border border-border/50 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group"
                >
                  <div className={`absolute left-0 top-0 bottom-0 w-1 opacity-0 group-hover:opacity-100 transition-opacity ${
                    r.status === 'Verified' ? 'bg-emerald-500' : r.status === 'Rejected' ? 'bg-rose-500' : 'bg-sky-500'
                  }`} />
                  
                  <div className="font-mono text-sm font-semibold text-muted-foreground group-hover:text-sky-400 transition-colors flex items-center gap-2">
                    {r.status === 'Pending' && <span className="h-2 w-2 rounded-full bg-orange-400 animate-pulse" />}
                    {r.report_id}
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border border-border/50 shadow-sm">
                      <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary text-xs font-bold">
                        {r.observer_name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-bold text-sm text-foreground">{r.observer_name}</div>
                      <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1 mt-0.5 uppercase tracking-wider">
                        <MapPin className="h-3 w-3 text-sky-400" /> {r.zone}
                      </div>
                    </div>
                  </div>

                  <div>
                    <Badge variant="outline" className={`${riskBadgeColor(r.risk_level)} text-xs px-2.5 py-0.5 shadow-sm font-semibold tracking-wide`}>
                      {r.risk_level}
                    </Badge>
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5 text-sm font-bold">
                      {statusIcon(r.status)}
                      <span className={r.status === 'Verified' ? 'text-emerald-500' : r.status === 'Rejected' ? 'text-rose-500' : 'text-orange-500'}>
                        {r.status}
                      </span>
                    </div>
                  </div>

                  <div className="text-right text-sm font-medium text-muted-foreground flex flex-col items-end">
                    {formatTime(r.created_at)}
                    <span className="text-[10px] uppercase tracking-wider text-sky-400 opacity-0 group-hover:opacity-100 transition-opacity mt-1 flex items-center gap-1">
                      <Eye className="h-3 w-3" /> View Details
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-3xl p-0 overflow-hidden border-border/50 bg-background/95 backdrop-blur-xl shadow-2xl">
          {detailReport && (
            <>
              {/* Header section with gradient */}
              <div className="relative p-6 pb-8 bg-gradient-to-br from-sky-500/10 via-background to-background border-b border-border/50">
                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                  <FileText className="w-32 h-32 text-sky-500" />
                </div>
                <DialogHeader className="relative z-10">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-sky-500/20 rounded-xl shadow-inner border border-sky-500/20">
                        <MessageSquare className="h-5 w-5 text-sky-400" />
                      </div>
                      <div>
                        <DialogTitle className="text-2xl font-black font-['Outfit'] tracking-tight text-foreground">
                          Observation Report
                        </DialogTitle>
                        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                          <span className="font-mono text-sky-400 bg-sky-500/10 px-1.5 py-0.5 rounded">{detailReport.report_id}</span>
                          <span>·</span>
                          <span>Submitted {formatTime(detailReport.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    {/* Status Badge */}
                    <div className={`px-4 py-1.5 rounded-full border shadow-sm flex items-center gap-2 text-sm font-semibold tracking-wide ${
                      detailReport.status === 'Verified' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : detailReport.status === 'Rejected' ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                        : 'bg-orange-500/10 border-orange-500/30 text-orange-400'
                    }`}>
                      {statusIcon(detailReport.status)}
                      {detailReport.status.toUpperCase()}
                    </div>
                  </div>
                </DialogHeader>
              </div>

              <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh]">
                {/* Officer info & Meta grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Officer Card */}
                  <div className="md:col-span-1 p-4 rounded-2xl bg-gradient-to-br from-muted/30 to-muted/10 border border-border/50 flex flex-col justify-center items-center text-center">
                    <Avatar className="h-14 w-14 border-2 border-background shadow-md mb-3">
                      <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                        {detailReport.observer_name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Field Officer</p>
                    <p className="font-medium text-foreground">{detailReport.observer_name}</p>
                  </div>

                  {/* Details Grid */}
                  <div className="md:col-span-2 grid grid-cols-2 gap-3">
                    <div className="space-y-1.5 p-3.5 rounded-xl bg-muted/10 border border-border/40 hover:bg-muted/20 transition-colors">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                        <MapPin className="h-3 w-3 text-sky-400" /> Zone
                      </label>
                      <p className="text-sm font-semibold">{detailReport.zone}</p>
                    </div>
                    <div className="space-y-1.5 p-3.5 rounded-xl bg-muted/10 border border-border/40 hover:bg-muted/20 transition-colors">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                        <AlertTriangle className="h-3 w-3 text-orange-400" /> Risk Level
                      </label>
                      <div>
                        <Badge variant="outline" className={`${riskBadgeColor(detailReport.risk_level)} text-xs shadow-sm`}>
                          {detailReport.risk_level}
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-1.5 p-3.5 rounded-xl bg-muted/10 border border-border/40 hover:bg-muted/20 transition-colors">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                        <Activity className="h-3 w-3 text-indigo-400" /> Swarm Size
                      </label>
                      <p className="text-sm font-semibold text-foreground">{detailReport.estimated_size || '—'}</p>
                    </div>
                    <div className="space-y-1.5 p-3.5 rounded-xl bg-muted/10 border border-border/40 hover:bg-muted/20 transition-colors">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                        <Search className="h-3 w-3 text-emerald-400" /> Exact Location
                      </label>
                      {detailReport.lat && detailReport.lon ? (
                        <p className="text-sm font-mono font-medium text-sky-400">
                          {detailReport.lat.toFixed(4)}, {detailReport.lon.toFixed(4)}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">Unspecified</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Description block */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Observation Notes</label>
                  <div className="bg-gradient-to-br from-background to-muted/20 border border-border/60 rounded-2xl p-5 text-sm leading-relaxed text-foreground shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-sky-500/50"></div>
                    {detailReport.description}
                  </div>
                </div>

                {/* Review Info */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Analyst Review Log</label>
                  {detailReport.reviewed_by ? (
                    <div className={`rounded-2xl p-5 border shadow-sm relative overflow-hidden ${
                      detailReport.status === 'Verified' ? 'bg-gradient-to-r from-emerald-500/10 to-transparent border-emerald-500/20'
                        : detailReport.status === 'Rejected' ? 'bg-gradient-to-r from-rose-500/10 to-transparent border-rose-500/20'
                        : 'bg-gradient-to-r from-sky-500/10 to-transparent border-sky-500/20'
                    }`}>
                      <div className="flex items-start justify-between mb-1">
                        <div>
                          <p className="text-sm font-semibold text-foreground">Reviewed by {detailReport.reviewed_by}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{detailReport.reviewed_at ? new Date(detailReport.reviewed_at).toLocaleString() : 'Date unknown'}</p>
                        </div>
                      </div>
                      
                      {detailReport.reviewer_feedback && (
                        <div className="mt-3 bg-background/60 rounded-xl p-4 border border-border/40 shadow-inner">
                          <p className="text-sm text-foreground italic border-l-2 border-primary/30 pl-3">"{detailReport.reviewer_feedback}"</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-orange-500/5 border border-orange-500/20 rounded-2xl p-5 flex items-center gap-3">
                      <Clock className="h-5 w-5 text-orange-400 animate-pulse" />
                      <div>
                        <p className="text-sm font-semibold text-orange-500">Awaiting Assignment</p>
                        <p className="text-xs text-orange-400/80 mt-0.5">No analyst has reviewed this observation yet.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 bg-muted/20 border-t border-border/50 flex sm:justify-between gap-2">
                <Button
                  variant="ghost"
                  className="gap-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                  onClick={() => { setDeleteTarget(detailReport); setDeleteError(null); setDeleteOpen(true) }}
                >
                  <Trash2 className="h-4 w-4" /> Delete Report
                </Button>
                <Button variant="outline" onClick={() => setDetailOpen(false)}>
                  Close
                </Button>
                </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={(open) => { if (!deleting) { setDeleteOpen(open); if (!open) setDeleteError(null) } }}>
        <DialogContent className="sm:max-w-md border-rose-500/20 bg-background/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-400">
              <AlertTriangle className="h-5 w-5" />
              Confirm Deletion
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete report <strong className="text-foreground">{deleteTarget?.report_id}</strong>? This action cannot be undone and will be removed from all analyst queues.
            </DialogDescription>
          </DialogHeader>

          {deleteError && (
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-3 text-sm text-rose-400">
              {deleteError}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button variant="ghost" disabled={deleting} onClick={() => { setDeleteOpen(false); setDeleteError(null) }}>
              Cancel
            </Button>
            <Button variant="destructive" disabled={deleting} onClick={handleDelete} className="gap-2">
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              {deleting ? 'Deleting...' : 'Delete Permanently'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
