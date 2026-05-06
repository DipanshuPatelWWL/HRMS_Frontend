import React, { useState, useMemo, useEffect, useCallback } from 'react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import API from '../../services/api'

const C = {
    indigo: '#4f46e5', indigoDark: '#4338ca', indigoLight: '#eef2ff', indigoBorder: '#c7d2fe',
    red: '#ef4444', redDark: '#dc2626', redLight: '#fef2f2', redBorder: '#fca5a5',
    emerald: '#059669', emeraldLight: '#ecfdf5', emeraldBorder: '#6ee7b7',
    blue: '#2563eb', blueLight: '#eff6ff', blueBorder: '#93c5fd', amber: '#d97706',
    slate50: '#f8fafc', slate100: '#f1f5f9', slate200: '#e2e8f0', slate300: '#cbd5e1',
    slate400: '#94a3b8', slate500: '#64748b', slate600: '#475569', slate700: '#334155',
    slate800: '#1e293b', white: '#ffffff', pageBg: '#f1f3f9',
}

const STATUS = {
    draft: { label: 'Draft', color: '#64748b', bg: '#f1f5f9' },
    sent_to_manager: { label: 'Pending', color: '#2563eb', bg: '#eff6ff' },
    approved: { label: 'Approved', color: '#059669', bg: '#ecfdf5' },
    rejected: { label: 'Rejected', color: '#ef4444', bg: '#fef2f2' },
}

const PAGE_SIZE_OPTIONS = [10, 25, 50]
const AVATAR_COLORS = ['#7c3aed', '#4f46e5', '#2563eb', '#db2777', '#d97706', '#0d9488', '#e11d48']
const getAvatarColor = (name = '') => AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length]
const getInitials = (name = '') => name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?'
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

/* ─── Toast ── */
const Toast = ({ message, type, visible }) => {
    if (!visible) return null
    return (
        <div style={{
            position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
            padding: '14px 20px', borderRadius: 12,
            background: type === 'error' ? C.red : C.emerald,
            color: C.white, fontSize: 14, fontWeight: 600,
            boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
            display: 'flex', alignItems: 'center', gap: 10,
            animation: 'slideUp 0.3s ease', maxWidth: 340,
        }}>
            <span style={{ fontSize: 16 }}>{type === 'error' ? '✕' : '✓'}</span>
            {message}
        </div>
    )
}

/* ─── StatusBadge ── */
const StatusBadge = ({ status, size = 'sm' }) => {
    const s = STATUS[status] || STATUS.draft
    return (
        <span style={{
            padding: size === 'lg' ? '6px 14px' : '4px 10px',
            borderRadius: size === 'lg' ? 8 : 6,
            background: s.bg, color: s.color,
            fontSize: size === 'lg' ? 13 : 12,
            fontWeight: 700, whiteSpace: 'nowrap',
            display: 'inline-block',
        }}>
            {s.label}
        </span>
    )
}

/* ─── StatCard ── */
const StatCard = ({ label, value, topColor, loading, active, onClick }) => (
    <div
        onClick={onClick}
        style={{
            background: C.white, borderRadius: 16, padding: '22px 24px',
            borderTop: `4px solid ${topColor}`,
            borderRight: `1px solid ${active ? topColor : C.slate100}`,
            borderBottom: `1px solid ${active ? topColor : C.slate100}`,
            borderLeft: `1px solid ${active ? topColor : C.slate100}`,
            boxShadow: active ? `0 0 0 3px ${topColor}33` : '0 1px 4px rgba(0,0,0,0.06)',
            cursor: onClick ? 'pointer' : 'default',
            transition: 'all 0.2s',
        }}
    >
        <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.slate400, marginBottom: 8, marginTop: 0 }}>
            {label}
        </p>
        {loading
            ? <div style={{ width: 60, height: 40, borderRadius: 8, background: C.slate100, animation: 'pulse 1.5s ease infinite' }} />
            : <p style={{ fontSize: 40, fontWeight: 900, color: C.slate800, margin: 0, lineHeight: 1 }}>{value}</p>
        }
    </div>
)

