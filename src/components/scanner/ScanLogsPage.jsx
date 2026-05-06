import { useEffect, useState, useCallback } from "react";
import API from "../../services/api";
import DashboardLayout from "../layout/DashboardLayout";

/* ── design tokens ── */
const T = {
    bg: "#f5f4f7",
    surface: "#ffffff",
    border: "#e4e1f0",
    accent: "#6c63ff",
    accentLight: "#ede9ff",
    success: "#059669",
    successLight: "#ecfdf5",
    error: "#dc2626",
    errorLight: "#fef2f2",
    warn: "#d97706",
    warnLight: "#fffbeb",
    text: "#111827",
    sub: "#374151",
    muted: "#6b7280",
    ff: "'Plus Jakarta Sans', sans-serif",
};

const ROLE_THEME = {
    hr: { bg: "#dbeafe", fg: "#1e3a8a", dot: "#1d4ed8" },
    manager: { bg: "#d1fae5", fg: "#065f46", dot: "#059669" },
    tl: { bg: "#fef3c7", fg: "#92400e", dot: "#d97706" },
    employee: { bg: "#ede9fe", fg: "#4c1d95", dot: "#6d28d9" },
    superadmin: { bg: "#fee2e2", fg: "#7f1d1d", dot: "#dc2626" },
};
const getRoleTheme = (role) => ROLE_THEME[role?.toLowerCase()] ?? ROLE_THEME.employee;

const DEVICE_COLORS = {
    mobile: { bg: "#ede9fe", fg: "#4c1d95" },
    desktop: { bg: "#dbeafe", fg: "#1e3a8a" },
    tablet: { bg: "#d1fae5", fg: "#065f46" },
};
const getDeviceColor = (type) => DEVICE_COLORS[type?.toLowerCase()] ?? { bg: "#f1f5f9", fg: "#475569" };

function initials(name) {
    return (name || "?").split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

function timeAgo(date) {
    const diff = Math.floor((Date.now() - new Date(date)) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function formatDateTime(date) {
    return new Date(date).toLocaleString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
}

/* ── Stat Card ── */
function StatCard({ label, value, icon, color }) {
    return (
        <div style={{
            background: T.surface,
            border: `1px solid ${T.border}`,
            borderRadius: 14,
            padding: "16px 18px",
            display: "flex", alignItems: "center", gap: 14,
        }}>
            <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: color + "22",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 20, flexShrink: 0,
            }}>
                {icon}
            </div>
            <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 2 }}>
                    {label}
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: T.text }}>{value}</div>
            </div>
        </div>
    );
}

/* ── Device Badge ── */
function DeviceBadge({ type }) {
    const c = getDeviceColor(type);
    const icons = { mobile: "📱", desktop: "🖥️", tablet: "📟" };
    return (
        <span style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            background: c.bg, color: c.fg,
            fontSize: 10, fontWeight: 700,
            padding: "3px 9px", borderRadius: 99,
            textTransform: "capitalize",
        }}>
            <span style={{ fontSize: 11 }}>{icons[type?.toLowerCase()] ?? "💻"}</span>
            {type || "unknown"}
        </span>
    );
}

/* ── Detail Row ── */
function DR({ label, value, mono }) {
    if (!value) return null;
    return (
        <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "flex-start",
            gap: 12, padding: "5px 0",
            borderBottom: `1px solid ${T.border}`,
        }}>
            <span style={{ fontSize: 11.5, color: T.muted, fontWeight: 600, flexShrink: 0 }}>{label}</span>
            <span style={{
                fontSize: 11.5, color: T.text, fontWeight: 500,
                textAlign: "right", wordBreak: "break-all",
                fontFamily: mono ? "monospace" : T.ff,
            }}>
                {value}
            </span>
        </div>
    );
}

