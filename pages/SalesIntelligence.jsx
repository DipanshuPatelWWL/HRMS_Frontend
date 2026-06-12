import React, { useState, useMemo, useEffect, useCallback } from 'react'
import DashboardLayout from '../src/components/layout/DashboardLayout'
import GenerateLeadsModal from '../components/leads/GenerateLeadsModal'
import LeadScoreBadge from '../components/leads/LeadScoreBadge'
import { getLeads, getIntelligenceStats } from '../services/intelligenceApi'
import EmailDraftModal from '../components/leads/EmailDraftModal'
import WebsiteAnalysisPanel from '../components/leads/WebsiteAnalysisPanel'
import FollowUpDashboard from '../components/leads/FollowUpDashboard'
import PriorityQueue from '../components/leads/PriorityQueue'
import SalesIntelligenceDashboard from '../components/leads/SalesIntelligenceDashboard'
import {
    Search, RefreshCw, Zap, ChevronLeft, ChevronRight,
    FileText, Globe, Mail, TrendingUp, BarChart3,
    Flame, Thermometer, Snowflake, X, FileDown, Plus, Trash2,
} from 'lucide-react'

const C = {
    indigo: '#4f46e5', indigoDark: '#3730a3', indigoLight: 'var(--brand-light)', indigoBorder: 'var(--border)',
    red: '#ef4444', redDark: '#b91c1c', redLight: 'var(--danger-bg)', redBorder: 'var(--border)',
    emerald: '#059669', emeraldDark: '#047857', emeraldLight: 'var(--success-bg)', emeraldBorder: 'var(--border)',
    blue: '#2563eb', blueLight: 'var(--brand-light)', blueBorder: 'var(--border)',
    amber: '#d97706', amberLight: 'var(--warn-bg)',
    ink50: 'var(--surface-3)', ink100: 'var(--border)', ink200: 'var(--border)',
    ink400: 'var(--text-3)', ink500: 'var(--text-2)', ink600: 'var(--text-2)',
    ink700: 'var(--text-1)', ink800: 'var(--text-1)', ink900: 'var(--text-1)',
    white: 'var(--surface)', pageBg: 'var(--surface-2)',
}

const PAGE_SIZE_OPTIONS = [10, 25, 50]

const GLOBAL_CSS = `
@keyframes spin    { to { transform: rotate(360deg) } }
@keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:.45} }
@keyframes slideUp { from{transform:translateY(16px);opacity:0} to{transform:translateY(0);opacity:1} }
@keyframes fadeIn  { from{opacity:0} to{opacity:1} }
@keyframes scaleIn { from{transform:scale(.97);opacity:0} to{transform:scale(1);opacity:1} }
.intel-row { transition: background 0.15s, box-shadow 0.15s; cursor: pointer; }
.intel-row:hover { background: var(--surface-2) !important; box-shadow: inset 3px 0 0 ${C.indigo}; }
.btn-action { transition: all 0.18s cubic-bezier(.4,0,.2,1) !important; }
.btn-action:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
.stat-card { transition: all 0.2s cubic-bezier(.4,0,.2,1); }
.stat-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.1) !important; }
`

const Toast = ({ message, type, visible }) => {
    if (!visible) return null
    return (
        <div style={{
            position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
            padding: '12px 18px', borderRadius: 12,
            background: type === 'error' ? C.redDark : C.emeraldDark,
            color: C.white, fontSize: 13, fontWeight: 600,
            boxShadow: '0 8px 32px rgba(0,0,0,0.22)',
            display: 'flex', alignItems: 'center', gap: 8,
            animation: 'slideUp 0.3s ease', maxWidth: 320,
        }}>
            {message}
        </div>
    )
}

