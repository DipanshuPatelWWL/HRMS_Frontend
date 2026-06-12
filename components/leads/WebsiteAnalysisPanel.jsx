import React, { useState } from 'react'
import API from '../../src/services/api'
import TalkingPointsPanel from './TalkingPointsPanel'

const C = {
    indigo: '#4f46e5', indigoLight: '#eef2ff', indigoBorder: '#a5b4fc',
    emerald: '#059669', emeraldDark: '#047857', emeraldLight: '#ecfdf5',
    red: '#dc2626', redLight: '#fef2f2', redBorder: '#fca5a5',
    amber: '#d97706', amberLight: '#fffbeb', amberBorder: '#fcd34d',
    blue: '#2563eb', blueLight: '#eff6ff',
    slate100: '#f1f5f9', slate200: '#e2e8f0', slate300: '#cbd5e1',
    slate400: '#94a3b8', slate500: '#64748b', slate600: '#475569',
    slate800: '#1e293b', slate900: '#0f172a',
    white: '#ffffff',
}

const ANIM = `
@keyframes spin { to{transform:rotate(360deg)} }
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
@keyframes slideDown { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
`

const Spinner = () => (
    <span style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid #fff4', borderTopColor: '#fff', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
)

// ── Tech badge ────────────────────────────────────────────────────────────────
const TechBadge = ({ name }) => {
    const colors = {
        'WordPress': { bg: '#f0f9ff', color: '#0369a1' },
        'React': { bg: '#f0fdf4', color: '#166534' },
        'Next.js': { bg: '#fafafa', color: '#111' },
        'Shopify': { bg: '#f0fdf4', color: '#166534' },
        'HubSpot': { bg: '#fff7ed', color: '#c2410c' },
        'Google Analytics': { bg: '#fef9c3', color: '#854d0e' },
        'jQuery': { bg: '#eff6ff', color: '#1d4ed8' },
        'Bootstrap': { bg: '#fdf4ff', color: '#7e22ce' },
        'Tailwind': { bg: '#ecfeff', color: '#0e7490' },
        'Wix': { bg: '#f0f9ff', color: '#0369a1' },
        'Squarespace': { bg: '#fafafa', color: '#111' },
        'Cloudflare': { bg: '#fff7ed', color: '#c2410c' },
    }
    const style = colors[name] || { bg: C.slate100, color: C.slate600 }
    return (
        <span style={{
            padding: '3px 9px', borderRadius: 20,
            background: style.bg, color: style.color,
            fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap',
        }}>
            {name}
        </span>
    )
}

// ── Speed indicator ───────────────────────────────────────────────────────────
const SpeedBar = ({ score, speed }) => {
    const cfg = {
        fast: { color: C.emerald, label: 'Fast', width: '85%' },
        medium: { color: C.amber, label: 'Medium', width: '55%' },
        slow: { color: C.red, label: 'Slow', width: '28%' },
    }[speed] || { color: C.slate400, label: '—', width: '0%' }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: C.slate500, fontWeight: 600 }}>Page Speed</span>
                <span style={{ fontSize: 11, fontWeight: 800, color: cfg.color }}>{cfg.label} {score ? `(~${score})` : ''}</span>
            </div>
            <div style={{ height: 6, borderRadius: 4, background: C.slate200, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: cfg.width, background: cfg.color, borderRadius: 4, transition: 'width 0.6s ease' }} />
            </div>
        </div>
    )
}

// ── Opportunity card ──────────────────────────────────────────────────────────
const OpportunityCard = ({ op }) => {
    const priorityStyle = {
        high: { bg: C.redLight, color: C.red, border: C.redBorder, label: 'High' },
        medium: { bg: C.amberLight, color: C.amber, border: C.amberBorder, label: 'Medium' },
        low: { bg: C.blueLight, color: C.blue, border: '#93c5fd', label: 'Low' },
    }[op.priority] || { bg: C.slate100, color: C.slate500, border: C.slate200, label: 'Low' }

    return (
        <div style={{
            padding: '10px 14px', borderRadius: 10,
            background: priorityStyle.bg,
            border: `1px solid ${priorityStyle.border}`,
            animation: 'slideDown 0.2s ease',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: priorityStyle.color }}>
                    {op.type}
                </p>
                <span style={{
                    padding: '1px 7px', borderRadius: 10, fontSize: 9, fontWeight: 800,
                    background: priorityStyle.color, color: C.white, textTransform: 'uppercase',
                }}>
                    {priorityStyle.label}
                </span>
            </div>
            <p style={{ margin: 0, fontSize: 11, color: C.slate600, lineHeight: 1.5 }}>
                {op.description}
            </p>
        </div>
    )
}