/* ─── Skeleton Row ── */
const SkeletonRow = () => (
    <tr style={{ borderBottom: `1px solid ${C.slate50}` }}>
        {[80, 100, 220, 130, 110, 100, 130].map((w, i) => (
            <td key={i} style={{ padding: '18px 24px' }}>
                <div style={{ height: 14, width: w, borderRadius: 6, background: C.slate100, animation: 'pulse 1.5s ease infinite' }} />
            </td>
        ))}
    </tr>
)

/* ─── Detail Modal ── */
const DetailModal = ({ open, report, onClose }) => {
    if (!open || !report) return null

    const status = STATUS[report.status] || STATUS.draft
    const isRejected = report.status === 'rejected'
    const isApproved = report.status === 'approved'

    const Detail = ({ label, value, fullWidth }) => (
        <div style={{
            gridColumn: fullWidth ? 'span 2' : 'span 1',
            display: 'flex', flexDirection: 'column', gap: 4,
        }}>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.slate400 }}>
                {label}
            </span>
            <span style={{ fontSize: 14, fontWeight: 600, color: C.slate800, wordBreak: 'break-word' }}>
                {value || '—'}
            </span>
        </div>
    )

    return (
        <div
            onClick={onClose}
            style={{
                position: 'fixed', inset: 0, zIndex: 60,
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
                background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(6px)',
            }}
        >
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    background: C.white, borderRadius: 20, width: '100%', maxWidth: 560,
                    maxHeight: '92vh', overflowY: 'auto',
                    boxShadow: '0 32px 80px rgba(15,23,42,0.25)',
                    animation: 'modalIn 0.2s ease',
                }}
            >
                {/* ── Header ── */}
                <div style={{
                    padding: '22px 28px 18px',
                    borderBottom: `1px solid ${C.slate100}`,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{
                            width: 48, height: 48, borderRadius: '50%',
                            background: getAvatarColor(report.client_name),
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: C.white, fontSize: 16, fontWeight: 800, flexShrink: 0,
                        }}>
                            {getInitials(report.client_name)}
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: C.slate800 }}>
                                {report.client_name}
                            </h2>
                            <p style={{ margin: '2px 0 0', fontSize: 13, color: C.slate400 }}>
                                {report.client_email}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} style={{
                        width: 32, height: 32, borderRadius: 8,
                        border: `1px solid ${C.slate200}`, background: C.white,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', fontSize: 14, color: C.slate500, fontWeight: 700, flexShrink: 0,
                    }}>✕</button>
                </div>

                {/* ── Status Banner ── */}
                <div style={{
                    margin: '20px 28px 0',
                    padding: '14px 18px',
                    borderRadius: 12,
                    background: status.bg,
                    border: `1px solid ${isRejected ? C.redBorder : isApproved ? C.emeraldBorder : C.blueBorder}`,
                    display: 'flex', alignItems: 'center', gap: 12,
                }}>
                    <span style={{ fontSize: 20 }}>
                        {isApproved ? '✅' : isRejected ? '❌' : '🕐'}
                    </span>
                    <div>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: status.color }}>
                            {isApproved ? 'This report has been approved'
                                : isRejected ? 'This report has been rejected'
                                    : 'This report is pending review'}
                        </p>
                        {report.action_date && (
                            <p style={{ margin: '2px 0 0', fontSize: 12, color: status.color, opacity: 0.7 }}>
                                {fmtDate(report.action_date)}
                            </p>
                        )}
                    </div>
                    <div style={{ marginLeft: 'auto' }}>
                        <StatusBadge status={report.status} size="lg" />
                    </div>
                </div>

                {/* ── Reject Reason Box ── */}
                {isRejected && report.reject_reason && (
                    <div style={{
                        margin: '12px 28px 0',
                        padding: '14px 18px',
                        borderRadius: 12,
                        background: C.redLight,
                        border: `1px solid ${C.redBorder}`,
                    }}>
                        <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.redDark }}>
                            Rejection Reason
                        </p>
                        <p style={{ margin: 0, fontSize: 14, color: C.redDark, lineHeight: 1.6 }}>
                            {report.reject_reason}
                        </p>
                    </div>
                )}

                {/* ── Details Grid ── */}
                <div style={{
                    padding: '20px 28px 28px',
                    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 24px',
                }}>
                    <Detail label="Report Date" value={fmtDate(report.date || report.createdAt)} />
                    <Detail label="Marketer" value={report.marketer} />
                    <Detail label="Service" value={report.services} />
                    <Detail label="Country" value={report.country} />
                    {report.message && (
                        <Detail label="Notes / Message" value={report.message} fullWidth />
                    )}
                </div>

                {/* ── Footer ── */}
                <div style={{
                    padding: '0 28px 24px',
                    display: 'flex', justifyContent: 'flex-end',
                }}>
                    <button onClick={onClose} style={{
                        padding: '10px 28px', borderRadius: 10,
                        border: `1px solid ${C.slate300}`, background: C.white,
                        fontSize: 14, fontWeight: 600, color: C.slate600,
                        cursor: 'pointer', fontFamily: 'inherit',
                    }}>Close</button>
                </div>
            </div>
        </div>
    )
}

