import React from 'react'

// Returns color config based on score number or tag string
const getScoreConfig = (score, tag) => {
    const t = tag || (score >= 70 ? 'hot' : score >= 40 ? 'warm' : score > 0 ? 'cold' : 'unscored')
    switch (t) {
        case 'hot': return { bg: '#fef2f2', color: '#b91c1c', border: '#fca5a5', label: '🔥 Hot', dot: '#ef4444' }
        case 'warm': return { bg: '#fffbeb', color: '#b45309', border: '#fcd34d', label: '🌤 Warm', dot: '#f59e0b' }
        case 'cold': return { bg: '#eff6ff', color: '#1d4ed8', border: '#93c5fd', label: '❄️ Cold', dot: '#3b82f6' }
        default: return { bg: '#f8fafc', color: '#64748b', border: '#e2e8f0', label: '— —', dot: '#94a3b8' }
    }
}

// Small pill used inside table rows
export const LeadScoreBadge = ({ score = 0, tag = 'unscored', showScore = true }) => {
    const cfg = getScoreConfig(score, tag)
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '3px 9px', borderRadius: 20,
            background: cfg.bg, color: cfg.color,
            border: `1px solid ${cfg.border}`,
            fontSize: 11, fontWeight: 800, whiteSpace: 'nowrap',
        }}>
            {cfg.label}
            {showScore && score > 0 && (
                <span style={{
                    background: cfg.color, color: '#fff',
                    borderRadius: 10, padding: '1px 5px',
                    fontSize: 10, fontWeight: 900,
                }}>
                    {score}
                </span>
            )}
        </span>
    )
}

export default LeadScoreBadge