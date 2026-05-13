import React, { useState, useMemo, useEffect, useCallback } from 'react'
import {
    Search, RefreshCw, Plus, Edit2, Send, CheckCircle2, Clock,
    XCircle, ChevronLeft, ChevronRight, X, User, Calendar,
    Wrench, Globe, Zap, TrendingUp, Link, FileText, BarChart3,
    AlertCircle,
} from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import API from '../../services/api'

/* ─── Design Tokens ──────────────────────────────────────────────────────────── */
const C = {
    indigo: '#4f46e5',
    indigoDark: '#3730a3',
    indigoLight: '#eef2ff',
    indigoBorder: '#c7d2fe',

    red: '#ef4444',
    redDark: '#b91c1c',
    redLight: '#fef2f2',
    redBorder: '#fca5a5',

    emerald: '#059669',
    emeraldDark: '#047857',
    emeraldLight: '#ecfdf5',
    emeraldBorder: '#6ee7b7',

    blue: '#2563eb',
    blueLight: '#eff6ff',
    blueBorder: '#93c5fd',

    amber: '#d97706',
    amberLight: '#fffbeb',

    // Near-blacks instead of grays
    ink900: '#0a0a0f',
    ink800: '#111118',
    ink700: '#1c1c27',
    ink600: '#2d2d3a',
    ink500: '#44445a',
    ink400: '#6b6b85',
    ink300: '#9898b0',
    ink200: '#c4c4d4',
    ink100: '#e8e8f0',
    ink50: '#f4f4f8',

    white: '#ffffff',
    pageBg: '#f0f0f6',
}

const STATUS = {
    draft: { label: 'Draft', color: C.ink500, bg: C.ink50, icon: FileText },
    pending_review: { label: 'Pending Review', color: C.blue, bg: C.blueLight, icon: Clock },
    approved: { label: 'Approved', color: C.emerald, bg: C.emeraldLight, icon: CheckCircle2 },
    rejected: { label: 'Rejected', color: C.red, bg: C.redLight, icon: XCircle },
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
    priority: 'medium',
    lead_source: 'website',
}

const PAGE_SIZE_OPTIONS = [10, 25, 50]

const AVATAR_PALETTE = [
    ['#4f46e5', '#3730a3'], ['#7c3aed', '#6d28d9'], ['#db2777', '#be185d'],
    ['#059669', '#047857'], ['#d97706', '#b45309'], ['#2563eb', '#1d4ed8'],
    ['#0d9488', '#0f766e'],
]

const getAvatarGrad = (name = '') => {
    const idx = (name.charCodeAt(0) || 0) % AVATAR_PALETTE.length
    return `linear-gradient(135deg, ${AVATAR_PALETTE[idx][0]}, ${AVATAR_PALETTE[idx][1]})`
}

const getInitials = (name = '') =>
    name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?'

const fmtDate = (d) =>
    d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

/* ─── Shared Styles ──────────────────────────────────────────────────────────── */
const inputStyle = (err = false, focused = false) => ({
    width: '100%',
    padding: '9px 12px',
    borderRadius: 8,
    border: `1.5px solid ${err ? C.red : focused ? C.indigo : C.ink200}`,
    fontSize: 13,
    color: C.ink800,
    background: C.white,
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    boxShadow: focused ? `0 0 0 3px ${err ? '#fee2e2' : C.indigoLight}` : 'none',
})

const labelStyle = {
    display: 'block',
    fontSize: 11,
    fontWeight: 700,
    color: C.ink600,
    marginBottom: 4,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
}

/* ─── Global Keyframes ───────────────────────────────────────────────────────── */
const GLOBAL_CSS = `
* {
    -webkit-user-select: none !important;
    -moz-user-select: none !important;
    -ms-user-select: none !important;
    user-select: none !important;
}
@keyframes spin    { to { transform: rotate(360deg) } }
@keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:.45} }
@keyframes slideUp { from{transform:translateY(16px);opacity:0} to{transform:translateY(0);opacity:1} }
@keyframes fadeIn  { from{opacity:0} to{opacity:1} }
@keyframes scaleIn { from{transform:scale(.97);opacity:0} to{transform:scale(1);opacity:1} }

.sr-row { transition: background 0.15s, box-shadow 0.15s; }
.sr-row:hover { background: #f5f5fb !important; box-shadow: inset 3px 0 0 ${C.indigo}; }

.btn-action { transition: all 0.18s cubic-bezier(.4,0,.2,1) !important; }
.btn-action:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
.btn-action:active:not(:disabled) { transform: translateY(0); }

.stat-card { transition: all 0.2s cubic-bezier(.4,0,.2,1); }
.stat-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.1) !important; }

.badge-pill { transition: all 0.15s; }
`

