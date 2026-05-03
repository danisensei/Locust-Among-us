import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { CheckCircle2, Clock, XCircle, Eye, Loader2, MapPin, MessageSquare, Trash2, AlertTriangle } from 'lucide-react'
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

  useEffect(() => { fetchReports() }, []) // eslint-disable-line react-hooks/exhaustive-deps

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
      // Close detail dialog too if it was showing this report
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
      case 'Critical': return 'bg-red-500/15 text-red-400'
      case 'High':     return 'bg-orange-500/15 text-orange-400'
      case 'Medium':   return 'bg-yellow-500/15 text-yellow-300'
      case 'Low':      return 'bg-green-500/15 text-green-400'
      default:         return 'bg-muted text-muted-foreground'
    }
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case 'Verified':
        return (
          <Badge className="bg-green-500/15 text-green-300 flex items-center gap-1 w-fit">
            <CheckCircle2 className="h-3 w-3" /> Verified
          </Badge>
        )
      case 'Rejected':
        return (
          <Badge className="bg-red-500/15 text-red-400 flex items-center gap-1 w-fit">
            <XCircle className="h-3 w-3" /> Rejected
          </Badge>
        )
      default:
        return (
          <Badge className="bg-yellow-500/15 text-yellow-200 flex items-center gap-1 w-fit">
            <Clock className="h-3 w-3" /> Pending
          </Badge>
        )
    }
  }

  const filteredReports = filter === 'all' ? reports : reports.filter(r => r.status === filter)
  const pendingCount = reports.filter(r => r.status === 'Pending').length
  const verifiedCount = reports.filter(r => r.status === 'Verified').length
  const rejectedCount = reports.filter(r => r.status === 'Rejected').length

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Field Reports</h1>
        <p className="text-muted-foreground mt-2">
          All field observations · {pendingCount} pending · {verifiedCount} verified · {rejectedCount} rejected
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setFilter('all')}>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total</CardTitle></CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${filter === 'all' ? 'text-sky-400' : ''}`}>{reports.length}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-yellow-500 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setFilter('Pending')}>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Pending</CardTitle></CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${filter === 'Pending' ? 'text-yellow-300' : 'text-yellow-300/60'}`}>{pendingCount}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setFilter('Verified')}>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Verified</CardTitle></CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${filter === 'Verified' ? 'text-green-400' : 'text-green-400/60'}`}>{verifiedCount}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setFilter('Rejected')}>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Rejected</CardTitle></CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${filter === 'Rejected' ? 'text-red-400' : 'text-red-400/60'}`}>{rejectedCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Reports Table */}
      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border bg-accent/30">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Field Reports {filter !== 'all' && `— ${filter}`}</CardTitle>
              <CardDescription>Click a row to view report details</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={fetchReports} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Refresh'}
              </Button>
              {filter !== 'all' && (
                <Button variant="ghost" size="sm" onClick={() => setFilter('all')}>Clear filter</Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {error ? (
            <div className="p-8 text-center text-red-400">
              <p>⚠️ {error}</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={fetchReports}>Retry</Button>
            </div>
          ) : loading ? (
            <div className="p-8 text-center text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
              <p>Loading reports…</p>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <p className="text-lg mb-1">No {filter !== 'all' ? filter.toLowerCase() : ''} reports</p>
              <p className="text-sm">Reports submitted by field officers will appear here.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border bg-muted/40 hover:bg-muted/50 transition-colors">
                  <TableHead className="font-semibold text-foreground">Report ID</TableHead>
                  <TableHead className="font-semibold text-foreground">Observer</TableHead>
                  <TableHead className="font-semibold text-foreground">Zone</TableHead>
                  <TableHead className="font-semibold text-foreground">Risk</TableHead>
                  <TableHead className="font-semibold text-foreground">Status</TableHead>
                  <TableHead className="font-semibold text-foreground">Submitted</TableHead>
                  <TableHead className="font-semibold text-foreground text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReports.map((r) => (
                  <TableRow
                    key={r.report_id}
                    className="border-b border-border hover:bg-accent/40 transition-colors duration-150 cursor-pointer"
                    onClick={() => { setDetailReport(r); setDetailOpen(true) }}
                  >
                    <TableCell className="font-semibold text-sm">{r.report_id}</TableCell>
                    <TableCell className="font-medium">{r.observer_name}</TableCell>
                    <TableCell className="text-sm">{r.zone}</TableCell>
                    <TableCell>
                      <Badge className={`${riskBadgeColor(r.risk_level)} text-xs`}>{r.risk_level}</Badge>
                    </TableCell>
                    <TableCell>{statusBadge(r.status)}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{formatTime(r.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground" onClick={(e) => { e.stopPropagation(); setDetailReport(r); setDetailOpen(true) }}>
                          <Eye className="h-3 w-3" /> View
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          onClick={(e) => { e.stopPropagation(); setDeleteTarget(r); setDeleteError(null); setDeleteOpen(true) }}
                        >
                          <Trash2 className="h-3 w-3" /> Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          {detailReport && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-sky-400" />
                  Report Details — {detailReport.report_id}
                </DialogTitle>
                <DialogDescription>
                  Submitted by <strong>{detailReport.observer_name}</strong> · {formatTime(detailReport.created_at)}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Zone</label>
                    <p className="text-sm font-medium">{detailReport.zone}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Risk Level</label>
                    <Badge className={`${riskBadgeColor(detailReport.risk_level)} text-xs`}>
                      {detailReport.risk_level}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Estimated Size</label>
                    <p className="text-sm">{detailReport.estimated_size || '—'}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Location</label>
                    {detailReport.lat && detailReport.lon ? (
                      <p className="text-sm font-mono flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-green-400" />
                        {detailReport.lat.toFixed(4)}, {detailReport.lon.toFixed(4)}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">Not provided</p>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Description</label>
                  <div className="bg-muted/40 rounded-lg p-3 text-sm leading-relaxed">
                    {detailReport.description}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Current Status</label>
                  <div>{statusBadge(detailReport.status)}</div>
                </div>

                {/* Review Info */}
                {detailReport.reviewed_by ? (
                  <div className={`rounded-lg p-3 space-y-1 border ${
                    detailReport.status === 'Verified'
                      ? 'bg-green-500/10 border-green-500/20'
                      : detailReport.status === 'Rejected'
                        ? 'bg-red-500/10 border-red-500/20'
                        : 'bg-sky-500/10 border-sky-500/20'
                  }`}>
                    <p className={`text-xs font-medium ${
                      detailReport.status === 'Verified' ? 'text-green-300'
                        : detailReport.status === 'Rejected' ? 'text-red-300'
                        : 'text-sky-300'
                    }`}>Analyst Review</p>
                    <p className="text-sm">
                      Reviewed by <strong>{detailReport.reviewed_by}</strong>
                      {detailReport.reviewed_at ? ` · ${formatTime(detailReport.reviewed_at)}` : ''}
                    </p>
                    {detailReport.reviewer_feedback && (
                      <div className="bg-background/40 rounded-md p-2 mt-2">
                        <p className="text-sm text-muted-foreground italic">"{detailReport.reviewer_feedback}"</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-muted/30 border border-border rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">⏳ Awaiting analyst review…</p>
                  </div>
                )}
              </div>

              <DialogFooter className="flex sm:justify-between gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  className="gap-1"
                  onClick={() => { setDeleteTarget(detailReport); setDeleteError(null); setDeleteOpen(true) }}
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete Report
                </Button>
                <Button variant="outline" onClick={() => setDetailOpen(false)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={(open) => { if (!deleting) { setDeleteOpen(open); if (!open) setDeleteError(null) } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="h-5 w-5" />
              Delete Report
            </DialogTitle>
            <DialogDescription>
              You are about to permanently delete report <strong className="text-foreground">{deleteTarget?.report_id}</strong> from <strong className="text-foreground">{deleteTarget?.observer_name}</strong>. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {deleteError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-400">
              ⚠️ {deleteError}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" disabled={deleting} onClick={() => { setDeleteOpen(false); setDeleteError(null) }}>
              Cancel
            </Button>
            <Button variant="destructive" disabled={deleting} onClick={handleDelete} className="gap-1">
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              {deleting ? 'Deleting…' : 'Delete Permanently'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
