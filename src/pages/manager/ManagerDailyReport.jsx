import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import API from '../../services/api'

// ── Constants ─────────────────────────────────────────────────────────────────
const BASE_URL = 'http://localhost:5000'

const C = {
    indigo: '#4f46e5', indigoDark: '#4338ca', indigoLight: '#eef2ff', indigoBorder: '#c7d2fe',
    red: '#ef4444', redLight: '#fef2f2',
    emerald: '#059669', emeraldLight: '#ecfdf5',
    blue: '#2563eb', blueLight: '#eff6ff',
    amber: '#d97706', amberLight: '#fffbeb',
    slate50: '#f8fafc', slate100: '#f1f5f9', slate200: '#e2e8f0', slate300: '#cbd5e1',
    slate400: '#94a3b8', slate500: '#64748b', slate600: '#475569', slate700: '#334155',
    slate800: '#1e293b', slate900: '#0f172a', white: '#ffffff', pageBg: '#f1f5f9',
}

const STATUS = {
    pending: { label: 'Pending', color: '#92400e', bg: '#fef3c7', dot: '#d97706' },
    completed: { label: 'Completed', color: '#065f46', bg: '#d1fae5', dot: '#059669' },
}

const AVATAR_COLORS = ['#7c3aed', '#4f46e5', '#2563eb', '#db2777', '#d97706', '#0d9488', '#e11d48', '#0891b2', '#65a30d']
const PAGE_SIZE_OPTIONS = [10, 25, 50]

const getAvatarColor = (name = '') => AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length]
const getInitials = (name = '') => name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?'
const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
const isPdf = (f = '') => f.toLowerCase().endsWith('.pdf')
const isImage = (f = '') => /\.(png|jpg|jpeg|gif|webp)$/i.test(f)
const fixPath = (f = '') => `${BASE_URL}/${f.replace(/\\/g, '/')}`

// ── Injected global styles ────────────────────────────────────────────────────
const STYLES = `
@keyframes mgr-spin    { to { transform: rotate(360deg); } }
@keyframes mgr-pulse   { 0%,100%{opacity:1} 50%{opacity:0.4} }
@keyframes mgr-slideUp { from{transform:translateY(16px);opacity:0} to{transform:translateY(0);opacity:1} }
@keyframes mgr-fadeIn  { from{opacity:0} to{opacity:1} }
@keyframes mgr-popIn   { from{transform:scale(0.94) translateY(10px);opacity:0} to{transform:scale(1) translateY(0);opacity:1} }
@keyframes mgr-rowIn   { from{transform:translateX(-6px);opacity:0} to{transform:translateX(0);opacity:1} }

.mgr-row { transition: background 0.15s; }
.mgr-row:hover { background: rgba(79,70,229,0.04) !important; cursor: pointer; }
.mgr-row:hover .mgr-avatar { transform: scale(1.08); }
.mgr-avatar { transition: transform 0.15s; }
.mgr-file-thumb:hover { transform: scale(1.14); box-shadow: 0 4px 14px rgba(0,0,0,0.14) !important; }
.mgr-dept-tab:hover:not(.active) { border-color: #818cf8 !important; color: #4f46e5 !important; transform: translateY(-1px); }
.mgr-emp-tab:hover:not(.active)  { border-color: #a5b4fc !important; transform: translateY(-1px); }
.mgr-stat-card:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.1) !important; }
.mgr-btn:hover:not(:disabled) { background: ${C.slate100} !important; }
.mgr-btn:active:not(:disabled) { transform: scale(0.97); }
`

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ message, type, visible }) {
    if (!visible) return null
    return (
        <div style={{
            position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
            padding: '14px 20px', borderRadius: 12,
            background: type === 'error' ? C.red : C.emerald,
            color: C.white, fontSize: 14, fontWeight: 600,
            boxShadow: '0 8px 28px rgba(0,0,0,0.18)',
            display: 'flex', alignItems: 'center', gap: 10,
            animation: 'mgr-slideUp 0.3s ease', maxWidth: 360,
        }}>
            <span style={{ fontSize: 16 }}>{type === 'error' ? '✕' : '✓'}</span>
            {message}
        </div>
    )
}

