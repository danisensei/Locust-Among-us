import { useState, useEffect, useCallback, useRef } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import {
    CheckCircle2, Clock, XCircle, Eye, Loader2, MapPin, MessageSquare, Map as MapIcon, FileText, Search, Activity, ShieldAlert, CheckSquare, AlertTriangle, RefreshCw, Send
} from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
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

        streetLayer.addTo(map)

        L.control.layers(
            { 'Street': streetLayer, 'Satellite': satelliteLayer },
            {},
            { position: 'topright' }
        ).addTo(map)

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

    return <div ref={mapRef} className="w-full h-80 rounded-xl border border-border/50 overflow-hidden shadow-inner" />
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
    const [submittingAction, setSubmittingAction] = useState<'Verified' | 'Rejected' | null>(null)
    const [reviewError, setReviewError] = useState<string | null>(null)

    // Map dialog state
    const [mapOpen, setMapOpen] = useState(false)
    const [mapReport, setMapReport] = useState<ReportData | null>(null)

    // Filter & Search
    const [filter, setFilter] = useState<'all' | 'Pending' | 'Verified' | 'Rejected'>('all')
    const [search, setSearch] = useState('')

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
        setSubmittingAction(status)
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
            setSubmittingAction(null)
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
            case 'Critical': return 'bg-rose-500/15 text-rose-400 border-rose-500/20'
            case 'High': return 'bg-orange-500/15 text-orange-400 border-orange-500/20'
            case 'Medium': return 'bg-amber-500/15 text-amber-300 border-amber-500/20'
            case 'Low': return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'
            default: return 'bg-muted text-muted-foreground border-border'
        }
    }

    const statusIcon = (status: string) => {
        switch (status) {
            case 'Verified': return <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            case 'Rejected': return <XCircle className="h-4 w-4 text-rose-400" />
            default: return <Clock className="h-4 w-4 text-amber-400" />
        }
    }

    const filteredReports = reports.filter(r => {
        const matchesFilter = filter === 'all' || r.status === filter
        const searchLower = search.toLowerCase()
        const matchesSearch =
            r.report_id.toLowerCase().includes(searchLower) ||
            r.observer_name.toLowerCase().includes(searchLower) ||
            r.zone.toLowerCase().includes(searchLower) ||
            (r.description && r.description.toLowerCase().includes(searchLower))
        return matchesFilter && matchesSearch
    })
    const pendingCount = reports.filter(r => r.status === 'Pending').length
    const verifiedCount = reports.filter(r => r.status === 'Verified').length
    const rejectedCount = reports.filter(r => r.status === 'Rejected').length

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent drop-shadow-sm font-['Outfit']">
                        Report Review
                    </h1>
                    <p className="text-muted-foreground mt-1 font-medium">
                        Review field observations · Approve or reject with feedback · <span className="text-amber-400">{pendingCount} awaiting</span>
                    </p>
                </div>
                <Button type="button" onClick={fetchReports} disabled={loading} className="gap-2 bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 shadow-lg shadow-sky-500/20 transition-all font-medium">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    Refresh Inbox
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
                    className={`p-5 rounded-2xl border transition-all duration-300 cursor-pointer group relative overflow-hidden ${filter === 'Pending' ? 'bg-amber-500/10 border-amber-500/50 shadow-[0_0_30px_-5px_rgba(245,158,11,0.15)]' : 'bg-gradient-to-br from-background to-muted/20 border-border/50 hover:border-amber-500/30'}`}
                >
                    <div className="absolute -right-4 -top-4 p-6 bg-amber-500/5 rounded-full group-hover:bg-amber-500/10 transition-colors">
                        <Clock className="h-8 w-8 text-amber-500/40" />
                    </div>
                    <p className="text-sm font-semibold text-muted-foreground mb-1">Awaiting Review</p>
                    <p className={`text-3xl font-bold font-['Outfit'] ${filter === 'Pending' ? 'text-amber-400' : 'text-foreground'}`}>{pendingCount}</p>
                </div>

                <div
                    onClick={() => setFilter('Verified')}
                    className={`p-5 rounded-2xl border transition-all duration-300 cursor-pointer group relative overflow-hidden ${filter === 'Verified' ? 'bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_30px_-5px_rgba(16,185,129,0.15)]' : 'bg-gradient-to-br from-background to-muted/20 border-border/50 hover:border-emerald-500/30'}`}
                >
                    <div className="absolute -right-4 -top-4 p-6 bg-emerald-500/5 rounded-full group-hover:bg-emerald-500/10 transition-colors">
                        <CheckSquare className="h-8 w-8 text-emerald-500/40" />
                    </div>
                    <p className="text-sm font-semibold text-muted-foreground mb-1">Approved</p>
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
                <div className="p-4 border-b border-border/50 bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-indigo-500/20 rounded-lg">
                            <Search className="h-4 w-4 text-indigo-400" />
                        </div>
                        <h2 className="font-semibold font-['Outfit'] text-lg">Field Reports Inbox</h2>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="relative flex-1 sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search ID, zone, observer..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9 bg-background/50 border-border/50 h-9 text-sm rounded-xl focus:ring-sky-500/50"
                            />
                        </div>
                        <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
                            <SelectTrigger className="w-[140px] h-9 bg-background/50 border-border/50 rounded-xl text-sm">
                                <SelectValue placeholder="All Status" />
                            </SelectTrigger>
                            <SelectContent className="bg-background/95 backdrop-blur-xl border-border/50">
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="Pending">Pending Review</SelectItem>
                                <SelectItem value="Verified">Approved</SelectItem>
                                <SelectItem value="Rejected">Rejected</SelectItem>
                            </SelectContent>
                        </Select>
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
                                    onClick={() => openReview(r)}
                                    className="relative overflow-hidden grid grid-cols-[120px_1fr_120px_140px_140px] gap-4 px-5 py-3 items-center bg-background/40 hover:bg-muted/30 border border-border/50 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group"
                                >
                                    <div className={`absolute left-0 top-0 bottom-0 w-1 opacity-0 group-hover:opacity-100 transition-opacity ${r.status === 'Verified' ? 'bg-emerald-500' : r.status === 'Rejected' ? 'bg-rose-500' : 'bg-sky-500'
                                        }`} />

                                    <div className="font-mono text-sm font-semibold text-muted-foreground group-hover:text-sky-400 transition-colors flex items-center gap-2">
                                        {r.status === 'Pending' && <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />}
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
                                            <span className={r.status === 'Verified' ? 'text-emerald-500' : r.status === 'Rejected' ? 'text-rose-500' : 'text-amber-500'}>
                                                {r.status === 'Pending' ? 'Needs Review' : r.status}
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

            {/* Review Dialog */}
            <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
                <DialogContent className="sm:max-w-3xl p-0 overflow-hidden border-border/50 bg-background/95 backdrop-blur-xl shadow-2xl">
                    {selectedReport && (
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
                                                    {selectedReport.status === 'Pending' ? 'Review Report' : 'Re-Review Report'}
                                                </DialogTitle>
                                                <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                                                    <span className="font-mono text-sky-400 bg-sky-500/10 px-1.5 py-0.5 rounded">{selectedReport.report_id}</span>
                                                    <span>·</span>
                                                    <span>Submitted by <span className="font-medium text-foreground">{selectedReport.observer_name}</span></span>
                                                    <span>·</span>
                                                    <span>{formatTime(selectedReport.created_at)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </DialogHeader>
                            </div>

                            <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh]">
                                {/* Details Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <div className="space-y-1.5 p-3.5 rounded-xl bg-muted/10 border border-border/40 hover:bg-muted/20 transition-colors">
                                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                                            <MapPin className="h-3 w-3 text-sky-400" /> Zone
                                        </label>
                                        <p className="text-sm font-semibold">{selectedReport.zone}</p>
                                    </div>
                                    <div className="space-y-1.5 p-3.5 rounded-xl bg-muted/10 border border-border/40 hover:bg-muted/20 transition-colors">
                                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                                            <AlertTriangle className="h-3 w-3 text-orange-400" /> Risk Level
                                        </label>
                                        <div>
                                            <Badge variant="outline" className={`${riskBadgeColor(selectedReport.risk_level)} text-xs shadow-sm`}>
                                                {selectedReport.risk_level}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5 p-3.5 rounded-xl bg-muted/10 border border-border/40 hover:bg-muted/20 transition-colors">
                                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                                            <Activity className="h-3 w-3 text-indigo-400" /> Swarm Size
                                        </label>
                                        <p className="text-sm font-semibold text-foreground">{selectedReport.estimated_size || '—'}</p>
                                    </div>
                                    <div className="space-y-1.5 p-3.5 rounded-xl bg-muted/10 border border-border/40 hover:bg-muted/20 transition-colors">
                                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                                            <Search className="h-3 w-3 text-emerald-400" /> Location
                                        </label>
                                        {selectedReport.lat && selectedReport.lon ? (
                                            <div className="flex flex-col gap-1.5">
                                                <p className="text-sm font-mono font-medium text-sky-400">
                                                    {selectedReport.lat.toFixed(4)}, {selectedReport.lon.toFixed(4)}
                                                </p>
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    className="h-6 text-[10px] uppercase font-bold tracking-wider w-fit mt-1"
                                                    onClick={() => {
                                                        setMapReport(selectedReport)
                                                        setMapOpen(true)
                                                    }}
                                                >
                                                    <MapIcon className="h-3 w-3 mr-1" /> View Map
                                                </Button>
                                            </div>
                                        ) : (
                                            <p className="text-sm text-muted-foreground italic">Unspecified</p>
                                        )}
                                    </div>
                                </div>

                                {/* Description block */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Observation Notes</label>
                                    <div className="bg-gradient-to-br from-background to-muted/20 border border-border/60 rounded-2xl p-5 text-sm leading-relaxed text-foreground shadow-sm relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-sky-500/50"></div>
                                        {selectedReport.description}
                                    </div>
                                </div>

                                {/* Show previous review info if already reviewed */}
                                {selectedReport.reviewed_by && (
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Previous Review Log</label>
                                        <div className={`rounded-2xl p-5 border shadow-sm relative overflow-hidden ${selectedReport.status === 'Verified' ? 'bg-gradient-to-r from-emerald-500/10 to-transparent border-emerald-500/20'
                                                : selectedReport.status === 'Rejected' ? 'bg-gradient-to-r from-rose-500/10 to-transparent border-rose-500/20'
                                                    : 'bg-gradient-to-r from-sky-500/10 to-transparent border-sky-500/20'
                                            }`}>
                                            <div className="flex items-start justify-between mb-1">
                                                <div>
                                                    <p className="text-sm font-semibold text-foreground">Reviewed by {selectedReport.reviewed_by}</p>
                                                    <p className="text-xs text-muted-foreground mt-0.5">{selectedReport.reviewed_at ? formatTime(selectedReport.reviewed_at) : 'Date unknown'}</p>
                                                </div>
                                            </div>

                                            {selectedReport.reviewer_feedback && (
                                                <div className="mt-3 bg-background/60 rounded-xl p-4 border border-border/40 shadow-inner">
                                                    <p className="text-sm text-foreground italic border-l-2 border-primary/30 pl-3">"{selectedReport.reviewer_feedback}"</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Feedback input */}
                                <div className="space-y-2">
                                    <label htmlFor="feedback" className="text-[10px] font-bold text-foreground uppercase tracking-widest pl-1">
                                        Analyst Feedback {selectedReport.status === 'Pending' ? '(optional)' : '(for re-review)'}
                                    </label>
                                    <textarea
                                        id="feedback"
                                        rows={3}
                                        value={feedback}
                                        onChange={(e) => setFeedback(e.target.value)}
                                        placeholder="Provide notes, reasoning, or instructions for the field officer…"
                                        className="w-full rounded-xl border border-input bg-muted/10 px-4 py-3 text-sm placeholder:text-muted-foreground focus-visible:border-sky-500/50 focus-visible:ring-1 focus-visible:ring-sky-500/50 outline-none resize-none transition-all"
                                    />
                                </div>

                                {reviewError && (
                                    <div className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-4 py-3 font-medium flex items-center gap-2">
                                        <AlertTriangle className="h-4 w-4" /> {reviewError}
                                    </div>
                                )}
                            </div>

                            <div className="p-4 bg-muted/20 border-t border-border/50 flex sm:justify-between gap-3">
                                <Button variant="ghost" onClick={() => setReviewOpen(false)}>
                                    Cancel
                                </Button>

                                <div className="flex gap-2">
                                    {selectedReport.status !== 'Rejected' && (
                                        <Button
                                            variant="destructive"
                                            className="gap-2 bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/20"
                                            onClick={() => handleReview('Rejected')}
                                            disabled={submittingAction !== null}
                                        >
                                            {submittingAction === 'Rejected' ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                                            Reject
                                        </Button>
                                    )}
                                    {selectedReport.status !== 'Verified' && (
                                        <Button
                                            variant="default"
                                            className="gap-2 bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                                            onClick={() => handleReview('Verified')}
                                            disabled={submittingAction !== null}
                                        >
                                            {submittingAction === 'Verified' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                                            Approve
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* Map Viewer Dialog */}
            <Dialog open={mapOpen} onOpenChange={(v) => { setMapOpen(v); if (!v) setMapReport(null) }}>
                <DialogContent className="sm:max-w-3xl border-border/50 bg-background/95 backdrop-blur-xl p-0 overflow-hidden">
                    {mapReport && mapReport.lat && mapReport.lon && (
                        <>
                            <div className="p-6 pb-4 bg-muted/20 border-b border-border/50">
                                <DialogTitle className="flex items-center gap-2 text-xl font-['Outfit']">
                                    <MapIcon className="h-5 w-5 text-sky-400" />
                                    Location: {mapReport.zone}
                                </DialogTitle>
                                <DialogDescription className="mt-1">
                                    Report {mapReport.report_id} · Coordinates: {mapReport.lat.toFixed(6)}, {mapReport.lon.toFixed(6)}
                                </DialogDescription>
                            </div>
                            <div className="p-6">
                                <MapViewer lat={mapReport.lat} lon={mapReport.lon} zone={mapReport.zone} />
                                <div className="flex justify-end mt-4">
                                    <Button variant="outline" onClick={() => setMapOpen(false)}>Close Map</Button>
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
