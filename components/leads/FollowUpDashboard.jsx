import React, { useState, useEffect, useCallback } from 'react'
import API from '../../src/services/api'

const C = {
    indigo: '#4f46e5', indigoLight: '#eef2ff', indigoBorder: '#c7d2fe',
    red: '#ef4444', redDark: '#b91c1c', redLight: '#fef2f2', redBorder: '#fca5a5',
    emerald: '#059669', emeraldDark: '#047857', emeraldLight: '#ecfdf5', emeraldBorder: '#6ee7b7',
    amber: '#d97706', amberDark: '#b45309', amberLight: '#fffbeb', amberBorder: '#fcd34d',
    blue: '#2563eb', blueLight: '#eff6ff', blueBorder: '#93c5fd',
    ink50: '#f4f4f8', ink100: '#e8e8f0', ink200: '#c4c4d4',
    ink400: '#6b6b85', ink500: '#44445a', ink600: '#2d2d3a',
    ink700: '#1c1c27', ink800: '#111118', ink900: '#0a0a0f',
    white: '#ffffff',
}

const ANIM = `
@keyframes fadeIn  { from{opacity:0} to{opacity:1} }
@keyframes slideUp { from{transform:translateY(12px);opacity:0} to{transform:translateY(0);opacity:1} }
@keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:.5} }
@keyframes spin    { to{transform:rotate(360deg)} }
.fu-row { transition: background 0.15s; }
.fu-row:hover { background: #f0f4ff !important; }
.fu-btn { transition: all 0.15s; cursor: pointer; }
.fu-btn:hover:not(:disabled) { transform: translateY(-1px); opacity: 0.85; }
`

const Spinner = () => (
    <span style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid #fff4', borderTopColor: '#fff', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
)

const fmtDate = (d) => {
    if (!d) return '—'
    const date = new Date(d)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    date.setHours(0, 0, 0, 0)
    const diff = Math.round((date - today) / 86400000)
    if (diff === 0) return 'Today'
    if (diff === 1) return 'Tomorrow'
    if (diff === -1) return 'Yesterday'
    if (diff < 0) return `${Math.abs(diff)}d overdue`
    return `In ${diff}d`
}

const TagBadge = ({ tag }) => {
    const cfg = {
        hot: { bg: '#fef2f2', color: '#b91c1c', label: '🔥 Hot' },
        warm: { bg: '#fffbeb', color: '#b45309', label: '🌤 Warm' },
        cold: { bg: '#eff6ff', color: '#1d4ed8', label: '❄️ Cold' },
        unscored: { bg: '#f8fafc', color: '#64748b', label: '— —' },
    }[tag || 'unscored']
    return (
        <span style={{ padding: '2px 8px', borderRadius: 20, background: cfg.bg, color: cfg.color, fontSize: 10, fontWeight: 700 }}>
            {cfg.label}
        </span>
    )
}

