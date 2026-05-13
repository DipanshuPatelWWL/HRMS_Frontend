import React, { useState, useMemo, useEffect, useCallback } from 'react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import API from '../../services/api'
import {
    FiSearch, FiRefreshCw, FiX, FiChevronLeft, FiChevronRight,
    FiFileText, FiCheckCircle, FiXCircle, FiClock, FiAlertCircle,
    FiMessageSquare, FiCalendar, FiActivity, FiTrendingUp,
    FiEdit3, FiChevronDown,
} from 'react-icons/fi'

/* ─── Colors (same palette as ManagerSalesReports) ── */
const C = {
    indigo: '#4f46e5', indigoDark: '#3730a3', indigoLight: '#eef2ff', indigoBorder: '#a5b4fc',
    red: '#dc2626', redDark: '#b91c1c', redLight: '#fef2f2', redBorder: '#fca5a5',
    emerald: '#047857', emeraldLight: '#ecfdf5', emeraldBorder: '#6ee7b7',
    blue: '#1d4ed8', blueLight: '#eff6ff', blueBorder: '#93c5fd',
    amber: '#b45309', amberLight: '#fffbeb', amberBorder: '#fcd34d',
    slate50: '#f8fafc', slate100: '#f1f5f9', slate200: '#e2e8f0', slate300: '#cbd5e1',
    slate400: '#64748b', slate500: '#475569', slate600: '#334155', slate700: '#1e293b',
    slate800: '#0f172a', white: '#ffffff', pageBg: '#f1f3f9',
    text: '#0f172a', textSub: '#334155', textMuted: '#64748b',
}

/* ─── Lead Stages ── */
const STAGES = [
    { value: 'assigned', label: 'Assigned', color: '#4f46e5', bg: '#eef2ff' },
    { value: 'contacted', label: 'Contacted', color: '#0d9488', bg: '#f0fdfa' },
    { value: 'meeting_scheduled', label: 'Meeting Scheduled', color: '#7c3aed', bg: '#f5f3ff' },
    { value: 'proposal_sent', label: 'Proposal Sent', color: '#b45309', bg: '#fffbeb' },
    { value: 'negotiation', label: 'Negotiation', color: '#ea580c', bg: '#fff7ed' },
    { value: 'won', label: 'Won', color: '#047857', bg: '#ecfdf5' },
    { value: 'lost', label: 'Lost', color: '#b91c1c', bg: '#fef2f2' },
    { value: 'on_hold', label: 'On Hold', color: '#64748b', bg: '#f1f5f9' },
]

const PAGE_SIZE_OPTIONS = [10, 25, 50]
const AVATAR_COLORS = ['#7c3aed', '#4f46e5', '#2563eb', '#db2777', '#d97706', '#0d9488', '#e11d48']
const getAvatarColor = (name = '') => AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length]
const getInitials = (name = '') => name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?'
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
const fmtDateTime = (d) => d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'

const getStage = (val) => STAGES.find(s => s.value === val) || STAGES[0]

