import React, { useState, useEffect, useCallback } from 'react'
import API from '../../src/services/api'

const C = {
    indigo: '#4f46e5', indigoDark: '#3730a3', indigoLight: '#eef2ff', indigoBorder: '#c7d2fe',
    emerald: '#059669', emeraldDark: '#047857', emeraldLight: '#ecfdf5',
    red: '#ef4444', redDark: '#b91c1c', redLight: '#fef2f2',
    amber: '#d97706', amberDark: '#b45309', amberLight: '#fffbeb',
    blue: '#2563eb', blueLight: '#eff6ff',
    purple: '#7c3aed', purpleLight: '#f5f3ff',
    ink50: '#f4f4f8', ink100: '#e8e8f0', ink200: '#c4c4d4',
    ink400: '#6b6b85', ink500: '#44445a', ink600: '#2d2d3a',
    ink700: '#1c1c27', ink800: '#111118', ink900: '#0a0a0f',
    white: '#ffffff',
}

const ANIM = `
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.45} }
@keyframes slideUp { from{transform:translateY(12px);opacity:0} to{transform:translateY(0);opacity:1} }
@keyframes spin { to{transform:rotate(360deg)} }
.dash-card { transition: all 0.2s cubic-bezier(.4,0,.2,1); }
.dash-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.1) !important; }
.quick-btn { transition: all 0.18s ease; }
.quick-btn:hover:not(:disabled) { transform: translateY(-1px); opacity: 0.9; }
`

// ── Mini bar chart ────────────────────────────────────────────────────────────
const BarChart = ({ data, loading }) => {
    if (loading) return (
        <div style={{ height: 120, display: 'flex', alignItems: 'flex-end', gap: 6, padding: '0 4px' }}>
            {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} style={{ flex: 1, background: C.ink100, borderRadius: 4, height: `${30 + Math.random() * 60}%`, animation: 'pulse 1.5s ease infinite' }} />
            ))}
        </div>
    )

    const maxVal = Math.max(...data.map(d => d.total), 1)

    return (
        <div style={{ height: 120, display: 'flex', alignItems: 'flex-end', gap: 4, padding: '0 4px' }}>
            {data.map((d, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 1, justifyContent: 'flex-end' }}>
                        {d.hot > 0 && (
                            <div style={{ width: '100%', height: `${(d.hot / maxVal) * 90}px`, background: C.red, borderRadius: '3px 3px 0 0', minHeight: 3, transition: 'height 0.4s ease' }} title={`Hot: ${d.hot}`} />
                        )}
                        {d.warm > 0 && (
                            <div style={{ width: '100%', height: `${(d.warm / maxVal) * 90}px`, background: C.amber, minHeight: 3, transition: 'height 0.4s ease' }} title={`Warm: ${d.warm}`} />
                        )}
                        {d.cold > 0 && (
                            <div style={{ width: '100%', height: `${(d.cold / maxVal) * 90}px`, background: C.blue, borderRadius: '0 0 3px 3px', minHeight: 3, transition: 'height 0.4s ease' }} title={`Cold: ${d.cold}`} />
                        )}
                        {d.total === 0 && (
                            <div style={{ width: '100%', height: 3, background: C.ink100, borderRadius: 3 }} />
                        )}
                    </div>
                    <span style={{ fontSize: 9, color: C.ink400, fontWeight: 600, whiteSpace: 'nowrap' }}>{d.day}</span>
                </div>
            ))}
        </div>
    )
}

// ── Stat card ─────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, color, icon, loading, onClick }) => (
    <div className="dash-card" onClick={onClick} style={{
        background: C.white, borderRadius: 12, padding: '14px 16px',
        border: `1px solid ${C.ink100}`, borderTop: `3px solid ${color}`,
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)', cursor: onClick ? 'pointer' : 'default',
        animation: 'slideUp 0.2s ease',
    }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <p style={{ margin: 0, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.ink400 }}>{label}</p>
            <span style={{ fontSize: 16 }}>{icon}</span>
        </div>
        {loading
            ? <div style={{ height: 32, width: 60, borderRadius: 6, background: C.ink100, margin: '8px 0 4px', animation: 'pulse 1.5s ease infinite' }} />
            : <p style={{ margin: '8px 0 4px', fontSize: 30, fontWeight: 900, color: C.ink900, lineHeight: 1 }}>{value ?? 0}</p>
        }
        {sub && <p style={{ margin: 0, fontSize: 10, color: C.ink400, fontWeight: 500 }}>{sub}</p>}
    </div>
)