// ── Follow-up card ────────────────────────────────────────────────────────────
const FollowUpCard = ({ lead, variant, onComplete, onSnooze, loadingId }) => {
    const [snoozing, setSnoozing] = useState(false)
    const isLoading = loadingId === lead._id

    const borderColor = variant === 'overdue' ? C.red : variant === 'today' ? C.amber : C.blue
    const bgColor = variant === 'overdue' ? C.redLight : variant === 'today' ? C.amberLight : C.blueLight

    return (
        <div className="fu-row" style={{
            background: C.white, borderRadius: 12, padding: '14px 16px',
            border: `1px solid ${C.ink100}`,
            borderLeft: `4px solid ${borderColor}`,
            display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
            animation: 'slideUp 0.2s ease',
        }}>
            {/* Avatar */}
            <div style={{
                width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                background: C.indigo, display: 'flex', alignItems: 'center',
                justifyContent: 'center', color: C.white, fontSize: 14, fontWeight: 800,
            }}>
                {(lead.companyName || '?').charAt(0).toUpperCase()}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 120 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: C.ink900 }}>
                    {lead.companyName}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3, flexWrap: 'wrap' }}>
                    <TagBadge tag={lead.tag} />
                    {lead.clientEmail && (
                        <span style={{ fontSize: 10, color: C.ink500, fontWeight: 500 }}>
                            {lead.clientEmail}
                        </span>
                    )}
                </div>
            </div>

            {/* Due date */}
            <div style={{ textAlign: 'center', minWidth: 80 }}>
                <p style={{
                    margin: 0, fontSize: 13, fontWeight: 800,
                    color: variant === 'overdue' ? C.redDark : variant === 'today' ? C.amberDark : C.blue,
                }}>
                    {fmtDate(lead.nextFollowUp)}
                </p>
                {lead.daysOverdue > 0 && (
                    <p style={{ margin: 0, fontSize: 10, color: C.red, fontWeight: 600 }}>
                        {lead.daysOverdue}d late
                    </p>
                )}
            </div>

            {/* Pending follow-ups */}
            <div style={{ minWidth: 80 }}>
                {(lead.followUpDates || []).filter(f => !f.completed).slice(0, 3).map((fu, i) => (
                    <div key={i} style={{
                        fontSize: 10, color: C.ink500, fontWeight: 600,
                        padding: '2px 6px', borderRadius: 4,
                        background: C.ink50, marginBottom: 2, width: 'fit-content',
                    }}>
                        {fu.label} · {new Date(fu.scheduledAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                    </div>
                ))}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                {/* Snooze */}
                <div style={{ position: 'relative' }}>
                    <button
                        className="fu-btn"
                        onClick={() => setSnoozing(s => !s)}
                        disabled={isLoading}
                        style={{
                            padding: '7px 12px', borderRadius: 8,
                            border: `1px solid ${C.ink200}`, background: C.white,
                            fontSize: 11, fontWeight: 700, color: C.ink600,
                            fontFamily: 'inherit',
                        }}
                    >
                        ⏰ Snooze
                    </button>
                    {snoozing && (
                        <div style={{
                            position: 'absolute', right: 0, top: 34, zIndex: 10,
                            background: C.white, borderRadius: 10, padding: 8,
                            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                            border: `1px solid ${C.ink200}`,
                            display: 'flex', flexDirection: 'column', gap: 4, minWidth: 120,
                        }}>
                            {[1, 3, 7, 14].map(d => (
                                <button key={d} className="fu-btn"
                                    onClick={() => { setSnoozing(false); onSnooze(lead._id, d) }}
                                    style={{
                                        padding: '6px 10px', borderRadius: 6, border: 'none',
                                        background: C.ink50, fontSize: 11, fontWeight: 600,
                                        color: C.ink700, textAlign: 'left', fontFamily: 'inherit',
                                    }}
                                >
                                    +{d} day{d > 1 ? 's' : ''}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Complete */}
                <button
                    className="fu-btn"
                    onClick={() => onComplete(lead._id)}
                    disabled={isLoading}
                    style={{
                        padding: '7px 14px', borderRadius: 8, border: 'none',
                        background: C.emeraldDark, color: C.white,
                        fontSize: 11, fontWeight: 700, fontFamily: 'inherit',
                        display: 'flex', alignItems: 'center', gap: 5,
                    }}
                >
                    {isLoading ? <Spinner /> : '✓'} Done
                </button>
            </div>
        </div>
    )
}

// ── Main FollowUpDashboard ────────────────────────────────────────────────────
const FollowUpDashboard = () => {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [loadingId, setLoadingId] = useState(null)
    const [tab, setTab] = useState('overdue') // overdue | today | upcoming
    const [toast, setToast] = useState({ msg: '', visible: false, type: 'success' })

    const showToast = (msg, type = 'success') => {
        setToast({ msg, visible: true, type })
        setTimeout(() => setToast(t => ({ ...t, visible: false })), 3000)
    }

    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const { data } = await API.get('/intelligence/follow-ups')
            setData(data)
            // Auto-select tab with most items
            if (data.overdue?.length > 0) setTab('overdue')
            else if (data.dueToday?.length > 0) setTab('today')
            else setTab('upcoming')
        } catch (err) {
            showToast('Failed to load follow-ups', 'error')
        } finally { setLoading(false) }
    }, [])

    useEffect(() => { fetchData() }, [fetchData])

    const handleComplete = async (leadId) => {
        setLoadingId(leadId)
        try {
            await API.post(`/intelligence/leads/${leadId}/follow-up/complete`, { note: 'Marked done from follow-up dashboard' })
            showToast('✅ Follow-up marked as done!')
            fetchData()
        } catch (err) {
            showToast('Failed to complete follow-up', 'error')
        } finally { setLoadingId(null) }
    }

    const handleSnooze = async (leadId, days) => {
        setLoadingId(leadId)
        try {
            await API.post(`/intelligence/leads/${leadId}/follow-up/snooze`, { days })
            showToast(`⏰ Snoozed by ${days} day${days > 1 ? 's' : ''}`)
            fetchData()
        } catch (err) {
            showToast('Failed to snooze', 'error')
        } finally { setLoadingId(null) }
    }

    const tabs = [
        { key: 'overdue', label: '🚨 Overdue', count: data?.summary?.overdue || 0, color: C.red },
        { key: 'today', label: '📅 Today', count: data?.summary?.dueToday || 0, color: C.amber },
        { key: 'upcoming', label: '🔜 Upcoming', count: data?.summary?.upcoming || 0, color: C.blue },
    ]

    const currentLeads = tab === 'overdue' ? data?.overdue : tab === 'today' ? data?.dueToday : data?.upcoming

    return (
        <>
            <style>{ANIM}</style>

            {/* Toast */}
            {toast.visible && (
                <div style={{
                    position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
                    padding: '12px 18px', borderRadius: 12,
                    background: toast.type === 'error' ? C.redDark : C.emeraldDark,
                    color: C.white, fontSize: 13, fontWeight: 600,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                    animation: 'slideUp 0.3s ease',
                }}>
                    {toast.msg}
                </div>
            )}

            <div style={{ background: C.white, borderRadius: 16, border: `1px solid ${C.ink100}`, overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>

                {/* Header */}
                <div style={{ padding: '16px 20px 0', borderBottom: `1px solid ${C.ink100}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 34, height: 34, borderRadius: 10, background: C.amberLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                                📅
                            </div>
                            <div>
                                <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: C.ink900 }}>Follow-up Scheduler</p>
                                <p style={{ margin: 0, fontSize: 11, color: C.ink400 }}>
                                    {loading ? 'Loading...' : `${data?.summary?.total || 0} lead${data?.summary?.total !== 1 ? 's' : ''} need attention`}
                                </p>
                            </div>
                        </div>
                        <button onClick={fetchData} disabled={loading} style={{
                            padding: '6px 12px', borderRadius: 8, border: `1px solid ${C.ink200}`,
                            background: C.white, fontSize: 11, fontWeight: 600, color: C.ink600,
                            cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                        }}>
                            ↺ Refresh
                        </button>
                    </div>

                    {/* Tabs */}
                    <div style={{ display: 'flex', gap: 0 }}>
                        {tabs.map(t => (
                            <button key={t.key} onClick={() => setTab(t.key)} style={{
                                padding: '8px 16px', border: 'none', background: 'none',
                                fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                                color: tab === t.key ? t.color : C.ink400,
                                borderBottom: tab === t.key ? `2px solid ${t.color}` : '2px solid transparent',
                                display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s',
                            }}>
                                {t.label}
                                <span style={{
                                    padding: '1px 6px', borderRadius: 10,
                                    background: tab === t.key ? t.color : C.ink100,
                                    color: tab === t.key ? C.white : C.ink500,
                                    fontSize: 10, fontWeight: 800,
                                }}>
                                    {t.count}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8, minHeight: 200 }}>
                    {loading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} style={{ height: 72, borderRadius: 12, background: C.ink50, animation: 'pulse 1.5s ease infinite' }} />
                        ))
                    ) : !currentLeads?.length ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 0', gap: 8 }}>
                            <span style={{ fontSize: 32 }}>
                                {tab === 'overdue' ? '✅' : tab === 'today' ? '🎉' : '📭'}
                            </span>
                            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.ink600 }}>
                                {tab === 'overdue' ? 'No overdue follow-ups!' : tab === 'today' ? 'Nothing due today' : 'No upcoming follow-ups'}
                            </p>
                            <p style={{ margin: 0, fontSize: 11, color: C.ink400 }}>
                                {tab === 'overdue' ? 'Great job staying on top of things.' : 'Check back tomorrow.'}
                            </p>
                        </div>
                    ) : (
                        currentLeads.map(lead => (
                            <FollowUpCard
                                key={lead._id}
                                lead={lead}
                                variant={tab === 'overdue' ? 'overdue' : tab === 'today' ? 'today' : 'upcoming'}
                                onComplete={handleComplete}
                                onSnooze={handleSnooze}
                                loadingId={loadingId}
                            />
                        ))
                    )}
                </div>
            </div>
        </>
    )
}

export default FollowUpDashboard