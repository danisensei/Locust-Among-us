import { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  CheckCircle2, Clock, XCircle, Eye, Loader2, MapPin, MessageSquare, Map as MapIcon,
} from 'lucide-react'
import { useAuthFetch, API_URL } from '@/context/AuthContext'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

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

// ── Map Viewer Component ───────────────────────────────────
function MapViewer({ lat, lon, zone }: { lat: number; lon: number; zone: string }) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return

    const map = L.map(mapRef.current).setView([lat, lon], 12)

    const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    })

    const satelliteLayer = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      { attribution: 'Tiles &copy; Esri', maxZoom: 18 }
    )

    // Default to street view
    streetLayer.addTo(map)

    // Layer control
    L.control.layers(
      { 'Street': streetLayer, 'Satellite': satelliteLayer },
      {},
      { position: 'topright' }
    ).addTo(map)

    // Marker
    const marker = L.marker([lat, lon]).addTo(map)
    marker.bindPopup(`
      <div style="font-family: system-ui; font-size: 12px;">
        <strong>${zone}</strong><br/>
        <span style="color: #666;">Lat: ${lat.toFixed(6)}</span><br/>
        <span style="color: #666;">Lon: ${lon.toFixed(6)}</span>
      </div>
    `).openPopup()

    mapInstance.current = map
    setTimeout(() => map.invalidateSize(), 300)

    return () => { map.remove(); mapInstance.current = null }
  }, [lat, lon, zone])

  return <div ref={mapRef} className="w-full h-80 rounded-lg border border-border overflow-hidden" />
}