// ── Funnel bar ────────────────────────────────────────────────────────────────
const FunnelBar = ({ stage, count, max, color }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <span style={{ fontSize: 11, color: C.ink500, fontWeight: 600, minWidth: 70 }}>{stage}</span>
        <div style={{ flex: 1, height: 8, borderRadius: 4, background: C.ink100, overflow: 'hidden' }}>
            <div style={{
                height: '100%', borderRadius: 4,
                width: max > 0 ? `${(count / max) * 100}%` : '0%',
                background: color, transition: 'width 0.5s ease',
            }} />
        </div>
        <span style={{ fontSize: 11, fontWeight: 800, color: C.ink700, minWidth: 20, textAlign: 'right' }}>{count}</span>
    </div>
)

// ── Opportunity row ───────────────────────────────────────────────────────────
const OpportunityRow = ({ type, count, highPriority, index }) => {
    const icons = {
        'No HRMS Detected': '🏢',
        'Not Mobile Responsive': '📱',
        'No Contact Form Found': '📬',
        'No Analytics Tracking': '📊',
        'Outdated Technology Stack': '⚙️',
        'No CRM Integration Detected': '🤝',
        'Slow Website Performance': '🐢',
        'No SSL Certificate': '🔒',
    }
    const icon = icons[type] || '📌'
    const pct = highPriority > 0 ? Math.round((highPriority / count) * 100) : 0

    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 0', borderBottom: `1px solid ${C.ink50}`,
        }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>{icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: C.ink800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{type}</p>
                {pct > 0 && <p style={{ margin: 0, fontSize: 10, color: C.red, fontWeight: 600 }}>{pct}% high priority</p>}
            </div>
            <span style={{
                padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 800,
                background: C.indigoLight, color: C.indigo,
            }}>{count}</span>
        </div>
    )
}

