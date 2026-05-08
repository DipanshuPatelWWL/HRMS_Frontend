import React, { useState, useMemo, useEffect, useCallback } from 'react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import API from '../../services/api'

/* ─── Design Tokens ─────────────────────────────────────────────────────────── */
const C = {
    indigo: '#4f46e5',
    indigoDark: '#4338ca',
    indigoLight: '#eef2ff',
    indigoBorder: '#c7d2fe',
    red: '#ef4444',
    redDark: '#dc2626',
    redLight: '#fef2f2',
    redBorder: '#fca5a5',
    emerald: '#059669',
    emeraldLight: '#ecfdf5',
    emeraldBorder: '#6ee7b7',
    blue: '#2563eb',
    blueLight: '#eff6ff',
    blueBorder: '#93c5fd',
    amber: '#d97706',
    slate50: '#f8fafc',
    slate100: '#f1f5f9',
    slate200: '#e2e8f0',
    slate300: '#cbd5e1',
    slate400: '#94a3b8',
    slate500: '#64748b',
    slate600: '#475569',
    slate700: '#334155',
    slate800: '#1e293b',
    white: '#ffffff',
    pageBg: '#f1f3f9',
}

const STATUS = {
    draft: { label: 'Draft', color: '#64748b' },
    sent_to_manager: { label: 'Pending', color: '#2563eb' },
    approved: { label: 'Approved', color: '#059669' },
    rejected: { label: 'Rejected', color: '#ef4444' },
}

const COUNTRIES = [
    'India', 'United States', 'United Kingdom', 'Canada', 'Australia',
    'Germany', 'France', 'UAE', 'Singapore', 'Japan', 'Other',
]

const SERVICES_LIST = [
    'Web Development', 'Mobile App', 'SEO', 'Digital Marketing',
    'UI/UX Design', 'Cloud Solutions', 'Data Analytics', 'Other',
]

const EMPTY_FORM = {
    marketer: '',
    date: new Date().toISOString().split('T')[0],
    client_name: '',
    client_email: '',
    services: '',
    country: '',
    message: '',
}

const PAGE_SIZE_OPTIONS = [10, 25, 50]
const AVATAR_COLORS = ['#7c3aed', '#4f46e5', '#2563eb', '#db2777', '#d97706', '#0d9488', '#e11d48']
const getAvatarColor = (name = '') => AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length]
const getInitials = (name = '') => name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?'
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

/* ─── Inline style helpers ───────────────────────────────────────────────────── */
const inputStyle = (err = false) => ({
    width: '100%',
    padding: '10px 14px',
    borderRadius: 8,
    border: `1px solid ${err ? C.redBorder : C.slate300}`,
    fontSize: 14,
    color: C.slate800,
    background: C.white,
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    transition: 'border-color 0.2s, box-shadow 0.2s',
})

const labelStyle = {
    display: 'block',
    fontSize: 13,
    fontWeight: 600,
    color: C.slate700,
    marginBottom: 5,
}

/* ─── Toast ──────────────────────────────────────────────────────────────────── */
const Toast = ({ message, type, visible }) => {
    if (!visible) return null
    const isError = type === 'error'
    return (
        <div style={{
            position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
            padding: '14px 20px', borderRadius: 12,
            background: isError ? C.red : C.emerald,
            color: C.white, fontSize: 14, fontWeight: 600,
            boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
            display: 'flex', alignItems: 'center', gap: 10,
            animation: 'slideUp 0.3s ease',
            maxWidth: 340,
        }}>
            <span style={{ fontSize: 16 }}>{isError ? '✕' : '✓'}</span>
            {message}
        </div>
    )
}

/* ─── StatusBadge ────────────────────────────────────────────────────────────── */
const StatusBadge = ({ status }) => {
    const s = STATUS[status] || STATUS.draft
    return (
        <span style={{
            padding: '4px 10px',
            borderRadius: 6,
            background: '#f1f5f9',
            color: s.color,
            fontSize: 12,
            fontWeight: 600,
        }}>
            {s.label}
        </span>
    )
}

/* ─── StatCard ───────────────────────────────────────────────────────────────── */
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