/* ─── Global Styles ── */
const globalStyles = `
    @keyframes spin    { to { transform: rotate(360deg); } }
    @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:0.4} }
    @keyframes slideUp { from{transform:translateY(20px);opacity:0} to{transform:translateY(0);opacity:1} }
    @keyframes modalIn { from{transform:scale(0.96) translateY(10px);opacity:0} to{transform:scale(1) translateY(0);opacity:1} }
    @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
    * { box-sizing: border-box; }
    .lead-row { cursor: pointer; transition: background 0.15s; }
    .lead-row:hover td { background: #f0f4ff !important; }
    .action-btn { transition: all 0.18s ease !important; }
    .action-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important; }
    .stat-card { transition: all 0.2s ease; }
    .stat-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.1) !important; }
    input:focus, select:focus, textarea:focus { outline: none; }
    @media (max-width: 768px) {
        .stats-grid { grid-template-columns: repeat(2,1fr) !important; }
        .toolbar { flex-direction: column !important; align-items: stretch !important; }
        .toolbar-search { width: 100% !important; }
        .modal-box { max-width: 98vw !important; margin: 8px !important; }
        .modal-footer-btns { flex-direction: column !important; }
        .modal-footer-btns button { flex: unset !important; width: 100% !important; }
        .pagination-wrap { flex-direction: column !important; align-items: flex-start !important; gap: 8px !important; }
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
            animation: 'slideUp 0.3s ease', maxWidth: 340,
        }}>
            {type === 'error' ? <FiXCircle size={16} /> : <FiCheckCircle size={16} />}
            {message}
        </div>
    )
}

/* ─── StatCard ── */
const StatCard = ({ label, value, topColor, loading, icon: Icon }) => (
    <div className="stat-card" style={{
        background: C.white, borderRadius: 16, padding: '20px 22px',
        borderTop: `4px solid ${topColor}`,
        border: `1px solid ${C.slate200}`, borderTopColor: topColor,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
            <p style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.textMuted, margin: 0 }}>{label}</p>
            {Icon && <Icon size={18} color={topColor} />}
        </div>
        {loading
            ? <div style={{ width: 60, height: 36, borderRadius: 8, background: C.slate100, animation: 'pulse 1.5s ease infinite' }} />
            : <p className="stat-value" style={{ fontSize: 34, fontWeight: 900, color: C.slate800, margin: 0, lineHeight: 1 }}>{value}</p>
        }
    </div>
)

/* ─── StageBadge ── */
const StageBadge = ({ stage }) => {
    const s = getStage(stage)
    return (
        <span style={{
            padding: '4px 10px', borderRadius: 6,
            background: s.bg, color: s.color,
            fontSize: 12, fontWeight: 800, whiteSpace: 'nowrap',
        }}>{s.label}</span>
    )
}

/* ─── Skeleton Row ── */
const SkeletonRow = () => (
    <tr style={{ borderBottom: `1px solid ${C.slate50}` }}>
        {[60, 90, 200, 110, 100, 120, 140].map((w, i) => (
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

/* ─── Update Stage Modal ── */
const StageModal = ({ open, lead, onClose, onUpdated, showToast }) => {
    const [stage, setStage] = useState('')
    const [lostReason, setLostReason] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')
    const selectFocus = useInputFocus()
    const lostFocus = useInputFocus()

    useEffect(() => {
        if (open && lead) { setStage(lead.lead_stage || 'assigned'); setLostReason(''); setError('') }
    }, [open, lead])

    const handleSubmit = async () => {
        if (!stage) { setError('Please select a stage'); return }
        if (stage === 'lost' && !lostReason.trim()) { setError('Please provide a lost reason'); return }
        setSubmitting(true)
        try {
            const { data } = await API.put(`/updateLeadStage/${lead._id}`, {
                lead_stage: stage,
                lost_reason: lostReason,
            })
            showToast('Lead stage updated successfully')
            onUpdated(data.lead)
            onClose()
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to update stage', 'error')
        } finally { setSubmitting(false) }
    }

    if (!open || !lead) return null
    return (
        <div onClick={onClose} style={{
            position: 'fixed', inset: 0, zIndex: 70,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
            background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(6px)',
            animation: 'fadeIn 0.18s ease',
        }}>
            <div onClick={e => e.stopPropagation()} className="modal-box" style={{
                background: C.white, borderRadius: 20, width: '100%', maxWidth: 440,
                boxShadow: '0 32px 80px rgba(15,23,42,0.24)', overflow: 'hidden',
                animation: 'modalIn 0.22s ease',
            }}>
                {/* Header */}
                <div style={{ padding: '20px 26px 16px', borderBottom: `1px solid ${C.slate100}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 10, background: C.indigoLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <FiTrendingUp size={16} color={C.indigo} />
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: C.text }}>Update Lead Stage</h2>
                            <p style={{ margin: 0, fontSize: 12, color: C.textMuted }}>{lead.client_name}</p>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${C.slate200}`, background: C.white, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: C.textSub }}>
                        <FiX size={14} />
                    </button>
                </div>

                <div style={{ padding: '20px 26px' }}>
                    {/* Current Stage */}
                    <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 10, background: C.slate50, border: `1px solid ${C.slate200}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 12, color: C.textMuted, fontWeight: 600 }}>Current Stage</span>
                        <StageBadge stage={lead.lead_stage} />
                    </div>

                    <div style={{ marginBottom: 16 }}>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 7 }}>
                            New Stage <span style={{ color: C.red }}>*</span>
                        </label>
                        <div style={{ position: 'relative' }}>
                            <select
                                value={stage}
                                onChange={e => { setStage(e.target.value); setError('') }}
                                onFocus={selectFocus.onFocus} onBlur={selectFocus.onBlur}
                                style={{ ...inputStyle(selectFocus.focused, error && !stage), appearance: 'none', cursor: 'pointer', paddingRight: 36 }}
                            >
                                {STAGES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                            </select>
                            <FiChevronDown size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: C.textMuted, pointerEvents: 'none' }} />
                        </div>
                    </div>

                    {stage === 'lost' && (
                        <div style={{ marginBottom: 4 }}>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 7 }}>
                                Lost Reason <span style={{ color: C.red }}>*</span>
                            </label>
                            <textarea
                                placeholder="Why was this lead lost?"
                                value={lostReason}
                                onChange={e => { setLostReason(e.target.value); setError('') }}
                                onFocus={lostFocus.onFocus} onBlur={lostFocus.onBlur}
                                rows={3}
                                style={inputStyle(lostFocus.focused, error && !lostReason)}
                            />
                        </div>
                    )}

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
                        cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                    }}>Cancel</button>
                    <button onClick={handleSubmit} disabled={submitting} className="action-btn" style={{
                        flex: 1, padding: '11px 0', borderRadius: 10, border: 'none',
                        background: submitting ? C.slate300 : C.indigo, fontSize: 14, fontWeight: 800,
                        color: C.white, cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                        boxShadow: submitting ? 'none' : '0 4px 14px rgba(79,70,229,0.35)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    }}>
                        {submitting && <span style={{ width: 13, height: 13, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.35)', borderTopColor: C.white, animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />}
                        {submitting ? 'Updating...' : 'Update Stage'}
                    </button>
                </div>
            </div>
        </div>
    )
}

/* ─── Lead Detail Modal (with tabs) ── */
const DetailModal = ({ open, lead, onClose, onLeadUpdated, showToast }) => {
    const [activeTab, setActiveTab] = useState('details')
    const [remarks, setRemarks] = useState([])
    const [remarkText, setRemarkText] = useState('')
    const [addingRemark, setAddingRemark] = useState(false)
    const [followUpDate, setFollowUpDate] = useState('')
    const [addingFollowUp, setAddingFollowUp] = useState(false)
    const [timeline, setTimeline] = useState([])
    const [timelineLoading, setTimelineLoading] = useState(false)
    const remarkFocus = useInputFocus()

    useEffect(() => {
        if (open && lead) {
            setActiveTab('details')
            setRemarkText('')
            setFollowUpDate('')
            setRemarks(lead.remarks || [])
        }
    }, [open, lead])

    useEffect(() => {
        if (activeTab === 'timeline' && lead) fetchTimeline()
    }, [activeTab])

    const fetchTimeline = async () => {
        setTimelineLoading(true)
        try {
            const { data } = await API.get(`/leadTimeline/${lead._id}`)
            setTimeline(data.timeline || [])
        } catch (err) {
            showToast('Failed to load timeline', 'error')
        } finally { setTimelineLoading(false) }
    }

    const handleAddRemark = async () => {
        if (!remarkText.trim()) return
        setAddingRemark(true)
        try {
            const { data } = await API.post(`/addRemark/${lead._id}`, { message: remarkText.trim() })
            setRemarks(data.lead?.remarks || [])
            setRemarkText('')
            showToast('Remark added')
            onLeadUpdated(data.lead)
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to add remark', 'error')
        } finally { setAddingRemark(false) }
    }

    const handleAddFollowUp = async () => {
        if (!followUpDate) return
        setAddingFollowUp(true)
        try {
            const { data } = await API.post(`/addFollowUp/${lead._id}`, { next_follow_up: followUpDate })
            showToast('Follow-up date updated')
            onLeadUpdated(data.lead)
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to update follow-up', 'error')
        } finally { setAddingFollowUp(false) }
    }

    if (!open || !lead) return null

    const TABS = [
        { key: 'details', label: 'Details', icon: FiFileText },
        { key: 'remarks', label: `Remarks (${remarks.length})`, icon: FiMessageSquare },
        { key: 'followup', label: 'Follow-Up', icon: FiCalendar },
        { key: 'timeline', label: 'Timeline', icon: FiActivity },
    ]

    const Detail = ({ label, value, fullWidth }) => (
        <div style={{ gridColumn: fullWidth ? 'span 2' : 'span 1', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.textMuted }}>{label}</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: C.text, wordBreak: 'break-word', lineHeight: 1.5 }}>{value || '—'}</span>
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
                            width: 46, height: 46, borderRadius: '50%', background: getAvatarColor(lead.client_name),
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: C.white, fontSize: 15, fontWeight: 800, flexShrink: 0,
                        }}>{getInitials(lead.client_name)}</div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: C.text }}>{lead.client_name}</h2>
                            <p style={{ margin: '2px 0 0', fontSize: 12, color: C.textMuted }}>{lead.client_email}</p>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${C.slate200}`, background: C.white, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: C.textSub, flexShrink: 0 }}>
                        <FiX size={14} />
                    </button>
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
                            <div style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 12, background: C.slate50, border: `1px solid ${C.slate200}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: 13, fontWeight: 700, color: C.textSub }}>Lead Stage</span>
                                <StageBadge stage={lead.lead_stage} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px 22px' }}>
                                <Detail label="Report Date" value={fmtDate(lead.date || lead.createdAt)} />
                                <Detail label="Service" value={lead.services} />
                                <Detail label="Country" value={lead.country} />
                                <Detail label="Client Phone" value={lead.client_phone} />
                                <Detail label="Priority" value={lead.priority ? lead.priority.charAt(0).toUpperCase() + lead.priority.slice(1) : '—'} />
                                <Detail label="Assigned By" value={lead.assigned_by?.name} />
                                <Detail label="Assigned At" value={fmtDateTime(lead.assigned_at)} />
                                {lead.assignment_note && <Detail label="Assignment Note" value={lead.assignment_note} fullWidth />}
                                {lead.next_follow_up && <Detail label="Next Follow-Up" value={fmtDate(lead.next_follow_up)} />}
                                {lead.follow_up_count > 0 && <Detail label="Follow-Up Count" value={lead.follow_up_count} />}
                                {lead.message && <Detail label="Notes" value={lead.message} fullWidth />}
                            </div>
                        </div>
                    )}

                    {/* ── Remarks Tab ── */}
                    {activeTab === 'remarks' && (
                        <div>
                            {/* Add Remark */}
                            <div style={{ marginBottom: 20 }}>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 8 }}>Add Remark</label>
                                <textarea
                                    placeholder="Write your remark here..."
                                    value={remarkText}
                                    onChange={e => setRemarkText(e.target.value)}
                                    onFocus={remarkFocus.onFocus} onBlur={remarkFocus.onBlur}
                                    rows={3}
                                    style={inputStyle(remarkFocus.focused, false)}
                                />
                                <button onClick={handleAddRemark} disabled={addingRemark || !remarkText.trim()} className="action-btn" style={{
                                    marginTop: 10, padding: '10px 20px', borderRadius: 9, border: 'none',
                                    background: addingRemark || !remarkText.trim() ? C.slate300 : C.indigo,
                                    color: C.white, fontSize: 13, fontWeight: 800,
                                    cursor: addingRemark || !remarkText.trim() ? 'not-allowed' : 'pointer',
                                    fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 7,
                                    boxShadow: addingRemark || !remarkText.trim() ? 'none' : '0 4px 12px rgba(79,70,229,0.3)',
                                }}>
                                    {addingRemark && <span style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.35)', borderTopColor: C.white, animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />}
                                    <FiEdit3 size={13} />
                                    {addingRemark ? 'Adding...' : 'Add Remark'}
                                </button>
                            </div>

                            {/* Remarks List */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {remarks.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '32px 0', color: C.textMuted }}>
                                        <FiMessageSquare size={28} style={{ marginBottom: 8, opacity: 0.4 }} />
                                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>No remarks yet</p>
                                    </div>
                                ) : [...remarks].reverse().map((r, i) => (
                                    <div key={i} style={{ padding: '12px 14px', borderRadius: 10, background: C.slate50, border: `1px solid ${C.slate200}` }}>
                                        <p style={{ margin: '0 0 6px', fontSize: 13, color: C.text, fontWeight: 500, lineHeight: 1.5 }}>{r.message}</p>
                                        <p style={{ margin: 0, fontSize: 11, color: C.textMuted, fontWeight: 600 }}>
                                            {r.added_by?.name || 'You'} · {fmtDateTime(r.createdAt)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── Follow-Up Tab ── */}
                    {activeTab === 'followup' && (
                        <div>
                            {/* Current Follow-Up */}
                            {lead.next_follow_up && (
                                <div style={{ marginBottom: 20, padding: '14px 16px', borderRadius: 12, background: C.amberLight, border: `1px solid ${C.amberBorder}`, display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <FiCalendar size={18} color={C.amber} />
                                    <div>
                                        <p style={{ margin: 0, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.amber }}>Current Follow-Up Date</p>
                                        <p style={{ margin: '2px 0 0', fontSize: 14, fontWeight: 700, color: C.text }}>{fmtDate(lead.next_follow_up)}</p>
                                    </div>
                                </div>
                            )}

                            <div style={{ marginBottom: 8 }}>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 8 }}>
                                    {lead.next_follow_up ? 'Update Follow-Up Date' : 'Set Follow-Up Date'}
                                </label>
                                <input
                                    type="date"
                                    value={followUpDate}
                                    min={new Date().toISOString().split('T')[0]}
                                    onChange={e => setFollowUpDate(e.target.value)}
                                    style={{
                                        ...inputStyle(false, false),
                                        cursor: 'pointer',
                                    }}
                                />
                            </div>

                            {lead.follow_up_count > 0 && (
                                <p style={{ margin: '8px 0 16px', fontSize: 12, color: C.textMuted, fontWeight: 500 }}>
                                    Total follow-ups done: <strong>{lead.follow_up_count}</strong>
                                </p>
                            )}

                            <button onClick={handleAddFollowUp} disabled={addingFollowUp || !followUpDate} className="action-btn" style={{
                                padding: '10px 20px', borderRadius: 9, border: 'none',
                                background: addingFollowUp || !followUpDate ? C.slate300 : C.indigo,
                                color: C.white, fontSize: 13, fontWeight: 800,
                                cursor: addingFollowUp || !followUpDate ? 'not-allowed' : 'pointer',
                                fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 7,
                                boxShadow: addingFollowUp || !followUpDate ? 'none' : '0 4px 12px rgba(79,70,229,0.3)',
                            }}>
                                {addingFollowUp && <span style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.35)', borderTopColor: C.white, animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />}
                                <FiCalendar size={13} />
                                {addingFollowUp ? 'Saving...' : 'Save Follow-Up'}
                            </button>
                        </div>
                    )}

                    {/* ── Timeline Tab ── */}
                    {activeTab === 'timeline' && (
                        <div>
                            {timelineLoading ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {Array.from({ length: 4 }).map((_, i) => (
                                        <div key={i} style={{ height: 56, borderRadius: 10, background: C.slate100, animation: 'pulse 1.5s ease infinite' }} />
                                    ))}
                                </div>
                            ) : timeline.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '32px 0', color: C.textMuted }}>
                                    <FiActivity size={28} style={{ marginBottom: 8, opacity: 0.4 }} />
                                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>No timeline events yet</p>
                                </div>
                            ) : (
                                <div style={{ position: 'relative', paddingLeft: 24 }}>
                                    {/* Vertical line */}
                                    <div style={{ position: 'absolute', left: 7, top: 8, bottom: 8, width: 2, background: C.slate200, borderRadius: 2 }} />
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
                                                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.text }}>{t.message}</p>
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
                        background: C.white, fontSize: 14, fontWeight: 700, color: C.textSub, cursor: 'pointer', fontFamily: 'inherit',
                    }}>Close</button>
                </div>
            </div>
        </div>
    )
}

