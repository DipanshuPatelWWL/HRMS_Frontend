import React, { useState, useEffect } from 'react'
import API from '../../src/services/api'

const C = {
    indigo: '#4f46e5', indigoLight: '#eef2ff', indigoBorder: '#a5b4fc',
    emerald: '#047857', emeraldLight: '#ecfdf5', emeraldBorder: '#6ee7b7',
    red: '#dc2626', redLight: '#fef2f2', redBorder: '#fca5a5',
    amber: '#d97706', amberLight: '#fffbeb', amberBorder: '#fcd34d',
    slate100: '#f1f5f9', slate200: '#e2e8f0', slate300: '#cbd5e1',
    slate400: '#94a3b8', slate500: '#64748b', slate600: '#475569',
    slate700: '#334155', slate800: '#1e293b', slate900: '#0f172a',
    white: '#ffffff',
}

const ANIM = `
@keyframes fadeIn  { from{opacity:0} to{opacity:1} }
@keyframes modalIn { from{transform:translateY(20px);opacity:0} to{transform:translateY(0);opacity:1} }
@keyframes spin    { to{transform:rotate(360deg)} }
`

const Spinner = ({ size = 14, color = '#fff' }) => (
    <span style={{
        width: size, height: size, borderRadius: '50%',
        border: `2px solid ${color}40`,
        borderTopColor: color,
        animation: 'spin 0.7s linear infinite',
        display: 'inline-block', flexShrink: 0,
    }} />
)