/* ─── Toast ──────────────────────────────────────────────────────────────────── */
const Toast = ({ message, type, visible }) => {
    if (!visible) return null
    const isError = type === 'error'
    return (
        <div style={{
            position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
            padding: '12px 18px', borderRadius: 12,
            background: isError ? C.redDark : C.emeraldDark,
            color: C.white, fontSize: 13, fontWeight: 600,
            boxShadow: '0 8px 32px rgba(0,0,0,0.22)',
            display: 'flex', alignItems: 'center', gap: 8,
            animation: 'slideUp 0.3s ease',
            maxWidth: 320,
            borderLeft: `4px solid ${isError ? '#fca5a5' : '#6ee7b7'}`,
        }}>
            {isError
                ? <AlertCircle size={15} />
                : <CheckCircle2 size={15} />
            }
            {message}
        </div>
    )
}

/* ─── StatusBadge ────────────────────────────────────────────────────────────── */
const StatusBadge = ({ status }) => {
    const s = STATUS[status] || STATUS.draft
    const Icon = s.icon
    return (
        <span className="badge-pill" style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '3px 9px', borderRadius: 20,
            background: s.bg, color: s.color,
            fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap',
        }}>
            <Icon size={10} strokeWidth={2.5} />
            {s.label}
        </span>
    )
}

/* ─── StatCard ───────────────────────────────────────────────────────────────── */
const StatCard = ({ label, value, topColor, icon: Icon, loading, active, onClick }) => (
    <div
        className="stat-card"
        onClick={onClick}
        style={{
            background: C.white,
            borderRadius: 14,
            padding: '18px 20px',
            borderTop: `3px solid ${topColor}`,
            border: `1px solid ${active ? topColor : C.ink100}`,
            boxShadow: active
                ? `0 0 0 3px ${topColor}25, 0 4px 16px rgba(0,0,0,0.08)`
                : '0 1px 4px rgba(0,0,0,0.05)',
            cursor: onClick ? 'pointer' : 'default',
        }}
    >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.ink400, margin: 0 }}>
                {label}
            </p>
            <div style={{
                width: 30, height: 30, borderRadius: 8,
                background: `${topColor}18`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: topColor,
            }}>
                <Icon size={14} strokeWidth={2.5} />
            </div>
        </div>
        {loading
            ? <div style={{ width: 50, height: 32, borderRadius: 6, background: C.ink100, animation: 'pulse 1.5s ease infinite' }} />
            : <p style={{ fontSize: 34, fontWeight: 900, color: C.ink900, margin: 0, lineHeight: 1, letterSpacing: '-0.02em' }}>{value}</p>
        }
    </div>
)