/* ─── Main BDE Panel ── */
const BDESalesReport = () => {
    const [leads, setLeads] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [filterStage, setFilterStage] = useState('')
    const [searchFocused, setSearchFocused] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [detailModal, setDetailModal] = useState({ open: false, lead: null })
    const [stageModal, setStageModal] = useState({ open: false, lead: null })
    const [toast, setToast] = useState({ message: '', type: 'success', visible: false })

    const showToast = useCallback((message, type = 'success') => {
        setToast({ message, type, visible: true })
        setTimeout(() => setToast(t => ({ ...t, visible: false })), 3500)
    }, [])

    const fetchLeads = useCallback(async () => {
        setLoading(true)
        try {
            const { data } = await API.get('/assignedLeads')
            setLeads(data.leads || [])
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to fetch leads', 'error')
        } finally { setLoading(false) }
    }, [showToast])

    useEffect(() => { fetchLeads() }, [fetchLeads])

    const handleLeadUpdated = useCallback((updatedLead) => {
        setLeads(prev => prev.map(l => l._id === updatedLead._id ? updatedLead : l))
        // sync detail modal
        setDetailModal(d => d.open && d.lead?._id === updatedLead._id ? { ...d, lead: updatedLead } : d)
    }, [])

    const stats = useMemo(() => ({
        total: leads.length,
        active: leads.filter(l => !['won', 'lost'].includes(l.lead_stage)).length,
        won: leads.filter(l => l.lead_stage === 'won').length,
        lost: leads.filter(l => l.lead_stage === 'lost').length,
    }), [leads])

    const filtered = useMemo(() => {
        const q = search.toLowerCase()
        return leads.filter(l => {
            const matchSearch = !q ||
                l.client_name?.toLowerCase().includes(q) ||
                l.client_email?.toLowerCase().includes(q) ||
                l.services?.toLowerCase().includes(q) ||
                l.country?.toLowerCase().includes(q)
            const matchStage = !filterStage || l.lead_stage === filterStage
            return matchSearch && matchStage
        })
    }, [leads, search, filterStage])

    useEffect(() => { setCurrentPage(1) }, [search, filterStage, pageSize])

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
    const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

    return (
        <DashboardLayout>
            <style>{globalStyles}</style>

            <div style={{ minHeight: '100vh', background: C.pageBg, padding: '20px', display: 'flex', flexDirection: 'column', gap: 18, boxSizing: 'border-box' }}>

                {/* ── Page Header ── */}
                <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: C.indigo, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <FiTrendingUp size={20} color={C.white} />
                        </div>
                        <div>
                            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: C.text, letterSpacing: '-0.02em' }}>My Assigned Leads</h1>
                            <p style={{ margin: 0, fontSize: 12, color: C.textMuted, fontWeight: 500 }}>Manage and track your assigned leads</p>
                        </div>
                    </div>
                    <span style={{ fontSize: 12, color: C.textMuted, fontWeight: 600, background: C.white, padding: '5px 12px', borderRadius: 20, border: `1px solid ${C.slate200}` }}>
                        {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                </div>

                {/* ── Stat Cards ── */}
                <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
                    <StatCard label="Total Assigned" value={stats.total} topColor="#3b82f6" loading={loading} icon={FiFileText} />
                    <StatCard label="Active" value={stats.active} topColor="#4f46e5" loading={loading} icon={FiClock} />
                    <StatCard label="Won" value={stats.won} topColor="#10b981" loading={loading} icon={FiCheckCircle} />
                    <StatCard label="Lost" value={stats.lost} topColor="#ef4444" loading={loading} icon={FiXCircle} />
                </div>

                {/* ── Main Panel ── */}
                <div style={{ background: C.white, borderRadius: 20, border: `1px solid ${C.slate200}`, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>

                    {/* Toolbar */}
                    <div className="toolbar" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px', borderBottom: `1px solid ${C.slate100}`, flexWrap: 'wrap' }}>
                        {/* Search */}
                        <div className="toolbar-search" style={{ position: 'relative', flex: '1 1 40px', minWidth: 200 }}>
                            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: C.textMuted, display: 'flex' }}>
                                <FiSearch size={15} />
                            </span>
                            <input
                                type="text" placeholder="Search by name, email, country..."
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

                        {/* Stage Filter */}
                        <select value={filterStage} onChange={e => setFilterStage(e.target.value)} style={{
                            padding: '9px 13px', borderRadius: 9, border: `1.5px solid ${C.slate300}`,
                            background: C.white, fontSize: 13, color: C.text, outline: 'none',
                            fontFamily: 'inherit', cursor: 'pointer', fontWeight: 600, flex: '0 0 auto',
                        }}>
                            <option value="">All Stages</option>
                            {STAGES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>

                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }}>
                            <span style={{ fontSize: 13, color: C.textSub, fontWeight: 600, whiteSpace: 'nowrap' }}>
                                {filtered.length} lead{filtered.length !== 1 ? 's' : ''}
                            </span>
                            <button className="action-btn" onClick={fetchLeads} disabled={loading} style={{
                                display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 9,
                                border: `1px solid ${C.slate200}`, background: C.white, color: C.textSub, fontSize: 13,
                                fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: loading ? 0.6 : 1,
                            }}>
                                <FiRefreshCw size={13} style={{ animation: loading ? 'spin 0.7s linear infinite' : 'none' }} />
                                Refresh
                            </button>
                        </div>
                    </div>

                    {/* Table */}
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                            <thead>
                                <tr style={{ borderBottom: `1px solid ${C.slate100}`, background: C.slate50 }}>
                                    {['SR.', 'Date', 'Client Name', 'Service', 'Country', 'Priority', 'Stage', 'Actions'].map(h => (
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
                                        <td colSpan={8} style={{ padding: '64px 24px', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                                                <div style={{ width: 56, height: 56, borderRadius: 16, background: C.slate100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <FiFileText size={24} color={C.textMuted} />
                                                </div>
                                                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.textSub }}>No leads found</p>
                                                <p style={{ margin: 0, fontSize: 12, color: C.textMuted }}>
                                                    {filterStage ? 'Try clearing the filter' : 'Leads assigned to you will appear here'}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    paginated.map((lead, idx) => {
                                        const srNo = (currentPage - 1) * pageSize + idx + 1
                                        return (
                                            <tr key={lead._id} className="lead-row"
                                                onClick={() => setDetailModal({ open: true, lead })}
                                                style={{ borderBottom: `1px solid ${C.slate50}` }}
                                            >
                                                <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                                                    <span style={{
                                                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                                        width: 28, height: 28, borderRadius: 7,
                                                        background: C.slate100, fontSize: 11, fontWeight: 800, color: C.textSub,
                                                    }}>{String(srNo).padStart(2, '0')}</span>
                                                </td>
                                                <td style={{ padding: '14px 20px', color: C.textSub, fontWeight: 600, whiteSpace: 'nowrap', fontSize: 13 }}>
                                                    {fmtDate(lead.date || lead.createdAt)}
                                                </td>
                                                <td style={{ padding: '14px 20px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                        <div style={{
                                                            width: 36, height: 36, borderRadius: '50%',
                                                            background: getAvatarColor(lead.client_name),
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            color: C.white, fontSize: 12, fontWeight: 800, flexShrink: 0,
                                                        }}>{getInitials(lead.client_name)}</div>
                                                        <div>
                                                            <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: C.text }}>{lead.client_name}</p>
                                                            <p style={{ margin: 0, fontSize: 11, color: C.textMuted, fontWeight: 500 }}>{lead.client_email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '14px 20px', color: C.textSub, fontWeight: 600 }}>{lead.services || '—'}</td>
                                                <td style={{ padding: '14px 20px', color: C.textSub, fontWeight: 600 }}>{lead.country || '—'}</td>
                                                <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                                                    <span style={{
                                                        padding: '5px 10px', borderRadius: 6,
                                                        background: lead.priority === 'urgent' ? '#fef2f2' : lead.priority === 'high' ? '#fff7ed' : '#f8fafc',
                                                        color: lead.priority === 'urgent' ? '#dc2626' : lead.priority === 'high' ? '#ea580c' : '#475569',
                                                        fontSize: 11, fontWeight: 800, textTransform: 'uppercase',
                                                    }}>
                                                        {lead.priority || 'medium'}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                                                    <StageBadge stage={lead.lead_stage} />
                                                </td>
                                                <td style={{ padding: '14px 20px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                                        <button
                                                            className="action-btn"
                                                            onClick={e => { e.stopPropagation(); setStageModal({ open: true, lead }) }}
                                                            style={{
                                                                display: 'inline-flex', alignItems: 'center', gap: 5,
                                                                padding: '6px 12px', borderRadius: 7, border: 'none',
                                                                background: C.indigo, color: C.white,
                                                                fontSize: 12, fontWeight: 800, cursor: 'pointer',
                                                                boxShadow: '0 2px 8px rgba(79,70,229,0.3)',
                                                            }}
                                                        >
                                                            <FiTrendingUp size={11} />
                                                            Stage
                                                        </button>
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
                lead={detailModal.lead}
                onClose={() => setDetailModal({ open: false, lead: null })}
                onLeadUpdated={handleLeadUpdated}
                showToast={showToast}
            />

            <StageModal
                open={stageModal.open}
                lead={stageModal.lead}
                onClose={() => setStageModal({ open: false, lead: null })}
                onUpdated={handleLeadUpdated}
                showToast={showToast}
            />

            <Toast message={toast.message} type={toast.type} visible={toast.visible} />
        </DashboardLayout>
    )
}

export default BDESalesReport