/* ─── Reject Modal ── */
const RejectModal = ({ open, onClose, onSubmit, submitting, reportName }) => {
    const [reason, setReason] = useState('')
    const [error, setError] = useState('')
    const [focused, setFocused] = useState(false)

    useEffect(() => { if (open) { setReason(''); setError('') } }, [open])

    const handleSubmit = () => {
        if (!reason.trim()) { setError('Please provide a reason for rejection'); return }
        onSubmit(reason.trim())
    }

    if (!open) return null

    return (
        <div
            onClick={onClose}
            style={{
                position: 'fixed', inset: 0, zIndex: 70,
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
                background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(6px)',
            }}
        >
            <div onClick={e => e.stopPropagation()} style={{
                background: C.white, borderRadius: 20, width: '100%', maxWidth: 460,
                boxShadow: '0 32px 80px rgba(15,23,42,0.22)', overflow: 'hidden',
            }}>
                <div style={{
                    padding: '22px 28px 18px', borderBottom: `1px solid ${C.slate100}`,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                            <div style={{
                                width: 34, height: 34, borderRadius: 10,
                                background: C.redLight, display: 'flex', alignItems: 'center',
                                justifyContent: 'center', fontSize: 16, color: C.redDark, fontWeight: 700,
                            }}>✕</div>
                            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: C.slate800 }}>Reject Report</h2>
                        </div>
                        {reportName && <p style={{ margin: 0, fontSize: 12, color: C.slate400, paddingLeft: 44 }}>{reportName}</p>}
                    </div>
                    <button onClick={onClose} style={{
                        width: 32, height: 32, borderRadius: 8, border: `1px solid ${C.slate200}`,
                        background: C.white, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', fontSize: 14, color: C.slate500, fontWeight: 700,
                    }}>✕</button>
                </div>
                <div style={{ padding: '22px 28px' }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.slate700, marginBottom: 6 }}>
                        Rejection Reason <span style={{ color: C.red }}>*</span>
                    </label>
                    <textarea
                        value={reason}
                        onChange={e => { setReason(e.target.value); setError('') }}
                        onFocus={() => setFocused(true)}
                        onBlur={() => setFocused(false)}
                        placeholder="Explain why this report is being rejected..."
                        rows={4}
                        style={{
                            width: '100%', padding: '11px 14px', borderRadius: 10, resize: 'none',
                            border: `1px solid ${error ? C.redBorder : focused ? C.indigo : C.slate300}`,
                            boxShadow: focused ? `0 0 0 3px ${error ? '#fee2e2' : C.indigoLight}` : 'none',
                            fontSize: 14, color: C.slate800, fontFamily: 'inherit',
                            outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s, box-shadow 0.2s',
                        }}
                    />
                    {error && <p style={{ margin: '5px 0 0', fontSize: 12, color: C.red }}>{error}</p>}
                </div>
                <div style={{ display: 'flex', gap: 10, padding: '0 28px 22px' }}>
                    <button onClick={onClose} disabled={submitting} style={{
                        flex: 1, padding: '11px 0', borderRadius: 10, border: `1px solid ${C.slate300}`,
                        background: C.white, fontSize: 14, fontWeight: 600, color: C.slate600,
                        cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: submitting ? 0.6 : 1,
                    }}>Cancel</button>
                    <button onClick={handleSubmit} disabled={submitting} style={{
                        flex: 1, padding: '11px 0', borderRadius: 10, border: 'none',
                        background: submitting ? C.slate400 : C.redDark, fontSize: 14, fontWeight: 700,
                        color: C.white, cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                        boxShadow: submitting ? 'none' : '0 4px 14px rgba(220,38,38,0.35)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'background 0.2s',
                    }}>
                        {submitting && (
                            <span style={{
                                width: 13, height: 13, borderRadius: '50%',
                                border: '2px solid rgba(255,255,255,0.35)', borderTopColor: C.white,
                                animation: 'spin 0.7s linear infinite', display: 'inline-block',
                            }} />
                        )}
                        {submitting ? 'Rejecting...' : 'Submit Rejection'}
                    </button>
                </div>
            </div>
        </div>
    )
}

