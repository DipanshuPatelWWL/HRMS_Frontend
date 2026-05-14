import { useEffect, useState } from "react";
import API from "../../services/api";
import DashboardLayout from "../../components/layout/DashboardLayout";

const statusBadge = (s) => {
    const map = {
        approved: "badge-success",
        rejected: "badge-danger",
        pending: "badge-warn",
    };
    return <span className={`badge ${map[s] || "badge-neutral"}`}>{s}</span>;
};

const Leave = () => {
    const [leaves, setLeaves] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState("");
    const [leaveBalance, setLeaveBalance] = useState(null);
    const [form, setForm] = useState({
        // ✅ FIX: "maternity" removed — only values matching backend enum
        type: "casual",
        fromDate: "",
        toDate: "",
        reason: "",
    });

    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const role = user?.role || "employee";

    const fetchLeaves = async () => {
        try {
            const res = await API.get("/leave/my");
            setLeaves(res.data.leaves || []);
        } catch { /* silent */ }
    };

    // ✅ FIX: Fetch leave balance so employee knows paid/unpaid status before applying
    const fetchLeaveBalance = async () => {
        try {
            const res = await API.get("/auth/me");

            const u = res.data.user || res.data;
            setLeaveBalance(u?.leaveBalance || null);
        } catch { /* silent */ }
    };

    useEffect(() => {
        fetchLeaves();
        fetchLeaveBalance();
    }, []);

    // ✅ Helper: estimate if this leave request would be paid or unpaid
    const estimateLeavePaidStatus = () => {
        if (!form.fromDate || !form.toDate || !leaveBalance) return null;

        const start = new Date(form.fromDate);
        const end = new Date(form.toDate);
        if (start > end) return null;

        // Count working days (rough estimate — weekends excluded)
        let days = 0;
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const day = d.getDay();
            if (day !== 0 && day !== 6) days++;
        }

        if (days === 0) return null;

        const balance = leaveBalance.total || 0;
        const paidDays = Math.min(days, balance);
        const unpaidDays = days - paidDays;

        return { days, paidDays, unpaidDays, balance };
    };

    const leaveEstimate = estimateLeavePaidStatus();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setSuccess("");
        try {
            await API.post("/leave/apply", form);
            setSuccess("Leave request submitted successfully.");
            setForm({ type: "casual", fromDate: "", toDate: "", reason: "" });
            fetchLeaves();
            fetchLeaveBalance(); // refresh balance after applying
        } catch (err) {
            alert(err.response?.data?.message || "Failed to submit leave");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Permanently delete this leave record?")) return;
        try {
            await API.delete(`/leave/${id}`);
            fetchLeaves();
        } catch (err) {
            alert(err.response?.data?.message || "Cannot delete this leave");
        }
    };

    return (
        <DashboardLayout>
            <style>{`
                .leave-grid {
                    display: grid;
                    grid-template-columns: 1fr 1.5fr;
                    gap: 1.25rem;
                    align-items: start;
                }
                .leave-item {
                    border: 1px solid var(--border);
                    border-radius: var(--radius-md);
                    padding: .9rem 1rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    gap: .75rem;
                }
                .leave-item-actions {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-end;
                    gap: .5rem;
                    flex-shrink: 0;
                }

                /* ✅ Balance card */
                .leave-balance-card {
                    background: linear-gradient(135deg, #f0fdf4, #dcfce7);
                    border: 1px solid #86efac;
                    border-radius: var(--radius-md);
                    padding: .85rem 1rem;
                    margin-bottom: 1rem;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: .5rem;
                    flex-wrap: wrap;
                }
                .leave-balance-label {
                    font-size: .78rem;
                    color: #166534;
                    font-weight: 500;
                }
                .leave-balance-count {
                    font-size: 1.4rem;
                    font-weight: 800;
                    color: #166534;
                    line-height: 1;
                }
                .leave-balance-sub {
                    font-size: .72rem;
                    color: #16ae4d;
                    margin-top: 2px;
                }
                .leave-balance-zero {
                    background: linear-gradient(135deg, #fff7ed, #ffedd5);
                    border-color: #fdba74;
                }
                .leave-balance-zero .leave-balance-label,
                .leave-balance-zero .leave-balance-count,
                .leave-balance-zero .leave-balance-sub {
                    color: #9a3412;
                }

                /* ✅ Estimate box */
                .leave-estimate {
                    border-radius: 8px;
                    padding: .6rem .85rem;
                    font-size: .78rem;
                    font-weight: 500;
                    margin-top: -.2rem;
                }
                .leave-estimate.paid {
                    background: #f0fdf4;
                    color: #166534;
                    border: 1px solid #bbf7d0;
                }
                .leave-estimate.partial {
                    background: #fffbeb;
                    color: #92400e;
                    border: 1px solid #fde68a;
                }
                .leave-estimate.unpaid {
                    background: #fef2f2;
                    color: #991b1b;
                    border: 1px solid #fecaca;
                }

                @media (max-width: 768px) {
                    .leave-grid { grid-template-columns: 1fr; }
                }
                @media (max-width: 480px) {
                    .leave-item { flex-direction: column; align-items: stretch; }
                    .leave-item-actions {
                        flex-direction: row;
                        align-items: center;
                        justify-content: space-between;
                        margin-top: .25rem;
                        padding-top: .6rem;
                        border-top: 1px solid var(--border);
                    }
                }
            `}</style>

            <div className="page-header">
                <h1>Leave Management</h1>
                <p>Apply for leave and track your requests</p>
            </div>

            <div className="leave-grid">

                {/* Apply form */}
                <div className="card">
                    <p className="fw-600" style={{ marginBottom: "1.1rem" }}>Apply Leave</p>

                    {/* ✅ FIX: Show leave balance so employee knows if leave will be paid/unpaid */}
                    {leaveBalance !== null && (
                        <div className={`leave-balance-card ${leaveBalance.total === 0 ? "leave-balance-zero" : ""}`}>
                            <div>
                                <div className="leave-balance-label">Casual Leave Balance</div>
                                <div className="leave-balance-sub">Used: {leaveBalance.used || 0} this year</div>
                            </div>
                            <div style={{ textAlign: "right" }}>
                                <div className="leave-balance-count">{leaveBalance.total ?? 0}</div>
                                <div className="leave-balance-label">days available</div>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: ".85rem" }}>
                        <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label">Leave type</label>
                            <select
                                className="input select"
                                value={form.type}
                                onChange={e => setForm({ ...form, type: e.target.value })}
                            >
                                {/* ✅ FIX: Only types matching backend enum: casual/sick/earned/unpaid */}
                                <option value="casual">Casual Leave</option>
                                <option value="sick">Sick Leave</option>
                                <option value="earned">Earned Leave</option>
                                <option value="unpaid">Unpaid Leave</option>
                            </select>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".75rem" }}>
                            <div className="form-group" style={{ margin: 0 }}>
                                <label className="form-label">From date</label>
                                <input
                                    type="date"
                                    className="input"
                                    value={form.fromDate}
                                    onChange={e => setForm({ ...form, fromDate: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group" style={{ margin: 0 }}>
                                <label className="form-label">To date</label>
                                <input
                                    type="date"
                                    className="input"
                                    value={form.toDate}
                                    onChange={e => setForm({ ...form, toDate: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        {/* ✅ FIX: Show estimate of paid vs unpaid days */}
                        {leaveEstimate && (
                            <div className={`leave-estimate ${leaveEstimate.unpaidDays === 0 ? "paid"
                                : leaveEstimate.paidDays === 0 ? "unpaid"
                                    : "partial"
                                }`}>
                                {leaveEstimate.unpaidDays === 0
                                    ? `✅ ${leaveEstimate.days} working day${leaveEstimate.days !== 1 ? "s" : ""} — fully paid (balance: ${leaveEstimate.balance})`
                                    : leaveEstimate.paidDays === 0
                                        ? `⚠️ ${leaveEstimate.days} working day${leaveEstimate.days !== 1 ? "s" : ""} — fully unpaid (no balance)`
                                        : `⚠️ ${leaveEstimate.paidDays} paid + ${leaveEstimate.unpaidDays} unpaid (balance: ${leaveEstimate.balance})`
                                }
                            </div>
                        )}

                        <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label">Reason</label>
                            <input
                                className="input"
                                placeholder="Brief reason..."
                                value={form.reason}
                                onChange={e => setForm({ ...form, reason: e.target.value })}
                                required
                            />
                        </div>

                        {success && (
                            <div style={{
                                background: "var(--success-bg)", color: "var(--success)",
                                borderRadius: "var(--radius-sm)", padding: ".55rem .85rem",
                                fontSize: ".85rem", border: "1px solid #a7f3d0",
                            }}>
                                {success}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={submitting}
                            style={{ justifyContent: "center" }}
                        >
                            {submitting ? "Submitting…" : "Apply"}
                        </button>
                    </form>
                </div>

                {/* Leave list */}
                <div className="card">
                    <p className="fw-600" style={{ marginBottom: "1rem" }}>My Leaves</p>

                    {leaves.length === 0 && (
                        <p style={{ color: "var(--text-3)", fontSize: ".875rem", textAlign: "center", padding: "2rem 0" }}>
                            No leave requests yet
                        </p>
                    )}

                    <div style={{ display: "flex", flexDirection: "column", gap: ".75rem" }}>
                        {leaves.map(l => (
                            <div key={l._id} className="leave-item">
                                <div style={{ minWidth: 0 }}>
                                    <p className="fw-500" style={{ fontSize: ".875rem", textTransform: "capitalize", marginBottom: ".25rem" }}>
                                        {l.type} Leave
                                    </p>
                                    <p style={{ fontSize: ".8rem", color: "var(--text-3)", marginBottom: ".2rem" }}>
                                        {new Date(l.fromDate).toLocaleDateString()} → {new Date(l.toDate).toLocaleDateString()}
                                        &nbsp;·&nbsp;<b>{l.totalDays} day{l.totalDays !== 1 ? "s" : ""}</b>
                                    </p>

                                    {/* ✅ Show paid/unpaid breakdown if available from backend */}
                                    {l.status === "approved" && (l.paidDays !== undefined) && (
                                        <p style={{ fontSize: ".75rem", marginBottom: ".2rem" }}>
                                            <span style={{ color: "#16a34a", fontWeight: 600 }}>
                                                ✅ {l.paidDays} paid
                                            </span>
                                            {l.unpaidDays > 0 && (
                                                <span style={{ color: "#dc2626", fontWeight: 600, marginLeft: ".4rem" }}>
                                                    · ⚠️ {l.unpaidDays} unpaid
                                                </span>
                                            )}
                                        </p>
                                    )}

                                    <p style={{ fontSize: ".78rem", color: "var(--text-3)", wordBreak: "break-word" }}>
                                        Reason: {l.reason}
                                    </p>
                                </div>

                                <div className="leave-item-actions">
                                    {statusBadge(l.status)}


                                    {/* HR/Manager can hard delete */}
                                    {["hr", "manager", "superadmin"].includes(role) && (
                                        <button
                                            onClick={() => handleDelete(l._id)}
                                            className="btn btn-sm"
                                            style={{ color: "#fff", background: "var(--danger)", border: "none" }}
                                        >
                                            Delete
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Leave;