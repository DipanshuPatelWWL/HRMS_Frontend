import { useState, useEffect, useContext } from "react";
import { sessionAPI } from "../../services/api";
import { AuthContext } from "../../context/AuthContext";

/* ── design tokens (matches Profile.jsx) ── */
const T = {
    accent: "#6c63ff",
    accentLight: "#ede9ff",
    success: "#059669",
    successLight: "#ecfdf5",
    error: "#dc2626",
    errorLight: "#fef2f2",
    warn: "#d97706",
    warnLight: "#fffbeb",
    border: "#e4e1f0",
    bg: "#f5f4f7",
    text: "#111827",
    muted: "#6b7280",
    surface: "#ffffff",
};
const ff = "'Plus Jakarta Sans', sans-serif";

/* ────────────────────────────────────────
   HELPERS
──────────────────────────────────────── */
const timeAgo = (date) => {
    if (!date) return "Unknown";
    const diff = Math.floor((Date.now() - new Date(date)) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
};

const formatDateTime = (date) => {
    if (!date) return "—";
    return new Date(date).toLocaleString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit", hour12: true,
    });
};

/* ────────────────────────────────────────
   DEVICE ICONS
──────────────────────────────────────── */
const DeviceIcon = ({ deviceType, size = 20 }) => {
    const t = (deviceType || "").toLowerCase();
    if (t === "mobile") return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="5" y="2" width="14" height="20" rx="2" />
            <line x1="12" y1="18" x2="12.01" y2="18" />
        </svg>
    );
    if (t === "tablet") return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="2" width="16" height="20" rx="2" />
            <line x1="12" y1="18" x2="12.01" y2="18" />
        </svg>
    );
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
    );
};

/* ────────────────────────────────────────
   SECTION BLOCK (inside detail panel)
──────────────────────────────────────── */
const Section = ({ icon, title, children }) => (
    <div style={{
        background: T.bg, borderRadius: 10,
        border: `1px solid ${T.border}`, overflow: "hidden",
    }}>
        <div style={{
            padding: "9px 14px", background: T.accentLight,
            borderBottom: `1px solid ${T.border}`,
            display: "flex", alignItems: "center", gap: 7,
            fontFamily: ff, fontWeight: 700, fontSize: 11.5,
            color: T.accent, letterSpacing: ".04em", textTransform: "uppercase",
        }}>
            <span style={{ fontSize: 14 }}>{icon}</span> {title}
        </div>
        <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
            {children}
        </div>
    </div>
);

const Row = ({ label, value, mono }) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
        <span style={{ fontFamily: ff, fontSize: 12, color: T.muted, fontWeight: 500, flexShrink: 0 }}>{label}</span>
        <span style={{
            fontFamily: mono ? "monospace" : ff,
            fontSize: mono ? 11 : 12.5, fontWeight: 600,
            color: T.text, textAlign: "right", wordBreak: "break-all",
            maxWidth: "65%",
        }}>{value || "—"}</span>
    </div>
);