/* ─── FormField ──────────────────────────────────────────────────────────────── */
const FormField = ({ label, required, error, children }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        <label style={labelStyle}>
            {label}
            {required && <span style={{ color: C.red, marginLeft: 2 }}>*</span>}
        </label>
        {children}
        {error && <p style={{ fontSize: 12, color: C.red, margin: '4px 0 0' }}>{error}</p>}
    </div>
)

/* ─── Modal ──────────────────────────────────────────────────────────────────── */
const ReportModal = ({ open, onClose, onSave, editData, saving }) => {
    const [form, setForm] = useState(EMPTY_FORM)
    const [errors, setErrors] = useState({})
    const [focused, setFocused] = useState(null)

    React.useEffect(() => {
        if (open) {
            setForm(editData
                ? { ...EMPTY_FORM, ...editData, date: editData.date?.split('T')[0] || editData.date }
                : EMPTY_FORM)
            setErrors({})
        }
    }, [open, editData])

    const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

    const validate = () => {
        const e = {}
        if (!form.client_name.trim()) e.client_name = 'Client name is required'
        if (!form.client_email.trim()) e.client_email = 'Email is required'
        if (!form.services) e.services = 'Please select a service'
        if (!form.country) e.country = 'Please select a country'
        setErrors(e)
        return !Object.keys(e).length
    }

    const handleSave = () => { if (validate()) onSave(form) }

    const focusStyle = (key, err) => ({
        ...inputStyle(!!err),
        ...(focused === key ? { borderColor: err ? C.red : C.indigo, boxShadow: `0 0 0 3px ${err ? '#fee2e2' : C.indigoLight}` } : {}),
    })

    if (!open) return null

    return (
        <div
            onClick={onClose}
            style={{
                position: 'fixed', inset: 0, zIndex: 50,
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
                background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(6px)',
            }}
        >
            <style>
                {`/* ── Spinner ── */
                .spinner {
                    width: 14px; height: 14px;
                    border: 2px solid rgba(255,255,255,0.3);
                    border-top-color: white;
                    border-radius: 50%;
                    display: inline-block;
                    animation: spin 0.6s linear infinite;
                    margin-right: 6px;
                }`}
            </style>
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    background: C.white, borderRadius: 20, width: '100%', maxWidth: 600,
                    maxHeight: '92vh', overflowY: 'auto',
                    boxShadow: '0 32px 80px rgba(15,23,42,0.22)',
                }}
            >
                {/* Header */}
                <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                    padding: '24px 28px 20px', borderBottom: `1px solid ${C.slate100}`,
                }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <span style={{ color: C.indigo, fontSize: 18, fontWeight: 700 }}>+</span>
                            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.slate800 }}>
                                {editData ? 'Edit Sales Report' : 'Add New Sales Report'}
                            </h2>
                        </div>
                        <p style={{ margin: 0, fontSize: 13, color: C.slate400 }}>Fill in the details below</p>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            width: 32, height: 32, borderRadius: 8,
                            border: `1px solid ${C.slate200}`, background: C.white,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', fontSize: 14, color: C.slate500,
                            fontWeight: 700, flexShrink: 0,
                        }}
                    >✕</button>
                </div>

                {/* Body */}
                <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>
                    <FormField label="Marketer Name">
                        <input
                            style={focusStyle('marketer', false)}
                            placeholder="e.g. John Smith"
                            value={form.marketer}
                            onChange={set('marketer')}
                            onFocus={() => setFocused('marketer')}
                            onBlur={() => setFocused(null)}
                        />
                    </FormField>

                    <FormField label="Client Name" required error={errors.client_name}>
                        <input
                            style={focusStyle('client_name', errors.client_name)}
                            placeholder="e.g. Acme Corp"
                            value={form.client_name}
                            onChange={set('client_name')}
                            onFocus={() => setFocused('client_name')}
                            onBlur={() => setFocused(null)}
                        />
                    </FormField>

                    <FormField label="Client Email" required error={errors.client_email}>
                        <input
                            type="email"
                            style={focusStyle('client_email', errors.client_email)}
                            placeholder="client@company.com"
                            value={form.client_email}
                            onChange={set('client_email')}
                            onFocus={() => setFocused('client_email')}
                            onBlur={() => setFocused(null)}
                        />
                    </FormField>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <FormField label="Report Date">
                            <input
                                type="date"
                                style={focusStyle('date', false)}
                                value={form.date}
                                onChange={set('date')}
                                onFocus={() => setFocused('date')}
                                onBlur={() => setFocused(null)}
                            />
                        </FormField>
                        <FormField label="Service" required error={errors.services}>
                            <select
                                style={focusStyle('services', errors.services)}
                                value={form.services}
                                onChange={set('services')}
                                onFocus={() => setFocused('services')}
                                onBlur={() => setFocused(null)}
                            >
                                <option value="">Select service</option>
                                {SERVICES_LIST.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </FormField>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <FormField label="Country" required error={errors.country}>
                            <select
                                style={focusStyle('country', errors.country)}
                                value={form.country}
                                onChange={set('country')}
                                onFocus={() => setFocused('country')}
                                onBlur={() => setFocused(null)}
                            >
                                <option value="">Select country</option>
                                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </FormField>
                    </div>

                    <FormField label="Message / Notes">
                        <textarea
                            style={{ ...focusStyle('message', false), resize: 'none', height: 90, fontFamily: 'inherit' }}
                            placeholder="Add any additional notes or context..."
                            value={form.message}
                            onChange={set('message')}
                            onFocus={() => setFocused('message')}
                            onBlur={() => setFocused(null)}
                        />
                    </FormField>
                </div>

                {/* Footer */}
                <div style={{
                    display: 'flex', gap: 12, padding: '16px 28px',
                    borderTop: `1px solid ${C.slate100}`,
                }}>
                    <button
                        onClick={onClose}
                        disabled={saving}
                        style={{
                            flex: 1, padding: '11px 0', borderRadius: 10,
                            border: `1px solid ${C.slate300}`, background: C.white,
                            fontSize: 14, fontWeight: 600, color: C.slate600,
                            cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                            opacity: saving ? 0.6 : 1,
                        }}
                    >Cancel</button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        style={{
                            flex: 1, padding: '11px 0', borderRadius: 10,
                            border: 'none', background: saving ? C.slate400 : C.indigo,
                            fontSize: 14, fontWeight: 700, color: C.white,
                            cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                            boxShadow: saving ? 'none' : '0 4px 14px rgba(79,70,229,0.4)',
                            transition: 'background 0.2s',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        }}
                    >
                        {saving && (
                            <span style={{
                                width: 14, height: 14, borderRadius: '50%',
                                border: '2px solid rgba(255,255,255,0.4)',
                                borderTopColor: C.white,
                                animation: 'spin 0.7s linear infinite',
                                display: 'inline-block',
                            }} />
                        )}
                        {saving ? (<><span className="spinner" /> Saving...</>) : editData ? (
                            "Update Report") : ("Add Report")}
                    </button>
                </div>
            </div>
        </div>
    )
}