// ── Main Component ───────────────────────────────────────────
export default function FieldReports() {
  const authFetch = useAuthFetch()

  const [reports, setReports] = useState<ReportData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Review dialog state
  const [selectedReport, setSelectedReport] = useState<ReportData | null>(null)
  const [reviewOpen, setReviewOpen] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [reviewError, setReviewError] = useState<string | null>(null)

  // Map dialog state
  const [mapOpen, setMapOpen] = useState(false)
  const [mapReport, setMapReport] = useState<ReportData | null>(null)

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

  // ── Open review dialog ─────────────────────────────────────
  const openReview = (report: ReportData) => {
    setSelectedReport(report)
    setFeedback('')
    setReviewError(null)
    setReviewOpen(true)
  }

  // ── Submit review ──────────────────────────────────────────
  const handleReview = async (status: 'Verified' | 'Rejected') => {
    if (!selectedReport) return
    setSubmitting(true)
    setReviewError(null)
    try {
      const res = await authFetch(`${API_URL}/api/reports/${selectedReport.report_id}/review`, {
        method: 'PATCH',
        body: JSON.stringify({ status, feedback }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || `Error (${res.status})`)
      }
      await fetchReports()
      setReviewOpen(false)
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : 'Review failed')
    } finally {
      setSubmitting(false)
    }
  }

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
        <h1 className="text-3xl font-bold tracking-tight">Report Review</h1>
        <p className="text-muted-foreground mt-2">
          Review field observations · Approve or reject with feedback · {pendingCount} awaiting review
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
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Pending Review</CardTitle></CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${filter === 'Pending' ? 'text-yellow-300' : 'text-yellow-300/60'}`}>{pendingCount}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setFilter('Verified')}>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Approved</CardTitle></CardHeader>
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
              <CardDescription>Click a row to review the report</CardDescription>
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
                    onClick={() => openReview(r)}
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
                      {r.status === 'Pending' ? (
                        <Button variant="outline" size="sm" className="gap-1" onClick={(e) => { e.stopPropagation(); openReview(r) }}>
                          <Eye className="h-3 w-3" /> Review
                        </Button>
                      ) : (
                        <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground" onClick={(e) => { e.stopPropagation(); openReview(r) }}>
                          <Eye className="h-3 w-3" /> View
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          {selectedReport && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-sky-400" />
                  {selectedReport.status === 'Pending' ? 'Review Report' : 'Re-Review Report'} — {selectedReport.report_id}
                </DialogTitle>
                <DialogDescription>
                  Submitted by <strong>{selectedReport.observer_name}</strong> · {formatTime(selectedReport.created_at)}
                </DialogDescription>
              </DialogHeader>

              {/* Report Details */}
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Zone</Label>
                    <p className="text-sm font-medium">{selectedReport.zone}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Risk Level</Label>
                    <Badge className={`${riskBadgeColor(selectedReport.risk_level)} text-xs`}>
                      {selectedReport.risk_level}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Estimated Size</Label>
                    <p className="text-sm">{selectedReport.estimated_size || '—'}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Location</Label>
                    {selectedReport.lat && selectedReport.lon ? (
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-mono flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-green-400" />
                          {selectedReport.lat.toFixed(4)}, {selectedReport.lon.toFixed(4)}
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 text-xs gap-1 px-2"
                          onClick={() => {
                            setMapReport(selectedReport)
                            setMapOpen(true)
                          }}
                        >
                          <MapIcon className="h-3 w-3" />
                          View on Map
                        </Button>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Not provided</p>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Description</Label>
                  <div className="bg-muted/40 rounded-lg p-3 text-sm leading-relaxed">
                    {selectedReport.description}
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Current Status</Label>
                  <div>{statusBadge(selectedReport.status)}</div>
                </div>

                {/* Show previous review info if already reviewed */}
                {selectedReport.reviewed_by && (
                  <div className="bg-sky-500/10 border border-sky-500/20 rounded-lg p-3 space-y-1">
                    <p className="text-xs text-sky-300 font-medium">Previous Review</p>
                    <p className="text-sm">Reviewed by <strong>{selectedReport.reviewed_by}</strong> · {selectedReport.reviewed_at ? formatTime(selectedReport.reviewed_at) : ''}</p>
                    {selectedReport.reviewer_feedback && (
                      <p className="text-sm text-muted-foreground mt-1">"{selectedReport.reviewer_feedback}"</p>
                    )}
                  </div>
                )}

                {/* Feedback input — always available for re-review */}
                <div className="space-y-2">
                  <Label htmlFor="feedback" className="text-sm">
                    Feedback {selectedReport.status === 'Pending' ? '(optional)' : '(for re-review)'}
                  </Label>
                  <textarea
                    id="feedback"
                    rows={3}
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Provide notes, reasoning, or instructions for the field officer…"
                    className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none resize-none dark:bg-input/30"
                  />
                </div>

                {reviewError && (
                  <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                    ⚠️ {reviewError}
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setReviewOpen(false)}>
                  Cancel
                </Button>
                {/* Pending: show Reject + Approve */}
                {selectedReport.status === 'Pending' && (
                  <>
                    <Button
                      variant="default"
                      className="bg-red-600 hover:bg-red-700 text-white gap-2"
                      onClick={() => handleReview('Rejected')}
                      disabled={submitting}
                    >
                      {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                      <XCircle className="h-4 w-4" />
                      Reject
                    </Button>
                    <Button
                      variant="default"
                      className="bg-green-600 hover:bg-green-700 text-white gap-2"
                      onClick={() => handleReview('Verified')}
                      disabled={submitting}
                    >
                      {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                      <CheckCircle2 className="h-4 w-4" />
                      Approve
                    </Button>
                  </>
                )}
                {/* Verified: show Reject + Re-Approve */}
                {selectedReport.status === 'Verified' && (
                  <>
                    <Button
                      variant="default"
                      className="bg-red-600 hover:bg-red-700 text-white gap-2"
                      onClick={() => handleReview('Rejected')}
                      disabled={submitting}
                    >
                      {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                      <XCircle className="h-4 w-4" />
                      Reject
                    </Button>
                    <Button
                      variant="default"
                      className="bg-green-600 hover:bg-green-700 text-white gap-2"
                      onClick={() => handleReview('Verified')}
                      disabled={submitting}
                    >
                      {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                      <CheckCircle2 className="h-4 w-4" />
                      Re-Approve
                    </Button>
                  </>
                )}
                {/* Rejected: show Re-Reject + Approve */}
                {selectedReport.status === 'Rejected' && (
                  <Button
                    variant="default"
                    className="bg-green-600 hover:bg-green-700 text-white gap-2"
                    onClick={() => handleReview('Verified')}
                    disabled={submitting}
                  >
                    {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    <CheckCircle2 className="h-4 w-4" />
                    Approve
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Map Viewer Dialog */}
      <Dialog open={mapOpen} onOpenChange={(v) => { setMapOpen(v); if (!v) setMapReport(null) }}>
        <DialogContent className="sm:max-w-2xl">
          {mapReport && mapReport.lat && mapReport.lon && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <MapIcon className="h-5 w-5 text-sky-400" />
                  Report Location — {mapReport.report_id}
                </DialogTitle>
                <DialogDescription>
                  {mapReport.zone} · {mapReport.lat.toFixed(6)}, {mapReport.lon.toFixed(6)} · Use the layer control (top-right) to switch between Street and Satellite views
                </DialogDescription>
              </DialogHeader>
              <MapViewer lat={mapReport.lat} lon={mapReport.lon} zone={mapReport.zone} />
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
