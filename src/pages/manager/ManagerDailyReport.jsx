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
    pending: { label: 'Pending', color: '#d97706', bg: '#fef3c7' },
    completed: { label: 'Completed', color: '#059669', bg: '#ecfdf5' },
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

const isPdfFile = (file = "") =>
    file.toLowerCase().endsWith(".pdf")

/* ─── Detail Modal ── */
const DetailModal = ({ open, report, onClose, setPreviewImage }) => {
    if (!open || !report) return null

    const status = STATUS[report.status] || STATUS.draft
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
                    <div>
                        <h2 style={{
                            margin: 0,
                            fontSize: 22,
                            fontWeight: 800,
                            color: C.slate800,
                        }}>
                            Daily Report Details
                        </h2>

                        <p style={{
                            margin: '4px 0 0',
                            fontSize: 13,
                            color: C.slate400,
                        }}>
                            Complete report information
                        </p>
                    </div>
                    <button onClick={onClose} style={{
                        width: 32, height: 32, borderRadius: 8,
                        border: `1px solid ${C.slate200}`, background: C.white,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', fontSize: 14, color: C.slate500, fontWeight: 700, flexShrink: 0,
                    }}>✕</button>
                </div>

                {/* ── Details Grid ── */}
                <div style={{
                    padding: '20px 28px 28px',
                    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 24px',
                }}>
                    <Detail label="Task Name" value={report.task_name} />

                    <Detail label="Day" value={report.day} />

                    <Detail
                        label="Date"
                        value={fmtDate(report.date || report.createdAt)}
                    />

                    <Detail
                        label="Status"
                        value={report.status}
                    />

                    {report.message && (
                        <Detail
                            label="Message"
                            value={report.message}
                            fullWidth
                        />
                    )}

                    {report.file && (
                        <div
                            style={{
                                gridColumn: 'span 2',
                                marginTop: 8,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 12,
                            }}
                        >
                            <span
                                style={{
                                    fontSize: 11,
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.08em',
                                    color: C.slate400,
                                }}
                            >
                                Attachment
                            </span>

                            {isPdfFile(report.file) ? (
                                <div
                                    style={{
                                        borderRadius: 18,
                                        overflow: 'hidden',
                                        border: `1px solid ${C.slate200}`,
                                        background: '#fff',
                                    }}
                                >
                                    {/* PDF HEADER */}
                                    <div
                                        style={{
                                            padding: '12px 16px',
                                            borderBottom: `1px solid ${C.slate200}`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            background: C.slate50,
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 8,
                                                fontSize: 14,
                                                fontWeight: 700,
                                                color: C.slate700,
                                            }}
                                        >
                                            📄 PDF File
                                        </div>

                                        <a
                                            href={`http://localhost:5000/${report.file.replace(/\\/g, "/")}`}
                                            download
                                            target="_blank"
                                            rel="noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                            style={{
                                                padding: '8px 14px',
                                                borderRadius: 8,
                                                background: C.indigo,
                                                color: '#fff',
                                                textDecoration: 'none',
                                                fontSize: 12,
                                                fontWeight: 700,
                                            }}
                                        >
                                            Download
                                        </a>
                                    </div>

                                    {/* PDF PREVIEW */}
                                    <iframe
                                        src={`http://localhost:5000/${report.file.replace(/\\/g, "/")}`}
                                        title="PDF Preview"
                                        style={{
                                            width: '100%',
                                            height: 500,
                                            border: 'none',
                                            display: 'block',
                                        }}
                                    />
                                </div>
                            ) : (
                                <div
                                    style={{
                                        padding: 10,
                                        borderRadius: 18,
                                        border: `1px solid ${C.slate200}`,
                                        background: C.slate50,
                                        width: 'fit-content',
                                    }}
                                >
                                    <img
                                        src={`http://localhost:5000/${report.file.replace(/\\/g, "/")}`}
                                        alt="Report File"
                                        onClick={() =>
                                            setPreviewImage(
                                                `http://localhost:5000/${report.file.replace(/\\/g, "/")}`
                                            )
                                        }
                                        style={{
                                            width: 220,
                                            height: 220,
                                            borderRadius: 14,
                                            objectFit: 'cover',
                                            cursor: 'pointer',
                                            display: 'block',
                                            boxShadow: '0 4px 18px rgba(0,0,0,0.14)',
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    )}

                </div>

                {/* ── Footer ── */}
                <div style={{
                    padding: '0 28px 24px',
                    display: 'flex',
                    justifyContent: 'flex-end',
                }}>
                    <button onClick={onClose} style={{
                        padding: '10px 28px', borderRadius: 10,
                        border: `1px solid ${C.slate300}`, background: C.white,
                        fontSize: 14, fontWeight: 600, color: C.slate600,
                        cursor: 'pointer', fontFamily: 'inherit',
                    }}>Close</button>
                </div>
            </div>
        </div >
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
const ManagerDailyReport = () => {
    const [reports, setReports] = useState([])
    const [loading, setLoading] = useState(true)
    const [actioningId, setActioningId] = useState(null)
    const [search, setSearch] = useState('')
    const [filterStatus, setFilterStatus] = useState('')
    const [searchFocused, setSearchFocused] = useState(false)
    const [hoveredRow, setHoveredRow] = useState(null)
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [detailModal, setDetailModal] = useState({ open: false, report: null })
    const [toast, setToast] = useState({ message: '', type: 'success', visible: false })
    const [previewImage, setPreviewImage] = useState('')

    const showToast = useCallback((message, type = 'success') => {
        setToast({ message, type, visible: true })
        setTimeout(() => setToast(t => ({ ...t, visible: false })), 3500)
    }, [])

    const fetchReports = useCallback(async () => {
        setLoading(true)
        try {
            const { data } = await API.get('/getAllDailyReports')
            setReports(data.data || [])
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to fetch reports', 'error')
        } finally {
            setLoading(false)
        }
    }, [showToast])

    useEffect(() => { fetchReports() }, [fetchReports])

    const stats = useMemo(() => ({
        total: reports.length,
        pending: reports.filter(r => r.status === 'pending').length,
        completed: reports.filter(r => r.status === 'completed').length,
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                    <StatCard
                        label="Total Reports"
                        value={stats.total}
                        topColor="#3b82f6"
                        loading={loading}
                        active={filterStatus === ''}
                        onClick={() => setFilterStatus('')}
                    />

                    <StatCard
                        label="Pending"
                        value={stats.pending}
                        topColor="#f59e0b"
                        loading={loading}
                        active={filterStatus === 'pending'}
                        onClick={() => handleStatClick('pending')}
                    />

                    <StatCard
                        label="Completed"
                        value={stats.completed}
                        topColor="#10b981"
                        loading={loading}
                        active={filterStatus === 'completed'}
                        onClick={() => handleStatClick('completed')}
                    />
                </div>

                {/* Main Panel */}
                <div style={{ background: C.white, borderRadius: 20, border: `1px solid ${C.slate100}`, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>

                    {/* Toolbar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 24px', borderBottom: `1px solid ${C.slate100}`, flexWrap: 'wrap' }}>
                        <div style={{ position: 'relative' }}>
                            <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', fontSize: 15 }}>🔍</span>
                            <input
                                type="text" placeholder="Search by task name or day..."
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
                            <option value="pending">Pending</option>
                            <option value="completed">Completed</option>
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
                                    {['SR NO.', 'TASK NAME', 'DAY', 'DATE', 'STATUS', 'FILE'].map((h, i) => (
                                        <th key={h} style={{
                                            padding: '12px 24px', textAlign: i === 5 ? 'right' : 'left',
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
                                                <td style={{
                                                    padding: '16px 24px',
                                                    fontWeight: 700,
                                                    color: C.slate800,
                                                }}>
                                                    {report.task_name || '—'}
                                                </td>

                                                <td style={{
                                                    padding: '16px 24px',
                                                    color: C.slate600,
                                                    fontWeight: 500,
                                                }}>
                                                    {report.day || '—'}
                                                </td>

                                                <td style={{
                                                    padding: '16px 24px',
                                                    color: C.slate600,
                                                    fontWeight: 500,
                                                    whiteSpace: 'nowrap',
                                                }}>
                                                    {fmtDate(report.date || report.createdAt)}
                                                </td>

                                                <td style={{ padding: '16px 24px' }}>
                                                    <StatusBadge status={report.status} />
                                                </td>

                                                <td style={{
                                                    padding: '12px 24px',
                                                    width: 110,
                                                }}
                                                >
                                                    {report.file ? (
                                                        isPdfFile(report.file) ? (
                                                            <div
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    window.open(
                                                                        `http://localhost:5000/${report.file.replace(/\\/g, "/")}`,
                                                                        "_blank"
                                                                    )
                                                                }}
                                                                style={{
                                                                    width: 58,
                                                                    height: 58,
                                                                    borderRadius: 12,
                                                                    border: `1px solid ${C.slate200}`,
                                                                    background: '#fff',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    cursor: 'pointer',
                                                                    boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
                                                                    fontSize: 24,
                                                                }}
                                                            >
                                                                📄
                                                            </div>
                                                        ) : (
                                                            <img
                                                                src={`http://localhost:5000/${report.file.replace(/\\/g, "/")}`}
                                                                alt="Report"
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    setPreviewImage(
                                                                        `http://localhost:5000/${report.file.replace(/\\/g, "/")}`
                                                                    )
                                                                }}
                                                                style={{
                                                                    width: 58,
                                                                    height: 58,
                                                                    borderRadius: 12,
                                                                    objectFit: 'cover',
                                                                    cursor: 'pointer',
                                                                    border: `1px solid ${C.slate200}`,
                                                                    boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
                                                                    transition: '0.2s',
                                                                }}
                                                            />
                                                        )
                                                    ) : (
                                                        <span style={{ color: C.slate400 }}>
                                                            No File
                                                        </span>
                                                    )}
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
                setPreviewImage={setPreviewImage}
                onClose={() => setDetailModal({ open: false, report: null })}
            />

            {previewImage && (
                <div
                    onClick={() => setPreviewImage('')}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.75)',
                        backdropFilter: 'blur(8px)',
                        zIndex: 9999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 20,
                    }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            position: 'relative',
                            maxWidth: '90vw',
                            maxHeight: '90vh',
                        }}
                    >
                        <button
                            onClick={() => setPreviewImage('')}
                            style={{
                                position: 'absolute',
                                top: -16,
                                right: -16,
                                width: 38,
                                height: 38,
                                borderRadius: '50%',
                                border: 'none',
                                background: '#fff',
                                color: '#111',
                                fontSize: 18,
                                fontWeight: 700,
                                cursor: 'pointer',
                                boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
                                zIndex: 10,
                            }}
                        >
                            ✕
                        </button>

                        <img
                            src={previewImage}
                            alt="Preview"
                            style={{
                                maxWidth: '90vw',
                                maxHeight: '90vh',
                                borderRadius: 20,
                                objectFit: 'contain',
                                boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
                            }}
                        />
                    </div>
                </div>
            )}

            <Toast message={toast.message} type={toast.type} visible={toast.visible} />
        </DashboardLayout>
    )
}

export default ManagerDailyReport