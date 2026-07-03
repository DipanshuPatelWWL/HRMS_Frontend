import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../../services/api";
import DashboardLayout from "../../components/layout/DashboardLayout";

const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";
const fmt12 = (dt) => dt ? new Date(dt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }) : "—";
const fmtHours = (h) => { if (!h) return "—"; const hrs = Math.floor(h); const mins = Math.round((h - hrs) * 60); return `${hrs}h ${mins}m`; };

const initials = (name) => name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?";

const STATUS_COLORS = {
    present: { bg: "#dcfce7", color: "#15803d" },
    "half-day": { bg: "#fef3c7", color: "#92400e" },
    absent: { bg: "#fee2e2", color: "#991b1b" },
    leave: { bg: "#f3e8ff", color: "#6b21a8" },
    "short-leave": { bg: "#dbeafe", color: "#1d4ed8" },
    "missing_punch_out": { bg: "#ffedd5", color: "#9a3412" },
};

const EmployeeHistory = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("attendance");
    const [attPage, setAttPage] = useState(1);
    const PER_PAGE = 30;

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await API.get(`/users/${id}/history`);
                setData(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, [id]);

    if (loading) return <DashboardLayout><p style={{ padding: 24, color: "var(--text-2)" }}>Loading history...</p></DashboardLayout>;
    if (!data) return <DashboardLayout><p style={{ padding: 24, color: "var(--danger)" }}>Employee not found</p></DashboardLayout>;

    const { user, attendance, leaves, summary } = data;

    const pagedAtt = attendance.slice((attPage - 1) * PER_PAGE, attPage * PER_PAGE);
    const totalPages = Math.ceil(attendance.length / PER_PAGE);

    const tabs = ["attendance", "leaves", "summary"];

    return (
        <DashboardLayout>
            <style>{`
                .eh-tab { padding: 7px 18px; border-radius: 8px 8px 0 0; border: none; background: transparent; cursor: pointer; font-size: .82rem; font-weight: 600; color: var(--text-2); border-bottom: 2px solid transparent; transition: all .15s; font-family: 'DM Sans',sans-serif; }
                .eh-tab.active { color: #4f46e5; border-bottom-color: #4f46e5; background: var(--surface); }
                .eh-tab:hover:not(.active) { background: var(--surface-2); color: var(--text-1); }
                .eh-table { width: 100%; border-collapse: collapse; font-size: .82rem; }
                .eh-table th { padding: 10px 14px; background: var(--surface-3); text-align: left; font-size: .68rem; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; color: var(--text-2); border-bottom: 1.5px solid var(--border); }
                .eh-table td { padding: 10px 14px; border-bottom: 1px solid var(--border); color: var(--text-1); vertical-align: middle; }
                .eh-table tbody tr:hover { background: var(--surface-2); }
                .stat-box { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 16px 20px; text-align: center; }
                .stat-box-val { font-size: 2rem; font-weight: 800; color: var(--text-1); line-height: 1; }
                .stat-box-lbl { font-size: .68rem; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; color: var(--text-2); margin-top: 6px; }
            `}</style>
            <div style={{ fontFamily: "'DM Sans', sans-serif", paddingBottom: 40 }}>

                {/* Back */}
                <button
                    onClick={() => navigate(-1)}
                    style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "var(--text-2)", cursor: "pointer", fontWeight: 600, fontSize: ".82rem", marginBottom: 16, padding: 0 }}
                >
                    ← Back
                </button>

                {/* Profile Header */}
                <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24, padding: "16px 20px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14 }}>
                    <div style={{
                        width: 52, height: 52, borderRadius: "50%",
                        background: user.status === "terminated" || user.isDeleted
                            ? "linear-gradient(135deg,#f87171,#dc2626)"
                            : "linear-gradient(135deg,#fbbf24,#f59e0b)",
                        color: "#fff", display: "flex", alignItems: "center",
                        justifyContent: "center", fontWeight: 800, fontSize: ".9rem"
                    }}>
                        {initials(user.name)}
                    </div>
                    <div style={{ flex: 1 }}>
                        <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text-1)", margin: 0 }}>{user.name}</h2>
                        <p style={{ fontSize: ".78rem", color: "var(--text-2)", margin: "2px 0 0", fontFamily: "DM Mono,monospace" }}>
                            {user.employeeId} · {user.department || "—"} · {user.designation || "—"}
                        </p>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <span style={{
                            padding: "4px 10px", borderRadius: 20, fontSize: ".72rem", fontWeight: 700,
                            background: user.status === "active" ? "#dcfce7" : user.status === "terminated" ? "#fee2e2" : "#fef3c7",
                            color: user.status === "active" ? "#15803d" : user.status === "terminated" ? "#991b1b" : "#92400e",
                            textTransform: "capitalize"
                        }}>
                            {user.isDeleted ? "Deleted" : user.status}
                        </span>
                        {user.joiningDate && (
                            <span style={{ padding: "4px 10px", borderRadius: 20, fontSize: ".72rem", fontWeight: 600, background: "var(--surface-2)", color: "var(--text-2)" }}>
                                Joined: {fmtDate(user.joiningDate)}
                            </span>
                        )}
                        {user.deletedAt && (
                            <span style={{ padding: "4px 10px", borderRadius: 20, fontSize: ".72rem", fontWeight: 600, background: "#fee2e2", color: "#991b1b" }}>
                                Removed: {fmtDate(user.deletedAt)}
                            </span>
                        )}
                    </div>
                </div>

                {/* Tabs */}
                <div style={{ display: "flex", borderBottom: "2px solid var(--border)", marginBottom: 20, gap: 2 }}>
                    {tabs.map(t => (
                        <button key={t} className={`eh-tab ${activeTab === t ? "active" : ""}`} onClick={() => setActiveTab(t)}>
                            {t === "attendance" ? "Attendance" : t === "leaves" ? "Leaves" : "Summary"}
                        </button>
                    ))}
                </div>

                {/* Summary Tab */}
                {activeTab === "summary" && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px,1fr))", gap: 12 }}>
                        {[
                            { label: "Total Present", val: summary.totalPresent, color: "#22c55e" },
                            { label: "Half Days", val: summary.totalHalfDay, color: "#f59e0b" },
                            { label: "Late Days", val: summary.totalLate, color: "#ef4444" },
                            { label: "Leaves Taken", val: summary.totalLeaves, color: "#a855f7" },
                            { label: "Total Records", val: attendance.length, color: "#6366f1" },
                        ].map(s => (
                            <div key={s.label} className="stat-box" style={{ borderTop: `3px solid ${s.color}` }}>
                                <div className="stat-box-val" style={{ color: s.color }}>{s.val}</div>
                                <div className="stat-box-lbl">{s.label}</div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Attendance Tab */}
                {activeTab === "attendance" && (
                    <>
                        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
                            <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ fontWeight: 700, fontSize: ".85rem", color: "var(--text-1)" }}>
                                    Attendance Records ({attendance.length} total)
                                </span>
                            </div>
                            <div style={{ overflowX: "auto" }}>
                                <table className="eh-table">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Punch In</th>
                                            <th>Punch Out</th>
                                            <th>Work Hours</th>
                                            <th>Late</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pagedAtt.length === 0 && (
                                            <tr><td colSpan={6} style={{ textAlign: "center", padding: "2rem", color: "var(--text-2)" }}>No records</td></tr>
                                        )}
                                        {pagedAtt.map(att => {
                                            const sc = STATUS_COLORS[att.status] || { bg: "var(--surface-2)", color: "var(--text-2)" };
                                            return (
                                                <tr key={att._id}>
                                                    <td style={{ fontWeight: 600 }}>{fmtDate(att.date)}</td>
                                                    <td style={{ fontFamily: "DM Mono,monospace", fontSize: ".78rem" }}>{fmt12(att.punchIn)}</td>
                                                    <td style={{ fontFamily: "DM Mono,monospace", fontSize: ".78rem" }}>{fmt12(att.punchOut)}</td>
                                                    <td style={{ fontFamily: "DM Mono,monospace", fontSize: ".78rem" }}>{fmtHours(att.workHours)}</td>
                                                    <td>{att.lateMinutes > 0 ? <span style={{ color: "#dc2626", fontWeight: 700, fontSize: ".75rem" }}>{att.lateMinutes}m</span> : "—"}</td>
                                                    <td>
                                                        <span style={{ background: sc.bg, color: sc.color, padding: "2px 8px", borderRadius: 4, fontSize: ".72rem", fontWeight: 700, textTransform: "capitalize" }}>
                                                            {att.isHalfDay ? "Half Day" : att.status?.replace(/-/g, " ")}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            {totalPages > 1 && (
                                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "12px 16px", borderTop: "1px solid var(--border)" }}>
                                    <button disabled={attPage === 1} onClick={() => setAttPage(p => p - 1)} style={{ padding: "5px 12px", borderRadius: 7, border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer", color: "var(--text-1)", fontWeight: 600, fontSize: ".78rem" }}>Prev</button>
                                    <span style={{ fontSize: ".78rem", color: "var(--text-2)", display: "flex", alignItems: "center", fontWeight: 600 }}>{attPage} / {totalPages}</span>
                                    <button disabled={attPage === totalPages} onClick={() => setAttPage(p => p + 1)} style={{ padding: "5px 12px", borderRadius: 7, border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer", color: "var(--text-1)", fontWeight: 600, fontSize: ".78rem" }}>Next</button>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* Leaves Tab */}
                {activeTab === "leaves" && (
                    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
                        <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)" }}>
                            <span style={{ fontWeight: 700, fontSize: ".85rem", color: "var(--text-1)" }}>Leave Records ({leaves.length} total)</span>
                        </div>
                        <div style={{ overflowX: "auto" }}>
                            <table className="eh-table">
                                <thead>
                                    <tr>
                                        <th>Type</th>
                                        <th>From</th>
                                        <th>To</th>
                                        <th>Days</th>
                                        <th>Status</th>
                                        <th>Reason</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {leaves.length === 0 && (
                                        <tr><td colSpan={6} style={{ textAlign: "center", padding: "2rem", color: "var(--text-2)" }}>No leave records</td></tr>
                                    )}
                                    {leaves.map(l => (
                                        <tr key={l._id}>
                                            <td><span style={{ background: "#f3e8ff", color: "#6b21a8", padding: "2px 8px", borderRadius: 4, fontSize: ".72rem", fontWeight: 700, textTransform: "capitalize" }}>{l.leaveType || l.type || "Leave"}</span></td>
                                            <td style={{ fontSize: ".8rem" }}>{fmtDate(l.fromDate)}</td>
                                            <td style={{ fontSize: ".8rem" }}>{fmtDate(l.toDate)}</td>
                                            <td style={{ fontWeight: 700 }}>{l.totalDays || 1}</td>
                                            <td>
                                                <span style={{
                                                    padding: "2px 8px", borderRadius: 4, fontSize: ".72rem", fontWeight: 700,
                                                    background: l.status === "approved" ? "#dcfce7" : l.status === "rejected" ? "#fee2e2" : "#fef3c7",
                                                    color: l.status === "approved" ? "#15803d" : l.status === "rejected" ? "#991b1b" : "#92400e",
                                                    textTransform: "capitalize"
                                                }}>
                                                    {l.status}
                                                </span>
                                            </td>
                                            <td style={{ fontSize: ".78rem", color: "var(--text-2)", maxWidth: 200 }}>{l.reason || "—"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default EmployeeHistory;