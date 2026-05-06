import { useEffect, useState } from "react";
import API from "../../services/api";
import DashboardLayout from "../../components/layout/DashboardLayout";

const TYPE_LABELS = {
    punch_in: "Punch In",
    punch_out: "Punch Out",
    both: "Both (Punch In & Out)",
};

const STATUS_BADGE = {
    pending: { cls: "badge-warn", label: "Pending" },
    approved: { cls: "badge-success", label: "Approved" },
    rejected: { cls: "badge-danger", label: "Rejected" },
};

const fmtDate = (d) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
const fmtTime = (d) => d ? new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—";

const EMPTY_FORM = {
    type: "punch_out",
    date: "",
    requestedPunchIn: "",
    requestedPunchOut: "",
    reason: "",
};

const AttendanceCorrectionRequest = () => {
    const [form, setForm] = useState(EMPTY_FORM);
    const [corrections, setCorrections] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");

    const fetchMine = async () => {
        try {
            const res = await API.get("/attendance-corrections/my");
            setCorrections(res.data.corrections || []);
        } catch { /* silent */ }
    };

    useEffect(() => { fetchMine(); }, []);

    const needsPunchIn = form.type === "punch_in" || form.type === "both";
    const needsPunchOut = form.type === "punch_out" || form.type === "both";

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        setSuccess("");
        setError("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setSuccess("");
        setError("");
        try {
            const payload = {
                type: form.type,
                date: form.date,
                reason: form.reason,
            };
            if (needsPunchIn) payload.requestedPunchIn = `${form.date}T${form.requestedPunchIn}`;
            if (needsPunchOut) payload.requestedPunchOut = `${form.date}T${form.requestedPunchOut}`;

            await API.post("/attendance-corrections", payload);
            setSuccess("Correction request submitted. HR will review it shortly.");
            setForm(EMPTY_FORM);
            fetchMine();
        } catch (err) {
            setError(err.response?.data?.message || "Submission failed");
        } finally {
            setSubmitting(false);
        }
    };

    const handleWithdraw = async (id) => {
        if (!confirm("Withdraw this request?")) return;
        try {
            await API.delete(`/attendance-corrections/${id}`);
            fetchMine();
        } catch (err) {
            alert(err.response?.data?.message || "Could not withdraw");
        }
    };

    return (
        <DashboardLayout>
            <style>{`
                .corr-grid {
                    display: grid;
                    grid-template-columns: 1fr 1.5fr;
                    gap: 1.25rem;
                    align-items: start;
                }
                .corr-item {
                    border: 1px solid var(--border);
                    border-radius: var(--radius-md);
                    padding: .9rem 1rem;
                }
                .corr-item-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    gap: .5rem;
                    margin-bottom: .5rem;
                }
                .corr-times {
                    display: flex;
                    gap: 1rem;
                    flex-wrap: wrap;
                    margin: .4rem 0;
                }
                .time-chip {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    font-family: monospace;
                    font-size: .76rem;
                    background: var(--bg-secondary, #f3f4f6);
                    padding: 2px 8px;
                    border-radius: 5px;
                    color: var(--text-1);
                }
                .corr-remark {
                    font-size: .75rem;
                    color: var(--danger, #dc2626);
                    margin-top: .35rem;
                    font-style: italic;
                }
                .info-banner {
                    background: #f0f9ff;
                    border: 1px solid #bae6fd;
                    border-radius: 8px;
                    padding: 10px 14px;
                    font-size: .8rem;
                    color: #0c4a6e;
                    margin-bottom: 1rem;
                    display: flex;
                    gap: 8px;
                    align-items: flex-start;
                }
                @media (max-width: 768px) {
                    .corr-grid { grid-template-columns: 1fr; }
                }
            `}</style>

            <div className="page-header">
                <h1>Attendance Correction</h1>
                <p>Request a fix for a missing or incorrect punch time</p>
            </div>

            <div className="corr-grid">
                {/* ── Form ─────────────────────────────────────────────── */}
                <div className="card">
                    <p className="fw-600" style={{ marginBottom: "1rem" }}>New Request</p>

                    <div className="info-banner">
                        <span>ℹ️</span>
                        <span>Your request goes to HR for review. Once approved, your attendance record is automatically updated — no manual editing needed.</span>
                    </div>

                    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: ".85rem" }}>
                        <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label">Correction type</label>
                            <select name="type" className="input select" value={form.type} onChange={handleChange}>
                                <option value="punch_in">Punch In — fix/add check-in time</option>
                                <option value="punch_out">Punch Out — fix/add check-out time</option>
                                <option value="both">Both — fix both check-in and check-out</option>
                            </select>
                        </div>

                        <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label">Date <span style={{ color: "var(--danger)" }}>*</span></label>
                            <input
                                type="date"
                                name="date"
                                className="input"
                                value={form.date}
                                max={new Date().toISOString().split("T")[0]}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        {needsPunchIn && (
                            <div className="form-group" style={{ margin: 0 }}>
                                <label className="form-label">Correct punch-in time <span style={{ color: "var(--danger)" }}>*</span></label>
                                <input
                                    type="time"
                                    name="requestedPunchIn"
                                    className="input"
                                    value={form.requestedPunchIn}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        )}

                        {needsPunchOut && (
                            <div className="form-group" style={{ margin: 0 }}>
                                <label className="form-label">Correct punch-out time <span style={{ color: "var(--danger)" }}>*</span></label>
                                <input
                                    type="time"
                                    name="requestedPunchOut"
                                    className="input"
                                    value={form.requestedPunchOut}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        )}

                        <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label">Reason <span style={{ color: "var(--danger)" }}>*</span></label>
                            <input
                                name="reason"
                                className="input"
                                placeholder="e.g. Forgot to punch out"
                                value={form.reason}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        {success && (
                            <div style={{ background: "var(--success-bg)", color: "var(--success)", border: "1px solid #a7f3d0", borderRadius: "var(--radius-sm)", padding: ".55rem .85rem", fontSize: ".85rem" }}>
                                {success}
                            </div>
                        )}

                        {error && (
                            <div style={{ background: "#fee2e2", color: "#991b1b", border: "1px solid #fecaca", borderRadius: "var(--radius-sm)", padding: ".55rem .85rem", fontSize: ".85rem" }}>
                                {error}
                            </div>
                        )}

                        <button type="submit" className="btn btn-primary" disabled={submitting} style={{ justifyContent: "center" }}>
                            {submitting ? "Submitting…" : "Submit Request"}
                        </button>
                    </form>
                </div>

                {/* ── My requests list ─────────────────────────────────── */}
                <div className="card">
                    <p className="fw-600" style={{ marginBottom: "1rem" }}>My Requests</p>

                    {corrections.length === 0 && (
                        <p style={{ color: "var(--text-3)", fontSize: ".875rem", textAlign: "center", padding: "2rem 0" }}>
                            No correction requests yet
                        </p>
                    )}

                    <div style={{ display: "flex", flexDirection: "column", gap: ".75rem" }}>
                        {corrections.map(c => {
                            const badge = STATUS_BADGE[c.status] || STATUS_BADGE.pending;
                            return (
                                <div key={c._id} className="corr-item">
                                    <div className="corr-item-header">
                                        <div>
                                            <p className="fw-500" style={{ fontSize: ".875rem" }}>
                                                {TYPE_LABELS[c.type]} — {fmtDate(c.date)}
                                            </p>
                                            <p style={{ fontSize: ".78rem", color: "var(--text-3)", marginTop: ".1rem" }}>
                                                Raised {fmtDate(c.createdAt)}
                                            </p>
                                        </div>
                                        <span className={`badge ${badge.cls}`}>{badge.label}</span>
                                    </div>

                                    <div className="corr-times">
                                        {c.requestedPunchIn && (
                                            <span className="time-chip">▶ {fmtTime(c.requestedPunchIn)}</span>
                                        )}
                                        {c.requestedPunchOut && (
                                            <span className="time-chip">◼ {fmtTime(c.requestedPunchOut)}</span>
                                        )}
                                    </div>

                                    <p style={{ fontSize: ".78rem", color: "var(--text-3)" }}>
                                        {c.reason}
                                    </p>

                                    {c.status === "approved" && c.originalPunchIn !== undefined && (
                                        <p style={{ fontSize: ".75rem", color: "var(--success, #16a34a)", marginTop: ".35rem" }}>
                                            ✅ Corrected: {fmtTime(c.originalPunchIn)} → {fmtTime(c.requestedPunchIn || c.originalPunchIn)}
                                            {c.requestedPunchOut && ` · ${fmtTime(c.originalPunchOut)} → ${fmtTime(c.requestedPunchOut)}`}
                                        </p>
                                    )}

                                    {c.status === "rejected" && c.hrRemark && (
                                        <p className="corr-remark">HR: {c.hrRemark}</p>
                                    )}

                                    {c.status === "pending" && (
                                        <button
                                            onClick={() => handleWithdraw(c._id)}
                                            className="btn btn-sm"
                                            style={{ marginTop: ".5rem", color: "var(--text-3)", border: "1px solid var(--border)" }}
                                        >
                                            Withdraw
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default AttendanceCorrectionRequest;