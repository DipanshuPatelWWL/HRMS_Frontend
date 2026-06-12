import React, { useState } from 'react'
import API from '../../src/services/api'

const C = {
    indigo: '#4f46e5', indigoLight: '#eef2ff', indigoBorder: '#a5b4fc',
    emerald: '#059669', emeraldDark: '#047857', emeraldLight: '#ecfdf5',
    red: '#dc2626', redLight: '#fef2f2', redBorder: '#fca5a5',
    amber: '#d97706', amberLight: '#fffbeb', amberBorder: '#fcd34d',
    blue: '#2563eb', blueLight: '#eff6ff', blueBorder: '#93c5fd',
    purple: '#7c3aed', purpleLight: '#f5f3ff',
    slate100: '#f1f5f9', slate200: '#e2e8f0',
    slate400: '#94a3b8', slate500: '#64748b', slate600: '#475569',
    slate800: '#1e293b', slate900: '#0f172a',
    white: '#ffffff',
}

const ANIM = `
@keyframes spin { to{transform:rotate(360deg)} }
@keyframes slideDown { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
@keyframes fadeIn { from{opacity:0} to{opacity:1} }
`

const Spinner = () => (
    <span style={{ width: 13, height: 13, borderRadius: '50%', border: '2px solid #fff4', borderTopColor: '#fff', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
)

const priorityCfg = {
    critical: { bg: '#fdf2f8', color: '#be185d', border: '#fbcfe8', label: '🚨 Critical' },
    high: { bg: C.redLight, color: C.red, border: C.redBorder, label: '🔴 High' },
    medium: { bg: C.amberLight, color: C.amber, border: C.amberBorder, label: '🟡 Medium' },
    low: { bg: C.blueLight, color: C.blue, border: C.blueBorder, label: '🔵 Low' },
}

// ── Single talking point card ─────────────────────────────────────────────────
const TalkingPointCard = ({ op, index }) => {
    const [expanded, setExpanded] = useState(false)
    const [copied, setCopied] = useState(null) // 'question' | 'solution'
    const cfg = priorityCfg[op.priority] || priorityCfg.medium

    const copyText = (text, type) => {
        navigator.clipboard.writeText(text)
        setCopied(type)
        setTimeout(() => setCopied(null), 2000)
    }

    return (
        <div style={{
            borderRadius: 12, border: `1px solid ${cfg.border}`,
            background: cfg.bg, overflow: 'hidden',
            animation: 'slideDown 0.2s ease',
        }}>
            {/* Header */}
            <button
                onClick={() => setExpanded(e => !e)}
                style={{
                    width: '100%', padding: '12px 14px', border: 'none',
                    background: 'none', cursor: 'pointer', fontFamily: 'inherit',
                    display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
                }}
            >
                <span style={{ fontSize: 18, flexShrink: 0 }}>{op.icon || '📌'}</span>
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: cfg.color }}>
                            {op.type}
                        </p>
                        <span style={{
                            padding: '1px 7px', borderRadius: 10, fontSize: 9, fontWeight: 800,
                            background: cfg.color, color: C.white, textTransform: 'uppercase',
                        }}>
                            {cfg.label.split(' ')[1] || cfg.label}
                        </span>
                    </div>
                    {!expanded && (
                        <p style={{ margin: '2px 0 0', fontSize: 11, color: C.slate500, fontWeight: 500 }}>
                            {op.description?.slice(0, 80)}...
                        </p>
                    )}
                </div>
                <span style={{ fontSize: 12, color: C.slate400, flexShrink: 0 }}>
                    {expanded ? '▲' : '▼'}
                </span>
            </button>

            {/* Expanded content */}
            {expanded && (
                <div style={{ padding: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>

                    {/* Opener */}
                    <p style={{ margin: 0, fontSize: 12, color: C.slate600, lineHeight: 1.6, fontStyle: 'italic' }}>
                        "{op.description}"
                    </p>

                    {/* Pain points */}
                    {op.painPoints?.length > 0 && (
                        <div>
                            <p style={{ margin: '0 0 6px', fontSize: 10, fontWeight: 700, color: C.slate400, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Pain Points</p>
                            <ul style={{ margin: 0, paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
                                {op.painPoints.map((pt, i) => (
                                    <li key={i} style={{ fontSize: 11, color: C.slate600, lineHeight: 1.5 }}>{pt}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Our solution */}
                    {op.ourSolution && (
                        <div style={{ padding: '10px 12px', borderRadius: 9, background: C.emeraldLight, border: `1px solid ${C.emeraldDark}20` }}>
                            <p style={{ margin: '0 0 4px', fontSize: 10, fontWeight: 700, color: C.emeraldDark, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Our Solution</p>
                            <p style={{ margin: 0, fontSize: 12, color: C.emeraldDark, lineHeight: 1.5 }}>{op.ourSolution}</p>
                            <button
                                onClick={() => copyText(op.ourSolution, 'solution')}
                                style={{ marginTop: 6, padding: '3px 10px', borderRadius: 6, border: `1px solid ${C.emeraldDark}30`, background: 'none', fontSize: 10, fontWeight: 700, color: C.emeraldDark, cursor: 'pointer', fontFamily: 'inherit' }}
                            >
                                {copied === 'solution' ? '✓ Copied' : '📋 Copy'}
                            </button>
                        </div>
                    )}

                    {/* Talking question */}
                    {op.talkingQuestion && (
                        <div style={{ padding: '10px 12px', borderRadius: 9, background: C.indigoLight, border: `1px solid ${C.indigoBorder}` }}>
                            <p style={{ margin: '0 0 4px', fontSize: 10, fontWeight: 700, color: C.indigo, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Open With This Question</p>
                            <p style={{ margin: 0, fontSize: 12, color: C.indigo, lineHeight: 1.5, fontWeight: 600 }}>"{op.talkingQuestion}"</p>
                            <button
                                onClick={() => copyText(op.talkingQuestion, 'question')}
                                style={{ marginTop: 6, padding: '3px 10px', borderRadius: 6, border: `1px solid ${C.indigoBorder}`, background: 'none', fontSize: 10, fontWeight: 700, color: C.indigo, cursor: 'pointer', fontFamily: 'inherit' }}
                            >
                                {copied === 'question' ? '✓ Copied' : '📋 Copy'}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

/* ── TalkingPointsPanel ──────────────────────────────────────────────────────
   Props:
     lead         object  — full lead document
     talkingPoints  array  — from analyzeWebsite response (fresh, not from Mongo)
     pitchSummary   string
     onRefresh    () => void
*/
const TalkingPointsPanel = ({ lead, talkingPoints, pitchSummary, onRefresh }) => {
    const [loading, setLoading] = useState(false)
    const [points, setPoints] = useState(talkingPoints || [])
    const [summary, setSummary] = useState(pitchSummary || '')
    const [copied, setCopied] = useState(false)
    const [error, setError] = useState('')

    // Sync when props change
    React.useEffect(() => {
        if (talkingPoints?.length) setPoints(talkingPoints)
        if (pitchSummary) setSummary(pitchSummary)
    }, [talkingPoints, pitchSummary])

    const handleRefresh = async () => {
        setLoading(true)
        setError('')
        try {
            const { data } = await API.post(`/intelligence/leads/${lead._id}/talking-points`)
            setPoints(data.opportunities || [])
            setSummary(data.pitchSummary || '')
            onRefresh?.()
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to generate talking points')
        } finally { setLoading(false) }
    }

    const copyAll = () => {
        const text = points.map(op =>
            `## ${op.type} (${op.priority})\n${op.description}\n\nQuestion: ${op.talkingQuestion}\nSolution: ${op.ourSolution}`
        ).join('\n\n---\n\n')
        navigator.clipboard.writeText(`PITCH SUMMARY\n${summary}\n\n${text}`)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    if (!points.length && !summary) {
        return (
            <div style={{ padding: '12px 14px', borderRadius: 10, background: C.slate100, fontSize: 12, color: C.slate500, textAlign: 'center' }}>
                Analyze the website first to generate talking points.
            </div>
        )
    }

    return (
        <>
            <style>{ANIM}</style>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: C.slate900 }}>
                            🎯 Talking Points ({points.length})
                        </p>
                        <p style={{ margin: 0, fontSize: 10, color: C.slate400 }}>Click any card to expand</p>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={copyAll} style={{ padding: '6px 12px', borderRadius: 7, border: `1px solid ${C.slate200}`, background: C.white, fontSize: 11, fontWeight: 700, color: copied ? C.emeraldDark : C.slate600, cursor: 'pointer', fontFamily: 'inherit' }}>
                            {copied ? '✓ Copied' : '📋 Copy All'}
                        </button>
                        <button onClick={handleRefresh} disabled={loading} style={{ padding: '6px 12px', borderRadius: 7, border: 'none', background: C.indigo, fontSize: 11, fontWeight: 700, color: C.white, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5 }}>
                            {loading ? <Spinner /> : '↺'} Refresh
                        </button>
                    </div>
                </div>

                {error && (
                    <div style={{ padding: '8px 12px', borderRadius: 8, background: C.redLight, border: `1px solid ${C.redBorder}`, fontSize: 12, color: C.red, fontWeight: 600 }}>{error}</div>
                )}

                {/* Pitch summary */}
                {summary && (
                    <div style={{ padding: '12px 14px', borderRadius: 10, background: C.purpleLight, border: `1px solid ${C.purple}30` }}>
                        <p style={{ margin: '0 0 6px', fontSize: 10, fontWeight: 700, color: C.purple, textTransform: 'uppercase', letterSpacing: '0.06em' }}>📝 Pitch Summary</p>
                        <p style={{ margin: 0, fontSize: 12, color: C.slate700, lineHeight: 1.6 }}>{summary}</p>
                    </div>
                )}

                {/* Talking point cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {points.map((op, i) => (
                        <TalkingPointCard key={op.key || i} op={op} index={i} />
                    ))}
                </div>
            </div>
        </>
    )
}

export default TalkingPointsPanel