/* ── SalesIntelligenceDashboard ──────────────────────────────────────────────
   Self-contained dashboard panel — drop into SalesIntelligence.jsx
*/
const SalesIntelligenceDashboard = ({ onGenerateLeads, onRescoreAll }) => {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState(null)
    const [toast, setToast] = useState({ msg: '', visible: false })

    const showToast = (msg) => {
        setToast({ msg, visible: true })
        setTimeout(() => setToast(t => ({ ...t, visible: false })), 3000)
    }

    const fetchDashboard = useCallback(async () => {
        setLoading(true)
        try {
            const { data: res } = await API.get('/intelligence/dashboard')
            setData(res)
        } catch (err) {
            console.error('Dashboard fetch error:', err.message)
        } finally { setLoading(false) }
    }, [])

    useEffect(() => { fetchDashboard() }, [fetchDashboard])

    const handleRescoreAll = async () => {
        setActionLoading('rescore')
        try {
            await API.post('/intelligence/leads/rescore-all')
            showToast('🔄 Rescoring all leads in background...')
            onRescoreAll?.()
        } catch (err) {
            showToast('Failed to rescore')
        } finally { setActionLoading(null) }
    }

    const s = data?.stats || {}
    const maxStage = Math.max(...(data?.byStage || []).map(s => s.count), 1)
    const stageColors = ['#6b7280', '#3b82f6', '#f59e0b', '#8b5cf6', '#059669']

    return (
        <>
            <style>{ANIM}</style>

            {/* Toast */}
            {toast.visible && (
                <div style={{ position: 'fixed', bottom: 80, right: 24, zIndex: 9999, padding: '10px 16px', borderRadius: 10, background: C.emeraldDark, color: C.white, fontSize: 12, fontWeight: 600, boxShadow: '0 8px 24px rgba(0,0,0,0.2)', animation: 'slideUp 0.3s ease' }}>
                    {toast.msg}
                </div>
            )}

            <div style={{ background: C.white, borderRadius: 16, border: `1px solid ${C.ink100}`, overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>

                {/* ── Header ── */}
                <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.ink100}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 10, background: C.indigoLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>📊</div>
                        <div>
                            <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: C.ink900 }}>Sales Intelligence Dashboard</p>
                            <p style={{ margin: 0, fontSize: 11, color: C.ink400 }}>Live overview of your lead pipeline</p>
                        </div>
                    </div>
                    <button onClick={fetchDashboard} disabled={loading} style={{
                        padding: '6px 12px', borderRadius: 8, border: `1px solid ${C.ink200}`,
                        background: C.white, fontSize: 11, fontWeight: 600, color: C.ink600,
                        cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                    }}>
                        ↺ Refresh
                    </button>
                </div>

                <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>

                    {/* ── Summary stat cards ── */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                        <StatCard label="Total Leads" value={s.total} sub={`${s.recentWeek || 0} this week`} color={C.blue} icon="📋" loading={loading} />
                        <StatCard label="Hot Leads" value={s.hot} sub={`${s.warm || 0} warm, ${s.cold || 0} cold`} color={C.red} icon="🔥" loading={loading} />
                        <StatCard label="Needs Follow-up" value={s.needsFollowUp} sub={s.overdueFollowUp > 0 ? `${s.overdueFollowUp} overdue` : 'All on track'} color={s.overdueFollowUp > 0 ? C.red : C.emerald} icon="📅" loading={loading} />
                        <StatCard label="Email Drafts" value={s.withDraft} sub={`${s.draftRate || 0}% of leads have drafts`} color={C.purple} icon="✉️" loading={loading} />
                    </div>

                    {/* ── 2nd row stat cards ── */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                        <StatCard label="With Email" value={s.withEmail} sub={`${s.emailRate || 0}% contact rate`} color={C.emerald} icon="📬" loading={loading} />
                        <StatCard label="Analyzed" value={s.withAnalysis} sub="website analysis done" color={C.amber} icon="🔍" loading={loading} />
                        <StatCard label="This Month" value={s.recentMonth} sub="leads generated" color={C.indigo} icon="📈" loading={loading} />
                        <StatCard label="Unscored" value={s.unscored} sub="need scoring" color={C.ink400} icon="⚪" loading={loading} />
                    </div>

                    {/* ── Main content: chart + opportunities + funnel ── */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>

                        {/* Weekly chart */}
                        <div style={{ background: C.ink50, borderRadius: 12, padding: 16, border: `1px solid ${C.ink100}` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: C.ink800 }}>📅 Leads This Week</p>
                                <span style={{ fontSize: 11, color: C.ink400, fontWeight: 600 }}>{s.recentWeek || 0} total</span>
                            </div>
                            <BarChart data={data?.weeklyChart || []} loading={loading} />
                            {/* Legend */}
                            <div style={{ display: 'flex', gap: 10, marginTop: 10, justifyContent: 'center' }}>
                                {[['🔥 Hot', C.red], ['🌤 Warm', C.amber], ['❄️ Cold', C.blue]].map(([label, color]) => (
                                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <div style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
                                        <span style={{ fontSize: 9, color: C.ink400, fontWeight: 600 }}>{label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Top opportunities */}
                        <div style={{ background: C.ink50, borderRadius: 12, padding: 16, border: `1px solid ${C.ink100}` }}>
                            <p style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 800, color: C.ink800 }}>🎯 Top Opportunities</p>
                            {loading ? (
                                Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} style={{ height: 32, borderRadius: 6, background: C.ink200, marginBottom: 6, animation: 'pulse 1.5s ease infinite' }} />
                                ))
                            ) : data?.topOpportunities?.length > 0 ? (
                                data.topOpportunities.map((op, i) => (
                                    <OpportunityRow key={i} {...op} type={op._id} index={i} />
                                ))
                            ) : (
                                <p style={{ fontSize: 12, color: C.ink400, textAlign: 'center', marginTop: 24 }}>
                                    Analyze websites to detect opportunities
                                </p>
                            )}
                        </div>

                        {/* Stage funnel + quick actions */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

                            {/* Funnel */}
                            <div style={{ background: C.ink50, borderRadius: 12, padding: 16, border: `1px solid ${C.ink100}`, flex: 1 }}>
                                <p style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 800, color: C.ink800 }}>🔄 Pipeline Funnel</p>
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <div key={i} style={{ height: 20, borderRadius: 4, background: C.ink200, marginBottom: 6, animation: 'pulse 1.5s ease infinite' }} />
                                    ))
                                ) : (
                                    (data?.byStage || []).map((s, i) => (
                                        <FunnelBar key={s.stage} stage={s.stage} count={s.count} max={maxStage} color={stageColors[i] || C.indigo} />
                                    ))
                                )}
                            </div>

                            {/* Quick actions */}
                            <div style={{ background: C.indigoLight, borderRadius: 12, padding: 14, border: `1px solid ${C.indigoBorder}` }}>
                                <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 800, color: C.indigo }}>⚡ Quick Actions</p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                                    <button
                                        className="quick-btn"
                                        onClick={onGenerateLeads}
                                        style={{ padding: '9px 14px', borderRadius: 8, border: 'none', background: C.indigo, color: C.white, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8 }}
                                    >
                                        ⚡ Generate New Leads
                                    </button>
                                    <button
                                        className="quick-btn"
                                        onClick={handleRescoreAll}
                                        disabled={actionLoading === 'rescore'}
                                        style={{ padding: '9px 14px', borderRadius: 8, border: `1px solid ${C.indigoBorder}`, background: C.white, color: C.indigo, fontSize: 12, fontWeight: 700, cursor: actionLoading === 'rescore' ? 'not-allowed' : 'pointer', fontFamily: 'inherit', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8 }}
                                    >
                                        {actionLoading === 'rescore' ? '⏳ Rescoring...' : '🔄 Rescore All Leads'}
                                    </button>
                                    <button
                                        className="quick-btn"
                                        onClick={fetchDashboard}
                                        style={{ padding: '9px 14px', borderRadius: 8, border: `1px solid ${C.indigoBorder}`, background: C.white, color: C.indigo, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8 }}
                                    >
                                        📊 Refresh Dashboard
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Top keywords + recent leads ── */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

                        {/* Top keywords */}
                        <div style={{ background: C.ink50, borderRadius: 12, padding: 16, border: `1px solid ${C.ink100}` }}>
                            <p style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 800, color: C.ink800 }}>🔍 Top Keywords</p>
                            {loading ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <div key={i} style={{ height: 28, borderRadius: 6, background: C.ink200, marginBottom: 6, animation: 'pulse 1.5s ease infinite' }} />
                                ))
                            ) : data?.topKeywords?.length > 0 ? (
                                data.topKeywords.map((kw, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0', borderBottom: `1px solid ${C.ink100}` }}>
                                        <span style={{ fontSize: 12, color: C.ink700, fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {kw._id}
                                        </span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                                            <span style={{ fontSize: 10, color: C.ink400 }}>avg {Math.round(kw.avgScore)}</span>
                                            <span style={{ padding: '1px 7px', borderRadius: 10, fontSize: 11, fontWeight: 800, background: C.indigoLight, color: C.indigo }}>{kw.count}</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p style={{ fontSize: 12, color: C.ink400 }}>No keyword data yet</p>
                            )}
                        </div>

                        {/* Recent leads */}
                        <div style={{ background: C.ink50, borderRadius: 12, padding: 16, border: `1px solid ${C.ink100}` }}>
                            <p style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 800, color: C.ink800 }}>🕐 Recent Leads</p>
                            {loading ? (
                                Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} style={{ height: 28, borderRadius: 6, background: C.ink200, marginBottom: 6, animation: 'pulse 1.5s ease infinite' }} />
                                ))
                            ) : data?.recentLeads?.map((lead, i) => {
                                const tagCfg = {
                                    hot: { color: C.red, bg: C.redLight, label: '🔥' },
                                    warm: { color: C.amber, bg: C.amberLight, label: '🌤' },
                                    cold: { color: C.blue, bg: C.blueLight, label: '❄️' },
                                }[lead.tag] || { color: C.ink400, bg: C.ink50, label: '—' }

                                return (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: `1px solid ${C.ink100}` }}>
                                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: C.indigo, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.white, fontSize: 11, fontWeight: 800, flexShrink: 0 }}>
                                            {(lead.companyName || '?').charAt(0).toUpperCase()}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: C.ink800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.companyName}</p>
                                            <p style={{ margin: 0, fontSize: 9, color: C.ink400 }}>{new Date(lead.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</p>
                                        </div>
                                        <span style={{ padding: '1px 7px', borderRadius: 10, fontSize: 10, fontWeight: 800, background: tagCfg.bg, color: tagCfg.color, flexShrink: 0 }}>
                                            {tagCfg.label} {lead.score}
                                        </span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default SalesIntelligenceDashboard