/* ─── Skeleton Row ───────────────────────────────────────────────────────────── */
const SkeletonRow = () => (
    <tr style={{ borderBottom: `1px solid ${C.slate50}` }}>
        {[140, 100, 200, 120, 100, 90, 140].map((w, i) => (
            <td key={i} style={{ padding: '18px 24px' }}>
                <div style={{
                    height: 14, width: w, borderRadius: 6,
                    background: C.slate100,
                    animation: 'pulse 1.5s ease infinite',
                }} />
            </td>
        ))}
    </tr>
)



/* ─── Detail Modal ───────────────────────────────────────────────────────────── */
const DetailModal = ({ open, onClose, report }) => {
    if (!open || !report) return null

    const s = STATUS[report.status] || STATUS.draft
    const isRejected = report.status === 'rejected'
    const isApproved = report.status === 'approved'

    return (
        <div
            onClick={onClose}
            style={{
                position: 'fixed', inset: 0, zIndex: 50,
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
                background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(6px)',
            }}
        >
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    background: C.white, borderRadius: 20, width: '100%', maxWidth: 520,
                    boxShadow: '0 32px 80px rgba(15,23,42,0.22)', overflow: 'hidden',
                }}
            >
                {/* Header */}
                <div style={{
                    padding: '20px 24px 16px',
                    borderBottom: `1px solid ${C.slate100}`,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                            width: 44, height: 44, borderRadius: '50%',
                            background: getAvatarColor(report.client_name),
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: C.white, fontSize: 16, fontWeight: 700, flexShrink: 0,
                        }}>
                            {getInitials(report.client_name)}
                        </div>
                        <div>
                            <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: C.slate800 }}>{report.client_name}</p>
                            <p style={{ margin: 0, fontSize: 12, color: C.slate400 }}>{report.client_email}</p>
                        </div>
                    </div>
                    <button onClick={onClose} style={{
                        width: 32, height: 32, borderRadius: 8,
                        border: `1px solid ${C.slate200}`, background: C.white,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', fontSize: 14, color: C.slate500, fontWeight: 700,
                    }}>✕</button>
                </div>

                {/* Status Banner */}
                <div style={{
                    padding: '14px 24px',
                    background: isRejected ? C.redLight : isApproved ? C.emeraldLight : C.blueLight,
                    borderBottom: `1px solid ${isRejected ? C.redBorder : isApproved ? C.emeraldBorder : C.blueBorder}`,
                    display: 'flex', alignItems: 'flex-start', gap: 10,
                }}>
                    <span style={{ fontSize: 18, lineHeight: 1 }}>
                        {isRejected ? '✕' : isApproved ? '✓' : '⏳'}
                    </span>
                    <div>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: s.color }}>
                            {s.label}
                        </p>
                        {isRejected && (
                            <p style={{ margin: '4px 0 0', fontSize: 13, color: C.redDark, lineHeight: 1.5 }}>
                                <b>Reason:</b> {report.reject_reason?.trim() || 'No reason provided'}
                            </p>
                        )}
                        {isApproved && (
                            <p style={{ margin: '4px 0 0', fontSize: 13, color: C.emerald }}>
                                This report has been approved by the manager.
                            </p>
                        )}
                        {!isRejected && !isApproved && (
                            <p style={{ margin: '4px 0 0', fontSize: 13, color: C.blue }}>
                                Awaiting manager review.
                            </p>
                        )}
                    </div>
                </div>

                {/* Details Grid */}
                <div style={{ padding: '20px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    {[
                        { label: 'Marketer', value: report.marketer || '—', icon: '👤' },
                        { label: 'Date', value: fmtDate(report.date || report.createdAt), icon: '📅' },
                        { label: 'Service', value: report.services || '—', icon: '🛠' },
                        { label: 'Country', value: report.country || '—', icon: '🌍' },
                    ].map(({ label, value, icon }) => (
                        <div key={label} style={{
                            background: C.slate50, borderRadius: 10, padding: '12px 14px',
                            border: `1px solid ${C.slate100}`,
                            display: 'flex', alignItems: 'flex-start', gap: 10,
                        }}>
                            <span style={{
                                fontSize: 18, lineHeight: 1, marginTop: 2, flexShrink: 0,
                            }}>{icon}</span>
                            <div>
                                <p style={{ margin: 0, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.slate400 }}>
                                    {label}
                                </p>
                                <p style={{ margin: '4px 0 0', fontSize: 14, fontWeight: 600, color: C.slate700 }}>
                                    {value}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Message */}
                {report.message && (
                    <div style={{ padding: '0 24px 20px' }}>
                        <div style={{
                            background: C.slate50, borderRadius: 10, padding: '12px 14px',
                            border: `1px solid ${C.slate100}`,
                        }}>
                            <p style={{ margin: 0, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.slate400 }}>Notes / Message</p>
                            <p style={{ margin: '4px 0 0', fontSize: 14, color: C.slate600, lineHeight: 1.6 }}>{report.message}</p>
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div style={{ padding: '0 24px 20px' }}>
                    <button onClick={onClose} style={{
                        width: '100%', padding: '11px 0', borderRadius: 10,
                        border: `1px solid ${C.slate200}`, background: C.white,
                        fontSize: 14, fontWeight: 600, color: C.slate600,
                        cursor: 'pointer', fontFamily: 'inherit',
                    }}>Close</button>
                </div>
            </div>
        </div>
    )
}


/* ─── Pagination ─────────────────────────────────────────────────────────────── */
const Pagination = ({ currentPage, totalPages, pageSize, onPageChange, onPageSizeChange, totalItems }) => {
    if (totalPages <= 1 && totalItems <= PAGE_SIZE_OPTIONS[0]) return null

    const getPages = () => {
        const pages = []
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i)
        } else {
            pages.push(1)
            if (currentPage > 3) pages.push('...')
            for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
                pages.push(i)
            }
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
            padding: '14px 24px', borderTop: `1px solid ${C.slate100}`,
            flexWrap: 'wrap', gap: 12,
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 13, color: C.slate500, whiteSpace: 'nowrap' }}>Rows per page:</span>
                <select
                    value={pageSize}
                    onChange={e => onPageSizeChange(Number(e.target.value))}
                    style={{
                        padding: '6px 10px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                        border: `1px solid ${C.slate200}`, background: C.white,
                        color: C.slate700, cursor: 'pointer', outline: 'none', fontFamily: 'inherit',
                    }}
                >
                    {PAGE_SIZE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <span style={{ fontSize: 13, color: C.slate400, whiteSpace: 'nowrap' }}>
                    {((currentPage - 1) * pageSize) + 1}–{Math.min(currentPage * pageSize, totalItems)} of {totalItems}
                </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    style={{ ...btnBase, opacity: currentPage === 1 ? 0.4 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                >
                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>

                {getPages().map((p, i) =>
                    p === '...' ? (
                        <span key={`ellipsis-${i}`} style={{ minWidth: 36, textAlign: 'center', color: C.slate400, fontSize: 13 }}>…</span>
                    ) : (
                        <button
                            key={p}
                            onClick={() => onPageChange(p)}
                            style={{
                                ...btnBase,
                                background: currentPage === p ? C.indigo : C.white,
                                color: currentPage === p ? C.white : C.slate600,
                                border: `1px solid ${currentPage === p ? C.indigo : C.slate200}`,
                                boxShadow: currentPage === p ? '0 2px 8px rgba(79,70,229,0.3)' : 'none',
                            }}
                        >{p}</button>
                    )
                )}

                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    style={{ ...btnBase, opacity: currentPage === totalPages ? 0.4 : 1, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
                >
                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>
        </div>
    )
}

/* ─── Main Component ─────────────────────────────────────────────────────────── */
const SalesReports = () => {
    const [reports, setReports] = useState([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [sendingId, setSendingId] = useState(null)

    const [modalOpen, setModalOpen] = useState(false)
    const [editData, setEditData] = useState(null)
    const [editId, setEditId] = useState(null)

    const [search, setSearch] = useState('')
    const [filterActionStatus, setFilterActionStatus] = useState('')
    const [searchFocused, setSearchFocused] = useState(false)
    const [hoveredRow, setHoveredRow] = useState(null)

    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)

    const [detailReport, setDetailReport] = useState(null)

    const [toast, setToast] = useState({ message: '', type: 'success', visible: false })

    const showToast = useCallback((message, type = 'success') => {
        setToast({ message, type, visible: true })
        setTimeout(() => setToast(t => ({ ...t, visible: false })), 3500)
    }, [])

    const fetchLeads = useCallback(async () => {
        setLoading(true)
        try {
            const { data } = await API.get('/getMyLeads')
            setReports(data.leads || [])
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to fetch reports', 'error')
        } finally {
            setLoading(false)
        }
    }, [showToast])

    useEffect(() => { fetchLeads() }, [fetchLeads])

    const handleStatClick = (statusKey) => {
        setFilterActionStatus(prev => prev === statusKey ? '' : statusKey)
    }

    const stats = useMemo(() => ({
        total: reports.length,
        pending: reports.filter(r => r.status === 'sent_to_manager').length,
        approved: reports.filter(r => r.status === 'approved').length,
        rejected: reports.filter(r => r.status === 'rejected').length,
    }), [reports])

    const filtered = useMemo(() =>
        reports.filter(r => {
            const q = search.toLowerCase()
            const matchSearch = !q ||
                r.client_name?.toLowerCase().includes(q) ||
                r.country?.toLowerCase().includes(q) ||
                r.services?.toLowerCase().includes(q) ||
                r.client_email?.toLowerCase().includes(q)
            const matchStatus = !filterActionStatus || r.status === filterActionStatus
            return matchSearch && matchStatus
        }),
        [reports, search, filterActionStatus])

    useEffect(() => { setCurrentPage(1) }, [search, filterActionStatus, pageSize])

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
    const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

    const openAdd = () => { setEditData(null); setEditId(null); setModalOpen(true) }
    const openEdit = (r) => { setEditData(r); setEditId(r._id); setModalOpen(true) }

    const createLead = async (form) => {
        setSaving(true)
        try {
            const { data } = await API.post('/createLead', {
                marketer: form.marketer,
                date: form.date,
                client_name: form.client_name,
                client_email: form.client_email,
                services: form.services,
                country: form.country,
                message: form.message,
            })
            setReports(prev => [data.lead, ...prev])
            setModalOpen(false)
            showToast('Report created successfully')
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to create report', 'error')
        } finally {
            setSaving(false)
        }
    }

    const updateLead = async (form) => {
        setSaving(true)
        try {
            const { data } = await API.put(`/updateLead/${editId}`, form)
            setReports(prev => prev.map(r => r._id === editId ? data.lead : r))
            setModalOpen(false)
            showToast('Report updated successfully')
        } catch (err) {
            showToast(err.response?.data?.message || 'Update failed', 'error')
        } finally {
            setSaving(false)
        }
    }

    const handleSave = (form) => {
        if (editId) updateLead(form)
        else createLead(form)
    }

    const handleSend = async (id) => {
        setSendingId(id)
        try {
            await API.post(`/sendToManager/${id}`)
            setReports(prev => prev.map(r => r._id === id ? { ...r, status: 'sent_to_manager' } : r))
            showToast('Report sent to manager')
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to send report', 'error')
        } finally {
            setSendingId(null)
        }
    }

    const alreadySent = (r) => r.status !== 'draft'
    const canEdit = (r) => r.status === 'draft'

    return (
        <DashboardLayout>
            <style>{`
                @keyframes spin    { to { transform: rotate(360deg); } }
                @keyframes pulse   { 0%,100% { opacity:1 } 50% { opacity:0.4 } }
                @keyframes slideUp { from { transform: translateY(20px); opacity:0 } to { transform: translateY(0); opacity:1 } }
            `}</style>

            <div style={{ minHeight: '100vh', background: C.pageBg, padding: 24, display: 'flex', flexDirection: 'column', gap: 20, boxSizing: 'border-box' }}>

                {/* ── Stat Cards ── */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                    <StatCard label="Total Reports" value={stats.total} topColor="#3b82f6" loading={loading}
                        active={filterActionStatus === ''} onClick={() => setFilterActionStatus('')} />
                    <StatCard label="Pending" value={stats.pending} topColor="#f59e0b" loading={loading}
                        active={filterActionStatus === 'sent_to_manager'} onClick={() => handleStatClick('sent_to_manager')} />
                    <StatCard label="Approved" value={stats.approved} topColor="#10b981" loading={loading}
                        active={filterActionStatus === 'approved'} onClick={() => handleStatClick('approved')} />
                    <StatCard label="Rejected" value={stats.rejected} topColor="#ef4444" loading={loading}
                        active={filterActionStatus === 'rejected'} onClick={() => handleStatClick('rejected')} />
                </div>

                {/* ── Main Panel ── */}
                <div style={{
                    background: C.white, borderRadius: 20,
                    border: `1px solid ${C.slate100}`,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                    overflow: 'hidden',
                }}>

                    {/* Toolbar */}
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '16px 24px', borderBottom: `1px solid ${C.slate100}`,
                        flexWrap: 'wrap',
                    }}>
                        <div style={{ position: 'relative' }}>
                            <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', fontSize: 15 }}>🔍</span>
                            <input
                                type="text"
                                placeholder="Search by name, email or country..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                onFocus={() => setSearchFocused(true)}
                                onBlur={() => setSearchFocused(false)}
                                style={{
                                    paddingLeft: 38, paddingRight: 16, paddingTop: 10, paddingBottom: 10,
                                    width: 300, borderRadius: 50,
                                    border: `1px solid ${searchFocused ? C.indigo : C.slate300}`,
                                    boxShadow: searchFocused ? `0 0 0 3px ${C.indigoLight}` : 'none',
                                    fontSize: 14, color: C.slate700,
                                    background: C.white, outline: 'none', fontFamily: 'inherit',
                                    transition: 'all 0.2s',
                                }}
                            />
                        </div>

                        <select
                            value={filterActionStatus}
                            onChange={e => setFilterActionStatus(e.target.value)}
                            style={{
                                padding: '10px 14px', borderRadius: 8,
                                border: `1px solid ${C.slate300}`, background: C.white,
                                fontSize: 14, color: C.slate600, outline: 'none',
                                fontFamily: 'inherit', cursor: 'pointer',
                            }}
                        >
                            <option value="">All</option>
                            <option value="draft">Draft</option>
                            <option value="sent_to_manager">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                        </select>

                        <div style={{ flex: 1 }} />

                        <button
                            onClick={fetchLeads}
                            disabled={loading}
                            style={{
                                display: 'inline-flex', alignItems: 'center', gap: 6,
                                padding: '10px 16px', borderRadius: 10,
                                border: `1px solid ${C.slate200}`, background: C.white,
                                color: C.slate600, fontSize: 13, fontWeight: 600,
                                cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                                opacity: loading ? 0.6 : 1,
                            }}
                        >
                            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                style={{ animation: loading ? 'spin 0.7s linear infinite' : 'none' }}>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Refresh
                        </button>

                        <span style={{ fontSize: 14, color: C.slate500, fontWeight: 500, whiteSpace: 'nowrap' }}>
                            {filtered.length} report{filtered.length !== 1 ? 's' : ''}
                        </span>

                        <button
                            onClick={openAdd}
                            style={{
                                display: 'inline-flex', alignItems: 'center', gap: 8,
                                padding: '10px 20px', borderRadius: 12,
                                border: 'none', background: C.indigo,
                                color: C.white, fontSize: 14, fontWeight: 700,
                                cursor: 'pointer', fontFamily: 'inherit',
                                boxShadow: '0 4px 14px rgba(79,70,229,0.35)',
                                transition: 'background 0.2s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = C.indigoDark}
                            onMouseLeave={e => e.currentTarget.style.background = C.indigo}
                        >
                            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                            </svg>
                            Add Report
                        </button>
                    </div>

                    {/* Table */}
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                            <thead>
                                <tr style={{ borderBottom: `1px solid ${C.slate100}` }}>
                                    {['SR NO.', 'DATE', 'CLIENT NAME', 'SERVICE', 'COUNTRY', 'ACTION STATUS', 'ACTIONS'].map((h, i) => (
                                        <th
                                            key={h}
                                            style={{
                                                padding: '12px 24px', textAlign: i === 6 ? 'right' : 'left',
                                                fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
                                                color: C.slate400, textTransform: 'uppercase',
                                                whiteSpace: 'nowrap',
                                            }}
                                        >{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                                ) : filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} style={{ padding: '72px 24px', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                                                <div style={{
                                                    width: 64, height: 64, borderRadius: 18,
                                                    background: C.slate100, display: 'flex',
                                                    alignItems: 'center', justifyContent: 'center', fontSize: 28,
                                                }}>📄</div>
                                                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: C.slate500 }}>No sales reports yet</p>
                                                <p style={{ margin: 0, fontSize: 12, color: C.slate400 }}>Click "Add Report" to create your first entry</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    paginated.map((report, idx) => {
                                        const editable = canEdit(report)
                                        const srNo = (currentPage - 1) * pageSize + idx + 1

                                        return (
                                            <tr
                                                key={report._id}
                                                onClick={() => setDetailReport(report)}
                                                onMouseEnter={() => setHoveredRow(report._id)}
                                                onMouseLeave={() => setHoveredRow(null)}
                                                style={{
                                                    borderBottom: `1px solid ${C.slate50}`,
                                                    background: hoveredRow === report._id ? '#f8f9ff' : C.white,
                                                    transition: 'background 0.15s',
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                {/* Sr No. */}
                                                <td style={{ padding: '16px 24px' }}>
                                                    <span style={{
                                                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                                        width: 30, height: 30, borderRadius: 8,
                                                        background: C.slate100, fontSize: 12, fontWeight: 700, color: C.slate500,
                                                    }}>
                                                        {String(srNo).padStart(2, '0')}
                                                    </span>
                                                </td>

                                                {/* Date */}
                                                <td style={{ padding: '16px 24px', color: C.slate600, fontWeight: 500, whiteSpace: 'nowrap' }}>
                                                    {fmtDate(report.date || report.createdAt)}
                                                </td>

                                                {/* Client Name */}
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

                                                {/* Service */}
                                                <td style={{ padding: '16px 24px', color: C.slate600 }}>{report.services || '—'}</td>

                                                {/* Country */}
                                                <td style={{ padding: '16px 24px', color: C.slate600 }}>{report.country || '—'}</td>

                                                {/* Status + reject reason */}
                                                {/* <td style={{ padding: '16px 24px' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                                        <StatusBadge status={report.status} />
                                                        {report.status === 'rejected' && report.reject_reason && (
                                                            <span style={{
                                                                fontSize: 11, color: C.redDark, maxWidth: 160,
                                                                lineHeight: 1.4, display: '-webkit-box',
                                                                WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                                                                overflow: 'hidden',
                                                            }}>
                                                                {report.reject_reason}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td> */}

                                                <td style={{ padding: '16px 24px' }}>
                                                    <StatusBadge status={report.status} />
                                                </td>

                                                {/* Actions */}
                                                <td style={{ padding: '16px 24px' }} onClick={e => e.stopPropagation()}>
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                                                        <ActionBtn
                                                            onClick={() => openEdit(report)}
                                                            disabled={!editable}
                                                            bg={C.white}
                                                            color={editable ? C.slate600 : C.slate300}
                                                            border={editable ? C.slate200 : C.slate100}
                                                            hoverBg={editable ? '#f1f5f9' : C.white}
                                                            icon={
                                                                <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                </svg>
                                                            }
                                                            label="Edit"
                                                        />

                                                        {alreadySent(report) ? (
                                                            <span style={{
                                                                padding: '6px 12px', borderRadius: 8,
                                                                background: '#eef2ff', color: '#4f46e5',
                                                                fontSize: 12, fontWeight: 600, display: 'inline-block',
                                                            }}>
                                                                ✓ Sent
                                                            </span>
                                                        ) : (
                                                            <span
                                                                onClick={() => handleSend(report._id)}
                                                                style={{
                                                                    padding: '6px 12px', borderRadius: 8,
                                                                    background: '#eef2ff', color: '#4f46e5',
                                                                    fontSize: 12, fontWeight: 600,
                                                                    display: 'inline-block', cursor: 'pointer',
                                                                }}
                                                            >
                                                                Send
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

                    {/* ── Pagination ── */}
                    {!loading && filtered.length > 0 && (
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            pageSize={pageSize}
                            totalItems={filtered.length}
                            onPageChange={setCurrentPage}
                            onPageSizeChange={(s) => { setPageSize(s); setCurrentPage(1) }}
                        />
                    )}
                </div>
            </div>


            <DetailModal
                open={!!detailReport}
                onClose={() => setDetailReport(null)}
                report={detailReport}
            />

            <ReportModal
                open={modalOpen}
                onClose={() => !saving && setModalOpen(false)}
                onSave={handleSave}
                editData={editData}
                saving={saving}
            />

            <Toast message={toast.message} type={toast.type} visible={toast.visible} />
        </DashboardLayout>
    )
}

/* ─── ActionBtn helper ───────────────────────────────────────────────────────── */
const ActionBtn = ({ onClick, bg, color, border, hoverBg, icon, label, disabled, loading }) => {
    const [hovered, setHovered] = useState(false)
    return (
        <button
            onClick={disabled ? undefined : onClick}
            onMouseEnter={() => !disabled && setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', borderRadius: 8,
                border: `1px solid ${border}`,
                background: hovered && !disabled ? hoverBg : bg,
                color, fontSize: 12, fontWeight: 600,
                cursor: disabled ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                transition: 'background 0.15s',
                opacity: disabled ? 0.5 : 1,
            }}
        >
            {loading
                ? <span style={{
                    width: 11, height: 11, borderRadius: '50%',
                    border: '2px solid rgba(255,255,255,0.35)',
                    borderTopColor: color,
                    animation: 'spin 0.7s linear infinite',
                    display: 'inline-block',
                }} />
                : icon
            }
            {label}
        </button>
    )
}

export default SalesReports