/* ─── FormField ──────────────────────────────────────────────────────────────── */
const FormField = ({ label, required, error, children }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        <label style={labelStyle}>
            {label}{required && <span style={{ color: C.red, marginLeft: 2 }}>*</span>}
        </label>
        {children}
        {error && <p style={{ fontSize: 11, color: C.red, margin: '3px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}>
            <AlertCircle size={10} /> {error}
        </p>}
    </div>
)

/* ─── ReportModal ────────────────────────────────────────────────────────────── */
const ReportModal = ({ open, onClose, onSave, editData, saving }) => {
    const [form, setForm] = useState(EMPTY_FORM)
    const [errors, setErrors] = useState({})
    const [focused, setFocused] = useState(null)

    useEffect(() => {
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

    const fs = (k, err) => inputStyle(!!err, focused === k)

    if (!open) return null

    return (
        <div onClick={onClose} style={{
            position: 'fixed', inset: 0, zIndex: 50,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
            background: 'rgba(10,10,15,0.55)', backdropFilter: 'blur(8px)',
        }}>
            <div onClick={e => e.stopPropagation()} style={{
                background: C.white, borderRadius: 18, width: '100%', maxWidth: 580,
                maxHeight: '92vh',
                boxShadow: '0 40px 100px rgba(0,0,0,0.28)',
                display: 'flex', flexDirection: 'column',
                animation: 'scaleIn 0.2s ease',
                overflow: 'hidden',
            }}>
                {/* Header */}
                <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '18px 24px 14px', borderBottom: `1px solid ${C.ink100}`,
                    flexShrink: 0,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                            width: 34, height: 34, borderRadius: 10,
                            background: C.indigoLight,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: C.indigo,
                        }}>
                            {editData ? <Edit2 size={15} /> : <Plus size={15} strokeWidth={2.5} />}
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: C.ink900, letterSpacing: '-0.01em' }}>
                                {editData ? 'Edit Sales Report' : 'New Sales Report'}
                            </h2>
                            <p style={{ margin: 0, fontSize: 11, color: C.ink400 }}>Fill in the details below</p>
                        </div>
                    </div>
                    <button onClick={onClose} style={{
                        width: 30, height: 30, borderRadius: 8,
                        border: `1px solid ${C.ink200}`, background: C.white,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', color: C.ink500, flexShrink: 0,
                    }}><X size={14} /></button>
                </div>

                {/* Scrollable Body */}
                <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto', flex: 1 }}>
                    <FormField label="Marketer Name">
                        <input style={fs('marketer', false)} placeholder="e.g. John Smith"
                            value={form.marketer} onChange={set('marketer')}
                            onFocus={() => setFocused('marketer')} onBlur={() => setFocused(null)} />
                    </FormField>

                    <FormField label="Client Name" required error={errors.client_name}>
                        <input style={fs('client_name', errors.client_name)} placeholder="e.g. Acme Corp"
                            value={form.client_name} onChange={set('client_name')}
                            onFocus={() => setFocused('client_name')} onBlur={() => setFocused(null)} />
                    </FormField>

                    <FormField label="Client Email" required error={errors.client_email}>
                        <input type="email" style={fs('client_email', errors.client_email)} placeholder="client@company.com"
                            value={form.client_email} onChange={set('client_email')}
                            onFocus={() => setFocused('client_email')} onBlur={() => setFocused(null)} />
                    </FormField>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <FormField label="Report Date">
                            <input type="date" style={fs('date', false)} value={form.date} onChange={set('date')}
                                onFocus={() => setFocused('date')} onBlur={() => setFocused(null)} />
                        </FormField>
                        <FormField label="Service" required error={errors.services}>
                            <select style={fs('services', errors.services)} value={form.services} onChange={set('services')}
                                onFocus={() => setFocused('services')} onBlur={() => setFocused(null)}>
                                <option value="">Select service</option>
                                {SERVICES_LIST.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </FormField>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <FormField label="Country" required error={errors.country}>
                            <select style={fs('country', errors.country)} value={form.country} onChange={set('country')}
                                onFocus={() => setFocused('country')} onBlur={() => setFocused(null)}>
                                <option value="">Select country</option>
                                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </FormField>
                        <FormField label="Priority">
                            <select style={fs('priority', false)} value={form.priority} onChange={set('priority')}
                                onFocus={() => setFocused('priority')} onBlur={() => setFocused(null)}>
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="urgent">Urgent</option>
                            </select>
                        </FormField>
                    </div>

                    <FormField label="Lead Source">
                        <select style={fs('lead_source', false)} value={form.lead_source} onChange={set('lead_source')}
                            onFocus={() => setFocused('lead_source')} onBlur={() => setFocused(null)}>
                            <option value="website">Website</option>
                            <option value="google">Google</option>
                            <option value="facebook">Facebook</option>
                            <option value="linkedin">LinkedIn</option>
                            <option value="instagram">Instagram</option>
                            <option value="whatsapp">WhatsApp</option>
                            <option value="referral">Referral</option>
                            <option value="email">Email</option>
                            <option value="other">Other</option>
                        </select>
                    </FormField>

                    <FormField label="Message / Notes">
                        <textarea style={{ ...fs('message', false), resize: 'none', height: 80, fontFamily: 'inherit' }}
                            placeholder="Add any additional notes or context..."
                            value={form.message} onChange={set('message')}
                            onFocus={() => setFocused('message')} onBlur={() => setFocused(null)} />
                    </FormField>
                </div>

                {/* Footer */}
                <div style={{
                    display: 'flex', gap: 10, padding: '14px 24px',
                    borderTop: `1px solid ${C.ink100}`, flexShrink: 0,
                }}>
                    <button onClick={onClose} disabled={saving} style={{
                        flex: 1, padding: '10px 0', borderRadius: 9,
                        border: `1px solid ${C.ink200}`, background: C.white,
                        fontSize: 13, fontWeight: 600, color: C.ink600,
                        cursor: saving ? 'not-allowed' : 'pointer',
                        opacity: saving ? 0.6 : 1, fontFamily: 'inherit',
                        transition: 'all 0.15s',
                    }}>Cancel</button>
                    <button onClick={handleSave} disabled={saving} className="btn-action" style={{
                        flex: 1, padding: '10px 0', borderRadius: 9,
                        border: 'none', background: saving ? C.ink300 : C.indigo,
                        fontSize: 13, fontWeight: 700, color: C.white,
                        cursor: saving ? 'not-allowed' : 'pointer',
                        fontFamily: 'inherit',
                        boxShadow: saving ? 'none' : '0 4px 16px rgba(79,70,229,0.4)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                    }}>
                        {saving ? (
                            <span style={{
                                width: 13, height: 13, borderRadius: '50%',
                                border: '2px solid rgba(255,255,255,0.35)',
                                borderTopColor: C.white,
                                animation: 'spin 0.7s linear infinite',
                                display: 'inline-block',
                            }} />
                        ) : editData ? <Edit2 size={13} /> : <Plus size={13} strokeWidth={2.5} />}
                        {saving ? 'Saving…' : editData ? 'Update Report' : 'Add Report'}
                    </button>
                </div>
            </div>
        </div>
    )
}

/* ─── Detail Modal ───────────────────────────────────────────────────────────── */
const DetailModal = ({ open, onClose, report }) => {
    if (!open || !report) return null
    const s = STATUS[report.review_status] || STATUS.draft
    const isRejected = report.review_status === 'rejected'
    const isApproved = report.review_status === 'approved'
    const StatusIcon = s.icon

    const DETAIL_FIELDS = [
        { label: 'Marketer', value: report.marketer || '—', Icon: User },
        { label: 'Date', value: fmtDate(report.date || report.createdAt), Icon: Calendar },
        { label: 'Service', value: report.services || '—', Icon: Wrench },
        { label: 'Country', value: report.country || '—', Icon: Globe },
        { label: 'Priority', value: report.priority || 'Medium', Icon: Zap },
        // { label: 'Lead Stage', value: report.lead_stage || 'New', Icon: TrendingUp },
        { label: 'Lead Source', value: report.lead_source || 'Website', Icon: Link },
    ]

    return (
        <div onClick={onClose} style={{
            position: 'fixed', inset: 0, zIndex: 50,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
            background: 'rgba(10,10,15,0.55)', backdropFilter: 'blur(8px)',
            boxSizing: 'border-box',
        }}>
            <div onClick={e => e.stopPropagation()} style={{
                background: C.white, borderRadius: 18, width: '100%', maxWidth: 520,
                maxHeight: '90vh',
                boxShadow: '0 40px 100px rgba(0,0,0,0.28)',
                display: 'flex', flexDirection: 'column',
                animation: 'scaleIn 0.2s ease',
                overflow: 'hidden',
                boxSizing: 'border-box',
            }}>
                {/* Header */}
                <div style={{
                    padding: '18px 22px 14px', borderBottom: `1px solid ${C.ink100}`,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                        <div style={{
                            width: 42, height: 42, borderRadius: '50%',
                            background: getAvatarGrad(report.client_name),
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: C.white, fontSize: 14, fontWeight: 800, flexShrink: 0,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                        }}>
                            {getInitials(report.client_name)}
                        </div>
                        <div>
                            <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: C.ink900, letterSpacing: '-0.01em' }}>
                                {report.client_name}
                            </p>
                            <p style={{ margin: 0, fontSize: 11, color: C.ink400 }}>{report.client_email}</p>
                        </div>
                    </div>
                    <button onClick={onClose} style={{
                        width: 30, height: 30, borderRadius: 8,
                        border: `1px solid ${C.ink200}`, background: C.white,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', color: C.ink500, flexShrink: 0,
                    }}><X size={14} /></button>
                </div>

                {/* Scrollable Body */}
                <div style={{ overflowY: 'auto', flex: 1, WebkitOverflowScrolling: 'touch' }}>
                    {/* Status Banner */}
                    <div style={{
                        padding: '12px 22px',
                        background: isRejected ? C.redLight : isApproved ? C.emeraldLight : C.blueLight,
                        borderBottom: `1px solid ${isRejected ? C.redBorder : isApproved ? C.emeraldBorder : C.blueBorder}`,
                        display: 'flex', alignItems: 'flex-start', gap: 9,
                    }}>
                        <StatusIcon size={16} strokeWidth={2.5} style={{ color: s.color, flexShrink: 0, marginTop: 1 }} />
                        <div>
                            <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: s.color }}>{s.label}</p>
                            {isRejected && (
                                <p style={{ margin: '3px 0 0', fontSize: 12, color: C.redDark, lineHeight: 1.5 }}>
                                    <b>Reason:</b> {report.reject_reason?.trim() || 'No reason provided'}
                                </p>
                            )}
                            {isApproved && (
                                <p style={{ margin: '3px 0 0', fontSize: 12, color: C.emeraldDark }}>
                                    Approved by manager.
                                </p>
                            )}
                            {!isRejected && !isApproved && (
                                <p style={{ margin: '3px 0 0', fontSize: 12, color: C.blue }}>
                                    Awaiting manager review.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Details Grid */}
                    <div style={{
                        padding: '16px 22px',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
                        gap: 10,
                    }}>
                        {DETAIL_FIELDS.map(({ label, value, Icon }) => (
                            <div key={label} style={{
                                background: C.ink50, borderRadius: 10, padding: '10px 12px',
                                border: `1px solid ${C.ink100}`,
                                display: 'flex', alignItems: 'flex-start', gap: 9,
                            }}>
                                <div style={{
                                    width: 28, height: 28, borderRadius: 7, background: C.indigoLight,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: C.indigo, flexShrink: 0, marginTop: 1,
                                }}>
                                    <Icon size={13} strokeWidth={2.5} />
                                </div>
                                <div style={{ minWidth: 0 }}>
                                    <p style={{ margin: 0, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: C.ink400 }}>
                                        {label}
                                    </p>
                                    <p style={{ margin: '3px 0 0', fontSize: 12, fontWeight: 700, color: C.ink800, wordBreak: 'break-word' }}>
                                        {value}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Message */}
                    {report.message && (
                        <div style={{ padding: '0 22px 16px' }}>
                            <div style={{
                                background: C.ink50, borderRadius: 10, padding: '10px 12px',
                                border: `1px solid ${C.ink100}`,
                            }}>
                                <p style={{ margin: 0, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: C.ink400 }}>
                                    Notes / Message
                                </p>
                                <p style={{ margin: '4px 0 0', fontSize: 12, color: C.ink700, lineHeight: 1.6, wordBreak: 'break-word' }}>
                                    {report.message}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{ padding: '12px 22px 16px', borderTop: `1px solid ${C.ink100}`, flexShrink: 0 }}>
                    <button onClick={onClose} style={{
                        width: '100%', padding: '10px 0', borderRadius: 9,
                        border: `1px solid ${C.ink200}`, background: C.white,
                        fontSize: 13, fontWeight: 600, color: C.ink600,
                        cursor: 'pointer', fontFamily: 'inherit',
                        transition: 'all 0.15s',
                    }}>Close</button>
                </div>
            </div>
        </div>
    )
}

/* ─── Skeleton Row ───────────────────────────────────────────────────────────── */
const SkeletonRow = () => (
    <tr style={{ borderBottom: `1px solid ${C.ink50}` }}>
        {[30, 80, 160, 100, 80, 70, 65, 90, 100].map((w, i) => (
            <td key={i} style={{ padding: '14px 18px' }}>
                <div style={{ height: 12, width: w, borderRadius: 6, background: C.ink100, animation: 'pulse 1.5s ease infinite' }} />
            </td>
        ))}
    </tr>
)

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
            for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i)
            if (currentPage < totalPages - 2) pages.push('...')
            pages.push(totalPages)
        }
        return pages
    }

    const btnBase = {
        minWidth: 32, height: 32, borderRadius: 7, border: `1px solid ${C.ink200}`,
        background: C.white, fontSize: 12, fontWeight: 600, cursor: 'pointer',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'inherit', color: C.ink600, transition: 'all 0.15s',
    }

    return (
        <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 20px', borderTop: `1px solid ${C.ink100}`,
            flexWrap: 'wrap', gap: 10,
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 12, color: C.ink500, whiteSpace: 'nowrap' }}>Rows:</span>
                <select value={pageSize} onChange={e => onPageSizeChange(Number(e.target.value))} style={{
                    padding: '5px 9px', borderRadius: 7, fontSize: 12, fontWeight: 600,
                    border: `1px solid ${C.ink200}`, background: C.white,
                    color: C.ink700, cursor: 'pointer', outline: 'none', fontFamily: 'inherit',
                }}>
                    {PAGE_SIZE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <span style={{ fontSize: 12, color: C.ink400, whiteSpace: 'nowrap' }}>
                    {((currentPage - 1) * pageSize) + 1}–{Math.min(currentPage * pageSize, totalItems)} of {totalItems}
                </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}
                    style={{ ...btnBase, opacity: currentPage === 1 ? 0.4 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}>
                    <ChevronLeft size={13} />
                </button>
                {getPages().map((p, i) =>
                    p === '...' ? (
                        <span key={`e-${i}`} style={{ minWidth: 32, textAlign: 'center', color: C.ink400, fontSize: 12 }}>…</span>
                    ) : (
                        <button key={p} onClick={() => onPageChange(p)} style={{
                            ...btnBase,
                            background: currentPage === p ? C.indigo : C.white,
                            color: currentPage === p ? C.white : C.ink600,
                            border: `1px solid ${currentPage === p ? C.indigo : C.ink200}`,
                            boxShadow: currentPage === p ? '0 2px 8px rgba(79,70,229,0.35)' : 'none',
                        }}>{p}</button>
                    )
                )}
                <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}
                    style={{ ...btnBase, opacity: currentPage === totalPages ? 0.4 : 1, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}>
                    <ChevronRight size={13} />
                </button>
            </div>
        </div>
    )
}