// ── StatusBadge ───────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
    const s = STATUS[status] || { label: status, color: C.slate600, bg: C.slate100, dot: C.slate400 }
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '3px 10px', borderRadius: 20,
            background: s.bg, color: s.color,
            fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
        }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
            {s.label}
        </span>
    )
}

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ name, size = 34 }) {
    return (
        <div className="mgr-avatar" style={{
            width: size, height: size, borderRadius: '50%', flexShrink: 0,
            background: getAvatarColor(name),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: size * 0.35, fontWeight: 600, color: C.white,
        }}>
            {getInitials(name)}
        </div>
    )
}

// ── StatCard ──────────────────────────────────────────────────────────────────
function StatCard({ label, value, accent, loading, active, onClick }) {
    return (
        <div className="mgr-stat-card" onClick={onClick} style={{
            background: C.white, borderRadius: 16, padding: '22px 24px',
            borderTop: `4px solid ${accent}`,
            borderRight: `1px solid ${active ? accent : C.slate200}`,
            borderBottom: `1px solid ${active ? accent : C.slate200}`,
            borderLeft: `1px solid ${active ? accent : C.slate200}`,
            boxShadow: active ? `0 0 0 3px ${accent}22` : '0 1px 4px rgba(0,0,0,0.06)',
            cursor: 'pointer', transition: 'all 0.2s', flex: 1, minWidth: 0,
        }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.slate400, margin: '0 0 8px' }}>
                {label}
            </p>
            {loading
                ? <div style={{ width: 60, height: 40, borderRadius: 8, background: C.slate100, animation: 'mgr-pulse 1.5s ease infinite' }} />
                : <p style={{ fontSize: 40, fontWeight: 900, color: C.slate900, margin: 0, lineHeight: 1 }}>{value}</p>
            }
        </div>
    )
}

// ── SkeletonRow ───────────────────────────────────────────────────────────────
function SkeletonRow() {
    return (
        <tr style={{ borderBottom: `1px solid ${C.slate50}` }}>
            {[28, 160, 180, 90, 100, 90, 80, 50].map((w, i) => (
                <td key={i} style={{ padding: '16px 20px' }}>
                    <div style={{ height: 13, width: w, borderRadius: 6, background: C.slate100, animation: 'mgr-pulse 1.5s ease infinite' }} />
                </td>
            ))}
        </tr>
    )
}