// ── Check row ─────────────────────────────────────────────────────────────────
const CheckRow = ({ label, value, trueLabel = '✅ Yes', falseLabel = '❌ No' }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${C.slate100}` }}>
        <span style={{ fontSize: 12, color: C.slate500, fontWeight: 600 }}>{label}</span>
        <span style={{
            fontSize: 11, fontWeight: 700,
            color: value === true ? C.emeraldDark : value === false ? C.red : C.slate400,
        }}>
            {value === true ? trueLabel : value === false ? falseLabel : '—'}
        </span>
    </div>
)

/* ── WebsiteAnalysisPanel ────────────────────────────────────────────────────
   Props:
     lead         object   — the full lead doc
     onAnalyzed   (updatedLead) => void
*/
const WebsiteAnalysisPanel = ({ lead, onAnalyzed }) => {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [result, setResult] = useState(null)
    const [talkingPoints, setTalkingPoints] = useState([])
    const [pitchSummary, setPitchSummary] = useState('')

    // Use existing cached analysis if available
    const cached = lead?.websiteAnalysis?.lastAnalyzed ? lead.websiteAnalysis : null
    const cachedOpportunities = lead?.opportunities || []
    const display = result || (cached ? { ...cached, opportunities: cachedOpportunities } : null)

    const handleAnalyze = async () => {
        setLoading(true)
        setError('')
        try {
            const { data } = await API.post(`/intelligence/leads/${lead._id}/analyze-website`)
            setResult({
                ...data.websiteAnalysis,
                opportunities: data.opportunities,
                hasSSL: data.raw?.hasSSL,
                estimatedSpeed: data.raw?.estimatedSpeed,
                externalScripts: data.raw?.externalScripts,
            })
            setTalkingPoints(data.talkingPoints || [])
            setPitchSummary(data.pitchSummary || '')
            onAnalyzed?.(data.lead)
        } catch (err) {
            setError(err.response?.data?.message || 'Analysis failed')
        } finally {
            setLoading(false)
        }
    }

    if (!lead?.website) {
        return (
            <div style={{ padding: '12px 16px', borderRadius: 10, background: C.slate100, fontSize: 12, color: C.slate500 }}>
                No website URL for this lead.
            </div>
        )
    }

    return (
        <>
            <style>{ANIM}</style>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: C.slate900 }}>🔍 Website Analysis</p>
                        {display?.lastAnalyzed && (
                            <p style={{ margin: 0, fontSize: 10, color: C.slate400 }}>
                                Last analyzed: {new Date(display.lastAnalyzed).toLocaleDateString()}
                            </p>
                        )}
                    </div>
                    <button
                        onClick={handleAnalyze}
                        disabled={loading}
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            padding: '7px 14px', borderRadius: 8, border: 'none',
                            background: loading ? C.slate300 : C.indigo, color: C.white,
                            fontSize: 11, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                            fontFamily: 'inherit',
                        }}
                    >
                        {loading ? <Spinner /> : '🔍'}
                        {loading ? 'Analyzing...' : display ? 'Re-analyze' : 'Analyze Website'}
                    </button>
                </div>

                {/* Error */}
                {error && (
                    <div style={{ padding: '10px 14px', borderRadius: 9, background: C.redLight, border: `1px solid ${C.redBorder}`, fontSize: 12, color: C.red, fontWeight: 600 }}>
                        {error}
                    </div>
                )}

                {/* Loading skeleton */}
                {loading && !display && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {[100, 80, 90, 70].map((w, i) => (
                            <div key={i} style={{ height: 12, width: `${w}%`, borderRadius: 6, background: C.slate200, animation: 'pulse 1.5s ease infinite' }} />
                        ))}
                    </div>
                )}

                {/* Results */}
                {display && (
                    <>
                        {/* Tech stack */}
                        {display.techStack?.length > 0 && (
                            <div>
                                <p style={{ margin: '0 0 8px', fontSize: 10, fontWeight: 700, color: C.slate400, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Tech Stack</p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                    {display.techStack.map(t => <TechBadge key={t} name={t} />)}
                                </div>
                            </div>
                        )}

                        {/* Checks */}
                        <div>
                            <p style={{ margin: '0 0 4px', fontSize: 10, fontWeight: 700, color: C.slate400, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Checks</p>
                            <CheckRow label="Mobile Responsive" value={display.isMobileResponsive} />
                            <CheckRow label="Contact Form" value={display.hasContactForm} />
                            <CheckRow label="SSL Certificate" value={display.hasSSL} />
                        </div>

                        {/* Speed */}
                        {display.estimatedSpeed && (
                            <SpeedBar score={display.pageSpeedScore} speed={display.estimatedSpeed} />
                        )}

                        {/* Opportunities */}
                        {display.opportunities?.length > 0 && (
                            <div>
                                <p style={{ margin: '0 0 8px', fontSize: 10, fontWeight: 700, color: C.slate400, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                    Sales Opportunities ({display.opportunities.length})
                                </p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    {display.opportunities.map((op, i) => (
                                        <OpportunityCard key={i} op={op} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {display.opportunities?.length === 0 && display.isMobileResponsive !== null && (
                            <div style={{ padding: '10px 14px', borderRadius: 9, background: C.emeraldLight, border: `1px solid ${C.emeraldDark}20`, fontSize: 12, color: C.emeraldDark, fontWeight: 600 }}>
                                ✅ No major issues detected — strong website!
                            </div>
                        )}

                        {/* Talking Points — Day 18 */}
                        {(talkingPoints.length > 0 || pitchSummary) && (
                            <TalkingPointsPanel
                                lead={lead}
                                talkingPoints={talkingPoints}
                                pitchSummary={pitchSummary}
                            />
                        )}
                    </>
                )}
            </div>
        </>
    )
}

export default WebsiteAnalysisPanel