/* ── Log Row ── */
function LogRow({ log, onDelete }) {
    const [open, setOpen] = useState(false);
    const rt = getRoleTheme(log.role || "employee");
    const dc = getDeviceColor(log.device?.deviceType);

    const locationStr = [log.location?.city, log.location?.region, log.location?.country]
        .filter(Boolean).join(", ") || "Unknown location";

    const mapsLink = log.location?.ll?.length === 2
        ? `https://maps.google.com/?q=${log.location.ll[0]},${log.location.ll[1]}`
        : null;

    return (
        <div style={{
            background: T.surface, borderRadius: 14,
            border: `1px solid ${T.border}`,
            overflow: "hidden",
            transition: "box-shadow .15s",
        }}>
            {/* ── header row ── */}
            <div
                onClick={() => setOpen(o => !o)}
                style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "12px 16px", cursor: "pointer",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "#fafafa"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
                {/* avatar */}
                <div style={{
                    width: 40, height: 40, borderRadius: "50%",
                    background: rt.bg, color: rt.fg,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13, fontWeight: 800, flexShrink: 0,
                }}>
                    {initials(log.employeeName)}
                </div>

                {/* main info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 2 }}>
                        {log.employeeName}
                        <span style={{
                            marginLeft: 8, fontSize: 10, fontWeight: 700,
                            background: rt.bg, color: rt.fg,
                            padding: "2px 8px", borderRadius: 99,
                            fontFamily: "monospace",
                        }}>
                            {log.employeeId}
                        </span>
                    </div>
                    <div style={{
                        fontSize: 12, color: T.muted,
                        display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap",
                    }}>
                        <span>📍 {locationStr}</span>
                        <span style={{ color: T.border }}>·</span>
                        <span>{log.device?.browser || "Unknown browser"} on {log.device?.os || "Unknown OS"}</span>
                    </div>
                </div>

                {/* right side */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 5, flexShrink: 0 }}>
                    <span style={{ fontSize: 11.5, color: T.muted }}>{timeAgo(log.scannedAt)}</span>
                    <DeviceBadge type={log.device?.deviceType} />
                </div>

                {/* chevron */}
                <span style={{
                    fontSize: 12, color: T.muted, marginLeft: 4,
                    transform: open ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform .2s", display: "inline-block",
                }}>▼</span>
            </div>

            {/* ── expanded detail ── */}
            {open && (
                <div style={{
                    borderTop: `1px solid ${T.border}`,
                    padding: "14px 16px",
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 12,
                }}>
                    {/* Location block */}
                    <div style={{
                        background: T.bg, borderRadius: 10,
                        border: `1px solid ${T.border}`, padding: "10px 14px",
                    }}>
                        <div style={{
                            fontSize: 10, fontWeight: 700, color: T.muted,
                            textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 8,
                        }}>
                            📍 Location
                        </div>
                        <DR label="IP Address" value={log.ip} mono />
                        <DR label="Country" value={log.location?.country} />
                        <DR label="Region" value={log.location?.region} />
                        <DR label="City" value={log.location?.city} />
                        <DR label="Timezone" value={log.location?.timezone} />
                        {log.location?.ll?.length === 2 && (
                            <DR label="Coordinates" value={`${log.location.ll[0].toFixed(4)}, ${log.location.ll[1].toFixed(4)}`} mono />
                        )}
                        {mapsLink && (
                            <a
                                href={mapsLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    display: "inline-flex", alignItems: "center", gap: 4,
                                    fontSize: 11, color: "#2563eb", textDecoration: "none",
                                    marginTop: 6, fontWeight: 600,
                                }}
                            >
                                🗺️ Open in Maps
                            </a>
                        )}
                    </div>

                    {/* Device block */}
                    <div style={{
                        background: T.bg, borderRadius: 10,
                        border: `1px solid ${T.border}`, padding: "10px 14px",
                    }}>
                        <div style={{
                            fontSize: 10, fontWeight: 700, color: T.muted,
                            textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 8,
                        }}>
                            💻 Device
                        </div>
                        <DR label="Browser" value={log.device?.browser} />
                        <DR label="Browser Ver." value={log.device?.browserVersion} />
                        <DR label="OS" value={log.device?.os} />
                        <DR label="OS Version" value={log.device?.osVersion} />
                        <DR label="Device Type" value={log.device?.deviceType} />
                        <DR label="Vendor" value={log.device?.deviceVendor} />
                        <DR label="Model" value={log.device?.deviceModel} />
                    </div>

                    {/* Timestamp block */}
                    <div style={{
                        background: T.bg, borderRadius: 10,
                        border: `1px solid ${T.border}`, padding: "10px 14px",
                        gridColumn: "1 / -1",
                        display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10,
                    }}>
                        <div>
                            <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 4 }}>
                                🕐 Scanned At
                            </div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: T.text, fontFamily: "monospace" }}>
                                {formatDateTime(log.scannedAt)}
                            </div>
                        </div>
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(log._id); }}
                            style={{
                                display: "inline-flex", alignItems: "center", gap: 6,
                                background: T.errorLight, color: T.error,
                                border: `1px solid #fecaca`, borderRadius: 8,
                                padding: "6px 14px", fontSize: 12, fontWeight: 700,
                                cursor: "pointer", fontFamily: T.ff,
                            }}
                        >
                            🗑️ Delete Log
                        </button>
                    </div>

                    {/* User Agent */}
                    {log.device?.userAgent && (
                        <div style={{
                            background: T.bg, borderRadius: 10,
                            border: `1px solid ${T.border}`, padding: "10px 14px",
                            gridColumn: "1 / -1",
                        }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 6 }}>
                                User Agent
                            </div>
                            <div style={{
                                fontSize: 11, fontFamily: "monospace",
                                color: T.muted, lineHeight: 1.6, wordBreak: "break-all",
                            }}>
                                {log.device.userAgent}
                            </div>
                        </div>
                    )}
                </div>
            )
            }
        </div >
    );
}

