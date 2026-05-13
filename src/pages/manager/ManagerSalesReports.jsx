import React, { useState, useMemo, useEffect, useCallback } from 'react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import API from '../../services/api'
import {
    FiSearch, FiRefreshCw, FiCheck, FiX, FiSend,
    FiBarChart2, FiClock, FiCheckCircle, FiXCircle,
    FiChevronLeft, FiChevronRight, FiFileText, FiAlertCircle,
    FiActivity, FiInfo, FiDownload, FiFilter, FiCalendar,
} from 'react-icons/fi'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const C = {
    indigo: '#4f46e5', indigoDark: '#3730a3', indigoLight: '#eef2ff', indigoBorder: '#a5b4fc',
    red: '#dc2626', redDark: '#b91c1c', redLight: '#fef2f2', redBorder: '#fca5a5',
    emerald: '#047857', emeraldLight: '#ecfdf5', emeraldBorder: '#6ee7b7',
    blue: '#1d4ed8', blueLight: '#eff6ff', blueBorder: '#93c5fd', amber: '#b45309',
    amberLight: '#fffbeb', amberBorder: '#fcd34d',
    slate50: '#f8fafc', slate100: '#f1f5f9', slate200: '#e2e8f0', slate300: '#cbd5e1',
    slate400: '#64748b', slate500: '#475569', slate600: '#334155', slate700: '#1e293b',
    slate800: '#0f172a', slate900: '#020617', white: '#ffffff', pageBg: '#f1f3f9',
    text: '#0f172a',
    textSub: '#334155',
    textMuted: '#64748b',
}

const STATUS = {
    draft: { label: 'Draft', color: '#334155', bg: '#f1f5f9' },
    pending_review: { label: 'Pending Review', color: '#1d4ed8', bg: '#eff6ff' },
    approved: { label: 'Approved', color: '#047857', bg: '#ecfdf5' },
    rejected: { label: 'Rejected', color: '#b91c1c', bg: '#fef2f2' },
}

const STAGES = {
    new: { label: 'New', color: '#334155', bg: '#f1f5f9' },
    assigned: { label: 'Assigned', color: '#4f46e5', bg: '#eef2ff' },
    contacted: { label: 'Contacted', color: '#0d9488', bg: '#f0fdfa' },
    meeting_scheduled: { label: 'Meeting Scheduled', color: '#7c3aed', bg: '#f5f3ff' },
    proposal_sent: { label: 'Proposal Sent', color: '#b45309', bg: '#fffbeb' },
    negotiation: { label: 'Negotiation', color: '#ea580c', bg: '#fff7ed' },
    won: { label: 'Won', color: '#047857', bg: '#ecfdf5' },
    lost: { label: 'Lost', color: '#b91c1c', bg: '#fef2f2' },
    on_hold: { label: 'On Hold', color: '#64748b', bg: '#f1f5f9' },
}

const LEAD_STAGE_OPTIONS = [
    { value: '', label: 'All Stages' },
    { value: 'new', label: 'New' },
    { value: 'assigned', label: 'Assigned' },
    { value: 'contacted', label: 'Contacted' },
    { value: 'meeting_scheduled', label: 'Meeting Scheduled' },
    { value: 'proposal_sent', label: 'Proposal Sent' },
    { value: 'negotiation', label: 'Negotiation' },
    { value: 'won', label: 'Won' },
    { value: 'lost', label: 'Lost' },
    { value: 'on_hold', label: 'On Hold' },
]

const DATE_PRESETS = [
    { value: '', label: 'All Time' },
    { value: 'this_week', label: 'This Week' },
    { value: 'this_month', label: 'This Month' },
    { value: 'this_year', label: 'This Year' },
    { value: 'custom', label: 'Custom Range' },
]

const PAGE_SIZE_OPTIONS = [10, 25, 50]

const AVATAR_COLORS = ['#7c3aed', '#4f46e5', '#2563eb', '#db2777', '#d97706', '#0d9488', '#e11d48']
const getAvatarColor = (name = '') => AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length]
const getInitials = (name = '') => name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?'
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
const fmtDateTime = (d) => d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'

/* ─── Global Styles ── */
const globalStyles = `
    @keyframes spin    { to { transform: rotate(360deg); } }
    @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:0.4} }
    @keyframes slideUp { from{transform:translateY(20px);opacity:0} to{transform:translateY(0);opacity:1} }
    @keyframes modalIn { from{transform:scale(0.96) translateY(10px);opacity:0} to{transform:scale(1) translateY(0);opacity:1} }
    @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
    * { box-sizing: border-box; }
    .report-row { cursor: pointer; transition: background 0.15s; }
    .report-row:hover td { background: #f0f4ff !important; }
    .action-btn { transition: all 0.18s ease !important; }
    .action-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important; }
    .stat-card { transition: all 0.2s ease; }
    .stat-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.1) !important; }
    .refresh-btn:hover { background: #f1f5f9 !important; }
    input:focus, select:focus, textarea:focus { outline: none; }
    @media (max-width: 768px) {
        .stats-grid { grid-template-columns: repeat(2,1fr) !important; }
        .toolbar { flex-direction: column !important; align-items: stretch !important; }
        .toolbar-search { width: 100% !important; }
        .toolbar-select { width: 100% !important; }
        .toolbar-right { justify-content: space-between !important; }
        .table-wrapper { font-size: 12px !important; }
        .modal-grid { grid-template-columns: 1fr !important; }
        .modal-grid > * { grid-column: span 1 !important; }
        .modal-box { max-width: 98vw !important; margin: 8px !important; }
        .modal-footer-btns { flex-direction: column !important; }
        .modal-footer-btns button { flex: unset !important; width: 100% !important; }
        .pagination-wrap { flex-direction: column !important; align-items: flex-start !important; gap: 8px !important; }
        .send-modal-box { width: 96vw !important; padding: 16px !important; }
        .page-header { flex-direction: column !important; align-items: flex-start !important; gap: 8px !important; }
        .tab-bar { overflow-x: auto !important; }
    }
    @media (max-width: 480px) {
        .stats-grid { grid-template-columns: 1fr !important; }
        .stat-value { font-size: 28px !important; }
    }
`

/* ─── Toast ── */
const Toast = ({ message, type, visible }) => {
    if (!visible) return null
    return (
        <div style={{
            position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
            padding: '13px 18px', borderRadius: 12,
            background: type === 'error' ? C.redDark : C.emerald,
            color: C.white, fontSize: 13, fontWeight: 700,
            boxShadow: '0 8px 24px rgba(0,0,0,0.22)',
            display: 'flex', alignItems: 'center', gap: 10,
            animation: 'slideUp 0.3s ease', maxWidth: 340, left: 'auto',
        }}>
            {type === 'error' ? <FiXCircle size={16} /> : <FiCheckCircle size={16} />}
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
            fontWeight: 800, whiteSpace: 'nowrap',
            display: 'inline-block', letterSpacing: '0.02em',
        }}>
            {s.label}
        </span>
    )
}