const StatCard = ({ label, value, topColor, icon: Icon, loading, active, onClick }) => (
    <div className="stat-card" onClick={onClick} style={{
        background: C.white, borderRadius: 14, padding: '18px 20px',
        borderTop: `3px solid ${topColor}`,
        border: `1px solid ${active ? topColor : C.ink100}`,
        boxShadow: active ? `0 0 0 3px ${topColor}25, 0 4px 16px rgba(0,0,0,0.08)` : '0 1px 4px rgba(0,0,0,0.05)',
        cursor: onClick ? 'pointer' : 'default',
    }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.ink400, margin: 0 }}>{label}</p>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: `${topColor}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: topColor }}>
                <Icon size={14} strokeWidth={2.5} />
            </div>
        </div>
        {loading
            ? <div style={{ width: 50, height: 32, borderRadius: 6, background: C.ink100, animation: 'pulse 1.5s ease infinite' }} />
            : <p style={{ fontSize: 34, fontWeight: 900, color: C.ink900, margin: 0, lineHeight: 1 }}>{value ?? 0}</p>
        }
    </div>
)

const SkeletonRow = () => (
    <tr style={{ borderBottom: `1px solid ${C.ink50}` }}>
        {[30, 80, 160, 100, 80, 70, 65, 90].map((w, i) => (
            <td key={i} style={{ padding: '14px 18px' }}>
                <div style={{ height: 12, width: w, borderRadius: 6, background: C.ink100, animation: 'pulse 1.5s ease infinite' }} />
            </td>
        ))}
    </tr>
)


const GenuinenessBadge = ({ label, score }) => {
    const cfg = {
        genuine: { bg: '#dcfce7', color: '#15803d', border: '#86efac', icon: '✅' },
        unverified: { bg: '#fefce8', color: '#a16207', border: '#fde047', icon: '⚠️' },
        suspicious: { bg: '#fee2e2', color: '#b91c1c', border: '#fca5a5', icon: '🚫' },
    }
    const s = cfg[label] || cfg.unverified
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '3px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700,
            background: s.bg, color: s.color, border: `1px solid ${s.border}`,
            whiteSpace: 'nowrap',
        }}>
            {s.icon} {label ?? 'unverified'}{score != null ? ` ${score}` : ''}
        </span>
    )
}

const TECH_OPTIONS = [
    'WordPress', 'Shopify', 'Wix', 'Squarespace', 'Webflow', 'Drupal', 'Joomla', 'Ghost',
    'Next.js', 'Nuxt.js', 'React', 'Vue.js', 'Angular', 'Gatsby',
    'HubSpot', 'Salesforce', 'Zoho', 'Intercom', 'Zendesk', 'Drift',
    'Google Analytics', 'Hotjar', 'Mixpanel', 'Segment',
    'WooCommerce', 'Magento', 'BigCommerce',
    'Stripe', 'PayPal', 'Bootstrap', 'Tailwind', 'jQuery', 'Calendly', 'Mailchimp',
]

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
    const btnBase = { minWidth: 32, height: 32, borderRadius: 7, border: `1px solid ${C.ink200}`, background: C.white, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit', color: C.ink600, transition: 'all 0.15s' }
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderTop: `1px solid ${C.ink100}`, flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 12, color: C.ink500, whiteSpace: 'nowrap' }}>Rows:</span>
                <select value={pageSize} onChange={e => onPageSizeChange(Number(e.target.value))} style={{ padding: '5px 9px', borderRadius: 7, fontSize: 12, fontWeight: 600, border: `1px solid ${C.ink200}`, background: C.white, color: C.ink700, cursor: 'pointer', outline: 'none', fontFamily: 'inherit' }}>
                    {PAGE_SIZE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <span style={{ fontSize: 12, color: C.ink400, whiteSpace: 'nowrap' }}>{((currentPage - 1) * pageSize) + 1}–{Math.min(currentPage * pageSize, totalItems)} of {totalItems}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} style={{ ...btnBase, opacity: currentPage === 1 ? 0.4 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}><ChevronLeft size={13} /></button>
                {getPages().map((p, i) => p === '...'
                    ? <span key={`e-${i}`} style={{ minWidth: 32, textAlign: 'center', color: C.ink400, fontSize: 12 }}>…</span>
                    : <button key={p} onClick={() => onPageChange(p)} style={{ ...btnBase, background: currentPage === p ? C.indigo : C.white, color: currentPage === p ? C.white : C.ink600, border: `1px solid ${currentPage === p ? C.indigo : C.ink200}`, boxShadow: currentPage === p ? '0 2px 8px rgba(79,70,229,0.35)' : 'none' }}>{p}</button>
                )}
                <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} style={{ ...btnBase, opacity: currentPage === totalPages ? 0.4 : 1, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}><ChevronRight size={13} /></button>
            </div>
        </div>
    )
}



// NEW — add this full component just above the LeadDetailModal definition

const DEFAULT_MODULES = [
    { name: "HRMS Core", description: "Attendance, Leave, Payroll, Dashboard", timeline: "3 weeks", price: 2500 },
    { name: "Employee Self-Service", description: "Profile, Assets, Helpdesk portal", timeline: "2 weeks", price: 1500 },
    { name: "Reporting & Analytics", description: "Custom reports, exports, charts", timeline: "2 weeks", price: 1000 },
]

const ProposalModal = ({ open, lead, onClose }) => {
    const [modules, setModules] = useState(DEFAULT_MODULES)
    const [headcount, setHeadcount] = useState(50)
    const [preparedFor, setPreparedFor] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        if (open && lead) setPreparedFor(lead.companyName || '')
    }, [open, lead])

    if (!open || !lead) return null

    const updateModule = (i, field, val) =>
        setModules(prev => prev.map((m, idx) => idx === i ? { ...m, [field]: val } : m))

    const addModule = () =>
        setModules(prev => [...prev, { name: '', description: '', timeline: '2 weeks', price: 0 }])

    const removeModule = (i) =>
        setModules(prev => prev.filter((_, idx) => idx !== i))

    const subtotal = modules.reduce((s, m) => s + (Number(m.price) || 0), 0)
    const tax = Math.round(subtotal * 0.18)
    const total = subtotal + tax

    const handleDownload = async () => {
        setError('')
        setLoading(true)
        try {
            const token = localStorage.getItem('token')
            const res = await fetch(
                `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/intelligence/leads/${lead._id}/generate-proposal`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ modules, headcount: Number(headcount), prepared_for: preparedFor }),
                }
            )
            if (!res.ok) {
                const j = await res.json().catch(() => ({}))
                throw new Error(j.message || 'PDF generation failed')
            }
            const blob = await res.blob()
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `Proposal_${lead.companyName.replace(/\s+/g, '_')}.pdf`
            a.click()
            URL.revokeObjectURL(url)
            onClose()
        } catch (e) {
            setError(e.message)
        } finally {
            setLoading(false)
        }
    }

    const inputStyle = {
        width: '100%', padding: '7px 10px', borderRadius: 7,
        border: `1.5px solid ${C.ink200}`, fontSize: 12, color: C.ink800,
        background: C.white, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
    }

    return (
        <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(10,10,15,0.6)', backdropFilter: 'blur(8px)', animation: 'fadeIn 0.18s ease' }}>
            <div onClick={e => e.stopPropagation()} style={{ background: C.white, borderRadius: 18, width: '100%', maxWidth: 640, maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 40px 100px rgba(0,0,0,0.3)', animation: 'scaleIn 0.2s ease' }}>

                {/* Header */}
                <div style={{ padding: '16px 22px', borderBottom: `1px solid ${C.ink100}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: C.indigo, borderRadius: '18px 18px 0 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <FileDown size={18} color={C.white} />
                        <div>
                            <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: C.white }}>Generate Proposal PDF</p>
                            <p style={{ margin: 0, fontSize: 11, color: '#c7d2fe' }}>{lead.companyName}</p>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid rgba(255,255,255,0.3)', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: C.white }}>
                        <X size={14} />
                    </button>
                </div>

                <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>

                    {/* Meta */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                            <p style={{ margin: '0 0 4px', fontSize: 10, fontWeight: 700, color: C.ink400, textTransform: 'uppercase' }}>Prepared For</p>
                            <input style={inputStyle} value={preparedFor} onChange={e => setPreparedFor(e.target.value)} placeholder="Recipient / company name" />
                        </div>
                        <div>
                            <p style={{ margin: '0 0 4px', fontSize: 10, fontWeight: 700, color: C.ink400, textTransform: 'uppercase' }}>Headcount (employees)</p>
                            <input style={inputStyle} type="number" min={0} value={headcount} onChange={e => setHeadcount(e.target.value)} placeholder="50" />
                        </div>
                    </div>

                    {/* Modules */}
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: C.ink400, textTransform: 'uppercase' }}>Modules / Scope</p>
                            <button onClick={addModule} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 7, border: `1px solid ${C.indigoBorder}`, background: C.indigoLight, color: C.indigo, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                                <Plus size={11} /> Add Module
                            </button>
                        </div>

                        {modules.map((mod, i) => (
                            <div key={i} style={{ background: C.ink50, borderRadius: 10, padding: 12, marginBottom: 8, border: `1px solid ${C.ink100}` }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                                    <input style={inputStyle} placeholder="Module name" value={mod.name} onChange={e => updateModule(i, 'name', e.target.value)} />
                                    <input style={inputStyle} placeholder="Timeline e.g. 2 weeks" value={mod.timeline} onChange={e => updateModule(i, 'timeline', e.target.value)} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 8, alignItems: 'center' }}>
                                    <input style={inputStyle} placeholder="Description" value={mod.description} onChange={e => updateModule(i, 'description', e.target.value)} />
                                    <input style={{ ...inputStyle, width: 110 }} type="number" placeholder="Price USD" value={mod.price} onChange={e => updateModule(i, 'price', e.target.value)} />
                                    <button onClick={() => removeModule(i)} style={{ width: 32, height: 32, borderRadius: 7, border: `1px solid ${C.redBorder}`, background: C.redLight, color: C.red, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pricing summary */}
                    <div style={{ background: C.indigoLight, borderRadius: 10, padding: '12px 16px', border: `1px solid ${C.indigoBorder}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{ fontSize: 12, color: C.ink600 }}>Subtotal</span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: C.ink800 }}>${subtotal.toLocaleString()}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                            <span style={{ fontSize: 12, color: C.ink600 }}>Tax (18%)</span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: C.ink800 }}>${tax.toLocaleString()}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: `1px solid ${C.indigoBorder}` }}>
                            <span style={{ fontSize: 13, fontWeight: 800, color: C.indigo }}>Total</span>
                            <span style={{ fontSize: 16, fontWeight: 900, color: C.indigo }}>${total.toLocaleString()}</span>
                        </div>
                        {headcount > 0 && (
                            <p style={{ margin: '6px 0 0', fontSize: 10, color: C.ink500, textAlign: 'right' }}>
                                Per seat: ${(total / headcount).toFixed(2)} / employee
                            </p>
                        )}
                    </div>

                    {error && (
                        <div style={{ padding: '10px 14px', borderRadius: 8, background: C.redLight, border: `1px solid ${C.redBorder}`, color: C.redDark, fontSize: 12, fontWeight: 600 }}>
                            ⚠ {error}
                        </div>
                    )}

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 10 }}>
                        <button onClick={onClose} style={{ flex: 1, padding: '11px 0', borderRadius: 9, border: `1px solid ${C.ink200}`, background: C.white, fontSize: 13, fontWeight: 600, color: C.ink600, cursor: 'pointer', fontFamily: 'inherit' }}>
                            Cancel
                        </button>
                        <button onClick={handleDownload} disabled={loading || modules.length === 0} className="btn-action" style={{
                            flex: 2, padding: '11px 0', borderRadius: 9, border: 'none',
                            background: loading ? C.ink200 : C.indigo, color: C.white,
                            fontSize: 13, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                            fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            boxShadow: loading ? 'none' : '0 4px 16px rgba(79,70,229,0.4)',
                        }}>
                            {loading
                                ? <><span style={{ width: 14, height: 14, border: `2px solid ${C.white}`, borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} /> Generating…</>
                                : <><FileDown size={14} /> Download PDF</>
                            }
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

/* ── Lead Detail Modal — now with Email Draft button ── */
const LeadDetailModal = ({ open, lead, onClose, onEmailDraft, onProposal, onLeadUpdated }) => {
    if (!open || !lead) return null

    const avatarColors = ['#4f46e5', '#7c3aed', '#2563eb', '#0d9488', '#d97706', '#e11d48']
    const avatarBg = avatarColors[(lead.companyName?.charCodeAt(0) || 0) % avatarColors.length]

    const Field = ({ label, value, isLink }) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.ink400 }}>{label}</span>
            {isLink && value ? (
                <a href={value.startsWith('http') ? value : `https://${value}`} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: 13, fontWeight: 600, color: C.blue, wordBreak: 'break-word', textDecoration: 'none' }}>
                    {value} ↗
                </a>
            ) : (
                <span style={{ fontSize: 13, fontWeight: 600, color: C.ink800, wordBreak: 'break-word' }}>{value || '—'}</span>
            )}
        </div>
    )

    const hasDraft = !!(lead.emailDraft?.subject || lead.emailDraft?.body)

    return (
        <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(10,10,15,0.55)', backdropFilter: 'blur(8px)', animation: 'fadeIn 0.18s ease' }}>
            <div onClick={e => e.stopPropagation()} style={{ background: C.white, borderRadius: 18, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 40px 100px rgba(0,0,0,0.28)', animation: 'scaleIn 0.2s ease' }}>

                {/* Header */}
                <div style={{ padding: '18px 22px 14px', borderBottom: `1px solid ${C.ink100}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                        <div style={{ width: 42, height: 42, borderRadius: '50%', background: avatarBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.white, fontSize: 16, fontWeight: 800 }}>
                            {(lead.companyName || '?').charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: C.ink900 }}>{lead.companyName}</p>
                            <p style={{ margin: 0, fontSize: 11, color: C.ink400 }}>{lead.clientEmail || 'No email found'}</p>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${C.ink200}`, background: C.white, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: C.ink500 }}>
                        <X size={14} />
                    </button>
                </div>

                {/* Score + keyword */}
                <div style={{ padding: '12px 22px', background: C.ink50, borderBottom: `1px solid ${C.ink100}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <LeadScoreBadge tag={lead.tag} score={lead.score} showScore />
                    <span style={{ fontSize: 11, color: C.ink400, fontWeight: 600 }}>
                        via: <strong>{lead.keyword || 'manual'}</strong>
                    </span>
                </div>

                {/* Fields */}
                <div style={{ padding: '16px 22px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 20px' }}>
                    <Field label="Website" value={lead.website} isLink />
                    <Field label="Country" value={lead.country} />
                    <Field label="Email" value={lead.clientEmail} />
                    <Field label="Stage" value={lead.stage} />
                    <Field label="Priority" value={lead.priority} />
                    <Field label="Generated By" value={lead.generatedBy} />
                    <div style={{ gridColumn: 'span 2' }}>
                        <Field
                            label="Captured At"
                            value={lead.createdAt ? `${new Date(lead.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} ${new Date(lead.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}` : '--'}
                        />
                    </div>
                </div>

                {/* Website Analysis */}
                <div style={{ padding: '0 22px 16px' }}>
                    <WebsiteAnalysisPanel
                        lead={lead}
                        onAnalyzed={onLeadUpdated}
                    />
                </div>

                {/* LinkedIn */}
                {lead.linkedin && (
                    <div style={{ padding: '0 22px 14px' }}>
                        <a href={lead.linkedin} target="_blank" rel="noopener noreferrer"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, background: '#eff6ff', color: '#1d4ed8', fontSize: 12, fontWeight: 700, textDecoration: 'none', border: '1px solid #bfdbfe' }}>
                            View LinkedIn ↗
                        </a>
                    </div>
                )}

                {/* ── Proposal PDF button ── */}
                <div style={{ padding: '0 22px 8px' }}>
                    <button
                        onClick={() => { onClose(); onProposal(lead) }}
                        className="btn-action"
                        style={{
                            width: '100%', padding: '11px 0', borderRadius: 10, border: 'none',
                            background: C.amberLight,
                            color: C.amber, fontSize: 13, fontWeight: 700,
                            cursor: 'pointer', fontFamily: 'inherit',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            border: `1px solid #fcd34d`,
                        }}
                    >
                        <FileDown size={14} /> Download Proposal PDF
                    </button>
                </div>

                {/* ── Email Draft button ── */}
                <div style={{ padding: '0 22px 16px' }}>
                    <button
                        onClick={() => { onClose(); onEmailDraft(lead) }}
                        className="btn-action"
                        style={{
                            width: '100%', padding: '11px 0', borderRadius: 10, border: 'none',
                            background: hasDraft ? C.emeraldDark : C.indigo,
                            color: C.white, fontSize: 13, fontWeight: 700,
                            cursor: 'pointer', fontFamily: 'inherit',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            boxShadow: hasDraft ? '0 4px 12px rgba(4,120,87,0.35)' : '0 4px 16px rgba(79,70,229,0.4)',
                        }}
                    >
                        {hasDraft ? '💾 View / Edit Email Draft' : '✉ Generate Email Draft'}
                    </button>
                    {hasDraft && (
                        <p style={{ margin: '6px 0 0', fontSize: 11, color: C.emeraldDark, textAlign: 'center', fontWeight: 600 }}>
                            ✓ Draft saved — click to edit or copy
                        </p>
                    )}
                </div>

                {/* Timeline */}
                {lead.timeline?.length > 0 && (
                    <div style={{ padding: '0 22px 20px' }}>
                        <p style={{ margin: '0 0 10px', fontSize: 10, fontWeight: 700, color: C.ink400, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Activity</p>
                        {lead.timeline.slice(0, 4).map((t, i) => (
                            <div key={i} style={{ padding: '8px 12px', borderRadius: 8, background: C.ink50, marginBottom: 6, border: `1px solid ${C.ink100}` }}>
                                <p style={{ margin: 0, fontSize: 12, color: C.ink700, fontWeight: 500 }}>{t.action}</p>
                                <p style={{ margin: 0, fontSize: 10, color: C.ink400 }}>{t.performedBy}</p>
                            </div>
                        ))}
                    </div>
                )}

                <div style={{ padding: '0 22px 18px' }}>
                    <button onClick={onClose} style={{ width: '100%', padding: '10px 0', borderRadius: 9, border: `1px solid ${C.ink200}`, background: C.white, fontSize: 13, fontWeight: 600, color: C.ink600, cursor: 'pointer', fontFamily: 'inherit' }}>Close</button>
                </div>
            </div>
        </div>
    )
}

/* ── Main Page ── */
const SalesIntelligence = () => {
    const [leads, setLeads] = useState([])
    const [stats, setStats] = useState(null)
    const [loading, setLoading] = useState(true)
    const [statsLoading, setStatsLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [filterTag, setFilterTag] = useState('')
    const [searchFocused, setSearchFocused] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [generateModal, setGenerateModal] = useState(false)
    const [detailLead, setDetailLead] = useState(null)
    const [emailLead, setEmailLead] = useState(null)
    const [proposalLead, setProposalLead] = useState(null)
    const [toast, setToast] = useState({ message: '', type: 'success', visible: false })
    const [newLeadIds, setNewLeadIds] = useState(new Set())
    // ── New filters ──
    const [filterGenuineness, setFilterGenuineness] = useState('')
    const [filterTechs, setFilterTechs] = useState([])
    const [techDropdownOpen, setTechDropdownOpen] = useState(false)

    const showToast = useCallback((message, type = 'success') => {
        setToast({ message, type, visible: true })
        setTimeout(() => setToast(t => ({ ...t, visible: false })), 3500)
    }, [])

    const fetchLeads = useCallback(async () => {
        setLoading(true)
        try {
            const { data } = await getLeads({ sortBy: 'createdAt', order: 'desc', limit: 200 })
            setLeads(data.leads || [])
        } catch (err) {
            showToast('Failed to fetch leads', 'error')
        } finally { setLoading(false) }
    }, [showToast])

    const fetchStats = useCallback(async () => {
        setStatsLoading(true)
        try {
            const { data } = await getIntelligenceStats()
            setStats(data.stats)
        } catch (_) { } finally { setStatsLoading(false) }
    }, [])

    useEffect(() => { fetchLeads(); fetchStats() }, [fetchLeads, fetchStats])

    const handleLeadsGenerated = async (result) => {
        showToast(`✅ ${result.inserted} leads added successfully!`)
        console.log("Generated result:", result);
        console.log("Returned leads:", result.leads?.length);
        try {
            if (result.leads && result.leads.length > 0) {
                // Prepend new leads to local state immediately
                setLeads(prev => {
                    const existingIds = new Set(prev.map(l => l._id))
                    const newLeads = result.leads.filter(l => !existingIds.has(l._id))
                    return [...newLeads, ...prev]
                })

                // Highlight as NEW
                const newIds = new Set(result.leads.map(l => l._id))
                setNewLeadIds(newIds)

                // Refresh stats
                fetchStats()

                // Cleanup highlight after 30s
                setTimeout(() => setNewLeadIds(new Set()), 30000)
            } else {
                // Fallback: if no leads returned but inserted > 0, do a fetch
                await fetchLeads()
                await fetchStats()
            }
        } catch (err) {
            showToast('Failed to update lead list', 'error')
        } finally {
            setGenerateModal(false)
        }
    }

    // Called when EmailDraftModal saves — update lead in local state
    const handleEmailSaved = (updatedLead) => {
        setLeads(prev => prev.map(l => l._id === updatedLead._id ? updatedLead : l))
        showToast('✉ Email draft saved!')
    }

    const filtered = useMemo(() => {
        const q = search.toLowerCase()
        return leads.filter(l => {
            const matchSearch = !q ||
                l.companyName?.toLowerCase().includes(q) ||
                l.clientEmail?.toLowerCase().includes(q) ||
                l.country?.toLowerCase().includes(q) ||
                l.website?.toLowerCase().includes(q)
            const matchTag = !filterTag || l.tag === filterTag
            const matchGenuineness = !filterGenuineness || l.genuinenessLabel === filterGenuineness
            const matchTechs = filterTechs.length === 0 ||
                filterTechs.every(t => l.websiteAnalysis?.techStack?.includes(t))
            return matchSearch && matchTag && matchGenuineness && matchTechs
        })
    }, [leads, search, filterTag, filterGenuineness, filterTechs])
    useEffect(() => { setCurrentPage(1) }, [search, filterTag, pageSize])

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
    const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

    const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
    const avatarColors = ['#4f46e5', '#7c3aed', '#2563eb', '#0d9488', '#d97706', '#e11d48']
    const avatarBg = (name = '') => avatarColors[(name.charCodeAt(0) || 0) % avatarColors.length]

    const isToday = (dateStr) => {
        if (!dateStr) return false
        const d = new Date(dateStr)
        const now = new Date()
        return d.getDate() === now.getDate() &&
            d.getMonth() === now.getMonth() &&
            d.getFullYear() === now.getFullYear()
    }

    return (
        <DashboardLayout>
            <style>{GLOBAL_CSS}</style>

            <div style={{ minHeight: '100vh', background: C.pageBg, padding: 20, display: 'flex', flexDirection: 'column', gap: 16, boxSizing: 'border-box' }}>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: C.indigo, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <TrendingUp size={20} color={C.white} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: C.ink900, letterSpacing: '-0.02em' }}>Sales Intelligence</h1>
                            <p style={{ margin: 0, fontSize: 12, color: C.ink400, fontWeight: 500 }}>AI-powered lead discovery and scoring</p>
                        </div>
                    </div>
                    <button onClick={() => setGenerateModal(true)} className="btn-action" style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10,
                        border: 'none', background: C.indigo, color: C.white, fontSize: 13, fontWeight: 700,
                        cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(79,70,229,0.4)',
                    }}>
                        <Zap size={14} strokeWidth={2.5} /> Generate Leads
                    </button>
                </div>

                {/* Sales Intelligence Dashboard*/}
                <SalesIntelligenceDashboard
                    onGenerateLeads={() => setGenerateModal(true)}
                    onRescoreAll={() => { }}
                />

                {/* Stat Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
                    <StatCard label="Total Leads" value={stats?.total} topColor="#3b82f6" icon={BarChart3} loading={statsLoading} active={!filterTag} onClick={() => setFilterTag('')} />
                    <StatCard label="Hot" value={stats?.hot} topColor="#ef4444" icon={Flame} loading={statsLoading} active={filterTag === 'hot'} onClick={() => setFilterTag(t => t === 'hot' ? '' : 'hot')} />
                    <StatCard label="Warm" value={stats?.warm} topColor="#f59e0b" icon={Thermometer} loading={statsLoading} active={filterTag === 'warm'} onClick={() => setFilterTag(t => t === 'warm' ? '' : 'warm')} />
                    <StatCard label="Cold" value={stats?.cold} topColor="#3b82f6" icon={Snowflake} loading={statsLoading} active={filterTag === 'cold'} onClick={() => setFilterTag(t => t === 'cold' ? '' : 'cold')} />
                    <StatCard label="This Week" value={stats?.recentWeek} topColor="#8b5cf6" icon={TrendingUp} loading={statsLoading} />
                </div>
                {/* Follow-up Scheduler */}
                <FollowUpDashboard />

                {/* Priority Queue*/}
                <PriorityQueue />

                {/* Table */}
                <div style={{ background: C.white, borderRadius: 16, border: `1px solid ${C.ink100}`, boxShadow: '0 1px 6px rgba(0,0,0,0.06)', overflow: 'hidden' }}>

                    {/* Toolbar */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '14px 20px', borderBottom: `1px solid ${C.ink100}` }}>
                        {/* Row 1: search + refresh */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                            <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 200 }}>
                                <Search size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: C.ink400, pointerEvents: 'none' }} />
                                <input type="text" placeholder="Search company, email, country..." value={search} onChange={e => setSearch(e.target.value)}
                                    onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)}
                                    style={{ paddingLeft: 34, paddingRight: 14, paddingTop: 8, paddingBottom: 8, width: '100%', borderRadius: 40, border: `1.5px solid ${searchFocused ? C.indigo : C.ink200}`, boxShadow: searchFocused ? `0 0 0 3px ${C.indigoLight}` : 'none', fontSize: 12, color: C.ink800, background: C.white, outline: 'none', fontFamily: 'inherit', transition: 'all 0.2s', boxSizing: 'border-box' }} />
                            </div>
                            <span style={{ fontSize: 12, color: C.ink500, fontWeight: 600, whiteSpace: 'nowrap' }}>{filtered.length} lead{filtered.length !== 1 ? 's' : ''}</span>
                            <button onClick={() => { fetchLeads(); fetchStats() }} disabled={loading} className="btn-action" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: `1.5px solid ${C.ink200}`, background: C.white, color: C.ink700, fontSize: 12, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1, fontFamily: 'inherit' }}>
                                <RefreshCw size={12} style={{ animation: loading ? 'spin 0.7s linear infinite' : 'none' }} /> Refresh
                            </button>
                        </div>

                        {/* Row 2: Score tag pills */}
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                            <span style={{ fontSize: 10, fontWeight: 700, color: C.ink400, textTransform: 'uppercase', letterSpacing: '0.06em', marginRight: 2 }}>Score:</span>
                            {[
                                { value: '', label: 'All', color: C.ink400, bg: C.ink50 },
                                { value: 'hot', label: '🔥 Hot', color: '#b91c1c', bg: '#fef2f2' },
                                { value: 'warm', label: '🌤 Warm', color: '#b45309', bg: '#fffbeb' },
                                { value: 'cold', label: '❄️ Cold', color: '#1d4ed8', bg: '#eff6ff' },
                                { value: 'unscored', label: '— Unscored', color: C.ink500, bg: C.ink50 },
                            ].map(pill => (
                                <button key={pill.value} onClick={() => setFilterTag(pill.value)}
                                    style={{ padding: '5px 12px', borderRadius: 20, cursor: 'pointer', border: `1.5px solid ${filterTag === pill.value ? pill.color : C.ink200}`, background: filterTag === pill.value ? pill.bg : C.white, color: filterTag === pill.value ? pill.color : C.ink400, fontSize: 11, fontWeight: filterTag === pill.value ? 800 : 600, fontFamily: 'inherit', transition: 'all 0.15s' }}>
                                    {pill.label}
                                </button>
                            ))}
                        </div>

                        {/* Row 3: Genuineness pills + Tech dropdown */}
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                            <span style={{ fontSize: 10, fontWeight: 700, color: C.ink400, textTransform: 'uppercase', letterSpacing: '0.06em', marginRight: 2 }}>Trust:</span>
                            {[
                                { value: '', label: 'All' },
                                { value: 'genuine', label: '✅ Genuine' },
                                { value: 'unverified', label: '⚠️ Unverified' },
                                { value: 'suspicious', label: '🚫 Suspicious' },
                            ].map(pill => (
                                <button key={pill.value} onClick={() => setFilterGenuineness(pill.value)}
                                    style={{ padding: '5px 12px', borderRadius: 20, cursor: 'pointer', border: `1.5px solid ${filterGenuineness === pill.value ? C.indigo : C.ink200}`, background: filterGenuineness === pill.value ? C.indigoLight : C.white, color: filterGenuineness === pill.value ? C.indigo : C.ink400, fontSize: 11, fontWeight: filterGenuineness === pill.value ? 800 : 600, fontFamily: 'inherit', transition: 'all 0.15s' }}>
                                    {pill.label}
                                </button>
                            ))}

                            {/* Tech stack multi-select dropdown */}
                            <div style={{ position: 'relative', marginLeft: 8 }}>
                                <button onClick={() => setTechDropdownOpen(o => !o)}
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20, cursor: 'pointer', border: `1.5px solid ${filterTechs.length ? C.indigo : C.ink200}`, background: filterTechs.length ? C.indigoLight : C.white, color: filterTechs.length ? C.indigo : C.ink400, fontSize: 11, fontWeight: 700, fontFamily: 'inherit' }}>
                                    🔧 Tech Stack {filterTechs.length > 0 && `(${filterTechs.length})`} ▾
                                </button>
                                {techDropdownOpen && (
                                    <div style={{ position: 'absolute', top: '110%', left: 0, zIndex: 40, background: C.white, border: `1px solid ${C.ink200}`, borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', padding: 10, width: 260, maxHeight: 280, overflowY: 'auto' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                            <span style={{ fontSize: 10, fontWeight: 700, color: C.ink400, textTransform: 'uppercase' }}>Select Technologies</span>
                                            {filterTechs.length > 0 && (
                                                <button onClick={() => setFilterTechs([])} style={{ fontSize: 10, color: C.red, border: 'none', background: 'none', cursor: 'pointer', fontWeight: 700 }}>Clear</button>
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                                            {TECH_OPTIONS.map(t => {
                                                const active = filterTechs.includes(t)
                                                return (
                                                    <button key={t} onClick={() => setFilterTechs(prev => active ? prev.filter(x => x !== t) : [...prev, t])}
                                                        style={{ padding: '3px 9px', borderRadius: 20, fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', border: `1.5px solid ${active ? C.indigo : C.ink200}`, background: active ? C.indigo : C.white, color: active ? C.white : C.ink600, transition: 'all 0.12s' }}>
                                                        {t}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                            <thead>
                                <tr style={{ borderBottom: `1px solid ${C.ink100}`, background: C.ink50 }}>
                                    {['#', 'COMPANY', 'EMAIL', 'WEBSITE', 'COUNTRY', 'SCORE', 'TRUST', 'STAGE', 'DATE & TIME'].map(h => (
                                        <th key={h} style={{ padding: '10px 18px', textAlign: 'left', fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', color: C.ink500, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
                                ) : paginated.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} style={{ padding: '64px 24px', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                                                <div style={{ width: 56, height: 56, borderRadius: 16, background: C.ink100, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.ink400 }}>
                                                    <FileText size={24} />
                                                </div>
                                                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.ink600 }}>No leads found</p>
                                                <p style={{ margin: 0, fontSize: 11, color: C.ink400 }}>Click <strong>Generate Leads</strong> to find companies automatically</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    paginated.map((lead, idx) => {
                                        const srNo = (currentPage - 1) * pageSize + idx + 1
                                        const hasDraft = !!(lead.emailDraft?.subject || lead.emailDraft?.body)
                                        const isNew = isToday(lead.createdAt) || newLeadIds.has(lead._id)
                                        const prevLead = paginated[idx - 1]
                                        const showDivider = idx > 0 && isToday(prevLead?.createdAt) && !isToday(lead.createdAt)

                                        return (
                                            <React.Fragment key={lead._id}>
                                                {showDivider && (
                                                    <tr>
                                                        <td colSpan={9} style={{ padding: '6px 18px', background: C.ink50 }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                                <div style={{ flex: 1, height: 1, background: C.ink200 }} />
                                                                <span style={{ fontSize: 10, fontWeight: 700, color: C.ink400, whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Older leads</span>
                                                                <div style={{ flex: 1, height: 1, background: C.ink200 }} />
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                                <tr
                                                    className="intel-row"
                                                    onClick={() => setDetailLead(lead)}
                                                    style={{
                                                        borderBottom: `1px solid ${C.ink50}`,
                                                        background: isNew ? '#f0fdf4' : C.white,
                                                        borderLeft: isNew ? '3px solid #22c55e' : '3px solid transparent',
                                                    }}
                                                >
                                                    <td style={{ padding: '13px 18px' }}>
                                                        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: 7, background: C.ink100, fontSize: 10, fontWeight: 800, color: C.ink600 }}>{String(srNo).padStart(2, '0')}</span>
                                                    </td>
                                                    <td style={{ padding: '13px 18px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                                                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: avatarBg(lead.companyName), display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.white, fontSize: 12, fontWeight: 800, flexShrink: 0 }}>
                                                                {(lead.companyName || '?').charAt(0).toUpperCase()}
                                                            </div>
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                                                    <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: C.ink900, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.companyName}</p>
                                                                    {isNew && (
                                                                        <span style={{
                                                                            padding: '2px 6px', borderRadius: 20,
                                                                            background: '#dcfce7', color: '#15803d',
                                                                            fontSize: 9, fontWeight: 800,
                                                                            border: '1px solid #86efac',
                                                                            animation: 'pulse 1.5s ease infinite',
                                                                            whiteSpace: 'nowrap',
                                                                        }}>NEW</span>
                                                                    )}
                                                                </div>
                                                                {hasDraft && <span style={{ fontSize: 10, color: C.emeraldDark, fontWeight: 700 }}>✉ Draft saved</span>}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '13px 18px' }}>
                                                        {lead.clientEmail
                                                            ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: C.emeraldDark, fontWeight: 600 }}><Mail size={10} /> {lead.clientEmail}</span>
                                                            : <span style={{ fontSize: 11, color: C.ink400 }}>—</span>}
                                                    </td>
                                                    <td style={{ padding: '13px 18px' }}>
                                                        {lead.website
                                                            ? (
                                                                <a
                                                                    href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    onClick={e => e.stopPropagation()}
                                                                    style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: C.blue, fontWeight: 600, textDecoration: 'none' }}
                                                                >
                                                                    <Globe size={10} /> {lead.website.replace('https://', '').replace('http://', '').slice(0, 22)}
                                                                </a>
                                                            )
                                                            : <span style={{ fontSize: 11, color: C.ink400 }}>—</span>}
                                                    </td>
                                                    <td style={{ padding: '13px 18px', color: C.ink700, fontWeight: 600 }}>{lead.country || '—'}</td>
                                                    <td style={{ padding: '13px 18px' }}><LeadScoreBadge tag={lead.tag} score={lead.score} showScore /></td>
                                                    <td style={{ padding: '13px 18px' }}>
                                                        <GenuinenessBadge label={lead.genuinenessLabel} score={lead.genuinenessScore} />
                                                    </td>
                                                    <td style={{ padding: '13px 18px' }}>
                                                        <span style={{ padding: '3px 9px', borderRadius: 20, background: C.indigoLight, color: C.indigo, fontSize: 11, fontWeight: 700 }}>{lead.stage || 'New'}</span>
                                                    </td>
                                                    <td style={{ padding: '13px 18px', whiteSpace: 'nowrap' }}>
                                                        {lead.createdAt ? (
                                                            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                                                                <span style={{ fontSize: 12, fontWeight: 700, color: isNew ? '#15803d' : C.ink700 }}>
                                                                    {new Date(lead.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                                </span>
                                                                <span style={{ fontSize: 10, color: isNew ? '#16a34a' : C.ink400, fontWeight: 600 }}>
                                                                    {new Date(lead.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                                                                </span>
                                                            </div>
                                                        ) : '--'}
                                                    </td>
                                                </tr>
                                            </React.Fragment>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {!loading && filtered.length > 0 && (
                        <Pagination currentPage={currentPage} totalPages={totalPages} pageSize={pageSize} totalItems={filtered.length} onPageChange={setCurrentPage} onPageSizeChange={s => { setPageSize(s); setCurrentPage(1) }} />
                    )}
                </div>
            </div>

            <GenerateLeadsModal open={generateModal} onClose={() => setGenerateModal(false)} onSuccess={handleLeadsGenerated} />

            <LeadDetailModal
                open={!!detailLead}
                lead={detailLead}
                onClose={() => setDetailLead(null)}
                onEmailDraft={(lead) => setEmailLead(lead)}
                onProposal={(lead) => setProposalLead(lead)}
                onLeadUpdated={(updated) => setLeads(prev => prev.map(l => l._id === updated._id ? updated : l))}
            />

            <ProposalModal
                open={!!proposalLead}
                lead={proposalLead}
                onClose={() => setProposalLead(null)}
            />

            {/* ── Day 7: Email Draft Modal ── */}
            <EmailDraftModal
                open={!!emailLead}
                lead={emailLead}
                onClose={() => setEmailLead(null)}
                onSaved={handleEmailSaved}
            />

            <Toast message={toast.message} type={toast.type} visible={toast.visible} />
        </DashboardLayout>
    )
}

export default SalesIntelligence