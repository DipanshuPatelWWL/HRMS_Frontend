import React, { useState, useEffect, useCallback } from 'react'
import API from '../../src/services/api'
import ScoreBreakdownPanel from './ScoreBreakdownPanel'
import {
    Flame, Thermometer, Snowflake, RefreshCw,
    ChevronRight, Mail, Globe, RotateCcw,
} from 'lucide-react'

const C = {
    indigo: '#4f46e5', indigoDark: '#3730a3', indigoLight: '#eef2ff', indigoBorder: '#c7d2fe',
    red: '#ef4444', redDark: '#b91c1c', redLight: '#fef2f2',
    emerald: '#059669', emeraldDark: '#047857', emeraldLight: '#ecfdf5',
    amber: '#d97706', amberLight: '#fffbeb',
    blue: '#2563eb', blueLight: '#eff6ff',
    ink50: '#f4f4f8', ink100: '#e8e8f0', ink200: '#c4c4d4',
    ink400: '#6b6b85', ink500: '#44445a', ink600: '#2d2d3a',
    ink700: '#1c1c27', ink800: '#111118', ink900: '#0a0a0f',
    white: '#ffffff',
}

const TAG_TABS = [
    { key: 'hot', label: 'Hot', icon: Flame, color: '#ef4444', bg: '#fef2f2', border: '#fca5a5' },
    { key: 'warm', label: 'Warm', icon: Thermometer, color: '#d97706', bg: '#fffbeb', border: '#fcd34d' },
    { key: 'cold', label: 'Cold', icon: Snowflake, color: '#2563eb', bg: '#eff6ff', border: '#93c5fd' },
]

const GLOBAL_CSS = `
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.45} }
@keyframes spin  { to { transform: rotate(360deg) } }
.pq-row { transition: background 0.15s; cursor: pointer; }
.pq-row:hover { background: #f0f4ff !important; }
.pq-btn { transition: all 0.15s; }
.pq-btn:hover:not(:disabled) { transform: translateY(-1px); }
`