// ── Detail Modal ──────────────────────────────────────────────────────────────
function DetailModal({ report, onClose, onStatusChange, updating }) {
    if (!report) return null

    const file = report.file || ''

    return (
        <div
            onClick={onClose}
            style={{
                position: 'fixed', inset: 0, zIndex: 60,
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
                background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(6px)',
                animation: 'mgr-fadeIn 0.2s ease',
            }}
        >
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    background: C.white, borderRadius: 20, width: '100%', maxWidth: 540,
                    maxHeight: '92vh', overflowY: 'auto',
                    boxShadow: '0 32px 80px rgba(15,23,42,0.28)',
                    animation: 'mgr-popIn 0.22s ease',
                    border: `1px solid ${C.slate200}`,
                }}
            >
                {/* Header */}
                <div style={{
                    padding: '20px 24px 16px',
                    borderBottom: `1px solid ${C.slate100}`,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Avatar name={report.user?.name || ''} size={42} />
                        <div>
                            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.slate900 }}>
                                {report.task_name}
                            </h2>
                            <p style={{ margin: '3px 0 0', fontSize: 12, color: C.slate400 }}>
                                {report.user?.name} · {report.user?.department}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            width: 30, height: 30, borderRadius: 8,
                            border: `1px solid ${C.slate200}`, background: C.white,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', fontSize: 16, color: C.slate500, flexShrink: 0,
                            transition: 'background 0.15s',
                        }}
                        onMouseOver={e => e.currentTarget.style.background = C.slate100}
                        onMouseOut={e => e.currentTarget.style.background = C.white}
                    >✕</button>
                </div>

                {/* Body */}
                <div style={{ padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: 0 }}>

                    {/* File Preview */}
                    {file && (
                        <div style={{ marginBottom: 20 }}>
                            {isPdf(file) ? (
                                <div style={{ borderRadius: 12, overflow: 'hidden', border: `1px solid ${C.slate200}` }}>
                                    <div style={{
                                        padding: '10px 14px', display: 'flex', alignItems: 'center',
                                        justifyContent: 'space-between', background: C.slate50,
                                        borderBottom: `1px solid ${C.slate200}`,
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                            <svg width="15" height="15" fill="none" stroke={C.slate700} viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                            </svg>
                                            <span style={{ fontSize: 13, fontWeight: 600, color: C.slate700 }}>PDF Attachment</span>
                                        </div>
                                        <a href={fixPath(file)} download target="_blank" rel="noreferrer"
                                            style={{ padding: '6px 12px', borderRadius: 7, background: C.indigo, color: C.white, fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
                                            Download
                                        </a>
                                    </div>
                                    <iframe src={fixPath(file)} title="PDF Preview" style={{ width: '100%', height: 320, border: 'none', display: 'block' }} />
                                </div>
                            ) : isImage(file) ? (
                                <img src={fixPath(file)} alt="Attachment" style={{ width: '100%', maxHeight: 220, objectFit: 'cover', borderRadius: 12, border: `1px solid ${C.slate200}` }} />
                            ) : (
                                <div style={{ padding: '12px 14px', borderRadius: 10, border: `1px solid ${C.slate200}`, background: C.slate50, fontSize: 13, color: C.slate700, display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <svg width="16" height="16" fill="none" stroke={C.slate500} viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                    </svg>
                                    {file.split('\\').pop().split('/').pop()}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Detail rows */}
                    {[
                        { label: 'Employee ID', value: report.user?.employeeId },
                        { label: 'Designation', value: report.user?.designation },
                        { label: 'Department', value: report.user?.department },
                        { label: 'Day', value: report.day },
                        { label: 'Date', value: fmtDate(report.date || report.createdAt) },
                        { label: 'Sent', value: report.sent ? 'Yes' : 'No' },
                    ].map(({ label, value }) => (
                        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${C.slate100}` }}>
                            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: C.slate400 }}>{label}</span>
                            <span style={{ fontSize: 13, fontWeight: 600, color: C.slate800 }}>{value || '—'}</span>
                        </div>
                    ))}

                    {/* Status row with update */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${C.slate100}` }}>
                        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: C.slate400 }}>Status</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <StatusBadge status={report.status} />
                            <select
                                value={report.status}
                                disabled={updating}
                                onChange={e => onStatusChange(report._id, e.target.value)}
                                onClick={e => e.stopPropagation()}
                                style={{
                                    fontSize: 12, padding: '4px 8px', borderRadius: 7,
                                    border: `1px solid ${C.slate200}`, background: C.white,
                                    color: C.slate700, cursor: 'pointer', outline: 'none',
                                    opacity: updating ? 0.5 : 1,
                                }}
                            >
                                <option value="pending">Pending</option>
                                <option value="completed">Completed</option>
                            </select>
                        </div>
                    </div>

                    {/* Message */}
                    {report.message && (
                        <div style={{ marginTop: 14 }}>
                            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: C.slate400, marginBottom: 8 }}>Message</p>
                            <div style={{ background: C.slate50, borderRadius: 10, padding: '12px 14px', fontSize: 13, color: C.slate700, lineHeight: 1.65 }}>
                                {report.message}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{ padding: '0 24px 20px', display: 'flex', justifyContent: 'flex-end' }}>
                    <button onClick={onClose} style={{
                        padding: '9px 24px', borderRadius: 9, border: `1px solid ${C.slate300}`,
                        background: C.white, fontSize: 13, fontWeight: 600, color: C.slate600,
                        cursor: 'pointer', transition: 'background 0.15s',
                    }}
                        onMouseOver={e => e.currentTarget.style.background = C.slate50}
                        onMouseOut={e => e.currentTarget.style.background = C.white}
                    >Close</button>
                </div>
            </div>
        </div>
    )
}

// ── Image Lightbox ────────────────────────────────────────────────────────────
function Lightbox({ src, onClose }) {
    if (!src) return null
    return (
        <div onClick={onClose} style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
            animation: 'mgr-fadeIn 0.2s ease',
        }}>
            <button onClick={onClose} style={{
                position: 'absolute', top: 20, right: 20,
                width: 38, height: 38, borderRadius: '50%',
                border: 'none', background: 'rgba(255,255,255,0.18)',
                color: C.white, fontSize: 20, cursor: 'pointer',
            }}>✕</button>
            <img src={src} alt="Preview" onClick={e => e.stopPropagation()} style={{
                maxWidth: '90vw', maxHeight: '88vh', borderRadius: 14,
                objectFit: 'contain', boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
                animation: 'mgr-popIn 0.2s ease',
            }} />
        </div>
    )
}

// ── Pagination ────────────────────────────────────────────────────────────────
function Pagination({ page, totalPages, pageSize, total, onPage, onSize }) {
    if (totalPages <= 1 && total <= PAGE_SIZE_OPTIONS[0]) return null

    const pages = []
    if (totalPages <= 7) {
        for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
        pages.push(1)
        if (page > 3) pages.push('...')
        for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i)
        if (page < totalPages - 2) pages.push('...')
        pages.push(totalPages)
    }

    const btnBase = {
        minWidth: 34, height: 34, borderRadius: 8, border: `1px solid ${C.slate200}`,
        background: C.white, fontSize: 13, fontWeight: 600, cursor: 'pointer',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.15s', color: C.slate600,
    }

    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderTop: `1px solid ${C.slate100}`, flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 12, color: C.slate500 }}>Rows per page:</span>
                <select value={pageSize} onChange={e => onSize(Number(e.target.value))} style={{
                    padding: '5px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                    border: `1px solid ${C.slate200}`, background: C.white, color: C.slate700,
                    cursor: 'pointer', outline: 'none',
                }}>
                    {PAGE_SIZE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <span style={{ fontSize: 12, color: C.slate400 }}>
                    {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, total)} of {total}
                </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <button onClick={() => onPage(page - 1)} disabled={page === 1}
                    style={{ ...btnBase, opacity: page === 1 ? 0.35 : 1, cursor: page === 1 ? 'not-allowed' : 'pointer' }}>‹</button>
                {pages.map((p, i) =>
                    p === '...' ? <span key={`e${i}`} style={{ minWidth: 34, textAlign: 'center', color: C.slate400, fontSize: 13 }}>…</span>
                        : <button key={p} onClick={() => onPage(p)} style={{
                            ...btnBase,
                            background: page === p ? C.indigo : C.white,
                            color: page === p ? C.white : C.slate600,
                            border: `1px solid ${page === p ? C.indigo : C.slate200}`,
                            boxShadow: page === p ? '0 2px 8px rgba(79,70,229,0.3)' : 'none',
                        }}>{p}</button>
                )}
                <button onClick={() => onPage(page + 1)} disabled={page === totalPages}
                    style={{ ...btnBase, opacity: page === totalPages ? 0.35 : 1, cursor: page === totalPages ? 'not-allowed' : 'pointer' }}>›</button>
            </div>
        </div>
    )
}