/* ─── StageBadge ── */
const StageBadge = ({ stage }) => {
    const s = STAGES[stage] || STAGES.new
    return (
        <span style={{
            padding: '4px 10px', borderRadius: 6,
            background: s.bg, color: s.color,
            fontSize: 12, fontWeight: 800, whiteSpace: 'nowrap',
            display: 'inline-block', letterSpacing: '0.02em',
        }}>
            {s.label}
        </span>
    )
}

/* ─── StatCard ── */
const StatCard = ({ label, value, topColor, loading, active, onClick, icon: Icon }) => (
    <div
        className="stat-card"
        onClick={onClick}
        style={{
            background: C.white, borderRadius: 16, padding: '20px 22px',
            borderTop: `4px solid ${topColor}`,
            border: `1px solid ${active ? topColor : C.slate200}`,
            borderTopColor: topColor,
            boxShadow: active ? `0 0 0 3px ${topColor}33, 0 4px 16px rgba(0,0,0,0.08)` : '0 1px 4px rgba(0,0,0,0.06)',
            cursor: onClick ? 'pointer' : 'default',
        }}
    >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
            <p style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.textMuted, margin: 0 }}>
                {label}
            </p>
            {Icon && <Icon size={18} color={topColor} />}
        </div>
        {loading
            ? <div style={{ width: 60, height: 36, borderRadius: 8, background: C.slate100, animation: 'pulse 1.5s ease infinite' }} />
            : <p className="stat-value" style={{ fontSize: 34, fontWeight: 900, color: C.slate800, margin: 0, lineHeight: 1 }}>{value}</p>
        }
    </div>
)

/* ─── Skeleton Row ── */
const SkeletonRow = () => (
    <tr style={{ borderBottom: `1px solid ${C.slate50}` }}>
        {[60, 90, 200, 110, 100, 90, 120, 110].map((w, i) => (
            <td key={i} style={{ padding: '16px 20px' }}>
                <div style={{ height: 13, width: w, borderRadius: 6, background: C.slate100, animation: 'pulse 1.5s ease infinite' }} />
            </td>
        ))}
    </tr>
)

/* ─── Input Style Helper ── */
const useInputFocus = () => {
    const [focused, setFocused] = useState(false)
    return { focused, onFocus: () => setFocused(true), onBlur: () => setFocused(false) }
}

const inputStyle = (focused, error) => ({
    width: '100%', padding: '10px 13px', borderRadius: 9, resize: 'none',
    border: `1.5px solid ${error ? C.redBorder : focused ? C.indigo : C.slate300}`,
    boxShadow: focused ? `0 0 0 3px ${error ? '#fee2e2' : C.indigoLight}` : 'none',
    fontSize: 14, color: C.text, fontFamily: 'inherit',
    outline: 'none', transition: 'border-color 0.2s, box-shadow 0.25s',
    background: C.white,
})