/* ─── Pagination ── */
const Pagination = ({ currentPage, totalPages, pageSize, onPageChange, onPageSizeChange, totalItems }) => {
    if (totalPages <= 1 && totalItems <= PAGE_SIZE_OPTIONS[0]) return null

    const getPages = () => {
        const pages = []
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i)
        } else {
            pages.push(1)
            if (currentPage > 3) pages.push('...')
            for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i)
            if (currentPage < totalPages - 2) pages.push('...')
            pages.push(totalPages)
        }
        return pages
    }

    const btnBase = {
        minWidth: 36, height: 36, borderRadius: 8, border: `1px solid ${C.slate200}`,
        background: C.white, fontSize: 13, fontWeight: 600, cursor: 'pointer',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'inherit', transition: 'all 0.15s', color: C.slate600,
    }

    return (
        <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 24px', borderTop: `1px solid ${C.slate100}`, flexWrap: 'wrap', gap: 12,
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 13, color: C.slate500, whiteSpace: 'nowrap' }}>Rows per page:</span>
                <select value={pageSize} onChange={e => onPageSizeChange(Number(e.target.value))} style={{
                    padding: '6px 10px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                    border: `1px solid ${C.slate200}`, background: C.white,
                    color: C.slate700, cursor: 'pointer', outline: 'none', fontFamily: 'inherit',
                }}>
                    {PAGE_SIZE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <span style={{ fontSize: 13, color: C.slate400, whiteSpace: 'nowrap' }}>
                    {((currentPage - 1) * pageSize) + 1}–{Math.min(currentPage * pageSize, totalItems)} of {totalItems}
                </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}
                    style={{ ...btnBase, opacity: currentPage === 1 ? 0.4 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}>
                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                {getPages().map((p, i) =>
                    p === '...' ? (
                        <span key={`e-${i}`} style={{ minWidth: 36, textAlign: 'center', color: C.slate400, fontSize: 13 }}>…</span>
                    ) : (
                        <button key={p} onClick={() => onPageChange(p)} style={{
                            ...btnBase,
                            background: currentPage === p ? C.indigo : C.white,
                            color: currentPage === p ? C.white : C.slate600,
                            border: `1px solid ${currentPage === p ? C.indigo : C.slate200}`,
                            boxShadow: currentPage === p ? '0 2px 8px rgba(79,70,229,0.3)' : 'none',
                        }}>{p}</button>
                    )
                )}
                <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}
                    style={{ ...btnBase, opacity: currentPage === totalPages ? 0.4 : 1, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}>
                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>
        </div>
    )
}