// ── Main ──────────────────────────────────────────────────────────────────────
const ManagerDailyReport = () => {
    const [reports, setReports] = useState([])
    const [loading, setLoading] = useState(true)
    const [updating, setUpdating] = useState(false)
    const [search, setSearch] = useState('')
    const [searchFocused, setSearchFocused] = useState(false)
    const [filterStatus, setFilterStatus] = useState('')
    // const [statFilter, setStatFilter] = useState('')
    const [activeDept, setActiveDept] = useState('All')
    const [activeEmp, setActiveEmp] = useState('All')
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [detailReport, setDetailReport] = useState(null)
    const [lightbox, setLightbox] = useState('')
    const [toast, setToast] = useState({ message: '', type: 'success', visible: false })

    const showToast = useCallback((message, type = 'success') => {
        setToast({ message, type, visible: true })
        setTimeout(() => setToast(t => ({ ...t, visible: false })), 3500)
    }, [])

    // ── Fetch ──
    const fetchReports = useCallback(async () => {
        setLoading(true)
        try {
            const { data } = await API.get('/getEmployeeDailyReports')
            setReports(data.data || [])
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to fetch reports', 'error')
        } finally {
            setLoading(false)
        }
    }, [showToast])

    useEffect(() => { fetchReports() }, [fetchReports])

    // ── Departments ──
    const departments = useMemo(() => {
        const d = new Set(reports.map(r => r.user?.department || 'Other'))
        return ['All', ...d]
    }, [reports])

    // ── Employees for active dept ──
    const employeesInDept = useMemo(() => {
        const map = {}
        reports.forEach(r => {
            if (activeDept === 'All' || r.user?.department === activeDept) {
                const id = r.user?._id
                if (id && !map[id]) map[id] = r.user
            }
        })
        return [{ _id: 'All', name: 'All employees' }, ...Object.values(map)]
    }, [reports, activeDept])

    // ── Filtering ──
    const activeStatusFilter = filterStatus

    const filtered = useMemo(() => {
        const q = search.toLowerCase()
        return reports.filter(r => {
            const dept = r.user?.department || 'Other'
            return (activeDept === 'All' || dept === activeDept)
                && (activeEmp === 'All' || r.user?._id === activeEmp)
                && (!activeStatusFilter || r.status === activeStatusFilter)
                && (!q || r.task_name?.toLowerCase().includes(q)
                    || r.user?.name?.toLowerCase().includes(q)
                    || r.user?.employeeId?.toLowerCase().includes(q)
                    || r.day?.toLowerCase().includes(q)
                    || r.message?.toLowerCase().includes(q))
        })
    }, [reports, activeDept, activeEmp, activeStatusFilter, search])

    // ── Stats (always from all reports) ──
    const stats = useMemo(() => ({
        total: reports.length,
        pending: reports.filter(r => r.status === 'pending').length,
        completed: reports.filter(r => r.status === 'completed').length,
    }), [reports])

    // ── Pagination ──
    useEffect(() => { setPage(1) }, [search, filterStatus, activeDept, activeEmp, pageSize])

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
    const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

    // ── Dept change resets employee filter ──
    const handleDeptChange = (dept) => { setActiveDept(dept); setActiveEmp('All') }

    // ── Stat card click ──
    const handleStatClick = (key) => {
        setFilterStatus(prev => prev === key ? '' : key)
    }

    // ── Status dropdown (toolbar) ──
    const handleStatusFilter = (val) => { setFilterStatus(val) }

    // ── Update report status (from detail modal) ──
    const handleStatusChange = async (id, status) => {
        setUpdating(true)
        try {
            await API.patch(`/updateReportStatus/${id}/status`, { status })
            setReports(prev => prev.map(r => r._id === id ? { ...r, status } : r))
            setDetailReport(prev => prev?._id === id ? { ...prev, status } : prev)
            showToast(`Status updated to "${status}"`)
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to update status', 'error')
        } finally {
            setUpdating(false)
        }
    }

    // ── Render ──
    return (
        <DashboardLayout>
            <style>{STYLES}</style>

            <div style={{ minHeight: '100vh', background: C.pageBg, padding: 24, display: 'flex', flexDirection: 'column', gap: 20, boxSizing: 'border-box' }}>

                {/* Page Header */}
                <div>
                    <h1 style={{ fontSize: 22, fontWeight: 700, color: C.slate900, margin: 0 }}>Daily Reports</h1>
                    <p style={{ fontSize: 13, color: C.slate400, margin: '4px 0 0' }}>View and manage all employee daily reports</p>
                </div>

                {/* Stat Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                    <StatCard label="Total reports" value={stats.total} accent="#3b82f6" loading={loading} active={filterStatus === ''} onClick={() => handleStatClick('')} />
                    <StatCard label="Pending" value={stats.pending} accent="#f59e0b" loading={loading} active={filterStatus === 'pending'} onClick={() => handleStatClick('pending')} />
                    <StatCard label="Completed" value={stats.completed} accent="#10b981" loading={loading} active={filterStatus === 'completed'} onClick={() => handleStatClick('completed')} />
                </div>

                {/* Main Panel */}
                <div style={{ background: C.white, borderRadius: 20, border: `1px solid ${C.slate200}`, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>

                    {/* Toolbar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px', borderBottom: `1px solid ${C.slate100}`, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: C.slate800, marginRight: 4 }}>All Reports</span>

                        {/* Search */}
                        <div style={{ position: 'relative', flex: 1, minWidth: 180, maxWidth: 300 }}>
                            <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', fontSize: 15, color: C.slate400, pointerEvents: 'none' }}>🔍</span>
                            <input
                                type="text" value={search}
                                onChange={e => setSearch(e.target.value)}
                                onFocus={() => setSearchFocused(true)}
                                onBlur={() => setSearchFocused(false)}
                                placeholder="Search task, employee..."
                                style={{
                                    paddingLeft: 34, paddingRight: 14, paddingTop: 9, paddingBottom: 9,
                                    width: '100%', borderRadius: 22,
                                    border: `1px solid ${searchFocused ? C.indigo : C.slate300}`,
                                    boxShadow: searchFocused ? `0 0 0 3px ${C.indigoLight}` : 'none',
                                    fontSize: 13, color: C.slate800, background: C.white,
                                    outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box',
                                }}
                            />
                        </div>

                        {/* Status filter */}
                        <select value={filterStatus} onChange={e => handleStatusFilter(e.target.value)} style={{
                            padding: '9px 12px', borderRadius: 9, border: `1px solid ${C.slate300}`,
                            background: C.white, fontSize: 13, color: C.slate700, outline: 'none', cursor: 'pointer',
                        }}>
                            <option value="">All status</option>
                            <option value="pending">Pending</option>
                            <option value="completed">Completed</option>
                        </select>

                        <div style={{ flex: 1 }} />

                        {/* Refresh */}
                        <button className="mgr-btn" onClick={fetchReports} disabled={loading} style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 14px',
                            borderRadius: 9, border: `1px solid ${C.slate200}`, background: C.white,
                            color: C.slate600, fontSize: 13, fontWeight: 600,
                            cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1, transition: 'all 0.15s',
                        }}>
                            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                style={{ animation: loading ? 'mgr-spin 0.7s linear infinite' : 'none' }}>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Refresh
                        </button>

                        <span style={{ fontSize: 13, color: C.slate400, fontWeight: 500, whiteSpace: 'nowrap' }}>
                            {filtered.length} report{filtered.length !== 1 ? 's' : ''}
                        </span>
                    </div>

                    {/* Department + Employee Dropdown Filters */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: `1px solid ${C.slate100}`, background: C.slate50, flexWrap: 'wrap' }}>

                        {/* Department icon + label */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: C.slate500, fontSize: 13, fontWeight: 600 }}>
                            <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            Department
                        </div>
                        <select
                            value={activeDept}
                            onChange={e => handleDeptChange(e.target.value)}
                            style={{
                                padding: '8px 14px', borderRadius: 9, border: `1px solid ${activeDept !== 'All' ? C.indigo : C.slate300}`,
                                background: activeDept !== 'All' ? C.indigoLight : C.white,
                                fontSize: 13, fontWeight: 600,
                                color: activeDept !== 'All' ? C.indigoDark : C.slate700,
                                outline: 'none', cursor: 'pointer', transition: 'all 0.18s',
                                boxShadow: activeDept !== 'All' ? `0 0 0 2px ${C.indigoBorder}` : 'none',
                                minWidth: 160,
                            }}
                        >
                            <option value="All">All Departments</option>
                            {departments.filter(d => d !== 'All').map(dept => (
                                <option key={dept} value={dept}>{dept}</option>
                            ))}
                        </select>

                        {/* Divider */}
                        <div style={{ width: 1, height: 28, background: C.slate200 }} />

                        {/* Employee icon + label */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: C.slate500, fontSize: 13, fontWeight: 600 }}>
                            <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            Employee
                        </div>
                        <select
                            value={activeEmp}
                            onChange={e => setActiveEmp(e.target.value)}
                            style={{
                                padding: '8px 14px', borderRadius: 9, border: `1px solid ${activeEmp !== 'All' ? C.indigo : C.slate300}`,
                                background: activeEmp !== 'All' ? C.indigoLight : C.white,
                                fontSize: 13, fontWeight: 600,
                                color: activeEmp !== 'All' ? C.indigoDark : C.slate700,
                                outline: 'none', cursor: 'pointer', transition: 'all 0.18s',
                                boxShadow: activeEmp !== 'All' ? `0 0 0 2px ${C.indigoBorder}` : 'none',
                                minWidth: 180,
                            }}
                        >
                            <option value="All">All Employees</option>
                            {employeesInDept.filter(e => e._id !== 'All').map(emp => (
                                <option key={emp._id} value={emp._id}>{emp.name}</option>
                            ))}
                        </select>

                        {/* Active filter chips */}
                        {(activeDept !== 'All' || activeEmp !== 'All') && (
                            <button
                                onClick={() => { handleDeptChange('All'); setActiveEmp('All'); }}
                                style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 5,
                                    padding: '6px 12px', borderRadius: 8,
                                    border: `1px solid #fecaca`, background: '#fef2f2',
                                    color: '#dc2626', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                                    transition: 'all 0.15s',
                                }}
                            >
                                <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Clear filters
                            </button>
                        )}
                    </div>

                    {/* Table */}
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                            <thead>
                                <tr style={{ borderBottom: `1px solid ${C.slate100}`, background: C.slate50 }}>
                                    {['#', 'Employee', 'Task name', 'Day', 'Date', 'Status', 'Dept', 'File'].map((h, i) => (
                                        <th key={h} style={{
                                            padding: '11px 20px', textAlign: 'left',
                                            fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
                                            color: C.slate400, textTransform: 'uppercase', whiteSpace: 'nowrap',
                                        }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
                                ) : paginated.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} style={{ padding: '64px 20px', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                                                <div style={{ width: 56, height: 56, borderRadius: 16, background: C.slate100, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>📄</div>
                                                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: C.slate500 }}>No reports found</p>
                                                <p style={{ margin: 0, fontSize: 12, color: C.slate400 }}>
                                                    {activeStatusFilter ? 'Try clearing the status filter' : 'No reports match your current filters'}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    paginated.map((r, idx) => {
                                        const srNo = (page - 1) * pageSize + idx + 1
                                        const file = r.file || ''

                                        const fileCell = file ? (
                                            isPdf(file) ? (
                                                <div className="mgr-file-thumb"
                                                    onClick={e => { e.stopPropagation(); window.open(fixPath(file), '_blank') }}
                                                    style={{ width: 40, height: 40, borderRadius: 9, border: `1px solid #fecdd3`, background: '#fff1f2', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.15s' }}>
                                                    <svg width="18" height="18" fill="none" stroke="#e11d48" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6M9 17h4" />
                                                    </svg>
                                                </div>
                                            ) : isImage(file) ? (
                                                <img src={fixPath(file)} alt="File"
                                                    onClick={e => { e.stopPropagation(); setLightbox(fixPath(file)) }}
                                                    className="mgr-file-thumb"
                                                    style={{ width: 40, height: 40, borderRadius: 9, objectFit: 'cover', border: `1px solid ${C.slate200}`, cursor: 'pointer', display: 'block', transition: 'all 0.15s' }} />
                                            ) : (
                                                <div className="mgr-file-thumb" style={{ width: 40, height: 40, borderRadius: 9, border: `1px solid ${C.indigoBorder}`, background: C.indigoLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <svg width="18" height="18" fill="none" stroke={C.indigo} viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                                    </svg>
                                                </div>
                                            )
                                        ) : <span style={{ fontSize: 13, color: C.slate300, fontWeight: 600 }}>—</span>

                                        return (
                                            <tr key={r._id} className="mgr-row"
                                                onClick={() => setDetailReport(r)}
                                                style={{ borderBottom: `1px solid ${C.slate50}`, animation: `mgr-rowIn 0.2s ease ${idx * 0.03}s both` }}>
                                                <td style={{ padding: '14px 20px' }}>
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 7, background: C.slate100, fontSize: 11, fontWeight: 700, color: C.slate500 }}>
                                                        {String(srNo).padStart(2, '0')}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '14px 20px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                        <Avatar name={r.user?.name || ''} />
                                                        <div>
                                                            <div style={{ fontWeight: 700, color: C.slate900, fontSize: 13 }}>{r.user?.name || '—'}</div>
                                                            <div style={{ fontSize: 11, color: C.slate400, marginTop: 1 }}>{r.user?.employeeId || r.user?.designation || ''}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '14px 20px', fontWeight: 600, color: C.slate800, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {r.task_name || '—'}
                                                </td>
                                                <td style={{ padding: '14px 20px', color: C.slate600 }}>{r.day || '—'}</td>
                                                <td style={{ padding: '14px 20px', color: C.slate600, whiteSpace: 'nowrap' }}>{fmtDate(r.date || r.createdAt)}</td>
                                                <td style={{ padding: '14px 20px' }}><StatusBadge status={r.status} /></td>
                                                <td style={{ padding: '14px 20px' }}>
                                                    <span style={{ padding: '3px 9px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: C.slate100, color: C.slate600, border: `1px solid ${C.slate200}` }}>
                                                        {r.user?.department || '—'}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '14px 20px' }} onClick={e => e.stopPropagation()}>
                                                    {fileCell}
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {!loading && filtered.length > 0 && (
                        <Pagination
                            page={page} totalPages={totalPages}
                            pageSize={pageSize} total={filtered.length}
                            onPage={setPage}
                            onSize={s => { setPageSize(s); setPage(1) }}
                        />
                    )}
                </div>
            </div>

            {/* Detail Modal */}
            {detailReport && (
                <DetailModal
                    report={detailReport}
                    onClose={() => setDetailReport(null)}
                    onStatusChange={handleStatusChange}
                    updating={updating}
                />
            )}

            {/* Image Lightbox */}
            <Lightbox src={lightbox} onClose={() => setLightbox('')} />

            {/* Toast */}
            <Toast message={toast.message} type={toast.type} visible={toast.visible} />
        </DashboardLayout>
    )
}

export default ManagerDailyReport