/* ─── Detail Modal (tabbed: Details + Timeline) ── */
const DetailModal = ({ open, report, onClose, showToast }) => {
    const [activeTab, setActiveTab] = useState('details')
    const [timeline, setTimeline] = useState([])
    const [timelineLoading, setTimelineLoading] = useState(false)

    useEffect(() => {
        if (open && report) {
            setActiveTab('details')
            setTimeline([])
        }
    }, [open, report])

    useEffect(() => {
        if (activeTab === 'timeline' && report) fetchTimeline()
    }, [activeTab])

    const fetchTimeline = async () => {
        setTimelineLoading(true)
        try {
            const { data } = await API.get(`/leadTimeline/${report._id}`)
            setTimeline(data.timeline || [])
        } catch (err) {
            showToast('Failed to load timeline', 'error')
        } finally { setTimelineLoading(false) }
    }

    if (!open || !report) return null

    const status = STATUS[report.review_status] || STATUS.draft
    const isRejected = report.review_status === 'rejected'
    const isApproved = report.review_status === 'approved'

    const TABS = [
        { key: 'details', label: 'Details', icon: FiInfo },
        { key: 'timeline', label: 'Timeline', icon: FiActivity },
    ]

    const Detail = ({ label, value, fullWidth }) => (
        <div style={{ gridColumn: fullWidth ? 'span 2' : 'span 1', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.textMuted }}>
                {label}
            </span>
            <span style={{ fontSize: 14, fontWeight: 600, color: C.text, wordBreak: 'break-word', lineHeight: 1.5 }}>
                {value || '—'}
            </span>
        </div>
    )

    return (
        <div onClick={onClose} style={{
            position: 'fixed', inset: 0, zIndex: 60,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
            background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(6px)',
            animation: 'fadeIn 0.18s ease',
        }}>
            <div onClick={e => e.stopPropagation()} className="modal-box" style={{
                background: C.white, borderRadius: 20, width: '100%', maxWidth: 580,
                maxHeight: '92vh', overflowY: 'auto',
                boxShadow: '0 32px 80px rgba(15,23,42,0.28)',
                animation: 'modalIn 0.22s ease',
            }}>
                {/* Header */}
                <div style={{ padding: '20px 26px 16px', borderBottom: `1px solid ${C.slate100}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                            width: 46, height: 46, borderRadius: '50%', background: getAvatarColor(report.client_name),
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: C.white, fontSize: 15, fontWeight: 800, flexShrink: 0,
                        }}>{getInitials(report.client_name)}</div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: C.text }}>{report.client_name}</h2>
                            <p style={{ margin: '2px 0 0', fontSize: 12, color: C.textMuted }}>{report.client_email}</p>
                        </div>
                    </div>
                    <button onClick={onClose} style={{
                        width: 32, height: 32, borderRadius: 8, border: `1px solid ${C.slate200}`,
                        background: C.white, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', color: C.textSub, flexShrink: 0,
                    }}><FiX size={14} /></button>
                </div>

                {/* Tabs */}
                <div className="tab-bar" style={{ display: 'flex', gap: 2, padding: '12px 26px 0', borderBottom: `1px solid ${C.slate100}` }}>
                    {TABS.map(tab => {
                        const Icon = tab.icon
                        const active = activeTab === tab.key
                        return (
                            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                padding: '8px 14px', borderRadius: '8px 8px 0 0',
                                border: 'none', borderBottom: active ? `2px solid ${C.indigo}` : '2px solid transparent',
                                background: active ? C.indigoLight : 'transparent',
                                color: active ? C.indigo : C.textMuted,
                                fontSize: 13, fontWeight: active ? 800 : 600,
                                cursor: 'pointer', fontFamily: 'inherit',
                                transition: 'all 0.15s', whiteSpace: 'nowrap',
                            }}>
                                <Icon size={13} />
                                {tab.label}
                            </button>
                        )
                    })}
                </div>

                {/* Tab Content */}
                <div style={{ padding: '20px 26px 24px' }}>

                    {/* ── Details Tab ── */}
                    {activeTab === 'details' && (
                        <div>
                            {/* Status Banner */}
                            <div style={{
                                marginBottom: 16, padding: '13px 16px', borderRadius: 12, background: status.bg,
                                border: `1px solid ${isRejected ? C.redBorder : isApproved ? C.emeraldBorder : C.blueBorder}`,
                                display: 'flex', alignItems: 'center', gap: 12,
                            }}>
                                <span style={{ fontSize: 18 }}>{isApproved ? '✅' : isRejected ? '❌' : '🕐'}</span>
                                <div style={{ flex: 1 }}>
                                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: status.color }}>
                                        {isApproved ? 'This report has been approved' : isRejected ? 'This report has been rejected' : 'This report is pending review'}
                                    </p>
                                    {report.action_date && (
                                        <p style={{ margin: '2px 0 0', fontSize: 12, color: status.color, opacity: 0.75 }}>
                                            {fmtDate(report.action_date)}
                                        </p>
                                    )}
                                </div>
                                <StatusBadge status={report.review_status} size="lg" />
                            </div>

                            {/* Reject Reason */}
                            {isRejected && report.reject_reason && (
                                <div style={{ marginBottom: 16, padding: '13px 16px', borderRadius: 12, background: C.redLight, border: `1px solid ${C.redBorder}` }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                                        <FiAlertCircle size={13} color={C.redDark} />
                                        <p style={{ margin: 0, fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.redDark }}>Rejection Reason</p>
                                    </div>
                                    <p style={{ margin: 0, fontSize: 13, color: C.redDark, lineHeight: 1.6, fontWeight: 500 }}>{report.reject_reason}</p>
                                </div>
                            )}

                            {/* Details Grid */}
                            <div className="modal-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px 22px' }}>
                                <Detail label="Report Date" value={fmtDate(report.date || report.createdAt)} />
                                <Detail label="Marketer" value={report.marketer} />
                                <Detail label="Service" value={report.services} />
                                <Detail label="Country" value={report.country} />
                                <Detail label="Client Phone" value={report.client_phone} />

                                {report.lead_stage && (
                                    <div style={{ gridColumn: 'span 1', display: 'flex', flexDirection: 'column', gap: 4 }}>
                                        <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.textMuted }}>Lead Stage</span>
                                        <StageBadge stage={report.lead_stage} />
                                    </div>
                                )}

                                {report.assigned_to && (
                                    <Detail label="Assigned To" value={report.assigned_to?.name} />
                                )}

                                {report.assigned_to && report.assigned_at && (
                                    <Detail label="Assigned At" value={fmtDateTime(report.assigned_at)} />
                                )}

                                {report.assignment_note && (
                                    <Detail label="Assignment Note" value={report.assignment_note} fullWidth />
                                )}

                                {report.next_follow_up && (
                                    <Detail label="Next Follow-Up" value={fmtDate(report.next_follow_up)} />
                                )}

                                {report.follow_up_count > 0 && (
                                    <Detail label="Follow-Up Count" value={report.follow_up_count} />
                                )}

                                {report.message && (
                                    <Detail label="Notes / Message" value={report.message} fullWidth />
                                )}
                            </div>

                            {/* Remarks preview (read-only) */}
                            {report.remarks?.length > 0 && (
                                <div style={{ marginTop: 20 }}>
                                    <p style={{ margin: '0 0 10px', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.textMuted }}>
                                        Remarks ({report.remarks.length})
                                    </p>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        {[...report.remarks].reverse().slice(0, 3).map((r, i) => (
                                            <div key={i} style={{ padding: '10px 13px', borderRadius: 10, background: C.slate50, border: `1px solid ${C.slate200}` }}>
                                                <p style={{ margin: '0 0 4px', fontSize: 13, color: C.text, fontWeight: 500, lineHeight: 1.5 }}>{r.message}</p>
                                                <p style={{ margin: 0, fontSize: 11, color: C.textMuted, fontWeight: 600 }}>
                                                    {r.added_by?.name || '—'} · {fmtDateTime(r.createdAt)}
                                                </p>
                                            </div>
                                        ))}
                                        {report.remarks.length > 3 && (
                                            <p style={{ margin: 0, fontSize: 12, color: C.textMuted, fontWeight: 600, textAlign: 'center' }}>
                                                +{report.remarks.length - 3} more remarks
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Timeline Tab ── */}
                    {activeTab === 'timeline' && (
                        <div>
                            {timelineLoading ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <div key={i} style={{ height: 56, borderRadius: 10, background: C.slate100, animation: 'pulse 1.5s ease infinite' }} />
                                    ))}
                                </div>
                            ) : timeline.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px 0', color: C.textMuted }}>
                                    <div style={{ width: 52, height: 52, borderRadius: 14, background: C.slate100, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                                        <FiActivity size={24} color={C.textMuted} style={{ opacity: 0.5 }} />
                                    </div>
                                    <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.textSub }}>No timeline events yet</p>
                                    <p style={{ margin: '4px 0 0', fontSize: 12, color: C.textMuted, fontWeight: 500 }}>Activity on this lead will appear here</p>
                                </div>
                            ) : (
                                <div style={{ position: 'relative', paddingLeft: 24 }}>
                                    {/* Vertical line */}
                                    <div style={{
                                        position: 'absolute', left: 7, top: 8, bottom: 8,
                                        width: 2, background: C.slate200, borderRadius: 2,
                                    }} />
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                                        {[...timeline].reverse().map((t, i) => (
                                            <div key={i} style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 3 }}>
                                                {/* Dot */}
                                                <div style={{
                                                    position: 'absolute', left: -20, top: 4,
                                                    width: 10, height: 10, borderRadius: '50%',
                                                    background: i === 0 ? C.indigo : C.slate300,
                                                    border: `2px solid ${C.white}`,
                                                    boxShadow: i === 0 ? '0 0 0 2px rgba(79,70,229,0.3)' : 'none',
                                                }} />
                                                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.text, lineHeight: 1.4 }}>{t.message}</p>
                                                <p style={{ margin: 0, fontSize: 11, color: C.textMuted, fontWeight: 500 }}>
                                                    {t.by?.name || '—'} · {fmtDateTime(t.createdAt)}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{ padding: '0 26px 22px', display: 'flex', justifyContent: 'flex-end' }}>
                    <button onClick={onClose} style={{
                        padding: '10px 26px', borderRadius: 10, border: `1px solid ${C.slate300}`,
                        background: C.white, fontSize: 14, fontWeight: 700, color: C.textSub,
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
    const inp = useInputFocus()

    useEffect(() => { if (open) { setReason(''); setError('') } }, [open])

    const handleSubmit = () => {
        if (!reason.trim()) { setError('Please provide a reason for rejection'); return }
        onSubmit(reason.trim())
    }

    if (!open) return null
    return (
        <div onClick={onClose} style={{
            position: 'fixed', inset: 0, zIndex: 70,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
            background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(6px)',
            animation: 'fadeIn 0.18s ease',
        }}>
            <div onClick={e => e.stopPropagation()} className="modal-box" style={{
                background: C.white, borderRadius: 20, width: '100%', maxWidth: 460,
                boxShadow: '0 32px 80px rgba(15,23,42,0.24)', overflow: 'hidden',
                animation: 'modalIn 0.22s ease',
            }}>
                <div style={{ padding: '20px 26px 16px', borderBottom: `1px solid ${C.slate100}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 10, background: C.redLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <FiXCircle size={18} color={C.redDark} />
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: C.text }}>Reject Report</h2>
                            {reportName && <p style={{ margin: 0, fontSize: 12, color: C.textMuted }}>{reportName}</p>}
                        </div>
                    </div>
                    <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${C.slate200}`, background: C.white, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: C.textSub }}>
                        <FiX size={14} />
                    </button>
                </div>
                <div style={{ padding: '20px 26px' }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 8 }}>
                        Rejection Reason <span style={{ color: C.red }}>*</span>
                    </label>
                    <textarea
                        value={reason}
                        onChange={e => { setReason(e.target.value); setError('') }}
                        onFocus={inp.onFocus} onBlur={inp.onBlur}
                        placeholder="Explain why this report is being rejected..."
                        rows={4}
                        style={inputStyle(inp.focused, error)}
                    />
                    {error && (
                        <p style={{ margin: '6px 0 0', fontSize: 12, color: C.red, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <FiAlertCircle size={12} /> {error}
                        </p>
                    )}
                </div>
                <div className="modal-footer-btns" style={{ display: 'flex', gap: 10, padding: '0 26px 22px' }}>
                    <button onClick={onClose} disabled={submitting} className="action-btn" style={{
                        flex: 1, padding: '11px 0', borderRadius: 10, border: `1px solid ${C.slate300}`,
                        background: C.white, fontSize: 14, fontWeight: 700, color: C.textSub,
                        cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: submitting ? 0.6 : 1,
                    }}>Cancel</button>
                    <button onClick={handleSubmit} disabled={submitting} className="action-btn" style={{
                        flex: 1, padding: '11px 0', borderRadius: 10, border: 'none',
                        background: submitting ? C.slate300 : C.redDark, fontSize: 14, fontWeight: 800,
                        color: C.white, cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                        boxShadow: submitting ? 'none' : '0 4px 14px rgba(185,28,28,0.35)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'background 0.2s',
                    }}>
                        {submitting && <span style={{ width: 13, height: 13, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.35)', borderTopColor: C.white, animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />}
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
        if (totalPages <= 7) { for (let i = 1; i <= totalPages; i++) pages.push(i) }
        else {
            pages.push(1)
            if (currentPage > 3) pages.push('...')
            for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i)
            if (currentPage < totalPages - 2) pages.push('...')
            pages.push(totalPages)
        }
        return pages
    }
    const btnBase = {
        minWidth: 34, height: 34, borderRadius: 8, border: `1px solid ${C.slate200}`,
        background: C.white, fontSize: 13, fontWeight: 700, cursor: 'pointer',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'inherit', transition: 'all 0.15s', color: C.textSub,
    }
    return (
        <div className="pagination-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderTop: `1px solid ${C.slate100}`, flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 13, color: C.textMuted, whiteSpace: 'nowrap', fontWeight: 500 }}>Rows per page:</span>
                <select value={pageSize} onChange={e => onPageSizeChange(Number(e.target.value))} style={{
                    padding: '6px 10px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                    border: `1px solid ${C.slate200}`, background: C.white, color: C.text, cursor: 'pointer', outline: 'none', fontFamily: 'inherit',
                }}>
                    {PAGE_SIZE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <span style={{ fontSize: 13, color: C.textMuted, whiteSpace: 'nowrap' }}>
                    {((currentPage - 1) * pageSize) + 1}–{Math.min(currentPage * pageSize, totalItems)} of {totalItems}
                </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}
                    style={{ ...btnBase, opacity: currentPage === 1 ? 0.4 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}>
                    <FiChevronLeft size={14} />
                </button>
                {getPages().map((p, i) =>
                    p === '...' ? (
                        <span key={`e-${i}`} style={{ minWidth: 34, textAlign: 'center', color: C.textMuted, fontSize: 13 }}>…</span>
                    ) : (
                        <button key={p} onClick={() => onPageChange(p)} style={{
                            ...btnBase,
                            background: currentPage === p ? C.indigo : C.white,
                            color: currentPage === p ? C.white : C.textSub,
                            border: `1px solid ${currentPage === p ? C.indigo : C.slate200}`,
                            boxShadow: currentPage === p ? '0 2px 8px rgba(79,70,229,0.3)' : 'none',
                        }}>{p}</button>
                    )
                )}
                <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}
                    style={{ ...btnBase, opacity: currentPage === totalPages ? 0.4 : 1, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}>
                    <FiChevronRight size={14} />
                </button>
            </div>
        </div>
    )
}

/* ─── Send Modal ── */
const SendModal = ({ open, reportId, salesUsers, onClose, onSend, showToast }) => {
    const [selectedUser, setSelectedUser] = useState('')
    const [note, setNote] = useState('')
    const [sending, setSending] = useState(false)
    const [error, setError] = useState('')
    const selectFocus = useInputFocus()
    const noteFocus = useInputFocus()

    useEffect(() => { if (open) { setSelectedUser(''); setNote(''); setError('') } }, [open])

    const handleSend = async () => {
        if (!selectedUser) { setError('Please select a user'); return }
        setSending(true)
        try {
            const { data } = await API.post(`/manager/assign/${reportId}`, { userId: selectedUser, assignment_note: note })
            showToast('Lead assigned successfully')
            onSend(data.lead)
            onClose()
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to send report', 'error')
        } finally { setSending(false) }
    }

    if (!open) return null
    return (
        <div onClick={onClose} style={{
            position: 'fixed', inset: 0, zIndex: 80,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
            background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(6px)',
            animation: 'fadeIn 0.18s ease',
        }}>
            <div onClick={e => e.stopPropagation()} className="send-modal-box" style={{
                background: C.white, borderRadius: 20, width: 460,
                boxShadow: '0 32px 80px rgba(15,23,42,0.24)', overflow: 'hidden',
                animation: 'modalIn 0.22s ease',
            }}>
                <div style={{ padding: '20px 26px 16px', borderBottom: `1px solid ${C.slate100}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 10, background: C.indigoLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <FiSend size={16} color={C.indigo} />
                        </div>
                        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: C.text }}>Assign Lead To BDE / BDM</h2>
                    </div>
                    <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${C.slate200}`, background: C.white, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: C.textSub }}>
                        <FiX size={14} />
                    </button>
                </div>
                <div style={{ padding: '20px 26px' }}>
                    <div style={{ marginBottom: 16 }}>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 7 }}>
                            Select BDE / BDM <span style={{ color: C.red }}>*</span>
                        </label>
                        <select
                            value={selectedUser}
                            onChange={e => { setSelectedUser(e.target.value); setError('') }}
                            onFocus={selectFocus.onFocus} onBlur={selectFocus.onBlur}
                            style={{ ...inputStyle(selectFocus.focused, error && !selectedUser), appearance: 'none', cursor: 'pointer' }}
                        >
                            <option value="">Select BDE / BDM</option>
                            {salesUsers.map(u => (
                                <option key={u._id} value={u._id}>{u.name} ({u.designation || u.role})</option>
                            ))}
                        </select>
                        {error && !selectedUser && (
                            <p style={{ margin: '6px 0 0', fontSize: 12, color: C.red, display: 'flex', alignItems: 'center', gap: 4 }}>
                                <FiAlertCircle size={12} /> {error}
                            </p>
                        )}
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 7 }}>Assignment Note (optional)</label>
                        <textarea
                            placeholder="Add assignment instructions for BDE / BDM..."
                            value={note}
                            onChange={e => setNote(e.target.value)}
                            onFocus={noteFocus.onFocus} onBlur={noteFocus.onBlur}
                            rows={4}
                            style={inputStyle(noteFocus.focused, false)}
                        />
                    </div>
                </div>
                <div className="modal-footer-btns" style={{ display: 'flex', gap: 10, padding: '0 26px 22px' }}>
                    <button onClick={onClose} disabled={sending} className="action-btn" style={{
                        flex: 1, padding: '11px 0', borderRadius: 10, border: `1px solid ${C.slate300}`,
                        background: C.white, fontSize: 14, fontWeight: 700, color: C.textSub,
                        cursor: sending ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                    }}>Cancel</button>
                    <button onClick={handleSend} disabled={sending} className="action-btn" style={{
                        flex: 1, padding: '11px 0', borderRadius: 10, border: 'none',
                        background: sending ? C.slate300 : C.indigo, fontSize: 14, fontWeight: 800,
                        color: C.white, cursor: sending ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                        boxShadow: sending ? 'none' : '0 4px 14px rgba(79,70,229,0.35)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    }}>
                        {sending && <span style={{ width: 13, height: 13, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.35)', borderTopColor: C.white, animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />}
                        <FiSend size={13} />
                        {sending ? 'Assigning...' : 'Assign Lead'}
                    </button>
                </div>
            </div>
        </div>
    )
}


const DownloadModal = ({ open, onClose, reports, salesUsers }) => {
    const [format, setFormat] = useState('excel')
    const [employeeFilter, setEmployeeFilter] = useState('')
    const [stageFilter, setStageFilter] = useState('')
    const [datePreset, setDatePreset] = useState('')
    const [customFrom, setCustomFrom] = useState('')
    const [customTo, setCustomTo] = useState('')
    const [downloading, setDownloading] = useState(false)

    useEffect(() => {
        if (open) {
            setFormat('excel')
            setEmployeeFilter('')
            setStageFilter('')
            setDatePreset('')
            setCustomFrom('')
            setCustomTo('')
        }
    }, [open])

    const getDateRange = () => {
        const now = new Date()
        if (datePreset === 'this_week') {
            const day = now.getDay()
            const diff = now.getDate() - day + (day === 0 ? -6 : 1)
            const from = new Date(now.setDate(diff))
            from.setHours(0, 0, 0, 0)
            return { from, to: new Date() }
        }
        if (datePreset === 'this_month') {
            const from = new Date(now.getFullYear(), now.getMonth(), 1)
            return { from, to: new Date() }
        }
        if (datePreset === 'this_year') {
            const from = new Date(now.getFullYear(), 0, 1)
            return { from, to: new Date() }
        }
        if (datePreset === 'custom' && customFrom && customTo) {
            const from = new Date(customFrom)
            from.setHours(0, 0, 0, 0)
            const to = new Date(customTo)
            to.setHours(23, 59, 59, 999)
            return { from, to }
        }
        return null
    }

    const applyFilters = () => {
        let result = [...reports]
        if (employeeFilter) {
            result = result.filter(r => r.created_by?._id === employeeFilter || r.created_by === employeeFilter)
        }
        if (stageFilter) {
            result = result.filter(r => r.lead_stage === stageFilter)
        }
        const range = getDateRange()
        if (range) {
            result = result.filter(r => {
                const d = new Date(r.date || r.createdAt)
                return d >= range.from && d <= range.to
            })
        }
        return result
    }

    const buildRows = (data) => data.map((r, i) => ({
        'SR.': i + 1,
        'Date': fmtDate(r.date || r.createdAt),
        'Client Name': r.client_name || '—',
        'Client Email': r.client_email || '—',
        'Phone': r.client_phone || '—',
        'Company': r.company_name || '—',
        'Service': r.services || '—',
        'Country': r.country || '—',
        'Budget': r.budget || 0,
        'Lead Source': r.lead_source || '—',
        'Priority': r.priority || '—',
        'Review Status': STATUS[r.review_status]?.label || r.review_status || '—',
        'Lead Stage': STAGES[r.lead_stage]?.label || r.lead_stage || '—',
        'Marketer': r.marketer || '—',
        'Created By': r.created_by?.name || '—',
        'Assigned To': r.assigned_to?.name || '—',
        'Assigned At': r.assigned_at ? fmtDate(r.assigned_at) : '—',
        'Next Follow-Up': r.next_follow_up ? fmtDate(r.next_follow_up) : '—',
        'Follow-Up Count': r.follow_up_count || 0,
        'Message': r.message || '—',
        'Reject Reason': r.reject_reason || '—',
    }))

    const handleDownload = async () => {
        setDownloading(true)
        try {
            const filtered = applyFilters()
            if (filtered.length === 0) {
                alert('No records match the selected filters.')
                setDownloading(false)
                return
            }
            const rows = buildRows(filtered)
            const filename = `sales_leads_${new Date().toISOString().slice(0, 10)}`

            if (format === 'excel') {
                const ws = XLSX.utils.json_to_sheet(rows)
                // Column widths
                ws['!cols'] = Object.keys(rows[0]).map(k => ({ wch: Math.max(k.length, 14) }))
                const wb = XLSX.utils.book_new()
                XLSX.utils.book_append_sheet(wb, ws, 'Sales Leads')
                XLSX.writeFile(wb, `${filename}.xlsx`)
            } else {
                const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

                // Title
                doc.setFontSize(14)
                doc.setFont('helvetica', 'bold')
                doc.setTextColor(30, 41, 59)
                doc.text('Sales Leads Report', 14, 14)

                // Subtitle / filters applied
                doc.setFontSize(8)
                doc.setFont('helvetica', 'normal')
                doc.setTextColor(100, 116, 139)
                const subtitle = [
                    `Generated: ${fmtDate(new Date())}`,
                    employeeFilter ? `Employee: ${salesUsers.find(u => u._id === employeeFilter)?.name || employeeFilter}` : null,
                    stageFilter ? `Stage: ${STAGES[stageFilter]?.label || stageFilter}` : null,
                    datePreset ? `Period: ${DATE_PRESETS.find(d => d.value === datePreset)?.label}` : null,
                    `Total: ${filtered.length} records`,
                ].filter(Boolean).join('   |   ')
                doc.text(subtitle, 14, 20)

                // Columns to show in PDF (keep it readable in landscape A4)
                const pdfCols = [
                    'SR.', 'Date', 'Client Name', 'Service', 'Country',
                    'Priority', 'Review Status', 'Lead Stage', 'Created By', 'Assigned To',
                ]
                const head = [pdfCols]
                const body = rows.map(r => pdfCols.map(c => r[c] ?? '—'))

                autoTable(doc, {
                    head,
                    body,
                    startY: 24,
                    styles: { fontSize: 7.5, cellPadding: 3, textColor: [15, 23, 42] },
                    headStyles: {
                        fillColor: [79, 70, 229],
                        textColor: 255,
                        fontStyle: 'bold',
                        fontSize: 8,
                    },
                    alternateRowStyles: { fillColor: [241, 245, 249] },
                    columnStyles: { 0: { cellWidth: 10 }, 2: { cellWidth: 32 } },
                    margin: { left: 14, right: 14 },
                })

                doc.save(`${filename}.pdf`)
            }
            onClose()
        } catch (err) {
            console.error(err)
            alert('Download failed. Please try again.')
        } finally {
            setDownloading(false)
        }
    }

    if (!open) return null

    const labelStyle = { display: 'block', fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 6 }
    const selectBase = {
        width: '100%', padding: '9px 12px', borderRadius: 9,
        border: `1.5px solid ${C.slate300}`, background: C.white,
        fontSize: 13, color: C.text, outline: 'none',
        fontFamily: 'inherit', cursor: 'pointer', fontWeight: 500,
    }

    return (
        <div onClick={onClose} style={{
            position: 'fixed', inset: 0, zIndex: 90,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
            background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(6px)',
            animation: 'fadeIn 0.18s ease',
        }}>
            <div onClick={e => e.stopPropagation()} style={{
                background: C.white, borderRadius: 20, width: '100%', maxWidth: 500,
                boxShadow: '0 32px 80px rgba(15,23,42,0.24)', overflow: 'hidden',
                animation: 'modalIn 0.22s ease',
            }}>
                {/* Header */}
                <div style={{ padding: '20px 26px 16px', borderBottom: `1px solid ${C.slate100}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: C.indigoLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <FiDownload size={17} color={C.indigo} />
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: C.text }}>Download Report</h2>
                            <p style={{ margin: 0, fontSize: 11, color: C.textMuted }}>{reports.length} total records available</p>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${C.slate200}`, background: C.white, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: C.textSub }}>
                        <FiX size={14} />
                    </button>
                </div>

                <div style={{ padding: '20px 26px', display: 'flex', flexDirection: 'column', gap: 16 }}>

                    {/* Format toggle */}
                    <div>
                        <label style={labelStyle}>Export Format</label>
                        <div style={{ display: 'flex', gap: 8 }}>
                            {[{ v: 'excel', label: '📊 Excel (.xlsx)' }, { v: 'pdf', label: '📄 PDF (.pdf)' }].map(opt => (
                                <button key={opt.v} onClick={() => setFormat(opt.v)} style={{
                                    flex: 1, padding: '10px 0', borderRadius: 9, cursor: 'pointer',
                                    border: `2px solid ${format === opt.v ? C.indigo : C.slate200}`,
                                    background: format === opt.v ? C.indigoLight : C.white,
                                    color: format === opt.v ? C.indigo : C.textSub,
                                    fontSize: 13, fontWeight: 800, fontFamily: 'inherit',
                                    transition: 'all 0.15s',
                                }}>{opt.label}</button>
                            ))}
                        </div>
                    </div>

                    {/* Employee filter */}
                    <div>
                        <label style={labelStyle}><FiFilter size={11} style={{ marginRight: 4 }} />Filter by Employee</label>
                        <select value={employeeFilter} onChange={e => setEmployeeFilter(e.target.value)} style={selectBase}>
                            <option value="">All Employees</option>
                            {salesUsers.map(u => (
                                <option key={u._id} value={u._id}>{u.name} ({u.designation || u.role || 'Sales'})</option>
                            ))}
                        </select>
                    </div>

                    {/* Lead stage filter */}
                    <div>
                        <label style={labelStyle}><FiFilter size={11} style={{ marginRight: 4 }} />Filter by Lead Stage</label>
                        <select value={stageFilter} onChange={e => setStageFilter(e.target.value)} style={selectBase}>
                            {LEAD_STAGE_OPTIONS.map(o => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Date range */}
                    <div>
                        <label style={labelStyle}><FiCalendar size={11} style={{ marginRight: 4 }} />Date Range</label>
                        <select value={datePreset} onChange={e => setDatePreset(e.target.value)} style={{ ...selectBase, marginBottom: datePreset === 'custom' ? 10 : 0 }}>
                            {DATE_PRESETS.map(o => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>
                        {datePreset === 'custom' && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
                                <div>
                                    <label style={{ ...labelStyle, fontSize: 11, color: C.textMuted }}>From</label>
                                    <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
                                        style={{ ...selectBase, cursor: 'default' }} />
                                </div>
                                <div>
                                    <label style={{ ...labelStyle, fontSize: 11, color: C.textMuted }}>To</label>
                                    <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
                                        style={{ ...selectBase, cursor: 'default' }} />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Preview count */}
                    <div style={{ padding: '10px 14px', borderRadius: 10, background: C.slate50, border: `1px solid ${C.slate200}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 12, color: C.textMuted, fontWeight: 600 }}>Records matching filters</span>
                        <span style={{ fontSize: 15, fontWeight: 900, color: C.indigo }}>{applyFilters().length}</span>
                    </div>
                </div>

                {/* Footer */}
                <div style={{ display: 'flex', gap: 10, padding: '0 26px 22px' }}>
                    <button onClick={onClose} disabled={downloading} style={{
                        flex: 1, padding: '11px 0', borderRadius: 10, border: `1px solid ${C.slate300}`,
                        background: C.white, fontSize: 14, fontWeight: 700, color: C.textSub,
                        cursor: downloading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                    }}>Cancel</button>
                    <button onClick={handleDownload} disabled={downloading} className="action-btn" style={{
                        flex: 1, padding: '11px 0', borderRadius: 10, border: 'none',
                        background: downloading ? C.slate300 : C.indigo,
                        fontSize: 14, fontWeight: 800, color: C.white,
                        cursor: downloading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                        boxShadow: downloading ? 'none' : '0 4px 14px rgba(79,70,229,0.35)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    }}>
                        {downloading
                            ? <span style={{ width: 13, height: 13, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.35)', borderTopColor: C.white, animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                            : <FiDownload size={14} />
                        }
                        {downloading ? 'Generating...' : `Download ${format === 'excel' ? 'Excel' : 'PDF'}`}
                    </button>
                </div>
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
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [rejectModal, setRejectModal] = useState({ open: false, reportId: null, reportName: '' })
    const [detailModal, setDetailModal] = useState({ open: false, report: null })
    const [sendModal, setSendModal] = useState({ open: false, reportId: null })
    const [salesUsers, setSalesUsers] = useState([])
    const [toast, setToast] = useState({ message: '', type: 'success', visible: false })
    const [downloadModal, setDownloadModal] = useState(false)

    const showToast = useCallback((message, type = 'success') => {
        setToast({ message, type, visible: true })
        setTimeout(() => setToast(t => ({ ...t, visible: false })), 3500)
    }, [])

    const fetchReports = useCallback(async () => {
        setLoading(true)
        try {
            const { data } = await API.get('/manager/leads')
            setReports(data.leads || [])
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to fetch reports', 'error')
        } finally { setLoading(false) }
    }, [showToast])

    const fetchSalesUsers = async () => {
        try {
            const { data } = await API.get('/users/sales-users')
            setSalesUsers(data.users || [])
        } catch (err) { console.log(err) }
    }

    useEffect(() => { fetchSalesUsers() }, [])
    useEffect(() => { fetchReports() }, [fetchReports])

    // Keep detail modal in sync when reports update
    useEffect(() => {
        if (detailModal.open && detailModal.report) {
            const updated = reports.find(r => r._id === detailModal.report._id)
            if (updated) setDetailModal(d => ({ ...d, report: updated }))
        }
    }, [reports])

    const stats = useMemo(() => ({
        total: reports.length,
        pending: reports.filter(r => r.review_status === 'pending_review').length,
        approved: reports.filter(r => r.review_status === 'approved').length,
        rejected: reports.filter(r => r.review_status === 'rejected').length,
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
            const matchStatus = !filterStatus || r.review_status === filterStatus
            return matchSearch && matchStatus
        })
    }, [reports, search, filterStatus])

    useEffect(() => { setCurrentPage(1) }, [search, filterStatus, pageSize])

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
    const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

    const handleApprove = async (e, id) => {
        e.stopPropagation()
        setActioningId(id)
        try {
            const { data } = await API.put(`/manager/review/${id}`, { review_status: 'approved' })
            setReports(prev => prev.map(r => r._id === id ? { ...r, review_status: 'approved', action_date: data.lead?.action_date } : r))
            showToast('Report approved successfully')
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to approve', 'error')
        } finally { setActioningId(null) }
    }

    const openReject = (e, report) => {
        e.stopPropagation()
        setRejectModal({ open: true, reportId: report._id, reportName: report.client_name })
    }

    const handleRejectSubmit = async (reason) => {
        setActioningId(rejectModal.reportId)
        try {
            const { data } = await API.put(`/manager/review/${rejectModal.reportId}`, { review_status: 'rejected', reject_reason: reason })
            setReports(prev => prev.map(r =>
                r._id === rejectModal.reportId
                    ? { ...r, review_status: 'rejected', reject_reason: reason, action_date: data.lead?.action_date }
                    : r
            ))
            setRejectModal({ open: false, reportId: null, reportName: '' })
            showToast('Report rejected')
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to reject', 'error')
        } finally { setActioningId(null) }
    }

    const isPending = (r) => r.review_status === 'pending_review'

    return (
        <DashboardLayout>
            <style>{globalStyles}</style>

            <div style={{ minHeight: '100vh', background: C.pageBg, padding: '20px', display: 'flex', flexDirection: 'column', gap: 18, boxSizing: 'border-box' }}>

                {/* ── Page Header ── */}
                <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: C.indigo, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <FiBarChart2 size={20} color={C.white} />
                        </div>
                        <div>
                            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: C.text, letterSpacing: '-0.02em' }}>Sales Reports</h1>
                            <p style={{ margin: 0, fontSize: 12, color: C.textMuted, fontWeight: 500 }}>Review and manage submitted sales reports</p>
                        </div>
                    </div>
                    <span style={{ fontSize: 12, color: C.textMuted, fontWeight: 600, background: C.white, padding: '5px 12px', borderRadius: 20, border: `1px solid ${C.slate200}` }}>
                        {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                </div>

                {/* ── Stat Cards ── */}
                <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
                    <StatCard label="Total Reports" value={stats.total} topColor="#3b82f6" loading={loading} active={filterStatus === ''} onClick={() => setFilterStatus('')} icon={FiFileText} />
                    <StatCard label="Pending" value={stats.pending} topColor="#f59e0b" loading={loading} active={filterStatus === 'pending_review'} onClick={() => setFilterStatus(p => p === 'pending_review' ? '' : 'pending_review')} icon={FiClock} />
                    <StatCard label="Approved" value={stats.approved} topColor="#10b981" loading={loading} active={filterStatus === 'approved'} onClick={() => setFilterStatus(p => p === 'approved' ? '' : 'approved')} icon={FiCheckCircle} />
                    <StatCard label="Rejected" value={stats.rejected} topColor="#ef4444" loading={loading} active={filterStatus === 'rejected'} onClick={() => setFilterStatus(p => p === 'rejected' ? '' : 'rejected')} icon={FiXCircle} />
                </div>

                {/* ── Main Panel ── */}
                <div style={{ background: C.white, borderRadius: 20, border: `1px solid ${C.slate200}`, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>

                    {/* Toolbar */}
                    <div className="toolbar" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px', borderBottom: `1px solid ${C.slate100}`, flexWrap: 'wrap' }}>
                        <div className="toolbar-search" style={{ position: 'relative', flex: '1 1 40px', minWidth: 200 }}>
                            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: C.textMuted, display: 'flex' }}>
                                <FiSearch size={15} />
                            </span>
                            <input
                                type="text" placeholder="Search by name, email or country..."
                                value={search} onChange={e => setSearch(e.target.value)}
                                onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)}
                                style={{
                                    paddingLeft: 36, paddingRight: 14, paddingTop: 9, paddingBottom: 9,
                                    width: '100%', borderRadius: 50,
                                    border: `1.5px solid ${searchFocused ? C.indigo : C.slate300}`,
                                    boxShadow: searchFocused ? `0 0 0 3px ${C.indigoLight}` : 'none',
                                    fontSize: 13, color: C.text, background: C.white,
                                    outline: 'none', fontFamily: 'inherit', transition: 'all 0.2s', fontWeight: 500,
                                }}
                            />
                        </div>
                        <select className="toolbar-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{
                            padding: '9px 13px', borderRadius: 9, border: `1.5px solid ${C.slate300}`,
                            background: C.white, fontSize: 13, color: C.text, outline: 'none',
                            fontFamily: 'inherit', cursor: 'pointer', fontWeight: 600, flex: '0 0 auto',
                        }}>
                            <option value="">All Status</option>
                            <option value="pending_review">Pending Review</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                        </select>
                        <div className="toolbar-right" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 20 }}>
                            <button className="refresh-btn action-btn" onClick={fetchReports} disabled={loading} style={{
                                display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 9,
                                border: `1px solid ${C.slate200}`, background: C.white, color: C.textSub, fontSize: 13,
                                fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: loading ? 0.6 : 1,
                            }}>
                                <FiRefreshCw size={13} style={{ animation: loading ? 'spin 0.7s linear infinite' : 'none' }} />
                                Refresh
                            </button>
                            <button className="action-btn" onClick={() => setDownloadModal(true)} disabled={loading || reports.length === 0} style={{
                                display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 9,
                                border: 'none', background: C.indigo, color: C.white, fontSize: 13,
                                fontWeight: 700, cursor: (loading || reports.length === 0) ? 'not-allowed' : 'pointer',
                                fontFamily: 'inherit', opacity: (loading || reports.length === 0) ? 0.5 : 1,
                                boxShadow: '0 2px 8px rgba(79,70,229,0.3)',
                            }}>
                                <FiDownload size={13} />
                                Download
                            </button>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="table-wrapper" style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                            <thead>
                                <tr style={{ borderBottom: `1px solid ${C.slate100}`, background: C.slate50 }}>
                                    {['SR.', 'Date', 'Client Name', 'Service', 'Country', 'Priority', 'Status', 'Lead Stage', 'Actions'].map(h => (
                                        <th key={h} style={{
                                            padding: '11px 20px', textAlign: 'center',
                                            fontSize: 11, fontWeight: 800, letterSpacing: '0.08em',
                                            color: C.textSub, textTransform: 'uppercase', whiteSpace: 'nowrap',
                                        }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                                ) : paginated.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} style={{ padding: '64px 24px', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                                                <div style={{ width: 56, height: 56, borderRadius: 16, background: C.slate100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <FiFileText size={24} color={C.textMuted} />
                                                </div>
                                                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.textSub }}>No reports found</p>
                                                <p style={{ margin: 0, fontSize: 12, color: C.textMuted }}>
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
                                            <tr key={report._id} className="report-row"
                                                onClick={() => setDetailModal({ open: true, report })}
                                                style={{ borderBottom: `1px solid ${C.slate50}` }}
                                            >
                                                <td style={{ padding: '14px 20px' }}>
                                                    <span style={{
                                                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                                        width: 28, height: 28, borderRadius: 7,
                                                        background: C.slate100, fontSize: 11, fontWeight: 800, color: C.textSub,
                                                    }}>{String(srNo).padStart(2, '0')}</span>
                                                </td>
                                                <td style={{ padding: '14px 20px', color: C.textSub, fontWeight: 600, whiteSpace: 'nowrap', fontSize: 13 }}>
                                                    {fmtDate(report.date || report.createdAt)}
                                                </td>
                                                <td style={{ padding: '14px 20px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                        <div style={{
                                                            width: 36, height: 36, borderRadius: '50%',
                                                            background: getAvatarColor(report.client_name),
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            color: C.white, fontSize: 12, fontWeight: 800, flexShrink: 0,
                                                        }}>{getInitials(report.client_name)}</div>
                                                        <div>
                                                            <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: C.text }}>{report.client_name}</p>
                                                            <p style={{ margin: 0, fontSize: 11, color: C.textMuted, fontWeight: 500 }}>{report.client_email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '14px 20px', color: C.textSub, fontWeight: 600 }}>{report.services || '—'}</td>
                                                <td style={{ padding: '14px 20px', color: C.textSub, fontWeight: 600 }}>{report.country || '—'}</td>
                                                <td style={{ padding: '14px 20px' }}>
                                                    <span style={{
                                                        padding: '5px 10px', borderRadius: 6,
                                                        background: report.priority === 'urgent' ? '#fef2f2' : report.priority === 'high' ? '#fff7ed' : '#f8fafc',
                                                        color: report.priority === 'urgent' ? '#dc2626' : report.priority === 'high' ? '#ea580c' : '#475569',
                                                        fontSize: 11, fontWeight: 800, textTransform: 'uppercase',
                                                    }}>
                                                        {report.priority || 'medium'}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '14px 20px' }}>
                                                    <StatusBadge status={report.review_status} />
                                                </td>
                                                <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                                                    {report.lead_stage
                                                        ? <StageBadge stage={report.lead_stage} />
                                                        : <span style={{ fontSize: 12, color: C.textMuted }}>—</span>
                                                    }
                                                </td>
                                                <td style={{ padding: '14px 20px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                                                        {pending ? (
                                                            <>
                                                                <button className="action-btn" onClick={e => handleApprove(e, report._id)} disabled={actioning} style={{
                                                                    display: 'inline-flex', alignItems: 'center', gap: 5,
                                                                    padding: '6px 12px', borderRadius: 7,
                                                                    border: `1px solid ${C.emeraldBorder}`,
                                                                    background: actioning ? C.slate100 : C.emeraldLight,
                                                                    color: actioning ? C.textMuted : C.emerald,
                                                                    fontSize: 12, fontWeight: 800, cursor: actioning ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                                                                }}>
                                                                    {actioning
                                                                        ? <span style={{ width: 11, height: 11, borderRadius: '50%', border: `2px solid ${C.slate300}`, borderTopColor: C.emerald, animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                                                                        : <FiCheck size={12} strokeWidth={3} />
                                                                    }
                                                                    Approve
                                                                </button>
                                                                <button className="action-btn" onClick={e => openReject(e, report)} disabled={actioning} style={{
                                                                    display: 'inline-flex', alignItems: 'center', gap: 5,
                                                                    padding: '6px 12px', borderRadius: 7,
                                                                    border: `1px solid ${C.redBorder}`,
                                                                    background: actioning ? C.slate100 : C.redLight,
                                                                    color: actioning ? C.textMuted : C.redDark,
                                                                    fontSize: 12, fontWeight: 800, cursor: actioning ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                                                                }}>
                                                                    <FiX size={12} strokeWidth={3} />
                                                                    Reject
                                                                </button>
                                                            </>
                                                        ) : (
                                                            // <span style={{ fontSize: 12, color: report.review_status === 'approved' ? C.emerald : C.redDark, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                            //     {report.review_status === 'approved' ? <FiCheckCircle size={12} /> : <FiXCircle size={12} />}
                                                            //     {report.review_status === 'approved' ? 'Approved' : 'Rejected'}
                                                            // </span>
                                                            ""
                                                        )}

                                                        {report.review_status === 'approved' && !report.assigned_to && (
                                                            <button className="action-btn" onClick={e => { e.stopPropagation(); setSendModal({ open: true, reportId: report._id }) }} style={{
                                                                display: 'inline-flex', alignItems: 'center', gap: 5,
                                                                padding: '6px 12px', borderRadius: 7, border: 'none',
                                                                background: C.indigo, color: C.white,
                                                                fontSize: 12, fontWeight: 800, cursor: 'pointer',
                                                                boxShadow: '0 2px 8px rgba(79,70,229,0.3)',
                                                            }}>
                                                                <FiSend size={11} />
                                                                Send
                                                            </button>
                                                        )}

                                                        {report.assigned_to && (
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '4px 8px', borderRadius: 6, background: '#ecfdf5' }}>
                                                                <span style={{ fontSize: 10, fontWeight: 800, color: '#047857', textTransform: 'uppercase' }}>Assigned To</span>
                                                                <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{report.assigned_to?.name}</span>
                                                            </div>
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
                            onPageSizeChange={s => { setPageSize(s); setCurrentPage(1) }}
                        />
                    )}
                </div>
            </div>

            <DetailModal
                open={detailModal.open}
                report={detailModal.report}
                onClose={() => setDetailModal({ open: false, report: null })}
                showToast={showToast}
            />
            <RejectModal
                open={rejectModal.open}
                onClose={() => !actioningId && setRejectModal({ open: false, reportId: null, reportName: '' })}
                onSubmit={handleRejectSubmit}
                submitting={!!actioningId}
                reportName={rejectModal.reportName}
            />
            <SendModal
                open={sendModal.open}
                reportId={sendModal.reportId}
                salesUsers={salesUsers}
                onClose={() => setSendModal({ open: false, reportId: null })}
                onSend={(updatedLead) => setReports(prev => prev.map(r => r._id === updatedLead._id ? updatedLead : r))}
                showToast={showToast}
            />
            <DownloadModal
                open={downloadModal}
                onClose={() => setDownloadModal(false)}
                reports={reports}
                salesUsers={salesUsers}
            />
            <Toast message={toast.message} type={toast.type} visible={toast.visible} />
        </DashboardLayout>
    )
}

export default ManagerSalesReports