const PriorityQueue = ({ onLeadClick }) => {
    const [activeTab, setActiveTab] = useState('hot')
    const [leads, setLeads] = useState([])
    const [loading, setLoading] = useState(true)
    const [rescoring, setRescoring] = useState(false)
    const [selectedLead, setSelectedLead] = useState(null)
    const [toast, setToast] = useState({ msg: '', visible: false })

    const showToast = (msg) => {
        setToast({ msg, visible: true })
        setTimeout(() => setToast(t => ({ ...t, visible: false })), 3000)
    }

    const fetchLeads = useCallback(async (tag = activeTab) => {
        setLoading(true)
        try {
            const { data } = await API.get('/intelligence/leads', {
                params: { tag, sortBy: 'score', order: 'desc', limit: 50 },
            })
            setLeads(data.leads || [])
        } catch (err) {
            console.error('PriorityQueue fetch error:', err)
        } finally { setLoading(false) }
    }, [activeTab])

    useEffect(() => { fetchLeads(activeTab) }, [activeTab])

    const handleRescoreAll = async () => {
        setRescoring(true)
        try {
            await API.post('/intelligence/leads/rescore-all')
            showToast('Rescoring all leads in background...')
            setTimeout(() => fetchLeads(activeTab), 5000)
        } catch (err) {
            showToast('Rescore failed')
        } finally { setRescoring(false) }
    }

    const fmtDate = (d) => d
        ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
        : '—'

    return (
        <>
            <style>{GLOBAL_CSS}</style>

            <div style={{
                background: C.white, borderRadius: 16,
                border: `1px solid ${C.ink100}`,
                boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
                overflow: 'hidden',
            }}>
                {/* Header */}
                <div style={{
                    padding: '14px 20px',
                    borderBottom: `1px solid ${C.ink100}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: C.ink900 }}>
                            Priority Queue
                        </h3>
                        <p style={{ margin: 0, fontSize: 11, color: C.ink400 }}>
                            Leads sorted by score — focus on these first
                        </p>
                    </div>
                    <button
                        onClick={handleRescoreAll}
                        disabled={rescoring}
                        className="pq-btn"
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            padding: '7px 14px', borderRadius: 8,
                            border: `1px solid ${C.ink200}`, background: C.white,
                            fontSize: 11, fontWeight: 600, color: C.ink600,
                            cursor: rescoring ? 'not-allowed' : 'pointer',
                            fontFamily: 'inherit', opacity: rescoring ? 0.6 : 1,
                        }}
                    >
                        <RotateCcw size={11} style={{ animation: rescoring ? 'spin 0.8s linear infinite' : 'none' }} />
                        Rescore All
                    </button>
                </div>

                {/* Tag tabs */}
                <div style={{ display: 'flex', borderBottom: `1px solid ${C.ink100}` }}>
                    {TAG_TABS.map(tab => {
                        const Icon = tab.icon
                        const active = activeTab === tab.key
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                style={{
                                    flex: 1, padding: '10px 0',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                    border: 'none', borderBottom: active ? `2px solid ${tab.color}` : '2px solid transparent',
                                    background: active ? tab.bg : 'transparent',
                                    color: active ? tab.color : C.ink400,
                                    fontSize: 12, fontWeight: active ? 800 : 600,
                                    cursor: 'pointer', fontFamily: 'inherit',
                                    transition: 'all 0.15s',
                                }}
                            >
                                <Icon size={12} strokeWidth={2.5} />
                                {tab.label}
                            </button>
                        )
                    })}
                </div>

                {/* Two-column layout: list + breakdown */}
                <div style={{ display: 'grid', gridTemplateColumns: selectedLead ? '1fr 260px' : '1fr', minHeight: 300 }}>

                    {/* Lead list */}
                    <div style={{ overflowX: 'auto' }}>
                        {loading ? (
                            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} style={{ height: 52, borderRadius: 10, background: C.ink100, animation: 'pulse 1.5s ease infinite' }} />
                                ))}
                            </div>
                        ) : leads.length === 0 ? (
                            <div style={{ padding: '40px 20px', textAlign: 'center', color: C.ink400 }}>
                                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.ink600 }}>
                                    No {activeTab} leads
                                </p>
                                <p style={{ margin: '4px 0 0', fontSize: 11 }}>
                                    Generate leads or rescore existing ones
                                </p>
                            </div>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                                <thead>
                                    <tr style={{ background: C.ink50, borderBottom: `1px solid ${C.ink100}` }}>
                                        {['RANK', 'COMPANY', 'SCORE', 'EMAIL', 'COUNTRY', 'DATE', ''].map(h => (
                                            <th key={h} style={{
                                                padding: '8px 14px', textAlign: 'left',
                                                fontSize: 10, fontWeight: 800,
                                                letterSpacing: '0.08em', color: C.ink400,
                                                textTransform: 'uppercase', whiteSpace: 'nowrap',
                                            }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {leads.map((lead, idx) => {
                                        const tabCfg = TAG_TABS.find(t => t.key === activeTab)
                                        const isSelected = selectedLead?._id === lead._id
                                        return (
                                            <tr
                                                key={lead._id}
                                                className="pq-row"
                                                onClick={() => setSelectedLead(isSelected ? null : lead)}
                                                style={{
                                                    borderBottom: `1px solid ${C.ink50}`,
                                                    background: isSelected ? C.indigoLight : C.white,
                                                }}
                                            >
                                                {/* Rank */}
                                                <td style={{ padding: '11px 14px' }}>
                                                    <span style={{
                                                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                                        width: 24, height: 24, borderRadius: 6,
                                                        background: idx < 3 ? tabCfg?.color : C.ink100,
                                                        color: idx < 3 ? C.white : C.ink500,
                                                        fontSize: 10, fontWeight: 900,
                                                    }}>
                                                        {idx + 1}
                                                    </span>
                                                </td>

                                                {/* Company */}
                                                <td style={{ padding: '11px 14px' }}>
                                                    <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: C.ink900, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {lead.companyName}
                                                    </p>
                                                    {lead.website && (
                                                        <p style={{ margin: '1px 0 0', fontSize: 10, color: C.ink400 }}>
                                                            {lead.website.replace('https://', '').replace('http://', '').slice(0, 28)}
                                                        </p>
                                                    )}
                                                </td>

                                                {/* Score */}
                                                <td style={{ padding: '11px 14px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                        <span style={{
                                                            fontSize: 14, fontWeight: 900,
                                                            color: tabCfg?.color,
                                                        }}>{lead.score}</span>
                                                        {/* mini bar */}
                                                        <div style={{ width: 36, height: 4, borderRadius: 4, background: C.ink100, overflow: 'hidden' }}>
                                                            <div style={{
                                                                height: '100%', borderRadius: 4,
                                                                background: tabCfg?.color,
                                                                width: `${lead.score}%`,
                                                            }} />
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Email */}
                                                <td style={{ padding: '11px 14px' }}>
                                                    {lead.clientEmail
                                                        ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: C.emeraldDark, fontWeight: 600 }}>
                                                            <Mail size={9} /> {lead.clientEmail.slice(0, 22)}
                                                        </span>
                                                        : <span style={{ fontSize: 11, color: C.ink400 }}>—</span>
                                                    }
                                                </td>

                                                {/* Country */}
                                                <td style={{ padding: '11px 14px', fontSize: 11, color: C.ink600, fontWeight: 600 }}>
                                                    {lead.country || '—'}
                                                </td>

                                                {/* Date */}
                                                <td style={{ padding: '11px 14px', fontSize: 11, color: C.ink400, whiteSpace: 'nowrap' }}>
                                                    {fmtDate(lead.createdAt)}
                                                </td>

                                                {/* Expand arrow */}
                                                <td style={{ padding: '11px 10px' }}>
                                                    <ChevronRight
                                                        size={12}
                                                        color={C.ink400}
                                                        style={{
                                                            transform: isSelected ? 'rotate(90deg)' : 'none',
                                                            transition: 'transform 0.15s',
                                                        }}
                                                    />
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Score breakdown panel */}
                    {selectedLead && (
                        <div style={{
                            borderLeft: `1px solid ${C.ink100}`,
                            padding: 14,
                            background: C.ink50,
                        }}>
                            <ScoreBreakdownPanel
                                lead={selectedLead}
                                onClose={() => setSelectedLead(null)}
                            />
                        </div>
                    )}
                </div>

                {/* Footer */}
                {!loading && leads.length > 0 && (
                    <div style={{
                        padding: '10px 20px',
                        borderTop: `1px solid ${C.ink100}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}>
                        <span style={{ fontSize: 11, color: C.ink400, fontWeight: 600 }}>
                            {leads.length} {activeTab} lead{leads.length !== 1 ? 's' : ''} sorted by score
                        </span>
                        <span style={{ fontSize: 11, color: C.ink400 }}>
                            Click a row to see score breakdown →
                        </span>
                    </div>
                )}
            </div>

            {/* Toast */}
            {toast.visible && (
                <div style={{
                    position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
                    padding: '11px 18px', borderRadius: 10,
                    background: C.ink900, color: C.white,
                    fontSize: 12, fontWeight: 600,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                }}>
                    {toast.msg}
                </div>
            )}
        </>
    )
}

export default PriorityQueue