/* ─── Main ── */
const ManagerSalesReports = () => {
    const [reports, setReports] = useState([])
    const [loading, setLoading] = useState(true)
    const [actioningId, setActioningId] = useState(null)
    const [search, setSearch] = useState('')
    const [filterStatus, setFilterStatus] = useState('')
    const [searchFocused, setSearchFocused] = useState(false)
    const [hoveredRow, setHoveredRow] = useState(null)
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [rejectModal, setRejectModal] = useState({ open: false, reportId: null, reportName: '' })
    const [detailModal, setDetailModal] = useState({ open: false, report: null })
    const [toast, setToast] = useState({ message: '', type: 'success', visible: false })

    const showToast = useCallback((message, type = 'success') => {
        setToast({ message, type, visible: true })
        setTimeout(() => setToast(t => ({ ...t, visible: false })), 3500)
    }, [])

    const fetchReports = useCallback(async () => {
        setLoading(true)
        try {
            const { data } = await API.get('/getManagerLeads')
            setReports(data.leads || [])
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to fetch reports', 'error')
        } finally {
            setLoading(false)
        }
    }, [showToast])

    useEffect(() => { fetchReports() }, [fetchReports])

    const stats = useMemo(() => ({
        total: reports.length,
        pending: reports.filter(r => r.status === 'sent_to_manager').length,
        approved: reports.filter(r => r.status === 'approved').length,
        rejected: reports.filter(r => r.status === 'rejected').length,
    }), [reports])

    const filtered = useMemo(() => {
        const q = search.toLowerCase()
        return reports.filter(r => {
            const matchSearch = !q ||
                r.client_name?.toLowerCase().includes(q) ||
                r.country?.toLowerCase().includes(q) ||
                r.services?.toLowerCase().includes(q) ||
                r.client_email?.toLowerCase().includes(q) ||
                r.marketer?.toLowerCase().includes(q)
            const matchStatus = !filterStatus || r.status === filterStatus
            return matchSearch && matchStatus
        })
    }, [reports, search, filterStatus])

    useEffect(() => { setCurrentPage(1) }, [search, filterStatus, pageSize])

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
    const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

    const handleStatClick = (key) => setFilterStatus(prev => prev === key ? '' : key)

    /* ── Open detail modal (sync with latest report data) ── */
    const openDetail = (report) => {
        setDetailModal({ open: true, report })
    }

    /* ── Keep detail modal in sync when reports update ── */
    useEffect(() => {
        if (detailModal.open && detailModal.report) {
            const updated = reports.find(r => r._id === detailModal.report._id)
            if (updated) setDetailModal(d => ({ ...d, report: updated }))
        }
    }, [reports])

    const handleApprove = async (e, id) => {
        e.stopPropagation()  // don't open detail modal
        setActioningId(id)
        try {
            const { data } = await API.put(`/updateLeadStatus/${id}`, { status: 'approved' })
            setReports(prev => prev.map(r => r._id === id ? { ...r, status: 'approved', action_date: data.lead?.action_date } : r))
            showToast('Report approved successfully')
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to approve', 'error')
        } finally {
            setActioningId(null)
        }
    }

    const openReject = (e, report) => {
        e.stopPropagation()  // don't open detail modal
        setRejectModal({ open: true, reportId: report._id, reportName: report.client_name })
    }

    const handleRejectSubmit = async (reason) => {
        setActioningId(rejectModal.reportId)
        try {
            const { data } = await API.put(`/updateLeadStatus/${rejectModal.reportId}`, { status: 'rejected', reject_reason: reason })
            setReports(prev => prev.map(r =>
                r._id === rejectModal.reportId
                    ? { ...r, status: 'rejected', reject_reason: reason, action_date: data.lead?.action_date }
                    : r
            ))
            setRejectModal({ open: false, reportId: null, reportName: '' })
            showToast('Report rejected')
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to reject', 'error')
        } finally {
            setActioningId(null)
        }
    }

    const isPending = (r) => r.status === 'sent_to_manager'

    return (
        <DashboardLayout>
            <style>{`
                @keyframes spin    { to { transform: rotate(360deg); } }
                @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:0.4} }
                @keyframes slideUp { from{transform:translateY(20px);opacity:0} to{transform:translateY(0);opacity:1} }
                @keyframes modalIn { from{transform:scale(0.96) translateY(8px);opacity:0} to{transform:scale(1) translateY(0);opacity:1} }
                .report-row { cursor: pointer; }
                .report-row:hover td { background: #f8f9ff !important; }
            `}</style>

            <div style={{ minHeight: '100vh', background: C.pageBg, padding: 24, display: 'flex', flexDirection: 'column', gap: 20, boxSizing: 'border-box' }}>

                {/* Stat Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                    <StatCard label="Total Reports" value={stats.total} topColor="#3b82f6" loading={loading} active={filterStatus === ''} onClick={() => setFilterStatus('')} />
                    <StatCard label="Pending" value={stats.pending} topColor="#f59e0b" loading={loading} active={filterStatus === 'sent_to_manager'} onClick={() => handleStatClick('sent_to_manager')} />
                    <StatCard label="Approved" value={stats.approved} topColor="#10b981" loading={loading} active={filterStatus === 'approved'} onClick={() => handleStatClick('approved')} />
                    <StatCard label="Rejected" value={stats.rejected} topColor="#ef4444" loading={loading} active={filterStatus === 'rejected'} onClick={() => handleStatClick('rejected')} />
                </div>

                {/* Main Panel */}
                <div style={{ background: C.white, borderRadius: 20, border: `1px solid ${C.slate100}`, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>

                    {/* Toolbar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 24px', borderBottom: `1px solid ${C.slate100}`, flexWrap: 'wrap' }}>
                        <div style={{ position: 'relative' }}>
                            <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', fontSize: 15 }}>🔍</span>
                            <input
                                type="text" placeholder="Search by name, email or country..."
                                value={search} onChange={e => setSearch(e.target.value)}
                                onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)}
                                style={{
                                    paddingLeft: 38, paddingRight: 16, paddingTop: 10, paddingBottom: 10,
                                    width: 300, borderRadius: 50,
                                    border: `1px solid ${searchFocused ? C.indigo : C.slate300}`,
                                    boxShadow: searchFocused ? `0 0 0 3px ${C.indigoLight}` : 'none',
                                    fontSize: 14, color: C.slate700, background: C.white,
                                    outline: 'none', fontFamily: 'inherit', transition: 'all 0.2s',
                                }}
                            />
                        </div>
                        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{
                            padding: '10px 14px', borderRadius: 8, border: `1px solid ${C.slate300}`,
                            background: C.white, fontSize: 14, color: C.slate600, outline: 'none',
                            fontFamily: 'inherit', cursor: 'pointer',
                        }}>
                            <option value="">All</option>
                            <option value="sent_to_manager">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                        </select>

                        <div style={{ flex: 1 }} />
                        <button onClick={fetchReports} disabled={loading} style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderRadius: 10,
                            border: `1px solid ${C.slate200}`, background: C.white, color: C.slate600, fontSize: 13,
                            fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: loading ? 0.6 : 1,
                        }}>
                            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                style={{ animation: loading ? 'spin 0.7s linear infinite' : 'none' }}>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Refresh
                        </button>
                        <span style={{ fontSize: 14, color: C.slate500, fontWeight: 500, whiteSpace: 'nowrap' }}>
                            {filtered.length} report{filtered.length !== 1 ? 's' : ''}
                        </span>
                    </div>

                    {/* Table */}
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                            <thead>
                                <tr style={{ borderBottom: `1px solid ${C.slate100}` }}>
                                    {['SR NO.', 'DATE', 'CLIENT NAME', 'SERVICE', 'COUNTRY', 'STATUS', 'ACTIONS'].map((h, i) => (
                                        <th key={h} style={{
                                            padding: '12px 24px', textAlign: i === 6 ? 'right' : 'left',
                                            fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
                                            color: C.slate400, textTransform: 'uppercase', whiteSpace: 'nowrap',
                                        }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                                ) : paginated.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} style={{ padding: '72px 24px', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                                                <div style={{ width: 64, height: 64, borderRadius: 18, background: C.slate100, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>📄</div>
                                                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: C.slate500 }}>No reports found</p>
                                                <p style={{ margin: 0, fontSize: 12, color: C.slate400 }}>
                                                    {filterStatus ? 'Try clearing the filter' : 'Reports sent by employees will appear here'}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    paginated.map((report, idx) => {
                                        const pending = isPending(report)
                                        const actioning = actioningId === report._id
                                        const srNo = (currentPage - 1) * pageSize + idx + 1

                                        return (
                                            <tr
                                                key={report._id}
                                                className="report-row"
                                                onClick={() => openDetail(report)}
                                                onMouseEnter={() => setHoveredRow(report._id)}
                                                onMouseLeave={() => setHoveredRow(null)}
                                                style={{ borderBottom: `1px solid ${C.slate50}`, transition: 'background 0.15s' }}
                                            >
                                                <td style={{ padding: '16px 24px' }}>
                                                    <span style={{
                                                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                                        width: 30, height: 30, borderRadius: 8,
                                                        background: C.slate100, fontSize: 12, fontWeight: 700, color: C.slate500,
                                                    }}>
                                                        {String(srNo).padStart(2, '0')}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '16px 24px', color: C.slate600, fontWeight: 500, whiteSpace: 'nowrap' }}>
                                                    {fmtDate(report.date || report.createdAt)}
                                                </td>
                                                <td style={{ padding: '16px 24px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                        <div style={{
                                                            width: 40, height: 40, borderRadius: '50%',
                                                            background: getAvatarColor(report.client_name),
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            color: C.white, fontSize: 14, fontWeight: 700, flexShrink: 0,
                                                        }}>
                                                            {getInitials(report.client_name)}
                                                        </div>
                                                        <div>
                                                            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.slate800 }}>{report.client_name}</p>
                                                            <p style={{ margin: 0, fontSize: 12, color: C.slate400 }}>{report.client_email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '16px 24px', color: C.slate600 }}>{report.services || '—'}</td>
                                                <td style={{ padding: '16px 24px', color: C.slate600 }}>{report.country || '—'}</td>
                                                <td style={{ padding: '16px 24px' }}>
                                                    {/* Clean badge only — no reject reason text here */}
                                                    <StatusBadge status={report.status} />
                                                </td>
                                                <td style={{ padding: '16px 24px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                                                        {pending ? (
                                                            <>
                                                                <button
                                                                    onClick={(e) => handleApprove(e, report._id)}
                                                                    disabled={actioning}
                                                                    style={{
                                                                        display: 'inline-flex', alignItems: 'center', gap: 5,
                                                                        padding: '6px 14px', borderRadius: 8,
                                                                        border: `1px solid ${C.emeraldBorder}`,
                                                                        background: actioning ? C.slate100 : C.emeraldLight,
                                                                        color: actioning ? C.slate400 : C.emerald,
                                                                        fontSize: 12, fontWeight: 700,
                                                                        cursor: actioning ? 'not-allowed' : 'pointer',
                                                                        fontFamily: 'inherit', transition: 'all 0.15s',
                                                                    }}
                                                                >
                                                                    {actioning
                                                                        ? <span style={{ width: 11, height: 11, borderRadius: '50%', border: `2px solid ${C.slate300}`, borderTopColor: C.emerald, animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                                                                        : <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                                                    }
                                                                    Approve
                                                                </button>
                                                                <button
                                                                    onClick={(e) => openReject(e, report)}
                                                                    disabled={actioning}
                                                                    style={{
                                                                        display: 'inline-flex', alignItems: 'center', gap: 5,
                                                                        padding: '6px 14px', borderRadius: 8,
                                                                        border: `1px solid ${C.redBorder}`,
                                                                        background: actioning ? C.slate100 : C.redLight,
                                                                        color: actioning ? C.slate400 : C.redDark,
                                                                        fontSize: 12, fontWeight: 700,
                                                                        cursor: actioning ? 'not-allowed' : 'pointer',
                                                                        fontFamily: 'inherit', transition: 'all 0.15s',
                                                                    }}
                                                                >
                                                                    <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                                                                    Reject
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <span style={{ fontSize: 12, color: C.slate400, fontStyle: 'italic' }}>
                                                                {report.status === 'approved' ? '✓ Approved' : '✕ Rejected'}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {!loading && filtered.length > 0 && (
                        <Pagination
                            currentPage={currentPage} totalPages={totalPages}
                            pageSize={pageSize} totalItems={filtered.length}
                            onPageChange={setCurrentPage}
                            onPageSizeChange={(s) => { setPageSize(s); setCurrentPage(1) }}
                        />
                    )}
                </div>
            </div>

            {/* Detail Modal */}
            <DetailModal
                open={detailModal.open}
                report={detailModal.report}
                onClose={() => setDetailModal({ open: false, report: null })}
            />

            {/* Reject Modal */}
            <RejectModal
                open={rejectModal.open}
                onClose={() => !actioningId && setRejectModal({ open: false, reportId: null, reportName: '' })}
                onSubmit={handleRejectSubmit}
                submitting={!!actioningId}
                reportName={rejectModal.reportName}
            />

            <Toast message={toast.message} type={toast.type} visible={toast.visible} />
        </DashboardLayout>
    )
}

export default ManagerSalesReports