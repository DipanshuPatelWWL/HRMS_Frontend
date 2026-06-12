import React from 'react'

const C = {
    indigo: '#4f46e5', indigoLight: '#eef2ff',
    emerald: '#047857', emeraldLight: '#ecfdf5',
    amber: '#d97706', amberLight: '#fffbeb',
    red: '#b91c1c', redLight: '#fef2f2',
    blue: '#1d4ed8', blueLight: '#eff6ff',
    ink50: '#f4f4f8', ink100: '#e8e8f0', ink200: '#c4c4d4',
    ink400: '#6b6b85', ink500: '#44445a', ink600: '#2d2d3a',
    ink800: '#111118', ink900: '#0a0a0f',
    white: '#ffffff',
}

const BREAKDOWN_CONFIG = [
    { key: 'emailFound', label: 'Email Found', max: 35, color: '#059669' },
    { key: 'linkedinActive', label: 'LinkedIn', max: 20, color: '#4f46e5' },
    { key: 'websiteQuality', label: 'Website Quality', max: 20, color: '#d97706' },
    { key: 'companySize', label: 'Country Known', max: 10, color: '#0d9488' },
    { key: 'hiringSignals', label: 'Clean Name', max: 15, color: '#7c3aed' },
]

const TAG_CONFIG = {
    hot: { label: '🔥 Hot', bg: '#fef2f2', color: '#b91c1c', bar: '#ef4444' },
    warm: { label: '🌤 Warm', bg: '#fffbeb', color: '#b45309', bar: '#f59e0b' },
    cold: { label: '❄️ Cold', bg: '#eff6ff', color: '#1d4ed8', bar: '#3b82f6' },
    unscored: { label: '— Unscored', bg: C.ink50, color: C.ink400, bar: C.ink200 },
}

const ScoreBreakdownPanel = ({ lead, onClose }) => {
    if (!lead) return null

    const breakdown = lead.scoreBreakdown || {}
    const tag = TAG_CONFIG[lead.tag] || TAG_CONFIG.unscored
    const totalMax = BREAKDOWN_CONFIG.reduce((s, c) => s + c.max, 0)  // 100

    return (
        <div style={{
            background: C.white, borderRadius: 14,
            border: `1px solid ${C.ink100}`,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            padding: 0, overflow: 'hidden',
        }}>
            {/* Header */}
            <div style={{
                padding: '14px 18px 12px',
                borderBottom: `1px solid ${C.ink100}`,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: tag.bg,
            }}>
                <div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: tag.color }}>
                        Score Breakdown
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: C.ink400 }}>
                        {lead.companyName}
                    </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                        width: 48, height: 48, borderRadius: '50%',
                        background: tag.color, color: C.white,
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        boxShadow: `0 4px 12px ${tag.color}40`,
                    }}>
                        <span style={{ fontSize: 16, fontWeight: 900, lineHeight: 1 }}>{lead.score}</span>
                        <span style={{ fontSize: 9, fontWeight: 600, opacity: 0.8 }}>/ 100</span>
                    </div>
                    {onClose && (
                        <button onClick={onClose} style={{
                            width: 26, height: 26, borderRadius: 7,
                            border: `1px solid ${C.ink200}`, background: C.white,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', fontSize: 14, color: C.ink400,
                        }}>×</button>
                    )}
                </div>
            </div>

            {/* Score bar */}
            <div style={{ padding: '12px 18px 8px' }}>
                <div style={{ height: 6, borderRadius: 6, background: C.ink100, overflow: 'hidden', marginBottom: 12 }}>
                    <div style={{
                        height: '100%', borderRadius: 6,
                        background: `linear-gradient(90deg, ${tag.bar}, ${tag.color})`,
                        width: `${Math.min(lead.score, 100)}%`,
                        transition: 'width 0.6s ease',
                    }} />
                </div>

                {/* Signal bars */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {BREAKDOWN_CONFIG.map(({ key, label, max, color }) => {
                        const value = breakdown[key] || 0
                        const pct = max > 0 ? (value / max) * 100 : 0
                        return (
                            <div key={key}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                                    <span style={{ fontSize: 11, fontWeight: 600, color: C.ink500 }}>{label}</span>
                                    <span style={{ fontSize: 11, fontWeight: 800, color: value > 0 ? color : C.ink400 }}>
                                        {value}/{max}
                                    </span>
                                </div>
                                <div style={{ height: 4, borderRadius: 4, background: C.ink100, overflow: 'hidden' }}>
                                    <div style={{
                                        height: '100%', borderRadius: 4,
                                        background: value > 0 ? color : C.ink200,
                                        width: `${pct}%`,
                                        transition: 'width 0.5s ease',
                                    }} />
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Tag pill */}
                <div style={{ marginTop: 12, textAlign: 'center' }}>
                    <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        padding: '4px 12px', borderRadius: 20,
                        background: tag.bg, color: tag.color,
                        fontSize: 12, fontWeight: 800,
                        border: `1px solid ${tag.color}30`,
                    }}>
                        {tag.label}
                    </span>
                </div>
            </div>
        </div>
    )
}

export default ScoreBreakdownPanel