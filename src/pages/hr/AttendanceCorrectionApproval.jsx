import { useEffect, useState } from "react";
import API from "../../services/api";
import DashboardLayout from "../../components/layout/DashboardLayout";
import StopwatchLoader from "../../components/common/StopwatchLoader";
import Swal from "sweetalert2";

const TYPE_LABELS = {
    punch_in: "Punch In",
    punch_out: "Punch Out",
    both: "Both",
};

const fmtDate = (d) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
const fmtTime = (d) =>
    d ? new Date(d).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: "Asia/Kolkata",
    }) : "—";

const AttendanceCorrectionApproval = () => {
    const [corrections, setCorrections] = useState([]);
    const [filter, setFilter] = useState("pending");
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null); // id of item being actioned
    const [remarkModal, setRemarkModal] = useState(null);     // { id, action }
    const [remark, setRemark] = useState("");
    const [stats, setStats] = useState(null);

    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 10;

    const fetchAll = async () => {
        setLoading(true);
        try {
            const res = await API.get("/attendance-corrections", { params: { status: filter, page, limit } });
            setCorrections(res.data.data || res.data.corrections || []);
            setTotalPages(res.data.totalPages || 1);
            setTotal(res.data.total || 0);
        } catch { /* silent */ }
        finally { setLoading(false); }
    };

    const fetchStats = async () => {
        try {
            const res = await API.get("/attendance-corrections/stats");
            setStats(res.data.stats);
        } catch { /* silent */ }
    };

    useEffect(() => { setPage(1); }, [filter]);
    useEffect(() => { fetchAll(); fetchStats(); }, [filter, page]);

    const submitAction = async (id, action, hrRemark = "") => {
        setActionLoading(id);
        try {
            await API.put(`/attendance-corrections/${id}/review`, { action, hrRemark });
            setRemarkModal(null);
            setRemark("");
            fetchAll();
            fetchStats();
        } catch (err) {
            Swal.fire({
                icon: "error",
                title: "Action Failed",
                text: err.response?.data?.message || "Action failed",
                confirmButtonColor: "#EF4444",
            });
        } finally {
            setActionLoading(null);
        }
    };

    const openReject = (id) => {
        setRemarkModal({ id, action: "rejected" });
        setRemark("");
    };

    return (
        <DashboardLayout>
            <style>{`
                .corr-stat-row {
                    display: flex;
                    gap: 1rem;
                    margin-bottom: 1.25rem;
                    flex-wrap: wrap;
                }
                .corr-stat {
                    flex: 1;
                    min-width: 120px;
                    background: #fff;
                    border: 1px solid var(--border);
                    border-radius: var(--radius-md);
                    padding: .85rem 1rem;
                    text-align: center;
                }
                .corr-stat-value {
                    font-size: 1.6rem;
                    font-weight: 700;
                    line-height: 1;
                    color: var(--text-1);
                }
                .corr-stat-label {
                    font-size: .72rem;
                    color: var(--text-2);
                    margin-top: .3rem;
                    text-transform: uppercase;
                    letter-spacing: .5px;
                }
                .time-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: .4rem .75rem;
                    font-size: .78rem;
                    margin: .4rem 0;
                }
                .time-row { display: flex; gap: .35rem; align-items: center; }
                .time-label { color: var(--text-3); min-width: 70px; }
                .time-chip { font-family: monospace; background: #f3f4f6; padding: 1px 6px; border-radius: 4px; color: var(--text-1); }
                .modal-row { display: flex; flex-direction: column; gap: .6rem; }
            `}</style>

            <div className="page-header">
                <h1>Correction Requests</h1>
                <p>Review and apply employee attendance correction requests</p>
            </div>

            {/* Stats row */}
            {stats && (
                <div className="corr-stat-row">
                    <div className="corr-stat">
                        <div className="corr-stat-value" style={{ color: "#d97706" }}>{stats.pending}</div>
                        <div className="corr-stat-label">Pending</div>
                    </div>
                    <div className="corr-stat">
                        <div className="corr-stat-value" style={{ color: "#16a34a" }}>{stats.approved}</div>
                        <div className="corr-stat-label">Approved</div>
                    </div>
                    <div className="corr-stat">
                        <div className="corr-stat-value" style={{ color: "#dc2626" }}>{stats.rejected}</div>
                        <div className="corr-stat-label">Rejected</div>
                    </div>
                    <div className="corr-stat">
                        <div className="corr-stat-value">{stats.total}</div>
                        <div className="corr-stat-label">Total</div>
                    </div>
                </div>
            )}

            {/* Filter tabs */}
            <div style={{ display: "flex", gap: ".4rem", marginBottom: "1.25rem" }}>
                {["pending", "approved", "rejected"].map(t => (
                    <button
                        key={t}
                        onClick={() => setFilter(t)}
                        className={`btn btn-sm ${filter === t ? "btn-primary" : "btn-ghost"}`}
                        style={{ textTransform: "capitalize" }}
                    >
                        {t}
                    </button>
                ))}
            </div>

            <div className="card">
                {loading && <StopwatchLoader />}

                {!loading && corrections.length === 0 && (
                    <p style={{ color: "var(--text-3)", fontSize: ".875rem", textAlign: "center", padding: "2rem 0" }}>
                        No {filter} correction requests
                    </p>
                )}

                {!loading && corrections.length > 0 && (
                    <div className="table-wrap">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Employee</th>
                                    <th>Date</th>
                                    <th>Type</th>
                                    <th>Requested times</th>
                                    <th>Reason</th>
                                    <th>Status</th>
                                    {filter === "pending" && <th>Action</th>}
                                    {filter !== "pending" && <th>By / Remark</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {corrections.map(c => (
                                    <tr key={c._id}>
                                        <td>
                                            <p style={{ fontWeight: 600, fontSize: ".875rem", color: "var(--text-1)" }}>
                                                {c.user?.name || c.userName || "—"}
                                            </p>
                                            <p style={{ fontSize: ".75rem", color: "var(--text-3)" }}>
                                                {c.user?.employeeId || c.employeeId}
                                            </p>
                                        </td>
                                        <td style={{ whiteSpace: "nowrap" }}>{fmtDate(c.date)}</td>
                                        <td style={{ whiteSpace: "nowrap", textTransform: "capitalize" }}>
                                            {TYPE_LABELS[c.type]}
                                        </td>
                                        <td>
                                            <div className="time-grid">
                                                {c.requestedPunchIn && (
                                                    <div className="time-row">
                                                        <span className="time-label">Punch in:</span>
                                                        <span className="time-chip">{fmtTime(c.requestedPunchIn)}</span>
                                                    </div>
                                                )}
                                                {c.requestedPunchOut && (
                                                    <div className="time-row">
                                                        <span className="time-label">Punch out:</span>
                                                        <span className="time-chip">{fmtTime(c.requestedPunchOut)}</span>
                                                    </div>
                                                )}
                                                {c.status === "approved" && (
                                                    <>
                                                        <div className="time-row" style={{ color: "var(--text-3)", fontSize: ".73rem" }}>
                                                            <span className="time-label">Was in:</span>
                                                            <span>{fmtTime(c.originalPunchIn)}</span>
                                                        </div>
                                                        <div className="time-row" style={{ color: "var(--text-3)", fontSize: ".73rem" }}>
                                                            <span className="time-label">Was out:</span>
                                                            <span>{fmtTime(c.originalPunchOut)}</span>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                        <td style={{ maxWidth: 180, wordBreak: "break-word", fontSize: ".82rem" }}>
                                            {c.reason}
                                        </td>
                                        <td>
                                            <span className={`badge ${c.status === "approved" ? "badge-success" : c.status === "rejected" ? "badge-danger" : "badge-warn"}`}>
                                                {c.status}
                                            </span>
                                        </td>

                                        {filter === "pending" && (
                                            <td>
                                                <div style={{ display: "flex", gap: ".4rem" }}>
                                                    <button
                                                        className="btn btn-success btn-sm"
                                                        disabled={actionLoading === c._id}
                                                        onClick={() => submitAction(c._id, "approved")}
                                                    >
                                                        {actionLoading === c._id ? "…" : "Approve"}
                                                    </button>
                                                    <button
                                                        className="btn btn-sm"
                                                        style={{ background: "var(--danger-bg)", color: "var(--danger)", border: "1px solid #fecaca" }}
                                                        disabled={actionLoading === c._id}
                                                        onClick={() => openReject(c._id)}
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                            </td>
                                        )}

                                        {filter !== "pending" && (
                                            <td style={{ fontSize: ".78rem" }}>
                                                {c.actionBy?.name && (
                                                    <p style={{ color: "var(--text-1)" }}>{c.actionBy.name}</p>
                                                )}
                                                {c.hrRemark && (
                                                    <p style={{ color: "var(--text-3)", fontStyle: "italic" }}>{c.hrRemark}</p>
                                                )}
                                                {c.actionDate && (
                                                    <p style={{ color: "var(--text-3)" }}>{fmtDate(c.actionDate)}</p>
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                {!loading && total > limit && (
                    <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", padding: "16px", gap: "10px", borderTop: "1px solid var(--border)" }}>
                        <span style={{ fontSize: ".75rem", color: "var(--text-2)", fontWeight: 600 }}>
                            Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total}
                        </span>
                        <button
                            className="btn btn-sm btn-ghost"
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                            style={{ border: "1px solid var(--border)" }}
                        >
                            Prev
                        </button>
                        <button
                            className="btn btn-sm btn-ghost"
                            disabled={page === totalPages}
                            onClick={() => setPage(p => p + 1)}
                            style={{ border: "1px solid var(--border)" }}
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>

            {/* ── Reject modal with optional remark ─────────────────────── */}
            {remarkModal && (
                <div
                    onClick={e => e.target === e.currentTarget && setRemarkModal(null)}
                    style={{
                        position: "fixed",
                        inset: 0,
                        background: "rgba(0,0,0,0.55)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 9999,
                        padding: "16px",
                    }}
                >
                    <div className="modal" style={{ maxWidth: 420 }}>
                        <div className="modal-header">
                            <span className="modal-title">Reject correction request</span>
                            <button className="btn btn-ghost btn-icon" onClick={() => setRemarkModal(null)}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M18 6L6 18M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="modal-row">
                            <p style={{ fontSize: ".875rem", color: "var(--text-2)" }}>
                                Optionally add a reason so the employee knows what to do next.
                            </p>
                            <div className="form-group" style={{ margin: 0 }}>
                                <label className="form-label">Remark (optional)</label>
                                <input
                                    className="input"
                                    placeholder="e.g. Times outside shift window, please contact HR"
                                    value={remark}
                                    onChange={e => setRemark(e.target.value)}
                                />
                            </div>
                            <div style={{ display: "flex", gap: ".65rem" }}>
                                <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setRemarkModal(null)}>
                                    Cancel
                                </button>
                                <button
                                    className="btn"
                                    style={{ flex: 1, background: "#dc2626", color: "#fff", border: "none" }}
                                    disabled={actionLoading === remarkModal.id}
                                    onClick={() => submitAction(remarkModal.id, "rejected", remark)}
                                >
                                    {actionLoading === remarkModal.id ? "Rejecting…" : "Confirm Reject"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};

export default AttendanceCorrectionApproval;