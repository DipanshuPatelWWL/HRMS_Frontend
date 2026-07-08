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
    Timer,
} from "lucide-react";
import API from "../../services/api";
import DashboardLayout from "../../components/layout/DashboardLayout";
import Swal from "sweetalert2";

/* ─── Status badge ──────────────────────────────────────────────── */
const statusBadge = (s) => {
    const map = {
        approved: {
            cls: "badge-success",
            icon: <CheckCircle2 size={11} strokeWidth={2.5} />,
            label: "approved",
        },
        rejected: {
            cls: "badge-danger",
            icon: <XCircle size={11} strokeWidth={2.5} />,
            label: "rejected",
        },
        pending: {
            cls: "badge-warn",
            icon: <Clock size={11} strokeWidth={2.5} />,
            label: "pending",
        },
        "short-leave": {
            cls: "badge-short",
            icon: <Timer size={11} strokeWidth={2.5} />,
            label: "short leave",
        },
    };
    const { cls, icon, label } = map[s] || { cls: "badge-neutral", icon: null, label: s };
    return (
        <span className={`badge ${cls}`} style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
            {icon}
            {label}
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

        // ── Read balance for the selected leave type ──
        const bal = leaveBalance || {};
        let available = 0;
        if (form.type === "casual") {
            available = Math.max(0, (bal.casual?.total ?? bal.total ?? 0) - (bal.casual?.used ?? bal.used ?? 0));
        } else if (form.type === "sick") {
            available = Math.max(0, (bal.sick?.total ?? 0) - (bal.sick?.used ?? 0));
        } else if (form.type === "earned") {
            available = Math.max(0, (bal.earned?.total ?? 0) - (bal.earned?.used ?? 0));
        } else if (form.type === "unpaid") {
            available = 0; // always fully unpaid
        }

        const paidDays = Math.min(days, available);
        const unpaidDays = days - paidDays;
        return { days, paidDays, unpaidDays, balance: available };
    };

    const leaveEstimate = estimateLeavePaidStatus();

    const openPicker = (e) => {
        try {
            e.target.showPicker?.();
        } catch {
            // safe to ignore — falls back to native icon click
        }
    };

    const handleClear = () => {
        setForm({ type: "casual", fromDate: "", toDate: "", reason: "" });
        setSuccess("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Client-side Mon/Fri block for short leave
        if (form.type === "short-leave") {
            const day = new Date().getDay();
            if (day === 1 || day === 5) {
                Swal.fire({
                    icon: "error",
                    title: "Not Allowed",
                    text: "Short leave cannot be applied on Monday or Friday.",
                    confirmButtonColor: "#EF4444",
                });
                return;
            }
        }

        setSubmitting(true);
        setSuccess("");

        // Auto-fill today's date for short leave
        const payload = { ...form };
        if (form.type === "short-leave") {
            const todayStr = new Date().toISOString().split("T")[0];
            payload.fromDate = todayStr;
            payload.toDate = todayStr;
        }

        try {
            await API.post("/leave/apply", payload);
            setSuccess("Leave request submitted successfully.");
            setForm({ type: "casual", fromDate: "", toDate: "", reason: "" });
            fetchLeaves();
            fetchLeaveBalance();
        } catch (err) {
            Swal.fire({
                icon: "error",
                title: "Submission Failed",
                text: err.response?.data?.message || "Failed to submit leave",
                confirmButtonColor: "#EF4444",
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: "Delete Leave Record?",
            text: "This leave record will be permanently deleted and cannot be undone.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, Delete",
            cancelButtonText: "Cancel",
            confirmButtonColor: "#EF4444",
            cancelButtonColor: "#6b7280",
        });

        if (!result.isConfirmed) return;

        try {
            await API.delete(`/leave/${id}`);
            fetchLeaves();
            Swal.fire({
                icon: "success",
                title: "Deleted",
                text: "Leave record has been deleted successfully.",
                confirmButtonColor: "#6366F1",
                timer: 2500,
                timerProgressBar: true,
            });
        } catch (err) {
            Swal.fire({
                icon: "error",
                title: "Delete Failed",
                text: err.response?.data?.message || "Cannot delete this leave",
                confirmButtonColor: "#EF4444",
            });
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
                    border: 1px solid var(--border-strong);
                     background: var(--success-bg);
                }
                .lv-balance.zero {
                  background: var(--warn-bg);
                  border-color: var(--border-strong);
                }
                .lv-balance-label {
                    font-size: .75rem;
                    font-weight: 500;
                   olor: var(--success);
                    display: flex;
                    align-items: center;
                    gap: 5px;
                }
                .lv-balance.zero .lv-balance-label {  color: var(--warn); }
                .lv-balance-num {
                    font-size: 1.5rem;
                    font-weight: 800;
                    line-height: 1;
                   var(--success);
                }
                .lv-balance.zero .lv-balance-num {  color: var(--warn);  }
                .lv-balance-sub {
                    font-size: .72rem;
                  color: var(--success);
                    margin-top: 2px;
                }
                .lv-balance.zero .lv-balance-sub {  color: var(--warn); }

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
                  background: var(--success-bg);
    color: var(--success);
    border: 1px solid var(--border-strong);
                }
                .lv-estimate.partial {
                    background: var(--warn-bg);
    color: var(--warn);
    border: 1px solid var(--border-strong);
                }
                .lv-estimate.unpaid {
                    background: var(--danger-bg);
    color: var(--danger);
    border: 1px solid var(--border-strong);
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
    background: var(--success-bg);
    color: var(--success);
}
.lv-chip.unpaid-chip {
    background: var(--danger-bg);
    color: var(--danger);
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

                /* ── Short leave balance strip ─────────── */
                .lv-sl-strip {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: .75rem;
                    flex-wrap: wrap;
                    border-radius: var(--radius-md);
                    padding: .75rem 1rem;
                    margin-bottom: .9rem;
                border: 1px solid var(--border-strong);
    background: var(--brand-light);
                }
                .lv-sl-strip.zero {
                    background: var(--warn-bg);
    border-color: var(--border-strong);
                }
                .lv-sl-label {
                    font-size: .75rem;
                    font-weight: 600;
                 color: var(--brand);
                    display: flex;
                    align-items: center;
                    gap: 5px;
                }
                .lv-sl-strip.zero .lv-sl-label {  color: var(--warn); }
                .lv-sl-num {
                    font-size: 1.5rem;
                    font-weight: 800;
                    line-height: 1;
                   color: var(--brand)
                }
                .lv-sl-strip.zero .lv-sl-num { color: var(--warn); }

               /* ── Short-leave status chip ───────────── */
                .badge-short {
                    background: var(--brand-light);
    color: var(--brand);
    border: 1px solid var(--border-strong);
                }

                /* ── Clear button ──────────────────────── */
                .lv-clear-btn {
                    color: var(--text-2);
                    border: 1.5px solid var(--border);
                    background: var(--surface);
                    white-space: nowrap;
                    transition: border-color .15s, color .15s, background .15s;
                }
                .lv-clear-btn:not(:disabled):hover {
                    border-color: var(--danger);
                    color: var(--danger);
                    background: var(--danger-bg);
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

                    {/* ── Selected-type dynamic balance card (unchanged) ── */}
                    {(() => {
                        const bal = leaveBalance || {};
                        let typeTotal = 0, typeUsed = 0, typeLabel = "";
                        if (form.type === "casual") {
                            typeTotal = bal.casual?.total ?? 0;
                            typeUsed = bal.casual?.used ?? 0;
                            typeLabel = "Casual Leave Balance";
                        } else if (form.type === "sick") {
                            typeTotal = bal.sick?.total ?? 0;
                            typeUsed = bal.sick?.used ?? 0;
                            typeLabel = "Sick Leave Balance";
                        } else if (form.type === "earned") {
                            typeTotal = bal.earned?.total ?? 0;
                            typeUsed = bal.earned?.used ?? 0;
                            typeLabel = "Earned Leave Balance";
                        } else if (form.type === "short-leave") {
                            const sl = bal.shortLeave || {};
                            const slAvail = sl.available ?? Math.max(0, 1 - (sl.used || 0));
                            const isZero = slAvail === 0;
                            return (
                                <div className={`lv-sl-strip${isZero ? " zero" : ""}`} style={{ marginBottom: "1.1rem" }}>
                                    <div>
                                        <div className="lv-sl-label">
                                            <Timer size={12} strokeWidth={2.2} />
                                            Short Leave Balance
                                        </div>
                                        <div style={{
                                            fontSize: ".72rem",
                                            color: isZero ? "var(--warn)" : "var(--brand)",
                                            marginTop: 2
                                        }}>
                                            Used: {sl.used ?? 0} this month
                                        </div>
                                    </div>
                                    <div style={{ textAlign: "right" }}>
                                        <div className="lv-sl-num">{slAvail}</div>
                                        <div className="lv-sl-label" style={{ justifyContent: "flex-end" }}>
                                            {isZero ? "exhausted" : "available"}
                                        </div>
                                    </div>
                                </div>
                            );
                        } else {
                            return null; // unpaid — no balance to show
                        }
                        const remaining = Math.max(0, typeTotal - typeUsed);
                        return (
                            <div className={`lv-balance${remaining === 0 ? " zero" : ""}`}>
                                <div>
                                    <div className="lv-balance-label">
                                        <Wallet size={12} strokeWidth={2.2} />
                                        {typeLabel}
                                    </div>
                                    <div className="lv-balance-sub">
                                        {form.type === "casual"
                                            ? `Accrued: ${typeTotal} of 12 this year · Used: ${typeUsed}`
                                            : `Used: ${typeUsed} this year`
                                        }
                                    </div>
                                </div>
                                <div style={{ textAlign: "right" }}>
                                    <div className="lv-balance-num">{remaining}</div>
                                    <div className="lv-balance-label">days available</div>
                                </div>
                            </div>
                        );
                    })()}

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
                                <option value="short-leave">Short Leave</option>
                            </select>
                        </div>

                        {/* Date pickers — hidden for short leave (auto-set to today) */}
                        {form.type !== "short-leave" && (() => {
                            const todayStr = new Date().toISOString().split("T")[0];
                            const minToDate = form.fromDate || todayStr;
                            return (
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
                                            min={todayStr}
                                            onChange={e => {
                                                const newFrom = e.target.value;
                                                setForm(prev => ({
                                                    ...prev,
                                                    fromDate: newFrom,
                                                    // Clear toDate if it's now before the new fromDate
                                                    toDate: prev.toDate && prev.toDate < newFrom ? "" : prev.toDate,
                                                }));
                                            }}
                                            onClick={openPicker}
                                            required
                                            style={{ cursor: "pointer" }}
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
                                            min={minToDate}
                                            onChange={e => setForm({ ...form, toDate: e.target.value })}
                                            onClick={openPicker}
                                            required
                                            style={{ cursor: "pointer" }}
                                        />
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Short leave Monday/Friday block warning */}
                        {form.type === "short-leave" && (() => {
                            const today = new Date();
                            const day = today.getDay(); // 0=Sun, 1=Mon, ..., 5=Fri, 6=Sat
                            const isBlocked = day === 1 || day === 5;
                            const dayName = day === 1 ? "Monday" : "Friday";
                            return isBlocked ? (
                                <div style={{
                                    display: "flex",
                                    alignItems: "flex-start",
                                    gap: ".45rem",
                                    background: "var(--danger-bg)",
                                    border: "1px solid var(--border-strong)",
                                    color: "var(--danger)",
                                    borderRadius: 8,
                                    padding: ".65rem .85rem",
                                    fontSize: ".82rem",
                                    fontWeight: 500,
                                }}>
                                    <AlertTriangle size={15} strokeWidth={2.2} style={{ marginTop: 1, flexShrink: 0 }} />
                                    Short leave is not allowed on {dayName}s.
                                </div>
                            ) : (
                                <div style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: ".45rem",
                                    background: "var(--brand-light)",
                                    border: "1px solid var(--border-strong)",
                                    color: "var(--brand)",
                                    borderRadius: 8,
                                    padding: ".65rem .85rem",
                                    fontSize: ".82rem",
                                    fontWeight: 500,
                                }}>
                                    <Info size={15} strokeWidth={2.2} style={{ flexShrink: 0 }} />
                                    Short leave will be applied for today.
                                </div>
                            );
                        })()}

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

                        {(() => {
                            const today = new Date();
                            const day = today.getDay();
                            const isShortLeaveBlocked = form.type === "short-leave" && (day === 1 || day === 5);
                            return (
                                <div style={{ display: "flex", gap: ".6rem" }}>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={submitting || isShortLeaveBlocked}
                                        style={{
                                            flex: 1,
                                            justifyContent: "center",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: ".45rem",
                                            opacity: isShortLeaveBlocked ? 0.5 : 1,
                                            cursor: isShortLeaveBlocked ? "not-allowed" : "pointer",
                                        }}
                                    >
                                        <Send size={14} strokeWidth={2.2} />
                                        {submitting ? "Submitting…" : "Apply"}
                                    </button>

                                    <button
                                        type="button"
                                        className="btn lv-clear-btn"
                                        onClick={handleClear}
                                        disabled={submitting}
                                    >
                                        Clear
                                    </button>
                                </div>
                            );
                        })()}
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
                                            {l.type === "short-leave"
                                                ? <Timer size={13} strokeWidth={2} style={{ opacity: .5 }} />
                                                : <SplitSquareHorizontal size={13} strokeWidth={2} style={{ opacity: .5 }} />
                                            }
                                            {l.type === "short-leave" ? "Short Leave" : `${l.type} Leave`}
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