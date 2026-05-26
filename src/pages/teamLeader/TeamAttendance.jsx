import { useEffect, useState, useContext } from "react";
import API from "../../services/api";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { AuthContext } from "../../context/AuthContext";
import StopwatchLoader from "../../components/common/StopwatchLoader";

// ─────────────────────────────────────────────
//  Constants
// ─────────────────────────────────────────────
const MONTHS = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

const STATUS_CONFIG = {
    punched_in: { label: "Punched In", bg: "#DBEAFE", color: "#1E3A8A", border: "#60A5FA", dot: "#2563EB" },
    punched_out: { label: "Punched Out", bg: "#D1FAE5", color: "#065F46", border: "#6EE7B7", dot: "#059669" },
    absent: { label: "Absent", bg: "#F1F5F9", color: "#475569", border: "#CBD5E1", dot: "#94A3B8" },
    on_leave: { label: "On Leave", bg: "#F3E8FF", color: "#6B21A8", border: "#D8B4FE", dot: "#7C3AED" },
    holiday: { label: "Holiday", bg: "#DBEAFE", color: "#1E3A8A", border: "#60A5FA", dot: "#2563EB" },
    weekend: { label: "Weekend", bg: "#F8FAFC", color: "#94A3B8", border: "#E2E8F0", dot: "#CBD5E1" },
    future: { label: "—", bg: "transparent", color: "#CBD5E1", border: "transparent", dot: "#E2E8F0" },
    not_joined: { label: "—", bg: "transparent", color: "#E2E8F0", border: "transparent", dot: "#F1F5F9" },
};

// ─────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────
const initials = (name) =>
    name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?";

const fmt12 = (dt) => dt
    ? new Date(dt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })
    : "—";

const fmtHours = (h) => {
    if (!h) return "—";
    const hrs = Math.floor(h);
    const mins = Math.round((h - hrs) * 60);
    return `${hrs}h ${mins}m`;
};

// ─────────────────────────────────────────────
//  Status Badge
// ─────────────────────────────────────────────
const StatusBadge = ({ status, small = false }) => {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.absent;
    return (
        <span style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            padding: small ? "2px 8px" : "4px 10px",
            borderRadius: 99, fontSize: small ? ".68rem" : ".73rem",
            fontWeight: 700, background: cfg.bg, color: cfg.color,
            border: `1px solid ${cfg.border}`,
        }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.dot, display: "inline-block", flexShrink: 0 }} />
            {cfg.label}
        </span>
    );
};

// ─────────────────────────────────────────────
//  Mini calendar cell colors
// ─────────────────────────────────────────────
const CELL_COLOR = {
    present: "#22C55E",
    punched_in: "#60A5FA",
    half_day: "#FBBF24",
    late: "#F87171",
    absent: "#CBD5E1",
    on_leave: "#C084FC",
    holiday: "#60A5FA",
    weekend: "#E2E8F0",
    future: "#F1F5F9",
    not_joined: "#F8FAFC",
};