/* ────────────────────────────────────────
   DETAIL PANEL (expanded view per session)
──────────────────────────────────────── */
const SessionDetail = ({ session, onLogout, actionLoading, onClose }) => {
    const [showUA, setShowUA] = useState(false);
    const isLoading = actionLoading === session.sessionId;

    const browserLabel = [session.browser, session.browserVersion]
        .filter(Boolean).join(" ") || session.deviceInfo || "—";

    const osLabel = [session.os, session.osVersion]
        .filter(Boolean).join(" ") || "—";

    const deviceLabel = session.deviceType
        ? `${session.deviceType} • ${session.deviceInfo || ""}`
        : session.deviceInfo || "—";

    return (
        <div style={{
            marginTop: 10, borderRadius: 12,
            border: `1.5px solid ${session.isCurrent ? T.accent : T.border}`,
            background: T.surface, overflow: "hidden",
            animation: "fadeUp .2s ease",
        }}>
            {/* Detail header */}
            <div style={{
                padding: "12px 16px",
                background: session.isCurrent
                    ? `linear-gradient(135deg, ${T.accentLight}, #f3f0ff)`
                    : T.bg,
                borderBottom: `1px solid ${T.border}`,
                display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                        width: 36, height: 36, borderRadius: 8,
                        background: session.isCurrent ? T.accentLight : "#f3f4f6",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: session.isCurrent ? T.accent : T.muted,
                    }}>
                        <DeviceIcon deviceType={session.deviceType} size={18} />
                    </div>
                    <div>
                        <div style={{ fontFamily: ff, fontWeight: 700, fontSize: 13.5, color: T.text }}>
                            Session Details
                        </div>
                        {session.isCurrent && (
                            <span style={{
                                fontSize: 10, fontWeight: 700, padding: "1px 8px",
                                borderRadius: 4, background: T.accent, color: "#fff",
                                fontFamily: ff, letterSpacing: ".04em",
                            }}>
                                This device
                            </span>
                        )}
                    </div>
                </div>
                <button onClick={onClose} style={{
                    background: "none", border: "none", cursor: "pointer",
                    color: T.muted, padding: 4, borderRadius: 6,
                    display: "flex", alignItems: "center",
                }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>
            </div>

            <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>

                {/* 🖥 Device */}
                <Section icon="🖥️" title="Device Information">
                    <Row label="Device" value={session.deviceInfo} />
                    <Row label="Browser" value={browserLabel} />
                    <Row label="Operating System" value={osLabel} />
                    <Row label="Device Type" value={deviceLabel} />
                    {session.engine && <Row label="Browser Engine" value={session.engine} />}
                    {session.platform && <Row label="Platform" value={session.platform} />}
                </Section>

                {/* 📍 Login Info */}
                <Section icon="📍" title="Login Information">
                    <Row label="IP Address" value={session.ipAddress} mono />
                    <Row label="Login Method" value="Password" />
                </Section>

                {/* ⏰ Activity */}
                <Section icon="⏰" title="Activity">
                    <Row label="Signed In" value={formatDateTime(session.createdAt)} />
                    <Row label="Last Active" value={`${formatDateTime(session.lastActive)} (${timeAgo(session.lastActive)})`} />
                    <Row label="Session Started" value={timeAgo(session.createdAt)} />
                </Section>

                {/* 🔐 Security */}
                <Section icon="🔐" title="Security">
                    <Row label="Session Status" value="Active" />
                    <Row
                        label="Risk"
                        value={
                            <span style={{
                                display: "inline-flex", alignItems: "center", gap: 4,
                                color: T.success, fontWeight: 700, fontSize: 12,
                            }}>
                                ✅ Safe Login
                            </span>
                        }
                    />
                    {session.isCurrent && (
                        <Row label="Note" value="This is your current active session" />
                    )}
                </Section>

                {/* 🧠 Technical (collapsible) */}
                <div style={{ border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden" }}>
                    <button
                        onClick={() => setShowUA(p => !p)}
                        style={{
                            width: "100%", padding: "9px 14px",
                            background: T.bg, border: "none", cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            fontFamily: ff, fontWeight: 700, fontSize: 11.5,
                            color: T.muted, letterSpacing: ".04em", textTransform: "uppercase",
                        }}
                    >
                        <span>🧠 Technical Information</span>
                        <span style={{
                            transform: showUA ? "rotate(180deg)" : "rotate(0deg)",
                            transition: "transform .2s", display: "inline-block",
                        }}>▾</span>
                    </button>
                    {showUA && (
                        <div style={{
                            padding: "12px 14px", background: T.surface,
                            borderTop: `1px solid ${T.border}`,
                            display: "flex", flexDirection: "column", gap: 8,
                        }}>
                            <Row label="Engine" value={session.engine || "—"} />
                            <Row label="Platform" value={session.platform || "—"} />
                            <div>
                                <div style={{ fontFamily: ff, fontSize: 11, color: T.muted, fontWeight: 600, marginBottom: 5 }}>
                                    User Agent
                                </div>
                                <div style={{
                                    fontFamily: "monospace", fontSize: 10.5,
                                    color: T.text, background: T.bg,
                                    padding: "8px 10px", borderRadius: 7,
                                    border: `1px solid ${T.border}`,
                                    wordBreak: "break-all", lineHeight: 1.6,
                                }}>
                                    {session.userAgent || "—"}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: 8, paddingTop: 4, flexWrap: "wrap" }}>
                    <button
                        onClick={() => onLogout(session.sessionId, session.isCurrent)}
                        disabled={isLoading}
                        style={{
                            flex: 1, padding: "9px 16px",
                            borderRadius: 8, border: "none",
                            background: session.isCurrent ? T.accent : T.error,
                            color: "#fff", fontFamily: ff, fontWeight: 600,
                            fontSize: 12.5, cursor: isLoading ? "not-allowed" : "pointer",
                            opacity: isLoading ? 0.6 : 1,
                            display: "flex", alignItems: "center",
                            justifyContent: "center", gap: 6,
                        }}
                    >
                        {isLoading
                            ? <span style={{ width: 12, height: 12, border: "2px solid rgba(255,255,255,.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin .6s linear infinite", display: "inline-block" }} />
                            : session.isCurrent ? "Logout This Device" : "Logout Session"
                        }
                    </button>
                </div>
            </div>
        </div>
    );
};

/* ────────────────────────────────────────
   MAIN COMPONENT
──────────────────────────────────────── */
const ActiveSessions = () => {
    const { logout } = useContext(AuthContext);
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [error, setError] = useState("");
    const [expandedId, setExpandedId] = useState(null);

    const fetchSessions = async () => {
        try {
            setLoading(true);
            const res = await sessionAPI.getSessions();
            setSessions(res.data.sessions || []);
        } catch {
            setError("Failed to load sessions");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchSessions(); }, []);

    const handleLogoutSession = async (sessionId, isCurrent) => {
        setActionLoading(sessionId);
        try {
            await sessionAPI.logoutSession(sessionId);
            if (isCurrent) { logout(); return; }
            setSessions(prev => prev.filter(s => s.sessionId !== sessionId));
            setExpandedId(null);
        } catch {
            setError("Failed to logout session");
        } finally {
            setActionLoading(null);
        }
    };

    const handleLogoutAll = async (keepCurrent) => {
        setActionLoading("all");
        try {
            await sessionAPI.logoutAll(keepCurrent);
            if (!keepCurrent) { logout(); return; }
            setSessions(prev => prev.filter(s => s.isCurrent));
            setExpandedId(null);
        } catch {
            setError("Failed to logout all sessions");
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) return (
        <div style={{ padding: "2rem", textAlign: "center", color: T.muted, fontFamily: ff }}>
            Loading sessions...
        </div>
    );

    return (
        <div style={{ maxWidth: 620 }}>
            {/* Header */}
            <div style={{
                display: "flex", alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.5rem",
            }}>
                <div>
                    <p style={{ margin: 0, fontSize: 15, fontWeight: 700, fontFamily: ff, color: T.text }}>
                        Active Sessions
                    </p>
                    <p style={{ margin: "2px 0 0", fontSize: 12, color: T.muted, fontFamily: ff }}>
                        {sessions.length} device{sessions.length !== 1 ? "s" : ""} logged in
                        &nbsp;·&nbsp;
                        <span style={{ fontSize: 11.5, color: T.accent, cursor: "default" }}>
                            Click a session to see details
                        </span>
                    </p>
                </div>
                {sessions.length > 1 && (
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button
                            onClick={() => handleLogoutAll(true)}
                            disabled={actionLoading === "all"}
                            style={{
                                fontSize: 12, padding: "6px 13px", borderRadius: 7,
                                border: `1px solid ${T.error}`, background: "transparent",
                                color: T.error, cursor: "pointer", fontWeight: 600,
                                opacity: actionLoading === "all" ? 0.6 : 1, fontFamily: ff,
                            }}
                        >
                            Logout Other Devices
                        </button>
                        <button
                            onClick={() => handleLogoutAll(false)}
                            disabled={actionLoading === "all"}
                            style={{
                                fontSize: 12, padding: "6px 13px", borderRadius: 7,
                                border: "none", background: T.error, color: "#fff",
                                cursor: "pointer", fontWeight: 600,
                                opacity: actionLoading === "all" ? 0.6 : 1, fontFamily: ff,
                            }}
                        >
                            Logout All Devices
                        </button>
                    </div>
                )}
            </div>

            {error && (
                <div style={{
                    background: T.errorLight, color: T.error,
                    borderRadius: 8, padding: "8px 12px",
                    fontSize: 12.5, marginBottom: 12, fontFamily: ff,
                }}>
                    {error}
                </div>
            )}

            {/* Session cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {sessions.map(session => {
                    const isExpanded = expandedId === session.sessionId;
                    return (
                        <div key={session.sessionId}>
                            {/* Session row — clickable */}
                            <div
                                onClick={() => setExpandedId(isExpanded ? null : session.sessionId)}
                                style={{
                                    display: "flex", alignItems: "center", gap: 12,
                                    padding: "12px 14px", borderRadius: isExpanded ? "10px 10px 0 0" : 10,
                                    border: session.isCurrent
                                        ? `1.5px solid ${T.accent}`
                                        : `1px solid ${isExpanded ? T.accent : T.border}`,
                                    background: session.isCurrent
                                        ? `rgba(108,99,255,0.04)`
                                        : isExpanded ? T.accentLight : T.surface,
                                    cursor: "pointer",
                                    transition: "all .15s ease",
                                }}
                            >
                                {/* Icon */}
                                <div style={{
                                    width: 40, height: 40, borderRadius: 8, flexShrink: 0,
                                    background: session.isCurrent ? T.accentLight : T.bg,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    color: session.isCurrent ? T.accent : T.muted,
                                }}>
                                    <DeviceIcon deviceType={session.deviceType} />
                                </div>

                                {/* Info */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                                        <span style={{ fontWeight: 700, fontSize: 13, fontFamily: ff, color: T.text }}>
                                            {session.deviceInfo}
                                        </span>
                                        {session.browser && (
                                            <span style={{ fontSize: 11, color: T.muted, fontFamily: ff }}>
                                                · {session.browser} {session.browserVersion?.split(".")[0]}
                                            </span>
                                        )}
                                        {session.isCurrent && (
                                            <span style={{
                                                fontSize: 10, fontWeight: 700, padding: "1px 7px",
                                                borderRadius: 4, background: T.accent, color: "#fff",
                                                letterSpacing: ".03em", fontFamily: ff,
                                            }}>
                                                This device
                                            </span>
                                        )}
                                    </div>
                                    <div style={{
                                        fontSize: 11.5, color: T.muted, marginTop: 2,
                                        display: "flex", gap: 10, flexWrap: "wrap", fontFamily: ff,
                                    }}>
                                        {session.ipAddress && <span>IP: {session.ipAddress}</span>}
                                        <span>Active {timeAgo(session.lastActive)}</span>
                                        {session.os && <span>{session.os} {session.osVersion}</span>}
                                    </div>
                                </div>

                                {/* Chevron */}
                                <span style={{
                                    color: T.muted, fontSize: 14, flexShrink: 0,
                                    transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                                    transition: "transform .2s", display: "inline-block",
                                }}>
                                    ▾
                                </span>
                            </div>

                            {/* Expanded detail */}
                            {isExpanded && (
                                <SessionDetail
                                    session={session}
                                    onLogout={handleLogoutSession}
                                    actionLoading={actionLoading}
                                    onClose={() => setExpandedId(null)}
                                />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ActiveSessions;