/* ════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════ */
export default function ScanLogsPage() {
    const [logs, setLogs] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState("");
    const [deviceFilter, setDeviceFilter] = useState("");
    const [empFilter, setEmpFilter] = useState("");
    const LIMIT = 20;

    const fetchStats = useCallback(async () => {
        try {
            const res = await API.get("/scan-logs/stats");
            setStats(res.data.stats);
        } catch (_) { }
    }, []);

    const fetchLogs = useCallback(async (p = 1) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: p, limit: LIMIT });
            if (empFilter) params.set("employeeId", empFilter);
            if (deviceFilter) params.set("deviceType", deviceFilter);
            if (search) params.set("search", search);

            const res = await API.get(`/scan-logs?${params}`);
            setLogs(res.data.logs);
            setTotal(res.data.total);
            setTotalPages(res.data.pages);
            setPage(p);
        } catch (_) {
        } finally {
            setLoading(false);
        }
    }, [search, deviceFilter, empFilter]);

    useEffect(() => {
        fetchStats();
        fetchLogs(1);
    }, [fetchLogs, fetchStats]);

    const handleDelete = async (id) => {
        if (!confirm("Delete this scan log?")) return;
        await API.delete(`/scan-logs/${id}`);
        setLogs(l => l.filter(x => x._id !== id));
        setTotal(t => t - 1);
        fetchStats();
    };

    /* ── unique employees for filter dropdown ── */
    const uniqueEmps = [...new Map(logs.map(l => [l.employeeId, { id: l.employeeId, name: l.employeeName }])).values()];

    return (
        <DashboardLayout>
            <div style={{ fontFamily: T.ff, padding: "24px 0" }}>

                {/* ── Header ── */}
                <div style={{ marginBottom: 22 }}>
                    <h1 style={{ fontSize: 20, fontWeight: 800, color: T.text, marginBottom: 4 }}>
                        Scan Logs
                    </h1>
                    <p style={{ fontSize: 13, color: T.muted }}>
                        Every QR / barcode scan of an employee ID card — with full device, location, and browser details.
                    </p>
                </div>

                {/* ── Stats ── */}
                {stats && (
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                        gap: 12, marginBottom: 22,
                    }}>
                        <StatCard label="Total Scans" value={stats.total.toLocaleString()} icon="📊" color="#6c63ff" />
                        <StatCard label="Scans Today" value={stats.scansToday.toLocaleString()} icon="📅" color="#059669" />
                        <StatCard label="Unique Employees" value={stats.uniqueEmployees.toLocaleString()} icon="👤" color="#d97706" />
                        {stats.deviceBreakdown?.[0] && (
                            <StatCard
                                label="Top Device"
                                value={stats.deviceBreakdown[0]._id || "Desktop"}
                                icon="💻"
                                color="#1d4ed8"
                            />
                        )}
                    </div>
                )}

                {/* ── Filters ── */}
                <div style={{
                    display: "flex", gap: 10, flexWrap: "wrap",
                    alignItems: "center", marginBottom: 16,
                }}>
                    <input
                        type="text"
                        placeholder="Search name, ID, city, browser…"
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(1); }}
                        onKeyDown={e => e.key === "Enter" && fetchLogs(1)}
                        style={{
                            flex: 1, minWidth: 200,
                            padding: "8px 12px", borderRadius: 10,
                            border: `1.5px solid ${T.border}`,
                            fontSize: 13, color: T.text,
                            background: T.surface, outline: "none",
                            fontFamily: T.ff,
                        }}
                        onFocus={e => e.target.style.borderColor = T.accent}
                        onBlur={e => e.target.style.borderColor = T.border}
                    />

                    <select
                        value={deviceFilter}
                        onChange={e => { setDeviceFilter(e.target.value); fetchLogs(1); }}
                        style={{
                            padding: "8px 12px", borderRadius: 10,
                            border: `1.5px solid ${T.border}`,
                            fontSize: 13, background: T.surface,
                            color: T.text, cursor: "pointer",
                        }}
                    >
                        <option value="">All devices</option>
                        <option value="mobile">Mobile</option>
                        <option value="desktop">Desktop</option>
                        <option value="tablet">Tablet</option>
                    </select>

                    <select
                        value={empFilter}
                        onChange={e => { setEmpFilter(e.target.value); fetchLogs(1); }}
                        style={{
                            padding: "8px 12px", borderRadius: 10,
                            border: `1.5px solid ${T.border}`,
                            fontSize: 13, background: T.surface,
                            color: T.text, cursor: "pointer",
                            maxWidth: 180,
                        }}
                    >
                        <option value="">All employees</option>
                        {uniqueEmps.map(e => (
                            <option key={e.id} value={e.id}>{e.name} ({e.id})</option>
                        ))}
                    </select>

                    <button
                        onClick={() => { setSearch(""); setDeviceFilter(""); setEmpFilter(""); fetchLogs(1); }}
                        style={{
                            padding: "8px 14px", borderRadius: 10,
                            border: `1.5px solid ${T.border}`,
                            background: T.surface, color: T.muted,
                            fontSize: 13, cursor: "pointer", fontFamily: T.ff,
                        }}
                    >
                        Clear
                    </button>

                    <button
                        onClick={() => fetchLogs(page)}
                        style={{
                            padding: "8px 16px", borderRadius: 10, border: "none",
                            background: T.accent, color: "#fff",
                            fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: T.ff,
                        }}
                    >
                        Search
                    </button>
                </div>

                {/* ── Results count ── */}
                <div style={{ fontSize: 12, color: T.muted, marginBottom: 12 }}>
                    Showing {logs.length} of {total.toLocaleString()} logs
                </div>

                {/* ── Log list ── */}
                {loading ? (
                    <div style={{ textAlign: "center", padding: "40px 0", color: T.muted, fontSize: 14 }}>
                        Loading logs…
                    </div>
                ) : logs.length === 0 ? (
                    <div style={{
                        textAlign: "center", padding: "48px 24px",
                        background: T.surface, borderRadius: 16,
                        border: `1px solid ${T.border}`, color: T.muted, fontSize: 14,
                    }}>
                        🔍 No scan logs found for the selected filters.
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {logs.map(log => (
                            <LogRow key={log._id} log={log} onDelete={handleDelete} />
                        ))}
                    </div>
                )}

                {/* ── Pagination ── */}
                {totalPages > 1 && (
                    <div style={{
                        display: "flex", alignItems: "center", justifyContent: "center",
                        gap: 8, marginTop: 20,
                    }}>
                        <button
                            onClick={() => fetchLogs(page - 1)}
                            disabled={page === 1}
                            style={{
                                padding: "6px 14px", borderRadius: 8,
                                border: `1px solid ${T.border}`,
                                background: T.surface, color: T.text,
                                fontSize: 13, cursor: page === 1 ? "default" : "pointer",
                                opacity: page === 1 ? 0.4 : 1,
                            }}
                        >
                            ← Prev
                        </button>

                        {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                            const p = i + 1;
                            return (
                                <button
                                    key={p}
                                    onClick={() => fetchLogs(p)}
                                    style={{
                                        padding: "6px 12px", borderRadius: 8,
                                        border: `1px solid ${p === page ? T.accent : T.border}`,
                                        background: p === page ? T.accentLight : T.surface,
                                        color: p === page ? T.accent : T.text,
                                        fontSize: 13, fontWeight: p === page ? 700 : 400,
                                        cursor: "pointer",
                                    }}
                                >
                                    {p}
                                </button>
                            );
                        })}

                        <button
                            onClick={() => fetchLogs(page + 1)}
                            disabled={page === totalPages}
                            style={{
                                padding: "6px 14px", borderRadius: 8,
                                border: `1px solid ${T.border}`,
                                background: T.surface, color: T.text,
                                fontSize: 13, cursor: page === totalPages ? "default" : "pointer",
                                opacity: page === totalPages ? 0.4 : 1,
                            }}
                        >
                            Next →
                        </button>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}