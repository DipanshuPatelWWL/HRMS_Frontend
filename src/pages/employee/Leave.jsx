import { useEffect, useState } from "react";
import {
    CalendarDays,
    CheckCircle2,
    XCircle,
    Clock,
    Trash2,
    Send,
    Wallet,
    AlertTriangle,
    Info,
    ClipboardList,
    SplitSquareHorizontal,
} from "lucide-react";
import API from "../../services/api";
import DashboardLayout from "../../components/layout/DashboardLayout";

/* ─── Status badge ──────────────────────────────────────────────── */
const statusBadge = (s) => {
    const map = {
        approved: {
            cls: "badge-success",
            icon: <CheckCircle2 size={11} strokeWidth={2.5} />,
        },
        rejected: {
            cls: "badge-danger",
            icon: <XCircle size={11} strokeWidth={2.5} />,
        },
        pending: {
            cls: "badge-warn",
            icon: <Clock size={11} strokeWidth={2.5} />,
        },
    };
    const { cls, icon } = map[s] || { cls: "badge-neutral", icon: null };
    return (
        <span className={`badge ${cls}`} style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
            {icon}
            {s}
        </span>
    );
};

/* ─── Component ─────────────────────────────────────────────────── */
const Leave = () => {
    const [leaves, setLeaves] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState("");
    const [leaveBalance, setLeaveBalance] = useState(null);
    const [form, setForm] = useState({
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

    const estimateLeavePaidStatus = () => {
        if (!form.fromDate || !form.toDate || !leaveBalance) return null;
        const start = new Date(form.fromDate);
        const end = new Date(form.toDate);
        if (start > end) return null;

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
            fetchLeaveBalance();
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

    /* ── Estimate pill variant ── */
    const estimateVariant = () => {
        if (!leaveEstimate) return null;
        if (leaveEstimate.unpaidDays === 0) return "paid";
        if (leaveEstimate.paidDays === 0) return "unpaid";
        return "partial";
    };

    const estimateText = () => {
        if (!leaveEstimate) return "";
        const { days, paidDays, unpaidDays, balance } = leaveEstimate;
        const d = (n) => `${n} day${n !== 1 ? "s" : ""}`;
        if (unpaidDays === 0)
            return `${d(days)} — fully paid (balance: ${balance})`;
        if (paidDays === 0)
            return `${d(days)} — fully unpaid (no balance remaining)`;
        return `${d(paidDays)} paid + ${d(unpaidDays)} unpaid (balance: ${balance})`;
    };

    const EstimateIcon = () => {
        if (!leaveEstimate) return null;
        if (leaveEstimate.unpaidDays === 0)
            return <CheckCircle2 size={14} strokeWidth={2.2} />;
        return <AlertTriangle size={14} strokeWidth={2.2} />;
    };

    /* ─────────────────────────────────────────────────────────────── */
    return (
        <DashboardLayout>
            <style>{`
                /* ── Grid layout ───────────────────────── */
                .leave-grid {
                    display: grid;
                    grid-template-columns: 380px 1fr;
                    gap: 1.25rem;
                    align-items: start;
                }
                @media (max-width: 900px) {
                    .leave-grid { grid-template-columns: 1fr; }
                }

                /* ── Balance card ──────────────────────── */
                .lv-balance {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: .75rem;
                    flex-wrap: wrap;
                    border-radius: var(--radius-md);
                    padding: .85rem 1rem;
                    margin-bottom: 1.1rem;
                    border: 1px solid #86efac;
                    background: linear-gradient(135deg, #f0fdf4, #dcfce7);
                }
                .lv-balance.zero {
                    background: linear-gradient(135deg, #fff7ed, #ffedd5);
                    border-color: #fdba74;
                }
                .lv-balance-label {
                    font-size: .75rem;
                    font-weight: 500;
                    color: #166534;
                    display: flex;
                    align-items: center;
                    gap: 5px;
                }
                .lv-balance.zero .lv-balance-label { color: #9a3412; }
                .lv-balance-num {
                    font-size: 1.5rem;
                    font-weight: 800;
                    line-height: 1;
                    color: #166534;
                }
                .lv-balance.zero .lv-balance-num { color: #9a3412; }
                .lv-balance-sub {
                    font-size: .72rem;
                    color: #15803d;
                    margin-top: 2px;
                }
                .lv-balance.zero .lv-balance-sub { color: #c2410c; }

                /* ── Estimate strip ────────────────────── */
                .lv-estimate {
                    display: flex;
                    align-items: center;
                    gap: .45rem;
                    border-radius: 7px;
                    padding: .55rem .8rem;
                    font-size: .78rem;
                    font-weight: 500;
                    line-height: 1.35;
                }
                .lv-estimate.paid {
                    background: #f0fdf4;
                    color: #166534;
                    border: 1px solid #bbf7d0;
                }
                .lv-estimate.partial {
                    background: #fffbeb;
                    color: #92400e;
                    border: 1px solid #fde68a;
                }
                .lv-estimate.unpaid {
                    background: #fef2f2;
                    color: #991b1b;
                    border: 1px solid #fecaca;
                }

                /* ── Date row ──────────────────────────── */
                .lv-date-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: .75rem;
                }
                @media (max-width: 380px) {
                    .lv-date-row { grid-template-columns: 1fr; }
                }

                /* ── Leave list item ───────────────────── */
                .lv-item {
                    border: 1px solid var(--border);
                    border-radius: var(--radius-md);
                    padding: .9rem 1rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    gap: .75rem;
                    transition: box-shadow .15s ease;
                }
                .lv-item:hover {
                    box-shadow: 0 2px 8px rgba(0,0,0,.06);
                }
                .lv-item-meta {
                    min-width: 0;
                    flex: 1;
                }
                .lv-item-actions {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-end;
                    gap: .5rem;
                    flex-shrink: 0;
                }

                /* ── Paid/unpaid inline chips ──────────── */
                .lv-pay-chips {
                    display: flex;
                    align-items: center;
                    gap: .4rem;
                    flex-wrap: wrap;
                    margin: .25rem 0;
                }
                .lv-chip {
                    display: inline-flex;
                    align-items: center;
                    gap: 3px;
                    font-size: .72rem;
                    font-weight: 600;
                    padding: 1px 7px;
                    border-radius: 20px;
                }
                .lv-chip.paid-chip {
                    background: #dcfce7;
                    color: #166534;
                }
                .lv-chip.unpaid-chip {
                    background: #fee2e2;
                    color: #991b1b;
                }

                /* ── Success banner ────────────────────── */
                .lv-success {
                    display: flex;
                    align-items: center;
                    gap: .5rem;
                    background: var(--success-bg, #f0fdf4);
                    color: var(--success, #166534);
                    border-radius: var(--radius-sm);
                    padding: .55rem .85rem;
                    font-size: .85rem;
                    border: 1px solid #a7f3d0;
                }

                /* ── Empty state ───────────────────────── */
                .lv-empty {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: .6rem;
                    padding: 2.5rem 0;
                    color: var(--text-3);
                }
                .lv-empty p {
                    font-size: .875rem;
                    margin: 0;
                }

                /* ── Mobile: flatten item ──────────────── */
                @media (max-width: 480px) {
                    .lv-item {
                        flex-direction: column;
                        align-items: stretch;
                    }
                    .lv-item-actions {
                        flex-direction: row;
                        align-items: center;
                        justify-content: space-between;
                        margin-top: .35rem;
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

                {/* ── Apply form ─────────────────────────────── */}
                <div className="card">
                    <p className="fw-600" style={{ marginBottom: "1.1rem", display: "flex", alignItems: "center", gap: ".45rem" }}>
                        <Send size={15} strokeWidth={2.2} style={{ opacity: .7 }} />
                        Apply Leave
                    </p>

                    {/* Balance card */}
                    {leaveBalance !== null && (
                        <div className={`lv-balance${leaveBalance.total === 0 ? " zero" : ""}`}>
                            <div>
                                <div className="lv-balance-label">
                                    <Wallet size={12} strokeWidth={2.2} />
                                    Casual Leave Balance
                                </div>
                                <div className="lv-balance-sub">Used: {leaveBalance.used || 0} this year</div>
                            </div>
                            <div style={{ textAlign: "right" }}>
                                <div className="lv-balance-num">{leaveBalance.total ?? 0}</div>
                                <div className="lv-balance-label">days available</div>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: ".85rem" }}>
                        {/* Leave type */}
                        <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label">Leave type</label>
                            <select
                                className="input select"
                                value={form.type}
                                onChange={e => setForm({ ...form, type: e.target.value })}
                            >
                                <option value="casual">Casual Leave</option>
                                <option value="sick">Sick Leave</option>
                                <option value="earned">Earned Leave</option>
                                <option value="unpaid">Unpaid Leave</option>
                            </select>
                        </div>

                        {/* Date pickers */}
                        <div className="lv-date-row">
                            <div className="form-group" style={{ margin: 0 }}>
                                <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                                    <CalendarDays size={12} strokeWidth={2.2} />
                                    From date
                                </label>
                                <input
                                    type="date"
                                    className="input"
                                    value={form.fromDate}
                                    onChange={e => setForm({ ...form, fromDate: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group" style={{ margin: 0 }}>
                                <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                                    <CalendarDays size={12} strokeWidth={2.2} />
                                    To date
                                </label>
                                <input
                                    type="date"
                                    className="input"
                                    value={form.toDate}
                                    onChange={e => setForm({ ...form, toDate: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        {/* Paid/unpaid estimate */}
                        {leaveEstimate && (
                            <div className={`lv-estimate ${estimateVariant()}`}>
                                <EstimateIcon />
                                {estimateText()}
                            </div>
                        )}

                        {/* Reason */}
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

                        {/* Success message */}
                        {success && (
                            <div className="lv-success">
                                <CheckCircle2 size={15} strokeWidth={2.2} />
                                {success}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={submitting}
                            style={{ justifyContent: "center", display: "flex", alignItems: "center", gap: ".45rem" }}
                        >
                            <Send size={14} strokeWidth={2.2} />
                            {submitting ? "Submitting…" : "Apply"}
                        </button>
                    </form>
                </div>

                {/* ── Leave list ─────────────────────────────── */}
                <div className="card">
                    <p className="fw-600" style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: ".45rem" }}>
                        <ClipboardList size={15} strokeWidth={2.2} style={{ opacity: .7 }} />
                        My Leaves
                    </p>

                    {leaves.length === 0 ? (
                        <div className="lv-empty">
                            <CalendarDays size={32} strokeWidth={1.5} style={{ opacity: .3 }} />
                            <p>No leave requests yet</p>
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: ".75rem" }}>
                            {leaves.map(l => (
                                <div key={l._id} className="lv-item">
                                    <div className="lv-item-meta">
                                        {/* Type */}
                                        <p className="fw-500" style={{
                                            fontSize: ".875rem",
                                            textTransform: "capitalize",
                                            marginBottom: ".25rem",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: ".35rem",
                                        }}>
                                            <SplitSquareHorizontal size={13} strokeWidth={2} style={{ opacity: .5 }} />
                                            {l.type} Leave
                                        </p>

                                        {/* Dates & day count */}
                                        <p style={{
                                            fontSize: ".8rem",
                                            color: "var(--text-3)",
                                            marginBottom: ".2rem",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: ".3rem",
                                            flexWrap: "wrap",
                                        }}>
                                            <CalendarDays size={12} strokeWidth={2} />
                                            {new Date(l.fromDate).toLocaleDateString()}
                                            {" — "}
                                            {new Date(l.toDate).toLocaleDateString()}
                                            <span style={{
                                                background: "var(--surface-2, #f3f4f6)",
                                                borderRadius: "20px",
                                                padding: "1px 7px",
                                                fontWeight: 600,
                                                fontSize: ".72rem",
                                            }}>
                                                {l.totalDays} day{l.totalDays !== 1 ? "s" : ""}
                                            </span>
                                        </p>

                                        {/* Paid / unpaid chips (from backend) */}
                                        {l.status === "approved" && l.paidDays !== undefined && (
                                            <div className="lv-pay-chips">
                                                <span className="lv-chip paid-chip">
                                                    <CheckCircle2 size={10} strokeWidth={2.5} />
                                                    {l.paidDays} paid
                                                </span>
                                                {l.unpaidDays > 0 && (
                                                    <span className="lv-chip unpaid-chip">
                                                        <AlertTriangle size={10} strokeWidth={2.5} />
                                                        {l.unpaidDays} unpaid
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                        {/* Reason */}
                                        <p style={{
                                            fontSize: ".78rem",
                                            color: "var(--text-3)",
                                            wordBreak: "break-word",
                                            display: "flex",
                                            alignItems: "flex-start",
                                            gap: ".3rem",
                                            marginTop: ".15rem",
                                        }}>
                                            <Info size={12} strokeWidth={2} style={{ marginTop: "1px", flexShrink: 0 }} />
                                            {l.reason}
                                        </p>
                                    </div>

                                    <div className="lv-item-actions">
                                        {statusBadge(l.status)}

                                        {["hr", "manager", "superadmin"].includes(role) && (
                                            <button
                                                onClick={() => handleDelete(l._id)}
                                                className="btn btn-sm"
                                                title="Delete record"
                                                style={{
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    gap: ".35rem",
                                                    color: "#fff",
                                                    background: "var(--danger)",
                                                    border: "none",
                                                }}
                                            >
                                                <Trash2 size={13} strokeWidth={2.2} />
                                                Delete
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Leave;