/* ─── ActionBtn ──────────────────────────────────────────────────────────────── */
const ActionBtn = ({ onClick, bg, color, hoverBg, icon: Icon, label, disabled, loading, border }) => {
    const [hov, setHov] = useState(false)
    return (
        <button
            onClick={disabled ? undefined : onClick}
            onMouseEnter={() => !disabled && setHov(true)}
            onMouseLeave={() => setHov(false)}
            className="btn-action"
            style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '5px 11px', borderRadius: 7,
                border: `1px solid ${border || bg}`,
                background: hov && !disabled ? hoverBg : bg,
                color, fontSize: 11, fontWeight: 700,
                cursor: disabled ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit', opacity: disabled ? 0.45 : 1,
                whiteSpace: 'nowrap',
            }}
        >
            {loading
                ? <span style={{
                    width: 10, height: 10, borderRadius: '50%',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: color,
                    animation: 'spin 0.7s linear infinite', display: 'inline-block',
                }} />
                : <Icon size={11} strokeWidth={2.5} />
            }
            {label}
        </button>
    )
}

/* ─── Priority Badge ─────────────────────────────────────────────────────────── */
const PriorityBadge = ({ priority }) => {
    const map = {
        urgent: { bg: '#fef2f2', color: C.redDark, label: 'URGENT' },
        high: { bg: '#fff7ed', color: '#c2410c', label: 'HIGH' },
        medium: { bg: C.ink50, color: C.ink600, label: 'MEDIUM' },
        low: { bg: '#f0fdf4', color: C.emeraldDark, label: 'LOW' },
    }
    const p = map[priority] || map.medium
    return (
        <span style={{
            padding: '3px 8px', borderRadius: 5,
            background: p.bg, color: p.color,
            fontSize: 10, fontWeight: 800, letterSpacing: '0.05em',
        }}>{p.label}</span>
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
    const [filterStatus, setFilterStatus] = useState('')
    const [searchFocused, setSearchFocused] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [detailReport, setDetailReport] = useState(null)
    const [toast, setToast] = useState({ message: '', type: 'success', visible: false })


    useEffect(() => {
        const noContext = (e) => e.preventDefault()
        const noSelect = (e) => e.preventDefault()
        const noDevTools = (e) => {
            if (
                e.key === 'F12' ||
                (e.ctrlKey && e.shiftKey && ['I', 'i', 'J', 'j', 'C', 'c', 'K', 'k'].includes(e.key)) ||
                (e.ctrlKey && ['U', 'u'].includes(e.key)) ||
                (e.ctrlKey && ['S', 's'].includes(e.key))
            ) {
                e.preventDefault()
                e.stopPropagation()
                return false
            }
        }

        document.addEventListener('contextmenu', noContext)
        document.addEventListener('copy', noSelect)
        document.addEventListener('cut', noSelect)
        document.addEventListener('selectstart', noSelect)
        document.addEventListener('keydown', noDevTools)

        document.body.style.userSelect = 'none'
        document.body.style.webkitUserSelect = 'none'
        document.body.style.msUserSelect = 'none'
        document.body.style.mozUserSelect = 'none'

        const devToolsInterval = setInterval(() => {
            const threshold = 160
            if (
                window.outerWidth - window.innerWidth > threshold ||
                window.outerHeight - window.innerHeight > threshold
            ) {
                document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-size:18px;font-family:sans-serif;color:#ef4444;">⚠️ DevTools detected. Please close DevTools to continue.</div>'
            }
        }, 1000)

        return () => {
            document.removeEventListener('contextmenu', noContext)
            document.removeEventListener('copy', noSelect)
            document.removeEventListener('cut', noSelect)
            document.removeEventListener('selectstart', noSelect)
            document.removeEventListener('keydown', noDevTools)
            clearInterval(devToolsInterval)
            document.body.style.userSelect = ''
            document.body.style.webkitUserSelect = ''
            document.body.style.msUserSelect = ''
            document.body.style.mozUserSelect = ''
        }
    }, [])


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

    const stats = useMemo(() => ({
        total: reports.length,
        pending: reports.filter(r => r.review_status === 'pending_review').length,
        approved: reports.filter(r => r.review_status === 'approved').length,
        rejected: reports.filter(r => r.review_status === 'rejected').length,
    }), [reports])

    const filtered = useMemo(() =>
        reports.filter(r => {
            const q = search.toLowerCase()
            const matchSearch = !q ||
                r.client_name?.toLowerCase().includes(q) ||
                r.country?.toLowerCase().includes(q) ||
                r.services?.toLowerCase().includes(q) ||
                r.client_email?.toLowerCase().includes(q)
            const matchStatus = !filterStatus || r.review_status === filterStatus
            return matchSearch && matchStatus
        }),
        [reports, search, filterStatus])

    useEffect(() => { setCurrentPage(1) }, [search, filterStatus, pageSize])

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
    const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

    const openAdd = () => { setEditData(null); setEditId(null); setModalOpen(true) }
    const openEdit = (r) => { setEditData(r); setEditId(r._id); setModalOpen(true) }

    const createLead = async (form) => {
        setSaving(true)
        try {
            const { data } = await API.post('/createLead', form)
            setReports(prev => [data.lead, ...prev])
            setModalOpen(false)
            showToast('Report created successfully')
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to create report', 'error')
        } finally { setSaving(false) }
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
        } finally { setSaving(false) }
    }

    const handleSave = (form) => { editId ? updateLead(form) : createLead(form) }

    const handleSend = async (id) => {
        setSendingId(id)
        try {
            await API.post(`/sendToManager/${id}`)
            setReports(prev => prev.map(r => r._id === id ? { ...r, review_status: 'pending_review' } : r))
            showToast('Report sent to manager')
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to send report', 'error')
        } finally { setSendingId(null) }
    }

    const alreadySent = (r) => r.review_status !== 'draft'
    const canEdit = (r) => r.review_status === 'draft'

    const TABLE_HEADERS = ['#', 'DATE', 'CLIENT', 'SERVICE', 'COUNTRY', 'PRIORITY', 'STATUS', 'ACTIONS']

    return (
        <DashboardLayout>
            <style>{GLOBAL_CSS}</style>

            <div style={{ minHeight: '100vh', background: C.pageBg, padding: 20, display: 'flex', flexDirection: 'column', gap: 16, boxSizing: 'border-box' }}>

                {/* ── Stat Cards ── */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
                    <StatCard label="Total Reports" value={stats.total} topColor="#3b82f6" icon={BarChart3} loading={loading} active={filterStatus === ''} onClick={() => setFilterStatus('')} />
                    <StatCard label="Pending" value={stats.pending} topColor="#f59e0b" icon={Clock} loading={loading} active={filterStatus === 'pending_review'} onClick={() => setFilterStatus(p => p === 'pending_review' ? '' : 'pending_review')} />
                    <StatCard label="Approved" value={stats.approved} topColor="#10b981" icon={CheckCircle2} loading={loading} active={filterStatus === 'approved'} onClick={() => setFilterStatus(p => p === 'approved' ? '' : 'approved')} />
                    <StatCard label="Rejected" value={stats.rejected} topColor="#ef4444" icon={XCircle} loading={loading} active={filterStatus === 'rejected'} onClick={() => setFilterStatus(p => p === 'rejected' ? '' : 'rejected')} />
                </div>

                {/* ── Main Panel ── */}
                <div style={{
                    background: C.white, borderRadius: 16,
                    border: `1px solid ${C.ink100}`,
                    boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
                    overflow: 'hidden',
                }}>

                    {/* Toolbar */}
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '14px 20px', borderBottom: `1px solid ${C.ink100}`,
                        flexWrap: 'wrap',
                    }}>
                        {/* Search */}
                        <div style={{ position: 'relative' }}>
                            <Search size={13} style={{
                                position: 'absolute', left: 12, top: '50%',
                                transform: 'translateY(-50%)', color: C.ink400, pointerEvents: 'none',
                            }} />
                            <input
                                type="text"
                                placeholder="Search name, email, country…"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                onFocus={() => setSearchFocused(true)}
                                onBlur={() => setSearchFocused(false)}
                                style={{
                                    paddingLeft: 34, paddingRight: 14, paddingTop: 8, paddingBottom: 8,
                                    width: 260, borderRadius: 40,
                                    border: `1.5px solid ${searchFocused ? C.indigo : C.ink200}`,
                                    boxShadow: searchFocused ? `0 0 0 3px ${C.indigoLight}` : 'none',
                                    fontSize: 12, color: C.ink800,
                                    background: C.white, outline: 'none', fontFamily: 'inherit',
                                    transition: 'all 0.2s',
                                }}
                            />
                        </div>

                        {/* Filter */}
                        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{
                            padding: '8px 12px', borderRadius: 8,
                            border: `1.5px solid ${C.ink200}`, background: C.white,
                            fontSize: 12, color: C.ink700, outline: 'none',
                            fontFamily: 'inherit', cursor: 'pointer',
                        }}>
                            <option value="">All Status</option>
                            <option value="draft">Draft</option>
                            <option value="pending_review">Pending Review</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                        </select>

                        <div style={{ flex: 1 }} />

                        {/* Count */}
                        <span style={{ fontSize: 12, color: C.ink500, fontWeight: 600, whiteSpace: 'nowrap' }}>
                            {filtered.length} report{filtered.length !== 1 ? 's' : ''}
                        </span>

                        {/* Refresh */}
                        <button onClick={fetchLeads} disabled={loading} className="btn-action" style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            padding: '8px 14px', borderRadius: 8,
                            border: `1.5px solid ${C.ink200}`, background: C.white,
                            color: C.ink700, fontSize: 12, fontWeight: 600,
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading ? 0.6 : 1, fontFamily: 'inherit',
                        }}>
                            <RefreshCw size={12} style={{ animation: loading ? 'spin 0.7s linear infinite' : 'none' }} />
                            Refresh
                        </button>

                        {/* Add */}
                        <button onClick={openAdd} className="btn-action" style={{
                            display: 'inline-flex', alignItems: 'center', gap: 7,
                            padding: '8px 18px', borderRadius: 9,
                            border: 'none', background: C.indigo,
                            color: C.white, fontSize: 12, fontWeight: 700,
                            cursor: 'pointer', fontFamily: 'inherit',
                            boxShadow: '0 4px 14px rgba(79,70,229,0.38)',
                        }}>
                            <Plus size={13} strokeWidth={2.5} />
                            Add Report
                        </button>
                    </div>

                    {/* Table */}
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                            <thead>
                                <tr style={{ borderBottom: `1px solid ${C.ink100}`, background: C.ink50 }}>
                                    {TABLE_HEADERS.map((h, i) => (
                                        <th key={h} style={{
                                            padding: '10px 18px',
                                            textAlign: i === TABLE_HEADERS.length - 1 ? 'right' : 'left',
                                            fontSize: 10, fontWeight: 800, letterSpacing: '0.1em',
                                            color: C.ink500, textTransform: 'uppercase', whiteSpace: 'nowrap',
                                        }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
                                ) : filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} style={{ padding: '64px 24px', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                                                <div style={{
                                                    width: 56, height: 56, borderRadius: 16,
                                                    background: C.ink100, display: 'flex',
                                                    alignItems: 'center', justifyContent: 'center', color: C.ink400,
                                                }}>
                                                    <FileText size={24} />
                                                </div>
                                                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.ink600 }}>No reports found</p>
                                                <p style={{ margin: 0, fontSize: 11, color: C.ink400 }}>
                                                    {search || filterStatus ? 'Try adjusting your filters' : 'Click "Add Report" to create your first entry'}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    paginated.map((report, idx) => {
                                        const editable = canEdit(report)
                                        const sent = alreadySent(report)
                                        const srNo = (currentPage - 1) * pageSize + idx + 1
                                        const sending = sendingId === report._id

                                        return (
                                            <tr
                                                key={report._id}
                                                className="sr-row"
                                                onClick={() => setDetailReport(report)}
                                                style={{
                                                    borderBottom: `1px solid ${C.ink50}`,
                                                    background: C.white,
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                {/* # */}
                                                <td style={{ padding: '13px 18px' }}>
                                                    <span style={{
                                                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                                        width: 26, height: 26, borderRadius: 7,
                                                        background: C.ink100, fontSize: 10, fontWeight: 800, color: C.ink600,
                                                    }}>{String(srNo).padStart(2, '0')}</span>
                                                </td>

                                                {/* Date */}
                                                <td style={{ padding: '13px 18px', color: C.ink700, fontWeight: 600, whiteSpace: 'nowrap' }}>
                                                    {fmtDate(report.date || report.createdAt)}
                                                </td>

                                                {/* Client */}
                                                <td style={{ padding: '13px 18px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                        <div style={{
                                                            width: 34, height: 34, borderRadius: '50%',
                                                            background: getAvatarGrad(report.client_name),
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            color: C.white, fontSize: 12, fontWeight: 800, flexShrink: 0,
                                                            boxShadow: '0 2px 6px rgba(0,0,0,0.18)',
                                                        }}>
                                                            {getInitials(report.client_name)}
                                                        </div>
                                                        <div>
                                                            <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: C.ink900, whiteSpace: 'nowrap' }}>{report.client_name}</p>
                                                            <p style={{ margin: 0, fontSize: 10, color: C.ink400 }}>{report.client_email}</p>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Service */}
                                                <td style={{ padding: '13px 18px', color: C.ink700, fontWeight: 600 }}>{report.services || '—'}</td>

                                                {/* Country */}
                                                <td style={{ padding: '13px 18px', color: C.ink700, fontWeight: 600 }}>{report.country || '—'}</td>

                                                {/* Lead Stage */}
                                                {/* <td style={{ padding: '13px 18px' }}>
                                                    <span style={{
                                                        padding: '3px 9px', borderRadius: 20,
                                                        background: C.blueLight, color: C.blue,
                                                        fontSize: 11, fontWeight: 700, textTransform: 'capitalize',
                                                    }}>
                                                        {report.lead_stage || 'new'}
                                                    </span>
                                                </td> */}

                                                {/* Priority */}
                                                <td style={{ padding: '13px 18px' }}>
                                                    <PriorityBadge priority={report.priority} />
                                                </td>

                                                {/* Status */}
                                                <td style={{ padding: '13px 18px' }}>
                                                    <StatusBadge status={report.review_status} />
                                                </td>

                                                {/* Actions */}
                                                <td style={{ padding: '13px 18px' }} onClick={e => e.stopPropagation()}>
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                                                        {/* Edit */}
                                                        <ActionBtn
                                                            onClick={() => openEdit(report)}
                                                            disabled={!editable}
                                                            icon={Edit2}
                                                            label="Edit"
                                                            bg={editable ? C.indigoLight : C.ink100}
                                                            color={editable ? C.indigo : C.ink400}
                                                            hoverBg={editable ? '#dde4fd' : C.ink100}
                                                            border={editable ? C.indigoBorder : C.ink200}
                                                        />

                                                        {/* Send / Sent */}
                                                        {sent ? (
                                                            <span style={{
                                                                display: 'inline-flex', alignItems: 'center', gap: 5,
                                                                padding: '5px 11px', borderRadius: 7,
                                                                background: C.emeraldLight, color: C.emeraldDark,
                                                                fontSize: 11, fontWeight: 700, border: `1px solid ${C.emeraldBorder}`,
                                                            }}>
                                                                <CheckCircle2 size={11} strokeWidth={2.5} /> Sent
                                                            </span>
                                                        ) : (
                                                            <ActionBtn
                                                                onClick={() => handleSend(report._id)}
                                                                icon={sending ? RefreshCw : Send}
                                                                label={sending ? 'Sending…' : 'Send'}
                                                                loading={sending}
                                                                bg={C.emeraldDark}
                                                                color={C.white}
                                                                hoverBg={C.emerald}
                                                                border={C.emeraldDark}
                                                            />
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

                    {/* Pagination */}
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

export default SalesReports