const EmailDraftModal = ({ open, lead, onClose, onSaved }) => {
    const [subject, setSubject] = useState('')
    const [body, setBody] = useState('')
    const [generating, setGenerating] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [generated, setGenerated] = useState(false)
    const [generatedBy, setGeneratedBy] = useState('')
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        if (!open || !lead) return
        setError('')
        setGenerated(false)
        setCopied(false)
        if (lead.emailDraft?.subject || lead.emailDraft?.body) {
            setSubject(lead.emailDraft.subject || '')
            setBody(lead.emailDraft.body || '')
            setGenerated(true)
            setGeneratedBy('saved')
        } else {
            setSubject('')
            setBody('')
        }
    }, [open, lead])

    const handleGenerate = async () => {
        setGenerating(true)
        setError('')
        try {
            const { data } = await API.post(`/intelligence/leads/${lead._id}/generate-email`)
            setSubject(data.subject)
            setBody(data.body)
            setGenerated(true)
            setGeneratedBy(data.generatedBy || 'template')
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to generate email')
        } finally {
            setGenerating(false)
        }
    }

    const handleSave = async () => {
        setSaving(true)
        setError('')
        try {
            const { data } = await API.patch(
                `/intelligence/leads/${lead._id}/email-draft`,
                { subject, body }
            )
            onSaved?.(data.lead)
            onClose()
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save draft')
        } finally {
            setSaving(false)
        }
    }

    const handleCopy = () => {
        navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    if (!open || !lead) return null

    return (
        <>
            <style>{ANIM}</style>
            <div onClick={onClose} style={{
                position: 'fixed', inset: 0, zIndex: 90,
                background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(6px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: 16, animation: 'fadeIn 0.18s ease',
            }}>
                <div onClick={e => e.stopPropagation()} style={{
                    background: C.white, borderRadius: 20, width: '100%', maxWidth: 580,
                    maxHeight: '92vh', overflowY: 'auto',
                    boxShadow: '0 32px 80px rgba(15,23,42,0.3)',
                    animation: 'modalIn 0.22s ease',
                }}>
                    {/* Header */}
                    <div style={{
                        padding: '18px 24px 14px', borderBottom: `1px solid ${C.slate200}`,
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        position: 'sticky', top: 0, background: C.white, zIndex: 1,
                        borderRadius: '20px 20px 0 0',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: C.indigoLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>✉</div>
                            <div>
                                <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: C.slate900 }}>Email Draft</p>
                                <p style={{ margin: 0, fontSize: 11, color: C.slate400 }}>
                                    {lead.companyName}
                                    {lead.clientEmail && <span style={{ color: C.emerald }}> · {lead.clientEmail}</span>}
                                </p>
                            </div>
                        </div>
                        <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${C.slate200}`, background: C.white, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 16, color: C.slate500 }}>×</button>
                    </div>

                    <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>

                        {error && (
                            <div style={{ padding: '10px 14px', borderRadius: 9, background: C.redLight, border: `1px solid ${C.redBorder}`, fontSize: 13, color: C.red, fontWeight: 600 }}>
                                {error}
                            </div>
                        )}

                        {/* No draft yet */}
                        {!generated && (
                            <div style={{ padding: 24, borderRadius: 12, background: C.indigoLight, border: `1.5px dashed ${C.indigoBorder}`, textAlign: 'center' }}>
                                <p style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 700, color: C.indigo }}>No draft yet</p>
                                <p style={{ margin: '0 0 16px', fontSize: 12, color: '#6366f1', opacity: 0.8 }}>
                                    AI will write a personalised outreach email for {lead.companyName}
                                </p>
                                <button onClick={handleGenerate} disabled={generating} style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 8,
                                    padding: '10px 22px', borderRadius: 9, border: 'none',
                                    background: C.indigo, color: C.white, fontSize: 13, fontWeight: 700,
                                    cursor: generating ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: generating ? 0.7 : 1,
                                }}>
                                    {generating ? <Spinner /> : '✨'}
                                    {generating ? 'Generating...' : 'Generate with AI'}
                                </button>
                            </div>
                        )}

                        {/* Draft editor */}
                        {generated && (
                            <>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 5,
                                        padding: '3px 10px', borderRadius: 20,
                                        background: generatedBy === 'claude-ai' ? C.indigoLight : C.slate100,
                                        color: generatedBy === 'claude-ai' ? C.indigo : C.slate500,
                                        fontSize: 11, fontWeight: 700,
                                        border: `1px solid ${generatedBy === 'claude-ai' ? C.indigoBorder : C.slate200}`,
                                    }}>
                                        {generatedBy === 'claude-ai' ? '✨ AI generated' : generatedBy === 'template' ? '📝 Template' : '💾 Saved draft'}
                                    </span>
                                    <button onClick={handleGenerate} disabled={generating} style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 5,
                                        padding: '5px 12px', borderRadius: 7, border: `1px solid ${C.slate200}`,
                                        background: C.white, fontSize: 11, fontWeight: 600, color: C.slate600,
                                        cursor: generating ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                                    }}>
                                        {generating ? <Spinner size={10} color={C.slate600} /> : '↺'}
                                        {generating ? 'Generating...' : 'Regenerate'}
                                    </button>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: C.slate500, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Subject Line</label>
                                    <input type="text" value={subject} onChange={e => setSubject(e.target.value)} style={{
                                        width: '100%', padding: '9px 12px', borderRadius: 8, boxSizing: 'border-box',
                                        border: `1.5px solid ${C.slate300}`, fontSize: 13, fontWeight: 600,
                                        color: C.slate800, fontFamily: 'inherit', outline: 'none', transition: 'border-color 0.2s',
                                    }}
                                        onFocus={e => e.target.style.borderColor = C.indigo}
                                        onBlur={e => e.target.style.borderColor = C.slate300}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: C.slate500, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Email Body</label>
                                    <textarea value={body} onChange={e => setBody(e.target.value)} rows={12} style={{
                                        width: '100%', padding: '10px 12px', borderRadius: 8, boxSizing: 'border-box',
                                        border: `1.5px solid ${C.slate300}`, fontSize: 13, color: C.slate800,
                                        fontFamily: 'inherit', outline: 'none', resize: 'vertical', lineHeight: 1.6,
                                        transition: 'border-color 0.2s',
                                    }}
                                        onFocus={e => e.target.style.borderColor = C.indigo}
                                        onBlur={e => e.target.style.borderColor = C.slate300}
                                    />
                                    <p style={{ margin: '4px 0 0', fontSize: 11, color: C.slate400 }}>
                                        {body.split(/\s+/).filter(Boolean).length} words · You can edit before saving
                                    </p>
                                </div>

                                {!lead.clientEmail && (
                                    <div style={{ padding: '10px 14px', borderRadius: 9, background: C.amberLight, border: `1px solid ${C.amberBorder}`, fontSize: 12, color: C.amber, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                                        ⚠ No email address found for this lead yet. Save draft and add manually.
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Footer */}
                    {generated && (
                        <div style={{ padding: '0 24px 22px', display: 'flex', gap: 8, borderTop: `1px solid ${C.slate100}`, paddingTop: 14 }}>
                            <button onClick={handleCopy} style={{
                                flex: 1, padding: '10px 0', borderRadius: 9, border: `1px solid ${C.slate200}`, background: C.white,
                                fontSize: 13, fontWeight: 600, color: copied ? C.emerald : C.slate600,
                                cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
                            }}>
                                {copied ? '✓ Copied!' : '📋 Copy'}
                            </button>
                            <button onClick={onClose} style={{
                                flex: 1, padding: '10px 0', borderRadius: 9, border: `1px solid ${C.slate200}`,
                                background: C.white, fontSize: 13, fontWeight: 600, color: C.slate600,
                                cursor: 'pointer', fontFamily: 'inherit',
                            }}>Cancel</button>
                            <button onClick={handleSave} disabled={saving || !subject.trim() || !body.trim()} style={{
                                flex: 2, padding: '10px 0', borderRadius: 9, border: 'none',
                                background: saving || !subject.trim() ? C.slate300 : C.indigo,
                                fontSize: 13, fontWeight: 700, color: C.white,
                                cursor: saving || !subject.trim() ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                                boxShadow: saving ? 'none' : '0 4px 12px rgba(79,70,229,0.35)',
                            }}>
                                {saving ? <Spinner /> : '💾'}
                                {saving ? 'Saving...' : 'Save Draft'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}

export default EmailDraftModal