// ─────────────────────────────────────────────
//  Summary Stat Card
// ─────────────────────────────────────────────
const StatCard = ({ label, value, color, sub }) => (
    <div style={{
        background: "#fff", borderRadius: 14, padding: "18px 20px",
        border: "1px solid #E8EBF0", position: "relative", overflow: "hidden",
    }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: color, borderRadius: "14px 14px 0 0" }} />
        <p style={{ fontSize: ".68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".6px", color: "#9CA3AF", marginBottom: 8 }}>{label}</p>
        <p style={{ fontSize: "2rem", fontWeight: 800, color: "#111318", lineHeight: 1, letterSpacing: "-1.5px" }}>{value}</p>
        {sub && <p style={{ fontSize: ".72rem", color: "#9CA3AF", marginTop: 5 }}>{sub}</p>}
    </div>
);

// ─────────────────────────────────────────────
//  Mini Monthly Grid per member
// ─────────────────────────────────────────────
const MiniGrid = ({ days, daysInMonth, firstWeekday }) => (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(7, 1fr)`, gap: 2, marginTop: 6 }}>
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <div key={i} style={{ textAlign: "center", fontSize: ".55rem", fontWeight: 700, color: "#D1D5DB", paddingBottom: 2 }}>{d}</div>
        ))}
        {Array.from({ length: firstWeekday }, (_, i) => (
            <div key={`e${i}`} />
        ))}
        {days.map(({ day, status }) => (
            <div key={day} title={`Day ${day}: ${STATUS_CONFIG[status]?.label || status}`} style={{
                height: 10, borderRadius: 2,
                background: CELL_COLOR[status] || "#F1F5F9",
            }} />
        ))}
    </div>
);

// ─────────────────────────────────────────────
//  Main Component
// ─────────────────────────────────────────────
const TeamAttendance = () => {
    const now = new Date();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [viewMonth, setViewMonth] = useState(now.getMonth() + 1);
    const [viewYear, setViewYear] = useState(now.getFullYear());
    const [tab, setTab] = useState("today"); // "today" | "monthly"
    const [search, setSearch] = useState("");
    const { user } = useContext(AuthContext);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await API.get(`/attendance/team?month=${viewMonth}&year=${viewYear}`);
            setData(res.data);
        } catch (err) {
            console.error("Team attendance fetch failed:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [viewMonth, viewYear]);

    const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
    const firstWeekday = new Date(viewYear, viewMonth - 1, 1).getDay();

    const todayList = (data?.todaySummary || []).filter(e =>
        e.name?.toLowerCase().includes(search.toLowerCase()) ||
        e.employeeId?.toLowerCase().includes(search.toLowerCase())
    );

    const monthlyList = (data?.monthlyGrid || []).filter(e =>
        e.name?.toLowerCase().includes(search.toLowerCase()) ||
        e.employeeId?.toLowerCase().includes(search.toLowerCase())
    );

    // Today counts from TL's team
    const punchedIn = (data?.todaySummary || []).filter(e => e.attendanceStatus === "punched_in").length;
    const punchedOut = (data?.todaySummary || []).filter(e => e.punchOut).length;
    const absent = (data?.todaySummary || []).filter(e => e.attendanceStatus === "absent").length;
    const onLeave = (data?.todaySummary || []).filter(e => e.attendanceStatus === "on_leave").length;
    const missedPO = (data?.todaySummary || []).filter(e => e.missedPunchOut).length;

    return (
        <DashboardLayout>
            <style>{`
                .ta-root { font-family: 'DM Sans', sans-serif; padding-bottom: 40px; }
                .ta-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; }
                .ta-tabs { display: flex; gap: 4px; background: #F1F5F9; border-radius: 10px; padding: 4px; margin-bottom: 20px; width: fit-content; }
                .ta-tab { padding: 7px 18px; border-radius: 7px; border: none; font-family: 'DM Sans',sans-serif; font-size: .82rem; font-weight: 600; cursor: pointer; transition: all .15s; background: transparent; color: #64748B; }
                .ta-tab.active { background: #fff; color: #1E293B; box-shadow: 0 1px 4px rgba(0,0,0,.1); }
                .ta-stats { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-bottom: 20px; }
                @media(max-width: 900px) { .ta-stats { grid-template-columns: repeat(3,1fr); } }
                @media(max-width: 600px) { .ta-stats { grid-template-columns: repeat(2,1fr); } }
                .ta-card { background: #fff; border-radius: 14px; border: 1px solid #E8EBF0; padding: 20px 22px; margin-bottom: 16px; }
                .ta-table { width: 100%; border-collapse: collapse; font-size: .83rem; }
                .ta-table th { text-align: left; padding: 8px 14px; font-size: .67rem; font-weight: 700; text-transform: uppercase; letter-spacing: .6px; color: #9CA3AF; border-bottom: 1.5px solid #F1F5F9; white-space: nowrap; }
                .ta-table td { padding: 12px 14px; border-bottom: 1px solid #F8FAFC; vertical-align: middle; }
                .ta-table tbody tr:hover { background: #FAFBFC; }
                .ta-table tbody tr:last-child td { border-bottom: none; }
                .ta-chip { display: inline-flex; align-items: center; gap: 4px; font-family: 'DM Mono', monospace; font-size: .74rem; background: #F3F4F6; padding: 3px 8px; border-radius: 5px; color: #374151; }
                .ta-search { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 16px; }
                .ta-search input { flex: 1; min-width: 200px; max-width: 320px; padding: 8px 14px; border: 1.5px solid #E2E8F0; border-radius: 9px; font-size: .83rem; font-family: 'DM Sans',sans-serif; outline: none; transition: border-color .15s; }
                .ta-search input:focus { border-color: #6366F1; }
                .ta-nav { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
                .ta-nav-btn { width: 32px; height: 32px; border: 1.5px solid #E2E8F0; border-radius: 8px; background: #FAFAFA; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #374151; font-size: 1rem; transition: all .15s; }
                .ta-nav-btn:hover { background: #F1F5F9; }
                .ta-nav select { border: 1.5px solid #E2E8F0; border-radius: 8px; padding: 5px 10px; font-size: .82rem; font-weight: 600; font-family: 'DM Sans',sans-serif; background: #FAFAFA; outline: none; cursor: pointer; }
                .ta-nav select:focus { border-color: #6366F1; }
                .ta-today-btn { padding: 5px 12px; border-radius: 7px; font-size: .75rem; font-weight: 700; border: 1.5px solid #C7D2FE; background: #EEF2FF; color: #4F46E5; cursor: pointer; font-family: 'DM Sans',sans-serif; transition: all .15s; }
                .ta-today-btn:hover { background: #E0E7FF; }
                .member-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 14px; }
                .member-card { background: #fff; border: 1.5px solid #E8EBF0; border-radius: 14px; padding: 16px 18px; transition: box-shadow .15s; }
                .member-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,.07); }
                .spinner-sm { width: 18px; height: 18px; border: 2px solid #E2E8F0; border-top-color: #6366F1; border-radius: 50%; animation: spin .6s linear infinite; }
                @keyframes spin { to { transform: rotate(360deg); } }
                .empty-box { text-align: center; padding: 3rem 1rem; color: #94A3B8; }
                .missed-banner { background: #FFF7ED; border: 1px solid #FED7AA; border-radius: 10px; padding: 10px 16px; font-size: .8rem; color: #C2410C; font-weight: 600; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
            `}</style>

            <div className="ta-root">
                {/* Header */}
                <div className="ta-header">
                    <div>
                        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#111318", letterSpacing: "-.3px" }}>Team Attendance</h1>
                        <p style={{ fontSize: ".8rem", color: "#94A3B8", marginTop: 4 }}>
                            {now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                        </p>
                    </div>
                    {/* Month/Year nav */}
                    <div className="ta-nav">
                        <button className="ta-nav-btn" onClick={() => viewMonth === 1 ? (setViewMonth(12), setViewYear(y => y - 1)) : setViewMonth(m => m - 1)}>‹</button>
                        <select value={viewMonth} onChange={e => setViewMonth(Number(e.target.value))}>
                            {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                        </select>
                        <select value={viewYear} onChange={e => setViewYear(Number(e.target.value))}>
                            {Array.from({ length: 6 }, (_, i) => now.getFullYear() - 3 + i).map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                        <button className="ta-today-btn" onClick={() => { setViewMonth(now.getMonth() + 1); setViewYear(now.getFullYear()); }}>Today</button>
                        <button className="ta-nav-btn" onClick={() => viewMonth === 12 ? (setViewMonth(1), setViewYear(y => y + 1)) : setViewMonth(m => m + 1)}>›</button>
                    </div>
                </div>

                {/* Stats */}
                <div className="ta-stats">
                    <StatCard label="Team Size" value={data?.teamMembers?.length ?? "—"} color="#6366F1" sub="Total members" />
                    <StatCard label="Punched In" value={loading ? "—" : punchedIn} color="#22C55E" sub="Today" />
                    <StatCard label="Punched Out" value={loading ? "—" : punchedOut} color="#3B82F6" sub="Completed today" />
                    <StatCard label="Absent" value={loading ? "—" : absent} color="#F87171" sub="Today" />
                    <StatCard label="On Leave" value={loading ? "—" : onLeave} color="#A78BFA" sub="Today" />
                </div>

                {/* Missed punch-out banner */}
                {missedPO > 0 && (
                    <div className="missed-banner">
                        ⚠️ {missedPO} team member{missedPO > 1 ? "s" : ""} missed punch-out today
                    </div>
                )}

                {/* Tabs */}
                <div className="ta-tabs">
                    <button className={`ta-tab ${tab === "today" ? "active" : ""}`} onClick={() => setTab("today")}>Today's Status</button>
                    <button className={`ta-tab ${tab === "monthly" ? "active" : ""}`} onClick={() => setTab("monthly")}>Monthly View</button>
                </div>

                {/* Search */}
                <div className="ta-search">
                    <input
                        placeholder="🔍 Search by name or employee ID..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                    <span style={{ fontSize: ".78rem", color: "#94A3B8" }}>
                        {tab === "today" ? todayList.length : monthlyList.length} member{(tab === "today" ? todayList.length : monthlyList.length) !== 1 ? "s" : ""}
                    </span>
                </div>

                {loading && <StopwatchLoader />}

                {!loading && data?.teamMembers?.length === 0 && (
                    <div className="empty-box">
                        <p style={{ fontSize: "2.5rem", marginBottom: 12 }}>👤</p>
                        <p style={{ fontWeight: 700, color: "#475569", marginBottom: 6 }}>No team members assigned</p>
                        <p style={{ fontSize: ".82rem" }}>Ask HR to assign employees to your team.</p>
                    </div>
                )}

                {/* ── TODAY TAB ── */}
                {!loading && tab === "today" && data?.teamMembers?.length > 0 && (
                    <div className="ta-card" style={{ padding: 0, overflow: "hidden" }}>
                        <table className="ta-table">
                            <thead>
                                <tr>
                                    <th style={{ padding: "14px 20px" }}>Employee</th>
                                    <th>Status</th>
                                    <th>Punch In</th>
                                    <th>Punch Out</th>
                                    <th>Work Hrs</th>
                                    <th>Note</th>
                                </tr>
                            </thead>
                            <tbody>
                                {todayList.length === 0 && (
                                    <tr><td colSpan={6} className="empty-box">No results found</td></tr>
                                )}
                                {todayList.map(emp => (
                                    <tr key={emp._id}>
                                        <td style={{ padding: "12px 20px" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                <div style={{
                                                    width: 36, height: 36, borderRadius: "50%",
                                                    background: "linear-gradient(135deg,#667eea,#764ba2)",
                                                    color: "#fff", display: "flex", alignItems: "center",
                                                    justifyContent: "center", fontWeight: 700, fontSize: ".78rem", flexShrink: 0,
                                                }}>{initials(emp.name)}</div>
                                                <div>
                                                    <p style={{ fontWeight: 700, color: "#111318", fontSize: ".85rem", lineHeight: 1.3 }}>{emp.name}</p>
                                                    <p style={{ fontSize: ".72rem", color: "#94A3B8", fontFamily: "DM Mono, monospace" }}>{emp.employeeId}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td><StatusBadge status={emp.attendanceStatus} /></td>
                                        <td>
                                            {emp.punchIn
                                                ? <span className="ta-chip">🟢 {fmt12(emp.punchIn)}{emp.isLate && <span style={{ color: "#DC2626" }}> · +{emp.lateMinutes}m</span>}</span>
                                                : <span style={{ color: "#CBD5E1" }}>—</span>}
                                        </td>
                                        <td>
                                            {emp.punchOut
                                                ? <span className="ta-chip">🔴 {fmt12(emp.punchOut)}</span>
                                                : emp.missedPunchOut
                                                    ? <span style={{ fontSize: ".72rem", color: "#DC2626", fontWeight: 700 }}>⚠️ Missed</span>
                                                    : <span style={{ color: "#CBD5E1" }}>—</span>}
                                        </td>
                                        <td style={{ fontFamily: "DM Mono, monospace", fontSize: ".78rem", color: "#4B5563" }}>
                                            {fmtHours(emp.workHours)}
                                        </td>
                                        <td style={{ fontSize: ".72rem", color: "#94A3B8" }}>
                                            {emp.onLeave && <span style={{ background: "#F3E8FF", color: "#7C3AED", padding: "2px 8px", borderRadius: 4, fontWeight: 700 }}>On Leave</span>}
                                            {emp.isHalfDay && !emp.onLeave && <span style={{ background: "#FEF3C7", color: "#D97706", padding: "2px 8px", borderRadius: 4, fontWeight: 700 }}>Half Day</span>}
                                            {emp.isLate && !emp.isHalfDay && !emp.onLeave && <span style={{ background: "#FEE2E2", color: "#DC2626", padding: "2px 8px", borderRadius: 4, fontWeight: 700 }}>Late</span>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* ── MONTHLY TAB ── */}
                {!loading && tab === "monthly" && data?.teamMembers?.length > 0 && (
                    <div className="member-grid">
                        {monthlyList.map(member => {
                            const s = member.stats;
                            return (
                                <div key={member._id} className="member-card">
                                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                                        <div style={{
                                            width: 38, height: 38, borderRadius: "50%",
                                            background: "linear-gradient(135deg,#667eea,#764ba2)",
                                            color: "#fff", display: "flex", alignItems: "center",
                                            justifyContent: "center", fontWeight: 700, fontSize: ".78rem", flexShrink: 0,
                                        }}>{initials(member.name)}</div>
                                        <div>
                                            <p style={{ fontWeight: 700, color: "#111318", fontSize: ".85rem" }}>{member.name}</p>
                                            <p style={{ fontSize: ".7rem", color: "#94A3B8", fontFamily: "DM Mono,monospace" }}>{member.employeeId}</p>
                                        </div>
                                    </div>

                                    {/* Stats row */}
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6, marginBottom: 10 }}>
                                        {[
                                            { label: "Present", value: s.presentDays + s.halfDays, color: "#22C55E" },
                                            { label: "Absent", value: s.absentDays, color: "#F87171" },
                                            { label: "Leave", value: s.leaveDays, color: "#A78BFA" },
                                        ].map(item => (
                                            <div key={item.label} style={{ background: "#F8FAFC", borderRadius: 8, padding: "6px 8px", textAlign: "center" }}>
                                                <p style={{ fontSize: "1rem", fontWeight: 800, color: item.color, lineHeight: 1 }}>{item.value}</p>
                                                <p style={{ fontSize: ".6rem", color: "#94A3B8", marginTop: 2, fontWeight: 600 }}>{item.label}</p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Half/Late chips */}
                                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                                        {s.halfDays > 0 && <span style={{ fontSize: ".65rem", background: "#FEF3C7", color: "#D97706", padding: "2px 7px", borderRadius: 4, fontWeight: 700 }}>½ {s.halfDays} Half Day</span>}
                                        {s.lateDays > 0 && <span style={{ fontSize: ".65rem", background: "#FEE2E2", color: "#DC2626", padding: "2px 7px", borderRadius: 4, fontWeight: 700 }}>⏰ {s.lateDays} Late</span>}
                                    </div>

                                    {/* Mini calendar */}
                                    <MiniGrid days={member.days} daysInMonth={daysInMonth} firstWeekday={firstWeekday} />
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default TeamAttendance;